import { useEffect, useState } from 'react';
import '../styles/mobile-density.css';

const STORAGE_KEY = 'sr-mobile-density';

export default function MobileDensityToggle() {
  const [compact, setCompact] = useState(() => localStorage.getItem(STORAGE_KEY) !== 'comfort');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('sr-mobile-compact', compact);
    root.classList.toggle('sr-mobile-comfort', !compact);
    localStorage.setItem(STORAGE_KEY, compact ? 'compact' : 'comfort');
  }, [compact]);

  return (
    <button
      className="mobile-density-floating"
      type="button"
      onClick={() => setCompact((value) => !value)}
      aria-label={compact ? 'تكبير الكروت' : 'تصغير الكروت'}
    >
      <span>{compact ? 'تكبير' : 'تصغير'}</span>
      <small>{compact ? 'الكروت' : 'الكروت'}</small>
    </button>
  );
}
