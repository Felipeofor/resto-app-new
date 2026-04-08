import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { welcomeEmailTemplate } from '@/lib/email/templates'

interface RegisterEmailRequest {
  restaurantId: string
  email: string
  registeredVia: 'manual' | 'google'
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterEmailRequest = await request.json()
    const { restaurantId, email, registeredVia, name } = body

    // Validate input
    if (!restaurantId || !email) {
      return NextResponse.json(
        { error: 'restaurantId y email son requeridos' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Check if email already exists for this restaurant
    const { data: existingEmail } = await supabase
      .from('customer_emails')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('email', email.toLowerCase())
      .single()

    // Only insert if email doesn't already exist
    if (!existingEmail) {
      const { error: insertError } = await supabase
        .from('customer_emails')
        .insert({
          restaurant_id: restaurantId,
          email: email.toLowerCase(),
          name: name || null,
          registered_via: registeredVia,
        })

      if (insertError) {
        console.error('Error inserting customer email:', insertError)
        throw insertError
      }
    }

    // Track email registration analytics
    const { error: analyticsError } = await supabase.from('analytics_events').insert({
      restaurant_id: restaurantId,
      event_type: 'email_register',
      metadata: {
        email: email.toLowerCase(),
        registered_via: registeredVia,
        timestamp: new Date().toISOString(),
      },
    })

    if (analyticsError) {
      console.error('Error tracking analytics:', analyticsError)
      // Don't throw - analytics failure shouldn't block registration
    }

    // Send welcome email via Resend if API key is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Get restaurant name for email
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('id', restaurantId)
          .single()

        const restaurantName = restaurant?.name || 'Nuestro restaurante'

        // Get restaurant slug for the menu URL
        const { data: restaurantFull } = await supabase
          .from('restaurants')
          .select('slug')
          .eq('id', restaurantId)
          .single()

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: `¡Bienvenido a ${restaurantName}! 🍽️`,
          html: welcomeEmailTemplate({
            customerName: name,
            restaurantName,
            restaurantSlug: restaurantFull?.slug ?? restaurantName.toLowerCase().replace(/\s+/g, '-'),
          }),
        })
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't throw - email failure shouldn't block registration
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email registrado exitosamente',
    })
  } catch (error) {
    console.error('Register email error:', error)
    return NextResponse.json(
      { error: 'Error al registrar el email' },
      { status: 500 }
    )
  }
}
