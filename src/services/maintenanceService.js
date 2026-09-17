import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

// Fields mirror lib/models/maintenance_model.dart from the Flutter app:
// tenantId/tenantName, roomNumber, propertyId/propertyName, landlordId,
// title, description, status ('pending' | 'inProgress' | 'done'), createdAt.
export const MaintenanceStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  DONE: 'done',
};

const maintenanceRef = collection(db, 'maintenance');

export async function addMaintenanceRequest(landlordId, data) {
  const docRef = await addDoc(maintenanceRef, {
    ...data,
    landlordId,
    status: MaintenanceStatus.PENDING,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateMaintenanceStatus(requestId, status) {
  await updateDoc(doc(db, 'maintenance', requestId), { status });
}

export async function deleteMaintenanceRequest(requestId) {
  await deleteDoc(doc(db, 'maintenance', requestId));
}

export async function getMaintenanceByProperty(propertyId) {
  const q = query(maintenanceRef, where('propertyId', '==', propertyId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMaintenanceByTenant(tenantId) {
  const q = query(maintenanceRef, where('tenantId', '==', tenantId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
