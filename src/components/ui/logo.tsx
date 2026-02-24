import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-6" }) => {
    return (
        <svg viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            {/* eLift Text Shape (Geometric/Modern) */}
            <path d="M12 16C12 9.37258 17.3726 4 24 4H32V12H24C21.7909 12 20 13.7909 20 16C20 18.2091 21.7909 20 24 20H32V28H24C17.3726 28 12 22.6274 12 16Z" fill="#101b0d" /> {/* e shape */}
            <rect x="36" y="4" width="8" height="24" rx="4" fill="#101b0d" /> {/* L */}
            <rect x="48" y="4" width="8" height="24" rx="4" fill="#101b0d" /> {/* i */}
            <circle cx="52" cy="8" r="4" fill="#10d772" /> {/* dot */}
            <path d="M64 12H72V8C72 5.79086 73.7909 4 76 4H80V12H76C74.8954 12 74 12.8954 74 14V28H66V12H64Z" fill="#101b0d" /> {/* f */}
            <path d="M96 28H88V12H84V4H88V0H96V4H100V12H96V28Z" fill="#101b0d" /> {/* t */}

            {/* Minimal Text Fallback if shape is abstract */}
            <text x="0" y="24" fontSize="24" fontWeight="900" fill="#101b0d" fontFamily="system-ui" style={{ display: 'none' }}>eLift</text>
        </svg>
    );
};
