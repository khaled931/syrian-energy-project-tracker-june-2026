const SOURCES = [
  {
    id: 'enab-baladi',
    name_ar: 'عنب بلدي',
    name_en: 'Enab Baladi',
    type: 'news',
    website: 'https://www.enabbaladi.net/',
    rss: 'https://www.enabbaladi.net/feed/'
  },
  {
    id: 'fews-net-syria',
    name_ar: 'FEWS NET سوريا',
    name_en: 'FEWS NET Syria',
    type: 'analysis',
    website: 'https://fews.net/middle-east-and-europe/syria',
    rss: 'https://fews.net/taxonomy/term/653/feed'
  },
  { id: 'pvknowhow', name_ar: 'PVKnowhow', name_en: 'PVKnowhow', type: 'news', website: 'https://www.pvknowhow.com/', rss: null },
  { id: 'spc', name_ar: 'الشركة السورية للبترول', name_en: 'Syrian Petroleum Company', type: 'official', website: 'https://spc.sy/', rss: null },
  { id: 'tde', name_ar: 'المؤسسة العامة لنقل وتوزيع الكهرباء', name_en: 'Public Establishment for Transmission and Distribution of Electricity', type: 'official', website: 'https://tde.gov.sy/', rss: null },
  { id: 'tenderom', name_ar: 'مناقصة سورية', name_en: 'Tenderom', type: 'tenders', website: 'https://www.tenderom.com/Default.aspx', rss: null },
  { id: 'worklink', name_ar: 'مناقصات ورك لينك', name_en: 'Worklink Tenders', type: 'tenders', website: 'https://worklink.sy/tenders', rss: null },
  { id: 'env-sy', name_ar: 'بيئة سورية', name_en: 'Syria Environment', type: 'news', website: 'https://env.sy/', rss: null },
  { id: 'syria-oil', name_ar: 'Syriaoil', name_en: 'Syriaoil', type: 'news', website: 'https://www.syria-oil.com/', rss: null }
];

const ENERGY_KEYWORDS = [
  { id: 'solar', ar: 'طاقة شمسية', en: 'Solar', words: ['solar', 'pv', 'photovoltaic', 'شمس', 'شمسي', 'كهروضوئي'] },
  { id: 'wind', ar: 'طاقة رياح', en: 'Wind', words: ['wind', 'رياح'] },
  { id: 'electricity', ar: 'كهرباء', en: 'Electricity', words: ['electricity', 'electric', 'grid', 'power', 'كهرباء', 'كهربائي', 'شبكة', 'محطة توليد'] },
  { id: 'oil', ar: 'نفط', en: 'Oil', words: ['oil', 'petroleum', 'crude', 'نفط', 'بترول'] },
  { id: 'gas', ar: 'غاز', en: 'Gas', words: ['gas', 'غاز'] },
  { id: 'water', ar: 'مياه/كهرومائية', en: 'Water/Hydro', words: ['water', 'hydro', 'dam', 'مياه', 'مائي', 'سد', 'ضخ'] },
  { id: 'fuel', ar: 'وقود', en: 'Fuel', words: ['fuel', 'diesel', 'gasoline', 'وقود', 'مازوت', 'بنزين'] },
  { id: 'tenders', ar: 'مناقصات', en: 'Tenders', words: ['tender', 'procurement', 'bid', 'مناقصة', 'عطاء', 'توريد'] }
];

