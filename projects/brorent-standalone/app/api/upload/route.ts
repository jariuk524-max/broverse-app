import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'images.json');

type DomainStore = { hero: string | null; slider: string[]; services?: Record<string, string[]> };

async function readData(): Promise<Record<string, DomainStore>> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeData(data: Record<string, DomainStore>) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { domainId, type, slot, data, serviceName } = await req.json();

    if (!domainId || !type) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'hero');
    await mkdir(dir, { recursive: true });

    const store = await readData();
    if (!store[domainId]) store[domainId] = { hero: null, slider: [] };

    if (type === 'hero') {
      if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
      const base64 = data.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const filename = `${domainId}-hero.jpg`;
      await writeFile(path.join(dir, filename), buffer);

      store[domainId].hero = `/hero/${filename}`;
      await writeData(store);
      return NextResponse.json({ ok: true, path: `/hero/${filename}` });
    }

    if (type === 'slider') {
      if (!data) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
      const base64 = data.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const filename = `${domainId}-slider-${slot}.jpg`;
      await writeFile(path.join(dir, filename), buffer);

      const sliderPath = `/hero/${filename}`;
      if (slot !== undefined && slot >= 0) {
        store[domainId].slider[slot] = sliderPath;
      } else {
        store[domainId].slider.push(sliderPath);
      }
      await writeData(store);
      return NextResponse.json({ ok: true, path: sliderPath });
    }

    if (type === 'slider-delete') {
      if (slot !== undefined) {
        const oldPath = store[domainId].slider[slot];
        if (oldPath) {
          const filePath = path.join(process.cwd(), 'public', oldPath);
          try { const { unlink } = await import('fs/promises'); await unlink(filePath); } catch {}
        }
        store[domainId].slider.splice(slot, 1);
      } else {
        store[domainId].slider = [];
      }
      await writeData(store);
      return NextResponse.json({ ok: true });
    }

    if (type === 'service-photo') {
      if (!data || !serviceName) return NextResponse.json({ error: 'Missing data or serviceName' }, { status: 400 });
      if (!store[domainId].services) store[domainId].services = {};
      if (!store[domainId].services![serviceName]) store[domainId].services![serviceName] = [];

      const base64 = data.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const idx = store[domainId].services![serviceName].length;
      const safeName = serviceName.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').substring(0, 40);
      const filename = `${domainId}-${safeName}-${idx}.jpg`;
      await writeFile(path.join(dir, filename), buffer);

      const photoPath = `/hero/${filename}`;
      store[domainId].services![serviceName].push(photoPath);
      await writeData(store);
      return NextResponse.json({ ok: true, path: photoPath });
    }

    if (type === 'service-photo-delete') {
      if (!serviceName || slot === undefined) return NextResponse.json({ error: 'Missing serviceName or slot' }, { status: 400 });
      if (store[domainId].services?.[serviceName]) {
        const oldPath = store[domainId].services[serviceName][slot];
        if (oldPath) {
          const filePath = path.join(process.cwd(), 'public', oldPath);
          try { const { unlink } = await import('fs/promises'); await unlink(filePath); } catch {}
        }
        store[domainId].services[serviceName].splice(slot, 1);
        await writeData(store);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
