'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRestaurant } from '@/lib/context/restaurant-context';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_file: File | null;
  image_preview: string | null;
}

export default function NewMenuItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentRestaurant } = useRestaurant();
  const itemId = searchParams.get('id');
  const isEditing = !!itemId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_file: null,
    image_preview: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentRestaurant) {
      loadPageData();
    }
  }, [currentRestaurant, itemId]);

  const loadPageData = async () => {
    if (!currentRestaurant) return;

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load existing item if editing
      if (isEditing) {
        const { data: itemData, error: itemError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', itemId)
          .eq('restaurant_id', currentRestaurant.id)
          .single();

        if (itemError) throw itemError;

        if (itemData) {
          setFormData({
            name: itemData.name,
            description: itemData.description || '',
            price: itemData.price.toString(),
            category_id: itemData.category_id,
            image_file: null,
            image_preview: itemData.image_url,
          });
        }
      } else {
        // Set default category for new item
        setFormData((prev) => ({
          ...prev,
          category_id: categoriesData?.[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Error loading page data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image_file: file,
          image_preview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentRestaurant?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !formData.category_id) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Check free plan limit
      if (currentRestaurant.plan === 'free') {
        const { count, error: countError } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', currentRestaurant.id);

        if (countError) throw countError;

        if (!isEditing && (count || 0) >= 100) {
          setError('Has alcanzado el límite de 100 productos en tu plan gratuito. Sube a Pro para agregar más.');
          setSubmitting(false);
          return;
        }
      }

      let imageUrl: string | null = null;

      // Upload image if new file selected
      if (formData.image_file) {
        if (currentRestaurant.plan === 'free') {
          setError('Las imágenes están disponibles solo en el plan Pro. Sube a Pro para agregar fotos.');
          setSubmitting(false);
          return;
        }
        imageUrl = await uploadImage(formData.image_file);
      } else if (isEditing && formData.image_preview && !formData.image_preview.startsWith('data:')) {
        // Keep existing image URL if not changed
        imageUrl = formData.image_preview;
      }

      const itemData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        restaurant_id: currentRestaurant.id,
        image_url: imageUrl,
        is_available: true,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', itemId)
          .eq('restaurant_id', currentRestaurant.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert(itemData);

        if (insertError) throw insertError;
      }

      router.push('/dashboard/menu');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error al guardar plato');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando restaurante...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            {isEditing ? 'Editar Plato' : 'Agregar Nuevo Plato'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing
              ? 'Actualiza la información del plato'
              : 'Completa el formulario para agregar un nuevo plato al menú'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-8">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Nombre del Plato *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Bife de Carne Angus"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe el plato, ingredientes especiales, etc."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Price and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Precio *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                $
              </span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Categoría *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image Upload Section */}
        {currentRestaurant.plan === 'pro' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Imagen del Plato
            </label>

            {/* Image Preview */}
            {formData.image_preview && (
              <div className="mb-4 rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={formData.image_preview}
                  alt="Preview"
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* File Input */}
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  Haz clic para subir una imagen
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Máx. 5MB)</p>
              </div>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Sube a Pro para agregar fotos</strong> - Las imágenes de los platos están disponibles solo en el plan Pro. Mejora tu plan para acceder a esta función.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg font-semibold transition-all disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
