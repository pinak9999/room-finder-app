import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-10 pb-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-blue-400 mb-4">RoomFinder</h2>
            <p className="text-gray-400 text-sm">
              Rajasthan's most trusted platform for students to find rooms without brokerage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/create-listing" className="hover:text-white">Post Room</Link></li>
              <li><Link href="/login" className="hover:text-white">Login / Signup</Link></li>
            </ul>
          </div>

          {/* Legal (Razorpay Needs This) */}
          <div>
            <h3 className="text-lg font-bold mb-4">Legal & Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link href="/refund" className="hover:text-white">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2024 RoomFinder Rajasthan. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Instagram className="text-gray-400 hover:text-white cursor-pointer" size={20}/>
            <Twitter className="text-gray-400 hover:text-white cursor-pointer" size={20}/>
            <Facebook className="text-gray-400 hover:text-white cursor-pointer" size={20}/>
          </div>
        </div>
      </div>
    </footer>
  );
}