import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, Clock3, ExternalLink, Home, Languages, MapPin, RotateCcw, Search, Share2, Zap } from 'lucide-react';
import AdminDashboard from './admin/AdminDashboard';
import type { Language, Project } from './types/project';
import { getAllProjects, getMetadata, getProjectUpdates, getPublishedProjects } from './services/projectService';

const allProjects = getAllProjects();
const publicProjects = getPublishedProjects();
const metadata = getMetadata();

const labels = {
  ar: {
    appTitle: 'متتبع أخبار ومشاريع الطاقة السورية',
    projects: 'المشاريع',
    dataPortal: 'بوابة بيانات الطاقة',
    stats: 'إحصائيات المشاريع',
    admin: 'الإدارة',
    language: 'العربية',
    search: 'البحث...',
    city: 'المدينة',
    chooseCity: 'اختر المدينة',
    energyType: 'نوع الطاقة',
    projectType: 'نوع المشروع',
    status: 'حالة المشروع',
    all: 'الكل / All',
    reset: 'إعادة تعيين',
    total: 'إجمالي المشاريع',
    active: 'نشطة حالياً',
    inProgress: 'قيد التشغيل',
    stopped: 'متوقفة',
    results: 'عدد النتائج',
    owner: 'المالك/المطور/الشركاء',
    capacity: 'القدرة الإنتاجية',
    location: 'الموقع',
    projectTitle: 'عنوان المشروع',
    description: 'الوصف',
    implementation: 'مراحل التنفيذ',
    planned: 'مخطط',
    construction: 'قيد الإنشاء',
    operating: 'قيد التشغيل',
    completed: 'مكتملة',
    current: 'حالية',
    share: 'مشاركة',
    back: 'رجوع',
    follow: 'تابع أين وصل المشروع',
    openGoogle: 'فتح في خرائط Google',
    source: 'المصدر',
    noResults: 'لا توجد مشاريع مطابقة للفلاتر الحالية.',
    home: 'الرئيسية',
    exhibited: 'معرض'
  },
  en: {
    appTitle: 'Syrian Energy News and Projects Tracker',
    projects: 'Projects',
    dataPortal: 'Energy Data Portal',
    stats: 'Project statistics',
    admin: 'Admin',
    language: 'English',
    search: 'Search...',
    city: 'City',
    chooseCity: 'Choose city',
    energyType: 'Energy type',
    projectType: 'Project type',
    status: 'Project status',
    all: 'All',
    reset: 'Reset',
    total: 'Total projects',
    active: 'Active now',
    inProgress: 'In progress',
    stopped: 'Stopped',
    results: 'Results',
    owner: 'Owner/developer/partners',
    capacity: 'Production capacity',
    location: 'Location',
    projectTitle: 'Project title',
    description: 'Description',
    implementation: 'Implementation stages',
    planned: 'Planned',
    construction: 'Under construction',
    operating: 'Operational',
    completed: 'Completed',
    current: 'Current',
    share: 'Share',
    back: 'Back',
    follow: 'Follow project progress',
    openGoogle: 'Open in Google Maps',
    source: 'Source',
    noResults: 'No projects match the current filters.',
    home: 'Home',
    exhibited: 'Exhibited'
  }
};

function getLabel(items: { id: string; ar: string; en: string }[], id: string, lang: Language) {
  return items.find((item) => item.id === id)?.[lang] ?? id;
}

function getGoogleMapUrl(project: Project) {
  return `https://maps.google.com/maps?q=${project.latitude},${project.longitude}&z=10&output=embed`;
}

function getGoogleLink(project: Project) {
  return `https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`;
}

function getStatusTone(status: string) {
  if (status === 'planned') return 'blue';
  if (status === 'under-construction') return 'blue';
  if (status === 'operational') return 'green';
  if (status === 'completed') return 'green';
  if (status === 'repair') return 'orange';
  return 'gray';
}

