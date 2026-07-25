import { NextResponse } from 'next/server';

const MONOLITH_URL = 'https://broverse-masters.vercel.app/api/catalog-services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(MONOLITH_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Monolith ${res.status}`);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
