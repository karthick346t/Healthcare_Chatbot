import { API_BASE_URL } from './apiConfig';

const BASE_PATH = `${API_BASE_URL}/api/appointments`;

import { fetchWithAuth } from './authApi';

const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    return headers;
};

export interface Hospital {
    _id: string;
    name: string;
    location: string;
    district: string;
    image: string;
    description: string;
    specialties: string[];
}

export interface Doctor {
    _id: string;
    name: string;
    specialty: string;
    hospitalId: string;
    bio: string;
    image: string;
    availability: string[];
}

export interface Appointment {
    _id: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    patientAddress: string;
    problem: string;
    hospitalId: string;
    doctorId: string;
    appointmentDate: string;
    tokenNumber: number;
    status: string;
}

export const appointmentApi = {
    getHospitals: async (district?: string): Promise<Hospital[]> => {
        const url = district ? `${BASE_PATH}/hospitals?district=${district}` : `${BASE_PATH}/hospitals`;
        const response = await fetchWithAuth(url, { headers: { ...getAuthHeaders() } });
        if (!response.ok) throw new Error('Failed to fetch hospitals');
        return response.json();
    },

    getDoctors: async (hospitalId: string): Promise<Doctor[]> => {
        const response = await fetchWithAuth(`${BASE_PATH}/hospitals/${hospitalId}/doctors`, { headers: { ...getAuthHeaders() } });
        if (!response.ok) throw new Error('Failed to fetch doctors');
        return response.json();
    },

    bookAppointment: async (data: {
        patientName: string;
        email: string;
        patientAge: number;
        patientGender: string;
        patientAddress: string;
        problem: string;
        hospitalId: string;
        doctorId: string;
        appointmentDate: string;
        userId?: string;
        status?: string;
    }): Promise<Appointment> => {
        const response = await fetchWithAuth(`${BASE_PATH}/book`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to book appointment');
        }
        return response.json();
    },

    checkAvailability: async (doctorId: string, appointmentDate: string): Promise<{
        totalSlots: number;
        bookedSlots: number;
        availableSlots: number;
        isFull: boolean;
    }> => {
        const response = await fetchWithAuth(`${BASE_PATH}/check-availability?doctorId=${doctorId}&appointmentDate=${appointmentDate}`, { headers: { ...getAuthHeaders() } });
        if (!response.ok) throw new Error('Failed to check availability');
        return response.json();
    },

    checkAppointmentStatus: async (appointmentId: string): Promise<{ status: string }> => {
        const response = await fetchWithAuth(`${BASE_PATH}/${appointmentId}/status`, { headers: { ...getAuthHeaders() } });
        if (!response.ok) throw new Error('Failed to fetch appointment status');
        return response.json();
    },

    simulateUpiPayment: async (appointmentId: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetchWithAuth(`${BASE_PATH}/webhook/upi-mock`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ appointmentId }),
        });
        if (!response.ok) throw new Error('Failed to simulate UPI payment');
        return response.json();
    }
};

