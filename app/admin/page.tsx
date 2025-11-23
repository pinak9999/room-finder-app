"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Check, X, ShieldAlert, Loader2, LogOut } from "lucide-react";

export default function AdminPanel() {
  // 👇 STEP 1: YAHAN APNA EMAIL LIKHEIN (Bilkul sahi spelling)
  const ADMIN_EMAIL = "davepinak0@gmail.com"; // <--- Replace this with YOUR email

  const [listings, setListings] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const email = user.email || "";
      setCurrentUserEmail(email);

      // 2. COMPARE (Case Insensitive)
      if (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
        fetchPending(); // ✅ Match hua to data lao
      } else {
        setLoading(false); // ❌ Match nahi hua, loading roko (Access Denied dikhega)
      }
    };

    checkUser();
  }, []);

  const fetchPending = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("admin_status", "pending")
      .order("created_at", { ascending: false });
    
    if (data) setListings(data);
    setLoading(false);
  };

  const handleAction = async (id: number, status: string) => {
    if(!confirm("Sure?")) return;
    await supabase.from("listings").update({ admin_status: status, is_active: status === 'approved' }).eq("id", id);
    fetchPending();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;

  // --- 🔒 TRUTH DETECTOR SCREEN (Agar email match nahi hua) ---
  if (currentUserEmail.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6 text-center">
        <ShieldAlert size={60} className="text-red-600 mb-4"/>
        <h1 className="text-3xl font-bold text-red-700 mb-2">ACCESS DENIED ❌</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-red-200 mt-4 text-left">
            <p className="text-gray-500 text-sm mb-1">You are logged in as:</p>
            <code className="block bg-black text-green-400 p-2 rounded text-lg font-mono mb-4">
                {currentUserEmail}
            </code>

            <p className="text-gray-500 text-sm mb-1">But Admin Email in code is:</p>
            <code className="block bg-gray-200 text-gray-700 p-2 rounded text-lg font-mono">
                {ADMIN_EMAIL}
            </code>
        </div>

        <p className="mt-6 text-gray-600 max-w-md">
            <b>Fix It:</b> Copy the email from the <b>Black Box</b> above and paste it into <code>app/admin/page.tsx</code> at line number 8.
        </p>

        <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} className="mt-8 flex items-center gap-2 text-red-600 font-bold hover:underline">
            <LogOut size={16}/> Logout & Try Different Account
        </button>
      </div>
    );
  }

  // --- ✅ REAL ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">🛡️ Admin Dashboard</h1>
      
      {listings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center shadow">
            <p className="text-xl">No pending listings! 😴</p>
            <p className="text-gray-400">Post a new room to test.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((room) => (
            <div key={room.id} className="bg-white p-6 rounded-xl shadow flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{room.title}</h3>
                <p className="text-sm text-gray-500">{room.city} • Owner: {room.owner_name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(room.id, 'rejected')} className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"><X/></button>
                <button onClick={() => handleAction(room.id, 'approved')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold flex gap-2"><Check/> Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}