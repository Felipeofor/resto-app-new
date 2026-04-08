'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function strengthLabel(p: string): { label: string; color: string; width: string } {
  if (p.length === 0) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { label: 'Muy débil', color: 'bg-red-500', width: '20%' };
  if (score === 2) return { label: 'Débil', color: 'bg-orange-400', width: '40%' };
  if (score === 3) return { label: 'Regular', color: 'bg-yellow-400', width: '60%' };
  if (score === 4) return { label: 'Fuerte', color: 'bg-green-400', width: '80%' };
  return { label: 'Muy fuerte', color: 'bg-green-600', width: '100%' };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Wait for Supabase to process the recovery token from the URL hash
  useEffect(() => {
    const supabase = createClient();
    
    // 1. Check initial session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Session detected on load');
        setSessionReady(true);
      }
    });

    // 2. Listen for auth changes (PASSWORD_RECOVERY is the main one, but SIGNED_IN also works)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        setSessionReady(true);
      }
    });

    // 3. Fallback: If after 4 seconds we still don't have a session but we see a hash in the URL,
    // try to force a user check or show an error.
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSessionReady(true);
      } else if (window.location.hash.includes('access_token')) {
        setError('No se pudo verificar el enlace. Es posible que haya expirado o sea inválido. Por favor, solicitá uno nuevo.');
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const strength = strengthLabel(password);
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(translateError(updateError.message));
      } else {
        setDone(true);
        setTimeout(() => router.push('/dashboard'), 2500);
      }
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Contraseña actualizada!</h2>
          <p className="text-gray-500 text-sm">Redirigiendo al panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h2>
        <p className="text-gray-500 text-sm mb-6">Elegí una contraseña segura para tu cuenta.</p>

        {error && (
          <div className="mb-5 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!sessionReady && (
          <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-700">Verificando el enlace...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading || !sessionReady}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                required
                disabled={loading || !sessionReady}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-colors ${
                  passwordMismatch
                    ? 'border-red-400 bg-red-50'
                    : passwordsMatch
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordMismatch && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('same password')) return 'La nueva contraseña no puede ser igual a la anterior.';
  if (m.includes('weak')) return 'La contraseña es muy débil. Usá al menos 8 caracteres con números y letras.';
  if (m.includes('expired') || m.includes('invalid')) return 'El enlace expiró. Solicitá uno nuevo desde el login.';
  return `Error: ${msg}`;
}
