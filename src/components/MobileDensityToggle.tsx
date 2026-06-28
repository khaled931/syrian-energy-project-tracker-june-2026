import { useEffect, useState } from 'react';
import '../styles/mobile-density.css';
import '../styles/mobile-header-filter.css';

const STORAGE_KEY = 'sr-mobile-density';

export default function MobileDensityToggle() {
  const [compact, setCompact] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'comfort');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-mobile-compact', compact);
    root.classList.toggle('sr-mobile-comfort', !compact);
    localStorage.setItem(STORAGE_KEY, compact ? 'compact' : 'comfort');
  }, [compact]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-filter-open', filtersOpen);
    document.body.classList.toggle('sr-filter-lock', filtersOpen);
    return () => {
      root.classList.remove('sr-filter-open');
      document.body.classList.remove('sr-filter-lock');
    };
  }, [filtersOpen]);

  return (
    <>
      <button
        className="mobile-density-floating"
        type="button"
        onClick={() => setCompact((value) => !value)}
        aria-label={compact ? 'تكبير الكروت' : 'تصغير الكروت'}
        title={compact ? 'تكبير الكروت' : 'تصغير الكروت'}
      >
        <span className="density-symbol" aria-hidden="true">{compact ? '⌕+' : '⌕−'}</span>
      </button>

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
