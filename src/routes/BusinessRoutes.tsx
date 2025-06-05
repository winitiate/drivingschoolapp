// src/routes/BusinessRoutes.tsx

import React from "react";
import { Route } from "react-router-dom";

import ProtectedBusinessOwnerRoute from "../components/Auth/ProtectedBusinessOwnerRoute";
import BusinessOwnerLayout from "../layouts/BusinessOwnerLayout";

import BusinessSignIn from "../pages/Business/BusinessSignIn";
import BusinessSignUp from "../pages/Business/BusinessSignUp";
import BusinessSelect from "../pages/Business/BusinessSelect";
import BusinessDashboard from "../pages/Business/BusinessDashboard";
import ManageServiceLocations from "../pages/Business/ManageServiceLocations";
import BusinessFormTemplates from "../pages/Business/BusinessFormTemplates";
import BusinessSettingsManager from "../pages/Business/Settings/BusinessSettingsManager";
import BusinessAvailabilityPage from "../pages/Business/Settings/BusinessAvailabilityPage";

export const BusinessRoutes = (
  <>
    {/*
      1) Publicly accessible routes for business sign‐in / sign‐up
         These must be defined _before_ the protected wrapper, so that
         they aren’t themselves gated by authentication.
    */}
    <Route path="business/sign-in" element={<BusinessSignIn />} />
    <Route path="business/sign-up" element={<BusinessSignUp />} />

    {/*
      2) All other /business routes go under our ProtectedBusinessOwnerRoute.
         If the user isn’t signed in, they will be redirected to "/business/sign-in".
    */}
    <Route
      path="business"
      element={
        <ProtectedBusinessOwnerRoute redirectPath="/business/sign-in" />
      }
    >
      {/*
        3) Wrap everything in our BusinessOwnerLayout (nav bar, etc.)
      */}
      <Route element={<BusinessOwnerLayout />}>
        {/*
          4) If the path is exactly "/business", show the selector (BusinessSelect).
             - If the user owns exactly one business, ProtectedBusinessOwnerRoute
               will auto‐redirect to "/business/{thatId}".
             - If the user owns multiple, we stay here and render BusinessSelect.
        */}
        <Route index element={<BusinessSelect />} />

        {/*
          5) Now any path under "/business/:businessId" is further protected.
        */}
        <Route path=":businessId">
          {/*
            Dashboard for that business
          */}
          <Route index element={<BusinessDashboard />} />

          {/*
            Additional nested routes under /business/:businessId
          */}
          <Route
            path="service-locations"
            element={<ManageServiceLocations />}
          />
          <Route
            path="form-templates"
            element={<BusinessFormTemplates />}
          />

          {/*
            Business‐settings sub‐section
          */}
          <Route path="settings">
            <Route index element={<BusinessSettingsManager />} />
            <Route
              path="availability"
              element={<BusinessAvailabilityPage />}
            />
          </Route>
        </Route>
      </Route>
    </Route>
  </>
);
