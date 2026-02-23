import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiLockClosed, HiShieldCheck, HiCalendar, HiQrcode } from 'react-icons/hi';
import QRCode from 'qrcode';
import { appointmentApi } from '../services/appointmentApi';

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { appointmentDetails } = location.state || {};
    
    const [appointmentId, setAppointmentId] = useState<string | null>(null);
    const [initialResult, setInitialResult] = useState<any>(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed' | 'processing'>('processing');
    const [error, setError] = useState<string | null>(null);
    const bookingAttempted = useRef(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // If accessed directly without appointment data, redirect back
    useEffect(() => {
        if (!appointmentDetails) {
             navigate('/appointments'); 
        }
    }, [appointmentDetails, navigate]);

    useEffect(() => {
        if (!appointmentDetails || bookingAttempted.current) return;
        bookingAttempted.current = true;

        const initializeOrder = async () => {
            try {
                // 1. Create the Pending order
                const bookingData = {
                    patientName: appointmentDetails.patientDetails.name,
                    email: appointmentDetails.patientDetails.email,
                    patientAge: parseInt(appointmentDetails.patientDetails.age),
                    patientGender: appointmentDetails.patientDetails.gender,
                    patientAddress: appointmentDetails.patientDetails.address,
                    problem: appointmentDetails.patientDetails.problem,
                    hospitalId: appointmentDetails.hospital._id,
                    doctorId: appointmentDetails.doctor._id,
                    appointmentDate: appointmentDetails.date,
                    userId: appointmentDetails.userId,
                    status: 'pending' // Initialize as pending
                };

                const result = await appointmentApi.bookAppointment(bookingData);
                const orderId = result._id;
                setAppointmentId(orderId);
                setInitialResult(result);

                // 2. Generate UPI QR Code data
                // In production, user VPA and actual dynamic logic applies
                const upiString = `upi://pay?pa=mokithpranesh@oksbi&pn=Healthcare%20App&am=500.00&cu=INR&tr=${orderId}`;
                const qrUrl = await QRCode.toDataURL(upiString, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
                setQrCodeDataUrl(qrUrl);
                setStatus('pending');

                // 3. Start polling for payment success
                startPolling(orderId, result);

            } catch (err: any) {
                console.error("Booking initialization failed", err);
                setError(err.message || "Failed to initialize secure checkout session");
                setStatus('failed');
            }
        };

        initializeOrder();

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [appointmentDetails]);

    const startPolling = (id: string, initialResult: any) => {
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const res = await appointmentApi.checkAppointmentStatus(id);
                if (res.status === 'confirmed') {
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    setStatus('confirmed');
                    
                    // Play success sound
                    try {
                        const audio = new Audio('/src/assets/payment_success.mp3');
                        audio.play().catch(e => console.error("Audio playback failed:", e));
                    } catch (e) {
                         console.error("Audio error:", e);
                    }

                    // Delay for better UX before redirecting
                    setTimeout(() => {
                        navigate('/appointments', { 
                            state: { 
                                step: 4, 
                                bookingResult: initialResult,
                                appointmentDetails: appointmentDetails
                            } 
                        });
                    }, 1500);
                }
            } catch (pollErr) {
                console.error("Polling error:", pollErr);
            }
        }, 3000); // Check every 3 seconds
    };

    const handleSimulatePayment = async () => {
        if (!appointmentId) return;
        try {
            await appointmentApi.simulateUpiPayment(appointmentId);
            // Explicitly force the success UI immediately instead of waiting for the next polling tick
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setStatus('confirmed');
            
            try {
                const audio = new Audio('/src/assets/payment_success.mp3');
                audio.play().catch(e => console.error("Audio playback failed:", e));
            } catch (e) {
                console.error("Audio error:", e);
            }

            setTimeout(() => {
                navigate('/appointments', { 
                    state: { 
                        step: 4, 
                        // Fetch the minimal needed result format to pass to success page
                        bookingResult: initialResult || { _id: appointmentId, appointmentDate: appointmentDetails?.date, tokenNumber: 1 },
                        appointmentDetails: appointmentDetails
                    } 
                });
            }, 1500);

        } catch (err: any) {
             setError("Simulation failed: " + err.message);
        }
    };

    return (
        <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
            <div className="flex flex-col lg:flex-row gap-8 max-w-5xl w-full">
                
                {/* Left Side: Order Summary */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-neutral-800 mb-2">Secure Checkout</h1>
                        <p className="text-neutral-500">Pay via UPI to confirm your appointment.</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-neutral-500 font-medium">Consultation Fee</span>
                            <span className="text-xl font-bold text-neutral-800">₹500.00</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-neutral-600">
                                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                                    <HiShieldCheck />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-neutral-800">Doctor</p>
                                    <p>{appointmentDetails?.doctor?.name || "Dr. Sarah Wilson"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-neutral-600">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <HiCalendar />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-neutral-800">Date & Time</p>
                                    <p>{appointmentDetails?.date ? new Date(appointmentDetails.date).toLocaleDateString() : "Oct 24, 2024"} • {appointmentDetails?.timeSlot || "10:00 AM"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                            <HiLockClosed />
                            <span>Payments are SSL encrypted and 100% secure.</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: UPI QR Interface */}
                <div className="flex-1">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden flex flex-col items-center justify-center text-center">
                        
                        {(status === 'processing' || status === 'confirmed') && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                                {status === 'processing' ? (
                                    <>
                                        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <h3 className="text-xl font-bold text-neutral-800">Generating Secure QR...</h3>
                                        <p className="text-neutral-500">Please wait while we set up your transaction.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-neutral-800">Payment Successful!</h3>
                                        <p className="text-neutral-500">Redirecting to confirmation...</p>
                                    </>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 w-full bg-red-50 text-red-500 text-sm rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="w-full space-y-6 flex flex-col items-center">
                            <div className="flex items-center gap-2 text-lg font-bold text-neutral-800">
                                <HiQrcode className="text-2xl text-cyan-500" />
                                <span>Scan to Pay</span>
                            </div>

                            {qrCodeDataUrl ? (
                                <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                                    <img src={qrCodeDataUrl} alt="UPI Payment QR Code" className="w-[250px] h-[250px]" />
                                </div>
                            ) : (
                                <div className="w-[250px] h-[250px] bg-gray-50 animate-pulse rounded-2xl border-2 border-dashed border-gray-200"></div>
                            )}

                            <div className="space-y-1">
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Amount to Pay</p>
                                <p className="text-3xl font-bold text-neutral-800">₹500.00</p>
                            </div>

                            <p className="text-sm text-neutral-500 max-w-[250px]">
                                Open any UPI app on your mobile device and scan this code to complete the payment.
                            </p>

                            <div className="w-full pt-6 border-t border-gray-100 mt-2">
                                <button 
                                    onClick={handleSimulatePayment}
                                    className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold shadow hover:shadow-lg transition-all text-sm"
                                >
                                    Simulate Payment Success (Dev Only)
                                </button>
                                <p className="text-xs text-neutral-400 mt-3 text-center">
                                    In production, the Payment Gateway sends a webhook on success.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
