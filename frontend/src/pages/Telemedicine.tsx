import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
    HiPhoneMissedCall, HiChat, HiInformationCircle, HiShieldCheck 
} from 'react-icons/hi';
import { 
    MdSettings, MdVerified, MdMic, MdMicOff, MdVideocam, MdVideocamOff 
} from 'react-icons/md';

export default function Telemedicine() {
    const [isCallActive, setIsCallActive] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [connecting, setConnecting] = useState(false);
    
    // Mock doctor data
    const doctor = {
        name: "Dr. Sarah Wilson",
        specialty: "Cardiologist",
        status: "Online",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop"
    };

    const handleStartCall = () => {
        setConnecting(true);
        setTimeout(() => {
            setConnecting(false);
            setIsCallActive(true);
        }, 2000); // Simulate connection delay
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        setConnecting(false);
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6 pb-6">
            {/* Main Video Area */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 bg-neutral-900 rounded-3xl overflow-hidden relative shadow-2xl border border-neutral-800 group">
                    
                    {/* Waiting State / Remote Video Placeholder */}
                    {!isCallActive ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white">
                            {connecting ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <div className="w-24 h-24 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-6"></div>
                                    <h2 className="text-2xl font-bold">Connecting secure line...</h2>
                                    <p className="text-neutral-400 mt-2">Establishing end-to-end encryption</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="relative inline-block">
                                        <img src={doctor.avatar} alt={doctor.name} className="w-32 h-32 rounded-full border-4 border-cyan-500 shadow-lg object-cover" />
                                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-neutral-900"></div>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-1">{doctor.name}</h2>
                                        <p className="text-cyan-400 font-medium">{doctor.specialty}</p>
                                    </div>
                                    <div className="bg-neutral-800/50 backdrop-blur-sm px-6 py-4 rounded-2xl max-w-sm mx-auto border border-white/10">
                                        <div className="flex items-center gap-3 text-sm text-neutral-300 mb-4">
                                            <HiShieldCheck className="text-green-400 text-xl" />
                                            <span>HIPAA Compliant & End-to-End Encrypted</span>
                                        </div>
                                        <button 
                                            onClick={handleStartCall}
                                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all active:scale-95"
                                        >
                                            Join Consultation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Active Call Mock (Would be remote peer stream)
                        <div className="absolute inset-0 bg-neutral-800">
                             <img 
                                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1200&auto=format&fit=crop" 
                                className="w-full h-full object-cover opacity-90"
                                alt="Doctor Video"
                             />
                             <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white flex items-center gap-2 border border-white/10">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">00:12</span>
                             </div>
                        </div>
                    )}

                    {/* Self-View (Picture-in-Picture) */}
                    <div className="absolute top-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 transition-all hover:scale-105 hover:border-cyan-500/50">
                        {cameraOn ? (
                             <Webcam 
                                audio={false}
                                mirrored={true}
                                className="w-full h-full object-cover"
                             />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                                <MdVideocamOff className="text-3xl" />
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-medium">You</div>
                    </div>

                    {/* Controls Bar */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900/80 backdrop-blur-xl px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/10 shadow-2xl transition-all hover:bg-neutral-900/90">
                        <button 
                            onClick={() => setMicOn(!micOn)}
                            className={`p-4 rounded-xl transition-all ${micOn ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                        >
                            {micOn ? <MdMic className="text-xl" /> : <MdMicOff className="text-xl" />}
                        </button>
                        <button 
                            onClick={() => setCameraOn(!cameraOn)}
                            className={`p-4 rounded-xl transition-all ${cameraOn ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                        >
                            {cameraOn ? <MdVideocam className="text-xl" /> : <MdVideocamOff className="text-xl" />}
                        </button>
                        <button 
                            onClick={handleEndCall}
                            className="p-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/30 active:scale-95"
                        >
                            <HiPhoneMissedCall className="text-xl" />
                        </button>
                        <div className="w-px h-8 bg-white/20 mx-2"></div>
                        <button 
                            onClick={() => setShowChat(!showChat)}
                            className={`p-4 rounded-xl transition-all ${showChat ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                        >
                            <HiChat className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Side Chat / Info Panel */}
            <div className={`transition-all duration-300 flex flex-col gap-4 ${showChat ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-neutral-700">Consultation Chat</h3>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        <div className="flex gap-2">
                            <img src={doctor.avatar} className="w-8 h-8 rounded-full object-cover" />
                            <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 text-sm text-neutral-600">
                                Hello mokith, how are you feeling today?
                            </div>
                        </div>
                         {/* More messages... */}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Type a message..."
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                            />
                            <button className="absolute right-2 top-2 p-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all">
                                <HiChat />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Notes Panel */}
                <div className="h-48 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-neutral-700 mb-2 text-sm flex items-center gap-2">
                        <HiInformationCircle className="text-cyan-500" /> Quick Notes
                    </h3>
                    <textarea 
                        className="w-full h-full resize-none outline-none text-sm text-neutral-600 bg-transparent placeholder-gray-300"
                        placeholder="Take notes during your consultation..."
                    ></textarea>
                </div>
            </div>
        </div>
    );
}
