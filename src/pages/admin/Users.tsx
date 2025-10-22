import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Edit, UserPlus, Loader2, RefreshCw, Download, Eye } from 'lucide-react';
import { useViewAsUser } from '@/contexts/ViewAsUserContext';
import { useNavigate } from 'react-router-dom';
import { syncDrivePhotosToFirestore, exportUserPhotosToCSV, downloadCSV } from '@/lib/googleDrive';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Users = () => {
  const navigate = useNavigate();
  const { setViewingAsUser } = useViewAsUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact: '',
    role: 'user' as 'admin' | 'user',
    drive_folder_id: '',
    selection_limit: 150,
  });
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as User[];
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', userId);
      if (updates.drive_folder_id) {
        updates.drive_folder_id = extractFolderId(updates.drive_folder_id);
      }
      await updateDoc(userRef, updates);
      toast.success('User updated successfully');
      loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const extractFolderId = (input: string): string => {
    if (!input) return '';
    if (!input.includes('/') && !input.includes('?')) return input.trim();
    const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return folderMatch ? folderMatch[1] : input.trim();
  };

  // ✅ FIXED SECTION — secure Cloud Function based user creation
  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createUser');

      const res: any = await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        contact: formData.contact,
        role: formData.role,
        drive_folder_id: extractFolderId(formData.drive_folder_id),
        selection_limit: formData.selection_limit || 150,
      });

      if (res?.data?.success) {
        toast.success('User added successfully');
        setShowAddDialog(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          contact: '',
          role: 'user',
          drive_folder_id: '',
          selection_limit: 150,
        });
        loadUsers();
      } else {
        toast.error('Unexpected server response');
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.code === 'permission-denied') {
        toast.error('Only admins can add users');
      } else if (error.message?.includes('email-already-exists')) {
        toast.error('Email already in use');
      } else {
        toast.error('Failed to add user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrive = async (user: User) => {
    if (!user.drive_folder_id) {
      toast.error('User has no Drive folder configured');
      return;
    }

    setSyncingUserId(user.id);
    try {
      const result = await syncDrivePhotosToFirestore(db, user.id, user.drive_folder_id);
      toast.success(`Synced ${result.synced} photos. ${result.errors} errors.`);
    } catch (error) {
      console.error('Error syncing Drive:', error);
      toast.error('Failed to sync Drive folder');
    } finally {
      setSyncingUserId(null);
    }
  };

  const handleExportCSV = async (user: User) => {
    try {
      const photosRef = collection(db, 'photos');
      const q = query(photosRef, where('user_id', '==', user.id));
      const snapshot = await getDocs(q);
      const photos = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      const selectedCSV = exportUserPhotosToCSV(photos, 'selected');
      downloadCSV(selectedCSV, `${user.name}_selected.csv`);

      const laterCSV = exportUserPhotosToCSV(photos, 'later');
      downloadCSV(laterCSV, `${user.name}_later.csv`);

      toast.success('CSV files downloaded successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleViewAsUser = (user: User) => {
    setViewingAsUser(user);
    navigate('/gallery');
    toast.success(`Viewing gallery as ${user.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-gradient-gold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="btn-3d-gold text-primary-foreground"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                  {user.contact && (
                    <p className="text-sm text-muted-foreground mb-2">📞 {user.contact}</p>
                  )}
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'admin'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.is_finalized
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {user.is_finalized ? 'Finalized' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAsUser(user)}
                    title="View Gallery as User"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncDrive(user)}
                    disabled={syncingUserId === user.id || !user.drive_folder_id}
                    title="Sync Google Drive"
                  >
                    {syncingUserId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV(user)}
                    title="Export CSV"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-effect border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the gallery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <Label>Contact Number (Optional)</Label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'user') => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Google Drive Folder Link or ID (Optional)</Label>
              <Input
                value={formData.drive_folder_id}
                onChange={(e) => setFormData({ ...formData, drive_folder_id: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/... or folder ID"
              />
            </div>
            <div>
              <Label>Selection Limit</Label>
              <Input
                type="number"
                value={formData.selection_limit}
                onChange={(e) => setFormData({ ...formData, selection_limit: parseInt(e.target.value) || 150 })}
                placeholder="150"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="btn-3d-gold text-primary-foreground"
              onClick={handleAddUser}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
