import React from 'react';

const ProgressRing = ({ percent, label, color, trackColor }) => {
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
        <svg width="64" height="64" className="rotate-[-90deg]">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black text-[#0F172A]">{percent}%</span>
        </div>
      </div>
      <span className="text-[9px] font-extrabold text-[#64748B] mt-1.5 uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default ProgressRing;
