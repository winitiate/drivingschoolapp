import React from 'react';
import { Outlet } from 'react-router-dom';

// NOTE: We assume you already have these in src/components/Layout:
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

/**
 * SuperAdminLayout
 *
 * Renders a single top Header (with its own menu button if you’ve configured it),
 * the router <Outlet/> (child pages), and a single Footer. We have removed NavMenu
 * entirely so that no second “hamburger” appears in the bottom-left.
 */
export default function SuperAdminLayout() {
  return (
    <React.Fragment>
      {/* Top‐level AppBar / header */}
      <Header />

      {/* The child route content (Dashboard, ManageBusinesses, etc.) */}
      <Outlet />

      {/* Bottom footer */}
      <Footer />
    </React.Fragment>
  );
}
