import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, Home, Languages, MapPin, RotateCcw, Search, Share2, Zap } from 'lucide-react';
import AdminDashboard from './admin/AdminDashboard';
import AccessGate from './components/AccessGate';
import type { Language, Project, ProjectUpdate } from './types/project';
import { getAllProjects, getMetadata, getProjectUpdates, getPublishedProjects } from './services/projectService';
import { getFirebaseProjectUpdates, getFirebaseProjects, useFirebaseData } from './services/firebaseProjectService';

const jsonAllProjects = getAllProjects();
const jsonPublicProjects = getPublishedProjects();
const metadata = getMetadata();

const copy = {
  ar: {
    appTitle: 'متتبع أخبار ومشاريع الطاقة السورية', projects: 'المشاريع', dataPortal: 'بوابة بيانات الطاقة', stats: 'إحصائيات المشاريع', admin: 'الإدارة', search: 'البحث...', city: 'المدينة', chooseCity: 'اختر المدينة', energyType: 'نوع الطاقة', projectType: 'نوع المشروع', status: 'حالة المشروع', all: 'الكل / All', reset: 'إعادة تعيين', total: 'إجمالي المشاريع', active: 'نشطة حالياً', inProgress: 'قيد التشغيل', stopped: 'متوقفة', results: 'عدد النتائج', owner: 'المالك/المطور/الشركاء', capacity: 'القدرة الإنتاجية', location: 'الموقع', projectTitle: 'عنوان المشروع', description: 'الوصف', implementation: 'مراحل التنفيذ', planned: 'مخطط', construction: 'قيد الإنشاء', operating: 'قيد التشغيل', completed: 'مكتملة', current: 'حالية', share: 'مشاركة', back: 'رجوع', follow: 'تابع أين وصل المشروع', openGoogle: 'فتح في خرائط Google', source: 'المصدر', noResults: 'لا توجد مشاريع مطابقة للفلاتر الحالية.', home: 'الرئيسية', exhibited: 'معرض', loading: 'جار تحميل المشاريع من Firebase...', loaded: 'تم تحميل المشاريع من Firebase'
  },
  en: {
    appTitle: 'Syrian Energy News and Projects Tracker', projects: 'Projects', dataPortal: 'Energy Data Portal', stats: 'Project statistics', admin: 'Admin', search: 'Search...', city: 'City', chooseCity: 'Choose city', energyType: 'Energy type', projectType: 'Project type', status: 'Project status', all: 'All', reset: 'Reset', total: 'Total projects', active: 'Active now', inProgress: 'In progress', stopped: 'Stopped', results: 'Results', owner: 'Owner/developer/partners', capacity: 'Production capacity', location: 'Location', projectTitle: 'Project title', description: 'Description', implementation: 'Implementation stages', planned: 'Planned', construction: 'Under construction', operating: 'Operational', completed: 'Completed', current: 'Current', share: 'Share', back: 'Back', follow: 'Follow project progress', openGoogle: 'Open in Google Maps', source: 'Source', noResults: 'No projects match the current filters.', home: 'Home', exhibited: 'Exhibited', loading: 'Loading projects from Firebase...', loaded: 'Projects loaded from Firebase'
  }
};

function getLabel(items: { id: string; ar: string; en: string }[], id: string, lang: Language) {
  return items.find((item) => item.id === id)?.[lang] ?? id;
}

function mapUrl(project: Project) {
  return `https://maps.google.com/maps?q=${project.latitude},${project.longitude}&z=10&output=embed`;
}

function mapLink(project: Project) {
  return `https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`;
}

