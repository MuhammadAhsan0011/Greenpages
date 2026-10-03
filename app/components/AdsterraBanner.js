// Renders one Adsterra "banner" ad unit (the atOptions + iframe-loader
// script pair Adsterra's dashboard gives you per ad key/size). Deliberately
// NOT async: the loader script reads the global `atOptions` the instant it
// runs, so the two <script> tags must execute back-to-back, in this exact
// order — same as Adsterra's own embed snippet. That also means multiple
// AdsterraBanners can sit on the same page safely (e.g. a responsive pair
// swapped by CSS at different breakpoints): each pair fires in document
// order before the next one overwrites `atOptions`.
export default function AdsterraBanner({ adKey, width, height, className }) {
  return (
    <div className={className} style={{ width, height, maxWidth: "100%", margin: "0 auto" }}>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `atOptions = { 'key' : '${adKey}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };`,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run
          synchronously right after the atOptions script above; see note. */}
      <script src={`https://bicea.org/22/${adKey}`} />
    </div>
  );
}
