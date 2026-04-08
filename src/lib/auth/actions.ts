'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { restaurantOwnerWelcomeTemplate, passwordResetTemplate } from '@/lib/email/templates';

export interface AuthResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Sign up user
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'User creation failed',
      };
    }

    // Update profile created by trigger (handle_new_user sets role='user')
    // We upgrade to 'admin' for self-registered users
    const { error: profileError } = await supabase.from('profiles').update({
      full_name: fullName,
      role: 'admin' as const,
    }).eq('id', data.user.id);

    if (profileError) {
      return {
        success: false,
        error: 'Failed to create user profile',
      };
    }

    // Welcome email is sent after email confirmation (in /auth/callback)
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  let redirectUrl: string | null = null;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (data.url) {
      redirectUrl = data.url;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // redirect() must be called outside try/catch so Next.js can intercept NEXT_REDIRECT
  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return { success: true };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    redirect('/login');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{ email: string; role: 'super_admin' | 'admin' | 'user'; full_name: string | null; avatar_url: string | null }>
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Request password reset
 * Uses Resend with our custom template when RESEND_API_KEY is configured;
 * falls back to Supabase built-in email otherwise.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = `${siteUrl}/auth/reset-password`;

    // If Resend is configured, generate the link ourselves and send the branded email
    if (process.env.RESEND_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient: createAdminSB } = await import('@supabase/supabase-js');
        const adminSB = createAdminSB(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // generateLink returns the recovery link with the embedded token
        const { data: linkData, error: linkError } = await adminSB.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo },
        });

        if (!linkError && linkData?.properties?.action_link) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);

          // Try to get the owner's name from the profile
          const { data: profile } = await adminSB
            .from('profiles')
            .select('full_name')
            .eq('email', email)
            .maybeSingle();

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Recuperá tu contraseña en RestoQR 🔐',
            html: passwordResetTemplate({
              ownerName: profile?.full_name ?? undefined,
              resetUrl: linkData.properties.action_link,
            }),
          });

          return { success: true };
        }
      } catch (customErr) {
        console.error('Custom password reset email failed, falling back to Supabase:', customErr);
      }
    }

    // Fallback: let Supabase send its own email
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
