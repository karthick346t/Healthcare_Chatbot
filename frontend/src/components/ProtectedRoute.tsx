import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-primary-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Strict onboarding lock: Check if user profile is incomplete (must have phone, dob, bloodgroup, address)
  const isProfileComplete = Boolean(user?.phone && user?.dateOfBirth && user?.bloodGroup && user?.address);
  // And ensure we don't infinitely loop if they are already on /profile
  if (isAuthenticated && !isProfileComplete && window.location.pathname !== "/profile") {
    return <Navigate to="/profile" state={{ fromOnboarding: true }} replace />;
  }

  return <>{children}</>;
}
