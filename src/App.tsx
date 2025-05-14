// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/useAuth';

import MainLayout       from './layouts/MainLayout';
import AdminLayout      from './layouts/AdminLayout';
import InstructorLayout from './layouts/InstructorLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';

import ProtectedStudentRoute     from './components/ProtectedStudentRoute';
import ProtectedAdminRoute       from './components/ProtectedAdminRoute';
import ProtectedInstructorRoute  from './components/ProtectedInstructorRoute';
import ProtectedSuperAdminRoute  from './components/ProtectedSuperAdminRoute';

import Home           from './pages/Home';
import SignIn         from './pages/SignIn';
import SignUp         from './pages/SignUp';
import StudentDashboard    from './pages/StudentDashboard';

import AdminSignIn    from './pages/AdminSignIn';
import AdminDashboard from './pages/AdminDashboard';

import InstructorSignIn    from './pages/InstructorSignIn';
import InstructorDashboard from './pages/InstructorDashboard';

import SuperAdminSignIn    from './pages/SuperAdminSignIn';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ManageSchools       from './pages/ManageSchools';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/"        element={<Home />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route element={<ProtectedStudentRoute />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/sign-in" element={<AdminSignIn />} />
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route element={<InstructorLayout />}>
            <Route path="/instructor/sign-in" element={<InstructorSignIn />} />
            <Route element={<ProtectedInstructorRoute />}>
              <Route path="/instructor" element={<InstructorDashboard />} />
            </Route>
          </Route>

          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin/sign-in" element={<SuperAdminSignIn />} />
            <Route element={<ProtectedSuperAdminRoute />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/schools" element={<ManageSchools />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