function App() {
  const [language, setLanguage] = useState<Language>('ar');
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

  const cities = useMemo(() => {
    const seen = new Map<string, { id: string; ar: string; en: string }>();
    publicProjects.forEach((project) => {
      if (!seen.has(project.governorate)) {
        seen.set(project.governorate, {
          id: project.governorate,
          ar: project.city_ar,
          en: project.city_en
        });
      }
    });
    return Array.from(seen.values());
  }, []);

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
          project.developer,
          project.partners
        ].join(' ').toLowerCase();
        return searchText.includes(lowerQuery);
      });
  }, [query, governorate, energyType, status, projectType]);

  const selectedUpdates = useMemo(() => {
    if (!selectedProject) return [];
    return getProjectUpdates(selectedProject.id);
  }, [selectedProject]);

  const stats = useMemo(() => {
    return {
      total: publicProjects.length,
      active: publicProjects.filter((project) => project.status === 'operational').length,
      inProgress: publicProjects.filter((project) => project.status === 'under-construction').length,
      stopped: publicProjects.filter((project) => project.status === 'unclear' || project.status === 'repair').length
    };
  }, []);

  const resetFilters = () => {
    setQuery('');
    setGovernorate('all');
    setEnergyType('all');
    setStatus('all');
    setProjectType('all');
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProject = () => {
    setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyProjectLink = async (project: Project) => {
    const url = `${window.location.origin}${window.location.pathname}#${project.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Project link', url);
    }
  };

  return (
    <main className="tracker-app" dir={direction}>
      <header className="tracker-topbar">
        <div className="language-control">
          <Languages size={16} />
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        <a href="#admin" className="admin-mini">{t.admin}</a>
        <h1>{t.appTitle}</h1>
      </header>

      {isAdmin ? (
        <div className="tracker-page">
          <div className="detail-actions">
            <a className="ghost-button" href="#"><Home size={16} /> {t.home}</a>
          </div>
          <AdminDashboard language={language} projects={allProjects} metadata={metadata} />
        </div>
      ) : selectedProject ? (
        <section className="tracker-page project-details-page">
          <div className="detail-actions">
            <button className="ghost-button" onClick={() => copyProjectLink(selectedProject)}><Share2 size={16} /> {t.share}</button>
            <button className="ghost-button" onClick={closeProject}><ArrowLeft size={16} /> {t.back}</button>
          </div>

          <div className="detail-map-card">
            <iframe title={language === 'ar' ? selectedProject.title_ar : selectedProject.title_en} src={getGoogleMapUrl(selectedProject)} loading="lazy" />
          </div>

          <section className="detail-content-card">
            <div className="detail-location"><MapPin size={18} /> {t.location}<strong>{language === 'ar' ? `${selectedProject.city_ar} – سوريا` : `${selectedProject.city_en}, Syria`}</strong></div>
            <span className="detail-label">{t.projectTitle}</span>
            <h2>{language === 'ar' ? selectedProject.title_ar : selectedProject.title_en}</h2>

            <div className="badge-row">
              <span className="pill soft">{t.energyType}: {getLabel(metadata.energyTypes, selectedProject.energy_type, language)}</span>
              <span className="pill soft">{t.projectType}: {getLabel(metadata.projectTypes, selectedProject.project_type, language)}</span>
              <span className={`pill ${getStatusTone(selectedProject.status)}`}>{getLabel(metadata.statuses, selectedProject.status, language)}</span>
            </div>

            <div className="detail-two-col">
              <div>
                <span className="detail-label">{t.capacity}</span>
                <strong className="capacity-number"><Zap size={16} /> {selectedProject.capacity}</strong>
              </div>
              <div>
                <span className="detail-label">{t.owner}</span>
                <p>{selectedProject.owner} · {selectedProject.developer} · {selectedProject.partners}</p>
              </div>
            </div>

            <div className="detail-section">
              <span className="detail-label">{t.description}</span>
              <p>{language === 'ar' ? selectedProject.description_ar : selectedProject.description_en}</p>
            </div>

            <div className="detail-section stages-section">
              <span className="detail-label">{t.implementation}</span>
              <div className="stage-list">
                <div className="stage-item done"><CheckCircle2 size={18} /><strong>{t.planned}</strong><small>{t.completed}</small></div>
                <div className={`stage-item ${selectedProject.status === 'under-construction' || selectedProject.status === 'operational' || selectedProject.status === 'completed' ? 'done' : ''}`}><CheckCircle2 size={18} /><strong>{t.construction}</strong><small>{selectedProject.status === 'under-construction' ? t.current : t.completed}</small></div>
                <div className={`stage-item ${selectedProject.status === 'operational' || selectedProject.status === 'completed' ? 'done' : ''}`}><Clock3 size={18} /><strong>{t.operating}</strong><small>{selectedProject.expected_cod}</small></div>
              </div>
            </div>

            <div className="timeline-strip">
              {selectedUpdates.length > 0 ? selectedUpdates.map((update) => <span key={update.id}>{update.update_date}</span>) : <span>{selectedProject.updated_at}</span>}
            </div>

            <a className="wide-button" href={getGoogleLink(selectedProject)} target="_blank" rel="noreferrer">{t.openGoogle}</a>
            <a className="wide-button" href={selectedProject.source_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t.source}</a>
          </section>
        </section>
      ) : (
        <section className="tracker-page">
          <nav className="tab-row">
            <button className="tab active">{t.projects}</button>
            <button className="tab">{t.dataPortal}</button>
            <button className="tab outline">{t.stats}</button>
          </nav>

          <div className="search-strip">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
            <Search size={18} />
          </div>

          <section className="filter-panel">
            <div className="filter-field">
              <label>{t.city}</label>
              <select value={governorate} onChange={(event) => setGovernorate(event.target.value)}>
                <option value="all">{t.chooseCity}</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city[language]}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>{t.energyType}</label>
              <select value={energyType} onChange={(event) => setEnergyType(event.target.value)}>
                <option value="all">{t.all}</option>
                {metadata.energyTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>{t.projectType}</label>
              <select value={projectType} onChange={(event) => setProjectType(event.target.value)}>
                <option value="all">{t.all}</option>
                {metadata.projectTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>{t.status}</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">{t.all}</option>
                {metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}
              </select>
            </div>
            <button className="reset-button" onClick={resetFilters}><RotateCcw size={15} /> {t.reset}</button>
          </section>

          <section className="stats-row">
            <article><strong>{stats.total}</strong><span>{t.total}</span></article>
            <article><strong className="blue-number">{stats.active}</strong><span>{t.active}</span></article>
            <article><strong className="green-number">{stats.inProgress}</strong><span>{t.inProgress}</span></article>
            <article><strong className="red-number">{stats.stopped}</strong><span>{t.stopped}</span></article>
          </section>

          <div className="results-meta">{t.results}: {filteredProjects.length}</div>

          <section className="reference-grid">
            {filteredProjects.map((project) => (
              <article className="reference-card" key={project.id} onClick={() => openProject(project)}>
                <h3>{language === 'ar' ? project.title_ar : project.title_en}</h3>
                <div className="card-pills">
                  <span>{getLabel(metadata.energyTypes, project.energy_type, language)}</span>
                  <span>{getLabel(metadata.projectTypes, project.project_type, language)}</span>
                  <span className="gray-pill">{getLabel(metadata.statuses, project.status, language)}</span>
                </div>
                <div className="project-info-stack">
                  <span className="status-red">{t.exhibited}</span>
                  <button onClick={(event) => { event.stopPropagation(); copyProjectLink(project); }}><Share2 size={14} /> {t.share}</button>
                  <p>{t.owner}<br />{project.owner}<br />{project.developer}<br />{project.partners}</p>
                </div>
                <div className="follow-row"><Clock3 size={15} /> {t.follow}</div>
                <div className="card-bottom"><span>‹</span><strong>{project.capacity} <Zap size={15} /></strong></div>
              </article>
            ))}
          </section>
          {filteredProjects.length === 0 && <p className="empty-card">{t.noResults}</p>}
        </section>
      )}
    </main>
  );
}

export default App;
