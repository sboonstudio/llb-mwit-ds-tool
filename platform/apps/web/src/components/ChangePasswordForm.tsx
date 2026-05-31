"use client";

import { updateMyPassword, verifyCurrentPassword } from "@/actions/user";
import { useState, useMemo } from "react";

type Step = "verify" | "update" | "success";

export default function ChangePasswordForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const [step, setStep] = useState<Step>("verify");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strength Check Logic
  const strength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const strengthColor = ["bg-slate-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-emerald-500"][strength];
  const strengthText = ["Empty", "Very Weak", "Weak", "Fair", "Strong", "Very Secure"][strength];

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await verifyCurrentPassword(oldPassword);
      if (result.success) {
        setStep("update");
      } else {
        setError(result.error || "Verification failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("oldPassword", oldPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);
      
      const result = await updateMyPassword(formData);
      if (result.success) {
        setStep("success");
      } else {
        setError(result.error || "Update failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("verify");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setIsActive(false);
  };

  const toggleAccordion = () => {
    if (isExpanded) {
      setIsActive(false);
      reset();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <section className={`overflow-hidden rounded-xl border transition-all duration-500 ease-in-out ${
      isExpanded ? "border-slate-200 bg-white shadow-md" : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
    }`}>
      {/* Header / Accordion Toggle */}
      <button
        onClick={toggleAccordion}
        className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            isExpanded ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
          }`}>
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Security & Password</h2>
            <p className="text-xs text-slate-500">
              {isActive ? "Modifying your account security" : "Manage your password and protection"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Settings</span>
          )}
          <span className={`text-xl transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
            Expand
          </span>
        </div>
      </button>

      {/* Accordion Content */}
      <div className={`transition-all duration-500 ease-in-out ${
        isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      }`}>
        <div className="border-t border-slate-50 p-6">
          {!isActive && step !== "success" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-4 rounded-full bg-slate-50 p-4 text-4xl grayscale opacity-50">
                🔒
              </div>
              <h3 className="text-lg font-medium text-slate-900">Password Settings Locked</h3>
              <p className="mt-2 max-w-xs text-sm text-slate-500">
                To prevent accidental changes, you must unlock this section to update your password.
              </p>
              <button
                onClick={() => setIsActive(true)}
                className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all hover:scale-105"
              >
                Unlock Security Settings
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {/* Toolbar */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {step === "verify" ? "Step 1: Identity Verification" : step === "update" ? "Step 2: New Credentials" : "Update Complete"}
                </span>
                <div className="flex items-center gap-4">
                  {(step === "verify" || step === "update") && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {showPasswords ? "🔒 Hide Passwords" : "👁️ Show Passwords"}
                    </button>
                  )}
                  {step !== "success" && (
                    <button
                      onClick={reset}
                      className="text-xs font-medium text-slate-400 hover:text-red-500"
                    >
                      Lock & Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Form Content */}
              {step === "verify" && (
                <form onSubmit={handleVerify} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                    <span className="mr-2">🛡️</span>
                    For your security, please verify your current password before making changes.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Current Password</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                      placeholder="••••••••"
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-xs font-medium text-red-500">❌ {error}</p>}
                  <button
                    type="submit"
                    disabled={loading || !oldPassword}
                    className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Continue to New Password"}
                  </button>
                </form>
              )}

              {step === "update" && (
                <form onSubmit={handleUpdate} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">New Password</label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                        placeholder="Create a strong password"
                        autoFocus
                      />
                      
                      {/* Strength Meter */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Password Strength</span>
                          <span className={strength >= 4 ? "text-emerald-600" : ""}>{strengthText}</span>
                        </div>
                        <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div
                              key={idx}
                              className={`h-full flex-1 transition-all duration-500 ${idx <= strength ? strengthColor : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-offset-1 ${
                          confirmPassword ? (newPassword === confirmPassword ? "border-emerald-500 ring-emerald-100" : "border-red-400 ring-red-50" ) : "focus:border-indigo-500 focus:ring-indigo-500"
                        }`}
                        placeholder="Repeat your new password"
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-1 text-[10px] text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Security Requirements</h4>
                    <ul className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                      <li className={`flex items-center ${newPassword.length >= 6 ? "text-emerald-600" : "text-slate-400"}`}>
                        <span className="mr-2">{newPassword.length >= 6 ? "✅" : "○"}</span> 6+ characters
                      </li>
                      <li className={`flex items-center ${/[0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`}>
                        <span className="mr-2">{/[0-9]/.test(newPassword) ? "✅" : "○"}</span> At least one number
                      </li>
                      <li className={`flex items-center ${/[A-Z]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`}>
                        <span className="mr-2">{/[A-Z]/.test(newPassword) ? "✅" : "○"}</span> Upper case letter
                      </li>
                      <li className={`flex items-center ${/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-400"}`}>
                        <span className="mr-2">{/[^A-Za-z0-9]/.test(newPassword) ? "✅" : "○"}</span> Special character
                      </li>
                    </ul>
                  </div>

                  {error && <p className="text-xs font-medium text-red-500">❌ {error}</p>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("verify")}
                      className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || strength < 2 || newPassword !== confirmPassword}
                      className="flex-[2] rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Securely Update Password"}
                    </button>
                  </div>
                </form>
              )}

              {step === "success" && (
                <div className="py-8 text-center animate-in zoom-in-95 duration-500">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                    ✨
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Password Secured!</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Your account password has been updated successfully.
                  </p>
                  <button
                    onClick={reset}
                    className="mt-8 rounded-lg border border-slate-200 px-8 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
