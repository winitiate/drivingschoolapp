// src/components/Footer.tsx
import React from 'react';
export default function Footer() {
  return (
    <footer style={{ padding: '1rem', borderTop: '1px solid #ddd', textAlign: 'center' }}>
      &copy; {new Date().getFullYear()} Driving School App
    </footer>
  );
}