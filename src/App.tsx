// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/useAuth';

import MainLayout       from './layouts/MainLayout';
import AdminLayout      from './layouts/AdminLayout';
import InstructorLayout from './layouts/InstructorLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';

import ProtectedStudentRoute    from './components/Auth/ProtectedStudentRoute';
import ProtectedAdminRoute      from './components/Auth/ProtectedAdminRoute';
import ProtectedInstructorRoute from './components/Auth/ProtectedInstructorRoute';
import ProtectedSuperAdminRoute from './components/Auth/ProtectedSuperAdminRoute';

import Home            from './pages/Home';
import SignIn          from './pages/SignIn';
import SignUp          from './pages/SignUp';
import StudentDashboard   from './pages/StudentDashboard';

import AdminSignIn         from './pages/AdminSignIn';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';  // updated import

import InstructorSignIn     from './pages/InstructorSignIn';
import InstructorDashboard  from './pages/InstructorDashboard';

import SuperAdminSignIn     from './pages/SuperAdminSignIn';
import SuperAdminDashboard  from './pages/SuperAdminDashboard';
import ManageSchools        from './pages/ManageSchools';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public + Student */}
          <Route element={<MainLayout />}>
            <Route path="/"        element={<Home />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route element={<ProtectedStudentRoute />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* School Admin */}
          <Route element={<AdminLayout />}>
            {/* public sign-in page */}
            <Route path="/admin/sign-in" element={<AdminSignIn />} />

            {/* all protected admin routes */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              {/* dynamic school dashboard */}
              <Route path=":schoolId" element={<SchoolAdminDashboard />} />
            </Route>
          </Route>

          {/* Instructor */}
          <Route element={<InstructorLayout />}>
            <Route path="/instructor/sign-in" element={<InstructorSignIn />} />
            <Route element={<ProtectedInstructorRoute />}>
              <Route path="/instructor" element={<InstructorDashboard />} />
            </Route>
          </Route>

          {/* Super Admin */}
          <Route path="/super-admin/sign-in" element={<SuperAdminSignIn />} />
          <Route path="/super-admin" element={<ProtectedSuperAdminRoute />}>
            <Route element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="schools" element={<ManageSchools />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
