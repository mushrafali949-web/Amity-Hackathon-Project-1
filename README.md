# ResQFood — Real-Time Surplus Food Rescue Platform

ResQFood is a production-grade, hyper-localized surplus food rescue platform that connects commercial food donors (restaurants, caterers, banquet halls, and canteens) with nearby verified non-profit shelters and community kitchens in **under 60 seconds** before edible food spoils.

Built with **Next.js 16 (App Router & Turbopack)**, **Supabase (PostgreSQL, Row-Level Security, Realtime, Storage)**, **Tailwind CSS v4**, **Leaflet Maps**, and **Vitest**.

---

## 🌟 Key Innovations & Architecture

- **60-Second Surplus Posting**: Frictionless mobile-first donation logging with auto-calculated FSSAI safe consumption timers based on food category shelf lives. Posts with less than 45 minutes of safe time are proactively rejected.
- **Real-Time Proximity & Capacity Matching Engine**: Evaluates nearby verified NGOs in milliseconds across 5 weighted dimensions:
  1. *Proximity* (Haversine formula within NGO service radius)
  2. *Capacity Fit* (Remaining daily intake capacity in kg)
  3. *Diet & Category Compatibility* (Strict veg/non-veg/jain filters + cold storage bonuses)
  4. *Urgent Needs Match* (Bonuses for fulfilling active NGO community requests)
  5. *Fairness Balancing* (Boosts shelters that haven't received donations recently)
- **Two Radically Distinct User Experiences**:
  - **Restaurant Portal** (Warm Amber/Orange `#EA580C`, mobile-first touch UI): Giant 1-tap post button, live status stepper, active OTP display, CSR tax receipt generator, and nearby shelter requests.
  - **NGO Command Console** (Calm Teal/Green `#0D9488`, high-density operations console): 3-panel command view with live offer timers, interactive Leaflet radar map with service radius, active pickup coordination, and capacity switches.
- **Atomic Race-Condition Safe Claiming**: Handled inside PostgreSQL using `claim_donation(p_donation_id)` with `SECURITY DEFINER` and atomic row locks. If two NGOs attempt to claim the same donation at the same millisecond, exactly one wins; the other receives a friendly feedback toast.
- **Privacy Shield**: Prior to a confirmed claim, recipient shelters only see an approximate neighborhood (~1 km radius) and general category. Exact physical pickup address, contact name, and phone numbers are unlocked only after a successful claim.
- **Tokenized Driver Tracking (`/driver/[token]`)**: Volunteers and transport drivers receive a secret one-time web link requiring zero app downloads or accounts. Features real-time route polyline navigation (OSRM with geodesic fallback), contact calling, and a 4-digit physical handover OTP verification step.
- **Verified Public Impact Ledger**: Aggregates delivered-only donations to compute rescued meals ($0.5\text{ kg/meal}$ standard) and CO2e emissions prevented ($2.5\text{ kg CO2e/kg food}$ EPA standard). No vanity metrics.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16.3.6 (App Router, Turbopack, React Server Components)
- **Database & Auth**: Supabase PostgreSQL with strict RLS on all 8 tables, Auth with role metadata triggers, and Storage.
- **Routing & Proxy**: `src/proxy.ts` (Next.js 16+ convention) with role validation and session refresh.
- **Styling**: Tailwind CSS v4, Lucide React icons, Sonner toasts, Recharts analytics, Framer Motion micro-animations.
- **Mapping & Geocoding**: `react-leaflet` with OpenStreetMap raster tiles (loaded dynamically with `ssr: false`), Nominatim geocoding with server-side throttling, and OSRM turn-by-turn routing.
- **Testing**: Vitest with unit test suites covering the matching engine, food safety rules, and impact mathematics.

---

## 📋 Step-by-Step Supabase Project Setup

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Note down your **Project URL**, **Anon Key**, and **Service Role Key** from `Project Settings -> API`.

### 2. Run Database Migrations
1. In the Supabase Dashboard, navigate to **SQL Editor**.
2. Open the file `supabase/schema.sql` (or `supabase/migrations/001_initial_schema.sql`) from this repository.
3. Paste the entire contents into the SQL editor and click **Run**.
4. This script sets up:
   - Extensions (`pgcrypto`)
   - Custom enum types (`user_role`, `food_category`, `diet_type`, `donation_status`, `offer_status`, `urgency_level`)
   - All core tables (`profiles`, `restaurants`, `ngos`, `ngo_needs`, `donations`, `donation_private`, `donation_offers`, `dispatches`, `notifications`)
   - Triggers for user provisioning (`handle_new_user()`) and valid status lifecycle transitions
   - Atomic stored procedure `claim_donation(p_donation_id)`
   - Public non-PII views (`ngo_public`, `restaurant_public`)
   - Strict Row-Level Security (RLS) policies on every table

### 3. Create Storage Bucket
1. Navigate to **Storage** in the Supabase sidebar.
2. Click **New Bucket**.
3. Name the bucket `food-photos`.
4. Toggle **Public bucket** to `ON`.
5. Under bucket policies, allow authenticated users to upload files.

### 4. Enable Supabase Realtime
1. Navigate to **Database -> Publications** (or **Project Settings -> API -> Realtime**).
2. Ensure the `supabase_realtime` publication has the following tables enabled:
   - `donations`
   - `donation_offers`
   - `notifications`
   - `ngo_needs`

### 5. Configure Authentication
1. Go to **Authentication -> URL Configuration**.
2. Set **Site URL** to `http://localhost:3000` (or your production deployment domain).
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>.vercel.app/auth/callback`
4. **Important for Demos & Testing**:
   - In **Authentication -> Providers -> Email**, you can optionally toggle **"Confirm email"** to `OFF`.
   - This allows instant signup and login without checking email inboxes during hackathon judging and evaluation.

---

## 🔑 Environment Variables Setup

Create a `.env.local` file in the project root:

```bash
# Public Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Service Role Key (Used strictly server-side for admin tasks & matching engine)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Secret for automated expiry sweeps (Protected API route)
CRON_SECRET=resqfood_local_cron_secret_123

# Auto-verify NGOs on signup (Enables immediate food claiming for demos)
AUTO_VERIFY_NGOS=true

# Optional Communication Integrations
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Demo Data
Populate 4 realistic Jaipur restaurants, 6 NGOs with diverse dietary and storage profiles, active community requests, and historical delivered donations:
```bash
npm run seed
```

### 3. Run Unit Tests
Execute the Vitest test suite for food safety validation, matching engine scoring, and impact calculation:
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 End-to-End Demo Script for Evaluators

Follow this 5-minute walkthrough to test the entire surplus food rescue loop:

### Step 1: Explore the Public Landing Page (`/`)
- Open `http://localhost:3000`.
- Experience the warm community aesthetic matching the design reference: bold typography ("TRUSTED RESCUE. REAL CHANGE."), organic cards, 3-step walkthrough, and live public counter showing meals rescued and emissions avoided.
- Notice the two prominent role entry points: **"Donate Surplus Now"** (Restaurant) and **"Claim as an NGO"** (Shelter).

### Step 2: Log in as a Restaurant
- Navigate to `/restaurant/login` (or click "Restaurant Login").
- Sign in with demo credentials:
  - **Email**: `restaurant1@demo.resqfood.app`
  - **Password**: `Demo@1234`
- You will land in the warm amber **Restaurant Dashboard** (`/restaurant/dashboard`).
- Review the monthly impact summary tiles, active donations, and nearby shelter requests.

### Step 3: Post Surplus Food in Under 60 Seconds
- Click the large **"Post Surplus Food"** button (or navigate to `/restaurant/post`).
- Fill out the form:
  - Dish Title: *"30 kg Vegetable Pulao & Raita"*
  - Category: Select `Cooked Meal`
  - Diet: Select `Vegetarian`
  - Quantity: Enter `30` kg (60 servings)
  - Observe how the **Safe Until** timer automatically calculates a 4-hour window with an FSSAI **Low Risk** badge.
  - Notice the 45-minute minimum safety window validation.
- Click **"Post Surplus Donation"**.
- You will be redirected immediately to the live tracker (`/restaurant/donations/[id]`).
- Note the prominent **4-Digit Pickup OTP** displayed on your tracker (e.g. `4829`).

### Step 4: Open NGO Console in a Separate Browser or Incognito Window
- Open an Incognito window and navigate to `/ngo/login`.
- Sign in with demo NGO credentials:
  - **Email**: `ngo1@demo.resqfood.app` (Apna Ghar Seva Trust)
  - **Password**: `Demo@1234`
- You are greeted by the calm teal **Operations Console** (`/ngo/console`).
- Observe the **Incoming Offers** column: the donation just posted by the restaurant appears in real time with countdown timer and match reasons (e.g. *"2.1 km away · Fits remaining capacity · Matches veg preference"*).
- View the interactive Leaflet radar map displaying donation pins and your service radius circle.

### Step 5: Claim the Donation
- Click **"Claim Donation"** on the offer card.
- The atomic database procedure executes safely.
- The donation moves to your **Active Pickups** tab (`/ngo/pickups`).
- The donor's exact street address and direct phone contact are now revealed.

### Step 6: Dispatch a Volunteer / Driver
- On the claimed pickup card, click **"Assign Driver"**.
- Enter driver name *"Ramesh (Volunteer)"* and phone.
- ResQFood generates a tokenized secret tracking link: `/driver/[token]`.
- Click **"Copy Driver Link"** (or use the WhatsApp deep-link button).

### Step 7: Complete Collection via Driver Link
- Open the copied `/driver/[token]` URL in your browser (or on a mobile device).
- Notice that **no account or login is required** for the driver.
- The driver views turn-by-turn OSRM map navigation, destination address, and restaurant call button.
- Driver arrives at the restaurant and requests the **4-digit OTP** from the restaurant staff.
- Enter the OTP and click **"Verify OTP & Confirm Pickup"**.
- The donation status instantly advances to `Picked Up` across all dashboards in real time.

### Step 8: Confirm Delivery & Generate Impact Receipt
- On the driver page, click **"Confirm Delivery"**.
- Back in the NGO portal (`/ngo/pickups`), click **"Confirm Receipt & Weight"**.
- Confirm or adjust the final weight received (e.g. `29.5` kg).
- Switch back to the Restaurant window and visit `/restaurant/impact`.
- Click **"View Official Receipt"** next to the delivered donation: an FSSAI & CSR compliant printable tax certificate opens with complete donor/recipient registration details.

---

## 📝 Documented Assumptions

1. **Food Safety Limits**: Default shelf life constants are hard-coded in `src/lib/config.ts` in accordance with standard food hygiene guidelines (Cooked Meals: 4h; Dairy: 3h; Beverages: 6h; Bakery: 12h; Sweets: 12h; Raw Produce: 24h; Packaged Goods: 72h). Donors may shorten the safe time but can never extend it past the category threshold.
2. **Impact Multipliers**: Standard humanitarian and environmental metrics are applied: $0.5\text{ kg} = 1\text{ nutritious meal}$, and $1\text{ kg}\text{ diverted food} = 2.5\text{ kg CO2e emissions avoided}$.
3. **Privacy Boundary**: Prior to an accepted claim, donors and NGOs are only displayed by general locality/neighborhood (~1 km rounded coordinates) to prevent unsolicited walk-ins and protect operational security.
4. **Driver Tokens**: Driver dispatch links are secured with a cryptographically unique UUID `token`. The server handles driver queries exclusively through service-role lookup by token, ensuring zero leakage of other donor or NGO data.
5. **Next.js 16 App Router Convention**: Next.js 16.3.6 uses `src/proxy.ts` rather than `middleware.ts`. All cookies and route handlers operate asynchronously.

---

## ☁️ Vercel Deployment Notes

1. Connect your repository to Vercel.
2. In the Vercel project settings, set all environment variables listed in `.env.example`.
3. The included `vercel.json` automatically registers a minute-by-minute Cron Job for `/api/cron/sweep`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/sweep",
         "schedule": "* * * * *"
       }
     ]
   }
   ```
4. In production, ensure `CRON_SECRET` matches your Vercel Cron header settings to authorize automated expiry sweeps.

---

## 🧪 Test Suite

Run the full automated test suite anytime:
```bash
npm test
```

Includes tests for:
- Food safety window thresholds and risk score calculations.
- Hard matching filters (radius, capacity, dietary mismatch exclusions).
- Score weighting and matching reasons generation.
- Impact aggregation on delivered-only donations.

---

Built with ❤️ for zero edible food waste and zero hunger.
