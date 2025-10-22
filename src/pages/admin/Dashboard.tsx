import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Image, MessageSquare, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSelections: 0,
    totalFeedback: 0,
    finalizedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());
      const totalUsers = users.length;
      const finalizedUsers = users.filter((u: any) => u.is_finalized).length;

      // Load selections (count photos with category='selected')
      const photosSnapshot = await getDocs(collection(db, 'photos'));
      const photos = photosSnapshot.docs.map(doc => doc.data());
      const totalSelections = photos.filter((p: any) => p.category === 'selected').length;

      // Load feedback
      const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
      const totalFeedback = feedbackSnapshot.size;

      setStats({
        totalUsers,
        totalSelections,
        totalFeedback,
        finalizedUsers,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Total Selections',
      value: stats.totalSelections,
      icon: Image,
      color: 'text-primary',
    },
    {
      title: 'Feedback Messages',
      value: stats.totalFeedback,
      icon: MessageSquare,
      color: 'text-green-500',
    },
    {
      title: 'Finalized Users',
      value: stats.finalizedUsers,
      icon: CheckCircle,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading text-gradient-gold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your gallery statistics</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-border hover:glow-gold transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? '...' : card.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="text-xl font-heading text-foreground">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Use the sidebar to navigate to different admin sections:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>Manage users and assign roles</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Image className="h-4 w-4 text-primary" />
              <span>Upload logos and customize design</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Review user feedback</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
