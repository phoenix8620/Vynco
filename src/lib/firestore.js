import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  doc,
  where,
  serverTimestamp,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

// ─── Users / Discover ───────────────────────────────────

export async function fetchUserById(userId) {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── Connection Requests ────────────────────────────────

export async function sendConnectionRequest({ senderId, senderName, senderProfileImageUrl, receiverId, receiverName, receiverProfileImageUrl, message }) {
  // Prevent duplicate requests
  const existingQ = query(
    collection(db, 'connection_requests'),
    where('senderId', '==', senderId),
    where('receiverId', '==', receiverId)
  );
  const existingSnap = await getDocs(existingQ);
  
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  const docRef = await addDoc(collection(db, 'connection_requests'), {
    senderId,
    senderName,
    senderProfileImageUrl: senderProfileImageUrl || null,
    receiverId,
    receiverName,
    receiverProfileImageUrl: receiverProfileImageUrl || null,
    message: message || "Hi! I'd like to connect with you.",
    status: 'accepted',
    respondedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}

export function subscribeToRecentConnections(userId, callback) {
  const qSent = query(
    collection(db, 'connection_requests'),
    where('senderId', '==', userId)
  );
  
  const qRecv = query(
    collection(db, 'connection_requests'),
    where('receiverId', '==', userId)
  );

  let sentDocs = [];
  let recvDocs = [];

  const updateCallback = () => {
    // Merge, sort desc by createdAt, limit 5
    const combined = [...sentDocs, ...recvDocs];
    combined.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    // Deduplicate by ID just in case
    const unique = [];
    const ids = new Set();
    for (const item of combined) {
      if (!ids.has(item.id)) {
        unique.push(item);
        ids.add(item.id);
      }
    }

    callback(unique.slice(0, 5));
  };

  const unsubSent = onSnapshot(qSent, (snap) => {
    sentDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateCallback();
  });

  const unsubRecv = onSnapshot(qRecv, (snap) => {
    recvDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateCallback();
  });

  return () => {
    unsubSent();
    unsubRecv();
  };
}
