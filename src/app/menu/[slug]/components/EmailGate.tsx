'use client'

import { useState, useEffect } from 'react'
import { Mail, LogIn } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  welcome_message: string | null
}

interface EmailGateProps {
  restaurant: Restaurant
  onEmailSubmit?: (email: string) => void
}

export function EmailGate({ restaurant, onEmailSubmit }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    // Check if email is already stored in localStorage
    const storedEmail = localStorage.getItem(
      `resto-email-${restaurant.id}`
    )
    if (storedEmail) {
      setIsSubmitted(true)
    }
  }, [restaurant.id])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Por favor ingresa tu correo electrónico')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un correo electrónico válido')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/register-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          email,
          registeredVia: 'manual',
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (!data.error?.includes('duplicate')) {
          throw new Error('Error al registrar correo')
        }
      }

      // Store email in localStorage
      localStorage.setItem(`resto-email-${restaurant.id}`, email)

      setIsSubmitted(true)
      onEmailSubmit?.(email)
    } catch (err) {
      setError('Error al registrar tu correo. Intenta de nuevo.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth flow
    setError('Autenticación con Google próximamente')
  }

  if (isSubmitted) {
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Logo */}
          {restaurant.logo_url && (
            <div className="flex justify-center mb-4">
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-16 object-contain"
              />
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {restaurant.name}
            </h1>
            {restaurant.welcome_message && (
              <p className="text-gray-600">{restaurant.welcome_message}</p>
            )}
          </div>

          {/* Main message */}
          <div className="bg-amber-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Mail className="w-5 h-5" />
              <span>Ingresa tu correo para ver el menú</span>
            </div>
            <p className="text-sm text-amber-800">
              Recibirás actualizaciones de nuestros platos especiales y ofertas
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Continuar</span>
              {isLoading && (
                <span className="animate-spin">⏳</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Google signin button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Ingresar con Google</span>
          </button>

          {/* Privacy notice */}
          <p className="text-xs text-center text-gray-500">
            Tu correo está seguro con nosotros y no será compartido
          </p>
        </div>
      </div>
    </div>
  )
}
