import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@restoqr.app',
          to: email,
          subject: `Bienvenido a ${restaurantName}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .header h1 { color: #6d28d9; margin: 0; }
                  .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                  .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Bienvenido</h1>
                  </div>
                  <div class="content">
                    <p>Hola${name ? ` ${name}` : ''},</p>
                    <p>Gracias por registrarte en el menú digital de <strong>${restaurantName}</strong>.</p>
                    <p>Estamos emocionados de compartir nuestros platos especiales contigo. Pronto recibirás noticias sobre promociones y nuevos platos.</p>
                    <p>Si tienes preguntas, no dudes en contactarnos.</p>
                    <p><strong>¡Esperamos verte pronto!</strong></p>
                  </div>
                  <div class="footer">
                    <p>Este es un email automático. Por favor no respondas a esta dirección.</p>
                    <p>&copy; 2026 ${restaurantName}. Todos los derechos reservados.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
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
