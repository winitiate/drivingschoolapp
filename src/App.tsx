import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import InstructorLayout from './layouts/InstructorLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedInstructorRoute from './components/ProtectedInstructorRoute';

import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';

import AdminSignIn from './pages/AdminSignIn';
import AdminDashboard from './pages/AdminDashboard';

import InstructorSignIn from './pages/InstructorSignIn';
import InstructorDashboard from './pages/InstructorDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public/User routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/student-dashboard"
            element={<ProtectedAdminRoute requireAdmin={false}><StudentDashboard /></ProtectedAdminRoute>}
          />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/sign-in" element={<AdminSignIn />} />
          <Route element={<ProtectedAdminRoute requireAdmin={true} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Instructor routes */}
        <Route element={<InstructorLayout />}>
          <Route path="/instructor/sign-in" element={<InstructorSignIn />} />
          <Route element={<ProtectedInstructorRoute />}>
            <Route path="/instructor" element={<InstructorDashboard />} />
            {/* e.g. <Route path="courses" element={<InstructorCourses />} /> */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
