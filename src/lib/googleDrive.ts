const DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export const listDriveFiles = async (folderId?: string): Promise<DriveFile[]> => {
  const folderIdToUse = folderId || DRIVE_FOLDER_ID;
  
  if (!DRIVE_API_KEY || !folderIdToUse) {
    console.error('Google Drive API key or folder ID not configured');
    return [];
  }

  try {
    const query = `'${folderIdToUse}' in parents and mimeType contains 'image/' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink)&key=${DRIVE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Drive API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching Drive files:', error);
    throw error;
  }
};

export const getDriveFileUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

export const getDriveThumbnailUrl = (fileId: string, size: number = 400): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
};

export const syncDrivePhotosToFirestore = async (
  db: any,
  userId: string,
  folderId?: string
): Promise<{ synced: number; errors: number }> => {
  try {
    const { fetchDriveFolderStructure, flattenFolderStructure } = await import('./driveFolder');
    
    // Fetch entire folder structure with subfolders
    const structure = await fetchDriveFolderStructure(folderId || DRIVE_FOLDER_ID || '', 'Root');
    const flatFolders = flattenFolderStructure(structure);
    
    let synced = 0;
    let errors = 0;

    // Process each folder and its images
    for (const folder of flatFolders) {
      for (const fileId of folder.fileIds) {
        try {
          const { collection, doc, setDoc, getDoc } = await import('firebase/firestore');
          const photoRef = doc(collection(db, 'photos'), fileId);
          
          // Check if photo already exists to preserve category
          const existingDoc = await getDoc(photoRef);
          const existingCategory = existingDoc.exists() ? existingDoc.data().category : null;
          
          await setDoc(photoRef, {
            id: fileId,
            user_id: userId,
            name: `${folder.path}/${fileId}`,
            drive_id: fileId,
            drive_url: getDriveFileUrl(fileId),
            thumbnail_url: getDriveThumbnailUrl(fileId),
            folder_path: folder.path,
            uploaded_at: new Date().toISOString(),
            category: existingCategory,
          }, { merge: true });
          
          synced++;
        } catch (error) {
          console.error(`Error syncing file ${fileId}:`, error);
          errors++;
        }
      }
    }

    return { synced, errors };
  } catch (error) {
    console.error('Error in syncDrivePhotosToFirestore:', error);
    throw error;
  }
};

export const exportUserPhotosToCSV = (photos: any[], category: 'selected' | 'later'): string => {
  const filteredPhotos = photos.filter(p => p.category === category);
  
  const headers = ['photo_id', 'file_name', 'drive_url', 'category', 'timestamp'];
  const rows = filteredPhotos.map(photo => [
    photo.id,
    photo.name,
    photo.drive_url || '',
    photo.category || '',
    photo.uploaded_at || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
