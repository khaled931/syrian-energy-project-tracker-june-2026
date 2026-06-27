import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ClipboardList, Download, FileText, History, MapPin, Pencil, Plus, Trash2, X, Zap } from 'lucide-react';
import type { Language, Metadata, Project } from '../types/project';
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
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  governorate: '',
  city_ar: '',
  city_en: '',
  precise_location_ar: '',
  precise_location_en: '',
  latitude: '',
  longitude: '',
  energy_type: '',
  project_type: '',
  status: '',
  capacity: '',
  owner: '',
  developer: '',
  partners: '',
  expected_cod: '',
  estimated_cost: '',
  grid_connection: '',
  key_risks: '',
  source_name: '',
  source_url: ''
};

const copy = {
  ar: {
    tabsProjects: 'المشاريع',
    tabsData: 'بوابة بيانات الطاقة',
    tabsVisits: 'تحليلات الزيارات',
    title: 'المشاريع الإدارة',
    addProject: 'إضافة مشروع',
    exportCsv: 'Export CSV',
    exportPdf: 'Export PDF',
    delete: 'حذف',
    edit: 'تعديل',
    updates: 'إدارة التحديثات',
    verified: 'Verified',
    newProject: 'مشروع جديد',
    save: 'حفظ',
    cancel: 'إلغاء',
    modalTitleAdd: 'إضافة مشروع',
    modalTitleEdit: 'تعديل مشروع',
    titleAr: 'عنوان المشروع (Project Title) *',
    titleEn: '* English Title',
    descAr: 'وصف المشروع (Project Description) *',
    descEn: '* English Description',
    energyType: 'نوع الطاقة (Energy Type) اختياري',
    projectType: 'نوع المشروع (Project Type) *',
    status: 'الحالة (Status) *',
    capacity: 'القدرة الإنتاجية (Production Capacity)',
    capacityHint: 'إذا لم تُحدد وحدة، سيتم افتراض kW للمشاريع الصغيرة أو MW للمشاريع الكبيرة.',
    owner: 'المالك/المطور/الشركاء (Owner/Developer/Partners) *',
    location: 'الموقع (Location) *',
    cityAr: 'المدينة بالعربية',
    cityEn: 'City in English',
    preciseAr: 'الموقع التفصيلي بالعربية',
    preciseEn: 'Precise location in English',
    lat: 'Latitude',
    lon: 'Longitude',
    expected: 'تاريخ التشغيل المتوقع (Expected Operation Date)',
    cost: 'التكلفة التقديرية (Estimated Cost)',
    grid: 'الربط الشبكي',
    risks: 'أبرز التحديات والمخاطر (Key Challenges and Risks)',
    sources: 'مصادر المعلومات (Information Sources)',
    sourceName: 'اسم المصدر',
    sourceUrl: 'رابط المصدر',
    note: 'ملاحظة: في هذه المرحلة يتم تعديل البيانات داخل الواجهة فقط. عند ربط Firebase سيتم تفعيل الحفظ الحقيقي والصلاحيات.',
    confirmDelete: 'هل تريد حذف هذا المشروع من القائمة المؤقتة؟',
    select: 'اختر / Select',
    results: 'projects'
  },
  en: {
    tabsProjects: 'Projects',
    tabsData: 'Energy Data Portal',
    tabsVisits: 'Visits analytics',
    title: 'Projects admin',
    addProject: 'Add project',
    exportCsv: 'Export CSV',
    exportPdf: 'Export PDF',
    delete: 'Delete',
    edit: 'Edit',
    updates: 'Manage updates',
    verified: 'Verified',
    newProject: 'New project',
    save: 'Save',
    cancel: 'Cancel',
    modalTitleAdd: 'Add project',
    modalTitleEdit: 'Edit project',
    titleAr: 'Arabic project title *',
    titleEn: 'English title *',
    descAr: 'Arabic project description *',
    descEn: 'English description *',
    energyType: 'Energy type',
    projectType: 'Project type *',
    status: 'Status *',
    capacity: 'Production capacity',
    capacityHint: 'If no unit is provided, kW is assumed for small projects and MW for large projects.',
    owner: 'Owner/Developer/Partners *',
    location: 'Location *',
    cityAr: 'Arabic city',
    cityEn: 'City in English',
    preciseAr: 'Precise location in Arabic',
    preciseEn: 'Precise location in English',
    lat: 'Latitude',
    lon: 'Longitude',
    expected: 'Expected operation date',
    cost: 'Estimated cost',
    grid: 'Grid connection',
    risks: 'Key challenges and risks',
    sources: 'Information sources',
    sourceName: 'Source name',
    sourceUrl: 'Source URL',
    note: 'Note: in this phase, edits are temporary in the interface only. Firebase will enable real saves and permissions later.',
    confirmDelete: 'Delete this project from the temporary list?',
    select: 'Select',
    results: 'projects'
  }
};

