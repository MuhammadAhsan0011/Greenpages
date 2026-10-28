import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/utils/supabase/public";
import { SITE_URL } from "@/lib/site";
import { formatRelativeTime } from "@/lib/relativeTime";
import {
  formatProductPrice,
  productCategoryLabel,
  productAvailabilityLabel,
  productConditionLabel,
} from "../../data/productOptions";
import Breadcrumbs from "../../components/Breadcrumbs";
import GallerySlider from "../../components/GallerySlider";
import ProductCard from "../../components/ProductCard";
import ShareButton from "../../components/ShareButton";

export const revalidate = 60;

async function getProduct(slug) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Product Not Found" };

  const description = product.description.replace(/\s+/g, " ").trim().slice(0, 160);
  const isSold = product.status === "sold";

  return {
    title: `${product.title} — ${formatProductPrice(product)}`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    // A sold product's page stays up so old links work, but shouldn't keep
    // competing in search results.
    robots: isSold ? { index: false, follow: true } : undefined,
    openGraph: {
      title: product.title,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      images: product.image_urls?.[0] ? [product.image_urls[0]] : undefined,
    },
  };
}

function buildProductSchema(product) {
  const availabilityUrl = {
    in_stock: "https://schema.org/InStock",
    out_of_stock: "https://schema.org/OutOfStock",
    pre_order: "https://schema.org/PreOrder",
  }[product.availability];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.slice(0, 500),
    image: product.image_urls ?? [],
    category: productCategoryLabel(product.category),
    itemCondition:
      product.condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      price: String(product.price),
      priceCurrency: product.price_currency || "PKR",
      availability: product.status === "sold" ? "https://schema.org/SoldOut" : availabilityUrl,
    },
  };
}

// Server Component.
export default async function ProductDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const product = await getProduct(slug);

  if (!product) notFound();

  const supabase = createPublicClient();
  const { data: relatedRows } = await supabase
    .from("products")
    .select("id, slug, title, price, price_currency, condition, availability, city, image_urls, status, published_at")
    .eq("status", "published")
    .eq("category", product.category)
    .neq("id", product.id)
    .order("published_at", { ascending: false })
    .limit(4);

  const isSold = product.status === "sold";
  const images = product.image_urls ?? [];
  const tags = (product.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: productCategoryLabel(product.category), path: `/products?category=${product.category}` },
    { name: product.title },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductSchema(product)) }}
      />

      <section className="listing-header">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />

          {query?.posted === "1" && (
            <p className="form-success">Your product is now live on Green Pages.</p>
          )}
          {query?.updated === "1" && <p className="form-success">Your changes were saved.</p>}
          {isSold && <p className="form-error">This product has been sold.</p>}

          <div className="product-detail-grid">
            <div className="product-detail-gallery">
              {images.length > 0 ? (
                <GallerySlider images={images} alt={product.title} />
              ) : (
                <div className="listing-gallery-empty">No photos</div>
              )}
            </div>

            <aside className="product-detail-summary">
              <p className="product-detail-price">{formatProductPrice(product)}</p>
              <h1>{product.title}</h1>
              <p className="job-card-company">{product.company_name}</p>

              <div className="listing-badges">
                <Link href={`/products?category=${product.category}`} className="category-badge">
                  {productCategoryLabel(product.category)}
                </Link>
                <span className="category-badge">{productConditionLabel(product.condition)}</span>
                <span className="category-badge">{productAvailabilityLabel(product.availability)}</span>
              </div>

              <div className="job-card-meta">
                {product.city && <span>📍 {[product.address, product.city].filter(Boolean).join(", ")}</span>}
                <span>Posted {formatRelativeTime(product.published_at)}</span>
              </div>

              {!isSold && (
                <div className="product-contact-actions">
                  {product.contact_whatsapp && (
                    <a
                      href={product.contact_whatsapp}
                      className="btn btn-primary"
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                    >
                      Chat on WhatsApp
                    </a>
                  )}
                  {product.contact_phone && (
                    <a href={`tel:${product.contact_phone.replace(/[^\d+]/g, "")}`} className="btn btn-secondary">
                      Call {product.contact_phone}
                    </a>
                  )}
                  {product.product_link && (
                    <a
                      href={product.product_link}
                      className="btn btn-secondary"
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                    >
                      Visit Product Page
                    </a>
                  )}
                </div>
              )}

              <ShareButton title={product.title} />
            </aside>
          </div>
        </div>
      </section>

      <section aria-labelledby="product-description-heading">
        <div className="container product-detail-body">
          <h2 id="product-description-heading">Description</h2>
          {/* Plain text, stored as typed — rendered as text nodes (React
              escapes it), with line breaks preserved by CSS. */}
          <p className="product-description-text">{product.description}</p>

          {tags.length > 0 && (
            <div className="listing-badges">
              {tags.map((tag) => (
                <Link href={`/products?q=${encodeURIComponent(tag)}`} className="category-badge" key={tag}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {relatedRows && relatedRows.length > 0 && (
        <section className="section-alt" aria-labelledby="related-products-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="related-products-heading">More in {productCategoryLabel(product.category)}</h2>
            </div>
            <div className="product-grid">
              {relatedRows.map((related) => (
                <ProductCard product={related} key={related.id} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
