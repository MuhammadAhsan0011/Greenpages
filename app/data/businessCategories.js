// Single source of truth for business categories — used by the business
// profile form's category <select>, and by the /businesses/category/[slug]
// directory landing pages. Each entry gets its own short, non-templated
// intro paragraph so category pages don't read as thin/duplicate content.

export const BUSINESS_CATEGORIES = [
  {
    slug: "manufacturing",
    name: "Manufacturing",
    intro:
      "From textile mills to light-engineering workshops, Pakistan's manufacturing sector is one of the economy's largest employers. This page lists manufacturers who can supply, produce, or fabricate at scale, so buyers can find a verified production partner instead of relying on word of mouth.",
  },
  {
    slug: "construction-real-estate",
    name: "Construction & Real Estate",
    intro:
      "Builders, contractors, and real estate agents listed here handle everything from residential construction to commercial property deals. Buyers and developers use this page to find contacts they can vet directly, rather than going through unverified property agents.",
  },
  {
    slug: "industrial-machinery",
    name: "Industrial Machinery",
    intro:
      "Sourcing or servicing industrial equipment usually means relying on personal contacts — this page lists machinery suppliers, importers, and maintenance providers so factories and workshops have a searchable alternative.",
  },
  {
    slug: "healthcare-medical",
    name: "Healthcare & Medical",
    intro:
      "Clinics, diagnostic labs, and medical suppliers listed here help patients and businesses find healthcare providers by city, without depending solely on referrals or outdated Google listings.",
  },
  {
    slug: "it-software-services",
    name: "IT & Software Services",
    intro:
      "Pakistan's IT sector spans software houses, freelancers, and managed service providers. This page lists companies offering development, hosting, and IT support, making it easier to shortlist a technical partner by category and city.",
  },
  {
    slug: "textiles-garments",
    name: "Textiles & Garments",
    intro:
      "Pakistan is one of the world's largest textile exporters, and this page lists manufacturers, exporters, and garment businesses across the supply chain — from raw fabric to finished apparel.",
  },
  {
    slug: "packaging-printing",
    name: "Packaging & Printing",
    intro:
      "Printing presses, packaging manufacturers, and label suppliers listed here serve everyone from small retailers to large FMCG brands looking for a reliable local vendor.",
  },
  {
    slug: "agriculture-livestock",
    name: "Agriculture & Livestock",
    intro:
      "Farms, feed suppliers, and livestock businesses are listed here to help buyers and traders connect directly with producers across Pakistan's agricultural regions.",
  },
  {
    slug: "solar-renewable-energy",
    name: "Solar & Renewable Energy",
    intro:
      "With load-shedding pushing more households and businesses toward solar, this page lists installers, panel suppliers, and renewable energy consultants so buyers can compare local providers.",
  },
  {
    slug: "chemicals-rubber-plastics",
    name: "Chemicals, Rubber & Plastics",
    intro:
      "Industrial chemical suppliers, plastics manufacturers, and rubber processors listed here support Pakistan's manufacturing and packaging industries with raw materials and finished components.",
  },
  {
    slug: "automotive",
    name: "Automotive",
    intro:
      "Car dealers, spare parts suppliers, and auto workshops listed here give buyers a way to find automotive businesses by city, instead of relying on a single well-known market area.",
  },
  {
    slug: "electrical-electronics",
    name: "Electrical & Electronics",
    intro:
      "Electricians, electronics retailers, and appliance suppliers listed here cover both household and commercial electrical needs across Pakistan's cities.",
  },
  {
    slug: "furniture-interior-design",
    name: "Furniture & Interior Design",
    intro:
      "From custom furniture makers to interior designers, this page helps homeowners and businesses find local craftsmen and design studios with a track record worth checking out.",
  },
  {
    slug: "freight-shipping-logistics",
    name: "Freight, Shipping & Logistics",
    intro:
      "Freight forwarders, courier services, and logistics companies listed here move goods within Pakistan and across borders — this page makes it easier to compare providers by city.",
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage",
    intro:
      "Restaurants, home-based kitchens, bakeries, and beverage suppliers rarely get the same online visibility as big chains. This page lists verified food businesses by city, with contact details customers can actually use.",
  },
  {
    slug: "cosmetics-personal-care",
    name: "Cosmetics & Personal Care",
    intro:
      "Skincare brands, cosmetics retailers, and personal care manufacturers listed here help customers find local businesses beyond the handful of national names that dominate search results.",
  },
  {
    slug: "security-surveillance",
    name: "Security & Surveillance",
    intro:
      "CCTV installers, security guard services, and access-control providers listed here serve homes and businesses looking for a vetted local security partner.",
  },
  {
    slug: "education-training",
    name: "Education & Training",
    intro:
      "Academies, tuition centers, and professional training institutes listed here help students and professionals across Pakistan find courses and programs by city and subject.",
  },
  {
    slug: "hospitality-tourism",
    name: "Hospitality & Tourism",
    intro:
      "Hotels, guest houses, and tour operators listed here help travelers plan trips within Pakistan using verified, up-to-date contact details rather than outdated travel forum posts.",
  },
  {
    slug: "beauty-salons",
    name: "Beauty & Salons",
    intro:
      "Salons, spas, and beauty service providers listed here give customers a way to discover and compare local businesses by city, beyond whichever salon happens to be best-known in their area.",
  },
  {
    slug: "legal-services",
    name: "Legal Services",
    intro:
      "Lawyers, law firms, and legal consultants listed here help individuals and businesses find legal representation by practice area and city.",
  },
  {
    slug: "financial-insurance-services",
    name: "Financial & Insurance Services",
    intro:
      "Accountants, financial consultants, and insurance agents listed here serve individuals and small businesses that need advice beyond what a bank branch typically offers.",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    intro:
      "Property dealers and real estate agencies listed here help buyers, sellers, and renters find local agents they can verify directly, rather than relying solely on classifieds.",
  },
  {
    slug: "fashion-apparel",
    name: "Fashion & Apparel",
    intro:
      "Clothing brands, tailors, and boutiques listed here range from ready-to-wear retailers to custom stitching services, searchable by city for shoppers who want a local option.",
  },
  {
    slug: "events-entertainment",
    name: "Events & Entertainment",
    intro:
      "Event planners, wedding services, and entertainment providers listed here help people organize events in their city without relying entirely on referrals.",
  },
  {
    slug: "sports-fitness",
    name: "Sports & Fitness",
    intro:
      "Gyms, fitness trainers, and sports academies listed here make it easier to find a local fitness business by city and specialty.",
  },
  {
    slug: "arts-crafts",
    name: "Arts & Crafts",
    intro:
      "Artists, craftspeople, and handmade goods businesses listed here get a searchable online presence that's usually hard to build without a dedicated website.",
  },
  {
    slug: "retail-e-commerce",
    name: "Retail & E-Commerce",
    intro:
      "Retail stores and online sellers listed here span everything from neighborhood shops to Pakistan-wide e-commerce brands, searchable by category and city.",
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    intro:
      "Consultants, agencies, and professional service providers that don't fit a narrower category are listed here, covering a broad range of B2B and B2C services across Pakistan.",
  },
  {
    slug: "seo",
    name: "SEO",
    intro:
      "SEO agencies and freelance consultants listed here help businesses improve organic search visibility — a growing need as more Pakistani businesses compete for customers online.",
  },
  {
    slug: "web-development",
    name: "Web Development",
    intro:
      "Web development agencies and freelance developers listed here build everything from marketing sites to custom web applications for businesses across Pakistan.",
  },
  {
    slug: "content-marketing",
    name: "Content Marketing",
    intro:
      "Content marketing agencies and writers listed here help businesses build an audience through blogging, social content, and long-form articles that support SEO.",
  },
  {
    slug: "other",
    name: "Other",
    intro:
      "Businesses that don't fit neatly into another category are listed here, spanning a wide range of industries across Pakistan.",
  },
];

export function getCategoryBySlug(slug) {
  return BUSINESS_CATEGORIES.find((category) => category.slug === slug);
}
