import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { GoogleAuthProvider, browserLocalPersistence, getRedirectResult, onAuthStateChanged, setPersistence, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
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
  const allowedUsers = readAllowedUsers();

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setLoading(false);
      setMessage(isAr ? 'Firebase Auth غير مفعّل بعد.' : 'Firebase Auth is not enabled yet.');
      return;
    }

    setPersistence(firebaseAuth, browserLocalPersistence)
      .then(() => getRedirectResult(firebaseAuth))
      .then((result) => {
        if (!result?.user) return;
        setUser(result.user);
        if (!canManage(result.user.email)) {
          setMessage(
            isAr
              ? `تم تسجيل الدخول بهذا الحساب، لكنه غير موجود في قائمة الإدارة: ${result.user.email}`
              : `Signed in with this account, but it is not in the admin allowlist: ${result.user.email}`
          );
        }
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Login failed'));

    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, [isAr]);

  const signIn = async () => {
    if (!firebaseAuth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      setMessage('');
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const result = await signInWithPopup(firebaseAuth, provider);
      setUser(result.user);
      if (!canManage(result.user.email)) {
        setMessage(isAr ? `هذا الحساب غير موجود في قائمة الإدارة: ${result.user.email}` : `This account is not in the admin allowlist: ${result.user.email}`);
      }
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : '';
      if (code.includes('popup-blocked') || code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        try {
          await signInWithRedirect(firebaseAuth, provider);
          return;
        } catch (redirectError) {
          setMessage(redirectError instanceof Error ? redirectError.message : 'Redirect login failed');
          return;
        }
      }
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

  const isAllowed = canManage(user?.email);

  if (!user || !isAllowed) {
    return (
      <section className="access-card">
        <h2>{isAr ? 'تسجيل دخول الإدارة' : 'Management login'}</h2>
        <p>{isAr ? 'يجب تسجيل الدخول بحساب مصرح له قبل فتح لوحة الإدارة.' : 'Sign in with an allowed account before opening the management dashboard.'}</p>
        <button className="admin-primary" onClick={signIn}>{isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}</button>
        {user?.email && <p className="admin-form-note">{isAr ? 'الحساب المسجل حالياً:' : 'Current signed-in account:'} {user.email}</p>}
        {message && <p className="admin-form-note">{message}</p>}
        <small>{isAr ? 'الحسابات المسموحة حالياً:' : 'Allowed accounts:'} {allowedUsers.join(', ') || '-'}</small>
        {user && <button className="admin-secondary" onClick={logout}>{isAr ? 'تسجيل الخروج والمحاولة بحساب آخر' : 'Sign out and try another account'}</button>}
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
