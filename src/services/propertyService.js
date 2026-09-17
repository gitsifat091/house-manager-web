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

const propertiesRef = collection(db, 'properties');

export async function addProperty(landlordId, data) {
  const docRef = await addDoc(propertiesRef, {
    ...data,
    landlordId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateProperty(propertyId, data) {
  await updateDoc(doc(db, 'properties', propertyId), data);
}

export async function deleteProperty(propertyId) {
  await deleteDoc(doc(db, 'properties', propertyId));
}

export async function getPropertiesByLandlord(landlordId) {
  const q = query(propertiesRef, where('landlordId', '==', landlordId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Used by the tenant "find home" page — properties marked as listed/to-let
export async function getListedProperties() {
  const q = query(propertiesRef, where('isListed', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
