import Image from "next/image";
import Link from "next/link";
import NoPhotoPlaceholder from "./NoPhotoPlaceholder";
import { formatProductPrice, productConditionLabel } from "../data/productOptions";
import { formatRelativeTime } from "@/lib/relativeTime";

// Server Component — one card for the /products feed, "More from this
// seller"/related rows, etc. The whole card is a single link (OLX-style)
// so the entire tile is the tap target on mobile.
//
// `unoptimized`: every product image is capped at 1MB at upload time, so
// serving them straight from Supabase Storage is fine and keeps a long
// feed of thumbnails from hammering the app server's image optimizer.
export default function ProductCard({ product }) {
  const cover = product.image_urls?.[0];
  const isSold = product.status === "sold";
  const isOutOfStock = product.availability === "out_of_stock";

  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="product-card-media">
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <NoPhotoPlaceholder />
        )}
        {(isSold || isOutOfStock) && (
          <span className="product-card-ribbon">{isSold ? "Sold" : "Out of Stock"}</span>
        )}
        {product.image_urls?.length > 1 && (
          <span className="product-card-photo-count">{product.image_urls.length} photos</span>
        )}
      </div>
      <div className="product-card-body">
        <p className="product-card-price">{formatProductPrice(product)}</p>
        <h3 className="product-card-title">{product.title}</h3>
        <p className="product-card-meta">
          <span>{productConditionLabel(product.condition)}</span>
          {product.city && <span>{product.city}</span>}
        </p>
        <p className="product-card-posted">{formatRelativeTime(product.published_at)}</p>
      </div>
    </Link>
  );
}
