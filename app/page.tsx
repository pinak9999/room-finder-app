"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  PlusCircle, Loader2, MapPin, Search, CheckCircle, 
  XCircle, Trash2, List, Heart, Languages, Home as HomeIcon
} from "lucide-react";
import { useLanguage } from "./context/LanguageContext"; 

const CITIES = ["Jaipur", "Kota", "Jodhpur", "Udaipur", "Ajmer", "Bikaner", "Sikar", "Alwar"];

export default function Home() {
  const ADMIN_EMAIL = "davepinak0@gmail.com"; 
  
  // 🔥 LANGUAGE HOOK
  const { t, lang, toggleLanguage } = useLanguage();

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'pending'>('live');

  // Filters
  const [searchCity, setSearchCity] = useState("All Rajasthan");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("any");

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const isUserAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      setIsAdmin(isUserAdmin);
      if(isUserAdmin) setActiveTab('pending'); 

      let query = supabase.from('listings').select('*').neq('admin_status', 'rented').order('created_at', { ascending: false });
      if (!isUserAdmin) query = query.eq('admin_status', 'approved');
      
      const { data } = await query;
      if (data) setListings(data);

      if (user) {
        const { data: savedData } = await supabase.from('saved_listings').select('listing_id').eq('user_id', user.id);
        if (savedData) setSavedIds(savedData.map(item => item.listing_id));
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  // --- UI HELPER FUNCTIONS ---

  const addRipple = (e: any) => {
    const btn = e.currentTarget;
    const ripple = document.createElement("span");
    const size = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.background = "rgba(255,255,255,0.35)";
    ripple.style.transform = "scale(0)";
    ripple.style.animation = "rippleAnim 0.6s linear";
    ripple.style.pointerEvents = "none";
    btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const showToast = (message: string, color = "#4f46e5") => {
    const toast = document.createElement("div");
    toast.innerText = message;
    Object.assign(toast.style, {
      position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
      padding: "12px 20px", background: color, color: "white", borderRadius: "10px",
      fontWeight: "700", fontSize: "14px", boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
      opacity: "0", transition: "opacity .35s ease", zIndex: "99999"
    });
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = "1"), 50);
    setTimeout(() => (toast.style.opacity = "0"), 2000);
    setTimeout(() => toast.remove(), 2500);
  };

  const confirmDelete = () => {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: "9999"
      });
      const box = document.createElement("div");
      Object.assign(box.style, {
        width: "320px", background: "#fff", padding: "24px", borderRadius: "18px",
        textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.25)", animation: "popIn .25s ease"
      });
      box.innerHTML = `
        <h2 style="font-size:18px;font-weight:800;margin-bottom:10px;color:#1e293b">Delete Listing?</h2>
        <p style="font-size:14px;color:#64748b;margin-bottom:20px;">This action cannot be undone.</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="deleteYes" style="background:#ef4444;color:white;padding:10px 16px;border:none;border-radius:10px;font-weight:700;cursor:pointer;">Delete</button>
          <button id="deleteNo" style="background:#e2e8f0;color:#1e293b;padding:10px 16px;border:none;border-radius:10px;font-weight:700;cursor:pointer;">Cancel</button>
        </div>
      `;
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      box.querySelector("#deleteYes")?.addEventListener("click", () => { overlay.remove(); resolve(true); });
      box.querySelector("#deleteNo")?.addEventListener("click", () => { overlay.remove(); resolve(false); });
    });
  };

  // --- ACTIONS ---

  const toggleSave = async (e: any, roomId: number) => {
    e.preventDefault();
    addRipple(e);
    if (!user) return router.push("/login");
    
    if (savedIds.includes(roomId)) {
        await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', roomId);
        setSavedIds(prev => prev.filter(id => id !== roomId));
    } else {
        await supabase.from('saved_listings').insert([{ user_id: user.id, listing_id: roomId }]);
        setSavedIds(prev => [...prev, roomId]);
        showToast("Added to Saved", "#ec4899");
    }
  };

  const handleAdminAction = async (e: any, id: number, status: string) => {
    e.preventDefault();
    addRipple(e);
    const { error } = await supabase.from('listings').update({ admin_status: status, is_active: status === 'approved' }).eq('id', id);
    if (!error) {
        setListings(prev => prev.map(item => item.id === id ? { ...item, admin_status: status } : item));
        showToast(status === "approved" ? "Approved Successfully" : "Listing Rejected", status === "approved" ? "#059669" : "#dc2626");
    }
  };

  const handleDelete = async (e: any, id: number) => {
    e.preventDefault();
    const ok = await confirmDelete();
    if (!ok) return;

    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) {
        setListings(prev => prev.filter(item => item.id !== id));
        showToast("Listing Deleted", "#dc2626");
    }
  };

  const displayListings = listings.filter((room) => {
    if (isAdmin) {
        if (activeTab === 'pending' && room.admin_status !== 'pending') return false;
        if (activeTab === 'live' && room.admin_status !== 'approved') return false;
    }
    const matchCity = searchCity === "All Rajasthan" || room.city === searchCity;
    const matchText = room.address?.toLowerCase().includes(searchTerm.toLowerCase()) || room.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGender = filterGender === "any" || room.gender_pref === filterGender;
    return matchCity && matchText && matchGender;
  });

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: "#f8fafc" }}>
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "100px" }}>
      
      <style jsx global>{`
        * { scroll-behavior: smooth; }
        @keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }
        @keyframes popIn { 0% { transform: scale(.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        section, nav { animation: fadeSlideUp .6s ease; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.scrollTo(0, 0)}>
            <div style={{ background: "#6366f1", padding: "10px", borderRadius: "12px", color: "white", fontSize: "20px", boxShadow: "0 8px 16px rgba(99,102,241,0.3)", transition: ".25s" }}>🏠</div>
            <h1 style={{ fontSize: "22px", fontWeight: 900, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", color: "transparent", letterSpacing: "-0.5px" }}>RoomFinder</h1>
            {isAdmin && <span style={{ marginLeft: "4px", background: "linear-gradient(90deg,#ef4444,#f43f5e)", color: "white", fontSize: "10px", padding: "3px 8px", borderRadius: "6px", fontWeight: 700 }}>ADMIN</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* POST BUTTON IN NAVBAR (Desktop) - Clearly for listing */}
            <Link href={user ? "/create-listing" : "/login"} className="hidden md:block">
               <button style={{ padding: "10px 20px", background: "#1e293b", color: "white", borderRadius: "12px", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(30,41,59,0.2)" }}>
                 <PlusCircle size={16} /> {t.nav?.post}
               </button>
            </Link>

            <button onClick={toggleLanguage} style={{ padding: "10px 14px", background: "#eef2ff", color: "#4338ca", fontWeight: 700, borderRadius: "10px", fontSize: "13px", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <Languages size={16} /> {lang === "en" ? "हिन्दी" : "English"}
            </button>

            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Link href="/saved">
                  <button style={{ position: "relative", padding: "10px", background: "white", borderRadius: "50%", border: "1px solid #e5e7eb", cursor: "pointer", color: savedIds.length > 0 ? "#ef4444" : "#6b7280" }}>
                    <Heart size={20} />
                    {savedIds.length > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", borderRadius: "50%", border: "2px solid white" }}>{savedIds.length}</span>}
                  </button>
                </Link>
                <Link href="/my-listings" className="hidden md:block">
                  <button style={{ padding: "10px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", fontWeight: 700, fontSize: "13px", color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <List size={16} /> {t.nav?.myListings}
                  </button>
                </Link>
                <button onClick={handleLogout} style={{ color: "#ef4444", fontWeight: 700, fontSize: "13px", cursor: "pointer", background: "transparent", border: "none" }}>{t.nav?.logout}</button>
              </div>
            ) : (
              <Link href="/login">
                <button style={{ padding: "10px 20px", background: "linear-gradient(90deg,#4f46e5,#7c3aed)", color: "white", borderRadius: "12px", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 16px rgba(79,70,229,.35)" }}>{t.nav?.login}</button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO & FILTERS */}
      <section style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "50px 0 40px", position: "relative", overflow: "hidden" }}>
        {/* Background Blobs */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", background: "#c7d2fe", borderRadius: "50%", filter: "blur(90px)", opacity: 0.4 }}></div>
        <div style={{ position: "absolute", bottom: "-60px", right: "-40px", width: "300px", height: "300px", background: "#e9d5ff", borderRadius: "50%", filter: "blur(90px)", opacity: 0.45 }}></div>

        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 10 }}>
          
          {/* Main Title */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
             <h2 style={{ fontSize: "32px", fontWeight: "900", color: "#1e293b", marginBottom: "10px", letterSpacing: "-1px" }}>
               {t.hero?.title || "Find Your Perfect Room"}
             </h2>
             <p style={{ color: "#64748b", fontSize: "16px" }}>Search affordable rooms, flats & hostels across Rajasthan</p>
          </div>

          {/* SEARCH BOX - NO POST BUTTON HERE */}
          <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", padding: "24px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} className="md:flex-row">
              {/* City */}
              <div style={{ position: "relative", minWidth: "180px" }}>
                 <MapPin size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}/>
                 <select value={searchCity} onChange={(e) => setSearchCity(e.target.value)} style={{ width: "100%", padding: "16px 16px 16px 40px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", fontWeight: 700, color: "#1e293b", outline: "none", cursor: "pointer", appearance: "none" }}>
                   <option value="All Rajasthan">{t.filters?.allCities}</option>
                   {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              {/* Search Text */}
              <div style={{ position: "relative", flexGrow: 1 }}>
                 <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}/>
                 <input type="text" placeholder={t.hero?.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "16px 16px 16px 44px", borderRadius: "16px", background: "#f8fafc", outline: "none", fontSize: "15px", border: "1px solid #e2e8f0", fontWeight: 500 }} />
              </div>

              {/* Gender */}
              <div style={{ position: "relative", minWidth: "160px" }}>
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} style={{ width: "100%", padding: "16px", borderRadius: "16px", background: "#f8fafc", fontWeight: 700, outline: "none", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                  <option value="any">👫 {t.filters?.any}</option>
                  <option value="boys">👨 {t.filters?.boys}</option>
                  <option value="girls">👩 {t.filters?.girls}</option>
                  <option value="family">👪 {t.filters?.family}</option>
                </select>
              </div>
            </div>
            
            {/* Helper Text instead of button */}
            <div style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginTop: "-4px" }}>
               ⚡ Results update automatically as you type
            </div>
          </div>

          {/* LANDLORD CTA - SEPARATE SECTION */}
          <div style={{ marginTop: "40px", textAlign: "center", display: "flex", justifyContent: "center" }}>
             <Link href={user ? "/create-listing" : "/login"} style={{ textDecoration: "none" }}>
                <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #fefce8 100%)", padding: "12px 24px", borderRadius: "50px", border: "1px solid #dbeafe", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", transition: "transform .2s", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                     onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                     onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                    <div style={{ background: "#4f46e5", padding: "8px", borderRadius: "50%", color: "white", display: "flex" }}><HomeIcon size={16}/></div>
                    <div style={{ textAlign: "left" }}>
                       <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Are you a Landlord?</span>
                       <span style={{ display: "block", fontSize: "14px", color: "#1e293b", fontWeight: 800 }}>Post Your Room for FREE &rarr;</span>
                    </div>
                </div>
             </Link>
          </div>

          {/* Admin Tabs */}
          {isAdmin && (
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "30px" }}>
              <button onClick={() => setActiveTab("pending")} style={{ padding: "8px 24px", borderRadius: "20px", fontWeight: 700, background: activeTab === "pending" ? "#f97316" : "rgba(0,0,0,0.06)", color: activeTab === "pending" ? "white" : "#6b7280", border: "none", cursor: "pointer", fontSize: "13px" }}>⏳ {t.status?.pending}</button>
              <button onClick={() => setActiveTab("live")} style={{ padding: "8px 24px", borderRadius: "20px", fontWeight: 700, background: activeTab === "live" ? "#059669" : "rgba(0,0,0,0.06)", color: activeTab === "live" ? "white" : "#6b7280", border: "none", cursor: "pointer", fontSize: "13px" }}>✅ {t.status?.live}</button>
            </div>
          )}

        </div>
      </section>

      {/* LISTINGS GRID */}
      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" }}>
          <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>
            {isAdmin && activeTab === "pending" ? t.status?.pending : t.hero?.title}
            <span style={{ marginLeft: "10px", background: "#e2e8f0", padding: "4px 10px", borderRadius: "20px", fontSize: "14px", color: "#475569", fontWeight: 700, verticalAlign: "middle" }}>{displayListings.length}</span>
          </h3>
        </div>

        {displayListings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", background: "white", borderRadius: "24px", border: "2px dashed #cbd5e1" }}>
            <div style={{ fontSize: "50px", marginBottom: "16px", opacity: 0.8 }}>🏠</div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#334155" }}>No rooms found</h3>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>Try changing your filters.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {displayListings.map((room) => (
              <div key={room.id} style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
                
                {/* Delete Button */}
                {isAdmin && (
                  <button onClick={(e) => handleDelete(e, room.id)} style={{ position: "absolute", top: "-10px", right: "-10px", background: "#ef4444", color: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", boxShadow: "0 4px 12px rgba(239,68,68,0.3)", cursor: "pointer", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={16} />
                  </button>
                )}

                <Link href={`/listing/${room.id}`} style={{ textDecoration: "none", color: "inherit", flexGrow: 1, display: "block" }}>
                  <div style={{ cursor: "pointer", background: "white", borderRadius: "20px", overflow: "hidden", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", height: "100%", transition: "transform .3s, box-shadow .3s", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
                       onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1)"; }}
                       onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)"; }}>
                    
                    <button onClick={(e) => toggleSave(e, room.id)} style={{ position: "absolute", top: "12px", right: "12px", padding: "8px", background: "rgba(255,255,255,0.9)", borderRadius: "50%", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", zIndex: 11 }}>
                      <Heart size={18} className={savedIds.includes(room.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                    </button>

                    <div style={{ position: "relative", height: "180px", width: "100%", overflow: "hidden", background: "#f1f5f9" }}>
                      <img src={room.images?.[0]} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")} />
                      
                      <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(255,255,255,0.95)", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center" }}>
                        <MapPin size={10} style={{ marginRight: 4 }} /> {room.city}
                      </div>

                      <div style={{ position: "absolute", top: "10px", left: "10px", background: room.gender_pref === "girls" ? "#fce7f3" : room.gender_pref === "boys" ? "#dbeafe" : "#ede9fe", color: room.gender_pref === "girls" ? "#db2777" : room.gender_pref === "boys" ? "#1d4ed8" : "#6d28d9", fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "8px", textTransform: "uppercase" }}>
                        {room.gender_pref}
                      </div>
                    </div>

                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.title}</h3>
                      <p style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.address}</p>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Rent / Month</div>
                          <div style={{ color: "#059669", fontSize: "18px", fontWeight: 800 }}>₹{room.price}</div>
                        </div>
                        <div style={{ background: "#f1f5f9", color: "#475569", padding: "8px 12px", borderRadius: "10px", fontWeight: 700, fontSize: "12px" }}>View →</div>
                      </div>
                    </div>
                  </div>
                </Link>

                {isAdmin && activeTab === "pending" && (
                  <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <button onClick={(e) => handleAdminAction(e, room.id, "approved")} style={{ background: "#10b981", color: "white", padding: "10px", borderRadius: "10px", fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px" }}><CheckCircle size={14} /> Approve</button>
                    <button onClick={(e) => handleAdminAction(e, room.id, "rejected")} style={{ background: "white", color: "#dc2626", padding: "10px", borderRadius: "10px", border: "1px solid #fecaca", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px" }}><XCircle size={14} /> Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FLOATING ACTION BUTTONS */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ position: "fixed", bottom: "90px", right: "20px", zIndex: 90, background: "white", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontSize: "20px", fontWeight: 900, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", cursor: "pointer", border: "1px solid #e2e8f0" }}>↑</button>

      {/* BOTTOM GLASS FOOTER */}
      <footer style={{ position: "fixed", bottom: 0, left: 0, width: "100%", padding: "12px 20px", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 99 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>❤️ Made in Rajasthan</span>
        <Link href="/create-listing">
          <button style={{ background: "#1e293b", color: "white", padding: "10px 16px", borderRadius: "50px", border: "none", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 12px rgba(30,41,59,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <PlusCircle size={16}/> Post Room
          </button>
        </Link>
      </footer>
    </main>
  );
}