import { useMemo, useState } from 'react';
import { ExternalLink, Globe2, Moon, Search, Sun, X } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Language, Metadata, Project, ProjectUpdate, Theme } from './types/project';
import projectsData from '../data/projects.json';
import updatesData from '../data/project-updates.json';
import metadataData from '../data/metadata.json';

const projects = projectsData as Project[];
const updates = updatesData as ProjectUpdate[];
const metadata = metadataData as Metadata;

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
    adminNote: 'هذه لوحة إدارة أولية. في مرحلة GitHub-only لا يتم الحفظ من المتصفح. سيتم تفعيل الحفظ الحقيقي لاحقاً عبر Firebase.',
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
    adminNote: 'This is an admin scaffold. In the GitHub-only phase, browser writes are disabled. Real writes will be implemented later with Firebase.',
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

function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<Theme>('light');
  const [query, setQuery] = useState('');
  const [governorate, setGovernorate] = useState('all');
  const [energyType, setEnergyType] = useState('all');
  const [status, setStatus] = useState('all');
  const [projectType, setProjectType] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const t = labels[language];
  const isAdmin = window.location.hash === '#admin';
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  const filteredProjects = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return projects
      .filter((project) => project.is_published)
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
    return updates.filter((update) => update.project_id === selectedProject.id);
  }, [selectedProject]);

  return (
    <main className={`app ${theme}`} dir={direction}>
      <header className="topbar glass">
        <div>
          <span className="eyebrow">{t.platform}</span>
          <h1>{t.title}</h1>
        </div>
        <div className="actions">
          <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
            <Globe2 size={18} /> {language === 'ar' ? 'EN' : 'AR'}
          </button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <a className="admin-link" href="#admin">{t.admin}</a>
        </div>
      </header>

      {isAdmin ? (
        <section className="admin-panel glass">
          <h2>{t.admin}</h2>
          <p>{t.adminNote}</p>
          <div className="admin-grid">
            <input placeholder="Project title" />
            <input placeholder="Governorate" />
            <input placeholder="Energy type" />
            <input placeholder="Status" />
            <textarea placeholder="Project description" />
          </div>
        </section>
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
              <MapContainer center={[selectedProject.latitude, selectedProject.longitude]} zoom={8} scrollWheelZoom={false}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedProject.latitude, selectedProject.longitude]}>
                  <Popup>{language === 'ar' ? selectedProject.title_ar : selectedProject.title_en}</Popup>
                </Marker>
              </MapContainer>
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
