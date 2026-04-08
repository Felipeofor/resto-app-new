'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Loader, CheckCircle, AlertCircle, X, Save, FileText, Globe, ImageIcon } from 'lucide-react'
import { useDropZone } from '@/lib/hooks/useDropZone'
import { useRestaurant } from '@/lib/context/restaurant-context'
import { createClient } from '@/lib/supabase/client'

interface ParsedItem {
  category: string
  name: string
  description: string | null
  price: number
  isEditing?: boolean
}

interface ParsedResponse {
  items: ParsedItem[]
  aiProvider: string
  itemsCount: number
}

type InputMode = 'images' | 'pdf' | 'url'

export default function AICapturePageClient() {
  const { currentRestaurant } = useRestaurant()
  const supabase = createClient()

  // Shared state
  const [inputMode, setInputMode] = useState<InputMode>('images')
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [usage, setUsage] = useState({ processed: 0, limit: 30 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Images state
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // URL state
  const [menuUrl, setMenuUrl] = useState('')

  // Load usage tracking data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchUsage = useCallback(async () => {
    if (!currentRestaurant) return;
    const { data } = await supabase
      .from('ai_usage')
      .select('photos_processed')
      .eq('restaurant_id', currentRestaurant.id)
      .eq('month', new Date().toISOString().slice(0, 7) + '-01')
      .maybeSingle()

    setUsage({
      processed: data?.photos_processed || 0,
      limit: 30,
    })
  }, [currentRestaurant, supabase])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const { isDragActive, getRootProps } = useDropZone({
    onDrop: handleDrop,
  })

  function switchMode(mode: InputMode) {
    setInputMode(mode)
    setError('')
    setSuccess('')
    // Clear all inputs when switching
    setImages([])
    setPreviews([])
    setPdfFile(null)
    setMenuUrl('')
  }

  function handleDrop(droppedFiles: File[]) {
    if (inputMode === 'pdf') {
      const pdf = droppedFiles.find((f) => f.type === 'application/pdf')
      if (!pdf) {
        setError('Por favor, arrastra un archivo PDF')
        return
      }
      if (pdf.size > 4 * 1024 * 1024) {
        setError('El PDF no puede superar los 4MB')
        return
      }
      setError('')
      setPdfFile(pdf)
      return
    }

    // Images mode
    const imageFiles = droppedFiles.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError('Por favor, carga archivos de imagen validos')
      return
    }
    if (images.length + imageFiles.length > 10) {
      setError('Maximo 10 imagenes por solicitud')
      return
    }
    setError('')
    addImages(imageFiles)
  }

  function addImages(files: File[]) {
    setImages((prev) => [...prev, ...files])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleProcess() {
    if (!currentRestaurant) {
      setError('Restaurante no seleccionado')
      return
    }

    // Validate per mode
    if (inputMode === 'images' && images.length === 0) {
      setError('Por favor, carga al menos una imagen')
      return
    }
    if (inputMode === 'pdf' && !pdfFile) {
      setError('Por favor, carga un archivo PDF')
      return
    }
    if (inputMode === 'url' && !menuUrl.trim()) {
      setError('Por favor, ingresa una URL')
      return
    }
    if (inputMode === 'url' && !/^https?:\/\/.+/.test(menuUrl.trim())) {
      setError('La URL debe comenzar con http:// o https://')
      return
    }

    const cost = inputMode === 'images' ? images.length : 1
    if (usage.processed + cost > usage.limit) {
      setError(`Has alcanzado tu limite de ${usage.limit} procesamientos este mes`)
      return
    }

    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const restaurantId = currentRestaurant.id
      let body: any = { restaurantId }

      if (inputMode === 'images') {
        body.images = await Promise.all(images.map(fileToBase64))
      } else if (inputMode === 'pdf') {
        body.pdfBase64 = await fileToBase64(pdfFile!)
      } else {
        body.menuUrl = menuUrl.trim()
      }

      const response = await fetch('/api/ai/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error procesando menu')
      }

      const result: ParsedResponse = await response.json()
      setParsedItems(result.items)
      setUsage((prev) => ({ ...prev, processed: prev.processed + cost }))
      setSuccess(`Se extrajeron ${result.itemsCount} platos usando ${result.aiProvider}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando menu')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  function updateParsedItem(index: number, updates: Partial<ParsedItem>) {
    setParsedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }

  async function saveAllItems() {
    if (parsedItems.length === 0) {
      setError('No hay platos para guardar')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (!currentRestaurant) throw new Error('Restaurante no seleccionado')
      const restaurantId = currentRestaurant.id

      const { data: existingCats } = await supabase
        .from('menu_categories')
        .select('id, name, sort_order')
        .eq('restaurant_id', restaurantId)

      let maxOrder = existingCats?.length
        ? Math.max(...existingCats.map((c) => c.sort_order || 0))
        : 0

      for (const item of parsedItems) {
        let categoryId = existingCats?.find(
          (c) => c.name.toLowerCase() === item.category.toLowerCase()
        )?.id

        if (!categoryId) {
          maxOrder++
          const { data: newCategory, error: catError } = await supabase
            .from('menu_categories')
            .insert({
              restaurant_id: restaurantId,
              name: item.category,
              sort_order: maxOrder,
              is_active: true,
            })
            .select('id')
            .single()

          if (catError) throw catError
          categoryId = newCategory?.id

          if (newCategory) {
            existingCats?.push({ id: newCategory.id, name: item.category, sort_order: maxOrder })
          }
        }

        const { error: itemError } = await supabase.from('menu_items').insert({
          restaurant_id: restaurantId,
          category_id: categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          is_available: true,
          sort_order: 0,
        })
        if (itemError) throw itemError
      }

      setSuccess(`Se guardaron ${parsedItems.length} platos exitosamente`)
      setParsedItems([])
      setImages([])
      setPreviews([])
      setPdfFile(null)
      setMenuUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando platos')
    } finally {
      setIsSaving(false)
    }
  }

  function resetAll() {
    setImages([])
    setPreviews([])
    setPdfFile(null)
    setMenuUrl('')
    setParsedItems([])
    setSuccess('')
  }

  const hasInput =
    (inputMode === 'images' && images.length > 0) ||
    (inputMode === 'pdf' && pdfFile) ||
    (inputMode === 'url' && menuUrl.trim())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Captura de Menu con IA</h1>
        <p className="text-gray-600 mt-2">
          Carga fotos, un PDF o pega una URL de tu menu y deja que la IA extraiga los platos
        </p>
      </div>

      {/* Usage Info */}
      {usage.limit - usage.processed <= 5 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900 font-medium">
            Te quedan{' '}
            <span className="font-bold">{Math.max(0, usage.limit - usage.processed)}</span>{' '}
            procesamientos este mes ({usage.processed}/{usage.limit}).
          </p>
          <div className="mt-2 bg-amber-200 rounded-full h-2 w-full overflow-hidden">
            <div
              className={`h-full transition-all ${usage.processed >= usage.limit ? 'bg-red-600' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (usage.processed / usage.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Input Area (hidden when we have parsed items) */}
      {parsedItems.length === 0 && (
        <div className="space-y-4">
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 gap-1">
            {([
              { mode: 'images' as InputMode, label: 'Imagenes', icon: ImageIcon },
              { mode: 'pdf' as InputMode, label: 'PDF', icon: FileText },
              { mode: 'url' as InputMode, label: 'URL', icon: Globe },
            ]).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                  inputMode === mode
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Images Mode */}
          {inputMode === 'images' && (
            <>
              <div
                {...getRootProps()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                }`}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Arrastra las fotos aqui</h3>
                <p className="text-gray-600 mb-4">o haz clic para seleccionar archivos</p>
                <p className="text-xs text-gray-500">JPG, PNG, WebP (maximo 10 fotos)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => addImages(Array.from(e.target.files || []))}
                  className="hidden"
                />
              </div>

              {/* Image Previews */}
              {previews.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Imagenes cargadas ({previews.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* PDF Mode */}
          {inputMode === 'pdf' && (
            <>
              {!pdfFile ? (
                <div
                  {...getRootProps()}
                  onClick={() => pdfInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                  }`}
                >
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Arrastra tu PDF aqui</h3>
                  <p className="text-gray-600 mb-4">o haz clic para seleccionar el archivo</p>
                  <p className="text-xs text-gray-500">Archivo PDF (maximo 4MB)</p>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 4 * 1024 * 1024) {
                          setError('El PDF no puede superar los 4MB')
                          return
                        }
                        setError('')
                        setPdfFile(file)
                      }
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="font-medium text-gray-900">{pdfFile.name}</p>
                      <p className="text-xs text-gray-500">{(pdfFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPdfFile(null)}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* URL Mode */}
          {inputMode === 'url' && (
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-8 h-8 text-orange-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">URL del menu</h3>
                    <p className="text-xs text-gray-500">Pega el link de la pagina web donde esta tu menu</p>
                  </div>
                </div>
                <input
                  type="url"
                  value={menuUrl}
                  onChange={(e) => { setMenuUrl(e.target.value); setError('') }}
                  placeholder="https://ejemplo.com/menu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400">
                  Funciona mejor con paginas web estaticas. Si el menu se carga con JavaScript, te recomendamos subir una imagen o PDF.
                </p>
              </div>
            </div>
          )}

          {/* Process Button */}
          {hasInput && (
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Procesando con IA...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Procesar con IA</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Parsed Items */}
      {parsedItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Platos extraidos ({parsedItems.length})
            </h3>
            <button onClick={resetAll} className="text-sm text-gray-600 hover:text-gray-900">
              Cargar mas
            </button>
          </div>

          <div className="space-y-4">
            {parsedItems.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) => updateParsedItem(index, { category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del plato</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateParsedItem(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descripcion</label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => updateParsedItem(index, { description: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateParsedItem(index, { price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={() => setParsedItems((prev) => prev.filter((_, i) => i !== index))}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={saveAllItems}
            disabled={isSaving}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar todos los platos</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
