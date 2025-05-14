// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function Header() {
  const { user, signOut } = useAuth();
  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
      <Link to="/" style={{ marginRight: 16 }}>Home</Link>
      {user ? (
        <>
          <Link to="/dashboard" style={{ marginRight: 16 }}>Dashboard</Link>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <Link to="/sign-in" style={{ marginRight: 16 }}>Sign In</Link>
          <Link to="/sign-up">Sign Up</Link>
        </>
      )}
    </header>
  );
}
