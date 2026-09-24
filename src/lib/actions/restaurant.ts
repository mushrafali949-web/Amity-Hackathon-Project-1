'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const RestaurantProfileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(8, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  lat: z.number(),
  lng: z.number(),
  fssai_license: z.string().optional().nullable(),
  default_pickup_notes: z.string().optional().nullable(),
});

export async function updateRestaurantProfileAction(
  rawInput: z.infer<typeof RestaurantProfileSchema>
) {
  const result = RestaurantProfileSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.issues.map((i) => i.message).join(', ') };
  }

  const input = result.data;
  if (input.fssai_license && !/^\d{14}$/.test(input.fssai_license.trim())) {
    return { success: false, error: 'FSSAI licence must be exactly 14 digits' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  const { error } = await (admin.from('restaurants') as any)
    .update({
      name: input.name,
      phone: input.phone,
      address: input.address,
      city: input.city,
      lat: input.lat,
      lng: input.lng,
      fssai_license: input.fssai_license ? input.fssai_license.trim() : null,
      default_pickup_notes: input.default_pickup_notes || null,
    })
    .eq('owner_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/restaurant/profile');
  revalidatePath('/restaurant/dashboard');
  return { success: true };
}
