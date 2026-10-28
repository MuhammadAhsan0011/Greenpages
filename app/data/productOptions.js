// Static option lists + helpers for products.* (see
// docs/seo/products-migration.sql) — one place so the post form, feed
// filters, cards, detail page and server action can't drift apart.

// Image rules. The client form and the server action both import these, so
// the numbers only live here.
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_BYTES = 1024 * 1024; // 1MB
export const MAX_PRODUCT_DESCRIPTION_CHARS = 2000;
export const PRODUCT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const PRODUCT_CATEGORIES = [
  { value: "mobiles-tablets", label: "Mobiles & Tablets" },
  { value: "computers-laptops", label: "Computers & Laptops" },
  { value: "electronics-appliances", label: "Electronics & Appliances" },
  { value: "vehicles-parts", label: "Vehicles & Parts" },
  { value: "fashion-clothing", label: "Fashion & Clothing" },
  { value: "home-furniture", label: "Home & Furniture" },
  { value: "health-beauty", label: "Health & Beauty" },
  { value: "food-groceries", label: "Food & Groceries" },
  { value: "kids-baby", label: "Kids & Baby" },
  { value: "sports-fitness", label: "Sports & Fitness" },
  { value: "books-hobbies", label: "Books & Hobbies" },
  { value: "industrial-business", label: "Industrial & Business Equipment" },
  { value: "other", label: "Other" },
];

export const PRODUCT_AVAILABILITY = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "pre_order", label: "Pre-Order" },
];

export const PRODUCT_CONDITIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
];

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export const PRODUCT_STATUS_LABELS = {
  published: "Live",
  sold: "Sold",
  hidden: "Hidden",
};

function labelFor(list, value) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export const productCategoryLabel = (value) => labelFor(PRODUCT_CATEGORIES, value);
export const productAvailabilityLabel = (value) => labelFor(PRODUCT_AVAILABILITY, value);
export const productConditionLabel = (value) => labelFor(PRODUCT_CONDITIONS, value);

export function formatProductPrice(product) {
  const amount = Number(product.price);
  if (!Number.isFinite(amount)) return "";
  const currency = product.price_currency === "PKR" || !product.price_currency ? "Rs" : product.price_currency;
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}
