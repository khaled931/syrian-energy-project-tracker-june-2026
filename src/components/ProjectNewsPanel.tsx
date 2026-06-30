import { useEffect, useMemo, useState } from 'react';
import '../styles/project-news.css';

type Language = 'ar' | 'en';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: { id: string; name_ar: string; name_en: string; type: string; website: string };
  energy: { id: string; ar: string; en: string };
  city: { id: string; ar: string; en: string };
}

interface NewsPayload {
  generatedAt: string;
  count: number;
  items: NewsItem[];
  sources: Array<{ id: string; name_ar: string; name_en: string; type: string; website: string; rss: string | null }>;
  feedStatus: Array<{ source: string; count: number; error: string | null }>;
}

const labels = {
  ar: {
    title: 'أخبار المشاريع',
    lead: 'تغذية تلقائية من مصادر RSS ومصادر قابلة للتوسيع لعرض أخبار مشاريع الطاقة والمياه والوقود في سوريا.',
    search: 'ابحث في الأخبار...',
    allSources: 'كل المصادر',
    allEnergy: 'كل أنواع الطاقة',
    allCities: 'كل المدن',
    refresh: 'تحديث',
    read: 'قراءة المصدر',
    source: 'المصدر',
    date: 'التاريخ',
    loading: 'جار تحميل الأخبار...',
    empty: 'لا توجد أخبار مطابقة حالياً.',
    auto: 'تلقائي',
    feed: 'مصادر RSS مفعّلة',
    lastUpdate: 'آخر تحديث'
  },
  en: {
    title: 'Project News',
    lead: 'Automatic feed from RSS and expandable sources for energy, water, and fuel project news in Syria.',
    search: 'Search news...',
    allSources: 'All sources',
    allEnergy: 'All energy types',
    allCities: 'All cities',
    refresh: 'Refresh',
    read: 'Read source',
    source: 'Source',
    date: 'Date',
    loading: 'Loading news...',
    empty: 'No matching news at the moment.',
    auto: 'Automatic',
    feed: 'RSS sources enabled',
    lastUpdate: 'Last update'
  }
};

function formatDate(value: string, language: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(language === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
}

function uniqueBy<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function labelPair(item: { ar?: string; en?: string; name_ar?: string; name_en?: string }, language: Language) {
  return language === 'ar' ? (item.ar || item.name_ar || item.en || item.name_en || '') : (item.en || item.name_en || item.ar || item.name_ar || '');
}

export default function ProjectNewsPanel({ language }: { language: Language }) {
  const t = labels[language];
  const [payload, setPayload] = useState<NewsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [energy, setEnergy] = useState('all');
  const [city, setCity] = useState('all');

  const loadNews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/project-news?limit=50');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPayload(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const items = payload?.items || [];
  const sources = payload?.sources || [];
  const energyOptions = uniqueBy(items.map((item) => item.energy));
  const cityOptions = uniqueBy(items.map((item) => item.city));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.source.name_ar} ${item.source.name_en} ${item.energy.ar} ${item.energy.en} ${item.city.ar} ${item.city.en}`.toLowerCase();
      return (!q || haystack.includes(q)) &&
        (source === 'all' || item.source.id === source) &&
        (energy === 'all' || item.energy.id === energy) &&
        (city === 'all' || item.city.id === city);
    });
  }, [items, query, source, energy, city]);

  const activeRss = payload?.feedStatus?.filter((feed) => !feed.error).length || 0;

  return (
    <section className="project-news-panel" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="news-hero-card">
        <div>
          <span className="news-eyebrow">{t.auto} · {activeRss} {t.feed}</span>
          <h2>{t.title}</h2>
          <p>{t.lead}</p>
        </div>
        <button type="button" onClick={loadNews}>{t.refresh}</button>
      </div>

      <div className="news-filters-card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="all">{t.allSources}</option>
          {sources.map((item) => <option key={item.id} value={item.id}>{language === 'ar' ? item.name_ar : item.name_en}</option>)}
        </select>
        <select value={energy} onChange={(event) => setEnergy(event.target.value)}>
          <option value="all">{t.allEnergy}</option>
          {energyOptions.map((item) => <option key={item.id} value={item.id}>{labelPair(item, language)}</option>)}
        </select>
        <select value={city} onChange={(event) => setCity(event.target.value)}>
          <option value="all">{t.allCities}</option>
          {cityOptions.map((item) => <option key={item.id} value={item.id}>{labelPair(item, language)}</option>)}
        </select>
      </div>

      {loading && <p className="news-state-card">{t.loading}</p>}
      {error && <p className="news-state-card news-error">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="news-state-card">{t.empty}</p>}

      <div className="project-news-grid">
        {filtered.map((item) => (
          <article className="project-news-card" key={item.id}>
            <div className="news-card-top">
              <span>{labelPair(item.energy, language)}</span>
              <time>{formatDate(item.publishedAt, language)}</time>
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div className="news-card-meta">
              <span>{t.source}: {language === 'ar' ? item.source.name_ar : item.source.name_en}</span>
              <span>{language === 'ar' ? item.city.ar : item.city.en}</span>
            </div>
            <a href={item.url} target="_blank" rel="noreferrer">{t.read}</a>
          </article>
        ))}
      </div>

      {payload?.generatedAt && <small className="news-updated">{t.lastUpdate}: {formatDate(payload.generatedAt, language)}</small>}
    </section>
  );
}
