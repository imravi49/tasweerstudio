import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
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
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      if (!settingsSnapshot.empty) {
        const data = settingsSnapshot.docs[0].data();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, settings, { merge: true });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-gradient-gold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure global gallery settings</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="btn-3d-gold text-primary-foreground"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Hero Section</CardTitle>
          <CardDescription>
            Customize the main landing page hero content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hero Title</Label>
            <Input
              value={settings.hero.title}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero: { ...settings.hero, title: e.target.value },
                })
              }
              placeholder="Cinematic Gallery"
            />
          </div>
          <div>
            <Label>Hero Subtitle</Label>
            <Textarea
              value={settings.hero.subtitle}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero: { ...settings.hero, subtitle: e.target.value },
                })
              }
              placeholder="Experience photography in its finest form"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Contact Information</CardTitle>
          <CardDescription>
            Update your gallery's contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={settings.contactInfo.email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contactInfo: { ...settings.contactInfo, email: e.target.value },
                })
              }
              placeholder="hello@cinematicgallery.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={settings.contactInfo.phone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contactInfo: { ...settings.contactInfo, phone: e.target.value },
                })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea
              value={settings.contactInfo.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contactInfo: { ...settings.contactInfo, address: e.target.value },
                })
              }
              placeholder="123 Gallery Street, Photo City, PC 12345"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Feedback Messages</CardTitle>
          <CardDescription>
            Customize feedback prompt and completion message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Feedback Prompt</Label>
            <Textarea
              value={settings.messages?.feedbackPrompt || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  messages: { ...settings.messages, feedbackPrompt: e.target.value },
                })
              }
              placeholder="How was your experience?"
              rows={2}
            />
          </div>
          <div>
            <Label>Completion Message</Label>
            <Textarea
              value={settings.messages?.completionMessage || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  messages: { ...settings.messages, completionMessage: e.target.value },
                })
              }
              placeholder="Thank you for completing your selection!"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
