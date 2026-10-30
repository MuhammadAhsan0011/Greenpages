import SanitizedArticleBody from "./SanitizedArticleBody";
import AdSlot from "./AdSlot";
import { splitHtmlAfterParagraph } from "@/lib/ads";

// Server Component. Renders an article's HTML with the "article-inline"
// placement after its third top-level paragraph. Articles too short to carry
// an ad (fewer than five paragraphs) and anything that can't be split cleanly
// render exactly as before - the ad slot simply isn't part of them.
export default function ArticleHtmlWithAd({ html }) {
  const parts = splitHtmlAfterParagraph(html, 3);
  if (!parts) return <SanitizedArticleBody html={html} />;

  return (
    <>
      <SanitizedArticleBody html={parts[0]} />
      <AdSlot slot="article-inline" />
      <SanitizedArticleBody html={parts[1]} />
    </>
  );
}
