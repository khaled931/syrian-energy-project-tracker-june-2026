import type { Metadata, Project, ProjectUpdate } from '../types/project';
import type { ProjectAdapter } from './projectAdapter';

export class FirebaseProjectAdapter implements ProjectAdapter {
  getProjects(): Project[] {
    throw new Error('FirebaseProjectAdapter is not implemented yet. This will be connected in the Firebase phase.');
  }

  getProjectUpdates(): ProjectUpdate[] {
    throw new Error('FirebaseProjectAdapter is not implemented yet. This will be connected in the Firebase phase.');
  }

  getMetadata(): Metadata {
    throw new Error('FirebaseProjectAdapter is not implemented yet. This will be connected in the Firebase phase.');
  }
}
