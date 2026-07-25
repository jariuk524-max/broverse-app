import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'images.json');

export async function GET(req: NextRequest) {
  try {
    const domainId = req.nextUrl.searchParams.get('domainId');
    const raw = await readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    if (domainId) {
      return NextResponse.json(data[domainId] || { hero: null, slider: [] });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to read images' }, { status: 500 });
  }
}
