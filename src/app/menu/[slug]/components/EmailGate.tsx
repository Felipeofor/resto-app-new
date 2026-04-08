'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Tag, Gift, Star, Crown, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── Types ──────────────────────────────────────────────── */
export type IncentiveType = 'discount' | 'free_item' | 'exclusive' | 'loyalty' | 'none'

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  welcome_message: string | null
  primary_color?: string | null
  incentive_type?: IncentiveType | null
  incentive_title?: string | null
  incentive_description?: string | null
  incentive_code?: string | null
}

interface EmailGateProps {
  restaurant: Restaurant
  onEmailSubmit?: (email: string) => void
  onSkip?: () => void
}

/* ── Google icon ────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ── Incentive config ───────────────────────────────────── */
const INCENTIVE_DEFAULTS: Record<
  IncentiveType,
  { icon: React.ElementType; emoji: string; badgeColor: string; textColor: string; bg: string }
> = {
  discount: {
    icon: Tag,
    emoji: '🏷️',
    badgeColor: 'bg-orange-500',
    textColor: 'text-orange-700',
    bg: 'from-orange-50 to-amber-50',
  },
  free_item: {
    icon: Gift,
    emoji: '🎁',
    badgeColor: 'bg-pink-500',
    textColor: 'text-pink-700',
    bg: 'from-pink-50 to-rose-50',
  },
  exclusive: {
    icon: Crown,
    emoji: '👑',
    badgeColor: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bg: 'from-yellow-50 to-amber-50',
  },
  loyalty: {
    icon: Star,
    emoji: '⭐',
    badgeColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    bg: 'from-blue-50 to-indigo-50',
  },
  none: {
    icon: Sparkles,
    emoji: '✨',
    badgeColor: 'bg-gray-500',
    textColor: 'text-gray-700',
    bg: 'from-gray-50 to-slate-50',
  },
}

/* ── API helper ─────────────────────────────────────────── */
async function registerEmailOnServer(
  restaurantId: string,
  email: string,
  name: string | null,
  via: 'manual' | 'google'
) {
  const res = await fetch('/api/register-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId, email, name, registeredVia: via }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    if (data.error?.toLowerCase().includes('duplicate') || res.status === 409) return
    throw new Error('Error al registrar correo')
  }
}

