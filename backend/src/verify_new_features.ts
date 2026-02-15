import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:4000/api/appointments';

async function verify() {
    try {
        console.log('--- Verifying Backend Routes ---');

        // 1. Fetch Hospitals for a specific district
        console.log('Fetching hospitals in Coimbatore...');
        const hRes = await axios.get(`${API_URL}/hospitals?district=Coimbatore`);
        console.log(`Found ${hRes.data.length} hospitals in Coimbatore.`);

        if (hRes.data.length > 0) {
            const hospitalId = hRes.data[0]._id;

            // 2. Fetch Doctors
            console.log(`Fetching doctors for hospital: ${hRes.data[0].name}`);
            const dRes = await axios.get(`${API_URL}/hospitals/${hospitalId}/doctors`);
            console.log(`Found ${dRes.data.length} doctors.`);

            if (dRes.data.length > 0) {
                const doctorId = dRes.data[0]._id;

                // 3. Test Booking
                console.log('Testing booking with new fields...');
                const bRes = await axios.post(`${API_URL}/book`, {
                    patientName: "Test Patient",
                    patientAge: 30,
                    patientGender: "Male",
                    patientAddress: "123 Test St",
                    problem: "Fever",
                    hospitalId: hospitalId,
                    doctorId: doctorId,
                    appointmentDate: new Date().toISOString()
                });
                console.log('Booking successful! Token:', bRes.data.tokenNumber);
            }
        }

        console.log('--- Verification Complete ---');
        process.exit(0);
    } catch (error: any) {
        console.error('Verification failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

verify();
