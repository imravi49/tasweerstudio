import React, { createContext, useContext, useState } from 'react';
import { User } from '@/lib/types';

interface ViewAsUserContextType {
  viewingAsUser: User | null;
  setViewingAsUser: (user: User | null) => void;
  isViewingAsUser: boolean;
}

const ViewAsUserContext = createContext<ViewAsUserContextType | undefined>(undefined);

export const useViewAsUser = () => {
  const context = useContext(ViewAsUserContext);
  if (!context) {
    throw new Error('useViewAsUser must be used within a ViewAsUserProvider');
  }
  return context;
};

export const ViewAsUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewingAsUser, setViewingAsUser] = useState<User | null>(null);

  const value = {
    viewingAsUser,
    setViewingAsUser,
    isViewingAsUser: !!viewingAsUser,
  };

  return (
    <ViewAsUserContext.Provider value={value}>
      {children}
    </ViewAsUserContext.Provider>
  );
};
