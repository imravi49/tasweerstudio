import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Clock, Download } from 'lucide-react';
import { Photo } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useImagePreload } from '@/hooks/useImagePreload';

interface GalleryViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  onPhotosUpdate?: () => void;
  selectionLimit?: number;
  readOnly?: boolean;
}

const GalleryViewer: React.FC<GalleryViewerProps> = ({ 
  photos, 
  initialIndex, 
  onClose, 
  onPhotosUpdate, 
  selectionLimit = 150,
  readOnly = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { currentUser } = useAuth();
  
  // Preload next 8 images for smooth navigation
  const photoUrls = photos.map(p => p.drive_url || p.thumbnail_url || '');
  useImagePreload(photoUrls, currentIndex, 8);

  const handleSelection = async (category: 'selected' | 'later') => {
    if (readOnly) {
      toast.info('Gallery is in read-only mode');
      return;
    }
    
    if (!currentUser) return;

    const currentPhoto = photos[currentIndex];
    
    // Check selection limit before marking as selected
    if (category === 'selected') {
      const selectedCount = photos.filter(p => p.category === 'selected').length;
      if (selectedCount >= selectionLimit && currentPhoto.category !== 'selected') {
        toast.error(`Selection limit reached — You can only select up to ${selectionLimit} photos.`);
        return;
      }
    }
    
    try {
      // Update photo category in Firestore
      const photoRef = doc(db, 'photos', currentPhoto.id);
      await updateDoc(photoRef, {
        category: category,
      });

      // Update local photos array
      photos[currentIndex] = { ...currentPhoto, category };

      if (category === 'selected') {
        toast.success('Added to favorites!');
      } else {
        toast.success('Saved for later!');
      }

      // Trigger refresh
      if (onPhotosUpdate) {
        onPhotosUpdate();
      }
    } catch (error) {
      console.error('Error updating selection:', error);
      toast.error('Failed to update selection');
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleDownload = async () => {
    const photo = photos[currentIndex];
    try {
      const response = await fetch(photo.drive_url || '');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo_${photo.name || `image_${currentIndex + 1}`}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Photo downloaded successfully!');
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast.error('Failed to download photo');
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.x > threshold) {
      goToPrevious();
    } else if (info.offset.x < -threshold) {
      goToNext();
    } else if (info.offset.y < -threshold) {
      handleSelection('selected');
    } else if (info.offset.y > threshold) {
      handleSelection('later');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowUp':
          handleSelection('selected');
          break;
        case 'ArrowDown':
          handleSelection('later');
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const currentPhoto = photos[currentIndex];
  const isSelected = currentPhoto.category === 'selected';
  const isLater = currentPhoto.category === 'later';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Top bar with close and download buttons */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground transition-colors glow-gold"
            title="Download Photo"
          >
            <Download className="h-6 w-6" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Counter */}
        <div className="absolute top-4 left-4 z-50 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Status Indicators */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
          {isSelected && (
            <div className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary">
              <Heart className="h-4 w-4" fill="currentColor" />
              <span className="text-sm font-medium">Selected</span>
            </div>
          )}
          {isLater && (
            <div className="flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full border border-accent">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Later</span>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>

        {/* Main Image */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
        >
          <img
            src={currentPhoto.drive_url || currentPhoto.thumbnail_url}
            alt={currentPhoto.name}
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-black/50 text-white text-xs px-6 py-3 rounded-full space-y-1">
            <p className="text-center">
              <span className="font-semibold">Swipe/Arrow Keys:</span> Navigate
            </p>
            <p className="text-center">
              <span className="font-semibold">Swipe Up/↑:</span> Select
              <span className="mx-2">•</span>
              <span className="font-semibold">Swipe Down/↓:</span> Later
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GalleryViewer;
