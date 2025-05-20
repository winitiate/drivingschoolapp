import React from 'react';
import { useAuth } from '../../auth/useAuth';
import FormTemplateManager from '../FormTemplates/FormTemplateManager';

export default function ServiceProviderFormTemplates() {
  const { user } = useAuth();
  return (
    <FormTemplateManager
      ownerType="serviceProvider"
      ownerId={user!.uid}
    />
  );
}
