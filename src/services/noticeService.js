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

// Fields mirror lib/models/notice_model.dart: landlordId, title, body,
// createdAt. Notices are landlord-wide (all tenants across all of a
// landlord's properties see the same notices), not per-property.
const noticesRef = collection(db, 'notices');

export async function addNotice(landlordId, data) {
  const docRef = await addDoc(noticesRef, {
    ...data,
    landlordId,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateNotice(noticeId, data) {
  await updateDoc(doc(db, 'notices', noticeId), data);
}

export async function deleteNotice(noticeId) {
  await deleteDoc(doc(db, 'notices', noticeId));
}

export async function getNoticesByLandlord(landlordId) {
  const q = query(noticesRef, where('landlordId', '==', landlordId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
