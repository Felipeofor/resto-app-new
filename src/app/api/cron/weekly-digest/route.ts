import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { restaurantWeeklyDigestTemplate } from '@/lib/email/templates'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Last 7 days range
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startDate = weekAgo.toISOString()

    // Get all active restaurants with their owners
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name, slug, plan, owner_id, profiles:owner_id(email)')
      .eq('is_active', true) as any

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ ok: true, message: 'No restaurants' })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    let sent = 0

    for (const restaurant of restaurants) {
      const ownerEmail = restaurant.profiles?.email
      if (!ownerEmail) continue

      const isPro = restaurant.plan === 'pro'

      // Fetch stats for this restaurant
      const [qrRes, visitRes, emailRes, ordersRes] = await Promise.all([
        supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id).eq('event_type', 'qr_scan')
          .gte('created_at', startDate),
        supabase.from('analytics_events').select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id).eq('event_type', 'visit')
          .gte('created_at', startDate),
        supabase.from('customer_emails').select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .gte('created_at', startDate),
        isPro
          ? supabase.from('orders').select('id, total')
              .eq('restaurant_id', restaurant.id)
              .gte('created_at', startDate)
          : Promise.resolve({ data: null }),
      ])

      const orders: any[] = ordersRes.data || []
      const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0)

      // Top dishes (Pro only)
      let topDishes: { name: string; orders: number }[] = []
      if (isPro && orders.length > 0) {
        const orderIds = orders.map((o: any) => o.id)
        const { data: items } = await supabase
          .from('order_items')
          .select('name, quantity')
          .in('order_id', orderIds)

        if (items) {
          const dishMap = new Map<string, number>()
          items.forEach((item: any) => {
            dishMap.set(item.name, (dishMap.get(item.name) || 0) + item.quantity)
          })
          topDishes = Array.from(dishMap.entries())
            .map(([name, orders]) => ({ name, orders }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5)
        }
      }

      const html = restaurantWeeklyDigestTemplate({
        restaurantName: restaurant.name,
        isPro,
        qrScans: qrRes.count || 0,
        menuVisits: visitRes.count || 0,
        newEmails: emailRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        topDishes,
      })

      try {
        await resend.emails.send({
          from: `RestoQR <${from}>`,
          to: ownerEmail,
          subject: `${restaurant.name} - Resumen semanal`,
          html,
        })
        sent++
      } catch (e) {
        console.error(`Failed to send to ${ownerEmail}:`, e)
      }
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('Weekly digest error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
