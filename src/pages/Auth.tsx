import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Camera, LogIn, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const ADMIN_EMAILS = ['Ravi.rv73838@gmail.com', 'ravi.rv73838@icloud.com'];

const Auth = () => {
  const { currentUser, userData, signInWithEmail, signInWithGoogle, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser && userData) {
      // ✅ Redirect admins to /admin and normal users to /
      if (ADMIN_EMAILS.includes(currentUser.email || '') || isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, userData, isAdmin, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await signInWithEmail(email, password);
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (!user) throw new Error('Google sign-in failed');

      // ✅ Check if user is one of the allowed admin emails
      if (ADMIN_EMAILS.includes(user.email)) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            name: user.displayName || 'Admin',
            email: user.email,
            role: 'admin',
            createdAt: new Date(),
          });
        } else if (snap.data().role !== 'admin') {
          await setDoc(userRef, { ...snap.data(), role: 'admin' }, { merge: true });
        }

        toast.success('Welcome Admin!');
        navigate('/admin');
        return;
      }

      // ❌ Any other Gmail login → not allowed
      toast.error('Access denied – Admin only.');
      await signOut(auth);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || 'Access denied – Admin only.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md glass-effect border-border glow-gold">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto"
            >
              <Camera className="h-16 w-16 text-primary animate-float" />
            </motion.div>
            <CardTitle className="text-3xl font-heading text-gradient-gold">
              Welcome to Your Gallery
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your cinematic photo collection
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* 🔹 Regular user login (email/password) */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-3d-gold text-primary-foreground text-lg py-6"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </form>

            {/* 🔸 Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Admin Access</span>
                </div>
              </div>
            </div>

            {/* 🔹 Google Admin Login */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground py-6"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Login with Google (Admin Only)
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our terms of service and privacy policy
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
