import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://miywbfkbdscnzxbnycme.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_fv6BrsbJZV-hutcDA-pOcA_cR6rxvLE';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
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
 * Sign in with email, username, or tag and password
 */
export async function signInWithIdentifier(
  identifier: string,
  password: string
): Promise<{ user?: any; profile?: any; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const clean = identifier.trim();
  const stripped = clean.replace(/^@/, '');
  let targetEmail = clean;

  if (!clean.includes('@') || !clean.includes('.')) {
    // Resolve email by matching tag or username in public profiles
    const { data: matched, error: lookupErr } = await client
      .from('profiles')
      .select('email, username, tag')
      .or(`tag.ilike.${clean},tag.ilike.@${stripped},username.ilike.${clean},username.ilike.${stripped}`)
      .limit(1);

    if (lookupErr || !matched || matched.length === 0 || !matched[0].email) {
      return { error: 'No account found matching this Username or Email.' };
    }
    targetEmail = matched[0].email;
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: targetEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect password or unverified account. Please check your credentials.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please check your email and verify your account first.' };
    }
    return { error: error.message };
  }

  // Fetch full profile from Supabase profiles table
  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return { user: data.user, profile: profile || undefined };
}

/**
 * Sign in with email and password (direct)
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
}): Promise<{ user?: any; error?: string; session?: any; profile?: any }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const cleanUsername = params.username.trim();
  const cleanTag = params.tag?.trim() || (cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`);

  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        username: cleanUsername,
        avatar: params.avatar || 'default',
        crew: params.crew || 'Collector',
        tag: cleanTag,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  let session = data.session;
  let user = data.user;

  // If no session returned directly, attempt instant sign in with password so the user is immediately authenticated
  if (!session && user) {
    try {
      const signInRes = await client.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });
      if (signInRes.data?.session) {
        session = signInRes.data.session;
        user = signInRes.data.user || user;
      }
    } catch (e) {
      console.warn('Instant sign-in after signup warning:', e);
    }
  }

  // Ensure profile is saved to public.profiles table in Supabase
  let profile = null;
  if (user?.id) {
    try {
      const profileData = {
        id: user.id,
        email: params.email,
        username: cleanUsername,
        avatar: params.avatar || 'default',
        crew: params.crew || 'Collector',
        tag: cleanTag,
        rank: 'Collector',
        rank_badge: '',
        updated_at: new Date().toISOString(),
      };
      const { data: p } = await client.from('profiles').upsert(profileData, { onConflict: 'id' }).select().single();
      profile = p || profileData;
    } catch (e) {
      console.warn('Profile upsert warning:', e);
    }
  }

  return { user, session, profile };
}

/**
 * Verify 6-digit registration OTP code sent by email
 */
export async function verifySignupOtp(params: {
  email: string;
  token: string;
}): Promise<{ user?: any; profile?: any; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { data, error } = await client.auth.verifyOtp({
    email: params.email.trim().toLowerCase(),
    token: params.token.trim(),
    type: 'signup',
  });

  if (error) {
    return { error: error.message || 'Invalid or expired verification code. Please request a new one.' };
  }

  // Fetch created profile
  let profile = null;
  if (data?.user?.id) {
    const { data: p } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    profile = p;
  }

  return { user: data.user, profile: profile || undefined };
}

/**
 * Resend registration confirmation code
 */
export async function resendSignupCode(email: string): Promise<{ error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { error } = await client.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Send password reset code to user's email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Verify recovery OTP and set new password
 */
export async function verifyResetOtpAndSetPassword(params: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ user?: any; profile?: any; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { data, error } = await client.auth.verifyOtp({
    email: params.email.trim().toLowerCase(),
    token: params.token.trim(),
    type: 'recovery',
  });

  if (error) {
    return { error: error.message || 'Invalid or expired reset code.' };
  }

  const { data: updateData, error: updateErr } = await client.auth.updateUser({
    password: params.newPassword,
  });

  if (updateErr) {
    return { error: updateErr.message || 'Failed to update password.' };
  }

  // Fetch updated profile
  let profile = null;
  if (updateData?.user?.id) {
    const { data: p } = await client
      .from('profiles')
      .select('*')
      .eq('id', updateData.user.id)
      .single();
    profile = p;
  }

  return { user: updateData.user, profile: profile || undefined };
}

/**
 * Send 6-digit OTP code for sign-in via email
 */
export async function sendLoginOtp(email: string): Promise<{ error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { error } = await client.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Verify sign-in OTP code
 */
export async function verifyLoginOtp(params: {
  email: string;
  token: string;
}): Promise<{ user?: any; profile?: any; error?: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { error: 'Supabase is not configured yet.' };
  }

  const { data, error } = await client.auth.verifyOtp({
    email: params.email.trim().toLowerCase(),
    token: params.token.trim(),
    type: 'email',
  });

  if (error) {
    return { error: error.message || 'Invalid or expired sign-in code.' };
  }

  let profile = null;
  if (data?.user?.id) {
    const { data: p } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    profile = p;
  }

  return { user: data.user, profile: profile || undefined };
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
