import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminPageSizeSelect from "../components/AdminPageSizeSelect";
import SubmitButton from "../components/SubmitButton";
import {
  approveUpgrade,
  dismissRequest,
  setPlan,
  approveReview,
  dismissReview,
  deleteBusiness,
  approveArticle,
  deleteArticle,
} from "./actions";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const PLAN_LABELS = { free: "Free", verified: "Verified", featured: "Premium" };

const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100];
const DEFAULT_ADMIN_PAGE_SIZE = 10;

function parseAdminPageSize(raw) {
  const n = Number(raw);
  return ADMIN_PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_ADMIN_PAGE_SIZE;
}

function parseAdminPage(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function buildAdminQueryString(params, overrides) {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

// Shared pagination controls for the Users/Articles tables below. Page
// number links are plain <Link>s (no JS needed); the page-size control is
// a <select> that auto-submits a GET form scoped to just this table's
// params — carrying the other table's current page/size along as hidden
// fields so switching one grid's page size never resets the other.
function AdminPaginationBar({ paramPrefix, currentPage, pageSize, totalItems, activeParams }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const otherParams = { ...activeParams };
  delete otherParams[`${paramPrefix}Page`];
  delete otherParams[`${paramPrefix}PageSize`];

  return (
    <div className="admin-pagination-row">
      <form method="GET" action="/admin" className="admin-inline-form">
        {Object.entries(otherParams).map(([key, value]) =>
          value !== undefined && value !== null && value !== "" ? (
            <input key={key} type="hidden" name={key} value={value} />
          ) : null
        )}
        <label htmlFor={`${paramPrefix}PageSize`}>Rows per page:</label>
        <AdminPageSizeSelect
          name={`${paramPrefix}PageSize`}
          defaultValue={pageSize}
          options={ADMIN_PAGE_SIZE_OPTIONS}
        />
      </form>
      {totalPages > 1 && (
        <nav className="directory-pagination" aria-label={`${paramPrefix} pagination`}>
          <Link
            href={buildAdminQueryString(activeParams, {
              [`${paramPrefix}Page`]: Math.max(1, currentPage - 1),
            })}
            className={currentPage === 1 ? "is-disabled" : ""}
            aria-disabled={currentPage === 1}
          >
            ←
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={buildAdminQueryString(activeParams, { [`${paramPrefix}Page`]: pageNum })}
              className={pageNum === currentPage ? "is-active" : ""}
            >
              {pageNum}
            </Link>
          ))}
          <Link
            href={buildAdminQueryString(activeParams, {
              [`${paramPrefix}Page`]: Math.min(totalPages, currentPage + 1),
            })}
            className={currentPage === totalPages ? "is-disabled" : ""}
            aria-disabled={currentPage === totalPages}
          >
            →
          </Link>
        </nav>
      )}
    </div>
  );
}

