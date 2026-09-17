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

// Fields mirror lib/models/payment_model.dart from the Flutter app:
// tenantId/tenantName, roomId/roomNumber, propertyId/propertyName,
// landlordId, amount, month, year, status, paidAt, submittedAt, note,
// paymentMethod, transactionId, rejectionReason.
export const PaymentStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REJECTED: 'rejected',
};

const paymentsRef = collection(db, 'payments');

export async function addPayment(landlordId, data) {
  const docRef = await addDoc(paymentsRef, {
    ...data,
    landlordId,
    status: data.status || PaymentStatus.PENDING,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePayment(paymentId, data) {
  await updateDoc(doc(db, 'payments', paymentId), data);
}

export async function deletePayment(paymentId) {
  await deleteDoc(doc(db, 'payments', paymentId));
}

export async function getPaymentsByProperty(propertyId) {
  const q = query(paymentsRef, where('propertyId', '==', propertyId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPaymentsByTenant(tenantId) {
  const q = query(paymentsRef, where('tenantId', '==', tenantId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Landlord confirms a tenant paid (manually recorded, or approving a
// tenant-submitted payment).
export async function markPaymentPaid(paymentId, { paymentMethod, transactionId } = {}) {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: PaymentStatus.PAID,
    paidAt: Date.now(),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(transactionId ? { transactionId } : {}),
  });
}

// Landlord rejects a tenant-submitted payment (sends it back to pending).
export async function rejectPayment(paymentId, rejectionReason) {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: PaymentStatus.REJECTED,
    rejectionReason: rejectionReason || '',
  });
}

// Tenant submits proof of payment for the landlord to review.
export async function submitPayment(paymentId, { paymentMethod, transactionId, note }) {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: PaymentStatus.SUBMITTED,
    submittedAt: Date.now(),
    paymentMethod: paymentMethod || '',
    transactionId: transactionId || '',
    note: note || '',
    rejectionReason: null,
  });
}
