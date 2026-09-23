import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  }

  return browserClient;
}

/**
 * Trigger Google OAuth sign-in flow
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.' };
  }

  const callbackUrl = redirectTo || `${window.location.origin}/auth/callback`;

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Sign in with email and password
 */
export async function signInWithEmailPassword(email: string, password: string): Promise<{ user?: any; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { user: data.user };
}

/**
 * Sign up with email, password, and custom pirate metadata
 */
export async function signUpWithEmailPassword(params: {
  email: string;
  password: string;
  username: string;
  avatar?: string;
  crew?: string;
  tag?: string;
}): Promise<{ user?: any; error?: string; session?: any }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        username: params.username,
        avatar: params.avatar || '👒',
        crew: params.crew || 'Straw Hat Pirates',
        tag: params.tag || `PIRATE-${params.username.toUpperCase().slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { user: data.user, session: data.session };
}

/**
 * Sign out of Supabase session
 */
export async function signOutSupabase(): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (client) {
    await client.auth.signOut();
  }
}
