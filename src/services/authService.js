import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// User roles mirror lib/models/user_model.dart from the Flutter app
export const UserRole = {
  LANDLORD: 'landlord',
  TENANT: 'tenant',
};

export async function registerUser({ email, password, name, role, phone }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userDoc = {
    uid: cred.user.uid,
    email,
    name,
    role,
    phone: phone || '',
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', cred.user.uid), userDoc);
  return userDoc;
}

export async function loginUser({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return getUserProfile(cred.user.uid);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(newPassword) {
  if (!auth.currentUser) throw new Error('No user is signed in.');
  await updatePassword(auth.currentUser, newPassword);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Subscribes to Firebase auth state; callback receives the Firestore user
// profile (with role) or null when signed out.
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    const profile = await getUserProfile(firebaseUser.uid);
    callback(profile);
  });
}
