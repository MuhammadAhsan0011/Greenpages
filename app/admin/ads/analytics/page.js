import Link from "next/link";
import AdsNav from "../AdsNav";
import MigrationNotice from "../MigrationNotice";
import { requireAdminPage } from "../guard";
import { adLifecycle, formatCtr, todayInKarachi } from "@/lib/ads";

export const metadata = {
  title: "Advertisement Analytics",
  robots: { index: false, follow: false },
};

const number = (value) => Number(value ?? 0).toLocaleString("en-US");

function StatCard({ label, value }) {
  return (
    <div className="admin-ad-stat">
      <span className="admin-ad-stat-value">{value}</span>
      <span className="admin-ad-stat-label">{label}</span>
    </div>
  );
}

function shiftDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Server Component - admin only. Reads small pre-aggregated views (see
// ads-migration.sql), so it stays fast however many days of data build up.
// These are THIS site's numbers: purchases and affiliate commission are only
// known to the affiliate network, not here.
export default async function AdAnalyticsPage() {
  const { supabase } = await requireAdminPage();
  const today = todayInKarachi();

  const [adsResult, slotsResult, adTotalsResult, slotTotalsResult, dailyResult] = await Promise.all([
    supabase.from("ads").select("id, name, advertiser, slot_key, status, start_date, end_date").order("created_at", { ascending: false }),
    supabase.from("ad_slots").select("key, label").order("sort_order"),
    supabase.from("ad_totals").select("ad_id, impressions, clicks"),
    supabase.from("ad_slot_totals").select("slot_key, impressions, clicks"),
    supabase.from("ad_daily_totals").select("day, impressions, clicks").gte("day", shiftDays(today, -365)).order("day", { ascending: false }),
  ]);

  if (adsResult.error) {
    return (
      <section aria-labelledby="analytics-heading">
        <div className="container">
          <h1 id="analytics-heading">Advertisement Analytics</h1>
          <AdsNav active="analytics" />
          <MigrationNotice />
        </div>
      </section>
    );
  }

  const ads = adsResult.data ?? [];
  const slotLabels = new Map((slotsResult.data ?? []).map((slot) => [slot.key, slot.label]));
  const adTotals = new Map((adTotalsResult.data ?? []).map((row) => [row.ad_id, row]));
  const slotTotals = slotTotalsResult.data ?? [];
  const daily = dailyResult.data ?? [];

  const totalImpressions = (adTotalsResult.data ?? []).reduce((sum, row) => sum + Number(row.impressions), 0);
  const totalClicks = (adTotalsResult.data ?? []).reduce((sum, row) => sum + Number(row.clicks), 0);

  const lifecycles = ads.map((ad) => adLifecycle(ad, today));
  const activeCount = lifecycles.filter((state) => state === "live").length;
  const expiredCount = lifecycles.filter((state) => state === "expired").length;

  const adRows = ads
    .map((ad) => ({
      ad,
      impressions: Number(adTotals.get(ad.id)?.impressions ?? 0),
      clicks: Number(adTotals.get(ad.id)?.clicks ?? 0),
    }))
    .sort((a, b) => b.impressions - a.impressions);

  const last30 = daily.filter((row) => row.day > shiftDays(today, -30));

  const monthly = new Map();
  for (const row of daily) {
    const month = row.day.slice(0, 7);
    const entry = monthly.get(month) ?? { impressions: 0, clicks: 0 };
    entry.impressions += Number(row.impressions);
    entry.clicks += Number(row.clicks);
    monthly.set(month, entry);
  }
  const monthRows = [...monthly.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  return (
    <section aria-labelledby="analytics-heading">
      <div className="container">
        <h1 id="analytics-heading">Advertisement Analytics</h1>
        <p className="hero-description">
          Website-side numbers only: an impression is counted when a banner has been at least half visible for a second, a
          click when a visitor goes through the redirect. Actual purchases and affiliate commissions are tracked by the
          affiliate provider, not here.
        </p>
        <AdsNav active="analytics" />

        <div className="admin-ad-stats">
          <StatCard label="Total impressions" value={number(totalImpressions)} />
          <StatCard label="Total clicks" value={number(totalClicks)} />
          <StatCard label="Click-through rate" value={formatCtr(totalImpressions, totalClicks)} />
          <StatCard label="Active advertisements" value={number(activeCount)} />
          <StatCard label="Expired advertisements" value={number(expiredCount)} />
        </div>

        <div className="account-card">
          <h2>Advertisement performance</h2>
          {adRows.length === 0 ? (
            <p>
              No advertisements yet. <Link href="/admin/ads/new">Add one →</Link>
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Advertisement</th>
                    <th scope="col">Advertiser</th>
                    <th scope="col">Placement</th>
                    <th scope="col">Impressions</th>
                    <th scope="col">Clicks</th>
                    <th scope="col">CTR</th>
                    <th scope="col">State</th>
                  </tr>
                </thead>
                <tbody>
                  {adRows.map(({ ad, impressions, clicks }) => (
                    <tr key={ad.id}>
                      <td>
                        <Link href={`/admin/ads/${ad.id}/edit`}>{ad.name}</Link>
                      </td>
                      <td>{ad.advertiser}</td>
                      <td>{slotLabels.get(ad.slot_key) ?? ad.slot_key}</td>
                      <td>{number(impressions)}</td>
                      <td>{number(clicks)}</td>
                      <td>{formatCtr(impressions, clicks)}</td>
                      <td>{adLifecycle(ad, today)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>Placement performance</h2>
          {slotTotals.length === 0 ? (
            <p>No data yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Placement</th>
                    <th scope="col">Impressions</th>
                    <th scope="col">Clicks</th>
                    <th scope="col">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {[...slotTotals]
                    .sort((a, b) => Number(b.impressions) - Number(a.impressions))
                    .map((row) => (
                      <tr key={row.slot_key}>
                        <td>{slotLabels.get(row.slot_key) ?? row.slot_key}</td>
                        <td>{number(row.impressions)}</td>
                        <td>{number(row.clicks)}</td>
                        <td>{formatCtr(Number(row.impressions), Number(row.clicks))}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-ad-split">
          <div className="account-card">
            <h2>Daily - last 30 days</h2>
            {last30.length === 0 ? (
              <p>No data yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Impressions</th>
                      <th scope="col">Clicks</th>
                      <th scope="col">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last30.map((row) => (
                      <tr key={row.day}>
                        <td>{row.day}</td>
                        <td>{number(row.impressions)}</td>
                        <td>{number(row.clicks)}</td>
                        <td>{formatCtr(Number(row.impressions), Number(row.clicks))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="account-card">
            <h2>Monthly</h2>
            {monthRows.length === 0 ? (
              <p>No data yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Month</th>
                      <th scope="col">Impressions</th>
                      <th scope="col">Clicks</th>
                      <th scope="col">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthRows.map(([month, row]) => (
                      <tr key={month}>
                        <td>{month}</td>
                        <td>{number(row.impressions)}</td>
                        <td>{number(row.clicks)}</td>
                        <td>{formatCtr(row.impressions, row.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
