import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirestoreCollection<T extends { id: string }>(collectionName: string) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/${collectionName}`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/${collectionName}`);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName]);

  const updateItem = async (id: string, itemData: Partial<T> & Record<string, any>) => {
    if (!user) return;
    try {
      const docRef = doc(db, `users/${user.uid}/${collectionName}`, id);
      const existingItem = data.find(i => i.id === id);
      
      const isNew = !existingItem;
      const now = Date.now();
      
      const fullData = {
        ...(existingItem || {}),
        ...itemData,
        userId: user.uid,
        updatedAt: now,
        ...(isNew ? { createdAt: now } : {})
      };

      await setDoc(docRef, fullData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/${collectionName}/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/${collectionName}/${id}`);
    }
  };

  return { data, loading, updateItem, deleteItem };
}
