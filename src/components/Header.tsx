import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <div className="navbar bg-base-100 shadow px-4">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost normal-case text-xl">
          Driving School
        </Link>
      </div>
      <div className="flex-none space-x-2">
        <Link to="/" className="btn btn-ghost">Home</Link>
        {user ? (
          <>
            <Link to="/student-dashboard" className="btn btn-ghost">Dashboard</Link>
            <button onClick={() => signOut()} className="btn btn-ghost">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/sign-in" className="btn btn-ghost">Sign In</Link>
            <Link to="/sign-up" className="btn btn-primary">Sign Up</Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
