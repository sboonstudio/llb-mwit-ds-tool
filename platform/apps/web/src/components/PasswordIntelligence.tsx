"use client";

import React, { useMemo } from "react";

export type PasswordStrength = {
  score: number; // 0 to 4
  label: string;
  color: string;
  requirements: {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
};

export function getPasswordStrength(password: string): PasswordStrength {
  const reqs = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const metCount = Object.values(reqs).filter(Boolean).length;
  
  let score = 0;
  let label = "Very Weak";
  let color = "bg-slate-200";

  if (password.length > 0) {
    if (metCount <= 2) { score = 1; label = "Weak"; color = "bg-red-400"; }
    else if (metCount === 3) { score = 2; label = "Fair"; color = "bg-amber-400"; }
    else if (metCount === 4) { score = 3; label = "Good"; color = "bg-blue-400"; }
    else if (metCount === 5) { score = 4; label = "Strong"; color = "bg-emerald-500"; }
  }

  return { score, label, color, requirements: reqs };
}

export default function PasswordIntelligence({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strength: {strength.label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step} 
              className={`h-1 w-6 rounded-full transition-colors duration-500 ${
                step <= strength.score ? strength.color : "bg-slate-100"
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <Requirement item="8+ characters" met={strength.requirements.length} />
        <Requirement item="Uppercase" met={strength.requirements.hasUpper} />
        <Requirement item="Lowercase" met={strength.requirements.hasLower} />
        <Requirement item="Number" met={strength.requirements.hasNumber} />
        <Requirement item="Special char" met={strength.requirements.hasSpecial} />
      </div>
    </div>
  );
}

function Requirement({ item, met }: { item: string, met: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1 w-1 rounded-full ${met ? "bg-emerald-500" : "bg-slate-300"}`} />
      <span className={`text-[9px] font-medium ${met ? "text-emerald-600" : "text-slate-400"}`}>{item}</span>
    </div>
  );
}
