import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const roleParam = requestUrl.searchParams.get('role');

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData.user) {
      const user = sessionData.user;
      const role = (user.user_metadata?.role || roleParam) as 'restaurant' | 'ngo';
      const meta = user.user_metadata || {};

      try {
        const admin = createAdminClient();

        // Ensure profile exists
        await (admin.from('profiles') as any).upsert({
          id: user.id,
          role: role,
          full_name: meta.full_name || meta.name || '',
          phone: meta.phone || '',
        });

        // Ensure restaurant or ngo record exists if metadata contains signup details
        if (role === 'restaurant') {
          const { data: existingRestaurant } = await admin
            .from('restaurants')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (!existingRestaurant) {
            await (admin.from('restaurants') as any).insert({
              owner_id: user.id,
              name: meta.restaurant_name || 'My Restaurant',
              fssai_license: meta.fssai_license || null,
              phone: meta.phone || null,
              address: meta.address || 'Jaipur Central, Rajasthan',
              city: meta.city || 'Jaipur',
              lat: meta.lat ?? 26.9124,
              lng: meta.lng ?? 75.7873,
              default_pickup_notes: meta.default_pickup_notes || null,
            });
          }
          return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
        } else if (role === 'ngo') {
          const autoVerify = process.env.AUTO_VERIFY_NGOS !== 'false';
          const { data: existingNgo } = await admin
            .from('ngos')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (!existingNgo) {
            await (admin.from('ngos') as any).insert({
              owner_id: user.id,
              name: meta.ngo_name || 'Community Food Bank',
              registration_no: meta.registration_no || null,
              contact_person: meta.contact_person || meta.full_name || null,
              phone: meta.phone || null,
              address: meta.address || 'Civil Lines, Jaipur',
              city: meta.city || 'Jaipur',
              lat: meta.lat ?? 26.9085,
              lng: meta.lng ?? 75.792,
              service_radius_km: meta.service_radius_km ?? 15,
              daily_capacity_kg: meta.daily_capacity_kg ?? 50,
              accepts_categories: meta.accepts_categories ?? ['cooked_meal', 'bakery', 'packaged'],
              accepts_diets: meta.accepts_diets ?? ['veg', 'non_veg', 'jain', 'mixed'],
              has_cold_storage: Boolean(meta.has_cold_storage),
              has_own_transport: Boolean(meta.has_own_transport),
              open_from: meta.open_from || '08:00:00',
              open_to: meta.open_to || '22:00:00',
              people_served_daily: meta.people_served_daily ?? 100,
              accepting_donations: true,
              verification_status: autoVerify ? 'verified' : 'pending',
            });
          }
          return NextResponse.redirect(new URL('/ngo/console', request.url));
        }
      } catch (e) {
        console.error('Error post-processing signup in callback:', e);
      }
    }
  }

  // Fallback to home
  return NextResponse.redirect(new URL('/', request.url));
}
