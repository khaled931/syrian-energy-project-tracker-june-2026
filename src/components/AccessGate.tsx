import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { GoogleAuthProvider, browserLocalPersistence, getRedirectResult, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../firebase/firebaseClient';
import { canManage, readAllowedUsers } from '../utils/permissions';

interface AccessGateProps { children: ReactNode; language: 'ar' | 'en'; }

export default function AccessGate({ children, language }: AccessGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(readAllowedUsers()[0] ?? '');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
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
        if (!canManage(result.user.email)) setMessage(isAr ? `الحساب غير مسموح: ${result.user.email}` : `Account not allowed: ${result.user.email}`);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Login failed'));

    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, [isAr]);

  const complete = (signedUser: User) => {
    setUser(signedUser);
    if (!canManage(signedUser.email)) setMessage(isAr ? `الحساب غير مسموح: ${signedUser.email}` : `Account not allowed: ${signedUser.email}`);
    else setMessage('');
  };

  const signInByEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!firebaseAuth) return;
    try {
      setBusy(true);
      setMessage('');
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(firebaseAuth, email.trim(), secret);
      complete(result.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Email login failed');
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!firebaseAuth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      setMessage('');
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const result = await signInWithPopup(firebaseAuth, provider);
      complete(result.user);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : '';
      if (code.includes('popup-blocked') || code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Google login failed');
    }
  };

  const logout = async () => { if (firebaseAuth) await signOut(firebaseAuth); setUser(null); };

  if (loading) return <section className="empty-card">{isAr ? 'جار التحقق من الصلاحية...' : 'Checking access...'}</section>;

  const isAllowed = canManage(user?.email);
  if (!user || !isAllowed) {
    return (
      <section className="access-card">
        <h2>{isAr ? 'تسجيل دخول الإدارة' : 'Management login'}</h2>
        <p>{isAr ? 'استخدم البريد وكلمة المرور لحساب الإدارة. Google متاح كخيار احتياطي.' : 'Use the admin email and password. Google is available as a fallback.'}</p>
        <form onSubmit={signInByEmail} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={isAr ? 'إيميل الإدارة' : 'Admin email'} type="email" required />
          <input value={secret} onChange={(event) => setSecret(event.target.value)} placeholder={isAr ? 'كلمة المرور' : 'Password'} type="password" required />
          <button className="admin-primary" type="submit" disabled={busy}>{busy ? (isAr ? 'جار الدخول...' : 'Signing in...') : (isAr ? 'دخول بالبريد' : 'Email sign in')}</button>
        </form>
        <button className="admin-secondary" onClick={signInWithGoogle}>{isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}</button>
        {user?.email && <p className="admin-form-note">{isAr ? 'الحساب المسجل حالياً:' : 'Current signed-in account:'} {user.email}</p>}
        {message && <p className="admin-form-note">{message}</p>}
        <small>{isAr ? 'الحسابات المسموحة حالياً:' : 'Allowed accounts:'} {allowedUsers.join(', ') || '-'}</small>
        {user && <button className="admin-secondary" onClick={logout}>{isAr ? 'تسجيل الخروج والمحاولة بحساب آخر' : 'Sign out and try another account'}</button>}
      </section>
    );
  }

  return <><div className="access-bar"><span>{isAr ? 'تم تسجيل الدخول:' : 'Signed in:'} {user.email}</span><button className="admin-secondary" onClick={logout}>{isAr ? 'تسجيل الخروج' : 'Sign out'}</button></div>{children}</>;
}
