export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';

export interface Project {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  governorate: string;
  city_ar: string;
  city_en: string;
  precise_location_ar: string;
  precise_location_en: string;
  latitude: number;
  longitude: number;
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
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_date: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  status_after_update: string;
  source_name: string;
  source_url: string;
}

export interface MetadataItem {
  id: string;
  ar: string;
  en: string;
}

export interface Metadata {
  governorates: MetadataItem[];
  energyTypes: MetadataItem[];
  statuses: MetadataItem[];
  projectTypes: MetadataItem[];
}
