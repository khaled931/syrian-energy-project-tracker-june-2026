import { addDoc, collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import type { Metadata, Project, ProjectUpdate } from '../types/project';
import { firebaseDb, isFirebaseConfigured } from '../firebase/firebaseClient';

export const useFirebaseData = import.meta.env.VITE_DATA_SOURCE === 'firebase';

function requireDb() {
  if (!isFirebaseConfigured || !firebaseDb) {
    throw new Error('Firebase is not configured. Add Firebase environment variables first.');
  }
  return firebaseDb;
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}

function sortUpdates(updates: ProjectUpdate[]): ProjectUpdate[] {
  return [...updates].sort((a, b) => String(b.update_date).localeCompare(String(a.update_date)));
}

export async function getFirebaseProjects(): Promise<Project[]> {
  const db = requireDb();
  const snapshot = await getDocs(collection(db, 'projects'));
  return sortProjects(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Project[]);
}

export async function getFirebasePublishedProjects(): Promise<Project[]> {
  const projects = await getFirebaseProjects();
  return projects.filter((project) => project.is_published);
}

export async function saveFirebaseProject(project: Project): Promise<void> {
  const db = requireDb();
  await setDoc(doc(db, 'projects', project.id), project, { merge: true });
}

export async function createFirebaseProject(project: Project): Promise<string> {
  const db = requireDb();
  const document = await addDoc(collection(db, 'projects'), project);
  await setDoc(document, { id: document.id }, { merge: true });
  return document.id;
}

export async function deleteFirebaseProject(projectId: string): Promise<void> {
  const db = requireDb();
  await deleteDoc(doc(db, 'projects', projectId));
}

export async function getFirebaseProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'project_updates'), where('project_id', '==', projectId)));
  return sortUpdates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ProjectUpdate[]);
}

export async function saveFirebaseProjectUpdate(update: ProjectUpdate): Promise<string> {
  const db = requireDb();
  const document = await addDoc(collection(db, 'project_updates'), update);
  await setDoc(document, { id: document.id }, { merge: true });
  return document.id;
}

export async function getFirebaseMetadata(): Promise<Metadata | null> {
  return null;
}
