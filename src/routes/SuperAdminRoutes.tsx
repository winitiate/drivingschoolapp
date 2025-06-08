// src/routes/SuperAdminRoutes.tsx

import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import ProtectedSuperAdminRoute from '../components/Auth/ProtectedSuperAdminRoute';
import SuperAdminLayout         from '../layouts/SuperAdminLayout';

import SuperAdminSignIn         from '../pages/SuperAdmin/SuperAdminSignIn';
import SuperAdminDashboard      from '../pages/SuperAdmin/SuperAdminDashboard';

// Businesses
import ManageBusinesses         from '../pages/SuperAdmin/BusinessManagement/ManageBusinesses';
import BusinessFormPage         from '../pages/SuperAdmin/BusinessManagement/BusinessFormPage';

// Other SuperAdmin sections
import SuperAdminFormTemplates        from '../pages/SuperAdmin/SuperAdminFormTemplates';
import BusinessOnboardingSettingsPage from '../pages/SuperAdmin/BusinessOnboardingSettingsPage';
import PaymentSettingsPage            from '../pages/SuperAdmin/Settings/PaymentSettingsPage';

// Subscription-packages
import SubscriptionPackagesPage       from '../pages/SuperAdmin/Subscriptions/SubscriptionPackagesPage';
import SubscriptionPackageFormPage    from '../pages/SuperAdmin/Subscriptions/SubscriptionPackageFormPage';

export const SuperAdminRoutes = (
  <>
    {/* Public sign-in */}
    <Route path="super-admin/sign-in" element={<SuperAdminSignIn />} />

    {/* All other /super-admin/* are protected */}
    <Route
      path="super-admin/*"
      element={
        <ProtectedSuperAdminRoute redirectPath="/super-admin/sign-in" />
      }
    >
      <Route element={<SuperAdminLayout />}>
        {/* /super-admin → Dashboard */}
        <Route index element={<SuperAdminDashboard />} />

        {/* ─── Businesses CRUD ───────────────────────── */}
        <Route path="businesses">
          {/* GET  /super-admin/businesses */}
          <Route index element={<ManageBusinesses />} />
          {/* GET  /super-admin/businesses/new */}
          <Route path="new" element={<BusinessFormPage />} />
          {/* GET  /super-admin/businesses/:id */}
          <Route path=":id" element={<BusinessFormPage />} />
        </Route>

        {/* /super-admin/form-templates */}
        <Route path="form-templates" element={<SuperAdminFormTemplates />} />

        {/* /super-admin/business-onboarding */}
        <Route
          path="business-onboarding"
          element={<BusinessOnboardingSettingsPage />}
        />

        {/* /super-admin/payment-settings */}
        <Route path="payment-settings" element={<PaymentSettingsPage />} />

        {/* ─── Subscription-Packages CRUD ────────────── */}
        <Route path="subscription-packages">
          {/* GET  /super-admin/subscription-packages */}
          <Route index element={<SubscriptionPackagesPage />} />
          {/* GET  /super-admin/subscription-packages/new */}
          <Route path="new" element={<SubscriptionPackageFormPage />} />
          {/* GET  /super-admin/subscription-packages/:id */}
          <Route path=":id" element={<SubscriptionPackageFormPage />} />
        </Route>

        {/* Fallback: any other /super-admin/* */}
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Route>
    </Route>
  </>
);
