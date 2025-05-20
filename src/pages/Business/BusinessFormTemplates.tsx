// src/pages/Business/BusinessFormTemplates.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import FormTemplateManager from '../FormTemplates/FormTemplateManager';

export default function BusinessFormTemplates() {
  const { businessId } = useParams<{ businessId: string }>();
  return (
    <FormTemplateManager
      ownerType="business"
      ownerId={businessId}
    />
  );
}
