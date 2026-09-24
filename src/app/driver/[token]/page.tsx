import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRoutePolyline } from '@/lib/geo';
import { DriverPortalClient } from '@/components/driver/DriverPortalClient';

export default async function DriverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  // Validate dispatch token with service role
  const { data: dispatch } = await admin
    .from('dispatches')
    .select(
      `
      *,
      donations(
        *,
        donation_private(*),
        restaurants(*),
        ngos(*)
      )
    `
    )
    .eq('token', token)
    .maybeSingle();

  if (!dispatch || !dispatch.donations) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-950/60 text-red-500 border border-red-800 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
            ✕
          </div>
          <h1 className="text-xl font-bold text-white">Invalid or Expired Driver Link</h1>
          <p className="text-stone-400 text-xs leading-relaxed">
            This pickup dispatch token is not valid or has been completed. Please contact your NGO
            coordinator for an updated link.
          </p>
        </div>
      </div>
    );
  }

  const donation = dispatch.donations as any;
  const restaurant = donation.restaurants;
  const ngo = donation.ngos;
  const privateDetails = donation.donation_private;

  const startLat = privateDetails?.pickup_lat || donation.approx_lat;
  const startLng = privateDetails?.pickup_lng || donation.approx_lng;
  const endLat = ngo?.lat || 26.9085;
  const endLng = ngo?.lng || 75.792;

  // Fetch OSRM route geometry
  const route = await getRoutePolyline(startLat, startLng, endLat, endLng);

  return (
    <DriverPortalClient
      token={token}
      dispatch={dispatch}
      donation={donation}
      restaurant={restaurant}
      ngo={ngo}
      privateDetails={privateDetails}
      routeCoordinates={route.coordinates}
      routeDistanceKm={route.distanceKm}
      routeDurationMin={route.durationMin}
    />
  );
}
