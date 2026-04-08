import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Find the demo restaurant by slug
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'don-carlos')
      .single();

    if (restError || !restaurant) {
      return NextResponse.json(
        { error: 'Demo restaurant not found' },
        { status: 404 }
      );
    }

    const restaurantId = restaurant.id;

    // Fetch all data in parallel
    const [
      categoriesResult,
      itemsResult,
      emailsResult,
      eventsResult,
      ordersResult,
    ] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('id, name, description, sort_order')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('menu_items')
        .select('id, name, price, category_id, image_url, is_available, sort_order, description')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('customer_emails')
        .select('id, email, name, registered_via, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false }),
      supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('restaurant_id', restaurantId)
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      restaurant,
      categories: categoriesResult.data || [],
      items: itemsResult.data || [],
      emails: emailsResult.data || [],
      events: eventsResult.data || [],
      orders: ordersResult.data || [],
    });
  } catch (error) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
