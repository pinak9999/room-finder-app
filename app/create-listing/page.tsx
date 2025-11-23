"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, CloudUpload, Lock, Mic, Languages } from "lucide-react";

const CITIES = ["Jaipur", "Kota", "Jodhpur", "Udaipur", "Ajmer", "Bikaner", "Sikar", "Alwar", "Bhilwara", "Other"];

// --- 🗣️ LANGUAGE DICTIONARY (Hindi vs English) ---
const TRANSLATIONS = {
  en: {
    title: "Post Your Room",
    fee: "Fee",
    labelTitle: "Title (e.g. Room near Allen)",
    labelRent: "Rent (₹)",
    labelCity: "City",
    labelAddress: "Full Address / Area",
    labelName: "Your Name",
    labelPhone: "Phone Number",
    labelDesc: "Description (Bolkar likhein)",
    btnPay: "Pay ₹100 & Submit",
    upload: "Upload Room Photo",
    mic: "Tap to Speak",
    listening: "Listening...",
    ai: "AI Write",
    gender: "Gender",
    ac: "AC Type",
    type: "Room Type"
  },
  hi: {
    title: "अपना रूम किराये पर दें",
    fee: "फीस",
    labelTitle: "टाइटल (जैसे: Allen के पास रूम)",
    labelRent: "किराया (₹)",
    labelCity: "शहर",
    labelAddress: "पूरा पता / मोहल्ला",
    labelName: "आपका नाम",
    labelPhone: "मोबाइल नंबर",
    labelDesc: "विवरण (माइक दबाकर बोलें)",
    btnPay: "₹100 दें और जमा करें",
    upload: "रूम की फोटो डालें",
    mic: "बोलने के लिए दबाएं",
    listening: "सुन रहा हूँ...",
    ai: "ऑटो-लिखें",
    gender: "किसके लिए?",
    ac: "AC है या नहीं?",
    type: "रूम कैसा है?"
  }
};

