export interface User {
  id: string;
  name: string;
  email: string;
  contact?: string;
  role: 'admin' | 'user';
  is_finalized: boolean;
  drive_folder_id?: string;
  selection_limit?: number;
  created_at?: string;
}

export interface Photo {
  id: string;
  user_id: string;
  name: string;
  drive_id?: string;
  drive_url?: string;
  thumbnail_url?: string;
  uploaded_at: string;
  category?: 'selected' | 'later' | null;
}

export interface Selection {
  id: string;
  user_id: string;
  photo_id: string;
  category: 'selected' | 'later' | 'rejected';
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  user_name?: string;
  user_contact?: string;
  rating: number;
  message: string;
  timestamp: string;
}

export interface Settings {
  id: string;
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
  };
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  messages: {
    feedbackPrompt: string;
    completionMessage: string;
  };
  advanced: {
    driveFolderId: string;
    driveApiKey: string;
  };
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalSelections: number;
  totalFeedback: number;
  finalizedUsers: number;
}
