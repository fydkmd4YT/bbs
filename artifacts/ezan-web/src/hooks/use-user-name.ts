import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ezan_user_name';

export function useUserName() {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUserName(stored);
    setLoading(false);
  }, []);

  const saveUserName = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setUserName(name);
  };

  return {
    userName,
    saveUserName,
    loading,
  };
}
