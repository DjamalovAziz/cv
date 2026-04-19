import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center gradient-text">Admin Sign In</h1>
        
        <div>
          <label className="block text-sm mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg"
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg"
            placeholder="Enter password"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}