import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthorized: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Subscribe to user profile changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist (e.g. first Google login)
            const isAdmin = firebaseUser.email === 'jpunitau@gmail.com';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Usuário',
              photoURL: firebaseUser.photoURL || '',
              role: isAdmin ? 'admin' : 'user',
              status: isAdmin ? 'authorized' : 'pending',
              createdAt: Date.now()
            };
            try {
              await setDoc(userRef, newProfile);
              setUserProfile(newProfile);
            } catch (err) {
              console.error("Error creating user profile:", err);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("User profile snapshot error:", error);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(newUser, { displayName: name });
      
      const isAdmin = email === 'jpunitau@gmail.com';
      const newProfile: UserProfile = {
        uid: newUser.uid,
        email: email,
        displayName: name,
        role: isAdmin ? 'admin' : 'user',
        status: isAdmin ? 'authorized' : 'pending',
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'users', newUser.uid), newProfile);
    } catch (error) {
      console.error("Signup failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isAuthorized = userProfile?.status === 'authorized' || userProfile?.role === 'admin';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isAuthorized, 
      isAdmin,
      loginWithGoogle, 
      loginWithEmail,
      signupWithEmail,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
