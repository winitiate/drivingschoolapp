// src/pages/SuperAdmin/BusinessManagement/BusinessFormPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import BusinessFormDialog from './BusinessFormDialog';
import type { Business } from '../../../models/Business';

export default function BusinessFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const db = getFirestore();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError]     = useState<string | null>(null);

  // 1) Load existing business if editing
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, 'businesses', id));
        if (!snap.exists()) {
          setError('Business not found');
          setBusiness(null);
        } else {
          setBusiness({ id: snap.id, ...(snap.data() as any) } as Business);
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Failed to load business');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, db]);

  // 2) Close / after save handlers
  const handleClose = () => navigate('/super-admin/businesses', { replace: true });
  const handleSaved = () => navigate('/super-admin/businesses', { replace: true });

  // 3) Render the dialog always open
  return (
    <BusinessFormDialog
      open={true}
      onClose={handleClose}
      onSaved={handleSaved}
      business={business}
      loading={loading}
      error={error}
    />
  );
}
