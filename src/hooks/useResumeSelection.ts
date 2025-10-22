import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SelectionState {
  lastViewedFolder?: string;
  lastViewedPhotoIndex: number;
  lastViewedPhotoId?: string;
  timestamp: string;
}

/**
 * Hook to save and resume user's last selection state
 */
export const useResumeSelection = (userId: string | undefined) => {
  const [savedState, setSavedState] = useState<SelectionState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved state on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadState = async () => {
      try {
        const stateRef = doc(db, 'user_selection_state', userId);
        const stateDoc = await getDoc(stateRef);
        
        if (stateDoc.exists()) {
          setSavedState(stateDoc.data() as SelectionState);
        }
      } catch (error) {
        console.error('Error loading selection state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, [userId]);

  // Save state function
  const saveState = async (state: Partial<SelectionState>) => {
    if (!userId) return;

    try {
      const stateRef = doc(db, 'user_selection_state', userId);
      const newState: SelectionState = {
        lastViewedFolder: state.lastViewedFolder || savedState?.lastViewedFolder,
        lastViewedPhotoIndex: state.lastViewedPhotoIndex ?? savedState?.lastViewedPhotoIndex ?? 0,
        lastViewedPhotoId: state.lastViewedPhotoId || savedState?.lastViewedPhotoId,
        timestamp: new Date().toISOString(),
      };
      
      await setDoc(stateRef, newState, { merge: true });
      setSavedState(newState);
    } catch (error) {
      console.error('Error saving selection state:', error);
    }
  };

  return { savedState, saveState, loading };
};
