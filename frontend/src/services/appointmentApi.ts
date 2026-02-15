const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:4000" : "");

const BASE_PATH = `${API_BASE_URL}/api/appointments`;

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
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch hospitals');
        return response.json();
    },

    getDoctors: async (hospitalId: string): Promise<Doctor[]> => {
        const response = await fetch(`${BASE_PATH}/hospitals/${hospitalId}/doctors`);
        if (!response.ok) throw new Error('Failed to fetch doctors');
        return response.json();
    },

    bookAppointment: async (data: {
        patientName: string;
        patientAge: number;
        patientGender: string;
        patientAddress: string;
        problem: string;
        hospitalId: string;
        doctorId: string;
        appointmentDate: string;
    }): Promise<Appointment> => {
        const response = await fetch(`${BASE_PATH}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to book appointment');
        }
        return response.json();
    },
};
