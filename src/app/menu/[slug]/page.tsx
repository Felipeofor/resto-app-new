import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmailGate } from './components/EmailGate'
import { MenuContent } from './components/MenuContent'

interface MenuPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MenuPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // TODO: Fetch restaurant data from Supabase
  // const { data: restaurant } = await supabase
  //   .from('restaurants')
  //   .select('name, description')
  //   .eq('slug', slug)
  //   .single()

  // Mock data for now
  const restaurant = {
    name: 'El Buen Comer',
    description: 'Auténtica cocina tradicional',
  }

  if (!restaurant) {
    notFound()
  }

  return {
    title: `${restaurant.name} - Menú Digital`,
    description: restaurant.description,
  }
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // TODO: Fetch restaurant data from Supabase
  // const { data: restaurant } = await supabase
  //   .from('restaurants')
  //   .select('*')
  //   .eq('slug', slug)
  //   .single()

  // Mock restaurant data
  const restaurant = {
    id: 'rest-001',
    name: 'El Buen Comer',
    slug: 'el-buen-comer',
    description: 'Auténtica cocina tradicional con ingredientes frescos',
    logo_url: 'https://placehold.co/200x80/8B4513/ffffff?text=Logo',
    cover_url: 'https://placehold.co/1200x400/D2691E/ffffff?text=Portada+Restaurante',
    require_email: true,
    welcome_message: 'Bienvenido a nuestro menú digital',
  }

  // TODO: Fetch categories and items from Supabase
  // const { data: categories } = await supabase
  //   .from('menu_categories')
  //   .select('*')
  //   .eq('restaurant_id', restaurant.id)
  //   .eq('is_active', true)
  //   .order('sort_order', { ascending: true })

  // const { data: items } = await supabase
  //   .from('menu_items')
  //   .select('*')
  //   .eq('restaurant_id', restaurant.id)
  //   .eq('is_available', true)
  //   .order('sort_order', { ascending: true })

  // Mock categories and items
  const categories = [
    { id: 'cat-001', name: 'Entrantes', sort_order: 1 },
    { id: 'cat-002', name: 'Platos Principales', sort_order: 2 },
    { id: 'cat-003', name: 'Postres', sort_order: 3 },
  ]

  const items = [
    {
      id: 'item-001',
      category_id: 'cat-001',
      name: 'Tabla de Quesos y Jamones',
      description: 'Selección de quesos ibéricos y jamón serrano de la mejor calidad',
      price: 18.5,
      image_url: 'https://placehold.co/400x300/8B7355/ffffff?text=Tabla+de+Quesos',
    },
    {
      id: 'item-002',
      category_id: 'cat-001',
      name: 'Croquetas de Jamón',
      description: 'Croquetas caseras rellenas de jamón serrano, crujientes por fuera',
      price: 10.5,
      image_url: 'https://placehold.co/400x300/CD853F/ffffff?text=Croquetas',
    },
    {
      id: 'item-003',
      category_id: 'cat-002',
      name: 'Paella a la Valenciana',
      description: 'Arroz de la tierra con pollo, conejo y judías verdes',
      price: 16.0,
      image_url: 'https://placehold.co/400x300/DAA520/ffffff?text=Paella',
    },
    {
      id: 'item-004',
      category_id: 'cat-002',
      name: 'Filete de Ternera a la Pimienta',
      description: 'Ternera de primera calidad con salsa de pimienta casera',
      price: 22.0,
      image_url: 'https://placehold.co/400x300/A0522D/ffffff?text=Filete',
    },
    {
      id: 'item-005',
      category_id: 'cat-003',
      name: 'Flan Casero',
      description: 'Postre tradicional con caramelo crujiente',
      price: 5.5,
      image_url: 'https://placehold.co/400x300/FFD700/ffffff?text=Flan',
    },
    {
      id: 'item-006',
      category_id: 'cat-003',
      name: 'Tiramisú',
      description: 'Clásico italiano con capas de mascarpone y café',
      price: 6.5,
      image_url: 'https://placehold.co/400x300/8B4513/ffffff?text=Tiramisu',
    },
  ]

  if (!restaurant) {
    notFound()
  }

  // TODO: Track visit analytics
  // await supabase.from('analytics_events').insert({
  //   restaurant_id: restaurant.id,
  //   event_type: 'visit',
  // })

  return (
    <div className="min-h-screen bg-amber-50">
      {restaurant.require_email ? (
        <EmailGate restaurant={restaurant} />
      ) : (
        <MenuContent
          restaurant={restaurant}
          categories={categories}
          items={items}
        />
      )}
    </div>
  )
}
