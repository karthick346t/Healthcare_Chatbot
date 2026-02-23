import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function StaffRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Staff Interface...</div>;
    }

    if (!user || user.role !== 'staff') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
