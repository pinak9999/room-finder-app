import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from "@/lib/supabaseClient";
import ListingClient from "./ListingClient"; // 👈 Hum UI wali file import kar rahe hain

type Props = {
  params: Promise<{ id: string }>
}

// 🔥 1. SEO / METADATA GENERATION (Server Side)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  // Database se room ka data nikalo SEO ke liye
  const { data: room } = await supabase.from("listings").select("*").eq("id", id).single();
 
  if(!room) {
    return { title: "Room Not Found | RoomFinder" };
  }

  return {
    title: `₹${room.price} - Room in ${room.city} | RoomFinder`,
    description: `Check out this verified listing at ${room.address}. No Brokerage!`,
    openGraph: {
      images: [room.images?.[0] || ''], // WhatsApp par ye photo dikhegi
    },
  }
}

// 🔥 2. MAIN PAGE COMPONENT (Server Side)
export default async function ListingPage({ params }: Props) {
  const { id } = await params; // Next.js 15 me await karna jaruri hai

  // Hum ID ko Client Component (UI) me bhej rahe hain
  return <ListingClient id={id} />;
}