/* ═══════════════════════════════════════════════════════════
   EmailGate
══════════════════════════════════════════════════════════ */
export function EmailGate({ restaurant, onEmailSubmit, onSkip }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [codeRevealed, setCodeRevealed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`resto-email-${restaurant.id}`)
    if (stored) setIsSubmitted(true)
  }, [restaurant.id])

  const captureEmail = useCallback(
    async (emailVal: string, name: string | null, via: 'manual' | 'google') => {
      await registerEmailOnServer(restaurant.id, emailVal, name, via)
      localStorage.setItem(`resto-email-${restaurant.id}`, emailVal)
      setIsSubmitted(true)
      onEmailSubmit?.(emailVal)
    },
    [restaurant.id, onEmailSubmit]
  )

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Ingresá tu correo electrónico'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('El correo no es válido'); return }
    setIsLoading(true)
    try { await captureEmail(email, null, 'manual') }
    catch { setError('Error al registrar. Intentá de nuevo.') }
    finally { setIsLoading(false) }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/google-menu-callback`,
          skipBrowserRedirect: true,
        },
      })
      if (oauthError || !data?.url) throw new Error(oauthError?.message || 'Error')

      const w = 520, h = 640
      const left = Math.max(0, (window.screen.width - w) / 2)
      const top = Math.max(0, (window.screen.height - h) / 2)
      const popup = window.open(data.url, 'restoqr-google-auth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`)

      if (!popup) {
        throw new Error('El navegador bloqueó el popup. Permitilo en la barra de direcciones.')
      }

      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type !== 'restoqr-google-auth') return
        window.removeEventListener('message', messageHandler)
        clearInterval(checker)
        const { email: gEmail, name: gName } = event.data
        if (!gEmail) { setError('No se pudo obtener el correo de Google'); setGoogleLoading(false); return }
        try { await captureEmail(gEmail, gName, 'google') }
        catch { setError('Error al registrar tu correo de Google') }
        finally { setGoogleLoading(false) }
      }
      window.addEventListener('message', messageHandler)

      const checker = setInterval(() => {
        if (popup.closed) { clearInterval(checker); window.removeEventListener('message', messageHandler); setGoogleLoading(false) }
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con Google')
      setGoogleLoading(false)
    }
  }

  if (isSubmitted) return null

  /* Incentive config */
  const incentiveType = (restaurant.incentive_type || 'none') as IncentiveType
  const showIncentive = incentiveType !== 'none' && restaurant.incentive_title
  const ic = INCENTIVE_DEFAULTS[incentiveType]
  const primaryColor = restaurant.primary_color || '#f97316'

  return (
    <div className="flex items-center justify-center min-h-screen p-4"
      style={{ background: 'linear-gradient(135deg, #fdf6ec 0%, #fef3e2 50%, #fff7ed 100%)' }}>
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* ── Hero header ───────────────────────────────── */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08)` }}
          >
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name}
                className="h-16 w-auto object-contain mx-auto mb-4 drop-shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: `${primaryColor}20` }}>
                🍽️
              </div>
            )}
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{restaurant.name}</h1>
            {restaurant.welcome_message && (
              <p className="text-gray-500 text-sm mt-1">{restaurant.welcome_message}</p>
            )}
          </div>

          <div className="px-8 pb-8 pt-4 space-y-5">

            {/* ── Incentive card ─────────────────────────── */}
            {showIncentive && (
              <div className={`rounded-2xl bg-gradient-to-br ${ic.bg} border border-white shadow-inner p-4`}>
                {/* Badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`${ic.badgeColor} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <span className="text-xl">{ic.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-lg leading-tight ${ic.textColor}`}>
                      {restaurant.incentive_title}
                    </p>
                    {restaurant.incentive_description && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {restaurant.incentive_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Promo code reveal */}
                {restaurant.incentive_code && (
                  <div className="mt-3">
                    {codeRevealed ? (
                      <div className="flex items-center justify-between bg-white/80 rounded-xl px-4 py-2 border border-dashed border-gray-300">
                        <span className="font-mono font-black text-lg tracking-widest text-gray-800">
                          {restaurant.incentive_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard?.writeText(restaurant.incentive_code!); }}
                          className="text-xs text-gray-400 hover:text-gray-600 font-medium ml-2"
                        >
                          Copiar
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center mt-1">
                        El código se revelará al registrarte 🎉
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Call to action ─────────────────────────── */}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                {showIncentive
                  ? '¡Ingresá tu correo y accedé al beneficio!'
                  : 'Ingresá tu correo para ver el menú'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Sin spam · Podés darte de baja cuando quieras
              </p>
            </div>

            {/* ── Error ──────────────────────────────────── */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ── Email form ─────────────────────────────── */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={isLoading || googleLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 disabled:opacity-60 transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={isLoading || googleLoading}
                className="w-full text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                onClick={() => { if (restaurant.incentive_code) setCodeRevealed(true) }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Registrando...</span></>
                ) : showIncentive ? (
                  `¡Quiero ${restaurant.incentive_title}! →`
                ) : (
                  'Ver el menú →'
                )}
              </button>
            </form>

            {/* ── Skip ───────────────────────────────────── */}
            {onSkip && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-gray-400 hover:text-gray-500 transition-colors underline underline-offset-2"
                >
                  Continuar sin registrarme
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
          <span>🔒 Correo seguro</span>
          <span>·</span>
          <span>🚫 Sin spam</span>
          <span>·</span>
          <span>✋ Baja cuando quieras</span>
        </div>
      </div>
    </div>
  )
}
