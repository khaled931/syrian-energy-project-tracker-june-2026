import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { Language, Metadata, Project, ProjectUpdate } from '../types/project';

interface TimelineManagerProps {
  language: Language;
  metadata: Metadata;
  project: Project;
  initialUpdates: ProjectUpdate[];
  onClose: () => void;
}

const emptyUpdate = {
  update_date: new Date().toISOString().slice(0, 10),
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  status_after_update: '',
  source_name: '',
  source_url: ''
};

export default function TimelineManager({ language, metadata, project, initialUpdates, onClose }: TimelineManagerProps) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>(initialUpdates);
  const [form, setForm] = useState(emptyUpdate);
  const isAr = language === 'ar';

  const updateField = (field: keyof typeof emptyUpdate, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addUpdate = (event: FormEvent) => {
    event.preventDefault();
    const update: ProjectUpdate = {
      id: `update-${Date.now()}`,
      project_id: project.id,
      update_date: form.update_date,
      title_ar: form.title_ar,
      title_en: form.title_en,
      description_ar: form.description_ar,
      description_en: form.description_en,
      status_after_update: form.status_after_update || project.status,
      source_name: form.source_name || project.source_name,
      source_url: form.source_url || project.source_url
    };
    setUpdates((current) => [update, ...current]);
    setForm(emptyUpdate);
  };

  const copyTimelineJson = async () => {
    const text = JSON.stringify(updates, null, 2);
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <section className="admin-project-modal timeline-modal">
        <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        <h3>{isAr ? 'إدارة تحديثات المشروع' : 'Manage project updates'}</h3>
        <p className="timeline-project-title">{isAr ? project.title_ar : project.title_en}</p>

        <form className="timeline-form" onSubmit={addUpdate}>
          <div className="form-grid two-cols">
            <label>{isAr ? 'تاريخ التحديث' : 'Update date'}<input type="date" value={form.update_date} onChange={(event) => updateField('update_date', event.target.value)} /></label>
            <label>{isAr ? 'الحالة بعد التحديث' : 'Status after update'}<select value={form.status_after_update} onChange={(event) => updateField('status_after_update', event.target.value)}><option value="">{isAr ? 'اختر' : 'Select'}</option>{metadata.statuses.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></label>
            <label>{isAr ? 'عنوان التحديث بالعربية' : 'Arabic update title'}<input required value={form.title_ar} onChange={(event) => updateField('title_ar', event.target.value)} /></label>
            <label>{isAr ? 'عنوان التحديث بالإنجليزية' : 'English update title'}<input value={form.title_en} onChange={(event) => updateField('title_en', event.target.value)} /></label>
            <label>{isAr ? 'وصف التحديث بالعربية' : 'Arabic update description'}<textarea required value={form.description_ar} onChange={(event) => updateField('description_ar', event.target.value)} /></label>
            <label>{isAr ? 'وصف التحديث بالإنجليزية' : 'English update description'}<textarea value={form.description_en} onChange={(event) => updateField('description_en', event.target.value)} /></label>
            <label>{isAr ? 'اسم المصدر' : 'Source name'}<input value={form.source_name} onChange={(event) => updateField('source_name', event.target.value)} /></label>
            <label>{isAr ? 'رابط المصدر' : 'Source URL'}<input value={form.source_url} onChange={(event) => updateField('source_url', event.target.value)} /></label>
          </div>
          <div className="modal-footer">
            <button type="button" className="admin-secondary" onClick={copyTimelineJson}>{isAr ? 'نسخ JSON للتحديثات' : 'Copy updates JSON'}</button>
            <button type="submit" className="admin-primary"><Plus size={16} /> {isAr ? 'إضافة تحديث' : 'Add update'}</button>
          </div>
        </form>

        <div className="timeline-list">
          {updates.map((update) => (
            <article className="timeline-card" key={update.id}>
              <time>{update.update_date}</time>
              <strong>{isAr ? update.title_ar : update.title_en || update.title_ar}</strong>
              <p>{isAr ? update.description_ar : update.description_en || update.description_ar}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
