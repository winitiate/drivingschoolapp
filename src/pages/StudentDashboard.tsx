// src/pages/StudentDashboard.tsx
import React from 'react';
import { useAuth } from '../auth/useAuth';
import { useStudentAppointments } from '../hooks/useStudentAppointments';
import AppointmentTable from '../components/AppointmentTable';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { appointments, loading } = useStudentAppointments(user?.uid || '');

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="p-4">
      <h1>Student Dashboard</h1>
      {loading ? (
        <p>Loading appointments…</p>
      ) : (
        <AppointmentTable appointments={appointments} />
      )}
    </div>
  );
}
