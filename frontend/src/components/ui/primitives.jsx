import React from 'react';

/**
 * Web counterparts of the recurring building blocks in mobile/src.
 * Keeping them here means the eight dashboard screens share one set of
 * card, label, badge and ring recipes instead of hand-rolling each.
 */

export const PRIMARY = '#4F46E5';

/** Standard surface card. `bg-white border-[#E2E8F0] rounded-3xl p-5 shadow-sm` on mobile. */
export const Card = ({ className = '', padded = true, children, ...rest }) => (
  <div className={`m-card ${padded ? 'p-5' : ''} ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * Card header: rounded icon tile, title, optional subtitle and a trailing slot.
 * Mirrors the header block repeated across the mobile domain cards.
 */
export const CardHeader = ({ icon: Icon, title, subtitle, action, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {Icon && (
      <div className="m-icon-tile">
        <Icon size={18} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="m-title truncate">{title}</h3>
      {subtitle && <p className="m-subtitle mt-0.5 truncate">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/** Tiny uppercase label that introduces a group of cards. */
export const SectionLabel = ({ children, className = '' }) => (
  <p className={`m-label ${className}`}>{children}</p>
);

/** Label/value row with hairline divider. */
export const InfoRow = ({ label, value, accent = false }) => (
  <div className="m-row">
    <span className="m-row-key shrink-0">{label}</span>
    <span className={`m-row-val ${accent ? 'text-indigo-700 dark:text-indigo-400' : ''}`}>
      {value}
    </span>
  </div>
);

const PILL_TONES = {
  success: 'm-pill-success',
  warning: 'm-pill-warning',
  danger: 'm-pill-danger',
  info: 'm-pill-info',
};

/** Uppercase pill badge. Tone falls back to info for unknown values. */
export const Pill = ({ tone = 'info', icon: Icon, children, className = '' }) => (
  <span className={`${PILL_TONES[tone] || PILL_TONES.info} ${className}`}>
    {Icon && <Icon size={11} />}
    {children}
  </span>
);

/**
 * SVG progress ring — the web port of mobile/src/components/ProgressRing.tsx.
 * Same geometry: -90deg start, round caps, percentage centred in the ring.
 */
export const ProgressRing = ({
  percent = 0,
  label,
  color = PRIMARY,
  trackColor = '#F1EBFB',
  size = 72,
  strokeWidth = 7,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-extrabold" style={{ fontSize: size * 0.23, color }}>
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10.5px] font-bold text-[#0F172A] dark:text-slate-100 mt-1.5">
          {label}
        </span>
      )}
    </div>
  );
};

/** Horizontal track used for the module progress bars. */
export const ProgressBar = ({ value = 0, color = PRIMARY, className = '' }) => (
  <div className={`w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden ${className}`}>
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`, background: color }}
    />
  </div>
);

/**
 * Welcome banner from the mobile home screen: eyebrow, greeting, context line
 * and a circular monogram avatar.
 */
