import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ClipboardList, Copy, Download, FileText, History, MapPin, Pencil, Plus, Trash2, X, Zap } from 'lucide-react';
import type { Language, Metadata, Project } from '../types/project';
import { getProjectUpdates } from '../services/projectService';
import { deleteFirebaseProject, getFirebaseProjectUpdates, getFirebaseProjects, saveFirebaseProject, useFirebaseData } from '../services/firebaseProjectService';
import TimelineManager from './TimelineManager';
import './admin.css';

interface AdminDashboardProps {
  language: Language;
  projects: Project[];
  metadata: Metadata;
}

type AdminFormState = {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  governorate: string;
  city_ar: string;
  city_en: string;
  precise_location_ar: string;
  precise_location_en: string;
  latitude: string;
  longitude: string;
  energy_type: string;
  project_type: string;
  status: string;
  capacity: string;
  owner: string;
  developer: string;
  partners: string;
  expected_cod: string;
  estimated_cost: string;
  grid_connection: string;
  key_risks: string;
  source_name: string;
  source_url: string;
};

const emptyForm: AdminFormState = {
  title_ar: '', title_en: '', description_ar: '', description_en: '', governorate: '', city_ar: '', city_en: '', precise_location_ar: '', precise_location_en: '', latitude: '', longitude: '', energy_type: '', project_type: '', status: '', capacity: '', owner: '', developer: '', partners: '', expected_cod: '', estimated_cost: '', grid_connection: '', key_risks: '', source_name: '', source_url: ''
};

function getLabel(items: { id: string; ar: string; en: string }[], id: string, lang: Language) {
  return items.find((item) => item.id === id)?.[lang] ?? id;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || `project-${Date.now()}`;
}

function projectToForm(project: Project): AdminFormState {
  return {
    title_ar: project.title_ar,
    title_en: project.title_en,
    description_ar: project.description_ar,
    description_en: project.description_en,
    governorate: project.governorate,
    city_ar: project.city_ar,
    city_en: project.city_en,
    precise_location_ar: project.precise_location_ar,
    precise_location_en: project.precise_location_en,
    latitude: String(project.latitude),
    longitude: String(project.longitude),
    energy_type: project.energy_type,
    project_type: project.project_type,
    status: project.status,
    capacity: project.capacity,
    owner: project.owner,
    developer: project.developer,
    partners: project.partners,
    expected_cod: project.expected_cod,
    estimated_cost: project.estimated_cost,
    grid_connection: project.grid_connection,
    key_risks: project.key_risks,
    source_name: project.source_name,
    source_url: project.source_url
  };
}

