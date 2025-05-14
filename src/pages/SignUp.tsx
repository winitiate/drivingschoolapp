import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const role = 'student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, pass, role);
  };

  return (
    <div className="card w-[36rem] bg-base-100 shadow-xl mx-auto">
      <div className="card-body">
        <h2 className="card-title justify-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="form-control">
            <label className="label" htmlFor="email">
              <span className="label-text">Email</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">Password</span>
            </label>
            <input
              id="password"
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              className="input input-bordered"
            />
          </div>
          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
