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
