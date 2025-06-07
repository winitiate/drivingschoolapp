// src/routes/PublicRoutes.tsx

import React, { Fragment } from "react";
import { Route } from "react-router-dom";

import PublicLayout  from "../layouts/PublicLayout";
import Homepage      from "../pages/Homepage";
import About         from "../pages/About";
import PricingPage   from "../pages/Public/PricingPage";
import ContactPage   from "../pages/Public/ContactPage";
import ClientSignIn  from "../pages/Client/ClientSignIn";
import ClientSignUp  from "../pages/Client/ClientSignUp";

export const PublicRoutes = (
  <Fragment>
    {/* index ("/") */}
    <Route
      index
      element={
        <PublicLayout>
          <Homepage />
        </PublicLayout>
      }
    />

    {/* "/about" */}
    <Route
      path="about"
      element={
        <PublicLayout>
          <About />
        </PublicLayout>
      }
    />

    {/* "/pricing" */}
    <Route
      path="pricing"
      element={
        <PublicLayout>
          <PricingPage />
        </PublicLayout>
      }
    />

    {/* "/contact" */}
    <Route
      path="contact"
      element={
        <PublicLayout>
          <ContactPage />
        </PublicLayout>
      }
    />

    {/* "/sign-in" */}
    <Route
      path="sign-in"
      element={
        <PublicLayout>
          <ClientSignIn />
        </PublicLayout>
      }
    />

    {/* "/sign-up" */}
    <Route
      path="sign-up"
      element={
        <PublicLayout>
          <ClientSignUp />
        </PublicLayout>
      }
    />
  </Fragment>
);
