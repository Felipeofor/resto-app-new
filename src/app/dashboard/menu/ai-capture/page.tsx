'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Loader, CheckCircle, AlertCircle, X, Edit2, Save } from 'lucide-react'
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

export default function AICapturePageClient() {
  const { currentRestaurant } = useRestaurant()
  const supabase = createClient()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [usage, setUsage] = useState({ processed: 0, limit: 30 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function handleDrop(droppedFiles: File[]) {
    const imageFiles = droppedFiles.filter((file) =>
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      setError('Por favor, carga archivos de imagen válidos')
      return
    }

    if (images.length + imageFiles.length > 10) {
      setError('Máximo 10 imágenes por solicitud')
      return
    }

    setError('')
    addImages(imageFiles)
  }

  function addImages(files: File[]) {
    setImages((prev) => [...prev, ...files])

    // Create previews
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

  async function handleProcessImages() {
    if (images.length === 0) {
      setError('Por favor, carga al menos una imagen')
      return
    }

    // Check usage
    if (usage.processed + images.length > usage.limit) {
      setError(
        `Has alcanzado tu límite de ${usage.limit} fotos procesadas este mes`
      )
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Convert images to base64
      const base64Images = await Promise.all(
        images.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () =>
                resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
        )
      )

      if (!currentRestaurant) throw new Error('Restaurante no seleccionado')
      const restaurantId = currentRestaurant.id

      const response = await fetch('/api/ai/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          images: base64Images,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error procesando imágenes')
      }

      const result: ParsedResponse = await response.json()
      setParsedItems(result.items)
      setUsage((prev) => ({
        ...prev,
        processed: prev.processed + images.length,
      }))
      setSuccess(
        `Se extrajeron ${result.itemsCount} platos usando ${result.aiProvider}`
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error procesando imágenes'
      )
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  function updateParsedItem(index: number, updates: Partial<ParsedItem>) {
    setParsedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
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

      // Sort existing categories to get max sort_order
      const { data: existingCats } = await supabase
        .from('menu_categories')
        .select('id, name, sort_order')
        .eq('restaurant_id', restaurantId)

      let maxOrder = existingCats?.length
        ? Math.max(...existingCats.map(c => c.sort_order || 0))
        : 0

      for (const item of parsedItems) {
        // First, ensure category exists
        let categoryId = existingCats?.find(c => c.name.toLowerCase() === item.category.toLowerCase())?.id

        if (!categoryId) {
          maxOrder++
          const { data: newCategory, error: catError } = await supabase
            .from('menu_categories')
            .insert({
              restaurant_id: restaurantId,
              name: item.category,
              sort_order: maxOrder,
              is_active: true
            })
            .select('id')
            .single()
            
          if (catError) throw catError
          categoryId = newCategory?.id
          
          // update local cache so next item with same category finds it
          if (newCategory) {
            existingCats?.push({ id: newCategory.id, name: item.category, sort_order: maxOrder })
          }
        }

        // Then insert the menu item
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error guardando platos'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Captura de Menú con IA
        </h1>
        <p className="text-gray-600 mt-2">
          Carga fotos de tu menú y deja que la IA extraiga los platos automáticamente
        </p>
      </div>

      {/* Usage Info */}
      {usage.limit - usage.processed <= 5 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900 font-medium">
            ¡Atención! Te quedan{' '}
            <span className="font-bold">
              {Math.max(0, usage.limit - usage.processed)}
            </span>{' '}
            fotos disponibles este mes ({usage.processed}/{usage.limit}).
          </p>
          <div className="mt-2 bg-amber-200 rounded-full h-2 w-full overflow-hidden">
            <div
              className={`h-full transition-all ${usage.processed >= usage.limit ? 'bg-red-600' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (usage.processed / usage.limit) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Drop Zone */}
      {parsedItems.length === 0 && (
        <div
          {...getRootProps()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Arrastra las fotos aquí
          </h3>
          <p className="text-gray-600 mb-4">
            o haz clic para seleccionar archivos
          </p>
          <p className="text-xs text-gray-500">
            Soporta JPG, PNG y otras imágenes (máximo 10 fotos)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) =>
              addImages(Array.from(e.target.files || []))
            }
            className="hidden"
          />
        </div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Imágenes cargadas ({previews.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Process Button */}
          <button
            onClick={handleProcessImages}
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
        </div>
      )}

      {/* Parsed Items */}
      {parsedItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Platos extraídos ({parsedItems.length})
            </h3>
            <button
              onClick={() => {
                setImages([])
                setPreviews([])
                setParsedItems([])
                setSuccess('')
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cargar más fotos
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {parsedItems.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
              >
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) =>
                      updateParsedItem(index, {
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre del plato
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateParsedItem(index, {
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) =>
                      updateParsedItem(index, {
                        description: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) =>
                      updateParsedItem(index, {
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Delete Button */}
                <button
                  onClick={() =>
                    setParsedItems((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          {/* Save All Button */}
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
