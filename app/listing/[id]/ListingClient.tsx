"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, ArrowLeft, Phone, User, MessageCircle, Map as MapIcon, Lock, Share2, Navigation, ExternalLink } from "lucide-react";

export default function ListingClient({ id }: { id: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Distance States
  const [customLocation, setCustomLocation] = useState("");
  const [customDistance, setCustomDistance] = useState<string | null>(null);
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [googleFallback, setGoogleFallback] = useState(false); // 🆕 Fallback state

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      if (!id) return;
      const { data: roomData } = await supabase.from("listings").select("*").eq("id", id).single();
      setRoom(roomData);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleLoginRedirect = () => router.push("/login");

  const handleShare = () => {
    const text = `Check this room in ${room.city} for ₹${room.price}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`, '_blank');
  };

  // --- 📏 MATH FORMULA ---
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  // --- 📍 HYBRID DISTANCE CHECKER ---
  // --- 📍 SUPER INTELLIGENT SEARCH ---
  const checkDistance = async () => {
    if (!customLocation) return alert("Please enter a location name");
    
    setCheckingDistance(true);
    setCustomDistance(null);
    setGoogleFallback(false);

    try {
        // 1. GET ROOM COORDINATES
        let roomLat = room.latitude;
        let roomLng = room.longitude;

        if (!roomLat || !roomLng) {
            // Fallback: Address se Lat/Lng nikalo
            const addressQuery = `${room.address}, ${room.city}`;
            const roomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`, { headers: { 'User-Agent': 'RoomFinder/1.0' } });
            const roomData = await roomRes.json();

            if (roomData && roomData.length > 0) {
                roomLat = parseFloat(roomData[0].lat);
                roomLng = parseFloat(roomData[0].lon);
            } else {
                // Fallback: City Center
                const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(room.city)}`, { headers: { 'User-Agent': 'RoomFinder/1.0' } });
                const cityData = await cityRes.json();
                if(cityData.length > 0) {
                    roomLat = parseFloat(cityData[0].lat);
                    roomLng = parseFloat(cityData[0].lon);
                } else {
                    setGoogleFallback(true);
                    setCheckingDistance(false);
                    return;
                }
            }
        }

        // 2. FIND USER TARGET (3 Attempts)
        let targetLat = null;
        let targetLng = null;

        // Queries to try
        const queries = [
            `${customLocation}, ${room.city}`,       // Attempt 1: Exact + City
            customLocation,                          // Attempt 2: Only Name
            customLocation.replace(/the/gi, "").trim() // Attempt 3: Remove 'The' (Fashion Hub)
        ];

        for (const query of queries) {
            if (!query) continue;
            console.log("Trying search:", query);
            
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
                headers: { 'User-Agent': 'RoomFinder/1.0' }
            });
            const results = await res.json();

            if (results && results.length > 0) {
                // Search results me se wo result dhundo jo Room ke paas ho (Max 50km)
                const bestMatch = results.find((item: any) => {
                    const lat = parseFloat(item.lat);
                    const lon = parseFloat(item.lon);
                    const d = getDistanceFromLatLonInKm(roomLat, roomLng, lat, lon);
                    return d < 50; // Sirf wahi valid hai jo 50km ke dayre me ho
                });

                if (bestMatch) {
                    targetLat = parseFloat(bestMatch.lat);
                    targetLng = parseFloat(bestMatch.lon);
                    break; // Mil gaya! Loop roko
                }
            }
        }

        // 3. RESULT CALCULATION
        if (targetLat && targetLng) {
            const dist = getDistanceFromLatLonInKm(roomLat, roomLng, targetLat, targetLng);
            
            if (dist < 1) {
                setCustomDistance(`${(dist * 1000).toFixed(0)} meters (Walking Distance 🚶)`);
            } else {
                setCustomDistance(`${dist.toFixed(1)} km`);
            }
        } else {
            // Agar 3 koshishon ke baad bhi na mile
            setGoogleFallback(true);
        }

    } catch (e) { 
        console.error(e);
        setGoogleFallback(true);
    } finally {
        setCheckingDistance(false);
    }
  };

  // --- 🔗 OPEN GOOGLE MAPS DIRECTIONS ---
  const openGoogleMaps = () => {
      // Origin: Room Address
      const origin = room.latitude ? `${room.latitude},${room.longitude}` : `${room.address}, ${room.city}`;
      // Destination: User Input + City (Taaki Google sahi jagah le jaye)
      const destination = `${customLocation}, ${room.city}`;
      
      // Google Maps URL
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`, '_blank');
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!room) return <div className="text-center mt-20">Room not found 😕</div>;

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="p-4 border-b sticky top-0 bg-white z-10 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
          <ArrowLeft size={20} /> Back to Search
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
                <div className="h-[300px] md:h-[400px] bg-gray-100 rounded-2xl overflow-hidden shadow-lg border relative">
                    <img src={room.images?.[activeImageIndex] || "https://via.placeholder.com/600x400"} alt={room.title} className="w-full h-full object-cover"/>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{activeImageIndex + 1} / {room.images?.length || 1}</div>
                </div>
                {room.images?.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {room.images.map((img: string, index: number) => (
                            <div key={index} onClick={() => setActiveImageIndex(index)} className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 flex-shrink-0 ${activeImageIndex === index ? "border-blue-500" : "border-transparent"}`}>
                                <img src={img} className="w-full h-full object-cover"/>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.title}</h1>
                <div className="flex items-center text-gray-500 mb-4 font-medium"><MapPin size={18} className="mr-1 text-red-500" /> {room.city}</div>
                <div className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">📍 {currentUser ? room.address : "Address hidden (Login to view)"}</div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6"><p className="text-sm text-gray-500">Rent</p><div className="text-3xl font-bold text-green-600">₹{room.price}</div></div>

                {!currentUser ? (
                    <button onClick={handleLoginRedirect} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"><Lock size={20} /> Login to View Contact (Free)</button>
                ) : (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
                        <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2"><User size={18}/> Owner Details</h3>
                        <p className="mb-4">{room.owner_name} <br/> +91 {room.contact_phone}</p>
                        <div className="flex gap-3">
                            <a href={`tel:${room.contact_phone}`} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-center text-sm">📞 Call</a>
                            <a href={`https://wa.me/91${room.contact_phone}`} target="_blank" className="flex-1 bg-green-100 text-green-700 border border-green-300 py-2 rounded-lg font-bold text-center text-sm flex items-center justify-center gap-1"><MessageCircle size={16}/> WhatsApp</a>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- 📏 SMART DISTANCE CHECKER --- */}
        <div className="mt-12 bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Navigation size={20}/> Check Distance</h3>
            <p className="text-sm text-blue-700 mb-4">Search nearby landmarks (e.g. Allen, Mall).</p>
            
            <div className="flex gap-3 flex-wrap">
                <input 
                    type="text" 
                    placeholder="Enter Location..." 
                    className="flex-grow p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-400"
                    value={customLocation}
                    onChange={(e) => { setCustomLocation(e.target.value); setGoogleFallback(false); setCustomDistance(null); }}
                />
                <button onClick={checkDistance} disabled={checkingDistance} className="bg-blue-600 text-white px-6 rounded-xl font-bold whitespace-nowrap">
                    {checkingDistance ? <Loader2 className="animate-spin"/> : "Check"}
                </button>
            </div>

            {/* Result: Found by App */}
            {customDistance && !googleFallback && (
                <div className="mt-4 font-bold text-lg text-gray-800 bg-white p-4 rounded-xl border inline-block shadow-sm animate-in fade-in">
                    📍 Distance: <span className="text-green-600 text-xl">{customDistance}</span>
                </div>
            )}

            {/* Result: Fallback to Google (Agar App fail ho jaye) */}
            {googleFallback && (
                <div className="mt-4 animate-in fade-in p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                    <p className="text-gray-600 text-sm mb-3">
                        📍 Exact place not found on our free map. <br/>
                        <b>Click below to see distance on Google Maps:</b>
                    </p>
                    <button 
                        onClick={openGoogleMaps}
                        className="w-full md:w-auto bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                    >
                        <ExternalLink size={18}/> Open Google Maps Directions
                    </button>
                </div>
            )}
        </div>

        {/* Map Embed */}
        <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><MapIcon size={20}/> Location on Map</h3>
            {currentUser && room.address ? (
                <div className="w-full h-[300px] bg-gray-200 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <iframe width="100%" height="100%" style={{border:0}} loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(room.address + ", " + room.city)}&output=embed`}></iframe>
                </div>
            ) : <div className="w-full h-[200px] bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-dashed text-gray-400"><MapPin size={40} className="mb-2 opacity-50"/><p>Login to view Map.</p></div>}
        </div>

        <div className="mt-8 border-t pt-8"><h3 className="text-xl font-bold text-gray-800 mb-4">About</h3><p className="text-gray-600 text-lg whitespace-pre-line">{room.description}</p></div>
      </div>
    </main>
  );
}