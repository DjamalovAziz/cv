import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function Auth() {
  const router = useRouter();
  const { mode: urlMode } = router.query;
  
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [step, setStep] = useState<1 | 2>(1);
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verifyMethod, setVerifyMethod] = useState<"email" | "telegram">("telegram");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (urlMode === "signup") setTab("signup");
    if (urlMode === "forgot") setTab("forgot");
  }, [urlMode]);

  const resetForm = () => {
    setStep(1);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setPendingId("");
    setDisplayCode("");
    setError("");
    setMessage("");
  };

  const handleTabChange = (newTab: "signin" | "signup" | "forgot") => {
    setTab(newTab);
    resetForm();
  };

  const handleSignUpInit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "init",
          username,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      console.log("[SIGNUP] Response:", data);

      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }

      setPendingId(data.pendingId);
      setDisplayCode(data.code);
      setStep(2);
      setMessage(verifyMethod === "telegram" ? "Code sent to Telegram bot" : "Code sent to email");
      setLoading(false);
    } catch (err: any) {
      console.error("[SIGNUP] Error:", err);
      setError(err.message || "Error");
      setLoading(false);
    }
  };

  const handleSignUpVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          pendingId,
          code,
        }),
      });

      const data = await res.json();
      console.log("[VERIFY] Response:", data);

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registered! Sign in below.");
        setTab("signin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("[VERIFY] Error:", err);
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const openTelegramBot = () => {
    window.open("https://t.me/cv_azizbot?start=reg_" + pendingId, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {tab === "signin" ? "Sign In" : tab === "signup" ? "Sign Up" : "Reset"}
          </h1>
        </div>

        <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
          <button onClick={() => handleTabChange("signin")} className={`flex-1 py-2 rounded-md ${tab === "signin" ? "bg-blue-600" : "text-gray-400"}`}>
            Sign In
          </button>
          <button onClick={() => handleTabChange("signup")} className={`flex-1 py-2 rounded-md ${tab === "signup" ? "bg-blue-600" : "text-gray-400"}`}>
            Sign Up
          </button>
          <button onClick={() => handleTabChange("forgot")} className={`flex-1 py-2 rounded-md ${tab === "forgot" ? "bg-blue-600" : "text-gray-400"}`}>
            Reset
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg"
                placeholder="username"
                required
              />
            </div>

            {tab === "signup" && (
              <>
                <div>
                  <label className="block text-sm mb-2">Verify via</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setVerifyMethod("telegram")}
                      className={`flex-1 py-2 rounded-lg border ${verifyMethod === "telegram" ? "border-blue-600 bg-blue-600/20" : "border-gray-700"}`}
                    >
                      Telegram
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifyMethod("email")}
                      className={`flex-1 py-2 rounded-lg border ${verifyMethod === "email" ? "border-blue-600 bg-blue-600/20" : "border-gray-700"}`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {verifyMethod === "email" && (
                  <div>
                    <label className="block text-sm mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {tab !== "forgot" && (
              <div>
                <label className="block text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {tab === "signup" && (
              <div>
                <label className="block text-sm mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}

            {tab === "signin" ? (
              <button onClick={handleSignIn} disabled={loading} className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Loading..." : "Sign In"}
              </button>
            ) : (
              <button onClick={handleSignUpInit} disabled={loading} className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Loading..." : "Continue"}
              </button>
            )}
          </div>
        )}

        {step === 2 && tab === "signup" && (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-400 font-mono text-2xl">{displayCode}</p>
              <p className="text-gray-400 text-sm mt-2">
                {verifyMethod === "telegram" ? (
                  <button type="button" onClick={openTelegramBot} className="text-blue-400 underline">
                    Open Telegram Bot
                  </button>
                ) : (
                  "Check your email"
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm mb-2">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-center text-2xl font-mono"
                placeholder="0000"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={handleSignUpVerify} disabled={loading} className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? "Loading..." : "Verify"}
            </button>

            <button onClick={() => setStep(1)} className="w-full text-gray-400 text-sm hover:text-white">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}