function statusTone(status: string) {
  if (status === 'planned' || status === 'under-construction') return 'blue';
  if (status === 'operational' || status === 'completed') return 'green';
  if (status === 'repair') return 'orange';
  return 'gray';
}

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [route, setRoute] = useState(window.location.hash);
  const [query, setQuery] = useState('');
  const [governorate, setGovernorate] = useState('all');
  const [energyType, setEnergyType] = useState('all');
  const [status, setStatus] = useState('all');
  const [projectType, setProjectType] = useState('all');
  const [allProjects, setAllProjects] = useState<Project[]>(jsonAllProjects);
  const [publicProjects, setPublicProjects] = useState<Project[]>(jsonPublicProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUpdates, setSelectedUpdates] = useState<ProjectUpdate[]>([]);
  const [dataMessage, setDataMessage] = useState('');

  const t = copy[language];
  const isAdmin = route === '#admin';
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let ok = true;
    async function load() {
      if (!useFirebaseData) return;
      try {
        setDataMessage(t.loading);
        const data = await getFirebaseProjects();
        if (!ok) return;
        setAllProjects(data);
        setPublicProjects(data.filter((project) => project.is_published));
        setDataMessage(t.loaded);
      } catch (error) {
        if (!ok) return;
        setDataMessage(error instanceof Error ? error.message : 'Firebase loading failed');
        setAllProjects(jsonAllProjects);
        setPublicProjects(jsonPublicProjects);
      }
    }
    load();
    return () => { ok = false; };
  }, [language, t.loading, t.loaded]);

  const cities = useMemo(() => {
    const seen = new Map<string, { id: string; ar: string; en: string }>();
    publicProjects.forEach((project) => {
      if (!seen.has(project.governorate)) seen.set(project.governorate, { id: project.governorate, ar: project.city_ar || project.governorate, en: project.city_en || project.governorate });
    });
    return Array.from(seen.values());
  }, [publicProjects]);

  const filteredProjects = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return publicProjects
      .filter((p) => governorate === 'all' || p.governorate === governorate)
      .filter((p) => energyType === 'all' || p.energy_type === energyType)
      .filter((p) => status === 'all' || p.status === status)
      .filter((p) => projectType === 'all' || p.project_type === projectType)
      .filter((p) => !lower || [p.title_ar, p.title_en, p.description_ar, p.description_en, p.city_ar, p.city_en, p.owner, p.developer, p.partners].join(' ').toLowerCase().includes(lower));
  }, [publicProjects, query, governorate, energyType, status, projectType]);

  const stats = useMemo(() => ({
    total: publicProjects.length,
    active: publicProjects.filter((p) => p.status === 'operational').length,
    inProgress: publicProjects.filter((p) => p.status === 'under-construction').length,
    stopped: publicProjects.filter((p) => p.status === 'unclear' || p.status === 'repair').length
  }), [publicProjects]);

  const resetFilters = () => { setQuery(''); setGovernorate('all'); setEnergyType('all'); setStatus('all'); setProjectType('all'); };

  const openProject = async (project: Project) => {
    setSelectedProject(project);
    setSelectedUpdates(useFirebaseData ? [] : getProjectUpdates(project.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (useFirebaseData) {
      try { setSelectedUpdates(await getFirebaseProjectUpdates(project.id)); } catch { setSelectedUpdates([]); }
    }
  };

  const closeProject = () => { setSelectedProject(null); setSelectedUpdates([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const copyProjectLink = async (project: Project) => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${project.slug}`);

  return (
    <main className="tracker-app" dir={direction}>
      <header className="tracker-topbar">
        <div className="language-control"><Languages size={16} /><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="ar">العربية</option><option value="en">English</option></select></div>
        <a href="#admin" className="admin-mini">{t.admin}</a>
        <h1>{t.appTitle}</h1>
      </header>

      {isAdmin ? (
        <div className="tracker-page">
          <div className="detail-actions"><a className="ghost-button" href="#"><Home size={16} /> {t.home}</a></div>
          <AccessGate language={language}><AdminDashboard language={language} projects={allProjects} metadata={metadata} /></AccessGate>
        </div>
      ) : selectedProject ? (
        <section className="tracker-page project-details-page">
          <div className="detail-actions"><button className="ghost-button" onClick={() => copyProjectLink(selectedProject)}><Share2 size={16} /> {t.share}</button><button className="ghost-button" onClick={closeProject}><ArrowLeft size={16} /> {t.back}</button></div>
          <div className="detail-map-card"><iframe title={language === 'ar' ? selectedProject.title_ar : selectedProject.title_en} src={mapUrl(selectedProject)} loading="lazy" /></div>
          <section className="detail-content-card">
            <div className="detail-location"><MapPin size={18} /> {t.location}<strong>{language === 'ar' ? `${selectedProject.city_ar || selectedProject.governorate} – سوريا` : `${selectedProject.city_en || selectedProject.governorate}, Syria`}</strong></div>
            <span className="detail-label">{t.projectTitle}</span><h2>{language === 'ar' ? selectedProject.title_ar : selectedProject.title_en}</h2>
            <div className="badge-row"><span className="pill soft">{t.energyType}: {getLabel(metadata.energyTypes, selectedProject.energy_type, language)}</span><span className="pill soft">{t.projectType}: {getLabel(metadata.projectTypes, selectedProject.project_type, language)}</span><span className={`pill ${statusTone(selectedProject.status)}`}>{getLabel(metadata.statuses, selectedProject.status, language)}</span></div>
            <div className="detail-two-col"><div><span className="detail-label">{t.capacity}</span><strong className="capacity-number"><Zap size={16} /> {selectedProject.capacity}</strong></div><div><span className="detail-label">{t.owner}</span><p>{selectedProject.owner} · {selectedProject.developer} · {selectedProject.partners}</p></div></div>
            <div className="detail-section"><span className="detail-label">{t.description}</span><p>{language === 'ar' ? selectedProject.description_ar : selectedProject.description_en}</p></div>
            <div className="detail-section stages-section"><span className="detail-label">{t.implementation}</span><div className="stage-list"><div className="stage-item done"><CheckCircle2 size={18} /><strong>{t.planned}</strong><small>{t.completed}</small></div><div className={`stage-item ${selectedProject.status === 'under-construction' || selectedProject.status === 'operational' || selectedProject.status === 'completed' ? 'done' : ''}`}><CheckCircle2 size={18} /><strong>{t.construction}</strong><small>{selectedProject.status === 'under-construction' ? t.current : t.completed}</small></div><div className={`stage-item ${selectedProject.status === 'operational' || selectedProject.status === 'completed' ? 'done' : ''}`}><Clock3 size={18} /><strong>{t.operating}</strong><small>{selectedProject.expected_cod}</small></div></div></div>
            <div className="timeline-strip">{selectedUpdates.length > 0 ? selectedUpdates.map((update) => <span key={update.id}>{update.update_date}</span>) : <span>{selectedProject.updated_at}</span>}</div>
            <a className="wide-button" href={mapLink(selectedProject)} target="_blank" rel="noreferrer">{t.openGoogle}</a><a className="wide-button" href={selectedProject.source_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t.source}</a>
          </section>
        </section>
      ) : (
        <section className="tracker-page">
          <nav className="tab-row"><button className="tab active">{t.projects}</button><button className="tab">{t.dataPortal}</button><button className="tab outline">{t.stats}</button></nav>
          {dataMessage && <p className="empty-card">{dataMessage}</p>}
          <div className="search-strip"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><Search size={18} /></div>
          <section className="filter-panel"><div className="filter-field"><label>{t.city}</label><select value={governorate} onChange={(event) => setGovernorate(event.target.value)}><option value="all">{t.chooseCity}</option>{cities.map((city) => <option key={city.id} value={city.id}>{city[language]}</option>)}</select></div><div className="filter-field"><label>{t.energyType}</label><select value={energyType} onChange={(event) => setEnergyType(event.target.value)}><option value="all">{t.all}</option>{metadata.energyTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></div><div className="filter-field"><label>{t.projectType}</label><select value={projectType} onChange={(event) => setProjectType(event.target.value)}><option value="all">{t.all}</option>{metadata.projectTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></div><div className="filter-field"><label>{t.status}</label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t.all}</option>{metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></div><button className="reset-button" onClick={resetFilters}><RotateCcw size={15} /> {t.reset}</button></section>
          <section className="stats-row"><article><strong>{stats.total}</strong><span>{t.total}</span></article><article><strong className="blue-number">{stats.active}</strong><span>{t.active}</span></article><article><strong className="green-number">{stats.inProgress}</strong><span>{t.inProgress}</span></article><article><strong className="red-number">{stats.stopped}</strong><span>{t.stopped}</span></article></section>
          <div className="results-meta">{t.results}: {filteredProjects.length}</div>
          <section className="reference-grid">{filteredProjects.map((project) => <article className="reference-card" key={project.id} onClick={() => openProject(project)}><h3>{language === 'ar' ? project.title_ar : project.title_en}</h3><div className="card-pills"><span>{getLabel(metadata.energyTypes, project.energy_type, language)}</span><span>{getLabel(metadata.projectTypes, project.project_type, language)}</span><span className="gray-pill">{getLabel(metadata.statuses, project.status, language)}</span></div><div className="project-info-stack"><span className="status-red">{t.exhibited}</span><button onClick={(event) => { event.stopPropagation(); copyProjectLink(project); }}><Share2 size={14} /> {t.share}</button><p>{t.owner}<br />{project.owner}<br />{project.developer}<br />{project.partners}</p></div><div className="follow-row"><Clock3 size={15} /> {t.follow}</div><div className="card-bottom"><span>‹</span><strong>{project.capacity} <Zap size={15} /></strong></div></article>)}</section>
          {filteredProjects.length === 0 && <p className="empty-card">{t.noResults}</p>}
        </section>
      )}
    </main>
  );
}
