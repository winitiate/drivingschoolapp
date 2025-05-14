// src/components/AppointmentTable.tsx
import React from 'react';
import type { Appointment } from '../models/Appointment';

export default function AppointmentTable({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return <p>No upcoming lessons scheduled.</p>;
  }
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th>When</th>
          <th>Lesson</th>
          <th>School</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map(a => (
          <tr key={a.id}>
            <td>{new Date(a.startTime).toLocaleString()}</td>
            <td>{a.lessonTypeId}</td>
            <td>{a.schoolId}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
