import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from './models/Hospital';
import Doctor from './models/Doctor';

dotenv.config();

const realData = [
    {
        district: "Erode",
        hospitals: [
            {
                name: "Medway Hospitals",
                location: "Chennimalai Road, Erode",
                description: "A multispeciality hospital offering services in cardiology, orthopedics, and neurology.",
                specialties: ["Cardiology", "Orthopedics", "Neurology"],
                doctors: [
                    { name: "Dr. Balasubramani", specialty: "Neurology", bio: "Neurosurgeon with 12 years of experience." },
                    { name: "Dr. Thangadurai R R", specialty: "General Surgery", bio: "Expert in laparoscopic and general surgery." }
                ]
            },
            {
                name: "Lotus Hospital",
                location: "Poondurai Road, Erode",
                description: "Multispeciality care with a focus on cardiac science and nephrology.",
                specialties: ["Cardiac Science", "Nephrology", "Urology"],
                doctors: [
                    { name: "Dr. Saravanan", specialty: "Nephrology", bio: "Specialist in renal care and dialysis." },
                    { name: "Dr. Jesudasan A", specialty: "Pediatrics", bio: "Pediatrician with 28 years of experience." }
                ]
            }
        ]
    },
    {
        district: "Coimbatore",
        hospitals: [
            {
                name: "PSG Hospital",
                location: "Avinashi Road, Peelamedu, Coimbatore",
                description: "900-bed multispeciality hospital known for holistic care and research.",
                specialties: ["Transplantation", "Cardiology", "Oncology"],
                doctors: [
                    { name: "Dr. M. Ramaswamy", specialty: "General Physician", bio: "Senior consultant with decades of experience." },
                    { name: "Dr. Duraisamy Palanisamy", specialty: "General Medicine", bio: "Expert in internal medicine and sexology." }
                ]
            },
            {
                name: "KMCH (Kovai Medical Center)",
                location: "Avinashi Road, Coimbatore",
                description: "Comprehensive medical center with state-of-the-art infrastructure.",
                specialties: ["Cardiology", "Oncology", "Neurology"],
                doctors: [
                    { name: "Dr. P Kavitha", specialty: "General Physician", bio: "Expert in family medicine and chronic care." },
                    { name: "Dr. G Karthikeyan", specialty: "Pulmonology", bio: "Specialist in respiratory diseases." }
                ]
            },
            {
                name: "Sri Ramakrishna Hospital",
                location: "Sarojini Naidu Road, Coimbatore",
                description: "700-bed iconic hospital established in 1975.",
                specialties: ["Pediatrics", "Cardiology", "Orthopedics"],
                doctors: [
                    { name: "Dr. Ranjithkumar Selvaraj", specialty: "General Physician", bio: "Specialist in adult internal medicine." }
                ]
            }
        ]
    },
    {
        district: "Salem",
        hospitals: [
            {
                name: "Kauvery Hospital",
                location: "Meyyanur Main Road, Salem",
                description: "A leading multispeciality hospital focusing on tertiary care.",
                specialties: ["Cardiology", "Orthopedics", "Gastroenterology"],
                doctors: [
                    { name: "Dr. Senthil Kumar", specialty: "Cardiology", bio: "Experienced interventional cardiologist." }
                ]
            },
            {
                name: "Manipal Hospital",
                location: "Dalmia Board, Salem-Bangalore Highway, Salem",
                description: "Advanced healthcare facility with multi-disciplinary expertise.",
                specialties: ["Neurology", "Oncology", "Urology"],
                doctors: [
                    { name: "Dr. Vikram", specialty: "Neurology", bio: "Specialist in brain and spine disorders." }
                ]
            }
        ]
    },
    {
        district: "Chennai",
        hospitals: [
            {
                name: "MGM Healthcare",
                location: "Nelson Manickam Road, Chennai",
                description: "Health-focused ecosystem with world-class medical facilities.",
                specialties: ["Cardiac Sciences", "Liver Transplant", "Orthopedics"],
                doctors: [
                    { name: "Dr. Sandeep Attawar", specialty: "Cardiovascular Surgery", bio: "Renowned Cardiovascular Surgeon specializing in Thoracic Organ Transplantation." },
                    { name: "Dr. Ravikumar R", specialty: "Orthopedics", bio: "Specialist in joint replacement and spine surgery." }
                ]
            },
            {
                name: "Apollo Hospitals",
                location: "Greams Road, Chennai",
                description: "Asia’s foremost integrated healthcare provider.",
                specialties: ["Cardiology", "Gastroenterology", "Oncology"],
                doctors: [
                    { name: "Dr. Kothandaraman", specialty: "General Physician", bio: "30+ years of experience in multi-organ complications." },
                    { name: "Dr. Ramakrishnan S", specialty: "Rheumatology", bio: "Expert in autoimmune and joint disorders." }
                ]
            },
            {
                name: "MIOT International",
                location: "Mount Poonamallee Road, Manapakkam, Chennai",
                description: "Multispeciality hospital with patients from over 130 countries.",
                specialties: ["Orthopedics", "Nephrology", "Cardiology"],
                doctors: [
                    { name: "Dr. P.V.A. Mohandas", specialty: "Orthopedics", bio: "Pioneer in hip and knee replacements." }
                ]
            }
        ]
    },
    {
        district: "Hyderabad",
        hospitals: [
            {
                name: "Apollo Hospitals, Jubilee Hills",
                location: "Road No 72, Jubilee Hills, Hyderabad",
                description: "Premier healthcare destination with over 60 specialties.",
                specialties: ["Cardiology", "Neurology", "Transplantation"],
                doctors: [
                    { name: "Dr. Surya Prakash", specialty: "Orthopedics", bio: "Expert in spine surgery and physiotherapy." }
                ]
            },
            {
                name: "Yashoda Hospitals",
                location: "Raj Bhavan Road, Somajiguda, Hyderabad",
                description: "Leading medical facility known for its transplant programs.",
                specialties: ["Oncology", "Cardiology", "Neurology"],
                doctors: [
                    { name: "Dr. G.V. Reddy", specialty: "Cardiology", bio: "Specialist in non-invasive cardiology." }
                ]
            }
        ]
    },
    {
        district: "Banglore",
        hospitals: [
            {
                name: "Manipal Hospital, Old Airport Road",
                location: "HAL Old Airport Rd, Bangalore",
                description: "Flagship hospital of the Manipal Group, known for quaternary care.",
                specialties: ["Cardiology", "Pediatrics", "Oncology"],
                doctors: [
                    { name: "Dr. Ramesh Babu", specialty: "Internal Medicine", bio: "Highly regarded general physician with 33 years of experience." }
                ]
            },
            {
                name: "Aster CMI Hospital",
                location: "Sahakara Nagar, Bangalore",
                description: "World-class infrastructure with specialized centers of excellence.",
                specialties: ["Gastroenterology", "Neurosciences", "Cardiac Sciences"],
                doctors: [
                    { name: "Dr. Dwijendra Prasad", specialty: "Internal Medicine", bio: "Expert in diabetes and metabolic disorders." }
                ]
            }
        ]
    },
    {
        district: "Theni",
        hospitals: [
            {
                name: "Government Theni Medical College Hospital",
                location: "K.Vilangudi, Theni",
                description: "Major public healthcare provider for the Theni district.",
                specialties: ["General Medicine", "Pediatrics", "Emergency Care"],
                doctors: [
                    { name: "Dr. Kannan", specialty: "General Medicine", bio: "Expert in handling local community health issues." }
                ]
            }
        ]
    }
];

async function seed() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_bot';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for real data seeding...');

        await Hospital.deleteMany({});
        await Doctor.deleteMany({});

        for (const dData of realData) {
            console.log(`Seeding hospitals for ${dData.district}...`);

            for (const hData of dData.hospitals) {
                const hospital = new Hospital({
                    name: hData.name,
                    location: hData.location,
                    district: dData.district,
                    image: "", // No images as requested
                    description: hData.description,
                    specialties: hData.specialties
                });

                await hospital.save();

                for (const docData of hData.doctors) {
                    const doctor = new Doctor({
                        name: docData.name,
                        specialty: docData.specialty,
                        hospitalId: hospital._id,
                        bio: docData.bio,
                        image: "", // No images as requested
                        availability: ["Mon", "Tue", "Wed", "Thu", "Fri"]
                    });
                    await doctor.save();
                }
            }
        }

        console.log('Real Data Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
