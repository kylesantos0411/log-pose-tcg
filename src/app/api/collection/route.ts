import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Collection API is disabled. Collection data is saved locally on-device for privacy, offline reliability, and fast performance.' 
    },
    { status: 403 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Collection API is disabled. Collection data is saved locally on-device for privacy, offline reliability, and fast performance.' 
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Collection API is disabled. Collection data is saved locally on-device for privacy, offline reliability, and fast performance.' 
    },
    { status: 403 }
  );
}