const CITY_KEYWORDS = [
  { id: 'aleppo', ar: 'حلب', en: 'Aleppo', words: ['aleppo', 'حلب'] },
  { id: 'hama', ar: 'حماة', en: 'Hama', words: ['hama', 'حماة'] },
  { id: 'homs', ar: 'حمص', en: 'Homs', words: ['homs', 'حمص'] },
  { id: 'damascus', ar: 'دمشق', en: 'Damascus', words: ['damascus', 'دمشق'] },
  { id: 'rif-dimashq', ar: 'ريف دمشق', en: 'Rif Dimashq', words: ['rif dimashq', 'ريف دمشق', 'ghouta', 'غوطة'] },
  { id: 'idlib', ar: 'إدلب', en: 'Idlib', words: ['idlib', 'إدلب', 'ادلب'] },
  { id: 'tartous', ar: 'طرطوس', en: 'Tartous', words: ['tartous', 'طرطوس'] },
  { id: 'latakia', ar: 'اللاذقية', en: 'Latakia', words: ['latakia', 'اللاذقية'] },
  { id: 'deir-ez-zor', ar: 'دير الزور', en: 'Deir ez-Zor', words: ['deir ez-zor', 'deir ezzor', 'دير الزور'] },
  { id: 'raqqa', ar: 'الرقة', en: 'Raqqa', words: ['raqqa', 'الرقة'] },
  { id: 'hasakah', ar: 'الحسكة', en: 'Al-Hasakah', words: ['hasakah', 'الحسكة'] },
  { id: 'daraa', ar: 'درعا', en: 'Daraa', words: ['daraa', 'درعا'] },
  { id: 'sweida', ar: 'السويداء', en: 'As-Suwayda', words: ['sweida', 'suwayda', 'السويداء'] },
  { id: 'quneitra', ar: 'القنيطرة', en: 'Quneitra', words: ['quneitra', 'القنيطرة'] }
];

function decodeEntities(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function stripTags(value = '') {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extract(block, tag) {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  return decodeEntities(block.match(pattern)?.[1] || '').trim();
}

function extractAtomLink(block) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return decodeEntities(href || '').trim();
}

function itemBlocks(xml) {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi);
  if (itemMatches?.length) return itemMatches;
  return xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
}

function classify(text, dictionaries, fallback) {
  const lower = text.toLowerCase();
  return dictionaries.find((entry) => entry.words.some((word) => lower.includes(word.toLowerCase()))) || fallback;
}

function parseDate(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toISOString() : new Date().toISOString();
}

function parseFeed(xml, source) {
  return itemBlocks(xml).map((block, index) => {
    const title = stripTags(extract(block, 'title'));
    const link = stripTags(extract(block, 'link')) || extractAtomLink(block) || source.website;
    const rawSummary = extract(block, 'description') || extract(block, 'summary') || extract(block, 'content:encoded') || '';
    const summary = stripTags(rawSummary).slice(0, 260);
    const publishedAt = parseDate(extract(block, 'pubDate') || extract(block, 'published') || extract(block, 'updated') || extract(block, 'dc:date'));
    const text = `${title} ${summary}`;
    const energy = classify(text, ENERGY_KEYWORDS, { id: 'general', ar: 'عام', en: 'General' });
    const city = classify(text, CITY_KEYWORDS, { id: 'syria', ar: 'سوريا', en: 'Syria' });
    const safeId = `${source.id}-${publishedAt}-${index}`.replace(/[^a-z0-9_-]+/gi, '-');

    return {
      id: safeId,
      title,
      summary,
      url: link,
      publishedAt,
      source: { id: source.id, name_ar: source.name_ar, name_en: source.name_en, type: source.type, website: source.website },
      energy: { id: energy.id, ar: energy.ar, en: energy.en },
      city: { id: city.id, ar: city.ar, en: city.en }
    };
  }).filter((item) => item.title && item.url);
}

async function fetchFeed(source) {
  if (!source.rss) return { source, items: [], error: 'NO_RSS' };
  try {
    const response = await fetch(source.rss, {
      headers: {
        'User-Agent': 'SyrianRenewablesProjectNews/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(9000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    return { source, items: parseFeed(xml, source), error: null };
  } catch (error) {
    return { source, items: [], error: error instanceof Error ? error.message : 'FETCH_ERROR' };
  }
}

export default async function handler(request, response) {
  const limit = Math.min(Number(request.query.limit || 30), 80);
  const rssSources = SOURCES.filter((source) => source.rss);
  const results = await Promise.all(rssSources.map(fetchFeed));
  const items = results
    .flatMap((result) => result.items)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);

  response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  response.status(200).json({
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
    sources: SOURCES,
    feedStatus: results.map((result) => ({ source: result.source.id, count: result.items.length, error: result.error }))
  });
}
