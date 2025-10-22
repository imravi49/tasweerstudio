import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Palette, 
  Settings, 
  Wrench, 
  MessageSquare, 
  Activity,
  Contact
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/design', label: 'Design', icon: Palette },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
    { path: '/admin/advanced', label: 'Advanced', icon: Wrench },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/admin/contacts', label: 'Contacts', icon: Contact },
    { path: '/admin/logs', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-[250px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="space-y-2">
              <h2 className="text-2xl font-heading text-gradient-gold mb-6">
                Admin Panel
              </h2>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground glow-gold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </aside>

            {/* Content */}
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[600px]"
            >
              <Outlet />
            </motion.main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLayout;
