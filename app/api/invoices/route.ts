import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  getFinancialKPIs,
} from '@/lib/repositories/finance-repository';
import { UserRole } from '@/lib/types/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const roleHeader = (request.headers.get('x-bbk-role') || searchParams.get('role') || 'ADMIN') as UserRole;

    if (view === 'kpis') {
      const kpis = getFinancialKPIs();
      return NextResponse.json(kpis);
    }

    const invoices = getInvoices();
    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, invoice, id, status } = body;

    if (action === 'CREATE') {
      const created = createInvoice(invoice);
      return NextResponse.json({ success: true, invoice: created });
    }

    if (action === 'UPDATE_STATUS') {
      const updated = updateInvoiceStatus(id, status);
      return NextResponse.json({ success: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invoice mutation failed' }, { status: 500 });
  }
}
