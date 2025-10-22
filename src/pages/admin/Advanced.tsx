import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { syncDrivePhotosToFirestore } from '@/lib/googleDrive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, RefreshCw, Loader2, CheckCircle } from 'lucide-react';

const Advanced = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: number } | null>(null);
  const [config, setConfig] = useState({
    driveFolderId: '',
    driveApiKey: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      if (!settingsSnapshot.empty) {
        const data = settingsSnapshot.docs[0].data();
        if (data.advanced) {
          setConfig(data.advanced);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(
        settingsRef,
        {
          advanced: config,
        },
        { merge: true }
      );
      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrive = async () => {
    if (!config.driveFolderId) {
      toast.error('Please configure Drive Folder ID first');
      return;
    }

    try {
      setSyncing(true);
      setSyncResult(null);
      // Use 'admin' as userId for global sync - photos will need user assignment later
      const result = await syncDrivePhotosToFirestore(db, 'admin', config.driveFolderId);
      setSyncResult(result);
      toast.success(`Synced ${result.synced} photos successfully!`);
    } catch (error) {
      console.error('Error syncing Drive:', error);
      toast.error('Failed to sync photos from Drive');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading text-gradient-gold mb-2">Advanced Settings</h1>
        <p className="text-muted-foreground">Configure Google Drive integration and advanced features</p>
      </div>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Google Drive Integration</CardTitle>
          <CardDescription>
            Connect your Google Drive folder to automatically sync photos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Drive Folder ID</Label>
            <Input
              value={config.driveFolderId}
              onChange={(e) => setConfig({ ...config, driveFolderId: e.target.value })}
              placeholder="1a2B3c4D5e6F7g8H9i0J"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in your Google Drive folder URL: drive.google.com/drive/folders/
              <span className="text-primary">YOUR_FOLDER_ID</span>
            </p>
          </div>

          <div>
            <Label>Drive API Key</Label>
            <Input
              type="password"
              value={config.driveApiKey}
              onChange={(e) => setConfig({ ...config, driveApiKey: e.target.value })}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Create an API key in Google Cloud Console with Drive API enabled
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>

            <Button
              onClick={handleSyncDrive}
              disabled={syncing || !config.driveFolderId}
              className="btn-3d-gold text-primary-foreground"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync from Drive
                </>
              )}
            </Button>
          </div>

          {syncResult && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary">
              <div className="flex items-center gap-2 text-primary mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Sync Complete</span>
              </div>
              <p className="text-sm text-foreground">
                Successfully synced {syncResult.synced} photos
                {syncResult.errors > 0 && ` (${syncResult.errors} errors)`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Environment Variables</CardTitle>
          <CardDescription>
            Configure these in your .env file for production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/20 p-4 rounded-lg font-mono text-xs space-y-1 text-muted-foreground">
            <p>VITE_FIREBASE_API_KEY=your_api_key</p>
            <p>VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain</p>
            <p>VITE_FIREBASE_PROJECT_ID=your_project_id</p>
            <p>VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket</p>
            <p>VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</p>
            <p>VITE_FIREBASE_APP_ID=your_app_id</p>
            <p>VITE_GOOGLE_DRIVE_API_KEY=your_drive_api_key</p>
            <p>VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Advanced;
