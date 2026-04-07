'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  image_preview: string | null;
}

export default function NewMenuItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id');
  const isEditing = !!itemId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    image_preview: null,
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Mock categories
    const mockCategories: Category[] = [
      { id: '1', name: 'Entradas' },
      { id: '2', name: 'Platos Principales' },
      { id: '3', name: 'Postres' },
      { id: '4', name: 'Bebidas' },
      { id: '5', name: 'Promociones' },
      { id: '6', name: 'Opciones Vegetarianas' },
    ];
    setCategories(mockCategories);

    // Load existing item if editing
    if (isEditing) {
      // Mock existing item
      setFormData({
        name: 'Bife de Carne Angus',
        description: 'Corte premium de carne angus, servido con chimichurri casero',
        price: '32.99',
        category_id: '2',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        image_preview: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
      });
    } else {
      setFormData((prev) => ({ ...prev, category_id: mockCategories[0]?.id || '' }));
    }
    setLoading(false);
  }, [isEditing]);

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
          image_preview: reader.result as string,
          image_url: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitting(false);
    router.push('/dashboard/menu');
  };

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
        <div className="grid grid-cols-2 gap-4">
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

        {/* Image Upload */}
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
