import { useState, useEffect } from 'react';
import { businessStore } from '../../data';
import { Business } from '../../models/Business';

export const useBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setBusinesses(await businessStore.listAll());
    } catch (e: any) {
      setError(e.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { businesses, loading, error, reload };
};
