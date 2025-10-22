# Cinematic Gallery

A stunning Firebase-powered photography gallery with cinematic design, full-screen viewing, swipe controls, and Google Drive integration.

## ✨ Features

- 🔐 **Firebase Authentication** - Google sign-in for users and admins
- 🎨 **Cinematic Design** - Luxurious gold & black theme with Playfair Display typography
- 📸 **Full-Screen Gallery** - Immersive photo viewing experience
- 👆 **Swipe Controls** - Navigate with touch gestures (mobile) or keyboard (desktop)
- ☁️ **Multi-User Google Drive** - Each user has their own Drive folder with auto-sync
- 📊 **CSV Export** - Export each user's selected and later photos
- 🛡️ **Admin Panel** - Complete dashboard for managing users, settings, and content
- 💾 **Firebase Backend** - Firestore, Storage, and Authentication
- 📱 **Responsive Design** - Beautiful on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project ([create one](https://console.firebase.google.com/))
- Google Drive API access ([enable it](https://console.cloud.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase and Google Drive credentials

   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Enable Authentication (Google provider)
   - Create a Firestore database
   - Create a Storage bucket
   - Copy your config to `.env`

5. **Configure Google Drive API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Drive API
   - Create an API key with Drive API access
   - Create a shared Drive folder and copy its ID
   - Add credentials to `.env`

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Firestore Structure

The app uses the following Firestore collections:

```
users/
  - id (string)
  - name (string)
  - email (string)
  - role (string: 'admin' | 'user')
  - drive_folder_id (string, optional) - User's personal Google Drive folder
  - is_finalized (boolean)
  - created_at (timestamp)

photos/
  - id (string)
  - user_id (string) - Links photo to specific user
  - name (string)
  - drive_id (string)
  - drive_url (string)
  - thumbnail_url (string)
  - category (string: 'selected' | 'later' | null) - Photo selection status
  - uploaded_at (timestamp)

selections/
  - id (string)
  - user_id (string)
  - photo_id (string)
  - category (string: 'selected' | 'later' | 'rejected')
  - created_at (timestamp)

feedback/
  - id (string)
  - user_id (string)
  - message (string)
  - timestamp (timestamp)

settings/
  - hero (object)
  - contactInfo (object)
  - advanced (object)

activity_logs/
  - id (string)
  - user_id (string)
  - action (string)
  - details (string)
  - timestamp (timestamp)
```

## 🎮 Usage

### User Flow

1. **Sign In** - Navigate to `/auth` and sign in with Google
2. **Browse Gallery** - View photos in grid layout at `/gallery`
3. **Full-Screen Mode** - Click any photo for immersive viewing
4. **Select Photos**:
   - Swipe up or press ↑ to mark as "Selected"
   - Swipe down or press ↓ to save for "Later"
   - Swipe left/right or ← → to navigate

### Admin Flow

1. **Sign in as admin** - Your first user should be set to `role: 'admin'` in Firestore
2. **Access Admin Panel** - Navigate to `/admin`
3. **Dashboard** - View statistics and quick actions
4. **Users** - Add, edit, or delete users; assign admin roles and Drive folders
   - Set up each user's Google Drive folder ID
   - Click 🔄 to sync photos from user's Drive folder
   - Click 📥 to export user's selected/later photos as CSV
5. **Design** - Upload site logo and view theme settings
6. **Settings** - Configure hero section and contact info
7. **Advanced** - Set up global Google Drive configuration (fallback)
8. **Feedback** - View user feedback messages
9. **Activity Logs** - Monitor user activities

### Multi-User Google Drive Sync

Each user can have their own Google Drive folder for photos:

1. Go to **Admin → Users**
2. Edit a user and add their **Drive Folder ID**
3. Click the **Sync Drive** button (🔄) for that user
4. Photos from their folder will be imported to Firestore
5. User will see only their photos in the gallery

**CSV Export**: Click the Download button (📥) to export a user's selected and later photos as separate CSV files.

**Fallback**: The global Drive folder ID in **Advanced** settings serves as a fallback for admin/demo purposes.

## 🎨 Design System

The cinematic theme uses:

- **Colors**: Gold (#D4AF37) on deep black backgrounds
- **Typography**: Playfair Display (headings) + Poppins (body)
- **Effects**: Soft gold glows, 3D button effects, smooth transitions
- **Animations**: Framer Motion for swipe gestures and page transitions

Customize the theme in:
- `src/index.css` - CSS variables and design tokens
- `tailwind.config.ts` - Extended theme and animations

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Integration**: Google Drive API
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## 📦 Deployment

### Netlify (Recommended)

1. Push your code to GitHub
2. Connect repository to [Netlify](https://app.netlify.com/)
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables
4. Deploy!

### Manual Build

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## 🔒 Security Rules

Set these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Photos collection
    match /photos/{photoId} {
      allow read: if request.auth != null && 
        (resource.data.user_id == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Selections collection
    match /selections/{selectionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Feedback collection
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Settings collection
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Activity logs
    match /activity_logs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
    }
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
