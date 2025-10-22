import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-t border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-heading text-gradient-gold mb-2">Cinematic Gallery</h3>
            <p className="text-sm text-muted-foreground">
              Experience photography in its finest form
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Crafted with</span>
            <Heart className="h-4 w-4 text-primary animate-pulse" fill="currentColor" />
            <span>using Firebase & React</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Cinematic Gallery. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
