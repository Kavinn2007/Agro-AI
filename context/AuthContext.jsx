import { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithRedirect, 
  firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ id: firebaseUser.uid, email: firebaseUser.email });
        setUserProfile({ 
          name: firebaseUser.displayName, 
          photoURL: firebaseUser.photoURL 
        });
        localStorage.setItem('agroai_mock_user', JSON.stringify({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        }));
      } else {
        // Fallback to local storage mock user if not logged into Firebase
        const storedUser = localStorage.getItem('agroai_mock_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser({ id: parsed.id, email: parsed.email });
          setUserProfile({ name: parsed.name, photoURL: parsed.photoURL });
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resolveMockUser = () => {
    const mockUser = { 
      id: `mock-${Date.now()}`, 
      email: 'demo@agroai.app', 
      name: 'Farmer (Demo Account)',
      photoURL: 'https://ui-avatars.com/api/?name=Farmer&background=random'
    };
    localStorage.setItem('agroai_mock_user', JSON.stringify(mockUser));
    setUser({ id: mockUser.id, email: mockUser.email });
    setUserProfile({ name: mockUser.name, photoURL: mockUser.photoURL });
    return { data: { user: mockUser } };
  };

  const signInWithGoogle = async () => {
    try {
      if (auth.app.options.apiKey === "mock-key") {
        console.warn("Using mock user because Firebase API key is missing.");
        return resolveMockUser();
      }
      
      // We must use Redirect here on mobile due to strict browser popup blockers
      await signInWithRedirect(auth, googleProvider);
      // The browser navigates away immediately. We rely on onAuthStateChanged to pick up the user on return.
      return { data: { user: null } };
    } catch (error) {
      console.error("Google sign in redirect error:", error);
      return resolveMockUser();
    }
  };

  const signUp = async (email, password, name) => {
    if (auth.app.options.apiKey === "mock-key") {
      const mockUser = { id: `mock-${Date.now()}`, email, name };
      localStorage.setItem('agroai_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setUserProfile({ name });
      return { data: { user: mockUser } };
    }
    
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // For immediate UI update before onAuthStateChanged kicks in
    setUser({ id: userCredential.user.uid, email: userCredential.user.email });
    setUserProfile({ name });
    return userCredential;
  };

  const signIn = async (email, password) => {
    if (auth.app.options.apiKey === "mock-key") {
      const name = email.split('@')[0];
      const mockUser = { id: `mock-${Date.now()}`, email, name };
      localStorage.setItem('agroai_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setUserProfile({ name });
      return { data: { user: mockUser } };
    }
    
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // For immediate UI update
    setUser({ id: userCredential.user.uid, email: userCredential.user.email });
    setUserProfile({ 
      name: userCredential.user.displayName || email.split('@')[0], 
      photoURL: userCredential.user.photoURL 
    });
    return userCredential;
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("Firebase signout error:", e);
    }
    localStorage.removeItem('agroai_mock_user');
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
