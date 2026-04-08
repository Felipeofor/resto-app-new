import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paymentPendingTemplate } from '@/lib/email/templates'

export async function POST(req: NextRequest) {
  try {
    const { restaurantName, ownerName, ownerEmail, amount, planType } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get super admin emails
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'super_admin')

    if (!admins || admins.length === 0) return NextResponse.json({ ok: true })

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const html = paymentPendingTemplate({ restaurantName, ownerName, ownerEmail, amount, planType })

    await Promise.all(
      admins.map(admin =>
        resend.emails.send({
          from: `RestoQR <${from}>`,
          to: admin.email,
          subject: `Nuevo pago pendiente: ${restaurantName} - $${amount.toLocaleString('es-AR')}`,
          html,
        }).catch(console.error)
      )
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Notify payment error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
