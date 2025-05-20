// src/components/FormTemplates/FormTemplateFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormTemplate } from '../../models/FormTemplate';

export interface FormTemplateFormDialogProps {
  open: boolean;
  initialData?: FormTemplate | null;
  ownerType: FormTemplate['ownerType'];
  ownerId?: string;
  onClose: () => void;
  onSave: (tpl: FormTemplate) => void;
}

const ROLE_OPTIONS: Array<{
  value: FormTemplate['editableBy'][number];
  label: string;
}> = [
  { value: 'superAdmin',      label: 'Super-Admin'      },
  { value: 'business',        label: 'Business Owner'   },
  { value: 'serviceLocation', label: 'Location Admin'   },
  { value: 'serviceProvider', label: 'Service Provider' },
  { value: 'client',          label: 'Client'           },
];

export default function FormTemplateFormDialog({
  open,
  initialData,
  ownerType,
  ownerId,
  onClose,
  onSave
}: FormTemplateFormDialogProps) {
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormTemplate['fields']>([]);
  const [newField, setNewField] = useState<Partial<FormTemplate['fields'][0]>>({
    key: '',
    label: '',
    inputType: 'text',
    required: false,
    options: [],
    order: 0
  });
  const [editableBy, setEditableBy] = useState<FormTemplate['editableBy']>([]);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setFields(initialData.fields);
      setEditableBy(initialData.editableBy || []);
    } else {
      setTitle('');
      setDescription('');
      setFields([]);
      setEditableBy([]);
    }
    setError(null);
  }, [initialData, open]);

  function addField() {
    if (!newField.key || !newField.label) {
      setError('Field key and label are required');
      return;
    }
    const nextOrder = fields.length + 1;
    setFields([
      ...fields,
      {
        key: newField.key!,
        label: newField.label!,
        inputType: newField.inputType as any,
        required: !!newField.required,
        options: newField.options || [],
        order: nextOrder
      }
    ]);
    setNewField({
      key: '',
      label: '',
      inputType: 'text',
      required: false,
      options: [],
      order: 0
    });
    setError(null);
  }

  function removeField(order: number) {
    setFields(fields
      .filter(f => f.order !== order)
      .map((f, i) => ({ ...f, order: i + 1 }))
    );
  }

  function handleRoleToggle(role: FormTemplate['editableBy'][number]) {
    setEditableBy(ed =>
      ed.includes(role)
        ? ed.filter(r => r !== role)
        : [...ed, role]
    );
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const tpl: FormTemplate = {
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: initialData?.createdBy || '',
      updatedBy: initialData?.updatedBy || '',
      status: initialData?.status || 'active',
      title: title.trim(),
      description: description.trim(),
      ownerType: initialData?.ownerType || ownerType,
      ownerId:   initialData?.ownerId   ?? ownerId   ?? null,  // ← ensure not undefined
      fields,
      editableBy
    };

    onSave(tpl);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit' : 'Create'} Form Template</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>

          <Grid item xs={12} md={6}>
            <TextField
              label="Template Title"
              fullWidth
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormGroup row>
              {ROLE_OPTIONS.map(({ value, label }) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      checked={editableBy.includes(value)}
                      onChange={() => handleRoleToggle(value)}
                    />
                  }
                  label={`Editable by ${label}`}
                />
              ))}
            </FormGroup>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1">Fields</Typography>
            {fields.map(f => (
              <Box key={f.order} display="flex" alignItems="center" mb={1}>
                <Box flexGrow={1}>
                  {f.order}. <strong>{f.label}</strong> ({f.inputType})
                  {f.required && ' *'}
                </Box>
                <IconButton size="small" onClick={() => removeField(f.order)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={3}>
                <TextField
                  label="Key"
                  fullWidth
                  value={newField.key}
                  onChange={e => setNewField({ ...newField, key: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Label"
                  fullWidth
                  value={newField.label}
                  onChange={e => setNewField({ ...newField, label: e.target.value })}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  select
                  label="Type"
                  fullWidth
                  SelectProps={{ native: true }}
                  value={newField.inputType}
                  onChange={e => setNewField({ ...newField, inputType: e.target.value })}
                >
                  <option value="text">text</option>
                  <option value="textarea">textarea</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="select">select</option>
                  <option value="checkbox">checkbox</option>
                  <option value="radio">radio</option>
                </TextField>
              </Grid>
              <Grid item xs={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!newField.required}
                      onChange={e => setNewField({ ...newField, required: e.target.checked })}
                    />
                  }
                  label="Required"
                />
              </Grid>
              <Grid item xs={1}>
                <Button variant="outlined" onClick={addField}>
                  Add
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}

        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Create Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
