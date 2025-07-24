import React from 'react';
import { MindbodyContext, useMindbodyAuth } from '@/hooks/useMindbody';

interface MindbodyProviderProps {
  children: React.ReactNode;
}

export const MindbodyProvider: React.FC<MindbodyProviderProps> = ({ children }) => {
  const mindbodyAuth = useMindbodyAuth();

  return (
    <MindbodyContext.Provider value={mindbodyAuth}>
      {children}
    </MindbodyContext.Provider>
  );
};