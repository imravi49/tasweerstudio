import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User } from '@/lib/types';

const ADMIN_EMAIL = 'Ravi.rv73838@gmail.com';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, contact?: string) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user is admin - MUST happen before any Firestore access
      const isAdminUser = user.email === ADMIN_EMAIL;
      
      if (!isAdminUser) {
        // Not admin, sign out and throw error
        await firebaseSignOut(auth);
        throw new Error('Access denied – Admin only.');
      }
      
      // Admin user - create/update Firestore record
      // Use setDoc with merge to avoid needing to read first
      const newUser: User = {
        id: user.uid,
        name: user.displayName || 'Ravi Sharma',
        email: user.email!,
        role: 'admin',
        is_finalized: false,
        created_at: new Date().toISOString(),
      };
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, newUser, { merge: true });
      setUserData(newUser);
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      // If it's our custom error, re-throw it
      if (error.message === 'Access denied – Admin only.') {
        throw error;
      }
      // For other errors (like Firestore issues), still allow admin login
      if (error.code?.includes('firestore') || error.code?.includes('permission-denied')) {
        console.warn('Firestore error during admin login, but allowing login to proceed');
        // Set userData from Firebase Auth info
        const user = auth.currentUser;
        if (user && user.email === ADMIN_EMAIL) {
          setUserData({
            id: user.uid,
            name: user.displayName || 'Ravi Sharma',
            email: user.email!,
            role: 'admin',
            is_finalized: false,
            created_at: new Date().toISOString(),
          });
          return; // Success despite Firestore error
        }
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, contact?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      const newUser: User = {
        id: user.uid,
        name,
        email,
        contact,
        role: 'user',
        is_finalized: false,
        created_at: new Date().toISOString(),
      };
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, newUser);
      setUserData(newUser);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';

  const value = {
    currentUser,
    userData,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    updateUserPassword,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
