// src/layouts/PublicLayout.tsx

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />

      <main>
        {/* Render any direct children (for non‐nested routes) */}
        {children}

        {/* Render nested routes (for nested <Route> setups) */}
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
