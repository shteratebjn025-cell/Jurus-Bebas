"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirestoreDocument<T>(path: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path || !id) {
        setLoading(false);
        return;
    }
    
    const docRef = doc(db, path, id);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [path, id]);

  return { data, loading, error };
}

export function useFirestoreCollection<T>(path: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
  
    useEffect(() => {
      const { collection } = require("firebase/firestore");
      if (!path) {
          setLoading(false);
          return;
      }
      
      const collectionRef = collection(db, path);
  
      const unsubscribe = onSnapshot(
        collectionRef,
        (querySnapshot) => {
          const collectionData: T[] = [];
          querySnapshot.forEach((doc) => {
            collectionData.push({ id: doc.id, ...doc.data() } as T);
          });
          setData(collectionData);
          setLoading(false);
        },
        (err) => {
          console.error("Firestore collection subscription error:", err);
          setError(err);
          setLoading(false);
        }
      );
  
      // Cleanup subscription on unmount
      return () => unsubscribe();
    }, [path]);
  
    return { data, loading, error };
  }
  