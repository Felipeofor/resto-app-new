'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserProfile extends User {
  profile?: {
    full_name: string;
    role: 'super_admin' | 'admin' | 'user';
    restaurant_id?: string;
  };
}

/**
 * Hook to get the current user with their profile information
 */
export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get current user
    const getUser = async () => {
      try {
        setLoading(true);

        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          setError(userError.message);
          setUser(null);
          return;
        }

        if (!authUser) {
          setUser(null);
          return;
        }

        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          setError(profileError.message);
          setUser(authUser as UserProfile);
          return;
        }

        setUser({
          ...authUser,
          profile,
        } as UserProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          ...session.user,
          profile,
        } as UserProfile);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

/**
 * Hook to get the current user's role
 */
export function useRole() {
  const { user, loading, error } = useUser();
  const [role, setRole] = useState<'super_admin' | 'admin' | 'user' | null>(null);

  useEffect(() => {
    if (user?.profile?.role) {
      setRole(user.profile.role);
    } else {
      setRole(null);
    }
  }, [user]);

  return { role, loading, error };
}

/**
 * Hook to require authentication and redirect if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const { user, loading } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    } else if (user) {
      setIsAuthenticated(true);
    }
  }, [user, loading, redirectTo, router]);

  return { isAuthenticated, loading };
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(requiredRole: 'super_admin' | 'admin' | 'user') {
  const { role, loading } = useRole();

  const hasRole = (() => {
    if (!role) return false;

    const roleHierarchy: Record<string, number> = {
      super_admin: 3,
      admin: 2,
      user: 1,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  })();

  return { hasRole, loading };
}

/**
 * Hook to require specific role and redirect if not authorized
 */
export function useRequireRole(
  requiredRole: 'super_admin' | 'admin' | 'user',
  redirectTo = '/dashboard'
) {
  const router = useRouter();
  const { hasRole, loading } = useHasRole(requiredRole);
  const { user } = useUser();

  useEffect(() => {
    if (!loading && user && !hasRole) {
      router.push(redirectTo);
    }
  }, [hasRole, loading, user, redirectTo, router]);

  return { authorized: hasRole, loading };
}
