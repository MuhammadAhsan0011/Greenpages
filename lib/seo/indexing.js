// The single indexing-threshold rule for every archive page type (directory
// parents/children, blog parents/children, city, city×category). Defined
// once here — nowhere else in the codebase should hard-code the number 3.
export const INDEXING_THRESHOLD = 3;

// Never nofollow an archive page — link equity must still reach the
// listings/posts on it even while it's below the indexing threshold.
export function getArchiveRobots(publishedCount) {
  return {
    index: publishedCount >= INDEXING_THRESHOLD,
    follow: true,
  };
}

// Tag archives (if/when they exist) are always noindex, follow regardless
// of how many items they contain — unlike category/city archives, a tag is
// a cross-cutting label, not a taxonomy node, so it never earns indexing on
// its own. No tag-archive route exists in this codebase yet; this constant
// is here so one doesn't get built without applying the rule.
export const TAG_ARCHIVE_ROBOTS = { index: false, follow: true };
