import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'combi oven bekas';
    const lang = searchParams.get('lang') || 'id';

    const googleSuggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=${lang}&gl=${lang}`;
    const ddgSuggestUrl = `https://ac.duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`;

    let googleKeywords: string[] = [];
    let ddgKeywords: string[] = [];

    // 1. Fetch Google Suggest Live (Google Indonesia)
    try {
      const gRes = await fetch(googleSuggestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 3600 },
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        if (Array.isArray(gData) && Array.isArray(gData[1])) {
          googleKeywords = gData[1].map((s: any) => String(s).trim());
        }
      }
    } catch (gErr) {
      console.warn('Google suggest fetch error:', gErr);
    }

    // 2. Fetch DuckDuckGo Suggest Live
    try {
      const dRes = await fetch(ddgSuggestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 3600 },
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        if (Array.isArray(dData) && Array.isArray(dData[1])) {
          ddgKeywords = dData[1].map((s: any) => String(s).trim());
        }
      }
    } catch (dErr) {
      console.warn('DuckDuckGo suggest fetch error:', dErr);
    }

    // Deduplicate and classify with real linguistic intent
    const uniqueKeywords = Array.from(new Set([...googleKeywords, ...ddgKeywords]));

    const enriched = uniqueKeywords.map((kw) => {
      const lower = kw.toLowerCase();
      let intent: 'COMMERCIAL' | 'INFORMATIONAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL' = 'COMMERCIAL';
      let typeDesc = 'Investigasi Pembelian Alat Resto';

      if (
        lower.includes('cara') ||
        lower.includes('tips') ||
        lower.includes('panduan') ||
        lower.includes('perbedaan') ||
        lower.includes('fungsi') ||
        lower.includes('review')
      ) {
        intent = 'INFORMATIONAL';
        typeDesc = 'Panduan & Edukasi Teknis';
      } else if (
        lower.includes('beli') ||
        lower.includes('jual') ||
        lower.includes('harga') ||
        lower.includes('murah') ||
        lower.includes('promo') ||
        lower.includes('sewa')
      ) {
        intent = 'TRANSACTIONAL';
        typeDesc = 'Siap Transaksi / Inquiry WhatsApp';
      } else if (
        lower.includes('rational') ||
        lower.includes('nayati') ||
        lower.includes('hoshizaki') ||
        lower.includes('unox') ||
        lower.includes('marzocco') ||
        lower.includes('berjaya')
      ) {
        intent = 'NAVIGATIONAL';
        typeDesc = 'Pencarian Merek Spesifik';
      }

      const source = googleKeywords.includes(kw) ? 'Google Indonesia (Live)' : 'DuckDuckGo (Live)';

      return {
        keyword: kw,
        intent,
        typeDesc,
        source,
      };
    });

    return NextResponse.json({
      query,
      total: enriched.length,
      suggestions: enriched,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch search suggestions' }, { status: 500 });
  }
}
