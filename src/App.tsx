import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CheckCircle2, Clock3, ExternalLink, Home, Languages, MapPin, RotateCcw, Search, Share2, Zap } from 'lucide-react';
import AdminDashboard from './admin/AdminDashboard';
import AccessGate from './components/AccessGate';
import type { Language, Project, ProjectUpdate } from './types/project';
import { getAllProjects, getMetadata, getProjectUpdates, getPublishedProjects } from './services/projectService';
import { getFirebaseProjectUpdates, getFirebaseProjects, useFirebaseData } from './services/firebaseProjectService';
import './styles/modern.css';

const jsonAllProjects = getAllProjects();
const jsonPublicProjects = getPublishedProjects();
const metadata = getMetadata();

type PublicView = 'projects' | 'analytics';

type ChartItem = { id: string; label: string; count: number; capacity: number };

const copy = {
  ar: {
    appTitle: 'متتبع أخبار ومشاريع الطاقة السورية', projects: 'المشاريع', stats: 'إحصائيات المشاريع', admin: 'الإدارة', search: 'البحث...', city: 'المدينة', chooseCity: 'اختر المدينة', energyType: 'نوع الطاقة', projectType: 'نوع المشروع', status: 'حالة المشروع', all: 'الكل / All', reset: 'إعادة تعيين', total: 'إجمالي المشاريع', active: 'نشطة حالياً', inProgress: 'قيد التشغيل', stopped: 'متوقفة', results: 'عدد النتائج', owner: 'المالك/المطور/الشركاء', capacity: 'الاستطاعة', location: 'الموقع', projectTitle: 'عنوان المشروع', description: 'الوصف', implementation: 'مراحل التنفيذ', planned: 'مخطط', construction: 'قيد الإنشاء', operating: 'قيد التشغيل', completed: 'مكتملة', current: 'حالية', share: 'مشاركة', back: 'رجوع', follow: 'تابع أين وصل المشروع', openGoogle: 'فتح في خرائط Google', source: 'المصدر', noResults: 'لا توجد مشاريع مطابقة للفلاتر الحالية.', home: 'الرئيسية', view: 'عرض', loading: 'جار تحميل البيانات...', loaded: 'تم تحديث البيانات', updatesTitle: 'تحديثات المشروع', noUpdates: 'لا توجد تحديثات زمنية منشورة لهذا المشروع بعد.', analyticsTitle: 'لوحة إحصائيات مشاريع الطاقة', analyticsLead: 'تحليل سريع للمشاريع المنشورة حسب نوع الطاقة، نوع المشروع، المدينة، والاستطاعة.', byEnergy: 'حسب نوع الطاقة', byType: 'حسب نوع المشروع', byCity: 'حسب المدينة', byCapacity: 'حسب نطاق الاستطاعة', totalCapacity: 'إجمالي الاستطاعة الرقمية', avgCapacity: 'متوسط الاستطاعة', projectsCount: 'عدد المشاريع'
  },
  en: {
    appTitle: 'Syrian Energy News and Projects Tracker', projects: 'Projects', stats: 'Project statistics', admin: 'Admin', search: 'Search...', city: 'City', chooseCity: 'Choose city', energyType: 'Energy type', projectType: 'Project type', status: 'Project status', all: 'All', reset: 'Reset', total: 'Total projects', active: 'Active now', inProgress: 'In progress', stopped: 'Stopped', results: 'Results', owner: 'Owner/developer/partners', capacity: 'Capacity', location: 'Location', projectTitle: 'Project title', description: 'Description', implementation: 'Implementation stages', planned: 'Planned', construction: 'Under construction', operating: 'Operational', completed: 'Completed', current: 'Current', share: 'Share', back: 'Back', follow: 'Follow project progress', openGoogle: 'Open in Google Maps', source: 'Source', noResults: 'No projects match the current filters.', home: 'Home', view: 'View', loading: 'Loading data...', loaded: 'Data updated', updatesTitle: 'Project updates', noUpdates: 'No timeline updates have been published for this project yet.', analyticsTitle: 'Energy projects analytics dashboard', analyticsLead: 'A quick view of published projects by energy type, project type, city, and capacity.', byEnergy: 'By energy type', byType: 'By project type', byCity: 'By city', byCapacity: 'By capacity range', totalCapacity: 'Total numeric capacity', avgCapacity: 'Average capacity', projectsCount: 'Projects count'
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

function parseCapacity(value: string) {
  const text = String(value || '').replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(',', '.');
  const number = Number(text.match(/\d+(\.\d+)?/)?.[0] ?? 0);
  if (!Number.isFinite(number)) return 0;
  if (/\bMW\b|ميغا|م\.و/i.test(text)) return number * 1000;
  return number;
}

function groupProjects(projects: Project[], getKey: (project: Project) => { id: string; label: string }): ChartItem[] {
  const groups = new Map<string, ChartItem>();
  projects.forEach((project) => {
    const key = getKey(project);
    const current = groups.get(key.id) ?? { id: key.id, label: key.label, count: 0, capacity: 0 };
    current.count += 1;
    current.capacity += parseCapacity(project.capacity);
    groups.set(key.id, current);
  });
  return Array.from(groups.values()).sort((a, b) => b.count - a.count || b.capacity - a.capacity);
}

function capacityBucket(project: Project, language: Language) {
  const capacity = parseCapacity(project.capacity);
  if (capacity === 0) return { id: 'unknown', label: language === 'ar' ? 'غير محددة رقمياً' : 'Not numeric' };
  if (capacity < 100) return { id: 'small', label: language === 'ar' ? 'أقل من 100 kW' : 'Below 100 kW' };
  if (capacity < 1000) return { id: 'medium', label: language === 'ar' ? '100–999 kW' : '100–999 kW' };
  return { id: 'large', label: language === 'ar' ? '1 MW فأكثر' : '1 MW and above' };
}

function AnalyticsPanel({ projects, language }: { projects: Project[]; language: Language }) {
  const t = copy[language];
  const byEnergy = groupProjects(projects, (p) => ({ id: p.energy_type, label: getLabel(metadata.energyTypes, p.energy_type, language) }));
  const byType = groupProjects(projects, (p) => ({ id: p.project_type, label: getLabel(metadata.projectTypes, p.project_type, language) }));
  const byCity = groupProjects(projects, (p) => ({ id: p.governorate || p.city_en || p.city_ar, label: language === 'ar' ? (p.city_ar || p.governorate) : (p.city_en || p.governorate) }));
  const byCapacity = groupProjects(projects, (p) => capacityBucket(p, language));
  const totalCapacity = projects.reduce((sum, project) => sum + parseCapacity(project.capacity), 0);
  const numericProjects = projects.filter((project) => parseCapacity(project.capacity) > 0).length;
  const avgCapacity = numericProjects ? Math.round(totalCapacity / numericProjects) : 0;

  const renderBars = (items: ChartItem[]) => {
    const max = Math.max(...items.map((item) => item.count), 1);
    return <div className="analytics-bars">{items.map((item) => <div className="analytics-bar" key={item.id}><div className="bar-label"><span>{item.label}</span><strong>{item.count}</strong></div><div className="bar-track"><span style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} /></div><small>{Math.round(item.capacity).toLocaleString()} kW</small></div>)}</div>;
  };

  return (
    <section className="analytics-dashboard">
      <div className="analytics-hero">
        <div><span className="eyebrow"><BarChart3 size={16} /> {t.stats}</span><h2>{t.analyticsTitle}</h2><p>{t.analyticsLead}</p></div>
      </div>
      <div className="analytics-kpis">
        <article><span>{t.projectsCount}</span><strong>{projects.length}</strong></article>
        <article><span>{t.totalCapacity}</span><strong>{Math.round(totalCapacity).toLocaleString()} kW</strong></article>
        <article><span>{t.avgCapacity}</span><strong>{avgCapacity.toLocaleString()} kW</strong></article>
      </div>
      <div className="analytics-grid">
        <article className="analytics-card"><h3>{t.byEnergy}</h3>{renderBars(byEnergy)}</article>
        <article className="analytics-card"><h3>{t.byType}</h3>{renderBars(byType)}</article>
        <article className="analytics-card"><h3>{t.byCity}</h3>{renderBars(byCity)}</article>
        <article className="analytics-card"><h3>{t.byCapacity}</h3>{renderBars(byCapacity)}</article>
      </div>
    </section>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [route, setRoute] = useState(window.location.hash);
  const [view, setView] = useState<PublicView>('projects');
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
        setDataMessage('');
      } catch {
        if (!ok) return;
        setDataMessage('');
        setAllProjects(jsonAllProjects);
        setPublicProjects(jsonPublicProjects);
      }
    }
    load();
    return () => { ok = false; };
  }, [language, t.loading]);

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
    <main className="tracker-app modern-shell" dir={direction}>
      <header className="tracker-topbar modern-topbar">
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
            <section className="project-updates-panel"><h3>{t.updatesTitle}</h3>{selectedUpdates.length > 0 ? selectedUpdates.map((update) => <article className="public-update-card" key={update.id}><time>{update.update_date}</time><strong>{language === 'ar' ? update.title_ar : update.title_en || update.title_ar}</strong><p>{language === 'ar' ? update.description_ar : update.description_en || update.description_ar}</p>{update.source_url && <a href={update.source_url} target="_blank" rel="noreferrer">{t.source}</a>}</article>) : <p className="empty-updates">{t.noUpdates}</p>}</section>
            <a className="wide-button" href={mapLink(selectedProject)} target="_blank" rel="noreferrer">{t.openGoogle}</a><a className="wide-button" href={selectedProject.source_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t.source}</a>
          </section>
        </section>
      ) : (
        <section className="tracker-page">
          <nav className="tab-row modern-tabs"><button className={`tab ${view === 'projects' ? 'active' : ''}`} onClick={() => setView('projects')}>{t.projects}</button><button className={`tab outline ${view === 'analytics' ? 'active' : ''}`} onClick={() => setView('analytics')}>{t.stats}</button></nav>
          {dataMessage && <p className="empty-card subtle-loading">{dataMessage}</p>}
          {view === 'analytics' ? <AnalyticsPanel projects={publicProjects} language={language} /> : <><div className="search-strip"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} /><Search size={18} /></div><section className="filter-panel"><div className="filter-field"><label>{t.city}</label><select value={governorate} onChange={(event) => setGovernorate(event.target.value)}><option value="all">{t.chooseCity}</option>{cities.map((city) => <option key={city.id} value={city.id}>{city[language]}</option>)}</select></div><div className="filter-field"><label>{t.energyType}</label><select value={energyType} onChange={(event) => setEnergyType(event.target.value)}><option value="all">{t.all}</option>{metadata.energyTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></div><div className="filter-field"><label>{t.projectType}</label><select value={projectType} onChange={(event) => setProjectType(event.target.value)}><option value="all">{t.all}</option>{metadata.projectTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></div><div className="filter-field"><label>{t.status}</label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t.all}</option>{metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></div><button className="reset-button" onClick={resetFilters}><RotateCcw size={15} /> {t.reset}</button></section><section className="stats-row"><article><strong>{stats.total}</strong><span>{t.total}</span></article><article><strong className="blue-number">{stats.active}</strong><span>{t.active}</span></article><article><strong className="green-number">{stats.inProgress}</strong><span>{t.inProgress}</span></article><article><strong className="red-number">{stats.stopped}</strong><span>{t.stopped}</span></article></section><div className="results-meta">{t.results}: {filteredProjects.length}</div><section className="reference-grid">{filteredProjects.map((project) => <article className="reference-card modern-project-card" key={project.id} onClick={() => openProject(project)}><h3>{language === 'ar' ? project.title_ar : project.title_en}</h3><div className="card-pills"><span>{getLabel(metadata.energyTypes, project.energy_type, language)}</span><span>{getLabel(metadata.projectTypes, project.project_type, language)}</span><span className="gray-pill">{getLabel(metadata.statuses, project.status, language)}</span></div><div className="project-info-stack"><span className="status-red">{t.view}</span><button onClick={(event) => { event.stopPropagation(); copyProjectLink(project); }}><Share2 size={14} /> {t.share}</button><p>{t.owner}<br />{project.owner}<br />{project.developer}<br />{project.partners}</p></div><button className="follow-row follow-button" onClick={(event) => { event.stopPropagation(); openProject(project); }}><Clock3 size={15} /> {t.follow}</button><div className="card-bottom"><span>‹</span><strong>{project.capacity} <Zap size={15} /></strong></div></article>)}</section>{filteredProjects.length === 0 && <p className="empty-card">{t.noResults}</p>}</>}
        </section>
      )}
    </main>
  );
}
