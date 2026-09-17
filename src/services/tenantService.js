import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const tenantsRef = collection(db, 'tenants');

export async function addTenant(landlordId, data) {
  const docRef = await addDoc(tenantsRef, {
    ...data,
    landlordId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTenant(tenantId, data) {
  await updateDoc(doc(db, 'tenants', tenantId), data);
}

export async function deleteTenant(tenantId) {
  await deleteDoc(doc(db, 'tenants', tenantId));
}

export async function getTenantsByLandlord(landlordId) {
  const q = query(tenantsRef, where('landlordId', '==', landlordId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Links a logged-in tenant (Firebase Auth user) to the tenant record their
// landlord created for them, by matching email. Used so a tenant can see
// their own rent/payments without a separate account-linking flow.
export async function getActiveTenantByEmail(email) {
  const q = query(tenantsRef, where('email', '==', email), where('isActive', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}
