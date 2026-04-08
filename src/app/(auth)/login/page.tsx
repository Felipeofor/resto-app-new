'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn } from '@/lib/auth/actions';

function translateSupabaseError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Email o contraseña incorrectos. Revisá tus datos.';
  if (m.includes('email not confirmed'))
    return 'Debés confirmar tu email antes de iniciar sesión. Revisá tu casilla.';
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Demasiados intentos fallidos. Esperá unos minutos.';
  if (m.includes('user not found') || m.includes('no user'))
    return 'No existe una cuenta con ese correo.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Error de conexión. Revisá tu internet e intentá de nuevo.';
  return msg;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qErr = searchParams.get('error');
    if (qErr) setError(decodeURIComponent(qErr));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Completá todos los campos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(form.email.trim().toLowerCase(), form.password);
      if (result.error) {
        setError(translateSupabaseError(result.error));
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Error al iniciar sesión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Iniciar Sesión</h2>
        <p className="text-gray-500 text-sm mb-7">
          Accedé a tu panel de <span className="font-semibold text-purple-600">RestoQR</span>
        </p>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                required
                disabled={loading}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="space-y-4" />}>
      <LoginForm />
    </Suspense>
  );
}
