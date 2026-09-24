import { NextRequest, NextResponse } from 'next/server';

// Throttle tracking (simple in-memory for Nominatim policy)
let lastRequestTime = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Throttle to respect OpenStreetMap Nominatim 1 request per second recommendation
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 800) {
    await new Promise((resolve) => setTimeout(resolve, 800 - timeSinceLast));
  }
  lastRequestTime = Date.now();

  try {
    // Reverse geocoding if lat & lng provided
    if (lat && lng) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ResQFood-App/1.0 (resqfood-rescue@demo.app)',
          'Accept-Language': 'en',
        },
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'Geocoding failed' }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({
        display_name: data.display_name,
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.suburb ||
          'Jaipur',
        address: data.display_name,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
      });
    }

    // Forward search
    if (q) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&limit=5&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ResQFood-App/1.0 (resqfood-rescue@demo.app)',
          'Accept-Language': 'en',
        },
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'Search failed' }, { status: res.status });
      }

      const results = await res.json();
      const mapped = results.map((item: any) => ({
        display_name: item.display_name,
        city:
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.suburb ||
          'Jaipur',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      return NextResponse.json(mapped);
    }

    return NextResponse.json({ error: 'Missing query or coordinates' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
