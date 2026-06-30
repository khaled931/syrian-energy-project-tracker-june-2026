import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Project } from '../types/project';
import { getPublishedProjects } from '../services/projectService';
import { getFirebaseProjects, useFirebaseData } from '../services/firebaseProjectService';
import ProjectNewsPanel from './ProjectNewsPanel';
import '../styles/mobile-density.css';
import '../styles/mobile-header-filter.css';
import '../styles/card-energy-symbols.css';
import '../styles/simple-project-card.css';
import '../styles/project-share-sheet.css';

const STORAGE_KEY = 'sr-mobile-density';
const THEME_KEY = 'sr-theme-mode';

type UiLanguage = 'ar' | 'en';

const governorateLabels: Record<string, { ar: string; en: string }> = {
  'aleppo': { ar: 'حلب', en: 'Aleppo' }, 'حلب': { ar: 'حلب', en: 'Aleppo' },
  'hama': { ar: 'حماة', en: 'Hama' }, 'حماة': { ar: 'حماة', en: 'Hama' },
  'homs': { ar: 'حمص', en: 'Homs' }, 'حمص': { ar: 'حمص', en: 'Homs' },
  'damascus': { ar: 'دمشق', en: 'Damascus' }, 'دمشق': { ar: 'دمشق', en: 'Damascus' },
  'rif-dimashq': { ar: 'ريف دمشق', en: 'Rif Dimashq' }, 'ريف دمشق': { ar: 'ريف دمشق', en: 'Rif Dimashq' },
  'idlib': { ar: 'إدلب', en: 'Idlib' }, 'إدلب': { ar: 'إدلب', en: 'Idlib' },
  'tartous': { ar: 'طرطوس', en: 'Tartous' }, 'طرطوس': { ar: 'طرطوس', en: 'Tartous' },
  'latakia': { ar: 'اللاذقية', en: 'Latakia' }, 'اللاذقية': { ar: 'اللاذقية', en: 'Latakia' },
  'deir-ez-zor': { ar: 'دير الزور', en: 'Deir ez-Zor' }, 'دير الزور': { ar: 'دير الزور', en: 'Deir ez-Zor' },
  'raqqa': { ar: 'الرقة', en: 'Raqqa' }, 'الرقة': { ar: 'الرقة', en: 'Raqqa' },
  'hasakah': { ar: 'الحسكة', en: 'Al-Hasakah' }, 'الحسكة': { ar: 'الحسكة', en: 'Al-Hasakah' },
  'daraa': { ar: 'درعا', en: 'Daraa' }, 'درعا': { ar: 'درعا', en: 'Daraa' },
  'sweida': { ar: 'السويداء', en: 'As-Suwayda' }, 'السويداء': { ar: 'السويداء', en: 'As-Suwayda' },
  'quneitra': { ar: 'القنيطرة', en: 'Quneitra' }, 'القنيطرة': { ar: 'القنيطرة', en: 'Quneitra' }
};

