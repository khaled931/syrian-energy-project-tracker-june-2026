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

function findProjectForCard(card: HTMLElement, projects: Project[]) {
  const title = cleanText(card.querySelector('h3')?.textContent || '');
  if (!title) return undefined;
  return projects.find((project) => cleanText(project.title_ar) === title || cleanText(project.title_en) === title);
}

function upsertMeta(card: HTMLElement, project?: Project) {
  let meta = card.querySelector<HTMLDivElement>('.sr-card-main-meta');
  if (!meta) {
    meta = document.createElement('div');
    meta.className = 'sr-card-main-meta';
    const h3 = card.querySelector('h3');
    h3?.insertAdjacentElement('afterend', meta);
  }

  const energyText = cleanText(card.querySelector('.card-pills span')?.textContent || '');
  const cityText = project ? cleanText(project.city_ar || project.city_en || project.governorate) : '';
  const capacityText = project ? cleanText(project.capacity) : '';

  meta.textContent = '';

  if (energyText) {
    const energy = document.createElement('span');
    energy.className = 'sr-card-energy-name';
    energy.textContent = energyText;
    meta.appendChild(energy);
  }

  if (cityText) {
    const city = document.createElement('span');
    city.className = 'sr-card-city';
    city.textContent = cityText;
    meta.appendChild(city);
  }

  if (capacityText) {
    const capacity = document.createElement('span');
    capacity.className = 'sr-card-capacity-inline';
    capacity.textContent = capacityText;
    meta.appendChild(capacity);
  }
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
    const decorateCards = () => {
      document.querySelectorAll<HTMLElement>('.modern-project-card').forEach((card) => {
        const project = findProjectForCard(card, projects);
        const firstPill = card.querySelector('.card-pills span');
        const energyText = firstPill?.textContent ?? card.textContent ?? '';
        card.dataset.energySymbol = getEnergySymbol(energyText);
        upsertMeta(card, project);
      });
    };
    decorateCards();
    const observer = new MutationObserver(decorateCards);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [projects]);

  const toggleLanguage = () => {
    const select = document.querySelector('.language-control select') as HTMLSelectElement | null;
    if (!select) return;
    const next = select.value === 'ar' ? 'en' : 'ar';
    triggerSelectChange(select, next);
    setLangLabel(next === 'ar' ? 'EN' : 'عرب');
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
