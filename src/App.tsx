// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import StudentDashboard from './pages/StudentDashboard';
import MainLayout from './layouts/MainLayout';   // ← add this line

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
+       <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </MainLayout>
  );
}
