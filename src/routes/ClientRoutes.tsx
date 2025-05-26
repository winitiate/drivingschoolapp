// src/routes/ClientRoutes.tsx

import React from 'react';
import { Route } from 'react-router-dom';

import ProtectedClientRoute   from '../components/Auth/ProtectedClientRoute';
import ClientLayout           from '../layouts/ClientLayout';

import ClientSelect           from '../pages/Client/ClientSelect';
import ClientDashboard        from '../pages/Client/ClientDashboard';
import BookingPage            from '../pages/Client/BookingPage';
import ClientAppointments     from '../pages/Client/ClientAppointments';

export const ClientRoutes = (
  <Route path="client" element={<ProtectedClientRoute />}>
    {/* wrap all client routes in the shared layout */}
    <Route element={<ClientLayout />}>
      {/* /client → selector (ClientSelect) or auto-forward */}
      <Route index element={<ClientSelect />} />

      {/* /client/:id/... */}
      <Route path=":id">
        {/* /client/:id → ClientDashboard */}
        <Route index element={<ClientDashboard />} />
        {/* /client/:id/booking → BookingPage */}
        <Route path="booking" element={<BookingPage />} />
        {/* /client/:id/appointments → ClientAppointments */}
        <Route path="appointments" element={<ClientAppointments />} />
      </Route>
    </Route>
  </Route>
);