export default function CreateListing() {
  const router = useRouter();
  
  // States
  const [lang, setLang] = useState<'en' | 'hi'>('en'); // Default English
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form Data
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("Jaipur");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  
  const [gender, setGender] = useState("any");
  const [acType, setAcType] = useState("non-ac");
  const [roomType, setRoomType] = useState("single");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Current Language Text
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
      else setUser(session.user);
    };
    getUser();
  }, [router]);

  // --- 🎤 VOICE TYPING LOGIC (Jaadu) ---
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'; // Hindi me bole to Hindi likhe
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDesc((prev) => prev + " " + transcript); // Purane text me jod do
        setIsListening(false);
      };

      recognition.onerror = () => {
        alert("Microphone Access Denied or Error.");
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Sorry, Voice typing is not supported in this browser. Use Chrome.");
    }
  };

  const handleGenerateAI = async () => {
    if (!title || !city || !price) return alert("Fill Title, City, Price first!");
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-desc", {
        method: "POST", body: JSON.stringify({ keywords: `${title}, ${city}, ₹${price}` })
      });
      const data = await res.json();
      if (data.output) setDesc(data.output);
    } catch (err) { console.error(err); } 
    finally { setAiLoading(false); }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('room-images').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('room-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { return null; } 
    finally { setUploading(false); }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!imageFile) return alert("Please upload an image first.");
    setLoading(true);

    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) return alert("Payment Gateway failed");

      const res = await fetch("/api/create-order", {
        method: "POST", body: JSON.stringify({ amount: 100 }), 
      });
      const { orderId } = await res.json();

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 10000,
        currency: "INR",
        name: "Room Listing Fee",
        description: "Pay ₹100 to submit",
        order_id: orderId,
        handler: async function (response: any) {
            const imageUrl = await handleImageUpload(imageFile);
            if (!imageUrl) return alert("Image upload failed.");

            await supabase.from("listings").insert([{
                owner_id: user.id, title, description: desc, price: Number(price), 
                city, contact_phone: phone, owner_name: ownerName, address,
                gender_pref: gender, ac_type: acType, room_type: roomType,
                images: [imageUrl], admin_status: 'pending', is_active: false
            }]);

            alert(lang === 'hi' ? "सफल! आपका रूम एडमिन को भेज दिया गया है।" : "Success! Room sent for approval.");
            router.push("/");
        },
        prefill: { email: user.email, contact: phone },
        theme: { color: "#000000" },
      });
      rzp.open();
    } catch (error: any) { alert("Error: " + error.message); } 
    finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 p-4 md:p-6 flex justify-center items-center"
      style={{
        minHeight: "100vh",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg,#eef2ff 0%, #ffffff 60%)",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      }}
    >
      <div
        className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-6 md:p-8"
        style={{
          width: "100%",
          maxWidth: "760px",
          borderRadius: "18px",
          padding: "24px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,255,0.98))",
          boxShadow: "0 20px 50px rgba(9,30,66,0.08)",
          border: "1px solid rgba(37,99,235,0.06)",
          transition: "transform .18s ease, box-shadow .18s ease",
        }}
      >
        
        {/* Header & Language Toggle */}
        <div
          className="flex justify-between items-start mb-6"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            gap: "12px",
          }}
        >
            <div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-gray-800 mb-1"
                  style={{
                    fontSize: "24px",
                    lineHeight: 1.05,
                    marginBottom: "6px",
                    color: "#0f172a",
                    fontWeight: 800,
                  }}
                >
                  {t.title}
                </h2>
                <span
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-200"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(90deg,#ecfdf5,#f0fff4)",
                    color: "#065f46",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: 800,
                    border: "1px solid rgba(16,185,129,0.12)",
                    boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)",
                  }}
                >
                    {t.fee}: ₹100
                </span>
            </div>
            
            {/* 🗣️ LANGUAGE TOGGLE BUTTON */}
            <button
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition border border-blue-200"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  background: "linear-gradient(90deg, rgba(99,102,241,0.06), rgba(59,130,246,0.03))",
                  color: "#1e3a8a",
                  fontWeight: 800,
                  border: "1px solid rgba(99,102,241,0.12)",
                  cursor: "pointer",
                  boxShadow: "0 6px 18px rgba(37,99,235,0.06)",
                }}
            >
                <Languages size={18} />
                <span style={{ fontSize: "13px" }}>{lang === 'en' ? 'हिंदी में देखें' : 'English Mode'}</span>
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6" style={{ display: "block" }}>
          <div className="grid grid-cols-2 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.labelTitle}</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg w-full bg-gray-50"
                  value={title}
                  onChange={e=>setTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#fbfdff",
                    outline: "none",
                    boxShadow: "inset 0 -1px 0 rgba(2,6,23,0.02)",
                    fontSize: "14px",
                  }}
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.labelRent}</label>
                <input
                  type="number"
                  className="p-3 border rounded-lg w-full bg-gray-50"
                  value={price}
                  onChange={e=>setPrice(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#fbfdff",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.labelCity}</label>
                <select
                  className="p-3 border rounded-lg w-full bg-white"
                  value={city}
                  onChange={e=>setCity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                    {CITIES.map(c => <option key={c} value={c} style={{ padding: "6px" }}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.labelAddress}</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg w-full bg-gray-50"
                  value={address}
                  onChange={e=>setAddress(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#fbfdff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.gender}</label>
                <select
                  className="p-3 border rounded-lg w-full bg-white text-sm"
                  value={gender}
                  onChange={e=>setGender(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                    <option value="any">Any</option><option value="boys">Boys</option><option value="girls">Girls</option><option value="family">Family</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.ac}</label>
                <select
                  className="p-3 border rounded-lg w-full bg-white text-sm"
                  value={acType}
                  onChange={e=>setAcType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                    <option value="non-ac">Non-AC</option><option value="ac">AC</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.type}</label>
                <select
                  className="p-3 border rounded-lg w-full bg-white text-sm"
                  value={roomType}
                  onChange={e=>setRoomType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                    <option value="single">Single</option><option value="double">Double</option><option value="shared">Shared</option>
                </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
             <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.upload}</label>
             <div
               className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center relative hover:bg-gray-50"
               style={{
                 borderRadius: "14px",
                 border: "1.5px dashed rgba(15,23,42,0.06)",
                 padding: "16px",
                 position: "relative",
                 textAlign: "center",
                 background: "linear-gradient(180deg, rgba(250,250,255,0.6), rgba(245,249,255,0.6))",
                 cursor: "pointer",
               }}
             >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <CloudUpload className="text-blue-500 mb-2" size={30} />
                    <p className="text-sm font-bold text-gray-700" style={{ fontWeight: 800, color: "#0f172a" }}>{imageFile ? imageFile.name : t.upload}</p>
                    <p style={{ marginTop: "6px", color: "#6b7280", fontSize: "12px" }}>{uploading ? "Uploading..." : "PNG / JPG — Recommended 4:3"}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.labelName}</label>
                <input
                  type="text"
                  className="p-3 border rounded-lg w-full bg-gray-50"
                  value={ownerName}
                  onChange={e=>setOwnerName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#fbfdff",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1" style={{ display: "block", marginBottom: "6px", color: "#6b7280", fontWeight: 700, fontSize: "12px" }}>{t.labelPhone}</label>
                <input
                  type="tel"
                  className="p-3 border rounded-lg w-full bg-gray-50"
                  value={phone}
                  onChange={e=>setPhone(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(15,23,42,0.06)",
                    background: "#fbfdff",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
             </div>
          </div>

          {/* 🗣️ VOICE DESCRIPTION */}
          <div className="relative" style={{ position: "relative" }}>
             <div className="flex justify-between items-center mb-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="block text-sm font-bold text-gray-700" style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{t.labelDesc}</label>
                
                <div className="flex gap-2" style={{ display: "flex", gap: "8px" }}>
                    {/* AI Button */}
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex items-center gap-1"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        fontWeight: 800,
                        background: "linear-gradient(90deg, rgba(168,85,247,0.08), rgba(124,58,237,0.04))",
                        color: "#6d28d9",
                        border: "1px solid rgba(124,58,237,0.08)",
                        cursor: aiLoading ? "not-allowed" : "pointer",
                      }}
                    >
                        {aiLoading ? "..." : <><Sparkles size={12}/> {t.ai}</>}
                    </button>

                    {/* 🎤 MIC BUTTON */}
                    <button
                        type="button"
                        onClick={startListening}
                        className={`text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1 transition
                            ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}
                        `}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "999px",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: isListening ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg, rgba(59,130,246,0.06), rgba(99,102,241,0.03))",
                          color: isListening ? "#fff" : "#1e40af",
                          border: "1px solid rgba(15,23,42,0.04)",
                          boxShadow: isListening ? "0 8px 22px rgba(239,68,68,0.12)" : "0 6px 18px rgba(37,99,235,0.06)",
                        }}
                    >
                        <Mic size={14} />
                        <span style={{ fontSize: "13px" }}>{isListening ? t.listening : t.mic}</span>
                    </button>
                </div>
            </div>
            <textarea
              rows={4}
              className="p-3 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={desc}
              onChange={e=>setDesc(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid rgba(15,23,42,0.06)",
                background: "#fbfdff",
                fontSize: "15px",
                minHeight: "110px",
                outline: "none",
                resize: "vertical",
                boxShadow: "inset 0 -1px 0 rgba(2,6,23,0.02)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition flex justify-center items-center gap-2 shadow-lg text-lg"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 900,
              fontSize: "16px",
              color: "#fff",
              background: "linear-gradient(90deg,#6a11cb,#2575fc)",
              boxShadow: "0 12px 30px rgba(37,99,235,0.18)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Lock size={18} /> {t.btnPay}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
