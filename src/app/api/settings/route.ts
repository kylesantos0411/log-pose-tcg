import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const SETTINGS_FILE = path.join(process.cwd(), 'prisma', 'system_settings.json');

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
  } catch (err) {
    console.warn('Error writing system_settings.json:', err);
  }
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;
    const current = readSettings();

    if (key === 'maintenance') {
      current.maintenance = { ...current.maintenance, ...(value || {}) };
    } else if (key === 'announcement') {
      current.announcement = { ...current.announcement, ...(value || {}) };
    } else if (key === 'features') {
      current.features = { ...(value || {}) };
    }

    writeSettings(current);
    return NextResponse.json({ success: true, settings: current });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
