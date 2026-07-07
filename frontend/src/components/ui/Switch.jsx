import React from 'react';
import { motion } from 'framer-motion';

export function Switch({ checked, onChange, label }) {
 return (
 <label className="flex items-center gap-3 cursor-pointer">
 <button
 type="button"
 role="switch"
 aria-checked={checked}
 onClick={() => onChange(!checked)}
 className={`relative inline-flex h-7 w-14 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
 checked ? 'bg-primary-500' : 'bg-surface-200 '
 }`}
 >
 <span className="sr-only">Toggle {label}</span>
 <motion.span
 layout
 initial={false}
 animate={{ x: checked ? 28 : 0 }}
 className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-card shadow-sm ring-0 transition duration-200 ease-in-out"
 />
 </button>
 {label && <span className="text-sm font-bold text-foreground-secondary">{label}</span>}
 </label>
 );
}
