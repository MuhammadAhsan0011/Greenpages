// Titles pasted from Word / PDF viewers can be stored with non-breaking
// spaces between every word. They never wrap, so a long one pushes the page
// wider than a phone screen. New submissions are cleaned on write; this
// cleans rows that were saved before that, at display time.
export function normalizeSpaces(text) {
  if (typeof text !== "string") return text;
  return text.replace(/[\u00a0\u202f]/g, " ").replace(/ {2,}/g, " ").trim();
}
