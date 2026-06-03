"use client";

import React, { useEffect, useState } from "react";

export default function BotShield() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    setLoadTime(Date.now());
  }, []);

  return (
    <div className="hidden" aria-hidden="true">
      {/* Honeypot field: Bots will try to fill this, humans won't see it */}
      <input 
        type="text" 
        name="user_hp_field" 
        tabIndex={-1} 
        autoComplete="off" 
      />
      {/* Time field: Encrypted or encoded load time to check for speed bots */}
      <input 
        type="hidden" 
        name="shield_ts" 
        value={loadTime} 
      />
    </div>
  );
}
