import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
    const isAuthRoute = authRoutes.includes(pathname);
    const isOnboarding = pathname === "/onboarding";

    const publicRoutes = ["/", "/features"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isAuthRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const loginOnlyRoutes = ["/login", "/signup"];
    if (user && loginOnlyRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }


    if (user && !isOnboarding && !isAuthRoute) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      if (!profile) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    return supabaseResponse;
  } catch (e) {
    console.error("[middleware error]", e);
    // エラー時は安全のためログインページへリダイレクト
    const { pathname } = request.nextUrl;
    const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
    if (authRoutes.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg|api/).*)"],
};
