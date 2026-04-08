'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * This page handles the Google OAuth callback when the menu EmailGate
 * opens the OAuth flow in a popup window.
 *
 * After Google auth succeeds, Supabase redirects here. We:
 *  1. Read the session to get the user's email
 *  2. Post the email back to the parent window via postMessage
 *  3. Close the popup
 */
export default function GoogleMenuCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient()

        // Wait briefly for Supabase to process the OAuth tokens from the URL hash
        await new Promise((res) => setTimeout(res, 500))

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user?.email) {
          setStatus('error')
          return
        }

        const email = user.email
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.given_name ||
          null

        setStatus('success')

        // If opened as popup, send message to parent and close
        if (window.opener) {
          window.opener.postMessage(
            { type: 'restoqr-google-auth', email, name },
            window.location.origin
          )
          window.close()
        } else {
          // Fallback: if opened directly (not as popup), redirect to home
          window.location.href = '/'
        }
      } catch (err) {
        console.error('Google menu callback error:', err)
        setStatus('error')
      }
    }

    handleCallback()
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#f9fafb',
      }}
    >
      {status === 'loading' && (
        <>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #e5e7eb',
              borderTopColor: '#7c3aed',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 16,
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#6b7280', fontSize: 15 }}>Autenticando con Google...</p>
        </>
      )}
      {status === 'success' && (
        <p style={{ color: '#10b981', fontSize: 15, fontWeight: 600 }}>
          ✅ ¡Listo! Cerrando...
        </p>
      )}
      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Algo salió mal
          </p>
          <button
            onClick={() => window.close()}
            style={{
              padding: '8px 20px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
