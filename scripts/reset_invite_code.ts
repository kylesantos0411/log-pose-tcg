/**
 * Reset an invite code so it can be reused.
 * Usage: npx tsx scripts/reset_invite_code.ts POSE-K7MN-4WRX
 *
 * This finds the profile in Supabase that used the code and clears
 * the crew field so the code appears unused again.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miywbfkbdscnzxbnycme.supabase.co';
// Requires the SERVICE ROLE KEY (not the anon key) to bypass RLS
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const code = (process.argv[2] || '').trim().toUpperCase();

if (!code) {
  console.error('❌  Usage: npx tsx scripts/reset_invite_code.ts <CODE>');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local or pass as an env var.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function resetCode() {
  console.log(`🔍  Looking for profile that used invite code: ${code}`);

  const { data: profiles, error: findErr } = await supabase
    .from('profiles')
    .select('id, username, email, crew')
    .eq('crew', `CODE:${code}`)
    .limit(5);

  if (findErr) {
    console.error('❌  Supabase query error:', findErr.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log(`✅  Code "${code}" has not been used yet — nothing to reset.`);
    process.exit(0);
  }

  console.log(`📋  Found ${profiles.length} profile(s) using this code:`);
  profiles.forEach(p => console.log(`   - @${p.username} (${p.email})`));

  // Clear the crew field to free the code
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ crew: 'Collector' })
    .eq('crew', `CODE:${code}`);

  if (updateErr) {
    console.error('❌  Failed to reset code:', updateErr.message);
    process.exit(1);
  }

  console.log(`✅  Invite code "${code}" has been reset and is now reusable.`);
}

resetCode();
