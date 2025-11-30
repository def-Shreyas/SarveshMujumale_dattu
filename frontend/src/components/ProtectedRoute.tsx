//import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // 1. Import our custom hook

export const ProtectedRoute = () => {
  // 2. Get the live auth state from the context
  const { isAuthenticated } = useAuth();

  // 3. Render the <Outlet /> (which will be your <AppLayout />) if logged in
  //    Otherwise, redirect to the /login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};