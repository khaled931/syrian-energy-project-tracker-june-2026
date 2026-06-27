import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import type { Metadata, Project, ProjectUpdate } from '../types/project';
import { firebaseDb, isFirebaseConfigured } from '../firebase/firebaseClient';

function requireDb() {
  if (!isFirebaseConfigured || !firebaseDb) {
    throw new Error('Firebase is not configured. Add Firebase environment variables first.');
  }
  return firebaseDb;
}

export async function getFirebaseProjects(): Promise<Project[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'projects'), orderBy('updated_at', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Project[];
}

export async function getFirebasePublishedProjects(): Promise<Project[]> {
  const db = requireDb();
  const snapshot = await getDocs(query(collection(db, 'projects'), where('is_published', '==', true), orderBy('updated_at', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Project[];
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
  const snapshot = await getDocs(query(collection(db, 'project_updates'), where('project_id', '==', projectId), orderBy('update_date', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as ProjectUpdate[];
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