export const HeroHeader = ({ eyebrow, eyebrowIcon: EyebrowIcon, title, subtitle, avatarText }) => (
  <Card className="p-6 flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      {eyebrow && (
        <div className="flex items-center gap-1.5 mb-1">
          {EyebrowIcon && <EyebrowIcon size={12} className="text-amber-500" />}
          <span className="text-[9px] uppercase tracking-widest font-black text-amber-500">
            {eyebrow}
          </span>
        </div>
      )}
      <h1 className="text-2xl font-black text-[#0F172A] dark:text-white truncate">{title}</h1>
      {subtitle && (
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 font-semibold leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    {avatarText && (
      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shrink-0">
        <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">{avatarText}</span>
      </div>
    )}
  </Card>
);

/** Compact metric card: icon tile, caption, value and optional trailing badge. */
export const StatCard = ({ icon: Icon, label, value, hint, tone = 'info' }) => (
  <Card className="p-5 flex items-center gap-4">
    {Icon && (
      <div className="m-icon-tile !p-3">
        <Icon size={22} />
      </div>
    )}
    <div className="min-w-0">
      <h4 className="m-label">{label}</h4>
      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
        <span className="text-2xl font-black text-[#0F172A] dark:text-white">{value}</span>
        {hint && <Pill tone={tone}>{hint}</Pill>}
      </div>
    </div>
  </Card>
);

/** Centred empty/pending state, matching the mobile "no records yet" block. */
export const EmptyState = ({ icon: Icon, tone = 'warning', badge, title, children, action }) => {
  const toneMap = {
    warning: 'bg-amber-50/60 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30',
    success: 'bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30',
    danger: 'bg-rose-50/60 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30',
    info: 'bg-indigo-50/60 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30',
  };
  const iconTone = {
    warning: 'bg-amber-100/70 text-amber-500 dark:bg-amber-950/40',
    success: 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-950/40',
    danger: 'bg-rose-100/70 text-rose-600 dark:bg-rose-950/40',
    info: 'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-950/40',
  };

  return (
    <div className={`flex flex-col items-center text-center border rounded-2xl p-5 ${toneMap[tone]}`}>
      {Icon && (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${iconTone[tone]}`}>
          <Icon size={24} />
        </div>
      )}
      {badge && <Pill tone={tone}>{badge}</Pill>}
      {title && (
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2.5 font-semibold leading-relaxed">
          {title}
        </p>
      )}
      {children}
      {action && <div className="mt-5 w-full">{action}</div>}
    </div>
  );
};

/**
 * Shimmering placeholder block. Compose these into page-shaped skeletons
 * rather than showing a spinner while data loads.
 */
export const Skeleton = ({ className = '', style }) => (
  <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
);

/** A few skeleton lines standing in for a paragraph. */
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-3"
        // Last line runs short, the way real wrapped text does.
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

/** Card-shaped skeleton: optional icon tile, title and body lines. */
export const SkeletonCard = ({ lines = 2, withIcon = true, className = '' }) => (
  <div className={`m-card p-5 ${className}`} aria-hidden="true">
    <div className="flex items-center gap-3 mb-4">
      {withIcon && <Skeleton className="w-11 h-11 rounded-xl shrink-0" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
    <SkeletonText lines={lines} />
  </div>
);

/**
 * Full-page loading state. `variant` picks a shape roughly matching the page
 * being loaded so the skeleton does not jump when real content arrives.
 */
export const PageSkeleton = ({ variant = 'default' }) => {
  if (variant === 'form') {
    return (
      <div className="max-w-3xl mx-auto space-y-6" role="status" aria-label="Loading">
        <SkeletonCard lines={0} />
        <div className="m-card p-6 flex flex-col items-center gap-3">
          <Skeleton className="w-28 h-28 rounded-full" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-40" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="m-card p-5 space-y-4">
            <Skeleton className="h-2.5 w-28" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4" role="status" aria-label="Loading">
        <SkeletonCard lines={0} />
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-4" role="status" aria-label="Loading">
        <SkeletonCard lines={0} />
        <div className="m-card p-5 space-y-3">
          <Skeleton className="h-9" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      </div>
    );
  }

  // default: header, hero, then a grid of cards
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-36 rounded-3xl" />
      <SkeletonCard lines={2} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>
    </div>
  );
};

/** Underlined tab strip used by the module switchers. */
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex overflow-x-auto border-b border-[#E2E8F0] dark:border-[#1e2330]">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 min-w-max px-5 py-4 text-xs font-black uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
            isActive
              ? 'border-[#4F46E5] text-[#4F46E5] dark:text-indigo-400 bg-white dark:bg-[#12131a]'
              : 'border-transparent text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-50/60 dark:hover:bg-slate-800/20'
          }`}
        >
          {Icon && <Icon size={16} />}
          <span>{tab.name}</span>
        </button>
      );
    })}
  </div>
);
