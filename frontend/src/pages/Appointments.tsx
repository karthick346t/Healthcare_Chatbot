import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    MdArrowBack, MdLocationOn, MdCalendarToday, MdCheckCircle, MdSearch,
    MdDescription, MdPerson, MdHome, MdOutlineQuestionAnswer, MdDownload,
    MdPublic, MdPublic as MdLanguage
} from "react-icons/md";
import { appointmentApi } from "../services/appointmentApi";
import type { Hospital, Doctor, Appointment } from "../services/appointmentApi";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import QRCode from 'qrcode';
import i18n from "../utils/i18n";
import languages from "../locales/languages.json";

const districts = ["Erode", "Coimbatore", "Salem", "Theni", "Chennai", "Hyderabad", "Banglore"];

interface PatientDetails {
    name: string;
    email: string;
    age: string;
    gender: string;
    address: string;
    problem: string;
}

const Appointments = () => {
    const { t } = useTranslation();
    const { selectedLanguage, setLanguage } = useContext(LanguageContext);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const currentLang = languages.find((l) => l.code === selectedLanguage) || languages[0];

    const navigate = useNavigate();
    const location = useLocation();
    const savedState = location.state;

    // 0: District, 1: Hospital, 2: Doctor, 3: Date, 3.5: Form, 4: Success
    const [step, setStep] = useState(savedState?.step || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Selections
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    
    // Initialize from saved state if returning from payment
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(savedState?.appointmentDetails?.hospital || null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(savedState?.appointmentDetails?.doctor || null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(savedState?.appointmentDetails?.timeSlot || null);
    const [selectedDate, setSelectedDate] = useState<string>(savedState?.appointmentDetails?.date || "");

    const { user } = useAuth();
    const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self');

    // Patient Details Form
    const [patientForm, setPatientForm] = useState<PatientDetails>(savedState?.appointmentDetails?.patientDetails || {
        name: "",
        email: "",
        age: "",
        gender: "Male",
        address: "",
        problem: ""
    });

    // Auto-fill for self booking
    // Auto-fill for self booking
    useEffect(() => {
        // Prevent auto-fill if we are in the success step (restoring data)
        if (step === 4) return;

        if (bookingFor === 'self' && user) {
            setPatientForm(prev => ({
                ...prev,
                name: user.name || "",
                email: user.email || "",
                // We can also try to fill other details if available in user object
                gender: user.gender || "Male",
                age: user.dateOfBirth ? (() => {
                    const dob = new Date(user.dateOfBirth);
                    const today = new Date();
                    let calculatedAge = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                        calculatedAge--;
                    }
                    return calculatedAge.toString();
                })() : "",
                address: user.address || ""
            }));
        } else if (bookingFor === 'other') {
            // Clear fields for fresh entry (optional, or keep generic defaults)
             setPatientForm(prev => ({
                ...prev,
                name: "",
                email: "", // User must provide email for 'other'
                age: "",
                gender: "Male",
                address: "",
                problem: ""
            }));
        }
    }, [bookingFor, user, step]);

    const [bookingResult, setBookingResult] = useState<Appointment | null>(savedState?.bookingResult || null);
    
    // Availability map for all 7 dates
    const [availabilityMap, setAvailabilityMap] = useState<Record<string, {
        totalSlots: number;
        bookedSlots: number;
        availableSlots: number;
        isFull: boolean;
    }>>({});
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Fetch Hospitals when district is selected
    useEffect(() => {
        if (selectedDistrict) {
            const fetchHospitals = async () => {
                setLoading(true);
                try {
                    const data = await appointmentApi.getHospitals(selectedDistrict);
                    setHospitals(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchHospitals();
        }
    }, [selectedDistrict]);

    // Fetch Doctors when hospital is selected
    useEffect(() => {
        if (selectedHospital) {
            const fetchDoctors = async () => {
                setLoading(true);
                try {
                    const data = await appointmentApi.getDoctors(selectedHospital._id);
                    setDoctors(data);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchDoctors();
        }
    }, [selectedHospital]);

    // Generate next 7 days array
    const next7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // Check availability for all 7 dates when doctor is selected
    useEffect(() => {
        if (selectedDoctor) {
            const fetchAllAvailability = async () => {
                setLoadingAvailability(true);
                try {
                    // Fetch availability for all 7 dates in parallel
                    const availabilityPromises = next7Days.map(date =>
                        appointmentApi.checkAvailability(selectedDoctor._id, date)
                            .then(data => ({ date, data }))
                            .catch(err => {
                                console.error(`Failed to check availability for ${date}:`, err);
                                return null;
                            })
                    );

                    const results = await Promise.all(availabilityPromises);
                    
                    // Build availability map
                    const newAvailabilityMap: Record<string, any> = {};
                    results.forEach(result => {
                        if (result) {
                            newAvailabilityMap[result.date] = result.data;
                        }
                    });
                    
                    setAvailabilityMap(newAvailabilityMap);
                } catch (err: any) {
                    console.error('Failed to check availability:', err);
                } finally {
                    setLoadingAvailability(false);
                }
            };
            fetchAllAvailability();
        }
    }, [selectedDoctor]);

    const handleBook = async () => {
        if (!selectedHospital || !selectedDoctor) return;

        // Basic Validation
        if (!patientForm.name || !patientForm.email || !patientForm.age || !patientForm.address || !patientForm.problem) {
            setError(t("Please fill in all patient details.") || "Please fill in all patient details.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Redirect to Payment Gateway with booking details
            // We pass all necessary data to the payment page to finalize booking there
            navigate('/payment', { 
                state: { 
                    appointmentDetails: {
                        district: selectedDistrict,
                        hospital: selectedHospital,
                        doctor: selectedDoctor,
                        date: selectedDate,
                        timeSlot: selectedTimeSlot,
                        patientDetails: patientForm,
                        userId: user?.userId || (user as any)?._id // Fallback just in case
                    }
                } 
            });
            // setBookingResult(result);
            // setStep(4);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        if (!bookingResult || !selectedDoctor || !selectedHospital) return;

        const doc = new jsPDF();
        
        // Brand Colors (Premium Medical Theme)
        const primaryDark = [15, 23, 42] as [number, number, number]; // Slate-900
        const accentBlue = [37, 99, 235] as [number, number, number]; // Blue-600
        const textGray = [100, 116, 139] as [number, number, number]; // Slate-500
        const textDark = [30, 41, 59] as [number, number, number]; // Slate-800
        const lightBg = [248, 250, 252] as [number, number, number]; // Slate-50
        const successGreen = [22, 163, 74] as [number, number, number]; // Green-600

        // --- Left Sidebar (Dark Branding) ---
        doc.setFillColor(...primaryDark);
        doc.rect(0, 0, 70, 297, 'F');
        
        // Logo / Brand
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("NEXA", 35, 40, { align: "center" });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text("HEALTHCARE SYSTEMS", 35, 48, { align: "center", charSpace: 2 });

        // Sidebar Divider
        doc.setDrawColor(51, 65, 85); // Slate-700
        doc.line(15, 60, 55, 60);

        // Sidebar Details
        const sidebarY = 240;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        
        const contactInfo = [
            "PATIENT SUPPORT",
            "+1 (800) 555-0199",
            "support@nexa.health",
            "",
            "EMERGENCY",
            "Dial 911 immediately",
            "",
            "WEBSITE",
            "www.nexahealth.com"
        ];

        let contactY = sidebarY;
        contactInfo.forEach(line => {
            if (line === "PATIENT SUPPORT" || line === "EMERGENCY" || line === "WEBSITE") {
                 doc.setFont("helvetica", "bold");
                 doc.setTextColor(255, 255, 255);
            } else {
                 doc.setFont("helvetica", "normal");
                 doc.setTextColor(148, 163, 184);
            }
            doc.text(line, 35, contactY, { align: "center" });
            contactY += 5;
        });


        // --- Main Content Area ---
        const startX = 85; 
        
        // Header
        doc.setTextColor(...accentBlue);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("OFFICIAL APPOINTMENT RECEIPT", startX, 40, { charSpace: 0.5 });
        
        doc.setTextColor(...textDark);
        doc.setFontSize(32);
        doc.text("Confirmation", startX, 52);

        // Status Badge
        doc.setFillColor(220, 252, 231); // Green-100
        doc.roundedRect(startX + 85, 43, 30, 10, 2, 2, 'F');
        doc.setTextColor(...successGreen);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CONFIRMED", startX + 100, 49, { align: "center" });

        // Booking Reference Box
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setFillColor(...lightBg);
        doc.roundedRect(startX, 70, 110, 28, 2, 2, 'FD');
        
        doc.setTextColor(...textGray);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("BOOKING REFERENCE", startX + 6, 80);
        doc.text("DATE", startX + 60, 80);
        
        doc.setTextColor(...textDark);
        doc.setFontSize(14);
        doc.text(`# ${bookingResult.tokenNumber}`, startX + 6, 88);
        doc.text(new Date(bookingResult.appointmentDate).toLocaleDateString(), startX + 60, 88);

        // Doctor Section
        let y = 120;
        doc.setTextColor(...textGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("MEDICAL SPECIALIST", startX, y);
        y += 8;
        
        doc.setTextColor(...textDark);
        doc.setFontSize(18);
        doc.text(selectedDoctor.name, startX, y);
        y += 6;
        
        doc.setTextColor(...accentBlue);
        doc.setFontSize(10);
        doc.text(selectedDoctor.specialty.toUpperCase(), startX, y);
        y += 12;
        
        // Hospital Section
        doc.setTextColor(...textDark);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(selectedHospital.name, startX, y);
        y += 5;
        
        doc.setTextColor(...textGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(selectedHospital.location, startX, y, { maxWidth: 90 });

        // Line Separator
        y += 15;
        doc.setDrawColor(226, 232, 240);
        doc.line(startX, y, 195, y);

        // Patient Section
        y += 15;
        doc.setTextColor(...textGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("PATIENT INFORMATION", startX, y);
        y += 8;

        doc.setTextColor(...textDark);
        doc.setFontSize(12);
        doc.text(patientForm.name, startX, y);
        y += 5;
        
        doc.setTextColor(...textGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${patientForm.age} Years • ${patientForm.gender}`, startX, y);
        y += 5;
        doc.text(patientForm.email, startX, y);


        // Real QR Code Generation
        try {
            // Professional Receipt Format (Clean Text)
            // The ID is essential for system verification, but we format it nicely.
            const qrData = `NEXA HEALTHCARE - APPOINTMENT
--------------------------------
Patient: ${patientForm.name}
Doctor:  ${selectedDoctor.name}
Date:    ${new Date(bookingResult.appointmentDate).toLocaleDateString()}
Time:    ${selectedTimeSlot || "Confirmed Slot"}
Token:   #${bookingResult.tokenNumber}
--------------------------------
Ref ID:  ${bookingResult._id || "N/A"}`;

            const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 100, color: { dark: '#0f172a', light: '#ffffff' } });
            
            // Footer QR Section
            const qrY = 230;
            doc.addImage(qrDataUrl, 'PNG', startX, qrY, 25, 25);
            
            doc.setFontSize(8);
            doc.setTextColor(...textDark);
            doc.setFont("helvetica", "bold");
            doc.text("SCAN FOR DETAILS", startX + 30, qrY + 8);
            
            doc.setFontSize(7);
            doc.setTextColor(...textGray);
            doc.setFont("helvetica", "normal");
            doc.text("Present this QR code at reception", startX + 30, qrY + 13);
            doc.text("or self-service kiosk.", startX + 30, qrY + 17);

        } catch (err) {
            console.error("QR Gen Error", err);
        }

        doc.save(`NEXA_Appt_${bookingResult.tokenNumber}.pdf`);
    };


    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <div className="flex w-full min-h-screen bg-[#eef2f6] relative overflow-x-hidden font-sans text-neutral-dark">
            {/* Background Blobs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-300/20 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-blue-500/20 to-indigo-400/20 blur-[100px] pointer-events-none" />

            <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => step > 0 && step < 4 ? setStep(step === 3.5 ? 3 : step - 1) : navigate("/")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-white/80 text-neutral-600 font-bold hover:bg-white/80 transition-all shadow-sm"
                    >
                        <MdArrowBack />
                        <span>{step === 4 ? t("Back to Dashboard") : t("Go Back")}</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex gap-2 mr-4">
                            {[0, 1, 2, 3, 3.5].map(s => (
                                <div key={s} className={`h-2 w-10 rounded-full transition-all duration-500 ${step >= s ? "bg-primary w-14" : "bg-white/50"}`} />
                            ))}
                        </div>

                        {/* Language Selector */}
                        <div className="relative" ref={langMenuRef}>
                            <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-white/80 text-xs font-bold text-neutral-600 shadow-sm cursor-pointer hover:bg-white/80 transition-all">
                                <span className="text-base">{currentLang.emoji}</span>
                                <span>{currentLang.code.toUpperCase()}</span>
                            </button>
                            {showLangMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                                    {languages.map((lang) => (
                                        <button key={lang.code} onClick={() => { setLanguage(lang.code); i18n.changeLanguage(lang.code); setShowLangMenu(false); }} className={`w-full text-left px-4 py-3 text-xs font-medium flex items-center gap-3 transition-colors ${selectedLanguage === lang.code ? "bg-primary/10 text-primary" : "text-neutral-600 hover:bg-white/50"}`}>
                                            <span className="text-lg">{lang.emoji}</span>
                                            <span>{lang.native}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl animate-shake">
                        {error}
                    </div>
                )}

                {/* STEP 0: Location Entry Point */}
                {step === 0 && (
                    <div className="animate-fadeIn flex flex-col items-center">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-4xl text-primary mb-6 shadow-inner">
                            <MdLocationOn />
                        </div>
                        <h1 className="text-4xl font-extrabold text-neutral-800 mb-2 text-center">{t("book_appointment_title")}</h1>
                        <p className="text-neutral-500 mb-10 font-medium text-center max-w-md">{t("book_appointment_desc")}</p>

                        <div className="w-full max-w-2xl bg-white/40 border border-white/60 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl flex flex-col md:flex-row gap-4">
                            {/* Search Box */}
                            <div className="relative flex-1">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder={t("search_location_placeholder") || "Search location..."}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-white/80 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery) {
                                            const matchedDistrict = districts.find(d =>
                                                d.toLowerCase().includes(searchQuery.toLowerCase())
                                            );
                                            if (matchedDistrict) {
                                                setSelectedDistrict(matchedDistrict);
                                                setStep(1);
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Dropdown */}
                            <div className="relative min-w-[200px]">
                                <select
                                    className="w-full appearance-none p-4 rounded-2xl bg-white border border-white/80 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm font-bold text-neutral-700 pr-10"
                                    value={selectedDistrict}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedDistrict(e.target.value);
                                            setStep(1);
                                        }
                                    }}
                                >
                                    <option value="">{t("select_district")}</option>
                                    {districts.map(d => (
                                        <option key={d} value={d}>{t(d)}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                    <MdPublic size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: Hospital Selection */}
                {step === 1 && (
                    <div className="animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-4xl font-extrabold text-neutral-800 mb-2">{t("hospitals_in", { district: t(selectedDistrict) })}</h1>
                                <p className="text-neutral-500 font-medium">{t("select_facility")}</p>
                            </div>

                            {/* Filter within district */}
                            <div className="relative max-w-sm w-full">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder={t("filter_hospitals_placeholder") || "Filter hospitals by name..."}
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-40 rounded-[2rem] bg-white/30 animate-pulse border border-white/60" />
                                ))
                            ) : filteredHospitals.map(h => (
                                <div
                                    key={h._id}
                                    onClick={() => { setSelectedHospital(h); setStep(2); }}
                                    className="group bg-white/40 border border-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 hover:bg-white/60 hover:-translate-y-2 transition-all duration-300 cursor-pointer shadow-xl"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                        <MdHome size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-neutral-800 mb-2 truncate">{t(h.name || "")}</h3>
                                    <div className="flex items-start text-neutral-500 text-sm leading-relaxed mb-4">
                                        <MdLocationOn className="mt-0.5 mr-2 shrink-0 text-primary" />
                                        <span>{t(h.location || "")}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {h.specialties.map(s => (
                                            <span key={s} className="px-3 py-1 bg-white/80 text-primary border border-primary/10 rounded-lg text-[10px] font-black uppercase tracking-wider">{t(s || "")}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Doctor Selection */}
                {step === 2 && selectedHospital && (
                    <div className="animate-fadeIn">
                        <h1 className="text-4xl font-extrabold text-neutral-800 mb-2">{t("choose_doctor")}</h1>
                        <p className="text-neutral-500 mb-8 font-medium">{t("available_specialists", { hospital: selectedHospital.name })}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                Array(2).fill(0).map((_, i) => (
                                    <div key={i} className="h-32 rounded-[2rem] bg-white/30 animate-pulse border border-white/60" />
                                ))
                            ) : doctors.map(d => (
                                <div
                                    key={d._id}
                                    onClick={() => { setSelectedDoctor(d); setStep(3); }}
                                    className="flex items-center gap-6 p-8 bg-white/40 border border-white/60 backdrop-blur-xl rounded-[2.5rem] hover:bg-white/60 hover:-translate-y-1 transition-all cursor-pointer shadow-lg"
                                >
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl">
                                        <MdPerson />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="text-2xl font-bold text-neutral-800 truncate">{t(d.name || "")}</h3>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black rounded-md uppercase">{t(d.specialty || "")}</span>
                                        </div>
                                        <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed italic">"{t(d.bio || "")}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: Date Select */}
                {step === 3 && selectedHospital && selectedDoctor && (
                    <div className="animate-fadeIn max-w-2xl mx-auto">
                        <h1 className="text-4xl font-extrabold text-neutral-800 mb-2">{t("Select Appointment Date")}</h1>
                        <p className="text-neutral-500 mb-8 font-medium">{t("select_preferred_date")}</p>

                        {/* Doctor Info Card - Outside main container */}
                        <div className="bg-white/40 border border-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-lg mb-6 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl">
                                <MdPerson />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-neutral-800">{t(selectedDoctor.name || "")}</h4>
                                <p className="text-primary font-bold text-xs tracking-wide uppercase">{t(selectedDoctor.specialty || "")}</p>
                                <p className="text-neutral-500 text-sm font-medium">{t(selectedHospital.name || "")}</p>
                            </div>
                        </div>

                        {/* Date Selection Card */}
                        <div className="bg-white/40 border border-white/60 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl">
                            <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 block">{t("select_preferred_date")}</label>
                            
                            <div className="grid grid-cols-4 md:grid-cols-7 gap-4 mb-8">
                                {next7Days.map((date: string) => {
                                    const d = new Date(date);
                                    const isSelected = selectedDate === date;
                                    const availability = availabilityMap[date];
                                    const isLoading = loadingAvailability && !availability;
                                    const isSunday = d.getDay() === 0; // 0 = Sunday
                                    
                                    // Determine availability status
                                    let availabilityStatus: 'available' | 'limited' | 'full' | 'loading' | 'closed' = 'loading';
                                    
                                    if (isSunday) {
                                        availabilityStatus = 'closed';
                                    } else if (availability) {
                                        if (availability.isFull) {
                                            availabilityStatus = 'full';
                                        } else if (availability.availableSlots <= 2) {
                                            availabilityStatus = 'limited';
                                        } else {
                                            availabilityStatus = 'available';
                                        }
                                    }

                                    // Color classes based on status
                                    const getColorClasses = () => {
                                        if (isSelected && !isSunday) {
                                            return "bg-primary border-primary text-white shadow-lg shadow-primary/30";
                                        }
                                        
                                        if (isSunday) {
                                            return "bg-gray-100 border-gray-300 text-gray-400 opacity-50 cursor-not-allowed";
                                        }
                                        
                                        if (isLoading) {
                                            return "bg-white/30 border-white/60 text-neutral-400 animate-pulse";
                                        }

                                        switch (availabilityStatus) {
                                            case 'available':
                                                return "bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100";
                                            case 'limited':
                                                return "bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100";
                                            case 'full':
                                                return "bg-red-50 border-red-300 text-red-400 opacity-60 cursor-not-allowed";
                                            default:
                                                return "bg-white/50 border-white/80 text-neutral-600";
                                        }
                                    };

                                    const isDisabled = availabilityStatus === 'full' || isLoading || isSunday;
                                    
                                    const getTooltip = () => {
                                        if (isSunday) return t("Closed - Sunday");
                                        if (availability) return `${availability.availableSlots} of ${availability.totalSlots} slots available`;
                                        return 'Loading...';
                                    };

                                    return (
                                        <button
                                            key={date}
                                            onClick={() => !isDisabled && setSelectedDate(date)}
                                            disabled={isDisabled}
                                            title={getTooltip()}
                                            className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${getColorClasses()}`}
                                        >
                                            <span className="text-[10px] font-bold uppercase opacity-60 mb-1">
                                                {d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language, { weekday: 'short' })}
                                            </span>
                                            <span className="text-lg font-extrabold">{d.getDate()}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setStep(3.5)}
                                disabled={!selectedDate || availabilityMap[selectedDate]?.isFull}
                                className="w-full py-5 rounded-[1.5rem] bg-primary-600 hover:bg-primary-700 text-white font-extrabold tracking-wide shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"

                            >
                                {t("confirm_booking")}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3.5: Patient Form */}
                {step === 3.5 && (
                    <div className="animate-fadeIn max-w-3xl">
                        <h1 className="text-4xl font-extrabold text-neutral-800 mb-2">{t("patient_details_title")}</h1>
                        <p className="text-neutral-500 mb-10 font-medium">{t("patient_details_desc")}</p>

                        <div className="bg-white/40 border border-white/60 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl">
                            
                            {/* Booking For Toggle */}
                            <div className="mb-8 flex justify-center">
                                <div className="bg-white/50 p-1 rounded-xl flex gap-2 border border-white/60">
                                    <button
                                        onClick={() => setBookingFor('self')}
                                        className={`px-6 py-2 rounded-lg font-bold transition-all ${bookingFor === 'self' ? 'bg-primary text-white shadow-lg' : 'text-neutral-500 hover:bg-white/50'}`}
                                    >
                                        {t("For Me")}
                                    </button>
                                    <button
                                        onClick={() => setBookingFor('other')}
                                        className={`px-6 py-2 rounded-lg font-bold transition-all ${bookingFor === 'other' ? 'bg-primary text-white shadow-lg' : 'text-neutral-500 hover:bg-white/50'}`}
                                    >
                                        {t("For Someone Else")}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-500 flex items-center gap-2"><MdPerson /> {t("full_name")}</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 rounded-2xl bg-white/60 border border-white/80 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder={t("full_name") || "Full Name"}
                                        value={patientForm.name}
                                        onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-500 flex items-center gap-2"> Email Address {bookingFor === 'self' && <span className="text-xs font-normal opacity-50">(Auto-filled)</span>}</label>
                                    <input
                                        type="email"
                                        className={`w-full p-4 rounded-2xl border outline-none transition-all ${bookingFor === 'self' ? 'bg-gray-100 text-gray-500 border-transparent cursor-not-allowed' : 'bg-white/60 border-white/80 focus:ring-2 focus:ring-primary'}`}
                                        placeholder="email@example.com"
                                        value={patientForm.email}
                                        readOnly={bookingFor === 'self'}
                                                                                onChange={(e) => {
                                            setBookingFor('other');
                                            setPatientForm({ ...patientForm, email: e.target.value });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-500 flex items-center gap-2"> {t("age")}</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 rounded-2xl bg-white/60 border border-white/80 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder={t("age") || "Age"}
                                        value={patientForm.age}
                                        onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-500">{t("gender")}</label>
                                    <div className="flex gap-4">
                                        {["Male", "Female", "Other"].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setPatientForm({ ...patientForm, gender: g })}
                                                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${patientForm.gender === g ? "bg-primary text-white border-primary" : "bg-white/50 text-neutral-500 border-white/80"}`}
                                            >
                                                {t(g.toLowerCase())}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-500 flex items-center gap-2"><MdHome /> {t("address")}</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 rounded-2xl bg-white/60 border border-white/80 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder={t("address") || "Address"}
                                        value={patientForm.address}
                                        onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 mb-10">
                                <label className="text-sm font-bold text-neutral-500 flex items-center gap-2"><MdOutlineQuestionAnswer /> {t("health_problem")}</label>
                                <textarea
                                    className="w-full p-6 rounded-3xl bg-white/60 border border-white/80 focus:ring-2 focus:ring-primary outline-none transition-all h-32 resize-none"
                                    placeholder={t("problem_placeholder") || "Describe issue..."}
                                    value={patientForm.problem}
                                    onChange={(e) => setPatientForm({ ...patientForm, problem: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={loading}
                                className="w-full py-5 rounded-[1.5rem] bg-primary-600 hover:bg-primary-700 text-white font-extrabold tracking-wide shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? t("Processing...") : t("booking_success_cta") || "Finish & Book Appointment"}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: Success */}
                {step === 4 && bookingResult && (
                    <div className="animate-fadeIn flex flex-col items-center text-center py-6">
                        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-5xl text-emerald-500 mb-6 shadow-inner border border-emerald-50">
                            <MdCheckCircle />
                        </div>
                        <h1 className="text-4xl font-extrabold text-neutral-800 mb-2">{t("booking_success")}</h1>
                        <p className="text-neutral-500 mb-10 font-medium">{t("appointment_confirmation")}</p>

                        <div className="bg-white/60 border border-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl max-w-md w-full relative overflow-hidden mb-10">
                            <div className="absolute top-0 right-0 p-4 bg-primary/10 rounded-bl-[2rem] text-primary font-black text-2xl">
                                #{bookingResult.tokenNumber}
                            </div>

                            <div className="text-left mb-6">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t("doctor")}</p>
                                <h4 className="text-xl font-bold text-neutral-800">{t(selectedDoctor?.name || "")}</h4>
                            </div>

                            <div className="grid grid-cols-2 text-left gap-6 mb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t("date")}</p>
                                    <p className="font-bold text-neutral-700">{new Date(bookingResult.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{t("booking_token")}</p>
                                    <p className="font-extrabold text-primary text-2xl">#{bookingResult.tokenNumber}</p>
                                </div>
                            </div>

                            <button
                                onClick={generatePDF}
                                className="w-full py-4 flex items-center justify-center gap-2 bg-neutral-800 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
                            >
                                <MdDownload className="text-xl" />
                                {t("download_slip")}
                            </button>
                        </div>

                        <button
                            onClick={() => navigate("/")}
                            className="px-10 py-4 rounded-2xl bg-white border border-white/80 text-neutral-700 font-extrabold hover:bg-white/80 transition-all shadow-xl"
                        >
                            {t("Back to Dashboard")}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Appointments;
