import type { Metadata, Project, ProjectUpdate } from '../types/project';

export interface ProjectAdapter {
  getProjects(): Project[];
  getProjectUpdates(): ProjectUpdate[];
  getMetadata(): Metadata;
}
