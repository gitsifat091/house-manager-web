import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

// Fields mirror lib/models/rental_request_model.dart: landlordId,
// propertyId/propertyName, roomId/roomNumber, rentAmount, tenantUserId,
// tenantName/tenantPhone/tenantEmail/tenantNid, message,
// status ('pending' | 'accepted' | 'rejected'), createdAt, respondedAt.
export const RentalRequestStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

const requestsRef = collection(db, 'rentalRequests');

export async function addRentalRequest(data) {
  const docRef = await addDoc(requestsRef, {
    ...data,
    status: RentalRequestStatus.PENDING,
    createdAt: Date.now(),
    respondedAt: null,
  });
  return docRef.id;
}

export async function updateRentalRequestStatus(requestId, status) {
  await updateDoc(doc(db, 'rentalRequests', requestId), {
    status,
    respondedAt: Date.now(),
  });
}

export async function getRequestsByLandlord(landlordId) {
  const q = query(requestsRef, where('landlordId', '==', landlordId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getRequestsByTenantEmail(email) {
  const q = query(requestsRef, where('tenantEmail', '==', email));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Pending requests for a property — used to hide rooms that already have
// an unanswered request, so two tenants can't both request the same room.
export async function getPendingRequestsForProperty(propertyId) {
  const q = query(
    requestsRef,
    where('propertyId', '==', propertyId),
    where('status', '==', RentalRequestStatus.PENDING)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// When one request for a room is accepted, any other still-pending
// requests for that same room no longer make sense — auto-reject them.
export async function rejectOtherPendingForRoom(roomId, exceptRequestId) {
  const q = query(
    requestsRef,
    where('roomId', '==', roomId),
    where('status', '==', RentalRequestStatus.PENDING)
  );
  const snap = await getDocs(q);
  const others = snap.docs.filter((d) => d.id !== exceptRequestId);
  await Promise.all(
    others.map((d) =>
      updateDoc(doc(db, 'rentalRequests', d.id), {
        status: RentalRequestStatus.REJECTED,
        respondedAt: Date.now(),
      })
    )
  );
}
