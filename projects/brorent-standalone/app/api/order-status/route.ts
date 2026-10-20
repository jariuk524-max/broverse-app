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
        finalPrice: Number.isFinite(rawFinal) && rawFinal > 0 ? rawFinal : null,
        masterRequisites: reqs && typeof reqs === 'object' ? reqs : null,
        paymentConfirmedAt: typeof meta.payment_confirmed_at === 'string' ? meta.payment_confirmed_at : null,
      },
    });
  } catch {
    return NextResponse.json({ order: null }, { status: 500 });
  }
}
