// Shared between the create-article Server Action (enforces this), the
// "Write a New Article" and "My Articles" pages (display it), and the
// pricing page (advertises it) — one source of truth so the number can
// never drift out of sync between what's promised and what's enforced.
export const FREE_PLAN_ARTICLE_LIMIT = 3;
