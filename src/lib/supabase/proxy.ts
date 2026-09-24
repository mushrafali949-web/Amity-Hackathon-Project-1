import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database, UserRole } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Driver route is purely token-based, public
  if (pathname.startsWith('/driver')) {
    return supabaseResponse;
  }

  // Public asset / api paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api')
  ) {
    return supabaseResponse;
  }

  // Determine user role if authenticated
  let userRole: UserRole | null = null;
  if (user) {
    userRole = (user.user_metadata?.role as UserRole) || null;
    if (!userRole) {
      // Fallback query to profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile) {
        userRole = (profile as { role: UserRole }).role;
      }
    }
  }

  // Auth pages
  const isRestaurantAuthPage =
    pathname === '/restaurant/login' || pathname === '/restaurant/signup';
  const isNgoAuthPage = pathname === '/ngo/login' || pathname === '/ngo/signup';
  const isCommonAuthPage =
    pathname.startsWith('/auth/check-email') ||
    pathname.startsWith('/auth/forgot-password') ||
    pathname.startsWith('/auth/reset-password');

  // If already authenticated and visiting auth pages, redirect to appropriate home
  if (user && (isRestaurantAuthPage || isNgoAuthPage)) {
    if (userRole === 'restaurant') {
      const url = request.nextUrl.clone();
      url.pathname = '/restaurant/dashboard';
      return NextResponse.redirect(url);
    } else if (userRole === 'ngo') {
      const url = request.nextUrl.clone();
      url.pathname = '/ngo/console';
      return NextResponse.redirect(url);
    }
  }

  // Protected Restaurant routes
  if (pathname.startsWith('/restaurant') && !isRestaurantAuthPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/restaurant/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (userRole === 'ngo') {
      const url = request.nextUrl.clone();
      url.pathname = '/restaurant/login';
      url.searchParams.set('error', 'role_mismatch_ngo');
      return NextResponse.redirect(url);
    }
  }

  // Protected NGO routes
  if (pathname.startsWith('/ngo') && !isNgoAuthPage) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/ngo/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (userRole === 'restaurant') {
      const url = request.nextUrl.clone();
      url.pathname = '/ngo/login';
      url.searchParams.set('error', 'role_mismatch_restaurant');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
