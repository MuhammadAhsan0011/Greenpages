// Two-level directory taxonomy (20 parents / 139 children). description,
// metaTitle and metaDescription are intentionally empty strings for most
// nodes for now — the fields exist so per-category SEO copy can be filled
// in later without another schema change, per the migration plan in
// docs/seo/category-migration-diff.md.
//
// "Watches" (shopping-retail) was added after the taxonomy was first drafted
// — see docs/seo/category-migration-diff.md's "Watches" note.
//
// Every consumer must go through the helpers below (or getAllParents /
// getAllChildren / findBySlug etc.) rather than reading this array's shape
// directly, so a future taxonomy change doesn't ripple through every page.
import { createTaxonomyHelpers } from "@/lib/taxonomy";

export const BUSINESS_CATEGORIES = [
  {
    name: "Automotive",
    slug: "automotive",
    sortOrder: 1,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Car Dealers", slug: "car-dealers", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Auto Workshops & Repair", slug: "auto-workshops", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Auto Spare Parts", slug: "auto-spare-parts", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Denting & Painting", slug: "denting-painting", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Tyre & Battery Shops", slug: "tyre-battery-shops", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Car Rental & Rent-a-Car", slug: "car-rental", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Motorcycle Dealers & Repair", slug: "motorcycle-dealers", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Car Wash & Detailing", slug: "car-wash-detailing", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Food & Dining",
    slug: "food-dining",
    sortOrder: 2,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Restaurants", slug: "restaurants", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cafes & Coffee Shops", slug: "cafes-coffee-shops", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Fast Food & Takeaway", slug: "fast-food", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "BBQ & Karahi", slug: "bbq-karahi", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Bakeries & Sweet Shops", slug: "bakeries-sweets", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Catering Services", slug: "catering-services", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Home & Cloud Kitchens", slug: "home-cloud-kitchens", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Ice Cream & Desserts", slug: "desserts", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Juice & Shake Corners", slug: "juice-corners", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Health & Medical",
    slug: "health-medical",
    sortOrder: 3,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Hospitals", slug: "hospitals", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Clinics & Doctors", slug: "clinics-doctors", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Dentists", slug: "dentists", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pharmacies & Medical Stores", slug: "pharmacies", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Diagnostic Labs", slug: "diagnostic-labs", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Physiotherapy Centers", slug: "physiotherapy", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Eye Care & Optical", slug: "eye-care-optical", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Homeopathic & Hakeem", slug: "homeopathic-hakeem", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Mental Health & Counseling", slug: "mental-health-counseling", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Veterinary Clinics", slug: "veterinary-clinics", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Beauty & Wellness",
    slug: "beauty-wellness",
    sortOrder: 4,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Beauty Salons", slug: "beauty-salons", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Barbers & Men's Salons", slug: "barbers-mens-salons", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Bridal Makeup Artists", slug: "bridal-makeup", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Spa & Massage", slug: "spa-massage", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Skin & Laser Clinics", slug: "skin-laser-clinics", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Gyms & Fitness Centers", slug: "gyms-fitness", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Yoga & Pilates Studios", slug: "yoga-studios", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Education & Training",
    slug: "education-training",
    sortOrder: 5,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Schools", slug: "schools", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Colleges", slug: "colleges", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Universities", slug: "universities", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Montessori & Daycare", slug: "montessori-daycare", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Tuition Centers & Academies", slug: "tuition-academies", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "IT & Computer Training", slug: "it-computer-training", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Test Prep (IELTS, CSS, MDCAT)", slug: "test-prep", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Language Centers", slug: "language-centers", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Quran & Islamic Studies", slug: "quran-islamic-studies", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Driving Schools", slug: "driving-schools", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Professional Services",
    slug: "professional-services",
    sortOrder: 6,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Lawyers & Legal Services", slug: "lawyers-legal", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Accountants & Tax Consultants", slug: "accountants-tax", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Business Consultants", slug: "business-consultants", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Immigration & Visa Consultants", slug: "immigration-consultants", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Insurance Agents", slug: "insurance-agents", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Architects", slug: "architects", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Interior Designers", slug: "interior-designers", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "HR & Recruitment Agencies", slug: "recruitment-agencies", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Translation & Attestation", slug: "translation-attestation", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Technology & Digital",
    slug: "technology-digital",
    sortOrder: 7,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "IT Companies & Software Houses", slug: "software-houses", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Web Development Agencies", slug: "web-development", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Digital Marketing & SEO Agencies", slug: "digital-marketing-agencies", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Graphic Design Studios", slug: "graphic-design", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Mobile Phone Repair", slug: "mobile-repair", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Computer & Laptop Sales", slug: "computer-laptop-sales", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "CCTV & Security Systems", slug: "cctv-security", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Call Centers & BPO", slug: "call-centers-bpo", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Real Estate & Construction",
    slug: "real-estate-construction",
    sortOrder: 8,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Real Estate Agencies", slug: "real-estate-agencies", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Property Dealers", slug: "property-dealers", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Builders & Developers", slug: "builders-developers", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Construction Contractors", slug: "construction-contractors", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Marble Tiles & Flooring", slug: "marble-tiles", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hardware & Sanitary Stores", slug: "hardware-sanitary", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Solar Installation", slug: "solar-installation", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Home Services & Repair",
    slug: "home-services",
    sortOrder: 9,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Electricians", slug: "electricians", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Plumbers", slug: "plumbers", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Carpenters", slug: "carpenters", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Painters", slug: "painters", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "AC Repair & HVAC", slug: "ac-repair-hvac", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Home Appliance Repair", slug: "appliance-repair", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Generator Sales & Repair", slug: "generator-repair", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cleaning Services", slug: "cleaning-services", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pest Control", slug: "pest-control", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Laundry & Dry Cleaning", slug: "laundry-dry-cleaning", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
      { name: "Water Supply & Tankers", slug: "water-supply", sortOrder: 11, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Shopping & Retail",
    slug: "shopping-retail",
    sortOrder: 10,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Clothing & Boutiques", slug: "clothing-boutiques", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Shoes & Footwear", slug: "shoes-footwear", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Jewellery Shops", slug: "jewellery", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      // Added after the initial taxonomy draft, for the "Timezone watches"
      // business that didn't fit anywhere else — see
      // docs/seo/category-migration-diff.md's "Watches" note.
      { name: "Watches", slug: "watches", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Mobile Phone Shops", slug: "mobile-shops", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Electronics & Home Appliances", slug: "electronics-appliances", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Furniture Stores", slug: "furniture-stores", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Grocery & Karyana Stores", slug: "grocery-karyana", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Supermarkets & Marts", slug: "supermarkets", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Bookstores & Stationery", slug: "bookstores-stationery", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
      { name: "Sports Goods", slug: "sports-goods", sortOrder: 11, description: "", metaTitle: "", metaDescription: "" },
      { name: "Toys & Kids Stores", slug: "toys-kids", sortOrder: 12, description: "", metaTitle: "", metaDescription: "" },
      { name: "Gift & Novelty Shops", slug: "gift-shops", sortOrder: 13, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Events & Weddings",
    slug: "events-weddings",
    sortOrder: 11,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Wedding Halls & Marquees", slug: "wedding-halls-marquees", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Event Planners", slug: "event-planners", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Photographers & Videographers", slug: "photographers-videographers", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "DJ & Sound Services", slug: "dj-sound-services", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Florists & Decor", slug: "florists-decor", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Wedding Car Rentals", slug: "wedding-car-rentals", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Travel & Hospitality",
    slug: "travel-hospitality",
    sortOrder: 12,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Travel Agencies", slug: "travel-agencies", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hotels & Guest Houses", slug: "hotels-guest-houses", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Tour Operators", slug: "tour-operators", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hajj & Umrah Services", slug: "hajj-umrah-services", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Visa & Ticketing Services", slug: "visa-ticketing", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Transport & Logistics",
    slug: "transport-logistics",
    sortOrder: 13,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Courier & Delivery Services", slug: "courier-delivery", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cargo & Freight Forwarding", slug: "cargo-freight", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Packers & Movers", slug: "packers-movers", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Transport Companies", slug: "transport-companies", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Warehousing & Storage", slug: "warehousing", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Industrial & Manufacturing",
    slug: "industrial-manufacturing",
    sortOrder: 14,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Textile Mills & Manufacturers", slug: "textile-manufacturers", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Steel & Metal Works", slug: "steel-metal-works", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Plastic & Packaging", slug: "plastic-packaging", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Chemicals & Industrial Supplies", slug: "chemicals-industrial", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Machinery & Tools", slug: "machinery-tools", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Printing Press", slug: "printing-press", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Agriculture & Livestock",
    slug: "agriculture-livestock",
    sortOrder: 15,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Seeds & Fertilizers", slug: "seeds-fertilizers", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Agricultural Machinery", slug: "agricultural-machinery", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Poultry Farms", slug: "poultry-farms", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Dairy Farms", slug: "dairy-farms", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Livestock Traders", slug: "livestock-traders", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Nurseries & Plants", slug: "nurseries-plants", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Financial Services",
    slug: "financial-services",
    sortOrder: 16,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Banks & Branches", slug: "banks", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Money Exchange", slug: "money-exchange", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Microfinance Institutions", slug: "microfinance", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Investment & Wealth Advisors", slug: "investment-advisors", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Arts & Crafts",
    slug: "arts-crafts",
    sortOrder: 17,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Handicrafts & Artisans", slug: "handicrafts", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Tailors & Stitching", slug: "tailors-stitching", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Embroidery Services", slug: "embroidery", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Calligraphy & Fine Art", slug: "calligraphy-art", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pottery & Ceramics", slug: "pottery-ceramics", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Media & Advertising",
    slug: "media-advertising",
    sortOrder: 18,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Advertising Agencies", slug: "advertising-agencies", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Printing & Signage", slug: "printing-signage", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Production Houses", slug: "production-houses", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Newspapers & Magazines", slug: "newspapers-magazines", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Community & Non-Profit",
    slug: "community-nonprofit",
    sortOrder: 19,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "NGOs & Charities", slug: "ngos-charities", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Welfare Trusts", slug: "welfare-trusts", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Religious Organizations", slug: "religious-organizations", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Pets & Animals",
    slug: "pets-animals",
    sortOrder: 20,
    description: "",
    metaTitle: "",
    metaDescription: "",
    children: [
      { name: "Pet Shops", slug: "pet-shops", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pet Grooming", slug: "pet-grooming", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Aquariums & Fish Supplies", slug: "aquariums-fish", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
];

export const {
  getAllParents,
  getAllChildren,
  getParent,
  getChild,
  findBySlug,
  isValidCategorySlug,
} = createTaxonomyHelpers(BUSINESS_CATEGORIES);

// Resolves a raw businesses.category name to the right
// /businesses/category/... path — used anywhere a stored category string
// needs to become a link (business detail page breadcrumbs, etc). Falls
// back to the top-level directory if unmatched, e.g. a business still
// sitting in the retired "Other" bucket (needs_review, not categorized).
export function getCategoryLinkPath(categoryName) {
  for (const parent of BUSINESS_CATEGORIES) {
    if (parent.name === categoryName) {
      return `/businesses/category/${parent.slug}`;
    }
    for (const child of parent.children) {
      if (child.name === categoryName) {
        return `/businesses/category/${parent.slug}/${child.slug}`;
      }
    }
  }
  return "/businesses";
}
