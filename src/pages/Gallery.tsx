import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Photo } from '@/lib/types';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Eye, PlayCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GalleryViewer from '@/components/GalleryViewer';
import FeedbackModal from '@/components/FeedbackModal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAsUser } from '@/contexts/ViewAsUserContext';
import { logActivity } from '@/lib/initFirestore';
import { useResumeSelection } from '@/hooks/useResumeSelection';
import { useImagePreload } from '@/hooks/useImagePreload';

const Gallery = () => {
  const { currentUser, userData } = useAuth();
  const { viewingAsUser, isViewingAsUser, setViewingAsUser } = useViewAsUser();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [settings, setSettings] = useState({
    feedbackPrompt: 'How was your experience selecting your photos?',
    completionMessage: 'Thank you for finalizing your selection!',
  });

  // Use viewingAsUser data if in admin preview mode, otherwise use userData
  const activeUser = isViewingAsUser ? viewingAsUser : userData;
  const activeUserId = isViewingAsUser ? viewingAsUser?.id : currentUser?.uid;
  
  const selectedCount = photos.filter(p => p.category === 'selected').length;
  const selectionLimit = activeUser?.selection_limit || 150;
  
  const { savedState, saveState } = useResumeSelection(activeUserId);
  
  // Preload images for smooth performance
  const photoUrls = photos.map(p => p.drive_url || p.thumbnail_url || '');
  useImagePreload(photoUrls, selectedPhotoIndex || 0, 8);

  useEffect(() => {
    if (currentUser || isViewingAsUser) {
      loadPhotos();
      loadSettings();
    }
  }, [currentUser, isViewingAsUser, viewingAsUser]);

  const loadSettings = async () => {
    try {
      const settingsSnap = await getDocs(collection(db, 'settings'));
      if (!settingsSnap.empty) {
        const data = settingsSnap.docs[0].data();
        if (data.messages) {
          setSettings(data.messages);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadPhotos = async () => {
    const userId = activeUserId || currentUser?.uid;
    if (!userId) return;

    try {
      setLoading(true);
      const photosCollection = collection(db, 'photos');
      const q = query(photosCollection, where('user_id', '==', userId));
      const photosSnapshot = await getDocs(q);
      const photosList = photosSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Photo[];
      
      setPhotos(photosList);
      
      // Auto-resume to last viewed photo if available
      if (savedState?.lastViewedPhotoIndex && photosList.length > savedState.lastViewedPhotoIndex) {
        // Don't auto-open, just save for reference
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelection = () => {
    if (savedState?.lastViewedPhotoIndex !== undefined && photos.length > savedState.lastViewedPhotoIndex) {
      setSelectedPhotoIndex(savedState.lastViewedPhotoIndex);
      toast.success('Resumed from last viewed photo');
    } else {
      toast.info('No saved position found');
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    saveState({
      lastViewedPhotoIndex: index,
      lastViewedPhotoId: photos[index]?.id,
    });
  };

  const handleFinalize = async () => {
    if (selectedCount === 0) {
      toast.error('Please select at least one photo');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', currentUser!.uid);
      await updateDoc(userRef, { is_finalized: true });
      
      // Log activity
      await logActivity(
        currentUser!.uid,
        'Selection Finalized',
        `User ${userData?.name || currentUser?.email} finalized their photo selection with ${selectedCount} photos`
      );
      
      setShowFeedback(true);
    } catch (error) {
      console.error('Error finalizing:', error);
      toast.error('Failed to finalize selection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-3xl font-heading text-gradient-gold mb-4">No Photos Yet</h2>
            <p className="text-muted-foreground">
              Photos will appear here once they are synced from Google Drive
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Admin Preview Banner */}
          {isViewingAsUser && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-primary/10 border border-primary rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="text-primary font-semibold">
                  Viewing as: {viewingAsUser?.name} ({viewingAsUser?.email})
                </p>
                <p className="text-sm text-muted-foreground">Read-only admin preview mode</p>
              </div>
              <Button
                onClick={() => setViewingAsUser(null)}
                variant="outline"
                className="border-primary text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-heading text-gradient-gold mb-2">
                {isViewingAsUser ? `${viewingAsUser?.name}'s Gallery` : 'Gallery'}
              </h1>
              <p className="text-muted-foreground">
                Click any photo to view in full screen
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Selected: <span className={selectedCount >= selectionLimit ? 'text-destructive font-bold' : 'text-primary font-semibold'}>{selectedCount}/{selectionLimit}</span>
              </p>
            </div>
            {!isViewingAsUser && (
              <div className="flex gap-3">
              {savedState && (
                <Button
                  onClick={handleResumeSelection}
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Resume Selection
                </Button>
              )}
              <Button
                onClick={() => navigate('/review')}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Selection
              </Button>
              <Button onClick={handleFinalize} className="btn-3d-gold text-primary-foreground">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalize Selection
              </Button>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer glass-effect glow-gold"
                onClick={() => handlePhotoClick(index)}
              >
                <img
                  src={photo.thumbnail_url || photo.drive_url}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Selection indicator */}
                {photo.category && (
                  <div className="absolute top-2 right-2 z-10">
                    {photo.category === 'selected' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    {photo.category === 'later' && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-accent-foreground text-xs">⏱</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium truncate">
                    {photo.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {selectedPhotoIndex !== null && (
        <GalleryViewer
          photos={photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onPhotosUpdate={loadPhotos}
          selectionLimit={selectionLimit}
          readOnly={isViewingAsUser}
        />
      )}
      
      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        userId={currentUser?.uid || ''}
        userName={userData?.name || ''}
        userContact={userData?.contact}
        feedbackPrompt={settings.feedbackPrompt}
        completionMessage={settings.completionMessage}
      />
    </div>
  );
};

export default Gallery;