function triggerSelectChange(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function hasArabic(value?: string) {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

function getEnergySymbol(text: string) {
  const value = text.toLowerCase();
  if (value.includes('شمس') || value.includes('solar')) return '☀';
  if (value.includes('رياح') || value.includes('wind')) return '⌁';
  if (value.includes('مياه') || value.includes('مائية') || value.includes('hydro') || value.includes('water')) return '≈';
  if (value.includes('كهرب') || value.includes('grid') || value.includes('electric')) return '⚡';
  if (value.includes('نفط') || value.includes('oil')) return '◔';
  if (value.includes('غاز') || value.includes('gas')) return '△';
  if (value.includes('بطار') || value.includes('battery') || value.includes('storage')) return '▰';
  return '◆';
}

function cleanText(value?: string) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
}

function getActiveLanguage(): UiLanguage {
  const select = document.querySelector('.language-control select') as HTMLSelectElement | null;
  return select?.value === 'en' ? 'en' : 'ar';
}

function projectTitle(project: Project, language: UiLanguage) {
  return language === 'ar' ? cleanText(project.title_ar || project.title_en) : cleanText(project.title_en || project.title_ar);
}

function cityLabel(project: Project, language: UiLanguage) {
  const direct = language === 'ar' ? project.city_ar : project.city_en;
  if (direct && (language === 'ar' || !hasArabic(direct))) return cleanText(direct);
  const keys = [project.governorate, project.city_ar, project.city_en].map(cleanText).filter(Boolean);
  for (const key of keys) {
    const label = governorateLabels[key] || governorateLabels[key.toLowerCase()];
    if (label) return label[language];
  }
  const fallback = cleanText(project.governorate || project.city_en || project.city_ar);
  return language === 'en' && hasArabic(fallback) ? 'Syria' : fallback;
}

function projectShareUrl(project: Project) {
  return `${window.location.origin}${window.location.pathname}#${encodeURIComponent(project.slug || project.id)}`;
}

function findProjectByTitle(title: string, projects: Project[]) {
  const normalized = cleanText(title);
  return projects.find((project) => cleanText(project.title_ar) === normalized || cleanText(project.title_en) === normalized);
}

function findProjectForCard(card: HTMLElement, projects: Project[]) {
  return findProjectByTitle(card.querySelector('h3')?.textContent || '', projects);
}

function findCurrentDetailProject(projects: Project[]) {
  const title = document.querySelector('.detail-content-card h2')?.textContent || '';
  return findProjectByTitle(title, projects);
}

function buildMetaHtml(card: HTMLElement, project: Project | undefined, language: UiLanguage) {
  const energyText = cleanText(card.querySelector('.card-pills span')?.textContent || '');
  const cityText = project ? cityLabel(project, language) : '';
  const capacityText = project ? cleanText(project.capacity) : '';
  const parts: string[] = [];
  if (energyText) parts.push(`<span class="sr-card-energy-name">${escapeHtml(energyText)}</span>`);
  if (cityText) parts.push(`<span class="sr-card-city">${escapeHtml(cityText)}</span>`);
  if (capacityText) parts.push(`<span class="sr-card-capacity-inline">${escapeHtml(capacityText)}</span>`);
  return parts.join('');
}

function decorateDetailLocation(projects: Project[], language: UiLanguage) {
  const project = findCurrentDetailProject(projects);
  const location = document.querySelector<HTMLElement>('.detail-location strong');
  if (!project || !location) return;
  const next = language === 'ar' ? `${cityLabel(project, 'ar')} – سوريا` : `${cityLabel(project, 'en')}, Syria`;
  if (location.textContent !== next) location.textContent = next;
}

function decorateVisibleCards(projects: Project[], language: UiLanguage) {
  document.querySelectorAll<HTMLElement>('.modern-project-card').forEach((card) => {
    const project = findProjectForCard(card, projects);
    const firstPill = card.querySelector('.card-pills span');
    const energyText = firstPill?.textContent ?? card.textContent ?? '';
    const symbol = getEnergySymbol(energyText);
    if (card.dataset.energySymbol !== symbol) card.dataset.energySymbol = symbol;
    const html = buildMetaHtml(card, project, language);
    let meta = card.querySelector<HTMLDivElement>('.sr-card-main-meta');
    if (!meta) {
      meta = document.createElement('div');
      meta.className = 'sr-card-main-meta';
      card.querySelector('h3')?.insertAdjacentElement('afterend', meta);
    }
    if (meta.dataset.rendered !== html) {
      meta.innerHTML = html;
      meta.dataset.rendered = html;
    }
  });
  decorateDetailLocation(projects, language);
}

function openProjectFromHash(projects: Project[]) {
  const slug = decodeURIComponent(window.location.hash.replace('#', '') || '');
  if (!slug || slug === 'admin' || document.querySelector('.project-details-page')) return;
  const project = projects.find((item) => item.slug === slug || item.id === slug);
  if (!project) return;
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.modern-project-card'));
  const card = cards.find((item) => findProjectForCard(item, projects)?.id === project.id);
  card?.click();
}

export default function MobileDensityToggle() {
  const [compact, setCompact] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'comfort');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [langLabel, setLangLabel] = useState('EN');
  const [activeLanguage, setActiveLanguage] = useState<UiLanguage>('ar');
  const [projects, setProjects] = useState<Project[]>([]);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [showNews, setShowNews] = useState(false);
  const [tabHost, setTabHost] = useState<HTMLElement | null>(null);
  const [pageHost, setPageHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-mobile-compact', compact);
    root.classList.toggle('sr-mobile-comfort', !compact);
    localStorage.setItem(STORAGE_KEY, compact ? 'compact' : 'comfort');
  }, [compact]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-dark-theme', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-filter-open', filtersOpen);
    document.body.classList.toggle('sr-filter-lock', filtersOpen);
    return () => {
      root.classList.remove('sr-filter-open');
      document.body.classList.remove('sr-filter-lock');
    };
  }, [filtersOpen]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-news-open', showNews);
    return () => root.classList.remove('sr-news-open');
  }, [showNews]);

  useEffect(() => {
    let ok = true;
    async function loadProjects() {
      try {
        const data = useFirebaseData ? await getFirebaseProjects() : getPublishedProjects();
        if (ok) setProjects(data.filter((project) => project.is_published !== false));
      } catch {
        if (ok) setProjects(getPublishedProjects());
      }
    }
    loadProjects();
    return () => { ok = false; };
  }, []);

  useEffect(() => {
    const syncLabel = () => {
      const language = getActiveLanguage();
      setActiveLanguage(language);
      setLangLabel(language === 'ar' ? 'EN' : 'عرب');
    };
    syncLabel();
    const interval = window.setInterval(syncLabel, 800);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let runId = 0;
    const run = () => {
      const current = ++runId;
      window.setTimeout(() => {
        if (!cancelled && current === runId) {
          decorateVisibleCards(projects, activeLanguage);
          openProjectFromHash(projects);
          const tabs = document.querySelector<HTMLElement>('.modern-tabs');
          const page = document.querySelector<HTMLElement>('.tracker-page');
          setTabHost(tabs);
          setPageHost(page);
          tabs?.classList.add('sr-has-news-tab');
        }
      }, 80);
    };
    run();
    const root = document.querySelector('.tracker-page');
    const observer = root ? new MutationObserver(run) : null;
    observer?.observe(root as Node, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [projects, activeLanguage]);

  useEffect(() => {
    const handleExistingTabClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('.modern-tabs button') as HTMLElement | null;
      if (button && !button.classList.contains('sr-news-tab')) setShowNews(false);
    };
    document.addEventListener('click', handleExistingTabClick, true);
    return () => document.removeEventListener('click', handleExistingTabClick, true);
  }, []);

  useEffect(() => {
    const handleShareClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button, a') as HTMLElement | null;
      if (!button) return;
      const text = cleanText(button.textContent || '').toLowerCase();
      if (!text.includes('مشاركة') && !text.includes('share')) return;
      const card = button.closest('.modern-project-card') as HTMLElement | null;
      const project = card ? findProjectForCard(card, projects) : findCurrentDetailProject(projects);
      if (!project) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setShareProject(project);
      setFiltersOpen(false);
      setShowNews(false);
    };
    document.addEventListener('click', handleShareClick, true);
    return () => document.removeEventListener('click', handleShareClick, true);
  }, [projects]);

  const toggleLanguage = () => {
    const select = document.querySelector('.language-control select') as HTMLSelectElement | null;
    if (!select) return;
    const next = select.value === 'ar' ? 'en' : 'ar';
    triggerSelectChange(select, next);
    setActiveLanguage(next);
    setLangLabel(next === 'ar' ? 'EN' : 'عرب');
    window.setTimeout(() => decorateVisibleCards(projects, next), 120);
  };

  const shareTitle = shareProject ? projectTitle(shareProject, activeLanguage) : '';
  const shareUrl = shareProject ? projectShareUrl(shareProject) : '';
  const shareText = activeLanguage === 'ar' ? `مشروع من منصة بوابة الطاقة المتجددة في سوريا: ${shareTitle}` : `Project from Syrian Renewables: ${shareTitle}`;
  const newsTabLabel = activeLanguage === 'ar' ? 'أخبار المشاريع' : 'Project news';

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  };

  const nativeShare = async () => {
    if (!shareProject || !navigator.share) {
      await copyLink();
      return;
    }
    await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=820,height=680');
  };

  return (
    <>
      {tabHost && createPortal(
        <button className={`tab outline sr-news-tab ${showNews ? 'active' : ''}`} type="button" onClick={() => { setShowNews(true); setFiltersOpen(false); }}>
          {newsTabLabel}
        </button>,
        tabHost
      )}

      {showNews && pageHost && createPortal(<ProjectNewsPanel language={activeLanguage} />, pageHost)}

      <div className="mobile-header-tools" aria-label="أدوات العرض">
        <button type="button" onClick={toggleLanguage} aria-label="تبديل اللغة" title="تبديل اللغة">{langLabel}</button>
        <button type="button" onClick={() => setDark((value) => !value)} aria-label="تبديل الوضع الداكن والفاتح" title="داكن / فاتح">{dark ? '☀' : '☾'}</button>
      </div>

      <div className="mobile-density-controls" aria-label="تكبير وتصغير الكروت">
        <button type="button" onClick={() => setCompact(true)} aria-label="تصغير الكروت" title="تصغير الكروت">−</button>
        <button type="button" onClick={() => setCompact(false)} aria-label="تكبير الكروت" title="تكبير الكروت">+</button>
      </div>

      <button className={`mobile-filter-floating ${filtersOpen ? 'is-open' : ''}`} type="button" onClick={() => setFiltersOpen((value) => !value)} aria-label={filtersOpen ? 'إغلاق الفلاتر' : 'فتح البحث والفلاتر'} title={filtersOpen ? 'إغلاق الفلاتر' : 'فتح البحث والفلاتر'}>
        <span aria-hidden="true">{filtersOpen ? '×' : '☰'}</span>
        <small>{filtersOpen ? 'إغلاق' : 'فلترة'}</small>
      </button>

      <button className="mobile-filter-overlay" type="button" aria-label="إغلاق الفلاتر" onClick={() => setFiltersOpen(false)} />

      {shareProject && (
        <section className="project-share-sheet" role="dialog" aria-modal="true" aria-label={activeLanguage === 'ar' ? 'مشاركة المشروع' : 'Share project'}>
          <button className="share-backdrop" type="button" onClick={() => setShareProject(null)} aria-label="Close" />
          <div className="share-card">
            <button className="share-close" type="button" onClick={() => setShareProject(null)}>×</button>
            <span className="share-eyebrow">{activeLanguage === 'ar' ? 'مشاركة المشروع' : 'Share this project'}</span>
            <h3>{shareTitle}</h3>
            <p>{activeLanguage === 'ar' ? 'اختر منصة المشاركة. سيتم مشاركة رابط هذا المشروع فقط.' : 'Choose a platform. Only this project link will be shared.'}</p>
            <div className="share-actions-grid">
              <button type="button" onClick={nativeShare}>↗ {activeLanguage === 'ar' ? 'مشاركة الهاتف' : 'Native share'}</button>
              <button type="button" onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}>f Facebook</button>
              <button type="button" onClick={() => openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)}>in LinkedIn</button>
              <button type="button" onClick={() => openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}>𝕏 / Twitter</button>
              <button type="button" onClick={() => openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`)}>WhatsApp</button>
              <button type="button" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`; }}>Email</button>
              <button type="button" onClick={copyLink}>⧉ {activeLanguage === 'ar' ? 'نسخ الرابط' : 'Copy link'}</button>
            </div>
            <small>{activeLanguage === 'ar' ? 'ملاحظة: مشاركة إنستغرام تظهر عادة ضمن زر مشاركة الهاتف إذا كان التطبيق مثبتاً.' : 'Note: Instagram usually appears under Native Share if the app is installed.'}</small>
          </div>
        </section>
      )}
    </>
  );
}
