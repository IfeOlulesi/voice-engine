'use client';

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase-client';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email sign-up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

export const logOut = async () => {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign-out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const getCurrentUser = () => {
  if (!auth) return null;
  return auth.currentUser;
};

export const getCurrentUserToken = async () => {
  const user = getCurrentUser();
  if (!user) throw new Error('No authenticated user');
  
  try {
    const token = await user.getIdToken();
    return token;
  } catch (error: any) {
    console.error('Error getting user token:', error);
    throw new Error('Failed to get authentication token');
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};