// Server Component, gated to the single admin account (ADMIN_EMAIL). This
// is where package upgrade requests from /pricing get approved, and where
// any business's plan can be corrected manually.
export default async function AdminPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const activeParams = { ...params };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, phone, city, plan, requested_plan, profiles(full_name)")
    .order("name", { ascending: true });

  const pending = (businesses ?? []).filter((b) => b.requested_plan);

  const { data: pendingReviews } = await supabase
    .from("reviews")
    .select("id, business_id, reviewer_name, rating, message, created_at, businesses(name, slug)")
    .eq("approved", false)
    .order("created_at", { ascending: true });

  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, category, created_at, approved, profiles(full_name)")
    .order("created_at", { ascending: false });

  const pendingArticles = (articles ?? []).filter((a) => a.approved === false);

  const [{ data: profiles }, { data: userEmails }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }),
    supabase.from("user_emails").select("id, email"),
  ]);
  const emailById = new Map((userEmails ?? []).map((row) => [row.id, row.email]));
  const users = (profiles ?? []).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? "—",
  }));

  const usersPageSize = parseAdminPageSize(params?.usersPageSize);
  const usersCurrentPage = Math.min(
    parseAdminPage(params?.usersPage),
    Math.max(1, Math.ceil(users.length / usersPageSize))
  );
  const usersPageStart = (usersCurrentPage - 1) * usersPageSize;
  const usersPageItems = users.slice(usersPageStart, usersPageStart + usersPageSize);

  const allArticles = articles ?? [];
  const articlesPageSize = parseAdminPageSize(params?.articlesPageSize);
  const articlesCurrentPage = Math.min(
    parseAdminPage(params?.articlesPage),
    Math.max(1, Math.ceil(allArticles.length / articlesPageSize))
  );
  const articlesPageStart = (articlesCurrentPage - 1) * articlesPageSize;
  const articlesPageItems = allArticles.slice(articlesPageStart, articlesPageStart + articlesPageSize);

  return (
    <section aria-labelledby="admin-heading">
      <div className="container">
        <h1 id="admin-heading">Admin</h1>
        <p className="hero-description">
          Approve package upgrade requests and manage listing plans.{" "}
          <Link href="/admin/seo">View SEO indexing status →</Link>
        </p>

        <div className="account-card">
          <h2>Pending Upgrade Requests ({pending.length})</h2>
          {pending.length === 0 ? (
            <p>No pending requests right now.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Business</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Current</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((business) => (
                    <tr key={business.id}>
                      <td>{business.name}</td>
                      <td>{business.profiles?.full_name ?? "—"}</td>
                      <td>{business.phone ?? "—"}</td>
                      <td>{PLAN_LABELS[business.plan]}</td>
                      <td>{PLAN_LABELS[business.requested_plan]}</td>
                      <td className="admin-table-actions">
                        <form
                          action={approveUpgrade.bind(
                            null,
                            business.id,
                            business.requested_plan
                          )}
                        >
                          <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Approving…">
                            Approve
                          </SubmitButton>
                        </form>
                        <form action={dismissRequest.bind(null, business.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Dismissing…">
                            Dismiss
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>Pending Reviews ({pendingReviews?.length ?? 0})</h2>
          {!pendingReviews || pendingReviews.length === 0 ? (
            <p>No reviews waiting for approval.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">For</th>
                    <th scope="col">Reviewer</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Message</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews.map((review) => (
                    <tr key={review.id}>
                      <td>{review.businesses?.name ?? "Green Pages (platform)"}</td>
                      <td>{review.reviewer_name}</td>
                      <td>{"★".repeat(review.rating)}</td>
                      <td>{review.message}</td>
                      <td className="admin-table-actions">
                        <form
                          action={approveReview.bind(null, review.id, review.businesses?.slug)}
                        >
                          <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Approving…">
                            Approve
                          </SubmitButton>
                        </form>
                        <form action={dismissReview.bind(null, review.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Dismissing…">
                            Dismiss
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>Pending Articles ({pendingArticles.length})</h2>
          {pendingArticles.length === 0 ? (
            <p>No articles waiting for approval.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Excerpt</th>
                    <th scope="col">Author</th>
                    <th scope="col">Category</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingArticles.map((article) => (
                    <tr key={article.id}>
                      <td>{article.title}</td>
                      <td>{article.excerpt}</td>
                      <td>{article.profiles?.full_name ?? "—"}</td>
                      <td>{article.category}</td>
                      <td>
                        {new Date(article.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="admin-table-actions">
                        <form action={approveArticle.bind(null, article.id)}>
                          <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Approving…">
                            Approve
                          </SubmitButton>
                        </form>
                        <form action={deleteArticle.bind(null, article.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Rejecting…">
                            Reject
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>All Users ({users.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersPageItems.map((profile) => (
                  <tr key={profile.id}>
                    <td>{profile.full_name}</td>
                    <td>{profile.email}</td>
                    <td>
                      {new Date(profile.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPaginationBar
            paramPrefix="users"
            currentPage={usersCurrentPage}
            pageSize={usersPageSize}
            totalItems={users.length}
            activeParams={activeParams}
          />
        </div>

        <div className="account-card">
          <h2>All Businesses ({businesses?.length ?? 0})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Business</th>
                  <th scope="col">Owner</th>
                  <th scope="col">City</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Set Plan</th>
                  <th scope="col">Delete</th>
                </tr>
              </thead>
              <tbody>
                {(businesses ?? []).map((business) => (
                  <tr key={business.id}>
                    <td>{business.name}</td>
                    <td>{business.profiles?.full_name ?? "—"}</td>
                    <td>{business.city ?? "—"}</td>
                    <td>{PLAN_LABELS[business.plan]}</td>
                    <td>
                      <form action={setPlan} className="admin-inline-form">
                        <input type="hidden" name="businessId" value={business.id} />
                        <select name="plan" defaultValue={business.plan}>
                          <option value="free">Free</option>
                          <option value="verified">Verified</option>
                          <option value="featured">Premium</option>
                        </select>
                        <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                          Save
                        </SubmitButton>
                      </form>
                    </td>
                    <td>
                      <form action={deleteBusiness.bind(null, business.id)}>
                        <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                          Delete
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="account-card">
          <h2>All Articles ({articles?.length ?? 0})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Author</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Published</th>
                  <th scope="col">Delete</th>
                </tr>
              </thead>
              <tbody>
                {articlesPageItems.map((article) => (
                  <tr key={article.id}>
                    <td>
                      {article.approved === false ? (
                        article.title
                      ) : (
                        <a href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      )}
                    </td>
                    <td>{article.profiles?.full_name ?? "—"}</td>
                    <td>{article.category}</td>
                    <td>{article.approved === false ? "Pending" : "Live"}</td>
                    <td>
                      {new Date(article.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <form action={deleteArticle.bind(null, article.id)}>
                        <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                          Delete
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPaginationBar
            paramPrefix="articles"
            currentPage={articlesCurrentPage}
            pageSize={articlesPageSize}
            totalItems={allArticles.length}
            activeParams={activeParams}
          />
        </div>
      </div>
    </section>
  );
}
