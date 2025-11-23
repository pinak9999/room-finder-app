"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, ArrowLeft, Heart } from "lucide-react";

export default function SavedRooms() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      // 1. Saved IDs nikalo aur saath me Listing details bhi join karo
      const { data, error } = await supabase
        .from('saved_listings')
        .select('*, listings(*)') // Inner Join magic 🪄
        .eq('user_id', user.id);

      if (!error && data) {
        // Data ko clean karo (sirf listing object chahiye)
        const savedRooms = data.map((item: any) => item.listings);
        setListings(savedRooms);
      }
      setLoading(false);
    };

    fetchSaved();
  }, [router]);

  // Unsave Logic
  const removeSave = async (e: any, roomId: number) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    const { error } = await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', roomId);
    if(!error) {
        setListings(prev => prev.filter(room => room.id !== roomId));
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <Link href="/" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ArrowLeft size={20}/></Link>
        <h1 className="text-xl font-bold text-gray-800">Saved Rooms ({listings.length})</h1>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {listings.length === 0 ? (
            <div className="text-center py-20">
                <Heart size={50} className="mx-auto text-gray-300 mb-4"/>
                <p className="text-gray-500">You haven't saved any rooms yet.</p>
                <Link href="/"><button className="mt-4 text-blue-600 font-bold hover:underline">Go Explore</button></Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.map((room) => (
                    <Link href={`/listing/${room.id}`} key={room.id}>
                    <div className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden border flex flex-col h-full hover:-translate-y-1 relative">
                        
                        {/* ❤️ REMOVE BUTTON */}
                        <button 
                            onClick={(e) => removeSave(e, room.id)}
                            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm text-red-500"
                            title="Remove from Saved"
                        >
                            <Heart size={20} className="fill-red-500"/>
                        </button>

                        <div className="relative h-48 w-full bg-gray-200">
                            <img src={room.images[0]} className="w-full h-full object-cover"/>
                            <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-[10px] font-bold shadow">{room.city}</div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 line-clamp-1">{room.title}</h3>
                            <span className="text-green-600 font-bold">₹{room.price}</span>
                            <p className="text-gray-500 text-sm mt-1 line-clamp-1">{room.address}</p>
                        </div>
                    </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}