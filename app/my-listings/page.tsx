"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Trash2, EyeOff, Edit, ArrowLeft } from "lucide-react";

export default function MyListings() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      if (data) setListings(data);
      setLoading(false);
    };

    fetchMyListings();
  }, [router]);

  const handleDelete = async (id: number) => {
    if (!confirm("⚠️ Are you sure? This will delete the room permanently.")) return;

    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (!error) {
      setListings((prev) => prev.filter((item) => item.id !== id));
      alert("🗑️ Room Deleted Successfully!");
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleMarkRented = async (id: number) => {
    if (!confirm("🎉 Room bhar gaya? Marking as 'Rented' will hide it from search.")) return;

    const { error } = await supabase
      .from("listings")
      .update({ admin_status: 'rented' }) 
      .eq("id", id);

    if (!error) {
      setListings((prev) => prev.map((item) =>
        item.id === id ? { ...item, admin_status: 'rented' } : item
      ));
      alert("✅ Marked as Rented! Calls aana band ho jayenge.");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc" }}>
        <Loader2 className="animate-spin text-blue-600" style={{ width: "48px", height: "48px", color: "#2563eb" }} />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-10" style={{ minHeight: "100vh", paddingBottom: "30px", background: "#f8fafc" }}>
      
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", borderBottom: "1px solid #e5e7eb", padding: "16px 20px", display: "flex", gap: "14px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
        <Link href="/" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200" style={{ padding: "8px", background: "#f3f4f6", borderRadius: "50%" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-800" style={{ fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>
          My Listings ({listings.length})
        </h1>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8" style={{ maxWidth: "850px", margin: "0 auto", padding: "22px" }}>
        {listings.length === 0 ? (
          <div className="text-center py-20" style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="text-gray-500 mb-4" style={{ color: "#6b7280", fontSize: "17px", marginBottom: "14px" }}>
              You haven't posted any rooms yet.
            </p>
            <Link href="/create-listing">
              <button className="bg-black text-white px-6 py-3 rounded-xl font-bold" style={{ background: "#2563eb", padding: "10px 22px", borderRadius: "12px", fontWeight: 700, color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.2)" }}>
                Post Your First Room
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {listings.map((room) => (
              <div key={room.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6"
                style={{ background: "white", padding: "20px", borderRadius: "18px", border: "1px solid #e5e7eb", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", flexDirection: "row", gap: "20px" }}>
                
                {/* Image */}
                <div className="w-full md:w-48 h-48 bg-gray-100 rounded-xl overflow-hidden relative shrink-0"
                  style={{ width: "170px", height: "170px", borderRadius: "14px", overflow: "hidden", background: "#f3f4f6", position: "relative" }}>
                  <img src={room.images?.[0]} className="w-full h-full object-cover opacity-90" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  
                  {/* Status Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase`}
                    style={{ position: "absolute", top: "10px", left: "10px", padding: "4px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "10px", color: room.admin_status === "rented" ? "#fff" : room.admin_status === "approved" ? "#065f46" : "#92400e", background: room.admin_status === "rented" ? "#1f2937" : room.admin_status === "approved" ? "#d1fae5" : "#fef3c7" }}>
                    {room.admin_status === "rented" ? "SOLD OUT" : room.admin_status}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow" style={{ flexGrow: 1 }}>
                  <div className="flex justify-between items-start mb-2" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800" style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>{room.title}</h3>
                      <p className="text-gray-500 flex items-center gap-1 text-sm mt-1" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
                        <MapPin size={14} /> {room.city}
                      </p>
                    </div>
                    <span className="text-green-600 font-bold text-lg" style={{ color: "#059669", fontWeight: 700, fontSize: "18px" }}>₹{room.price}</span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-6 bg-gray-50 p-2 rounded" style={{ background: "#f9fafb", padding: "8px", borderRadius: "8px", color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>
                    {room.description?.substring(0, 80)}...
                  </p>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-3 flex-wrap" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    
                    {/* ✏️ EDIT BUTTON (NEW) */}
                    <Link href={`/edit-listing/${room.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ width: "100%", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <Edit size={16}/> Edit
                        </button>
                    </Link>

                    {/* Mark Rented Button */}
                    {room.admin_status !== "rented" && (
                      <button onClick={() => handleMarkRented(room.id)} 
                        style={{ flex: 1, background: "rgba(59,130,246,0.1)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.3)", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <EyeOff size={16} /> Mark Rented
                      </button>
                    )}

                    {/* Delete Button */}
                    <button onClick={() => handleDelete(room.id)} 
                        style={{ flex: 1, background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)", padding: "10px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}