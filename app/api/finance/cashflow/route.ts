import { NextRequest, NextResponse } from 'next/server';
import {
  getCashflowEntries,
  addCashflowEntry,
  deleteCashflowEntry,
  CashflowType,
} from '@/lib/repositories/cashflow-repository';
import { getLiveClosingDealLedger } from '@/lib/repositories/finance-repository';
import { parseToISODate } from '@/lib/repositories/warehouse-utils';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const jenisKas = searchParams.get('jenisKas'); // PENGELUARAN | PEMASUKAN_LAIN | ALL
    const kategori = searchParams.get('kategori');

    // 1. Fetch cashflow entries from Google Sheets
    let entries = await getCashflowEntries();

    // 2. Filter entries
    if (jenisKas && jenisKas !== 'ALL') {
      entries = entries.filter((e) => e.jenisKas === jenisKas);
    }
    if (kategori && kategori !== 'ALL') {
      entries = entries.filter((e) => e.kategori.toLowerCase() === kategori.toLowerCase());
    }
    if (startDate || endDate) {
      entries = entries.filter((e) => {
        const cleanEdate = parseToISODate(e.tanggal) || e.tanggal;
        if (startDate && cleanEdate < startDate) return false;
        if (endDate && cleanEdate > endDate) return false;
        return true;
      });
    }

    // 3. Compute live finance metrics
    const financeData = await getLiveClosingDealLedger();
    const deals = financeData.deals || [];

    // Filter deals by date if specified (Only deals sold in the active period)
    const filteredDeals = deals.filter((d) => {
      const dDate = parseToISODate(d.tanggalTerjual || d.tanggalMasuk) || (d.tanggalTerjual || d.tanggalMasuk || '').split('T')[0];
      if (startDate && dDate && dDate < startDate) return false;
      if (endDate && dDate && dDate > endDate) return false;
      return true;
    });

    const bbkDeals = filteredDeals.filter((d) => d.soldBy === 'SALES_BBK');
    const totalDealsRevenue = bbkDeals.reduce((sum, d) => sum + (d.hargaClosing || 0), 0);
    const totalDealsGrossProfit = bbkDeals.reduce((sum, d) => sum + (d.realizedProfit || 0), 0);
    const totalPhysicalUnits = bbkDeals.reduce((sum, d) => sum + (d.quantity || 1), 0);

    let totalExpenses = 0;
    let totalCommissions = 0;
    let totalInvestorInflow = 0;
    let totalInvestorOutflow = 0;

    entries.forEach((e) => {
      if (e.jenisKas === 'PENGELUARAN') {
        if (e.kategori === 'BAGI HASIL INVESTOR') {
          totalInvestorOutflow += e.nominal;
        } else {
          totalExpenses += e.nominal;
        }
      } else if (e.jenisKas === 'PEMASUKAN_LAIN') {
        if (e.kategori === 'MODAL INVESTOR') {
          totalInvestorInflow += e.nominal;
        } else {
          totalCommissions += e.nominal;
        }
      }
    });

    // Net Operating Profit = (Gross Profit dari Penjualan Mesin + Komisi Lainnya) - Beban Operasional
    const netOperatingProfit = totalDealsGrossProfit + totalCommissions - totalExpenses;
    const netInvestorPosition = totalInvestorInflow - totalInvestorOutflow;

    return NextResponse.json({
      success: true,
      entries,
      deals: bbkDeals,
      summary: {
        totalDealsRevenue,
        totalDealsGrossProfit,
        totalCommissions,
        totalExpenses,
        netOperatingProfit,
        totalInvestorInflow,
        totalInvestorOutflow,
        netInvestorPosition,
        totalDealsCount: totalPhysicalUnits,
      },
    });
  } catch (error: any) {
    console.error('Cashflow API GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const authorName = session?.user?.name || session?.user?.email || 'Owner / Admin';

    const body = await req.json();
    const { tanggal, jenisKas, kategori, nominal, keterangan, referensiSku } = body;

    if (!tanggal || !jenisKas || !kategori || !nominal) {
      return NextResponse.json(
        { success: false, error: 'Tanggal, Jenis Kas, Kategori, dan Nominal wajib diisi' },
        { status: 400 }
      );
    }

    const result = await addCashflowEntry({
      tanggal,
      jenisKas: jenisKas as CashflowType,
      kategori,
      nominal: Number(nominal),
      keterangan: keterangan || '-',
      referensiSku: referensiSku || '',
      dicatatOleh: authorName,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: result.entry });
  } catch (error: any) {
    console.error('Cashflow API POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi wajib disertakan' }, { status: 400 });
    }

    const result = await deleteCashflowEntry(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Transaksi ${id} berhasil dihapus` });
  } catch (error: any) {
    console.error('Cashflow API DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
