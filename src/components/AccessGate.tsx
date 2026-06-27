import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../firebase/firebaseClient';
import { canManage, readAllowedUsers } from '../utils/permissions';

interface AccessGateProps {
  children: ReactNode;
  language: 'ar' | 'en';
}

export default function AccessGate({ children, language }: AccessGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setLoading(false);
      setMessage(isAr ? 'Firebase Auth غير مفعّل بعد.' : 'Firebase Auth is not enabled yet.');
      return;
    }
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, [isAr]);

  const signIn = async () => {
    if (!firebaseAuth) return;
    try {
      setMessage('');
      const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      if (!canManage(result.user.email)) {
        await signOut(firebaseAuth);
        setUser(null);
        setMessage(isAr ? 'هذا الحساب غير مصرح له بإدارة المنصة.' : 'This account is not allowed to manage the platform.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const logout = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
    setUser(null);
  };

  if (loading) {
    return <section className="empty-card">{isAr ? 'جار التحقق من الصلاحية...' : 'Checking access...'}</section>;
  }

  if (!user || !canManage(user.email)) {
    return (
      <section className="access-card">
        <h2>{isAr ? 'تسجيل دخول الإدارة' : 'Management login'}</h2>
        <p>{isAr ? 'يجب تسجيل الدخول بحساب مصرح له قبل فتح لوحة الإدارة.' : 'Sign in with an allowed account before opening the management dashboard.'}</p>
        <button className="admin-primary" onClick={signIn}>{isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}</button>
        {message && <p className="admin-form-note">{message}</p>}
        <small>{isAr ? 'الحسابات المسموحة حالياً:' : 'Allowed accounts:'} {readAllowedUsers().join(', ') || '-'}</small>
      </section>
    );
  }

  return (
    <>
      <div className="access-bar">
        <span>{isAr ? 'تم تسجيل الدخول:' : 'Signed in:'} {user.email}</span>
        <button className="admin-secondary" onClick={logout}>{isAr ? 'تسجيل الخروج' : 'Sign out'}</button>
      </div>
      {children}
    </>
  );
}
