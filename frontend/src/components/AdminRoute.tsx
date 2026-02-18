import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
