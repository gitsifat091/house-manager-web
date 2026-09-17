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

// Fields mirror lib/models/rule_model.dart: landlordId, title, description,
// category ('house' | 'legal' | 'payment' | 'maintenance'), isActive,
// createdAt. Rules are landlord-wide, same as Notices.
export const RuleCategory = {
  HOUSE: 'house',
  LEGAL: 'legal',
  PAYMENT: 'payment',
  MAINTENANCE: 'maintenance',
};

const rulesRef = collection(db, 'rules');

export async function addRule(landlordId, data) {
  const docRef = await addDoc(rulesRef, {
    ...data,
    landlordId,
    isActive: true,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateRule(ruleId, data) {
  await updateDoc(doc(db, 'rules', ruleId), data);
}

export async function deleteRule(ruleId) {
  await deleteDoc(doc(db, 'rules', ruleId));
}

export async function getRulesByLandlord(landlordId) {
  const q = query(rulesRef, where('landlordId', '==', landlordId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
