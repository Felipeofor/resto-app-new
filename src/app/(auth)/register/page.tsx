'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { signUp, signInWithGoogle } from '@/lib/auth/actions';

/* ------ Google "G" icon ------------------------------------------------------------------------------------------------------------------ */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ------ Password strength ------------------------------------------------------------------------------------------------------------ */
function passwordStrength(p: string) {
  if (!p) return { score: 0, label: '', color: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: s, label: 'Muy débil', color: 'bg-red-500' };
  if (s === 2) return { score: s, label: 'Débil', color: 'bg-orange-400' };
  if (s === 3) return { score: s, label: 'Regular', color: 'bg-yellow-400' };
  if (s === 4) return { score: s, label: 'Fuerte', color: 'bg-green-400' };
  return { score: s, label: 'Muy fuerte', color: 'bg-green-600' };
}

/* ------ Error translation ------------------------------------------------------------------------------------------------------------ */
function translateSupabaseError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con ese correo. ¿Querés iniciar sesión?';
  if (m.includes('invalid email') || m.includes('unable to validate'))
    return 'El formato del correo no es válido.';
  if (m.includes('password') && m.includes('6'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('weak password') || m.includes('password should'))
    return 'La contraseña es muy débil. Usá letras, números y símbolos.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Error de conexión. Revisá tu internet e intentá de nuevo.';
  if (m.includes('sending confirmation email'))
    return 'Error al enviar el email de confirmación. Puede que el servidor de correos esté saturado, intentá de nuevo en unos minutos.';
  return msg;
}

/* ------ Field wrapper ------------------------------------------------------------------------------------------------------------------------ */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {msg}
    </p>
  );
}

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Register Page
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const strength = passwordStrength(form.password);

  /* Per-field errors (only shown after field is touched) */
  const fieldErrors = {
    fullName: !form.fullName.trim()
      ? 'El nombre es requerido'
      : form.fullName.trim().length < 3
        ? 'Debe tener al menos 3 caracteres'
        : null,
    email: !form.email
      ? 'El correo es requerido'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? 'Ingresá un correo válido (ej: usuario@dominio.com)'
        : null,
    password: !form.password
      ? 'La contraseña es requerida'
      : form.password.length < 6
        ? 'Mínimo 6 caracteres'
        : null,
    confirmPassword: !form.confirmPassword
      ? 'Confirmá tu contraseña'
      : form.confirmPassword !== form.password
        ? 'Las contraseñas no coinciden'
        : null,
  };

  const isFormValid = Object.values(fieldErrors).every((e) => e === null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setServerError(null);
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((p) => ({ ...p, [field]: true }));
  };

  const touchAll = () =>
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    touchAll();
    if (!isFormValid) return;

    setLoading(true);
    setServerError(null);
    try {
      const result = await signUp(form.email.trim().toLowerCase(), form.password, form.fullName.trim());
      if (result.error) {
        setServerError(translateSupabaseError(result.error));
      } else {
        router.push('/dashboard');
      }
    } catch {
      setServerError('Error al crear la cuenta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setServerError(null);
    try {
      await signInWithGoogle();
      // signInWithGoogle() calls redirect() internally, so we won't reach here
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('NEXT_REDIRECT')) {
        setServerError('Error al conectar con Google. Intentá de nuevo.');
        setGoogleLoading(false);
      }
    }
  };

  /* Border/ring color helper */
  const inputStatus = (field: keyof typeof fieldErrors) => {
    if (!touched[field]) return 'border-gray-300 focus:ring-purple-500';
    if (fieldErrors[field]) return 'border-red-400 focus:ring-red-400 bg-red-50';
    return 'border-green-400 focus:ring-green-400 bg-green-50/30';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Crear Cuenta</h2>
        <p className="text-gray-500 text-sm mb-7">
          Gestioná tu restaurante con <span className="font-semibold text-purple-600">RestoQR</span>
        </p>

        {/* Server error */}
        {serverError && (
          <div className="mb-5 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Google --- temporalmente deshabilitado hasta configurar OAuth
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 rounded-lg transition-all mb-5"
        >
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <GoogleIcon />}
          <span>{googleLoading ? 'Conectando...' : 'Registrarse con Google'}</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">o con email y contraseña</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
        */}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                onBlur={() => handleBlur('fullName')}
                placeholder="Juan García"
                disabled={loading}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 transition-colors ${inputStatus('fullName')}`}
              />
            </div>
            {touched.fullName && <FieldError msg={fieldErrors.fullName ?? undefined} />}
          </div>

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
                onBlur={() => handleBlur('email')}
                placeholder="tu@correo.com"
                disabled={loading}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 transition-colors ${inputStatus('email')}`}
              />
            </div>
            {touched.email && <FieldError msg={fieldErrors.email ?? undefined} />}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 transition-colors ${inputStatus('password')}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${strength.score >= 4 ? 'text-green-600' : strength.score >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {strength.label}
                </p>
              </div>
            )}
            {touched.password && <FieldError msg={fieldErrors.password ?? undefined} />}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Repetí la contraseña"
                disabled={loading}
                className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 transition-colors ${inputStatus('confirmPassword')}`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {touched.confirmPassword && fieldErrors.confirmPassword === null && form.confirmPassword.length > 0 && (
              <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
              </p>
            )}
            {touched.confirmPassword && <FieldError msg={fieldErrors.confirmPassword ?? undefined} />}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
            Iniciar sesión
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-gray-400">
        Al crear una cuenta, aceptás nuestros{' '}
        <span className="underline cursor-pointer hover:text-gray-600">términos y condiciones</span>
      </p>
    </div>
  );
}
