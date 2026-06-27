import type { Language, Metadata, Project } from '../types/project';

interface AdminDashboardProps {
  language: Language;
  projects: Project[];
  metadata: Metadata;
}

const copy = {
  ar: {
    title: 'لوحة الإدارة',
    subtitle: 'واجهة أولية لإدارة مشاريع الطاقة. الحفظ المباشر سيضاف لاحقاً عند ربط Firebase.',
    totalProjects: 'إجمالي المشاريع',
    published: 'منشور',
    draft: 'مسودة',
    formTitle: 'نموذج إضافة مشروع',
    tableTitle: 'قائمة المشاريع الحالية',
    titleAr: 'العنوان بالعربية',
    titleEn: 'العنوان بالإنجليزية',
    governorate: 'المحافظة',
    energyType: 'نوع الطاقة',
    status: 'الحالة',
    capacity: 'القدرة',
    source: 'رابط المصدر',
    note: 'في هذه المرحلة يتم تخزين البيانات في ملفات JSON داخل GitHub. في المرحلة القادمة سيتم تفعيل التسجيل والصلاحيات والحفظ المباشر عبر Firebase.'
  },
  en: {
    title: 'Admin Dashboard',
    subtitle: 'An early admin interface for energy projects. Real write operations will be added later with Firebase.',
    totalProjects: 'Total projects',
    published: 'Published',
    draft: 'Draft',
    formTitle: 'Add project form',
    tableTitle: 'Current projects',
    titleAr: 'Arabic title',
    titleEn: 'English title',
    governorate: 'Governorate',
    energyType: 'Energy type',
    status: 'Status',
    capacity: 'Capacity',
    source: 'Source URL',
    note: 'In this phase, data is stored in JSON files inside GitHub. Next, login, permissions, and real writes will be enabled through Firebase.'
  }
};

export default function AdminDashboard({ language, projects, metadata }: AdminDashboardProps) {
  const t = copy[language];
  const publishedCount = projects.filter((project) => project.is_published).length;

  return (
    <section className="admin-panel glass">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <div className="admin-stats">
          <div><strong>{projects.length}</strong><span>{t.totalProjects}</span></div>
          <div><strong>{publishedCount}</strong><span>{t.published}</span></div>
          <div><strong>{projects.length - publishedCount}</strong><span>{t.draft}</span></div>
        </div>
      </div>

      <div className="admin-layout">
        <form className="admin-card">
          <h3>{t.formTitle}</h3>
          <input placeholder={t.titleAr} />
          <input placeholder={t.titleEn} />
          <select>
            <option>{t.governorate}</option>
            {metadata.governorates.map((item) => <option key={item.id}>{item[language]}</option>)}
          </select>
          <select>
            <option>{t.energyType}</option>
            {metadata.energyTypes.map((item) => <option key={item.id}>{item[language]}</option>)}
          </select>
          <select>
            <option>{t.status}</option>
            {metadata.statuses.map((item) => <option key={item.id}>{item[language]}</option>)}
          </select>
          <input placeholder={t.capacity} />
          <input placeholder={t.source} />
          <textarea placeholder="Description / الوصف" />
        </form>

        <div className="admin-card">
          <h3>{t.tableTitle}</h3>
          <div className="admin-table">
            {projects.map((project) => (
              <div className="admin-row" key={project.id}>
                <strong>{language === 'ar' ? project.title_ar : project.title_en}</strong>
                <span>{project.capacity}</span>
                <span>{project.is_published ? t.published : t.draft}</span>
              </div>
            ))}
          </div>
          <p className="admin-note">{t.note}</p>
        </div>
      </div>
    </section>
  );
}
