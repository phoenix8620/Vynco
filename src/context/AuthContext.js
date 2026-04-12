"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    let unsubscribeStats = () => {};

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile();
      unsubscribeStats();

      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(true);

        const docRef = doc(db, 'users', firebaseUser.uid);
        let currentProfile = null;
        let currentConnectionsCount = 0;
        let currentPostsCount = 0;

        const pushProfile = () => {
          if (!currentProfile) return;

          setProfile({
            ...currentProfile,
            connectionsCount: currentConnectionsCount,
            postsCount: currentPostsCount,
          });
        };

        unsubscribeProfile = onSnapshot(
          docRef,
          (docSnap) => {
            currentProfile = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
            pushProfile();
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching user profile:', error);
            setProfile(null);
            setLoading(false);
          }
        );

        const connectionsQuery = query(
          collection(db, 'connections'),
          where('users', 'array-contains', firebaseUser.uid)
        );

        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', firebaseUser.uid)
        );

        const syncProfile = () => {
          if (!currentProfile) return;

          setProfile({
            ...currentProfile,
            connectionsCount: currentConnectionsCount,
            postsCount: currentPostsCount,
          });
        };

        const unsubscribeConnections = onSnapshot(connectionsQuery, (snapshot) => {
          currentConnectionsCount = snapshot.size;
          syncProfile();
        });

        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
          currentPostsCount = snapshot.size;
          syncProfile();
        });

        unsubscribeStats = () => {
          unsubscribeConnections();
          unsubscribePosts();
        };
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeStats();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
