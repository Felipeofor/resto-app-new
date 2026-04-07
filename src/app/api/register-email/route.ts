import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

    // TODO: Register customer email in Supabase
    // const { data: existingEmail } = await supabase
    //   .from('customer_emails')
    //   .select('id')
    //   .eq('restaurant_id', restaurantId)
    //   .eq('email', email)
    //   .single()

    // if (!existingEmail) {
    //   const { error: insertError } = await supabase
    //     .from('customer_emails')
    //     .insert({
    //       restaurant_id: restaurantId,
    //       email,
    //       name: name || null,
    //       registered_via: registeredVia,
    //     })

    //   if (insertError) {
    //     throw insertError
    //   }
    // }

    // TODO: Track email registration analytics
    // await supabase.from('analytics_events').insert({
    //   restaurant_id: restaurantId,
    //   event_type: 'email_register',
    //   metadata: {
    //     email,
    //     registered_via: registeredVia,
    //     timestamp: new Date().toISOString(),
    //   },
    // })

    // TODO: Send welcome email via Resend
    // const { Resend } = await import('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)

    // await resend.emails.send({
    //   from: 'noreply@resto-build.com',
    //   to: email,
    //   subject: 'Bienvenido a nuestro menú digital',
    //   html: `
    //     <h2>Bienvenido</h2>
    //     <p>Gracias por registrarte en nuestro menú digital.</p>
    //     <p>Estamos emocionados de compartir nuestros platos especiales contigo.</p>
    //   `,
    // })

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
