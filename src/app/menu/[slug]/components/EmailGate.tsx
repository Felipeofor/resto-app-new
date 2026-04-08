'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Tag, Gift, Star, Crown, Sparkles } from 'lucide-react'

/* ------ Types ------------------------------------------------------------------------------------------------------------------------------------------------ */
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

/* ------ Incentive config --------------------------------------------------------------------------------------------------------------- */
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

/* ------ API helper --------------------------------------------------------------------------------------------------------------------------------- */
async function registerEmailOnServer(
  restaurantId: string,
  email: string,
  name: string | null,
) {
  const res = await fetch('/api/register-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId, email, name, registeredVia: 'manual' }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    if (data.error?.toLowerCase().includes('duplicate') || res.status === 409) return
    throw new Error('Error al registrar correo')
  }
}

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   EmailGate
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
export function EmailGate({ restaurant, onEmailSubmit, onSkip }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [codeRevealed, setCodeRevealed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`resto-email-${restaurant.id}`)
    if (stored) setIsSubmitted(true)
  }, [restaurant.id])

  const captureEmail = useCallback(
    async (emailVal: string, name: string | null) => {
      await registerEmailOnServer(restaurant.id, emailVal, name)
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
    try { await captureEmail(email, null) }
    catch { setError('Error al registrar. Intentá de nuevo.') }
    finally { setIsLoading(false) }
  }

  if (isSubmitted) return null

  /* Incentive config */
  const incentiveType = (restaurant.incentive_type || 'none') as IncentiveType
  const showIncentive = incentiveType !== 'none' && restaurant.incentive_title
  const ic = INCENTIVE_DEFAULTS[incentiveType]
  const primaryColor = restaurant.primary_color || '#f97316'

  const handleSkip = () => {
    localStorage.setItem(`resto-email-${restaurant.id}`, '__skipped__')
    onSkip?.()
  }

  return (
    <div className="flex items-end sm:items-center justify-center min-h-screen p-0 sm:p-4"
      style={{ background: 'linear-gradient(135deg, #fdf6ec 0%, #fef3e2 50%, #fff7ed 100%)' }}>
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

          {/* ------ Hero header --------------------------------------------------------------------------------------------------- */}
          <div
            className="px-6 pt-6 pb-4 text-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08)` }}
          >
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name}
                className="h-14 w-auto object-contain mx-auto mb-3 drop-shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{ background: `${primaryColor}20` }}>
                {'\uD83C\uDF7D\uFE0F'}
              </div>
            )}
            <h1 className="text-xl font-black text-gray-900 leading-tight">{restaurant.name}</h1>
            {restaurant.welcome_message && (
              <p className="text-gray-500 text-sm mt-1">{restaurant.welcome_message}</p>
            )}
          </div>

          <div className="px-6 pb-6 pt-3 space-y-4">

            {/* ------ Incentive card --------------------------------------------------------------------------------- */}
            {showIncentive && (
              <div className={`rounded-2xl bg-gradient-to-br ${ic.bg} border border-white shadow-inner p-3.5`}>
                {/* Badge */}
                <div className="flex items-start gap-3">
                  <div
                    className={`${ic.badgeColor} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <span className="text-xl">{ic.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-base leading-tight ${ic.textColor}`}>
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
                        {`El c\u00F3digo se revelar\u00E1 al registrarte \uD83C\uDF89`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ------ Call to action --------------------------------------------------------------------------------- */}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                {showIncentive
                  ? `\u00A1Ingres\u00E1 tu correo y acced\u00E9 al beneficio!`
                  : `Ingres\u00E1 tu correo para ver el men\u00FA`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {`Sin spam \u00B7 Pod\u00E9s darte de baja cuando quieras`}
              </p>
            </div>

            {/* ------ Error ------------------------------------------------------------------------------------------------------------ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ------ Email form --------------------------------------------------------------------------------------------- */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 disabled:opacity-60 transition-all text-base"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] text-[15px]"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                onClick={() => { if (restaurant.incentive_code) setCodeRevealed(true) }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Registrando...</span></>
                ) : showIncentive ? (
                  <>{`\u00A1Quiero ${restaurant.incentive_title}!`}</>
                ) : (
                  <>{'Ver el men\u00FA'}</>
                )}
              </button>
            </form>

            {/* ------ Skip --------------------------------------------------------------------------------------------------------------- */}
            {onSkip && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-gray-400 hover:text-gray-500 transition-colors underline underline-offset-2 py-2"
                >
                  Continuar sin registrarme
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