function getLabel(items: { id: string; ar: string; en: string }[], id: string, lang: Language) {
  return items.find((item) => item.id === id)?.[lang] ?? id;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || `project-${Date.now()}`;
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
  const t = copy[language];
  const [managedProjects, setManagedProjects] = useState<Project[]>(projects);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminFormState>(emptyForm);

  const projectCountLabel = useMemo(() => `${managedProjects.length} ${t.results}`, [managedProjects.length, t.results]);

  const updateForm = (field: keyof AdminFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

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

  const saveProject = (event: FormEvent) => {
    event.preventDefault();
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
      created_at: now,
      updated_at: now
    };

    setManagedProjects((current) => {
      if (!editingId) return [project, ...current];
      return current.map((item) => (item.id === editingId ? project : item));
    });
    closeModal();
  };

  const deleteProject = (projectId: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    setManagedProjects((current) => current.filter((project) => project.id !== projectId));
  };

  const exportCsv = () => {
    const headers = ['id', 'title_ar', 'title_en', 'governorate', 'energy_type', 'project_type', 'status', 'capacity', 'owner', 'source_url'];
    const rows = managedProjects.map((project) => headers.map((key) => {
      const value = String(project[key as keyof Project] ?? '').replace(/"/g, '""');
      return `"${value}"`;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'syrian-energy-projects.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <section className="admin-management-shell">
      <nav className="admin-tabs">
        <button className="active">{t.tabsProjects}</button>
        <button>{t.tabsData}</button>
        <button>{t.tabsVisits}</button>
      </nav>

      <div className="admin-management-header">
        <h2>{t.title} ({projectCountLabel})</h2>
        <div className="admin-actions-bar">
          <button className="admin-secondary" onClick={exportCsv}><Download size={16} /> {t.exportCsv}</button>
          <button className="admin-secondary" onClick={exportPdf}><FileText size={16} /> {t.exportPdf}</button>
          <button className="admin-primary" onClick={openAddModal}><Plus size={16} /> {t.addProject}</button>
        </div>
      </div>

      <div className="admin-list">
        {managedProjects.map((project) => (
          <article className="admin-project-row" key={project.id}>
            <div className="admin-project-main">
              <h3>{language === 'ar' ? project.title_ar : project.title_en}</h3>
              <div className="admin-badges">
                <span className="verified-badge">{t.verified}</span>
                <span>{getLabel(metadata.statuses, project.status, language)}</span>
                <span>{getLabel(metadata.energyTypes, project.energy_type, language)}</span>
                <span>{getLabel(metadata.projectTypes, project.project_type, language)}</span>
              </div>
              <div className="admin-row-meta">
                <span><Zap size={13} /> {project.capacity}</span>
                <span>{project.owner}</span>
                <span><MapPin size={13} /> {language === 'ar' ? project.city_ar : project.city_en}</span>
              </div>
            </div>
            <div className="admin-row-actions">
              <button className="danger" onClick={() => deleteProject(project.id)}><Trash2 size={14} /> {t.delete}</button>
              <button onClick={() => openEditModal(project)}><Pencil size={14} /> {t.edit}</button>
              <button><History size={14} /> {t.updates}</button>
            </div>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-project-modal" onSubmit={saveProject}>
            <button type="button" className="modal-close" onClick={closeModal}><X size={18} /></button>
            <h3>{editingId ? t.modalTitleEdit : t.modalTitleAdd}</h3>

            <div className="form-grid two-cols">
              <label>{t.titleAr}<input required value={form.title_ar} onChange={(event) => updateForm('title_ar', event.target.value)} placeholder="أدخل عنوان المشروع بالعربية" /></label>
              <label>{t.titleEn}<input value={form.title_en} onChange={(event) => updateForm('title_en', event.target.value)} placeholder="Enter project title in English" /></label>
              <label>{t.descAr}<textarea required value={form.description_ar} onChange={(event) => updateForm('description_ar', event.target.value)} placeholder="أدخل وصف المشروع بالعربية" /></label>
              <label>{t.descEn}<textarea value={form.description_en} onChange={(event) => updateForm('description_en', event.target.value)} placeholder="Enter project description in English" /></label>
            </div>

            <div className="form-grid three-cols">
              <label>{t.energyType}<select value={form.energy_type} onChange={(event) => updateForm('energy_type', event.target.value)}><option value="">— غير محدد —</option>{metadata.energyTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
              <label>{t.projectType}<select required value={form.project_type} onChange={(event) => updateForm('project_type', event.target.value)}><option value="">{t.select}</option>{metadata.projectTypes.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
              <label>{t.status}<select required value={form.status} onChange={(event) => updateForm('status', event.target.value)}><option value="">{t.select}</option>{metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
            </div>

            <div className="form-grid two-cols">
              <label>{t.capacity}<input value={form.capacity} onChange={(event) => updateForm('capacity', event.target.value)} placeholder="مثال: 150 kW" /><small>{t.capacityHint}</small></label>
              <label>{t.location}<select required value={form.governorate} onChange={(event) => updateForm('governorate', event.target.value)}><option value="">{t.select}</option>{metadata.governorates.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
              <label>{t.cityAr}<input value={form.city_ar} onChange={(event) => updateForm('city_ar', event.target.value)} /></label>
              <label>{t.cityEn}<input value={form.city_en} onChange={(event) => updateForm('city_en', event.target.value)} /></label>
              <label>{t.preciseAr}<input value={form.precise_location_ar} onChange={(event) => updateForm('precise_location_ar', event.target.value)} /></label>
              <label>{t.preciseEn}<input value={form.precise_location_en} onChange={(event) => updateForm('precise_location_en', event.target.value)} /></label>
              <label>{t.lat}<input value={form.latitude} onChange={(event) => updateForm('latitude', event.target.value)} /></label>
              <label>{t.lon}<input value={form.longitude} onChange={(event) => updateForm('longitude', event.target.value)} /></label>
            </div>

            <div className="form-grid two-cols">
              <label>{t.owner}<textarea required value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} placeholder="Owner/Developer/Partners / المالك/المطور/الشركاء" /></label>
              <label>{t.risks}<textarea value={form.key_risks} onChange={(event) => updateForm('key_risks', event.target.value)} placeholder="Key challenges and risks" /></label>
              <label>{t.expected}<input type="date" value={form.expected_cod} onChange={(event) => updateForm('expected_cod', event.target.value)} /></label>
              <label>{t.cost}<input value={form.estimated_cost} onChange={(event) => updateForm('estimated_cost', event.target.value)} placeholder="Estimated cost / التكلفة التقديرية" /></label>
              <label>{t.grid}<input value={form.grid_connection} onChange={(event) => updateForm('grid_connection', event.target.value)} /></label>
            </div>

            <div className="form-grid two-cols sources-grid">
              <label>{t.sources}<input value={form.source_name} onChange={(event) => updateForm('source_name', event.target.value)} placeholder={t.sourceName} /></label>
              <label>&nbsp;<input value={form.source_url} onChange={(event) => updateForm('source_url', event.target.value)} placeholder={t.sourceUrl} /></label>
            </div>

            <p className="admin-form-note"><ClipboardList size={15} /> {t.note}</p>

            <div className="modal-footer">
              <button type="button" className="admin-secondary" onClick={closeModal}>{t.cancel}</button>
              <button type="submit" className="admin-primary">{t.save}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
