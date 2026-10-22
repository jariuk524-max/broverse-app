import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Публичный снимок заявки для клиента: статус + финансы (сумма, реквизиты, оплата) */
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ order: null }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from('orders')
      .select('status, metadata')
      .eq('id', id)
      .single();
    if (error || !data) return NextResponse.json({ order: null });

    const meta = data.metadata || {};
    const rawFinal = meta.final_price !== null && meta.final_price !== undefined ? Number(meta.final_price) : NaN;
    const reqs = meta.master_requisites;
    return NextResponse.json({
      order: {
        status: data.status,
        masterId: meta.master_id ?? null,
        masterName: meta.master_name ?? null,
        declinedBy: meta.declined_by ?? null,
        /** Клиент согласился искать другого мастера — заявка в общем пуле */
        rematchAgreed: !!meta.rematch_agreed,
        finalPrice: Number.isFinite(rawFinal) && rawFinal > 0 ? rawFinal : null,
        masterRequisites: reqs && typeof reqs === 'object' ? reqs : null,
        paymentConfirmedAt: typeof meta.payment_confirmed_at === 'string' ? meta.payment_confirmed_at : null,
      },
    });
  } catch {
    return NextResponse.json({ order: null }, { status: 500 });
  }
}

/** Согласие клиента на поиск другого мастера после отмены: POST { id, action: 'agree_rematch' } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = String(body?.id || '');
  const action = String(body?.action || '');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || action !== 'agree_rematch') {
    return NextResponse.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: order, error } = await supabase
      .from('orders')
      .select('metadata')
      .eq('id', id)
      .single();
    if (error || !order) return NextResponse.json({ ok: false, error: 'Заявка не найдена' }, { status: 404 });

    const meta = (order.metadata || {}) as Record<string, unknown>;
    if (!meta.rematch_agreed) {
      const { error: upd } = await supabase
        .from('orders')
        .update({ metadata: { ...meta, rematch_agreed: true, rematch_agreed_at: new Date().toISOString() } })
        .eq('id', id);
      if (upd) return NextResponse.json({ ok: false, error: 'Не удалось сохранить' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Ошибка обработки' }, { status: 500 });
  }
}
