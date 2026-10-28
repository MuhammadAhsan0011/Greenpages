import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";
import SubmitButton from "../../components/SubmitButton";
import NoPhotoPlaceholder from "../../components/NoPhotoPlaceholder";
import { setProductSold, deleteOwnProduct } from "../../products/actions";
import { PRODUCT_STATUS_LABELS, formatProductPrice } from "../../data/productOptions";

export const metadata = {
  title: "My Products",
  robots: { index: false, follow: false },
};

// Server Component — the account layout already guarantees a signed-in user.
export default async function MyProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/products");

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, title, price, price_currency, status, image_urls, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <h2>My Products</h2>
      <p className="hero-description">Every product you&apos;ve listed, newest first.</p>

      {products && products.length > 0 ? (
        <ul className="account-article-list">
          {products.map((product) => (
            <li key={product.id} className="account-article-item account-product-item">
              <div className="account-product-thumb">
                {product.image_urls?.[0] ? (
                  <Image src={product.image_urls[0]} alt="" width={72} height={72} unoptimized />
                ) : (
                  <NoPhotoPlaceholder />
                )}
              </div>
              <div className="account-product-body">
                <Link href={`/products/${product.slug}`}>{product.title}</Link>
                <span className="account-meta">
                  <span>{formatProductPrice(product)}</span>
                  <span>
                    {new Date(product.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="locked-inline-hint">{PRODUCT_STATUS_LABELS[product.status] ?? product.status}</span>
                </span>
                <div className="account-article-actions">
                  <Link href={`/account/products/${product.slug}/edit`} className="btn btn-secondary btn-sm">
                    Edit
                  </Link>
                  <form action={setProductSold.bind(null, product.id, product.status !== "sold")}>
                    <SubmitButton className="btn btn-secondary btn-sm" pendingLabel="Saving…">
                      {product.status === "sold" ? "Mark as Available" : "Mark as Sold"}
                    </SubmitButton>
                  </form>
                  <form action={deleteOwnProduct.bind(null, product.id)}>
                    <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Deleting…">
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>You haven&apos;t listed any products yet.</p>
      )}

      <Button href="/account/products/new" variant="primary">
        List a New Product
      </Button>
    </>
  );
}
