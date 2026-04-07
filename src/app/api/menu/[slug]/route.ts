import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MenuRouteParams {
  slug: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<MenuRouteParams> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // TODO: Fetch restaurant data from Supabase
    // const { data: restaurant, error: restaurantError } = await supabase
    //   .from('restaurants')
    //   .select('*')
    //   .eq('slug', slug)
    //   .single()

    // if (restaurantError || !restaurant) {
    //   return NextResponse.json(
    //     { error: 'Restaurante no encontrado' },
    //     { status: 404 }
    //   )
    // }

    // Mock restaurant data
    const restaurant = {
      id: 'rest-001',
      name: 'El Buen Comer',
      slug: 'el-buen-comer',
      description: 'Auténtica cocina tradicional con ingredientes frescos',
      logo_url: 'https://placehold.co/200x80/8B4513/ffffff?text=Logo',
      cover_url: 'https://placehold.co/1200x400/D2691E/ffffff?text=Portada+Restaurante',
      require_email: true,
    }

    // TODO: Fetch categories from Supabase
    // const { data: categories, error: categoriesError } = await supabase
    //   .from('menu_categories')
    //   .select('*')
    //   .eq('restaurant_id', restaurant.id)
    //   .eq('is_active', true)
    //   .order('sort_order', { ascending: true })

    // Mock categories
    const categories = [
      { id: 'cat-001', name: 'Entrantes', sort_order: 1 },
      { id: 'cat-002', name: 'Platos Principales', sort_order: 2 },
      { id: 'cat-003', name: 'Postres', sort_order: 3 },
    ]

    // TODO: Fetch menu items from Supabase
    // const { data: items, error: itemsError } = await supabase
    //   .from('menu_items')
    //   .select('*')
    //   .eq('restaurant_id', restaurant.id)
    //   .eq('is_available', true)
    //   .order('sort_order', { ascending: true })

    // Mock items
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
    ]

    // TODO: Track visit analytics
    // await supabase.from('analytics_events').insert({
    //   restaurant_id: restaurant.id,
    //   event_type: 'visit',
    //   metadata: {
    //     timestamp: new Date().toISOString(),
    //   },
    // })

    return NextResponse.json({
      restaurant,
      categories,
      items,
    })
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'Error al cargar el menú' },
      { status: 500 }
    )
  }
}
