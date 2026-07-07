import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function Tabs({ tabs, defaultTab, onChange }) {
 const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

 const handleTabChange = (id) => {
 setActiveTab(id);
 if (onChange) onChange(id);
 };

 return (
 <div className="w-full">
 <div className="flex space-x-2 rounded-2xl bg-surface-secondary p-1">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => handleTabChange(tab.id)}
 className={`
 relative w-full rounded-xl py-2.5 text-sm font-bold leading-5 transition-colors
 ${activeTab === tab.id
 ? 'text-foreground-700 '
 : 'text-foreground-secondary hover:text-foreground dark:hover:text-white'
 }
 `}
 >
 {activeTab === tab.id && (
 <motion.div
 layoutId="active-tab-indicator"
 className="absolute inset-0 rounded-xl bg-card shadow-sm"
 transition={{ type:"spring", bounce: 0.2, duration: 0.6 }}
 />
 )}
 <span className="relative z-10">{tab.label}</span>
 </button>
 ))}
 </div>
 <div className="mt-4">
 {tabs.find(t => t.id === activeTab)?.content}
 </div>
 </div>
 );
}
