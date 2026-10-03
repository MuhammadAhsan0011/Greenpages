// Adsterra's own publisher-referral banner (promotes signing up as an
// Adsterra publisher via our referral link) — separate from AdsterraBanner.js,
// which renders Adsterra's paid ad units. Plain <img>, not next/image: a
// one-off third-party badge, not worth a remotePatterns entry for.
const REFERRAL_URL = "https://beta.publishers.adsterra.com/referral/JyN4wyXPuN";
const BANNER_SRC = "https://landings-cdn.adsterratech.com/referralBanners/png/120%20x%20150%20px.png";

export default function AdsterraReferralBanner({ className }) {
  return (
    <a
      href={REFERRAL_URL}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className={className}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Adsterra" src={BANNER_SRC} width={120} height={150} />
    </a>
  );
}
