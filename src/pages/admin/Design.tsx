import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Loader2, Save, Palette } from 'lucide-react';

const GOOGLE_FONTS = [
  { value: 'Playfair Display', label: 'Playfair Display (Elegant Serif)' },
  { value: 'Poppins', label: 'Poppins (Modern Sans)' },
  { value: 'Inter', label: 'Inter (Clean Sans)' },
  { value: 'Lora', label: 'Lora (Serif)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric Sans)' },
  { value: 'Roboto', label: 'Roboto (Neutral Sans)' },
];

const Design = () => {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [design, setDesign] = useState({
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
  });

  useEffect(() => {
    loadDesign();
  }, []);

  const loadDesign = async () => {
    try {
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      if (!settingsSnapshot.empty) {
        const data = settingsSnapshot.docs[0].data();
        if (data.design) {
          setDesign(data.design);
          if (data.design.logo_url) {
            setLogoUrl(data.design.logo_url);
          }
        }
      }
    } catch (error) {
      console.error('Error loading design:', error);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      setUploading(true);
      const storageRef = ref(storage, `logos/site_logo_${Date.now()}.${file.name.split('.').pop()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setLogoUrl(url);
      
      // Save to Firestore immediately
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(
        settingsRef,
        {
          design: {
            ...design,
            logo_url: url,
          },
        },
        { merge: true }
      );
      
      setDesign({ ...design, logo_url: url });
      toast.success('Logo uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Check Firebase Storage rules.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDesign = async () => {
    try {
      setSaving(true);
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(
        settingsRef,
        {
          design,
        },
        { merge: true }
      );
      
      // Apply design changes live
      applyDesignChanges();
      
      toast.success('Design updated successfully!');
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const applyDesignChanges = () => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0 0% 0%';
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    
    root.style.setProperty('--primary', hexToHSL(design.palette.primary));
    root.style.setProperty('--accent', hexToHSL(design.palette.accent));
    root.style.setProperty('--background', hexToHSL(design.palette.background));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading text-gradient-gold mb-2">Design</h1>
          <p className="text-muted-foreground">Customize the appearance of your gallery</p>
        </div>
        <Button
          onClick={handleSaveDesign}
          disabled={saving}
          className="btn-3d-gold text-primary-foreground"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Design
            </>
          )}
        </Button>
      </div>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Site Logo</CardTitle>
          <CardDescription>
            Upload your gallery logo (recommended: 200x200px, PNG or SVG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted/20">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {logoUrl && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ Logo uploaded successfully
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Palette
          </CardTitle>
          <CardDescription>
            Customize your cinematic theme colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm">Primary Gold</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={design.palette.primary}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      palette: { ...design.palette, primary: e.target.value },
                    })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={design.palette.primary}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      palette: { ...design.palette, primary: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#d4a574"
                />
              </div>
              <div className="h-16 rounded-lg glow-gold" style={{ backgroundColor: design.palette.primary }}></div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={design.palette.accent}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      palette: { ...design.palette, accent: e.target.value },
                    })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={design.palette.accent}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      palette: { ...design.palette, accent: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#f4d47c"
                />
              </div>
              <div className="h-16 rounded-lg" style={{ backgroundColor: design.palette.accent }}></div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Background</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={design.palette.background}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      palette: { ...design.palette, background: e.target.value },
                    })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={design.palette.background}
                  onChange={(e) =>
                    setDesign({
                      ...design,
                      palette: { ...design.palette, background: e.target.value },
                    })
                  }
                  className="flex-1"
                  placeholder="#1f1f1f"
                />
              </div>
              <div className="h-16 rounded-lg border border-border" style={{ backgroundColor: design.palette.background }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Typography</CardTitle>
          <CardDescription>
            Select fonts for headings and body text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Heading Font</Label>
            <Select
              value={design.typography.headingFont}
              onValueChange={(value) =>
                setDesign({
                  ...design,
                  typography: { ...design.typography, headingFont: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="p-4 mt-2 rounded-lg bg-muted/20 border border-border">
              <h3 
                className="text-2xl text-gradient-gold"
                style={{ fontFamily: design.typography.headingFont }}
              >
                {design.typography.headingFont}
              </h3>
            </div>
          </div>
          
          <div>
            <Label className="text-sm mb-2 block">Body Font</Label>
            <Select
              value={design.typography.bodyFont}
              onValueChange={(value) =>
                setDesign({
                  ...design,
                  typography: { ...design.typography, bodyFont: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOOGLE_FONTS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="p-4 mt-2 rounded-lg bg-muted/20 border border-border">
              <p 
                className="text-foreground"
                style={{ fontFamily: design.typography.bodyFont }}
              >
                {design.typography.bodyFont} - Clean and readable font for all body text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Design;
