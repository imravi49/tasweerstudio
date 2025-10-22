const DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface DriveFolderStructure {
  id: string;
  name: string;
  subfolders: DriveFolderStructure[];
  files: string[]; // file IDs
}

/**
 * List all folders within a parent folder
 */
export const listDriveFolders = async (parentFolderId: string): Promise<DriveFolder[]> => {
  if (!DRIVE_API_KEY) {
    console.error('Google Drive API key not configured');
    return [];
  }

  try {
    const query = `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&key=${DRIVE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Drive API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching Drive folders:', error);
    throw error;
  }
};

/**
 * List all image files within a folder
 */
export const listDriveFolderImages = async (folderId: string): Promise<string[]> => {
  if (!DRIVE_API_KEY) {
    console.error('Google Drive API key not configured');
    return [];
  }

  try {
    const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&key=${DRIVE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Drive API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return (data.files || []).map((f: any) => f.id);
  } catch (error) {
    console.error('Error fetching Drive folder images:', error);
    throw error;
  }
};

/**
 * Recursively fetch folder structure with all subfolders and their images
 */
export const fetchDriveFolderStructure = async (
  folderId: string,
  folderName: string = 'Root'
): Promise<DriveFolderStructure> => {
  // Get subfolders
  const subfolders = await listDriveFolders(folderId);
  
  // Get images in current folder
  const files = await listDriveFolderImages(folderId);
  
  // Recursively fetch subfolder structures
  const subfolderStructures = await Promise.all(
    subfolders.map(subfolder => 
      fetchDriveFolderStructure(subfolder.id, subfolder.name)
    )
  );
  
  return {
    id: folderId,
    name: folderName,
    subfolders: subfolderStructures,
    files,
  };
};

/**
 * Flatten folder structure into categories (folder paths)
 */
export const flattenFolderStructure = (
  structure: DriveFolderStructure,
  parentPath: string = ''
): Array<{ path: string; folderId: string; fileIds: string[] }> => {
  const currentPath = parentPath ? `${parentPath}/${structure.name}` : structure.name;
  
  const result: Array<{ path: string; folderId: string; fileIds: string[] }> = [];
  
  // Add current folder if it has files
  if (structure.files.length > 0) {
    result.push({
      path: currentPath,
      folderId: structure.id,
      fileIds: structure.files,
    });
  }
  
  // Recursively add subfolders
  for (const subfolder of structure.subfolders) {
    result.push(...flattenFolderStructure(subfolder, currentPath));
  }
  
  return result;
};
