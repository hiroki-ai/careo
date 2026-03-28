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

    const publicRoutes = ["/", "/terms", "/privacy", "/features", "/compare", "/for-career-center", "/career-portal/login", "/career-portal/setup", "/blog"];
    const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));

    if (!user && !isAuthRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const loginOnlyRoutes = ["/login", "/signup"];
    if (user && loginOnlyRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 管理者専用ルートのサーバーサイド保護
    const adminRoutes = ["/admin", "/honbu"];
    const isAdminRoute = adminRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
    if (isAdminRoute) {
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail || user.email !== adminEmail) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // キャリアセンタースタッフポータル保護
    const isCareerPortal = pathname === "/career-portal" || pathname.startsWith("/career-portal/");
    const isCareerPortalLogin = pathname === "/career-portal/login" || pathname === "/career-portal/setup";
    if (isCareerPortal && !isCareerPortalLogin) {
      if (!user) {
        return NextResponse.redirect(new URL("/career-portal/login", request.url));
      }
      const { data: staff } = await supabase
        .from("career_center_staff")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!staff) {
        return NextResponse.redirect(new URL("/career-portal/login", request.url));
      }
      return supabaseResponse; // スタッフはuser_profilesチェックをスキップ
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
    const publicRoutes2 = ["/", "/terms", "/privacy", "/features", "/compare", "/for-career-center", "/career-portal/login", "/career-portal/setup", "/blog"];
    if (authRoutes.includes(pathname) || publicRoutes2.some(r => pathname === r || pathname.startsWith(r + "/"))) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg|api/).*)"],
};