export default function AdminDashboard({ language, projects, metadata }: AdminDashboardProps) {
  const isAr = language === 'ar';
  const tr = (ar: string, en: string) => isAr ? ar : en;
  const [managedProjects, setManagedProjects] = useState<Project[]>(projects);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timelineProject, setTimelineProject] = useState<Project | null>(null);
  const [form, setForm] = useState<AdminFormState>(emptyForm);
  const [copyMessage, setCopyMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadFirebaseProjects() {
      if (!useFirebaseData) return;
      try {
        setStatusMessage(tr('جار تحميل مشاريع Firebase...', 'Loading Firebase projects...'));
        const firebaseProjects = await getFirebaseProjects();
        if (isMounted) {
          setManagedProjects(firebaseProjects);
          setStatusMessage(firebaseProjects.length ? tr('تم تحميل المشاريع من Firebase', 'Projects loaded from Firebase') : tr('لا توجد مشاريع في Firebase بعد', 'No Firebase projects yet'));
        }
      } catch (error) {
        if (isMounted) setStatusMessage(error instanceof Error ? error.message : 'Firebase loading failed');
      }
    }
    loadFirebaseProjects();
    return () => { isMounted = false; };
  }, [language]);

  const updateForm = (field: keyof AdminFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingId(project.id);
    setForm(projectToForm(project));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveProject = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const now = new Date().toISOString().slice(0, 10);
    const project: Project = {
      id: editingId ?? `project-${Date.now()}`,
      slug: slugify(form.title_en || form.title_ar),
      title_ar: form.title_ar,
      title_en: form.title_en,
      description_ar: form.description_ar,
      description_en: form.description_en,
      governorate: form.governorate || 'damascus',
      city_ar: form.city_ar,
      city_en: form.city_en,
      precise_location_ar: form.precise_location_ar,
      precise_location_en: form.precise_location_en,
      latitude: Number(form.latitude) || 33.5138,
      longitude: Number(form.longitude) || 36.2765,
      energy_type: form.energy_type || 'solar',
      project_type: form.project_type || 'new',
      status: form.status || 'planned',
      capacity: form.capacity,
      owner: form.owner,
      developer: form.developer,
      partners: form.partners,
      expected_cod: form.expected_cod || 'TBD',
      estimated_cost: form.estimated_cost || 'Not announced',
      grid_connection: form.grid_connection || 'Not specified',
      key_risks: form.key_risks || 'Not specified',
      source_name: form.source_name || 'Source',
      source_url: form.source_url || 'https://syrianrenewables.com/',
      is_published: true,
      is_featured: false,
      created_at: editingId ? (managedProjects.find((item) => item.id === editingId)?.created_at ?? now) : now,
      updated_at: now
    };

    try {
      if (useFirebaseData) await saveFirebaseProject(project);
      setManagedProjects((current) => editingId ? current.map((item) => item.id === editingId ? project : item) : [project, ...current]);
      setStatusMessage(useFirebaseData ? tr('تم الحفظ في Firebase', 'Saved to Firebase') : tr('تم الحفظ مؤقتاً', 'Saved temporarily'));
      closeModal();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm(tr('هل تريد حذف هذا المشروع؟', 'Delete this project?'))) return;
    try {
      if (useFirebaseData) await deleteFirebaseProject(projectId);
      setManagedProjects((current) => current.filter((project) => project.id !== projectId));
      setStatusMessage(useFirebaseData ? tr('تم الحذف من Firebase', 'Deleted from Firebase') : tr('تم الحذف مؤقتاً', 'Deleted temporarily'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const exportCsv = () => {
    const headers = ['id', 'title_ar', 'title_en', 'governorate', 'energy_type', 'project_type', 'status', 'capacity', 'owner', 'source_url'];
    const rows = managedProjects.map((project) => headers.map((key) => `"${String(project[key as keyof Project] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'syrian-energy-projects.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyProjectJson = async (project: Project) => {
    const updates = useFirebaseData ? await getFirebaseProjectUpdates(project.id) : getProjectUpdates(project.id);
    await navigator.clipboard.writeText(JSON.stringify({ project, updates }, null, 2));
    setCopyMessage(tr('تم نسخ JSON', 'JSON copied'));
    window.setTimeout(() => setCopyMessage(''), 1800);
  };

  return (
    <section className="admin-management-shell">
      <nav className="admin-tabs">
        <button className="active">{tr('المشاريع', 'Projects')}</button>
        <button>{tr('بوابة بيانات الطاقة', 'Energy Data Portal')}</button>
        <button>{tr('تحليلات الزيارات', 'Visits analytics')}</button>
      </nav>

      <div className="admin-management-header">
        <h2>{tr('المشاريع الإدارة', 'Projects admin')} ({managedProjects.length} projects)</h2>
        <div className="admin-actions-bar">
          {statusMessage && <span className="copy-toast">{statusMessage}</span>}
          {copyMessage && <span className="copy-toast">{copyMessage}</span>}
          <button className="admin-secondary" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          <button className="admin-secondary" onClick={() => window.print()}><FileText size={16} /> Export PDF</button>
          <button className="admin-primary" onClick={openAddModal}><Plus size={16} /> {tr('إضافة مشروع', 'Add project')}</button>
        </div>
      </div>

      <div className="admin-list">
        {managedProjects.map((project) => (
          <article className="admin-project-row" key={project.id}>
            <div className="admin-project-main">
              <h3>{isAr ? project.title_ar : project.title_en}</h3>
              <div className="admin-badges">
                <span className="verified-badge">{useFirebaseData ? 'Firebase' : 'JSON'}</span>
                <span>{getLabel(metadata.statuses, project.status, language)}</span>
                <span>{getLabel(metadata.energyTypes, project.energy_type, language)}</span>
                <span>{getLabel(metadata.projectTypes, project.project_type, language)}</span>
              </div>
              <div className="admin-row-meta">
                <span><Zap size={13} /> {project.capacity}</span>
                <span>{project.owner}</span>
                <span><MapPin size={13} /> {isAr ? project.city_ar : project.city_en}</span>
              </div>
            </div>
            <div className="admin-row-actions">
              <button className="danger" onClick={() => deleteProject(project.id)}><Trash2 size={14} /> {tr('حذف', 'Delete')}</button>
              <button onClick={() => openEditModal(project)}><Pencil size={14} /> {tr('تعديل', 'Edit')}</button>
              <button onClick={() => setTimelineProject(project)}><History size={14} /> {tr('إدارة التحديثات', 'Manage updates')}</button>
              <button onClick={() => copyProjectJson(project)}><Copy size={14} /> JSON</button>
            </div>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-project-modal" onSubmit={saveProject}>
            <button type="button" className="modal-close" onClick={closeModal}><X size={18} /></button>
            <h3>{editingId ? tr('تعديل مشروع', 'Edit project') : tr('إضافة مشروع', 'Add project')}</h3>
            <div className="form-grid two-cols">
              <label>{tr('عنوان المشروع بالعربية *', 'Arabic project title *')}<input required value={form.title_ar} onChange={(event) => updateForm('title_ar', event.target.value)} /></label>
              <label>{tr('English Title *', 'English title *')}<input value={form.title_en} onChange={(event) => updateForm('title_en', event.target.value)} /></label>
              <label>{tr('وصف المشروع بالعربية *', 'Arabic description *')}<textarea required value={form.description_ar} onChange={(event) => updateForm('description_ar', event.target.value)} /></label>
              <label>{tr('English Description', 'English description')}<textarea value={form.description_en} onChange={(event) => updateForm('description_en', event.target.value)} /></label>
            </div>
            <div className="form-grid three-cols">
              <label>{tr('نوع الطاقة', 'Energy type')}<select value={form.energy_type} onChange={(event) => updateForm('energy_type', event.target.value)}><option value="">{tr('غير محدد', 'Not selected')}</option>{metadata.energyTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
              <label>{tr('نوع المشروع *', 'Project type *')}<select required value={form.project_type} onChange={(event) => updateForm('project_type', event.target.value)}><option value="">Select</option>{metadata.projectTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
              <label>{tr('الحالة *', 'Status *')}<select required value={form.status} onChange={(event) => updateForm('status', event.target.value)}><option value="">Select</option>{metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
            </div>
            <div className="form-grid two-cols">
              <label>{tr('القدرة الإنتاجية', 'Capacity')}<input value={form.capacity} onChange={(event) => updateForm('capacity', event.target.value)} placeholder="150 kW" /></label>
              <label>{tr('المحافظة/الموقع *', 'Governorate/location *')}<select required value={form.governorate} onChange={(event) => updateForm('governorate', event.target.value)}><option value="">Select</option>{metadata.governorates.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
              <label>{tr('المدينة بالعربية', 'Arabic city')}<input value={form.city_ar} onChange={(event) => updateForm('city_ar', event.target.value)} /></label>
              <label>{tr('City in English', 'City in English')}<input value={form.city_en} onChange={(event) => updateForm('city_en', event.target.value)} /></label>
              <label>{tr('الموقع التفصيلي بالعربية', 'Arabic precise location')}<input value={form.precise_location_ar} onChange={(event) => updateForm('precise_location_ar', event.target.value)} /></label>
              <label>{tr('Precise location in English', 'Precise location in English')}<input value={form.precise_location_en} onChange={(event) => updateForm('precise_location_en', event.target.value)} /></label>
              <label>Latitude<input value={form.latitude} onChange={(event) => updateForm('latitude', event.target.value)} /></label>
              <label>Longitude<input value={form.longitude} onChange={(event) => updateForm('longitude', event.target.value)} /></label>
            </div>
            <div className="form-grid two-cols">
              <label>{tr('المالك/المطور/الشركاء *', 'Owner/developer/partners *')}<textarea required value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} /></label>
              <label>{tr('التحديات والمخاطر', 'Risks')}<textarea value={form.key_risks} onChange={(event) => updateForm('key_risks', event.target.value)} /></label>
              <label>{tr('تاريخ التشغيل المتوقع', 'Expected operation date')}<input type="date" value={form.expected_cod} onChange={(event) => updateForm('expected_cod', event.target.value)} /></label>
              <label>{tr('التكلفة التقديرية', 'Estimated cost')}<input value={form.estimated_cost} onChange={(event) => updateForm('estimated_cost', event.target.value)} /></label>
              <label>{tr('الربط الشبكي', 'Grid connection')}<input value={form.grid_connection} onChange={(event) => updateForm('grid_connection', event.target.value)} /></label>
            </div>
            <div className="form-grid two-cols sources-grid">
              <label>{tr('اسم المصدر', 'Source name')}<input value={form.source_name} onChange={(event) => updateForm('source_name', event.target.value)} /></label>
              <label>{tr('رابط المصدر', 'Source URL')}<input value={form.source_url} onChange={(event) => updateForm('source_url', event.target.value)} /></label>
            </div>
            <p className="admin-form-note"><ClipboardList size={15} /> {useFirebaseData ? tr('الحفظ الحقيقي مفعل عبر Firebase.', 'Real saving is enabled through Firebase.') : tr('الحفظ مؤقت الآن.', 'Saving is temporary now.')}</p>
            <div className="modal-footer"><button type="button" className="admin-secondary" onClick={closeModal}>{tr('إلغاء', 'Cancel')}</button><button type="submit" className="admin-primary" disabled={isSaving}>{isSaving ? tr('جار الحفظ...', 'Saving...') : tr('حفظ', 'Save')}</button></div>
          </form>
        </div>
      )}

      {timelineProject && <TimelineManager language={language} metadata={metadata} project={timelineProject} initialUpdates={useFirebaseData ? [] : getProjectUpdates(timelineProject.id)} onClose={() => setTimelineProject(null)} />}
    </section>
  );
}
