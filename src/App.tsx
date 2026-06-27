import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Globe2, Home, Moon, Search, Sun, X } from 'lucide-react';
import AdminDashboard from './admin/AdminDashboard';
import type { Language, Project, Theme } from './types/project';
import { getAllProjects, getMetadata, getProjectUpdates, getPublishedProjects } from './services/projectService';

const allProjects = getAllProjects();
const publicProjects = getPublishedProjects();
const metadata = getMetadata();

const labels = {
  ar: {
    platform: 'بوابة الطاقة المتجددة في سوريا',
    title: 'متتبع مشاريع الطاقة في سوريا',
    subtitle: 'لوحة بيانات تفاعلية لرصد مشاريع الطاقة، التوليد، الشبكات، التخزين، وإعادة التأهيل في سوريا.',
    search: 'ابحث عن مشروع أو مدينة أو جهة...',
    all: 'الكل',
    governorate: 'المحافظة',
    energy: 'نوع الطاقة',
    status: 'الحالة',
    projectType: 'نوع المشروع',
    projects: 'المشاريع',
    capacity: 'القدرة',
    location: 'الموقع',
    details: 'عرض التفاصيل',
    source: 'المصدر',
    timeline: 'تابع أين وصل المشروع',
    admin: 'لوحة الإدارة',
    home: 'الرئيسية',
    close: 'إغلاق',
    owner: 'المالك',
    developer: 'المنفذ',
    partners: 'الشركاء',
    expectedCod: 'موعد التشغيل المتوقع',
    estimatedCost: 'الكلفة التقديرية',
    grid: 'الربط الشبكي',
    risks: 'المخاطر الرئيسية',
    noResults: 'لا توجد مشاريع مطابقة للفلاتر الحالية.'
  },
  en: {
    platform: 'Syrian Renewables',
    title: 'Syrian Energy Project Tracker',
    subtitle: 'An interactive data dashboard for tracking energy, generation, grid, storage, and rehabilitation projects in Syria.',
    search: 'Search by project, city, or organization...',
    all: 'All',
    governorate: 'Governorate',
    energy: 'Energy type',
    status: 'Status',
    projectType: 'Project type',
    projects: 'Projects',
    capacity: 'Capacity',
    location: 'Location',
    details: 'View details',
    source: 'Source',
    timeline: 'Project timeline',
    admin: 'Admin dashboard',
    home: 'Home',
    close: 'Close',
    owner: 'Owner',
    developer: 'Developer',
    partners: 'Partners',
    expectedCod: 'Expected COD',
    estimatedCost: 'Estimated cost',
    grid: 'Grid connection',
    risks: 'Key risks',
    noResults: 'No projects match the current filters.'
  }
};

function getLabel(items: { id: string; ar: string; en: string }[], id: string, lang: Language) {
  return items.find((item) => item.id === id)?.[lang] ?? id;
}

