import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProductPostForm from "../../../components/ProductPostForm";

export const metadata = {
  title: "List a Product",
  robots: { index: false, follow: false },
};

// Server Component — the account layout already guarantees a signed-in
// user. Prefills the company field from the seller's business listing if
// they have one; a business is NOT required to sell (same as jobs).
export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The account layout redirects signed-out visitors, but it renders in
  // parallel with this page, so guard here too instead of throwing.
  if (!user) redirect("/login?next=/account/products/new");

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <>
      <Link href="/account/products" className="back-to-dashboard-link">
        ← Back to My Products
      </Link>
      <h2>List Your Product on Green Pages PK</h2>
      <p className="hero-description">
        Showcase your product to thousands of potential customers. It goes live in the Products feed as soon as you submit it.
      </p>

      <ProductPostForm business={business} />
    </>
  );
}
