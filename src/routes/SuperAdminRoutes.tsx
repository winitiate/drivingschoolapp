// src/routes/SuperAdminRoutes.tsx

import React from 'react';
import { Route } from 'react-router-dom';

import ProtectedSuperAdminRoute from '../components/Auth/ProtectedSuperAdminRoute';
import SuperAdminLayout         from '../layouts/SuperAdminLayout';

import SuperAdminSignIn             from '../pages/SuperAdmin/SuperAdminSignIn';
import SuperAdminDashboard          from '../pages/SuperAdmin/SuperAdminDashboard';
import ManageBusinesses             from '../pages/SuperAdmin/BusinessManagement/ManageBusinesses';
import SuperAdminFormTemplates      from '../pages/SuperAdmin/SuperAdminFormTemplates';
import BusinessOnboardingSettingsPage from '../pages/SuperAdmin/BusinessOnboardingSettingsPage';

export const SuperAdminRoutes = (
  <>
    {/* Public sign-in at /super-admin/sign-in */}
    <Route path="super-admin/sign-in" element={<SuperAdminSignIn />} />

    {/* All other /super-admin/* routes are protected */}
    <Route
      path="super-admin"
      element={
        <ProtectedSuperAdminRoute redirectPath="/super-admin/sign-in" />
      }
    >
      {/* Wrap in layout */}
      <Route element={<SuperAdminLayout />}>
        {/* /super-admin (dashboard) */}
        <Route index element={<SuperAdminDashboard />} />

        {/* /super-admin/businesses */}
        <Route path="businesses" element={<ManageBusinesses />} />

        {/* /super-admin/form-templates */}
        <Route path="form-templates" element={<SuperAdminFormTemplates />} />

        {/* /super-admin/business-onboarding */}
        <Route
          path="business-onboarding"
          element={<BusinessOnboardingSettingsPage />}
        />
      </Route>
    </Route>
  </>
);
