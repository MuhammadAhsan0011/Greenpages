import Link from "next/link";
import SubmitButton from "../../components/SubmitButton";
import AdsNav from "./AdsNav";
import ConfirmButton from "./ConfirmButton";
import MigrationNotice from "./MigrationNotice";
import { requireAdminPage } from "./guard";
import { deleteAd, duplicateAd, setAdStatus } from "./actions";
import { AD_SIZE_OPTIONS, adLifecycle, adSizeLabel, ctr, formatCtr } from "@/lib/ads";

export const metadata = {
  title: "Advertisement Manager",
  robots: { index: false, follow: false },
};

const SORTS = {
  newest: "Newest first",
  name: "Name (A–Z)",
  impressions: "Most impressions",
  clicks: "Most clicks",
  ctr: "Highest CTR",
};
const LIFECYCLE_LABELS = { live: "Live", scheduled: "Scheduled", expired: "Expired", inactive: "Inactive" };
const PAGE_SIZES = [10, 25, 50];

// Server Component - admin only. Filtering, sorting and paging are plain GET
// parameters, so every view of the table is a link that can be bookmarked.
export default async function AdminAdsPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const { supabase } = await requireAdminPage();

  const [{ data: ads, error: adsError }, { data: slots }, { data: totals }] = await Promise.all([
    supabase.from("ads").select("*").order("created_at", { ascending: false }),
    supabase.from("ad_slots").select("key, label").order("sort_order"),
    supabase.from("ad_totals").select("ad_id, impressions, clicks"),
  ]);

  if (adsError) {
    return (
      <section aria-labelledby="ads-heading">
        <div className="container">
          <h1 id="ads-heading">Advertisement Manager</h1>
          <AdsNav active="ads" />
          <MigrationNotice />
        </div>
      </section>
    );
  }

  const slotLabels = new Map((slots ?? []).map((slot) => [slot.key, slot.label]));
  const statsById = new Map((totals ?? []).map((row) => [row.ad_id, row]));

  const q = (params.q ?? "").toString().trim();
  const statusFilter = Object.hasOwn(LIFECYCLE_LABELS, params.status) ? params.status : "";
  const slotFilter = slotLabels.has(params.slot) ? params.slot : "";
  const sizeFilter = AD_SIZE_OPTIONS.some((option) => option.value === params.size) ? params.size : "";
  const sort = Object.hasOwn(SORTS, params.sort) ? params.sort : "newest";
  const perPage = PAGE_SIZES.includes(Number(params.per)) ? Number(params.per) : 25;

  const rows = (ads ?? []).map((ad) => {
    const stats = statsById.get(ad.id);
    return {
      ad,
      lifecycle: adLifecycle(ad),
      impressions: Number(stats?.impressions ?? 0),
      clicks: Number(stats?.clicks ?? 0),
    };
  });

  const needle = q.toLowerCase();
  const filtered = rows.filter(
    ({ ad, lifecycle }) =>
      (!needle || ad.name.toLowerCase().includes(needle) || ad.advertiser.toLowerCase().includes(needle)) &&
      (!statusFilter || lifecycle === statusFilter) &&
      (!slotFilter || ad.slot_key === slotFilter) &&
      (!sizeFilter || ad.size_key === sizeFilter)
  );

  const sorters = {
    newest: () => 0, // already newest first
    name: (a, b) => a.ad.name.localeCompare(b.ad.name),
    impressions: (a, b) => b.impressions - a.impressions,
    clicks: (a, b) => b.clicks - a.clicks,
    ctr: (a, b) => ctr(b.impressions, b.clicks) - ctr(a.impressions, a.clicks),
  };
  const sorted = [...filtered].sort(sorters[sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const page = Math.min(Math.max(Number.parseInt(params.page, 10) || 1, 1), pageCount);
  const pageRows = sorted.slice((page - 1) * perPage, page * perPage);

  const linkTo = (overrides) => {
    const next = new URLSearchParams();
    const merged = { q, status: statusFilter, slot: slotFilter, size: sizeFilter, sort, per: String(perPage), page: String(page), ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "sort" && value === "newest") && !(key === "per" && value === "25") && !(key === "page" && value === "1")) {
        next.set(key, value);
      }
    }
    const query = next.toString();
    return query ? `/admin/ads?${query}` : "/admin/ads";
  };

  const liveCount = rows.filter((row) => row.lifecycle === "live").length;
  const expiredCount = rows.filter((row) => row.lifecycle === "expired").length;

  return (
    <section aria-labelledby="ads-heading">
      <div className="container">
        <h1 id="ads-heading">Advertisement Manager</h1>
        <p className="hero-description">
          Your own affiliate and sponsored banners. Adsterra keeps running separately and is not affected by anything here.
        </p>
        <AdsNav active="ads" />

        {params.saved === "created" && <p className="form-success">Advertisement published.</p>}
        {params.saved === "updated" && <p className="form-success">Changes saved.</p>}

        <div className="account-card">
          <h2>
            Advertisements ({filtered.length}
            {filtered.length !== rows.length ? ` of ${rows.length}` : ""})
          </h2>
          <p className="editor-hint">
            {liveCount} live · {expiredCount} expired · {rows.length} total. Changes reach the site within about a minute.
          </p>

          <form method="get" className="admin-ads-filters">
            <input type="search" name="q" defaultValue={q} placeholder="Search name or advertiser" aria-label="Search advertisements" />
            <select name="status" defaultValue={statusFilter} aria-label="Status">
              <option value="">All statuses</option>
              {Object.entries(LIFECYCLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select name="slot" defaultValue={slotFilter} aria-label="Placement">
              <option value="">All placements</option>
              {(slots ?? []).map((slot) => (
                <option key={slot.key} value={slot.key}>
                  {slot.label}
                </option>
              ))}
            </select>
            <select name="size" defaultValue={sizeFilter} aria-label="Size">
              <option value="">All sizes</option>
              {AD_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select name="sort" defaultValue={sort} aria-label="Sort by">
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select name="per" defaultValue={String(perPage)} aria-label="Per page">
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary admin-btn-sm">
              Apply
            </button>
            {(q || statusFilter || slotFilter || sizeFilter || sort !== "newest") && (
              <Link href="/admin/ads" className="admin-ads-clear">
                Clear
              </Link>
            )}
          </form>

          {pageRows.length === 0 ? (
            <p>
              {rows.length === 0 ? (
                <>
                  No advertisements yet. <Link href="/admin/ads/new">Add your first banner →</Link>
                </>
              ) : (
                "No advertisements match these filters."
              )}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Preview</th>
                    <th scope="col">Advertisement</th>
                    <th scope="col">Advertiser</th>
                    <th scope="col">Size</th>
                    <th scope="col">Placement</th>
                    <th scope="col">Impressions</th>
                    <th scope="col">Clicks</th>
                    <th scope="col">CTR</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ ad, lifecycle, impressions, clicks }) => (
                    <tr key={ad.id}>
                      <td>
                        <div className="admin-ad-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                          <img src={ad.image_url} alt={`${ad.name} banner`} loading="lazy" />
                        </div>
                      </td>
                      <td>
                        <strong>{ad.name}</strong>
                        <br />
                        <span className="editor-hint">
                          {ad.start_date}
                          {ad.end_date ? ` → ${ad.end_date}` : " → no expiry"} · priority {ad.priority}
                        </span>
                      </td>
                      <td>{ad.advertiser}</td>
                      <td>{adSizeLabel(ad.size_key, ad.width, ad.height)}</td>
                      <td>{slotLabels.get(ad.slot_key) ?? ad.slot_key}</td>
                      <td>{impressions.toLocaleString("en-US")}</td>
                      <td>{clicks.toLocaleString("en-US")}</td>
                      <td>{formatCtr(impressions, clicks)}</td>
                      <td>
                        <span className={lifecycle === "live" ? "admin-status-live" : "admin-status-review"}>
                          {LIFECYCLE_LABELS[lifecycle]}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <Link href={`/admin/ads/${ad.id}/edit`} className="btn btn-secondary admin-btn-sm">
                          Edit
                        </Link>
                        <form action={setAdStatus.bind(null, ad.id, ad.status === "active" ? "inactive" : "active")}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                            {ad.status === "active" ? "Deactivate" : "Activate"}
                          </SubmitButton>
                        </form>
                        <form action={duplicateAd.bind(null, ad.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Copying…">
                            Duplicate
                          </SubmitButton>
                        </form>
                        <form action={deleteAd.bind(null, ad.id)}>
                          <ConfirmButton
                            message={`Delete "${ad.name}" and its statistics? This can't be undone.`}
                            className="btn btn-danger admin-btn-sm"
                            pendingLabel="Deleting…"
                          >
                            Delete
                          </ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pageCount > 1 && (
            <nav className="admin-ads-pagination" aria-label="Pages">
              {page > 1 ? <Link href={linkTo({ page: String(page - 1) })}>← Previous</Link> : <span />}
              <span>
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? <Link href={linkTo({ page: String(page + 1) })}>Next →</Link> : <span />}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
