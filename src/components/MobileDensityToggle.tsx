import { useEffect, useState } from 'react';
import type { Project } from '../types/project';
import { getPublishedProjects } from '../services/projectService';
import { getFirebaseProjects, useFirebaseData } from '../services/firebaseProjectService';
import '../styles/mobile-density.css';
import '../styles/mobile-header-filter.css';
import '../styles/card-energy-symbols.css';
import '../styles/simple-project-card.css';

const STORAGE_KEY = 'sr-mobile-density';
const THEME_KEY = 'sr-theme-mode';

function triggerSelectChange(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
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

function findProjectForCard(card: HTMLElement, projects: Project[]) {
  const title = cleanText(card.querySelector('h3')?.textContent || '');
  if (!title) return undefined;
  return projects.find((project) => cleanText(project.title_ar) === title || cleanText(project.title_en) === title);
}

function buildMetaHtml(card: HTMLElement, project?: Project) {
  const energyText = cleanText(card.querySelector('.card-pills span')?.textContent || '');
  const cityText = project ? cleanText(project.city_ar || project.city_en || project.governorate) : '';
  const capacityText = project ? cleanText(project.capacity) : '';
  const parts: string[] = [];

  if (energyText) parts.push(`<span class="sr-card-energy-name">${escapeHtml(energyText)}</span>`);
  if (cityText) parts.push(`<span class="sr-card-city">${escapeHtml(cityText)}</span>`);
  if (capacityText) parts.push(`<span class="sr-card-capacity-inline">${escapeHtml(capacityText)}</span>`);

  return parts.join('');
}

function decorateVisibleCards(projects: Project[]) {
  document.querySelectorAll<HTMLElement>('.modern-project-card').forEach((card) => {
    const project = findProjectForCard(card, projects);
    const firstPill = card.querySelector('.card-pills span');
    const energyText = firstPill?.textContent ?? card.textContent ?? '';
    const symbol = getEnergySymbol(energyText);
    if (card.dataset.energySymbol !== symbol) card.dataset.energySymbol = symbol;

    const html = buildMetaHtml(card, project);
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
}

export default function MobileDensityToggle() {
  const [compact, setCompact] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'comfort');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [langLabel, setLangLabel] = useState('EN');
  const [projects, setProjects] = useState<Project[]>([]);

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
      const select = document.querySelector('.language-control select') as HTMLSelectElement | null;
      setLangLabel(select?.value === 'ar' ? 'EN' : 'عرب');
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
        if (!cancelled && current === runId) decorateVisibleCards(projects);
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
  }, [projects]);

  const toggleLanguage = () => {
    const select = document.querySelector('.language-control select') as HTMLSelectElement | null;
    if (!select) return;
    const next = select.value === 'ar' ? 'en' : 'ar';
    triggerSelectChange(select, next);
    setLangLabel(next === 'ar' ? 'EN' : 'عرب');
    window.setTimeout(() => decorateVisibleCards(projects), 120);
  };

  return (
    <>
      <div className="mobile-header-tools" aria-label="أدوات العرض">
        <button type="button" onClick={toggleLanguage} aria-label="تبديل اللغة" title="تبديل اللغة">{langLabel}</button>
        <button type="button" onClick={() => setDark((value) => !value)} aria-label="تبديل الوضع الداكن والفاتح" title="داكن / فاتح">{dark ? '☀' : '☾'}</button>
      </div>

      <div className="mobile-density-controls" aria-label="تكبير وتصغير الكروت">
        <button type="button" onClick={() => setCompact(true)} aria-label="تصغير الكروت" title="تصغير الكروت">−</button>
        <button type="button" onClick={() => setCompact(false)} aria-label="تكبير الكروت" title="تكبير الكروت">+</button>
      </div>

      <button
        className={`mobile-filter-floating ${filtersOpen ? 'is-open' : ''}`}
        type="button"
        onClick={() => setFiltersOpen((value) => !value)}
        aria-label={filtersOpen ? 'إغلاق الفلاتر' : 'فتح البحث والفلاتر'}
        title={filtersOpen ? 'إغلاق الفلاتر' : 'فتح البحث والفلاتر'}
      >
        <span aria-hidden="true">{filtersOpen ? '×' : '☰'}</span>
        <small>{filtersOpen ? 'إغلاق' : 'فلترة'}</small>
      </button>

      <button
        className="mobile-filter-overlay"
        type="button"
        aria-label="إغلاق الفلاتر"
        onClick={() => setFiltersOpen(false)}
      />
    </>
  );
}
