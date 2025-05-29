// src/routes/ClientRoutes.tsx

import React from 'react';
import { Route } from 'react-router-dom';

import ProtectedClientRoute from '../components/Auth/ProtectedClientRoute';
import ClientLayout         from '../layouts/ClientLayout';

import ClientSelect       from '../pages/Client/ClientSelect';
import ClientDashboard    from '../pages/Client/ClientDashboard';
import BookingPage        from '../pages/Client/BookingPage/BookingPage';
import ClientAppointments from '../pages/Client/ClientAppointments';
import AppointmentDetail  from '../pages/Client/AppointmentDetail';

export const ClientRoutes = (
  <Route path="client" element={<ProtectedClientRoute />}>
    <Route element={<ClientLayout />}>
      {/* /client → pick or auto‐forward */}
      <Route index element={<ClientSelect />} />

      {/* /client/:id/... */}
      <Route path=":id">
        <Route index element={<ClientDashboard />} />
        <Route path="booking" element={<BookingPage />} />

        {/* LIST: /client/:id/appointments */}
        <Route path="appointments" element={<ClientAppointments />} />

        {/* DETAIL: /client/:id/appointments/:appointmentId */}
        <Route
          path="appointments/:appointmentId"
          element={<AppointmentDetail />}
        />
      </Route>
    </Route>
  </Route>
);
