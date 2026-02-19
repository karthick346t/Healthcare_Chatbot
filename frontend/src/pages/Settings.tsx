import React, { useState } from 'react';
import { 
  MdPerson, 
  MdNotifications, 
  MdSecurity, 
  MdPalette, 
  MdHelp, 
  MdArrowForwardIos,
  MdLogout,
  MdPermDeviceInformation, 
  MdLanguage,
  MdDarkMode
} from 'react-icons/md';
import { HiCheck, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type SectionType = 'account' | 'notifications' | 'privacy' | 'appearance' | 'help';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}

// --- Reusable Neumorphic Components ---

const NeuCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`neu-card p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

const NeuButton = ({ children, onClick, className = '', active = false }: { children: React.ReactNode; onClick?: () => void; className?: string; active?: boolean }) => (
  <button
    onClick={onClick}
    className={`${
      active 
        ? 'neu-pressed text-cyan-700 shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff]' 
        : 'neu-flat hover:text-cyan-600 shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] hover:-translate-y-0.5'
    } transition-all duration-300 rounded-xl px-4 py-2 flex items-center justify-center gap-2 ${className}`}
  >
    {children}
  </button>
);

const NeuToggle = ({ label, enabled, onChange }: ToggleSwitchProps) => (
  <div className="flex items-center justify-between py-4">
    <span className="font-medium text-neutral-600">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${
        enabled 
          ? 'bg-cyan-50 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)]' 
          : 'bg-[#eef2f5] shadow-[inset_3px_3px_6px_#c8d0e7,inset_-3px_-3px_6px_#ffffff]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
          enabled ? 'translate-x-7 bg-cyan-500' : 'translate-x-0 bg-neutral-400'
        }`}
      />
    </button>
  </div>
);

