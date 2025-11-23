import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component issue ignore karo
            }
          },
        },
      }
    );

    // 🔥 Debugging: Code exchange try karo aur ERROR print karo
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // ✅ Success!
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // ❌ Error aaya: Isko Terminal me dekho!
      console.error("🔴 SUPABASE AUTH ERROR:", error.message);
      
      // User ko error dikhao URL me
      return NextResponse.redirect(`${origin}/login?error_message=${encodeURIComponent(error.message)}`);
    }
  }

  // Agar code hi nahi aaya
  return NextResponse.redirect(`${origin}/login?error=no_code_found`);
}