function getMapUrl(project: Project) {
  const delta = 0.08;
  const minLon = project.longitude - delta;
  const minLat = project.latitude - delta;
  const maxLon = project.longitude + delta;
  const maxLat = project.latitude + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${project.latitude}%2C${project.longitude}`;
}

function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('light');
  const [route, setRoute] = useState(window.location.hash);
  const [query, setQuery] = useState('');
  const [governorate, setGovernorate] = useState('all');
  const [energyType, setEnergyType] = useState('all');
  const [status, setStatus] = useState('all');
  const [projectType, setProjectType] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const t = labels[language];
  const isAdmin = route === '#admin';
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  const filteredProjects = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return publicProjects
      .filter((project) => governorate === 'all' || project.governorate === governorate)
      .filter((project) => energyType === 'all' || project.energy_type === energyType)
      .filter((project) => status === 'all' || project.status === status)
      .filter((project) => projectType === 'all' || project.project_type === projectType)
      .filter((project) => {
        if (!lowerQuery) return true;
        const searchText = [
          project.title_ar,
          project.title_en,
          project.description_ar,
          project.description_en,
          project.city_ar,
          project.city_en,
          project.owner,
          project.developer
        ].join(' ').toLowerCase();
        return searchText.includes(lowerQuery);
      });
  }, [query, governorate, energyType, status, projectType]);

  const selectedUpdates = useMemo(() => {
    if (!selectedProject) return [];
    return getProjectUpdates(selectedProject.id);
  }, [selectedProject]);

  return (
    <main className={`app ${theme}`} dir={direction}>
      <header className="topbar glass">
        <div>
          <span className="eyebrow">{t.platform}</span>
          <h1>{t.title}</h1>
        </div>
        <div className="actions">
          <a className="admin-link" href={isAdmin ? '#' : '#admin'}>
            {isAdmin ? <Home size={18} /> : null} {isAdmin ? t.home : t.admin}
          </a>
          <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
            <Globe2 size={18} /> {language === 'ar' ? 'EN' : 'AR'}
          </button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {isAdmin ? (
        <AdminDashboard language={language} projects={allProjects} metadata={metadata} />
      ) : (
        <>
          <section className="hero glass">
            <div>
              <span className="eyebrow">Data platform</span>
              <h2>{t.title}</h2>
              <p>{t.subtitle}</p>
            </div>
            <div className="stat-card">
              <strong>{filteredProjects.length}</strong>
              <span>{t.projects}</span>
            </div>
          </section>

          <section className="filters glass">
            <label className="search-box">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
            </label>
            <select value={governorate} onChange={(event) => setGovernorate(event.target.value)}>
              <option value="all">{t.governorate}: {t.all}</option>
              {metadata.governorates.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
            </select>
            <select value={energyType} onChange={(event) => setEnergyType(event.target.value)}>
              <option value="all">{t.energy}: {t.all}</option>
              {metadata.energyTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">{t.status}: {t.all}</option>
              {metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
            </select>
            <select value={projectType} onChange={(event) => setProjectType(event.target.value)}>
              <option value="all">{t.projectType}: {t.all}</option>
              {metadata.projectTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
            </select>
          </section>

          <section className="project-grid">
            {filteredProjects.map((project) => (
              <article className="project-card glass" key={project.id} onClick={() => setSelectedProject(project)}>
                <div className="card-header">
                  <span>{getLabel(metadata.energyTypes, project.energy_type, language)}</span>
                  <small>{getLabel(metadata.statuses, project.status, language)}</small>
                </div>
                <h3>{language === 'ar' ? project.title_ar : project.title_en}</h3>
                <p>{language === 'ar' ? project.description_ar : project.description_en}</p>
                <div className="card-meta">
                  <span>{t.location}: {language === 'ar' ? project.city_ar : project.city_en}</span>
                  <span>{t.capacity}: {project.capacity}</span>
                </div>
                <button>{t.details}</button>
              </article>
            ))}
          </section>
          {filteredProjects.length === 0 && <p className="empty glass">{t.noResults}</p>}
        </>
      )}

      {selectedProject && (
        <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
          <section className="modal glass" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setSelectedProject(null)}><X size={18} /> {t.close}</button>
            <h2>{language === 'ar' ? selectedProject.title_ar : selectedProject.title_en}</h2>
            <p>{language === 'ar' ? selectedProject.description_ar : selectedProject.description_en}</p>

            <div className="detail-grid">
              <span>{t.owner}: {selectedProject.owner}</span>
              <span>{t.developer}: {selectedProject.developer}</span>
              <span>{t.partners}: {selectedProject.partners}</span>
              <span>{t.expectedCod}: {selectedProject.expected_cod}</span>
              <span>{t.estimatedCost}: {selectedProject.estimated_cost}</span>
              <span>{t.grid}: {selectedProject.grid_connection}</span>
              <span>{t.risks}: {selectedProject.key_risks}</span>
            </div>

            <div className="map-wrap">
              <iframe
                title={language === 'ar' ? selectedProject.title_ar : selectedProject.title_en}
                src={getMapUrl(selectedProject)}
                loading="lazy"
              />
            </div>

            <h3>{t.timeline}</h3>
            <div className="timeline">
              {selectedUpdates.map((update) => (
                <div className="timeline-item" key={update.id}>
                  <time>{update.update_date}</time>
                  <strong>{language === 'ar' ? update.title_ar : update.title_en}</strong>
                  <p>{language === 'ar' ? update.description_ar : update.description_en}</p>
                </div>
              ))}
            </div>

            <a className="source-button" href={selectedProject.source_url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> {t.source}: {selectedProject.source_name}
            </a>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
