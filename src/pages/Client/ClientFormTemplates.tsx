import React from 'react';
import { useAuth } from '../../auth/useAuth';
import FormTemplateManager from '../FormTemplates/FormTemplateManager';

export default function ClientFormTemplates() {
  const { user } = useAuth();
  return (
    <FormTemplateManager
      ownerType="client"
      ownerId={user!.uid}
    />
  );
}
