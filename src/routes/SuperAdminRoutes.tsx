// src/routes/SuperAdminRoutes.tsx

import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import ProtectedSuperAdminRoute from '../components/Auth/ProtectedSuperAdminRoute';
import SuperAdminLayout         from '../layouts/SuperAdminLayout';

import SuperAdminSignIn               from '../pages/SuperAdmin/SuperAdminSignIn';
import SuperAdminDashboard            from '../pages/SuperAdmin/SuperAdminDashboard';
import ManageBusinesses               from '../pages/SuperAdmin/BusinessManagement/ManageBusinesses';
import SuperAdminFormTemplates        from '../pages/SuperAdmin/SuperAdminFormTemplates';
import BusinessOnboardingSettingsPage from '../pages/SuperAdmin/BusinessOnboardingSettingsPage';
import PaymentSettingsPage            from '../pages/SuperAdmin/Settings/PaymentSettingsPage';

import SubscriptionPackagesPage     from '../pages/SuperAdmin/Subscriptions/SubscriptionPackagesPage';
import SubscriptionPackageFormPage  from '../pages/SuperAdmin/Subscriptions/SubscriptionPackageFormPage';

export const SuperAdminRoutes = (
  <>
    {/* Public sign-in at /super-admin/sign-in */}
    <Route path="super-admin/sign-in" element={<SuperAdminSignIn />} />

    {/* All /super-admin/* children are protected */}
    <Route
      path="super-admin/*"
      element={
        <ProtectedSuperAdminRoute redirectPath="/super-admin/sign-in" />
      }
    >
      <Route element={<SuperAdminLayout />}>

        {/* /super-admin → Dashboard */}
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

        {/* /super-admin/payment-settings */}
        <Route
          path="payment-settings"
          element={<PaymentSettingsPage />}
        />

        {/* ────────────────────────────── */}
        {/* /super-admin/subscription-packages */}
        <Route
          path="subscription-packages"
          element={<SubscriptionPackagesPage />}
        />
        <Route
          path="subscription-packages/new"
          element={<SubscriptionPackageFormPage />}
        />
        <Route
          path="subscription-packages/:id"
          element={<SubscriptionPackageFormPage />}
        />
        {/* ────────────────────────────── */}

        {/* fallback → dashboard */}
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Route>
    </Route>
  </>
);
