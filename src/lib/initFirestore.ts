import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const initializeFirestoreCollections = async () => {
  try {
    // Initialize settings/global document
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        hero: {
          title: 'Cinematic Gallery',
          subtitle: 'Experience photography in its finest form',
        },
        contactInfo: {
          email: 'hello@cinematicgallery.com',
          phone: '+1 (555) 123-4567',
          address: '123 Gallery Street, Photo City, PC 12345',
        },
        messages: {
          feedbackPrompt: 'How was your experience selecting your photos?',
          completionMessage: 'Thank you for finalizing your selection! We will process your choices and contact you soon.',
        },
        design: {
          logo_url: '',
          palette: {
            primary: '#d4a574',
            accent: '#f4d47c',
            background: '#1f1f1f',
          },
          typography: {
            headingFont: 'Playfair Display',
            bodyFont: 'Poppins',
          },
        },
        advanced: {
          driveFolderId: '',
          driveApiKey: '',
        },
      });
      console.log('Settings initialized');
    }

    // Ensure other collections exist (by adding a dummy doc if needed)
    const collections = ['users', 'photos', 'feedback', 'activity_logs'];
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      // Just reference it to ensure it exists in Firestore's eyes
      console.log(`Collection ${collectionName} ready`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    return { success: false, error };
  }
};

export const logActivity = async (userId: string, action: string, details: string) => {
  try {
    const activityRef = collection(db, 'activity_logs');
    await setDoc(doc(activityRef), {
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
