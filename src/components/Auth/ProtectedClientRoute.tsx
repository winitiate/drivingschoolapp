// src/components/Auth/ProtectedClientRoute.tsx
import React from "react";
import { Navigate, Outlet, useMatch } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../auth/useAuth";

export default function ProtectedClientRoute() {
  const { user, loading } = useAuth();

  // Match /client/:id/* (id may be undefined when you’re at /client)
  const match = useMatch("/client/:id/*");
  const id = match?.params.id;

  /* ------------------------------------------------------------------ */
  /* 1) Still waiting for Firebase auth → show spinner                  */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  /* ------------------------------------------------------------------ */
  /* 2) Must be signed in *and* have the client role                    */
  /* ------------------------------------------------------------------ */
  if (!user || !user.roles?.includes("client")) {
    console.info("ProtectedClientRoute → not signed in as client → /sign-in");
    return <Navigate to="/sign-in" replace />;
  }

  /* ------------------------------------------------------------------ */
  /* 3) Build client-location list                                      */
  /* ------------------------------------------------------------------ */
  const clientIds: string[] =
    // new field
    user.clientIds ??
    // legacy field kept for older accounts
    user.clientLocationIds ??
    [];

  /* ------------------------------------------------------------------ */
  /* 4) No :id in the URL → decide where to send the user               */
  /* ------------------------------------------------------------------ */
  if (!id) {
    if (clientIds.length === 0) {
      console.info("ProtectedClientRoute → user has 0 clientIds → /");
      return <Navigate to="/" replace />;
    }
    if (clientIds.length === 1) {
      console.info(
        "ProtectedClientRoute → single clientId → /client/" + clientIds[0]
      );
      return <Navigate to={`/client/${clientIds[0]}`} replace />;
    }
    // Multiple locations → show selector page
    return <Outlet />;
  }

  /* ------------------------------------------------------------------ */
  /* 5) :id present → allow only if it belongs to the user              */
  /* ------------------------------------------------------------------ */
  if (clientIds.includes(id)) {
    return <Outlet />;
  }

  /* ------------------------------------------------------------------ */
  /* 6) Invalid :id → bounce back to selector (or home)                 */
  /* ------------------------------------------------------------------ */
  console.info(
    `ProtectedClientRoute → invalid id ${id} not in [${clientIds.join(",")}]`
  );
  if (clientIds.length > 1) {
    return <Navigate to="/client" replace />;
  }
  return <Navigate to="/" replace />;
}
