"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, ArrowLeft, CloudUpload, X, MapPin } from "lucide-react";

const CITIES = ["Jaipur", "Kota", "Jodhpur", "Udaipur", "Ajmer", "Bikaner", "Sikar", "Alwar", "Other"];

export default function EditListing() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [desc, setDesc] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // 📍 GPS Location States (Naya Feature)
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data, error } = await supabase.from("listings").select("*").eq("id", id).single();
      
      if (error) {
        alert("Error fetching listing");
        router.push("/my-listings");
        return;
      }

      if (data.owner_id !== user.id) {
        alert("Unauthorized");
        router.push("/");
        return;
      }

      // Data Set Karo
      setTitle(data.title);
      setPrice(data.price);
      setCity(data.city);
      setAddress(data.address);
      setDesc(data.description);
      setPhone(data.contact_phone || "");
      setOwnerName(data.owner_name || "");
      setExistingImages(data.images || []);
      
      // 📍 Existing GPS Set Karo
      setLat(data.latitude);
      setLng(data.longitude);
      
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  // --- 📍 GET NEW LOCATION FUNCTION ---
  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    setLocationStatus("Fetching...");
    navigator.geolocation.getCurrentPosition(
        (position) => {
            setLat(position.coords.latitude);
            setLng(position.coords.longitude);
            setLocationStatus("✅ New Location Set!");
        },
        () => {
            setLocationStatus("❌ Permission Denied");
            alert("Please allow location access to update map position.");
        }
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("listings").update({
        title, description: desc, price: Number(price),
        city, address, contact_phone: phone, owner_name: ownerName, 
        images: existingImages,
        // 👇 GPS Update Bhejo
        latitude: lat,
        longitude: lng
    }).eq('id', id);

    if (!error) {
        alert("✅ Updated Successfully!");
        router.push("/my-listings");
    } else {
        alert("Error: " + error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-8">
        
        <div className="flex items-center gap-4 mb-6 border-b pb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft/></button>
            <h2 className="text-2xl font-bold text-gray-800">✏️ Edit Listing</h2>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input type="text" className="p-3 border rounded-lg w-full" value={title} onChange={e=>setTitle(e.target.value)} required />
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                <select className="p-3 border rounded-lg w-full bg-white" value={city} onChange={e=>setCity(e.target.value)}>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
             </div>
          </div>
          
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
             <input type="text" className="p-3 border rounded-lg w-full" value={address} onChange={e=>setAddress(e.target.value)} required />
          </div>

          {/* 📍 MAP LOCATION UPDATE SECTION (NEW) */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
             <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-blue-900 flex items-center gap-2">
                    <MapPin size={16}/> Map Location (GPS)
                </label>
                {lat && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Saved</span>}
             </div>
             
             <div className="flex flex-col gap-3">
                 <p className="text-xs text-gray-600">
                    Current: {lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : "Not set (Using Address)"}
                 </p>
                 <button 
                    type="button" 
                    onClick={handleUpdateLocation} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                 >
                    <MapPin size={16}/> {locationStatus || "Update to Current Location"}
                 </button>
                 <p className="text-[10px] text-gray-500">
                    *Stand at the property and click this button to fix map issues.
                 </p>
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Rent (₹)</label>
             <input type="number" className="p-3 border rounded-lg w-full" value={price} onChange={e=>setPrice(e.target.value)} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Owner Name</label>
                <input type="text" className="p-3 border rounded-lg w-full bg-white" value={ownerName} onChange={e=>setOwnerName(e.target.value)} required />
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input type="tel" className="p-3 border rounded-lg w-full bg-white" value={phone} onChange={e=>setPhone(e.target.value)} required />
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Photos</label>
             <div className="flex gap-2 overflow-x-auto pb-2">
                {existingImages.map((img, i) => (
                    <img key={i} src={img} className="w-20 h-20 rounded object-cover border"/>
                ))}
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
             <textarea rows={3} className="p-3 border rounded-lg w-full" value={desc} onChange={e=>setDesc(e.target.value)} required />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2">
            {saving ? <Loader2 className="animate-spin"/> : <><Save size={18}/> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}