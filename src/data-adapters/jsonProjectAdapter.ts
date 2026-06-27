import type { Metadata, Project, ProjectUpdate } from '../types/project';
import type { ProjectAdapter } from './projectAdapter';
import projectsData from '../../data/projects.json';
import updatesData from '../../data/project-updates.json';
import metadataData from '../../data/metadata.json';

export class JsonProjectAdapter implements ProjectAdapter {
  getProjects(): Project[] {
    return projectsData as Project[];
  }

  getProjectUpdates(): ProjectUpdate[] {
    return updatesData as ProjectUpdate[];
  }

  getMetadata(): Metadata {
    return metadataData as Metadata;
  }
}
