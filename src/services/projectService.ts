import type { Metadata, Project, ProjectUpdate } from '../types/project';
import { JsonProjectAdapter } from '../data-adapters/jsonProjectAdapter';
import type { ProjectAdapter } from '../data-adapters/projectAdapter';

const adapter: ProjectAdapter = new JsonProjectAdapter();

export function getAllProjects(): Project[] {
  return adapter.getProjects();
}

export function getPublishedProjects(): Project[] {
  return adapter.getProjects().filter((project) => project.is_published);
}

export function getProjectUpdates(projectId: string): ProjectUpdate[] {
  return adapter.getProjectUpdates().filter((update) => update.project_id === projectId);
}

export function getMetadata(): Metadata {
  return adapter.getMetadata();
}

export function getFeaturedProjects(): Project[] {
  return getPublishedProjects().filter((project) => project.is_featured);
}
