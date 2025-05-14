import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="card w-[36rem] bg-base-100 shadow-xl text-center p-8 mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Driving School App</h1>
      <p className="mb-6">
        Learn to drive with confidence. Manage your lessons and track your progress.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/sign-up" className="btn bg-blue-600 hover:bg-blue-700 text-white border-none">
          Get Started
        </Link>
        <Link to="/sign-in" className="btn btn-outline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
