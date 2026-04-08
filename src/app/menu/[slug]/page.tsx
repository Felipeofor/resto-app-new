import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MenuPageClient } from './components/MenuPageClient'

interface MenuPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MenuPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!restaurant) {
    return { title: 'Menú no encontrado' }
  }

  return {
    title: `${restaurant.name} - Menú Digital`,
    description: restaurant.description,
  }
}

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!restaurant) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  // Track visit analytics (fire and forget)
  supabase.from('analytics_events').insert({
    restaurant_id: restaurant.id,
    event_type: 'visit' as const,
  }).then(() => {})

  return (
    <MenuPageClient
      restaurant={restaurant}
      categories={categories || []}
      items={items || []}
    />
  )
}
