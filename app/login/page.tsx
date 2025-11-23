"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  // --- 1. GOOGLE LOGIN FUNCTION ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ab hume yahan localhost hi dena hai, kyunki Supabase Google se baat karke wapas yahan bhejega
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
        alert(error.message);
        setLoading(false);
    }
  };
  // --- 2. EMAIL/PASSWORD FUNCTION (Aapka Purana Code) ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("✅ Sign up successful! Check your email (or login if verification is off).");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      setMsg(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
            {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Login to find your perfect room</p>

        {/* --- GOOGLE BUTTON (Top Option) --- */}
        <button 
            onClick={handleGoogleLogin}
            className="w-full border-2 border-gray-200 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition text-gray-700 font-bold mb-6"
        >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G"/>
            Continue with Google
        </button>

        {/* --- DIVIDER --- */}
        <div className="flex items-center mb-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* --- EMAIL FORM --- */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <input type="email" placeholder="Email Address" required className="w-full pl-10 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <input type="password" placeholder="Password" required className="w-full pl-10 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          
          {msg && <p className={`text-center text-sm ${msg.includes("✅") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg flex justify-center transition">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Sign Up with Email" : "Login with Email")}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          {isSignUp ? "Already have an account?" : "Don't have an account?"} {" "}
          <button onClick={() => {setIsSignUp(!isSignUp); setMsg("");}} className="text-blue-600 font-bold hover:underline">
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}