const NeuInput = ({ label, value, type = 'text', placeholder = '' }: { label: string; value?: string; type?: string; placeholder?: string }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full bg-[#eef2f5] rounded-xl px-4 py-3 outline-none text-neutral-700 font-medium shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] focus:shadow-[inset_6px_6px_12px_#c8d0e7,inset_-6px_-6px_12px_#ffffff] transition-all"
      />
    </div>
  </div>
);

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionType>('account');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    offers: false
  });
  const [darkMode, setDarkMode] = useState(false);

  // --- Render Functions ---

  const renderSidebarItem = (id: SectionType, label: string, Icon: any) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full text-left px-6 py-4 rounded-xl flex items-center gap-4 transition-all duration-200 ${
        activeSection === id
          ? 'neu-pressed text-cyan-700 shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff]'
          : 'text-neutral-500 hover:text-cyan-600 hover:bg-[#eef2f5] hover:shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff]'
      }`}
    >
      <Icon className="text-xl" />
      <span className="font-bold text-sm tracking-wide">{label}</span>
      {activeSection === id && <MdArrowForwardIos className="ml-auto text-xs opacity-50" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#eef2f5] p-6 lg:p-10 font-sans text-neutral-800 flex justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- Sidebar Navigation --- */}
        <div className="lg:col-span-1 space-y-4">
            <div className="p-4 mb-4">
                <h1 className="text-3xl font-black text-neutral-700 tracking-tight mb-1">Settings</h1>
                <p className="text-neutral-400 text-sm font-medium">Manage your preferences</p>
            </div>
          
          <div className="space-y-3">
            {renderSidebarItem('account', 'Account', MdPerson)}
            {renderSidebarItem('notifications', 'Notifications', MdNotifications)}
            {renderSidebarItem('privacy', 'Privacy & Security', MdSecurity)}
            {renderSidebarItem('appearance', 'Appearance', MdPalette)}
            {renderSidebarItem('help', 'Help & Support', MdHelp)}
          </div>

          <div className="pt-8 px-4">
             <button className="w-full py-3 rounded-xl bg-[#eef2f5] text-red-500 font-bold shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] active:scale-95 transition-all flex items-center justify-center gap-2">
                <MdLogout /> Sign Out
             </button>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="lg:col-span-3">
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* === ACCOUNT SECTION === */}
              {activeSection === 'account' && (
                <div className="space-y-8">
                  <NeuCard>
                    <h2 className="text-xl font-bold text-neutral-700 mb-6 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-[#eef2f5] shadow-[inset_3px_3px_6px_#c8d0e7,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center text-cyan-600">
                            <MdPerson />
                         </div>
                        Profile Information
                    </h2>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full bg-[#eef2f5] shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border-4 border-[#eef2f5] flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                <img src="https://ui-avatars.com/api/?name=Mokith+Pranesh&background=0D9488&color=fff" alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold uppercase">Change</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            <NeuInput label="Full Name" value="Mokith Pranesh" />
                            <NeuInput label="Username" value="mokith_dev" />
                            <NeuInput label="Email Address" value="mokith@example.com" type="email" />
                            <NeuInput label="Phone Number" value="+1 (555) 123-4567" type="tel" />
                        
                            <div className="col-span-full pt-4 flex gap-4">
                                <NeuButton className="bg-cyan-500 text-white shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] hover:bg-cyan-600 border-none">
                                    Save Changes
                                </NeuButton>
                                <NeuButton className="text-neutral-400">Cancel</NeuButton>
                            </div>
                        </div>
                    </div>
                  </NeuCard>

                  <NeuCard>
                     <h2 className="text-lg font-bold text-neutral-700 mb-4">Password & Authentication</h2>
                     <div className="space-y-4">
                        <NeuButton className="w-full md:w-auto text-sm">Change Password</NeuButton>
                        <NeuButton className="w-full md:w-auto text-sm text-cyan-600">Enable Two-Factor Authentication</NeuButton>
                     </div>
                  </NeuCard>
                </div>
              )}

              {/* === NOTIFICATIONS SECTION === */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <NeuCard>
                    <h2 className="text-xl font-bold text-neutral-700 mb-6">Notification Preferences</h2>
                    <div className="divide-y divide-gray-200">
                        <NeuToggle 
                            label="Email Notifications" 
                            enabled={notifications.email} 
                            onChange={(val) => setNotifications({...notifications, email: val})} 
                        />
                        <NeuToggle 
                            label="Push Notifications" 
                            enabled={notifications.push} 
                            onChange={(val) => setNotifications({...notifications, push: val})} 
                        />
                        <NeuToggle 
                            label="SMS Alerts" 
                            enabled={notifications.sms} 
                            onChange={(val) => setNotifications({...notifications, sms: val})} 
                        />
                         <NeuToggle 
                            label="Marketing & Offers" 
                            enabled={notifications.offers} 
                            onChange={(val) => setNotifications({...notifications, offers: val})} 
                        />
                    </div>
                  </NeuCard>
                </div>
              )}

              {/* === PRIVACY SECTION === */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <NeuCard>
                     <h2 className="text-xl font-bold text-neutral-700 mb-6">Privacy & Data</h2>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] bg-[#eef2f5]">
                             <div>
                                <h4 className="font-bold text-neutral-700">Download My Data</h4>
                                <p className="text-xs text-neutral-400">Get a copy of all your medical records.</p>
                             </div>
                             <button className="text-cyan-600 font-bold text-sm">Download</button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 rounded-xl shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] bg-[#eef2f5]">
                             <div>
                                <h4 className="font-bold text-neutral-700">Clear Search History</h4>
                                <p className="text-xs text-neutral-400">Remove all local search data.</p>
                             </div>
                             <button className="text-red-500 font-bold text-sm">Clear</button>
                        </div>
                     </div>
                  </NeuCard>
                  
                  <NeuCard>
                     <h2 className="text-xl font-bold text-neutral-700 mb-6">Active Sessions</h2>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MdPermDeviceInformation className="text-2xl text-neutral-400" />
                                <div>
                                    <p className="font-bold text-sm text-neutral-600">Windows PC - Chrome</p>
                                    <p className="text-xs text-green-500 font-bold">Active Now</p>
                                </div>
                            </div>
                        </div>
                         <div className="flex items-center justify-between opacity-60">
                            <div className="flex items-center gap-3">
                                <MdPermDeviceInformation className="text-2xl text-neutral-400" />
                                <div>
                                    <p className="font-bold text-sm text-neutral-600">iPhone 13 - Safari</p>
                                    <p className="text-xs text-neutral-400">Last active 2 hrs ago</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-red-500">Revoke</button>
                        </div>
                     </div>
                  </NeuCard>
                </div>
              )}

              {/* === APPEARANCE SECTION === */}
              {activeSection === 'appearance' && (
                 <div className="space-y-6">
                    <NeuCard>
                        <h2 className="text-xl font-bold text-neutral-700 mb-6">Theme & Display</h2>
                        <NeuToggle 
                            label="Dark Mode (Beta)" 
                            enabled={darkMode} 
                            onChange={setDarkMode} 
                        />
                         <div className="py-4">
                            <label className="block text-sm font-bold text-neutral-500 mb-3">Accent Color</label>
                            <div className="flex gap-4">
                                {['bg-cyan-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'].map(color => (
                                    <button key={color} className={`w-10 h-10 rounded-full ${color} shadow-[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff] hover:scale-110 transition-transform`}></button>
                                ))}
                            </div>
                        </div>
                    </NeuCard>
                 </div>
              )}

              {/* === HELP SECTION === */}
               {activeSection === 'help' && (
                 <div className="space-y-6">
                    <NeuCard>
                        <h2 className="text-xl font-bold text-neutral-700 mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {[
                                "How do I book an appointment?",
                                "Is my medical data secure?",
                                "Can I export my prescription history?",
                                "How do I contact support?"
                            ].map((q, i) => (
                                <details key={i} className="group bg-[#eef2f5] rounded-xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] open:shadow-[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
                                    <summary className="font-bold text-neutral-600 p-4 cursor-pointer list-none flex justify-between items-center outline-none">
                                        {q}
                                        <MdArrowForwardIos className="text-xs transition-transform group-open:rotate-90" />
                                    </summary>
                                    <div className="px-4 pb-4 text-sm text-neutral-500 leading-relaxed">
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </div>
                                </details>
                            ))}
                        </div>
                    </NeuCard>
                     <NeuCard>
                        <h2 className="text-lg font-bold text-neutral-700 mb-4">Contact Support</h2>
                        <p className="text-sm text-neutral-500 mb-4">Need help? Our team is available 24/7.</p>
                        <div className="flex gap-4">
                            <NeuButton className="flex-1 bg-cyan-500 text-white shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff]">Chat with Support</NeuButton>
                            <NeuButton className="flex-1">Email Us</NeuButton>
                        </div>
                    </NeuCard>
                 </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
