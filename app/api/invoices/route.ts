import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  getFinancialKPIs,
  getLiveClosingDealLedger,
} from '@/lib/repositories/finance-repository';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const session = await auth();
    if (!session?.user?.role) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const role = session.user.role;
    if (!['ADMIN', 'FINANCE', 'OPERATOR', 'INVESTOR', 'SALES_DESK'].includes(role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (view === 'ledger') {
      const ledgerData = await getLiveClosingDealLedger();
      return NextResponse.json(ledgerData);
    }

    if (view === 'kpis') {
      const kpis = getFinancialKPIs();
      return NextResponse.json(kpis);
    }

    const invoices = getInvoices();
    const ledgerData = await getLiveClosingDealLedger();
    return NextResponse.json({
      invoices,
      deals: ledgerData.deals,
      categoryEconomics: ledgerData.categoryEconomics,
      totalAssetValuation: ledgerData.totalAssetValuation,
      closingKPIs: ledgerData.kpis,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const role = session.user.role;
    if (!['ADMIN', 'FINANCE', 'OPERATOR', 'SALES_DESK'].includes(role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

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
