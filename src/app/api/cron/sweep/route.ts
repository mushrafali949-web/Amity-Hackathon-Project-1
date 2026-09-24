import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONFIG } from '@/lib/config';
import { rankNgosForDonation, NgoCandidate } from '@/lib/matching/engine';
import { notifyUser } from '@/lib/notify';
import { NGO, NGONeed } from '@/types/database';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'resqfood-local-cron-secret';

  // Allow local invocation or valid Bearer token
  if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const admin = createAdminClient();

  const results = {
    expiredDonations: 0,
    expiredOffers: 0,
    cascadedRound2: 0,
  };

  try {
    // 1. Expire donations past safe_until
    const { data: expiredDonationsList } = await admin
      .from('donations')
      .select('id, title, restaurant_id, restaurants(owner_id)')
      .eq('status', 'posted')
      .lt('safe_until', now.toISOString());

    if (expiredDonationsList && expiredDonationsList.length > 0) {
      for (const d of expiredDonationsList) {
        await (admin.from('donations') as any)
          .update({ status: 'expired' })
          .eq('id', d.id);

        results.expiredDonations++;

        // Notify restaurant owner
        const ownerId = (d.restaurants as any)?.owner_id;
        if (ownerId) {
          await notifyUser({
            userId: ownerId,
            type: 'donation_expired',
            title: 'Donation Expired',
            body: `Donation "${d.title}" safe consumption window expired before claim. Food removed from live matching.`,
            link: `/restaurant/donations/${d.id}`,
          });
        }
      }
    }

    // 2. Expire pending offers past expires_at
    const { data: expiredOffersList } = await (admin.from('donation_offers') as any)
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString())
      .select('*');

    results.expiredOffers = expiredOffersList?.length || 0;

    // 3. Cascade unclaimed donations to Round 2 (wider radius)
    // Find posted donations where all round 1 offers expired and no active pending offers exist
    const { data: unclaimedDonations } = await admin
      .from('donations')
      .select('*, donation_private(*)')
      .eq('status', 'posted')
      .gt('safe_until', new Date(now.getTime() + CONFIG.HANDLING_BUFFER_MIN * 60 * 1000).toISOString());

    if (unclaimedDonations && unclaimedDonations.length > 0) {
      const { data: ngos } = await admin
        .from('ngos')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('accepting_donations', true);

      if (ngos && ngos.length > 0) {
        for (const donation of unclaimedDonations) {
          // Check if any pending offers currently exist for this donation
          const { count } = await admin
            .from('donation_offers')
            .select('*', { count: 'exact', head: true })
            .eq('donation_id', donation.id)
            .eq('status', 'pending');

          if (count && count > 0) continue; // Still has active pending offers

          // Check if round 2 offers were already made
          const { count: round2Count } = await admin
            .from('donation_offers')
            .select('*', { count: 'exact', head: true })
            .eq('donation_id', donation.id)
            .eq('round', 2);

          if (round2Count && round2Count > 0) continue; // Already cascaded

          // Build candidates with round 2 widened radius
          const candidates: NgoCandidate[] = ngos.map((ngoItem: any) => ({
            ngo: ngoItem as NGO,
            remainingCapacityKg: ngoItem.daily_capacity_kg,
            activeNeeds: [],
          }));

          const pickupLat = donation.donation_private?.pickup_lat || donation.approx_lat;
          const pickupLng = donation.donation_private?.pickup_lng || donation.approx_lng;

          const matches = rankNgosForDonation(donation, pickupLat, pickupLng, candidates, 2, now);
          const topRound2 = matches.slice(0, CONFIG.OFFER_BROADCAST_TOP_N);

          for (const match of topRound2) {
            const expiresAt = new Date(
              Math.min(
                now.getTime() + CONFIG.OFFER_TTL_MIN * 60 * 1000,
                new Date(donation.safe_until).getTime() - CONFIG.HANDLING_BUFFER_MIN * 60 * 1000
              )
            );

            await (admin.from('donation_offers') as any).upsert({
              donation_id: donation.id,
              ngo_id: match.ngo.id,
              score: match.totalScore,
              distance_km: match.distanceKm,
              eta_min: match.etaMin,
              status: 'pending',
              round: 2,
              expires_at: expiresAt.toISOString(),
            });

            results.cascadedRound2++;

            await notifyUser({
              userId: match.ngo.owner_id,
              type: 'new_offer_round_2',
              title: `Wide-Radius Food Offer (${donation.quantity_kg} kg)`,
              body: `${donation.title} is available in your widened rescue radius (${match.distanceKm} km). Claim now!`,
              link: `/ngo/console?offer=${donation.id}`,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
