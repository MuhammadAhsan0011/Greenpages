// City directory landing pages — /businesses/city/[slug]. Each city gets a
// unique intro paragraph (not a templated find-and-replace) to avoid the
// thin/duplicate-content risk that hits most directory city pages.

export const PK_CITIES = [
  {
    slug: "karachi",
    name: "Karachi",
    intro:
      "Karachi is home to Pakistan's largest concentration of small and growing businesses — from Saddar's trading houses to the tech studios in DHA and Clifton. Green Pages' Karachi directory helps local customers find verified businesses by category, and gives owners a free, fast way to get discovered online without waiting on a full website build.",
  },
  {
    slug: "lahore",
    name: "Lahore",
    intro:
      "Lahore's business scene runs from the wholesale markets of the old city to the retail and services hubs along Gulberg, DHA, and Johar Town. Green Pages' Lahore directory lists verified local businesses by category, making it easier for customers to find a trustworthy option without asking around.",
  },
  {
    slug: "islamabad",
    name: "Islamabad",
    intro:
      "As the capital, Islamabad's business landscape leans toward professional services, consultancies, and a fast-growing tech and startup scene around Blue Area and I-9/I-10. Green Pages' Islamabad directory connects residents and companies with verified local providers across the twin cities and beyond.",
  },
  {
    slug: "rawalpindi",
    name: "Rawalpindi",
    intro:
      "Rawalpindi's markets — from Raja Bazaar to Saddar and the Commercial Market — support one of the region's most active small-business economies, closely tied to Islamabad next door. Green Pages' Rawalpindi directory lists verified local businesses so customers on either side of the twin cities can find them by category.",
  },
  {
    slug: "faisalabad",
    name: "Faisalabad",
    intro:
      "Known as Pakistan's textile capital, Faisalabad's economy is built on mills, traders, and manufacturing businesses alongside a growing retail and services sector. Green Pages' Faisalabad directory gives these businesses a free, searchable listing that reaches customers beyond their immediate market.",
  },
];

export function getCityBySlug(slug) {
  return PK_CITIES.find((city) => city.slug === slug);
}
