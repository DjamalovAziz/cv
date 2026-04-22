import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

const TELEGRAM_BOT = "cv_azizbot";

export default function Auth() {
  const router = useRouter();
  const { mode: urlMode } = router.query;
  
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [step, setStep] = useState<1 | 2>(1);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingId, setPendingId] = useState("");
  
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
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setPendingId("");
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

      if (!res.ok) {
        setError(data.error || "Failed to start registration");
        setLoading(false);
        return;
      }

      setPendingId(data.pendingId);
      setStep(2);
      setMessage("Code sent to Telegram bot");

      window.open(`https://t.me/${TELEGRAM_BOT}?start=reg_${data.pendingId}`, "_blank");
      
      setLoading(false);
    } catch (err) {
      setError("Something went wrong");
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
        setError("Registered! Please sign in.");
        setTab("signin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Something went wrong");
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
      if (result.error.includes("VERIFICATION_REQUIRED")) {
        setError("Account not verified. Please verify first.");
      } else {
        setError("Invalid credentials");
      }
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleForgotRequest = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          username,
        }),
      });

      const data = await res.json();

      setMessage("Code sent to your email or Telegram");
      setStep(2);

      if (data.pendingId) {
        window.open(`https://t.me/${TELEGRAM_BOT}?start=reset_${data.pendingId}`, "_blank");
      }
      
      setLoading(false);
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          code,
          newPassword: password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }

      setMessage("Password updated! Please sign in.");
      setTab("signin");
      resetForm();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text">
            {tab === "signin" ? "Sign In" : tab === "signup" ? "Sign Up" : "Reset Password"}
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
            ) : tab === "signup" ? (
              <button onClick={handleSignUpInit} disabled={loading} className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Loading..." : "Continue"}
              </button>
            ) : (
              <button onClick={handleForgotRequest} disabled={loading} className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Loading..." : "Send Code"}
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-400">{message}</p>
            </div>

            <div>
              <label className="block text-sm mb-2">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-center text-2xl font-mono tracking-widest"
                placeholder="0000"
                required
              />
            </div>

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

            {tab !== "signin" && (
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

            <button 
              onClick={tab === "signup" ? handleSignUpVerify : handleForgotVerify} 
              disabled={loading} 
              className="w-full px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : tab === "signup" ? "Create Account" : "Reset Password"}
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