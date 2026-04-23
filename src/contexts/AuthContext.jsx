import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser) => {
    try {
      const ref = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const profile = { id: snap.id, ...snap.data() };
        setUserProfile(profile);
        return profile;
      }
      setUserProfile(null);
      return null;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUserProfile(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchProfile(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(result.user);
    return { user: result.user, profile };
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      login,
      logout,
      isAdmin: userProfile?.role === 'admin',
      isTeacher: userProfile?.role === 'teacher',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}