import Link from "next/link";
import Button from "../components/Button";
import Breadcrumbs from "../components/Breadcrumbs";
import ProductCard from "../components/ProductCard";
import ProductSortSelect from "../components/ProductSortSelect";
import { createPublicClient } from "@/utils/supabase/public";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_AVAILABILITY,
  PRODUCT_SORT_OPTIONS,
  productCategoryLabel,
} from "../data/productOptions";

export const metadata = {
  title: "Products for Sale in Pakistan",
  description:
    "Browse products listed by sellers and businesses across Pakistan on Green Pages PK. Search by category, city and price, then contact the seller directly.",
  alternates: { canonical: "/products" },
};

export const revalidate = 60;

const PAGE_SIZE = 24;

function buildQueryString(params, overrides) {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `/products?${qs}` : "/products";
}

// PostgREST's .or() filter syntax treats , ( ) as separators and % * as
// wildcards — strip them from user text so a search can't break the filter.
function safeSearchTerm(value) {
  return value.replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim();
}

function toPositiveInt(value) {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Server Component — every filter is a URL search param (same approach as
// /jobs and /businesses), so the feed is linkable and crawlable. Unlike
// /jobs, filtering/sorting/paging happens in the database, since a
// marketplace feed grows far larger than a job board.
export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const query = safeSearchTerm(params?.q?.trim() ?? "");
  const cityQuery = safeSearchTerm(params?.city?.trim() ?? "");
  const category = PRODUCT_CATEGORIES.some((c) => c.value === params?.category) ? params.category : "";
  const condition = PRODUCT_CONDITIONS.some((c) => c.value === params?.condition) ? params.condition : "";
  const availability = PRODUCT_AVAILABILITY.some((a) => a.value === params?.availability)
    ? params.availability
    : "";
  const minPrice = toPositiveInt(params?.minPrice);
  const maxPrice = toPositiveInt(params?.maxPrice);
  const sort = PRODUCT_SORT_OPTIONS.some((s) => s.value === params?.sort) ? params.sort : "newest";
  const requestedPage = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);

  const supabase = createPublicClient();

  function buildFeedQuery() {
    let q = supabase
      .from("products")
      .select(
        "id, slug, title, price, price_currency, condition, availability, category, city, image_urls, status, published_at",
        { count: "exact" }
      )
      .eq("status", "published");

    if (query) q = q.or(`title.ilike.%${query}%,tags.ilike.%${query}%,company_name.ilike.%${query}%`);
    if (cityQuery) q = q.ilike("city", `%${cityQuery}%`);
    if (category) q = q.eq("category", category);
    if (condition) q = q.eq("condition", condition);
    if (availability) q = q.eq("availability", availability);
    if (minPrice !== null) q = q.gte("price", minPrice);
    if (maxPrice !== null) q = q.lte("price", maxPrice);

    if (sort === "price_asc") q = q.order("price", { ascending: true });
    else if (sort === "price_desc") q = q.order("price", { ascending: false });
    else q = q.order("published_at", { ascending: false });
    return q;
  }

  // First pass finds the total; if the requested page is past the end we
  // clamp and refetch, rather than showing an empty page.
  const firstPageStart = (requestedPage - 1) * PAGE_SIZE;
  let { data: rows, count } = await buildFeedQuery().range(firstPageStart, firstPageStart + PAGE_SIZE - 1);
  const totalProducts = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  if (currentPage !== requestedPage) {
    const start = (currentPage - 1) * PAGE_SIZE;
    ({ data: rows } = await buildFeedQuery().range(start, start + PAGE_SIZE - 1));
  }
  const products = rows ?? [];

  // Live counts for the category links. Ignores the active filters on
  // purpose (like a normal category sidebar) so the numbers stay stable
  // while browsing.
  const { data: categoryRows } = await supabase
    .from("products")
    .select("category")
    .eq("status", "published")
    .limit(10000);
  const categoryCounts = {};
  for (const row of categoryRows ?? []) {
    categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
  }

  const hasFilters = Boolean(
    query || cityQuery || category || condition || availability || minPrice !== null || maxPrice !== null
  );
  const activeParams = {
    q: query,
    city: cityQuery,
    category,
    condition,
    availability,
    minPrice: minPrice ?? "",
    maxPrice: maxPrice ?? "",
    sort: sort === "newest" ? "" : sort,
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Products" }]} />
          <span className="hero-eyebrow">Products</span>
          <h1>Products for Sale in Pakistan</h1>
          <p className="hero-description">
            Browse what sellers and businesses are listing, then contact them directly.
          </p>

          <form action="/products" method="get" className="job-search-form">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search products, brands or keywords"
              aria-label="Search products"
            />
            <input type="text" name="city" defaultValue={cityQuery} placeholder="Enter city" aria-label="City" />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="product-results-heading">
        <div className="container">
          <div className="job-browse-layout product-browse-layout">
            <div className="job-sidebar-col">
              <div className="wizard-sidebar-card product-categories-card">
                <h3>Categories</h3>
                {/* Plain server-rendered links, not a JS filter, so they work
                    instantly and crawlers can follow them. Keeps the current
                    search/city, drops the page number. */}
                <ul className="directory-category-list">
                  <li>
                    <Link
                      href={buildQueryString({ q: query, city: cityQuery }, {})}
                      className={category === "" ? "is-active" : ""}
                    >
                      All Categories
                    </Link>
                  </li>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <li key={c.value}>
                      <Link
                        href={buildQueryString({ q: query, city: cityQuery }, { category: c.value })}
                        className={category === c.value ? "is-active" : ""}
                      >
                        {c.label}
                        {categoryCounts[c.value] > 0 && <span>{categoryCounts[c.value]}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phones: filters start collapsed behind this button (pure CSS
                  checkbox toggle, no JS — same trick as the mobile nav), so
                  the product grid is not pushed a screen and a half down. */}
              <input type="checkbox" id="product-filters-toggle" className="product-filters-toggle visually-hidden" />
              <label htmlFor="product-filters-toggle" className="btn btn-secondary product-filters-button">
                Filters{hasFilters ? " (active)" : ""}
              </label>

              <aside className="job-filters" aria-label="Filters">
                <form action="/products" method="get" className="job-filters-form">
                  {query && <input type="hidden" name="q" value={query} />}
                  {cityQuery && <input type="hidden" name="city" value={cityQuery} />}
                  {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}

                  {category && <input type="hidden" name="category" value={category} />}

                  <div className="form-field">
                    <label htmlFor="condition">Condition</label>
                    <select id="condition" name="condition" defaultValue={condition}>
                      <option value="">Any</option>
                      {PRODUCT_CONDITIONS.map((c) => (
                        <option value={c.value} key={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="availability">Availability</label>
                    <select id="availability" name="availability" defaultValue={availability}>
                      <option value="">Any</option>
                      {PRODUCT_AVAILABILITY.map((a) => (
                        <option value={a.value} key={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="minPrice">Min Price</label>
                      <input id="minPrice" name="minPrice" type="number" min="0" defaultValue={minPrice ?? ""} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="maxPrice">Max Price</label>
                      <input id="maxPrice" name="maxPrice" type="number" min="0" defaultValue={maxPrice ?? ""} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-secondary">
                    Apply Filters
                  </button>
                  {hasFilters && (
                    <Link href="/products" className="service-link">
                      Clear Filters
                    </Link>
                  )}
                </form>
              </aside>

              <div className="wizard-sidebar-card listing-cta-card">
                <h3>Have something to sell?</h3>
                <p>List your product for free and reach buyers across Pakistan.</p>
                <Link href="/account/products/new" className="btn btn-primary btn-sm">
                  List a Product
                </Link>
              </div>
            </div>

            <div className="job-results">
              <div className="job-results-header">
                <h2 id="product-results-heading">
                  {totalProducts} Product{totalProducts === 1 ? "" : "s"}
                  {category && <> in {productCategoryLabel(category)}</>}
                </h2>
                <form action="/products" method="get" className="job-sort-form">
                  {query && <input type="hidden" name="q" value={query} />}
                  {cityQuery && <input type="hidden" name="city" value={cityQuery} />}
                  {category && <input type="hidden" name="category" value={category} />}
                  {condition && <input type="hidden" name="condition" value={condition} />}
                  {availability && <input type="hidden" name="availability" value={availability} />}
                  {minPrice !== null && <input type="hidden" name="minPrice" value={minPrice} />}
                  {maxPrice !== null && <input type="hidden" name="maxPrice" value={maxPrice} />}
                  <label htmlFor="sort" className="visually-hidden">
                    Sort by
                  </label>
                  <ProductSortSelect defaultValue={sort} />
                  <noscript>
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Sort
                    </button>
                  </noscript>
                </form>
              </div>

              {products.length > 0 ? (
                <div className="product-grid">
                  {products.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>
              ) : (
                <p>
                  {hasFilters ? (
                    <>
                      No products match your search. <Link href="/products">Clear filters</Link> to see everything.
                    </>
                  ) : (
                    <>
                      No products listed yet. <Link href="/account/products/new">Be the first to list one.</Link>
                    </>
                  )}
                </p>
              )}

              {totalPages > 1 && (
                <nav className="directory-pagination" aria-label="Product results pagination">
                  <Link
                    href={buildQueryString(activeParams, { page: Math.max(1, currentPage - 1) })}
                    className={currentPage === 1 ? "is-disabled" : ""}
                    aria-disabled={currentPage === 1}
                  >
                    ←
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      href={buildQueryString(activeParams, { page: pageNum })}
                      className={pageNum === currentPage ? "is-active" : ""}
                      key={pageNum}
                    >
                      {pageNum}
                    </Link>
                  ))}
                  <Link
                    href={buildQueryString(activeParams, { page: Math.min(totalPages, currentPage + 1) })}
                    className={currentPage === totalPages ? "is-disabled" : ""}
                    aria-disabled={currentPage === totalPages}
                  >
                    →
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="product-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="product-cta-heading">Selling something?</h2>
            <p>List your product on Green Pages PK — it goes live as soon as you submit it.</p>
            <div className="cta-actions">
              <Button href="/account/products/new" variant="inverted">
                List a Product
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
