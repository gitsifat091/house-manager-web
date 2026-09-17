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

const roomsRef = collection(db, 'rooms');

export async function addRoom(propertyId, data) {
  const docRef = await addDoc(roomsRef, {
    ...data,
    propertyId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateRoom(roomId, data) {
  await updateDoc(doc(db, 'rooms', roomId), data);
}

export async function deleteRoom(roomId) {
  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function getRoomsByProperty(propertyId) {
  const q = query(roomsRef, where('propertyId', '==', propertyId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Called when a tenant is assigned to a room (marks it occupied and
// stamps who's in it, so the Rooms page reflects reality).
export async function occupyRoom(roomId, tenantId, tenantName) {
  await updateDoc(doc(db, 'rooms', roomId), {
    status: 'occupied',
    tenantId,
    tenantName,
  });
}

// Called when a tenant moves out or is deleted, freeing the room back up.
export async function vacateRoom(roomId) {
  await updateDoc(doc(db, 'rooms', roomId), {
    status: 'vacant',
    tenantId: null,
    tenantName: null,
  });
}
