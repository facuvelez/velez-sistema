import React, { createContext, useContext, useEffect, useState } from 'react';

export interface GuestOperator {
  username: string;
  role: 'Operator';
  guestMode: true;
}

const STORAGE_KEY = 'velez_guest_operator';

export const readGuestOperator = (): GuestOperator | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.guestMode && parsed?.username && parsed?.role === 'Operator') {
      return parsed as GuestOperator;
    }
    return null;
  } catch {
    return null;
  }
};

interface GuestOperatorContextType {
  guestOperator: GuestOperator | null;
  setGuestOperator: (username: string) => void;
  clearGuestOperator: () => void;
}

const GuestOperatorContext = createContext<GuestOperatorContextType | undefined>(undefined);

export const useGuestOperator = () => {
  const ctx = useContext(GuestOperatorContext);
  if (!ctx) throw new Error('useGuestOperator must be used within GuestOperatorProvider');
  return ctx;
};

export const GuestOperatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestOperator, setGuestOperatorState] = useState<GuestOperator | null>(() => readGuestOperator());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setGuestOperatorState(readGuestOperator());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setGuestOperator = (username: string) => {
    const value: GuestOperator = { username, role: 'Operator', guestMode: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setGuestOperatorState(value);
  };

  const clearGuestOperator = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGuestOperatorState(null);
  };

  return (
    <GuestOperatorContext.Provider value={{ guestOperator, setGuestOperator, clearGuestOperator }}>
      {children}
    </GuestOperatorContext.Provider>
  );
};
