// src/pages/SignUp.tsx
import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';

export default function SignUp() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [role, setRole] = useState<'student'|'instructor'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, pass, role);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} required />
        </div>
        <div>
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
