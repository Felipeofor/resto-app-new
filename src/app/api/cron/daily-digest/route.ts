import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { superAdminDailyDigestTemplate } from '@/lib/email/templates'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Yesterday's date range
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString()
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1).toISOString()
    const dateLabel = yesterday.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

    // Fetch all stats in parallel
    const [
      newRestaurantsRes,
      newDishesRes,
      qrScansRes,
      menuVisitsRes,
      newEmailsRes,
      pendingPaymentsRes,
      topRestaurantsRes,
      adminsRes,
    ] = await Promise.all([
      // New restaurants
      supabase.from('restaurants').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay).lt('created_at', endOfDay),
      // New dishes
      supabase.from('menu_items').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay).lt('created_at', endOfDay),
      // QR scans
      supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('event_type', 'qr_scan')
        .gte('created_at', startOfDay).lt('created_at', endOfDay),
      // Menu visits
      supabase.from('analytics_events').select('id', { count: 'exact', head: true })
        .eq('event_type', 'visit')
        .gte('created_at', startOfDay).lt('created_at', endOfDay),
      // New emails
      supabase.from('customer_emails').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay).lt('created_at', endOfDay),
      // Pending payments
      supabase.from('subscription_payments').select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Top 5 restaurants by visits yesterday
      supabase.from('analytics_events')
        .select('restaurant_id, restaurants:restaurant_id(name)')
        .eq('event_type', 'visit')
        .gte('created_at', startOfDay).lt('created_at', endOfDay) as any,
      // Super admin emails
      supabase.from('profiles').select('email').eq('role', 'super_admin'),
    ])

    // Calculate top 5
    const visitCounts = new Map<string, { name: string; visits: number }>()
    ;(topRestaurantsRes.data || []).forEach((e: any) => {
      const id = e.restaurant_id
      const name = e.restaurants?.name || 'Desconocido'
      const existing = visitCounts.get(id)
      if (existing) existing.visits++
      else visitCounts.set(id, { name, visits: 1 })
    })
    const topRestaurants = Array.from(visitCounts.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5)

    const admins = adminsRes.data || []
    if (admins.length === 0) return NextResponse.json({ ok: true, message: 'No admins found' })

    const html = superAdminDailyDigestTemplate({
      date: dateLabel,
      newRestaurants: newRestaurantsRes.count || 0,
      newDishes: newDishesRes.count || 0,
      qrScans: qrScansRes.count || 0,
      menuVisits: menuVisitsRes.count || 0,
      newEmails: newEmailsRes.count || 0,
      pendingPayments: pendingPaymentsRes.count || 0,
      topRestaurants,
    })

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    await Promise.all(
      admins.map(admin =>
        resend.emails.send({
          from: `RestoQR <${from}>`,
          to: admin.email,
          subject: `RestoQR - Resumen diario ${dateLabel}`,
          html,
        }).catch(console.error)
      )
    )

    return NextResponse.json({ ok: true, sent: admins.length })
  } catch (err) {
    console.error('Daily digest error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
