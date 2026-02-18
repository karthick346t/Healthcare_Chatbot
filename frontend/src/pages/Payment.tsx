import { appointmentApi } from '../services/appointmentApi';

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { appointmentDetails } = location.state || {};
    
    const [cardFlipped, setCardFlipped] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [error, setError] = useState<string | null>(null);

    // If accessed directly without appointment data, redirect back
    React.useEffect(() => {
        if (!appointmentDetails) {
             navigate('/appointments'); 
        }
    }, [appointmentDetails, navigate]);

    const handlePayment = async () => {
        if (!cardNumber || !expiry || !cvv) {
            alert("Please fill in card details (Test data is fine)");
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // 1. Simulate Payment Gateway Delay (2 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Payment "Success" -> Now actually book the appointment in Backend
            const bookingData = {
                patientName: appointmentDetails.patientDetails.name,
                patientAge: parseInt(appointmentDetails.patientDetails.age),
                patientGender: appointmentDetails.patientDetails.gender,
                patientAddress: appointmentDetails.patientDetails.address,
                problem: appointmentDetails.patientDetails.problem,
                hospitalId: appointmentDetails.hospital._id,
                doctorId: appointmentDetails.doctor._id,
                appointmentDate: appointmentDetails.date,
                // Add default or selected time if available
            };

            const result = await appointmentApi.bookAppointment(bookingData);

            // 3. Navigate to Success Screen with actual backend result
            navigate('/appointments', { 
                state: { 
                    step: 4, 
                    bookingResult: result 
                } 
            });

        } catch (err: any) {
            console.error(err);
            setError("Payment authorized, but booking failed: " + err.message);
            setProcessing(false);
        }
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const parts = [];
        for (let i = 0; i < v.length; i += 4) {
            parts.push(v.substring(i, i + 4));
        }
        return parts.length > 1 ? parts.join(' ') : value;
    };

    return (
        <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
            <div className="flex flex-col lg:flex-row gap-8 max-w-5xl w-full">
                
                {/* Left Side: Order Summary */}
                <div className="flex-1 space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-neutral-800 mb-2">Secure Checkout</h1>
                        <p className="text-neutral-500">Complete your payment to confirm your appointment.</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-neutral-500 font-medium">Consultation Fee</span>
                            <span className="text-xl font-bold text-neutral-800">$50.00</span>
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

                {/* Right Side: The "Million Dollar" Card Interface */}
                <div className="flex-1 perspective-1000">
                    {/* 3D Card Visual */}
                    <div className={`relative w-full aspect-[1.586] mb-8 transition-all duration-700 preserve-3d cursor-pointer ${cardFlipped ? 'rotate-y-180' : ''}`} onClick={() => setCardFlipped(!cardFlipped)}>
                        
                        {/* Front */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl p-6 text-white shadow-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black border border-white/10 backface-hidden flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="flex justify-between items-start relative z-10">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-10" alt="Mastercard" />
                                <HiCreditCard className="text-2xl text-white/50" />
                            </div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="text-2xl font-mono tracking-widest text-shadow">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase text-white/60 font-bold tracking-wider mb-1">Card Holder</p>
                                        <p className="font-medium tracking-wide">{cardHolder || 'YOUR NAME'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-white/60 font-bold tracking-wider mb-1">Expires</p>
                                        <p className="font-medium tracking-wide">{expiry || 'MM/YY'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 backface-hidden rotate-y-180 overflow-hidden">
                            <div className="mt-8 h-12 bg-black w-full"></div>
                            <div className="mt-8 px-6">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-white/60 font-bold tracking-wider mb-1">CVV</p>
                                    <div className="bg-white text-black p-2 rounded text-right font-mono font-bold w-12 ml-auto">
                                        {cvv || '•••'}
                                    </div>
                                </div>
                                <div className="mt-8 text-[10px] text-white/40 text-center">
                                    This card is property of the issuing bank and must be returned upon request.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                        {processing && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <h3 className="text-xl font-bold text-neutral-800">Processing Payment...</h3>
                                <p className="text-neutral-500">Securely communicating with bank...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Card Number</label>
                                <input 
                                    type="text" 
                                    maxLength={19}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-neutral-700 transition-all focus:bg-white"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    onFocus={() => setCardFlipped(false)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Card Holder Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. John Doe"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-cyan-500 outline-none font-medium text-neutral-700 transition-all focus:bg-white"
                                    value={cardHolder}
                                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                    onFocus={() => setCardFlipped(false)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Expiry Date</label>
                                    <input 
                                        type="text" 
                                        maxLength={5}
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-neutral-700 transition-all focus:bg-white"
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        onFocus={() => setCardFlipped(false)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">CVV / CVC</label>
                                    <input 
                                        type="password" 
                                        maxLength={3}
                                        placeholder="•••"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-neutral-700 transition-all focus:bg-white"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value)}
                                        onFocus={() => setCardFlipped(true)}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handlePayment}
                                className="w-full py-4 mt-4 bg-neutral-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span className="group-hover:mr-2 transition-all">Pay $50.00</span>
                                <MdPayment className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* CSS for 3D Flip (Inline for simplicity) */}
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
}
