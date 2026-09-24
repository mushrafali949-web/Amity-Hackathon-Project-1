import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDonationImpact } from '@/lib/impact';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: donation } = await admin
    .from('donations')
    .select('*, restaurants(*), ngos(*)')
    .eq('id', id)
    .maybeSingle();

  if (!donation) {
    return new NextResponse('Donation receipt not found', { status: 404 });
  }

  const restaurant = donation.restaurants as any;
  const ngo = donation.ngos as any;
  const verifiedKg = donation.actual_kg_received ?? donation.quantity_kg;
  const impact = calculateDonationImpact(verifiedKg);
  const deliveredDate = donation.delivered_at
    ? new Date(donation.delivered_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Donation Receipt - ResQFood #${donation.id.slice(0, 8)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1c1917; max-width: 800px; margin: auto; }
    .header { border-bottom: 2px solid #ea580c; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 26px; font-weight: 900; color: #ea580c; }
    .badge { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; }
    .section { margin-top: 30px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .box { background: #fdfbf7; border: 1px solid #e7e5e4; padding: 16px; border-radius: 12px; }
    .box h4 { margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px; }
    .box p { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; background: #f5f5f4; padding: 10px; font-size: 12px; border-bottom: 1px solid #d6d3d1; }
    td { padding: 12px 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; }
    .impact-strip { background: #ffedd5; border: 1px solid #fed7aa; padding: 16px; border-radius: 12px; display: flex; justify-content: space-around; text-align: center; margin-top: 25px; }
    .impact-val { font-size: 22px; font-weight: 900; color: #9a3412; }
    .impact-lbl { font-size: 11px; color: #7c2d12; font-weight: bold; }
    .footer { margin-top: 40px; border-top: 1px dashed #d6d3d1; padding-top: 20px; font-size: 11px; color: #78716c; line-height: 1.6; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #ea580c; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="title">ResQFood</div>
      <div style="font-size: 12px; color: #78716c; margin-top: 4px;">Surplus Food Rescue & CSR Certificate</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">VERIFIED RESCUE</span>
      <div style="font-size: 12px; color: #78716c; margin-top: 6px;">Receipt #${donation.id.slice(0, 8).toUpperCase()}</div>
      <div style="font-size: 12px; color: #78716c;">Date: ${deliveredDate}</div>
    </div>
  </div>

  <div class="section grid">
    <div class="box">
      <h4>Donor Details</h4>
      <p><strong>${restaurant?.name || 'Restaurant Donor'}</strong></p>
      <p>${restaurant?.address || ''}, ${restaurant?.city || ''}</p>
      <p>FSSAI Licence: ${restaurant?.fssai_license || 'Not Provided / Pending'}</p>
      <p>Phone: ${restaurant?.phone || 'Confidential'}</p>
    </div>

    <div class="box">
      <h4>Recipient Organization</h4>
      <p><strong>${ngo?.name || 'Partner NGO Shelter'}</strong></p>
      <p>${ngo?.address || ''}, ${ngo?.city || ''}</p>
      <p>Registration No: ${ngo?.registration_no || 'Verified Entity'}</p>
      <p>Contact: ${ngo?.contact_person || 'Operations Head'}</p>
    </div>
  </div>

  <div class="section">
    <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 8px;">Donation Particulars</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Category</th>
          <th>Diet</th>
          <th>Quantity</th>
          <th>Servings Provided</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${donation.title}</strong><br><small style="color: #78716c;">${donation.description || 'Verified fresh surplus'}</small></td>
          <td>${donation.category}</td>
          <td>${donation.diet}</td>
          <td><strong>${verifiedKg} kg</strong></td>
          <td><strong>~${impact.meals} meals</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="impact-strip">
    <div>
      <div class="impact-val">${impact.meals}</div>
      <div class="impact-lbl">MEALS RESCUED</div>
    </div>
    <div>
      <div class="impact-val">${verifiedKg} kg</div>
      <div class="impact-lbl">FOOD DIVERTED</div>
    </div>
    <div>
      <div class="impact-val">${impact.co2eKg} kg</div>
      <div class="impact-lbl">CO2e EMISSIONS AVOIDED</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Certification of Edible Food Rescue:</strong> This document certifies that the food surplus listed above was legally donated in good faith and inspected upon collection by the recipient organization in compliance with national surplus food rescue standards. Calculated impact metrics use 0.5 kg/meal and 2.5 kg CO2e avoided per kg food wasted.</p>
    <p>Generated by ResQFood Platform. For verification or audit queries, contact support@resqfood.app.</p>
  </div>
</body>
</html>
  `;

  return new NextResponse(receiptHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
