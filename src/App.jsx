import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import InputData from './pages/InputData';
import PKWTList from './pages/PKWTList';

// Komponen untuk memproteksi route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Jika tidak ada token, redirect ke login
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Komponen untuk membatasi akses ke halaman login/register jika sudah login
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    // Jika sudah ada token, redirect ke home
    return <Navigate to="/home" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />

        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        <Route path="/input-data" element={
          <ProtectedRoute>
            <InputData />
          </ProtectedRoute>
        } />

        <Route path="/pkwt-data" element={
          <ProtectedRoute>
            <PKWTList />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
