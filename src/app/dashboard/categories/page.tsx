'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock categories
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Entradas',
        description: 'Pequeños platos para comenzar',
        sort_order: 1,
      },
      {
        id: '2',
        name: 'Platos Principales',
        description: 'Nuestros platos estrella',
        sort_order: 2,
      },
      {
        id: '3',
        name: 'Postres',
        description: 'Dulces para terminar',
        sort_order: 3,
      },
      {
        id: '4',
        name: 'Bebidas',
        description: 'Selección de bebidas',
        sort_order: 4,
      },
      {
        id: '5',
        name: 'Promociones',
        description: 'Ofertas especiales del día',
        sort_order: 5,
      },
      {
        id: '6',
        name: 'Opciones Vegetarianas',
        description: 'Platos sin carne',
        sort_order: 6,
      },
    ];
    setCategories(mockCategories);
    setLoading(false);
  }, []);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      description: null,
      sort_order: categories.length + 1,
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName('');
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, name: editName } : cat
      )
    );
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    setDeleteConfirm(null);
  };

  const handleDragStart = (
    e: React.DragEvent,
    index: number
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (sourceIndex === targetIndex) return;

    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(sourceIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    setCategories(newCategories.map((cat, idx) => ({
      ...cat,
      sort_order: idx + 1,
    })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Categorías</h1>
        <p className="text-gray-600 mt-2">
          Organiza tu menú en categorías para una mejor experiencia del usuario
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
        <p className="text-gray-600 text-sm font-medium">Total de Categorías</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
      </div>

      {/* Add New Category Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Agregar Nueva Categoría</h2>
        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar</span>
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay categorías aún</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="p-4 hover:bg-gray-50 transition-colors cursor-move"
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Sort Order */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {editingId === category.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    {editingId === category.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditName('');
                          }}
                          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(category.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === category.id && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 ml-10">
                    <p className="text-sm text-red-700 font-medium mb-3">
                      ¿Eliminar esta categoría? Los platos se mantendrán pero perderán
                      esta categoría.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Arrastra las categorías para reordenarlas. Este orden
          se mostrará en el menú de tus clientes.
        </p>
      </div>
    </div>
  );
}
