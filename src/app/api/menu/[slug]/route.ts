import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MenuRouteParams {
  slug: string
}

interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
}

interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  sort_order: number
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  cover_url?: string
  require_email: boolean
  is_active: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<MenuRouteParams> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch restaurant by slug (must be active)
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      )
    }

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      throw categoriesError
    }

    // Fetch menu items
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
      throw itemsError
    }

    // Track visit analytics
    await supabase.from('analytics_events').insert({
      restaurant_id: restaurant.id,
      event_type: 'visit',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      restaurant,
      categories: categories || [],
      items: items || [],
    })
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'Error al cargar el menú' },
      { status: 500 }
    )
  }
}
