import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Handles Supabase OAuth & email confirmation callbacks.
 *
 * Two flows:
 *  1. OAuth / PKCE  → ?code=...
 *  2. Email confirm → ?token_hash=...&type=signup  (or recovery, invite, etc.)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/dashboard'
  const error      = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // OAuth error (e.g. user denied access)
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  // ── Flow 1: email confirmation / magic-link (token_hash) ──
  if (token_hash && type) {
    const supabase = await createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash, type })

    if (verifyError) {
      console.error('OTP verify error:', verifyError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('El link de confirmación es inválido o ya expiró. Intentá registrarte de nuevo.')}`
      )
    }

    // Ensure profile row exists
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'admin',
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── Flow 2: OAuth / PKCE (code) ──
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Error al iniciar sesión. Intentá de nuevo.')}`
      )
    }

    // Ensure profile row exists
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'admin',
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // No valid params — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
