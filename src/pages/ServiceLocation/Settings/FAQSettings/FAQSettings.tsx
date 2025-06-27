// src/pages/ServiceLocation/Settings/FAQSettings/FAQSettings.tsx

/**
 * FAQSettings.tsx
 *
 * Admin interface for managing FAQs associated with a specific service location.
 * Uses the FAQStore and ServiceLocationStore abstractions to load and save data.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';

import { ServiceLocationStore } from '../../../../data/ServiceLocationStore';
import { FirestoreServiceLocationStore } from '../../../../data/FirestoreServiceLocationStore';
import { FAQStore } from '../../../../data/FaqStore';
import { FirestoreFAQStore } from '../../../../data/FirestoreFaqStore';

import { ServiceLocation } from '../../../../models/ServiceLocation';
import { FAQ } from '../../../../models/Faq';

export default function FAQSettings() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Abstraction stores
  const serviceLocationStore: ServiceLocationStore = useMemo(
    () => new FirestoreServiceLocationStore(),
    []
  );
  const faqStore: FAQStore = useMemo(() => new FirestoreFAQStore(), []);

  // State
  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load service location and its FAQs
  const load = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch the service location
      const loc = await serviceLocationStore.getById(serviceLocationId);
      if (!loc) throw new Error('Service location not found');
      setLocation(loc);

      // Fetch all FAQs and filter by this location's faqIds
      const all = await faqStore.listAll();
      const linked = (loc.faqIds || [])
        .map(id => all.find(f => f.id === id))
        .filter((f): f is FAQ => f !== undefined);
      setFaqs(linked);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, serviceLocationStore, faqStore]);

  useEffect(() => {
    load();
  }, [load]);

  // Add a new FAQ
  const handleAdd = async () => {
    if (!location) return;
    if (!question.trim()) {
      setError('Question cannot be empty');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Create the FAQ
      const id = uuidv4();
      const newFaq: FAQ = {
        id,
        question: question.trim(),
        answer: answer.trim(),
        active: true,
      };
      await faqStore.save(newFaq);

      // Update serviceLocation.faqIds
      const updatedIds = [...(location.faqIds || []), id];
      await serviceLocationStore.save({ ...location, faqIds: updatedIds });

      // Refresh UI
      setQuestion('');
      setAnswer('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Remove an existing FAQ
  const handleRemove = async (id: string) => {
    if (!location) return;
    setSaving(true);
    setError(null);
    try {
      // Remove id from serviceLocation.faqIds
      const updatedIds = (location.faqIds || []).filter(fid => fid !== id);
      await serviceLocationStore.save({ ...location, faqIds: updatedIds });

      // Refresh UI
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        FAQ Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Question"
          fullWidth
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <TextField
          label="Answer"
          fullWidth
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={saving}
        >
          {saving ? 'Adding…' : 'Add'}
        </Button>
      </Box>

      <List>
        {faqs.map(f => (
          <ListItem
            key={f.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleRemove(f.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <Box>
              <Typography><strong>Q:</strong> {f.question}</Typography>
              <Typography><strong>A:</strong> {f.answer}</Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
