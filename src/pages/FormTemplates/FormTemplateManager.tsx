// src/pages/FormTemplates/FormTemplateManager.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow,
  TableCell, TableBody, CircularProgress, Alert
} from '@mui/material';
import { useAuth } from '../../auth/useAuth';
import {
  formTemplateStore,
  businessStore,
  serviceLocationStore,
  serviceProviderStore,
  clientStore
} from '../../data';
import { FormTemplate } from '../../models/FormTemplate';
import FormTemplateFormDialog from '../../components/FormTemplates/FormTemplateFormDialog';

interface Props {
  ownerType: FormTemplate['ownerType'];
  ownerId?: string;
}

export default function FormTemplateManager({ ownerType, ownerId }: Props) {
  const { user } = useAuth();

  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormTemplate | null>(null);

  const [permissions, setPermissions] = useState({
    canCreate: ownerType === 'global',
    canModify: ownerType === 'global',
    allowedTemplateTypes: [] as string[],
  });

  // 1️⃣ Load permissions for non-global owners
  useEffect(() => {
    if (ownerType === 'global' || !ownerId) return;

    async function loadPermissions() {
      try {
        let owner: any = null;
        switch (ownerType) {
          case 'business':
            owner = await businessStore.getById(ownerId);
            break;
          case 'location':
            owner = await serviceLocationStore.getById(ownerId);
            break;
          case 'serviceProvider':
            owner = await serviceProviderStore.getById(ownerId);
            break;
          case 'client':
            owner = await clientStore.getById(ownerId);
            break;
        }
        if (owner?.templatePermissions) {
          const {
            canCreateTemplates,
            canModifyTemplates,
            allowedTemplateTypes
          } = owner.templatePermissions;
          setPermissions({
            canCreate: canCreateTemplates,
            canModify: canModifyTemplates,
            allowedTemplateTypes: allowedTemplateTypes || [],
          });
        }
      } catch (e) {
        console.error('Failed loading template permissions', e);
      }
    }

    loadPermissions();
  }, [ownerType, ownerId]);

  // 2️⃣ Fetch templates based on scope + allowed global seeds
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let list: FormTemplate[] = [];

      if (ownerType === 'global') {
        // super-admin sees all global
        list = await formTemplateStore.listByOwner('global');
      } else if (ownerId) {
        // fetch owned templates
        const owned = await formTemplateStore.listByOwner(ownerType, ownerId);
        list = [...owned];

        // include global seeds if this owner has allowances
        if (permissions.allowedTemplateTypes.length > 0) {
          const globals = await formTemplateStore.listByOwner('global');
          const seeded = globals.filter(tpl =>
            permissions.allowedTemplateTypes.includes(tpl.entityType)
          );
          list = [...owned, ...seeded];
        }
      }

      setTemplates(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [ownerType, ownerId, permissions]);

  // reload whenever ownerType/ownerId or permissions update
  useEffect(() => {
    reload();
  }, [reload]);

  // edit button only if allowed & owns the template (or superAdmin on global)
  function canEdit(tpl: FormTemplate) {
    if (ownerType === 'global') {
      return !!user?.roles.includes('superAdmin');
    }
    return permissions.canModify && tpl.ownerId === ownerId;
  }

  const handleSave = async (tpl: FormTemplate) => {
    await formTemplateStore.save(tpl);
    setDialogOpen(false);
    reload();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Form Templates</Typography>
        <Button
          variant="contained"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          disabled={!permissions.canCreate}
        >
          New Template
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Fields</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map(tpl => (
              <TableRow key={tpl.id}>
                <TableCell>{tpl.title}</TableCell>
                <TableCell>{tpl.description}</TableCell>
                <TableCell>{tpl.fields.length}</TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    disabled={!canEdit(tpl)}
                    onClick={() => { setEditing(tpl); setDialogOpen(true); }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <FormTemplateFormDialog
        open={dialogOpen}
        initialData={editing}
        ownerType={ownerType}
        ownerId={ownerId}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
