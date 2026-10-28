import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProductPostForm from "../../../../components/ProductPostForm";

export const metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

// Server Component — loads the seller's own product (matched on seller_id,
// so someone else's slug just bounces back to the list) and hands it to the
// same form the create page uses, in edit mode.
export default async function EditProductPage({ params }) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The account layout redirects signed-out visitors, but it renders in
  // parallel with this page, so guard here too instead of throwing.
  if (!user) redirect(`/login?next=/account/products/${slug}/edit`);

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!product) redirect("/account/products");

  return (
    <>
      <Link href="/account/products" className="back-to-dashboard-link">
        ← Back to My Products
      </Link>
      <h2>Edit Product</h2>
      <p className="hero-description">
        Update the details, mark it Out of Stock, or set it to Sold once it&apos;s gone.
      </p>

      <ProductPostForm product={product} />
    </>
  );
}
