export function validateBotShield(formData: FormData) {
  // 1. Honeypot Check
  const hpValue = formData.get("user_hp_field");
  if (hpValue && hpValue !== "") {
    console.warn("Bot detected: Honeypot field filled");
    return { isBot: true, reason: "Security violation (HP)" };
  }

  // 2. Time-based Check
  const shieldTs = formData.get("shield_ts");
  if (!shieldTs) {
    return { isBot: true, reason: "Security violation (TS Missing)" };
  }

  const loadTime = parseInt(shieldTs as string);
  const currentTime = Date.now();
  const timeDiff = currentTime - loadTime;

  // If submitted in less than 2 seconds, it's very likely a bot
  if (timeDiff < 2000) {
    console.warn(`Bot detected: Form submitted too fast (${timeDiff}ms)`);
    return { isBot: true, reason: "Please slow down. You're submitting too fast." };
  }

  return { isBot: false };
}
