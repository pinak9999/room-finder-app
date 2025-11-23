import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { LanguageProvider } from "./context/LanguageContext";
import InstallPrompt from "./components/InstallPrompt"; // 👈 Import check karein

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoomFinder Rajasthan",
  description: "Find PG and Rooms in Kota, Jaipur without Brokerage.",
  manifest: "/manifest.json",
};

// 📱 Mobile Look ke liye Viewport setting
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 👇 Yahan dhyan dein: 'children' ko prop ke roop me liya gaya hai
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
              
              {/* Main Content */}
              <main className="flex-grow">
                  {children} {/* 👈 Ab ye error nahi dega */}
              </main>
              
              {/* PWA Install Button */}
              <InstallPrompt />
              
              {/* Footer */}
              <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}