import React, { useState } from 'react';

export default function AdminSettings() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [registrations, setRegistrations] = useState(true);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Settings</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Configure platform preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-neu dark:bg-neu-dark p-6 rounded-3xl shadow-neu-out dark:shadow-neu-out-dark border-none">
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 mb-6">Platform Controls</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-neutral-700 dark:text-neutral-200">Maintenance Mode</p>
                                <p className="text-xs text-neutral-400">Suspend all user access temporarily.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#1f232b] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-themeAccent-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-neutral-700 dark:text-neutral-200">Allow Registrations</p>
                                <p className="text-xs text-neutral-400">Enable new user sign-ups.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={registrations} onChange={() => setRegistrations(!registrations)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-[#1f232b] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-themeAccent-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-neu dark:bg-neu-dark p-6 rounded-3xl shadow-neu-out dark:shadow-neu-out-dark border-none opacity-60 pointer-events-none grayscale">
                    <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 mb-6">Notifications (Pro)</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Email and SMS configuration requires a Pro license.</p>
                    <button className="bg-neu dark:bg-neu-dark shadow-neu-in-sm dark:shadow-neu-in-sm-dark text-neutral-400 px-4 py-3 rounded-xl border-none text-sm font-bold w-full uppercase tracking-wider">Upgrade Plan</button>
                </div>
            </div>
        </div>
    );
}
