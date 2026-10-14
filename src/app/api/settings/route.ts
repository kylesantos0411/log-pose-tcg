import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SETTINGS_FILE = path.join(process.cwd(), 'prisma', 'system_settings.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miywbfkbdscnzxbnycme.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_fv6BrsbJZV-hutcDA-pOcA_cR6rxvLE';

const DEFAULT_SETTINGS = {
  maintenance: {
    enabled: false,
    message: 'System upgrade in progress. Regular maintenance ongoing.',
    estimated_time: null,
  },
  announcement: {
    enabled: false,
    message: '',
    type: 'info',
  },
  features: {},
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Error reading system_settings.json:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

function writeSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {
    // Expected on read-only environments like Vercel serverless
  }
}

export async function GET() {
  // 1. Prioritize reading authoritative settings from Supabase system_settings table
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });
      const { data, error } = await supabase.from('system_settings').select('key, value');
      if (!error && data && data.length > 0) {
        const cloudSettings: any = {
          maintenance: { ...DEFAULT_SETTINGS.maintenance },
          announcement: { ...DEFAULT_SETTINGS.announcement },
          features: {},
        };

        data.forEach((row) => {
          let val = row.value;
          if (typeof val === 'string') {
            try {
              val = JSON.parse(val);
            } catch {}
          }
          if (row.key === 'maintenance' && val) {
            cloudSettings.maintenance = { ...DEFAULT_SETTINGS.maintenance, ...val };
          } else if (row.key === 'announcement' && val) {
            cloudSettings.announcement = {
              ...DEFAULT_SETTINGS.announcement,
              ...val,
              enabled: Boolean(val?.enabled),
            };
          } else if (row.key === 'features' && val) {
            cloudSettings.features = { ...val };
          }
        });

        // Best-effort cache to local json file
        writeSettings(cloudSettings);

        return NextResponse.json({ success: true, settings: cloudSettings, source: 'supabase' });
      }
    }
  } catch (supabaseErr) {
    console.warn('Failed to fetch system_settings from Supabase in /api/settings:', supabaseErr);
  }

  // 2. Fallback to local file
  const settings = readSettings();
  return NextResponse.json({ success: true, settings, source: 'local' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, adminTag } = body;
    const current = readSettings();

    if (key === 'maintenance') {
      current.maintenance = { ...current.maintenance, ...(value || {}) };
    } else if (key === 'announcement') {
      current.announcement = { ...current.announcement, ...(value || {}) };
    } else if (key === 'features') {
      current.features = { ...(current.features || {}), ...(value || {}) };
    }

    writeSettings(current);

    // Also attempt server-side Supabase upsert if service role key exists
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey && SUPABASE_URL) {
      try {
        const adminSupabase = createClient(SUPABASE_URL, serviceKey, {
          auth: { persistSession: false },
        });
        await adminSupabase.from('system_settings').upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: adminTag || 'admin-api',
        });
      } catch (adminErr) {
        console.warn('Failed to upsert system_settings via service key:', adminErr);
      }
    }

    return NextResponse.json({ success: true, settings: current });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
