// src/pages/ServiceLocation/Settings/FormTemplates/FormTemplatesManager.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import FormTemplateManager from '../../../FormTemplates/FormTemplateManager';

export default function ServiceLocationFormTemplates() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  return (
    <FormTemplateManager
      ownerType="location"
      ownerId={serviceLocationId!}
    />
  );
}
