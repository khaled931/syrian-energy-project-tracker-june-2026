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

async function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Check Firestore Database, rules, and browser console.`));
    }, 12000);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}

function sortUpdates(updates: ProjectUpdate[]): ProjectUpdate[] {
  return [...updates].sort((a, b) => String(b.update_date).localeCompare(String(a.update_date)));
}

export async function getFirebaseProjects(): Promise<Project[]> {
  const db = requireDb();
  const snapshot = await withTimeout(getDocs(collection(db, 'projects')), 'Loading projects from Firebase');
  return sortProjects(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Project[]);
}

export async function getFirebasePublishedProjects(): Promise<Project[]> {
  const projects = await getFirebaseProjects();
  return projects.filter((project) => project.is_published);
}

export async function saveFirebaseProject(project: Project): Promise<void> {
  const db = requireDb();
  await withTimeout(setDoc(doc(db, 'projects', project.id), project, { merge: true }), 'Saving project to Firebase');
}

export async function createFirebaseProject(project: Project): Promise<string> {
  const db = requireDb();
  const document = await withTimeout(addDoc(collection(db, 'projects'), project), 'Creating project in Firebase');
  await withTimeout(setDoc(document, { id: document.id }, { merge: true }), 'Updating project id in Firebase');
  return document.id;
}

export async function deleteFirebaseProject(projectId: string): Promise<void> {
  const db = requireDb();
  await withTimeout(deleteDoc(doc(db, 'projects', projectId)), 'Deleting project from Firebase');
}

export async function getFirebaseProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const db = requireDb();
  const snapshot = await withTimeout(getDocs(query(collection(db, 'project_updates'), where('project_id', '==', projectId))), 'Loading project updates from Firebase');
  return sortUpdates(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ProjectUpdate[]);
}

export async function saveFirebaseProjectUpdate(update: ProjectUpdate): Promise<string> {
  const db = requireDb();
  const document = await withTimeout(addDoc(collection(db, 'project_updates'), update), 'Saving project update to Firebase');
  await withTimeout(setDoc(document, { id: document.id }, { merge: true }), 'Updating project update id in Firebase');
  return document.id;
}

export async function getFirebaseMetadata(): Promise<Metadata | null> {
  return null;
}
