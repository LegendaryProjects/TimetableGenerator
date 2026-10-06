import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

export function checkPasswordStrength(password = '') {
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const criteria = [
    { id: 'length', label: 'At least 8 characters', met: hasLength },
    { id: 'letter', label: 'Letters (a-z, A-Z)', met: hasLetter },
    { id: 'number', label: 'Numbers (0-9)', met: hasNumber },
    { id: 'special', label: 'Special character (!@#$...)', met: hasSpecial }
  ];

  const metCount = criteria.filter(c => c.met).length;

  let label = 'Very Weak';
  let color = 'text-rose-400';
  let barColor = 'bg-rose-500';
  let percent = 20;

  if (metCount === 1) {
    label = 'Weak';
    color = 'text-rose-400';
    barColor = 'bg-rose-500';
    percent = 25;
  } else if (metCount === 2) {
    label = 'Fair';
    color = 'text-orange-400';
    barColor = 'bg-orange-500';
    percent = 50;
  } else if (metCount === 3) {
    label = 'Moderate';
    color = 'text-amber-400';
    barColor = 'bg-amber-500';
    percent = 75;
  } else if (metCount === 4) {
    label = 'Strong';
    color = 'text-emerald-400';
    barColor = 'bg-emerald-500';
    percent = 100;
  }

  const isValid = hasLength && hasLetter && hasNumber && hasSpecial;

  return {
    criteria,
    metCount,
    label,
    color,
    barColor,
    percent,
    isValid,
    hasLength,
    hasLetter,
    hasNumber,
    hasSpecial
  };
}

export default function PasswordStrengthIndicator({ password = '', isDark = true }) {
  if (!password) return null;

  const { criteria, label, color, barColor, percent, isValid } = checkPasswordStrength(password);

  return (
    <div className="mt-2 space-y-2 select-none">
      {/* Strength Bar & Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-slate-400">Password Strength</span>
        <span className={`text-[11px] font-bold ${color} flex items-center gap-1`}>
          {isValid ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          {label}
        </span>
      </div>

      {/* Progress Track */}
      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
        <div 
          className={`h-full transition-all duration-300 rounded-full ${barColor}`} 
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Real-time Checklist Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
        {criteria.map(c => (
          <div key={c.id} className="flex items-center gap-1.5 transition-colors">
            {c.met ? (
              <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </span>
            ) : (
              <span className={`p-0.5 rounded-full shrink-0 ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'}`}>
                <X className="w-3 h-3 stroke-[2]" />
              </span>
            )}
            <span className={`${c.met ? (isDark ? 'text-slate-200 font-medium' : 'text-slate-700 font-medium') : 'text-slate-500'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
