"use client";

import { useRef, useState } from "react";

// Mirrors the cheap-to-check half of the server-side validation in
// app/account/articles/actions.js (createArticle / saveArticleDraft) — not
// a replacement for it, the server still re-checks everything. The point is
// to catch the common misses (word count, missing cover image, a draft with
// no title) BEFORE the browser ever submits: a server-side failure means a
// redirect to a freshly-rendered page, which throws away everything the
// author typed (title, rich content, chosen images) since nothing on that
// fresh render remembers the failed attempt. Blocking the submit event
// itself means the DOM — and everything in it — never goes anywhere.
const ARTICLE_MIN_WORDS = 800;
const ARTICLE_MAX_WORDS = 2500;

function countWords(html) {
  const text = (html ?? "").replace(/<[^>]*>/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}

export default function ArticleFormGuard({ hasCoverImage, children, ...formProps }) {
  const formRef = useRef(null);
  const [formError, setFormError] = useState("");

  function handleSubmit(event) {
    const form = event.currentTarget;
    // The button that actually triggered this submit — "Save as Draft" has
    // formNoValidate (so native required checks don't block it) and needs a
    // much lighter bar than a real submission. A null submitter (unusual,
    // but possible) falls through to the stricter, "real submit" checks.
    const submitter = event.nativeEvent.submitter;
    const isDraft = submitter?.dataset?.articleAction === "draft";

    function block(message) {
      event.preventDefault();
      setFormError(message);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setFormError("");

    const title = form.elements.title?.value?.trim();
    if (!title) {
      block("Give your article a title before continuing.");
      return;
    }

    const categorySlug = form.elements.category?.value;
    if (!categorySlug) {
      block("Choose a category before continuing.");
      return;
    }

    // Everything below is only required for a real submission — a draft can
    // be saved with short/no content and no image, same as the server side.
    if (isDraft) return;

    const contentHtml = form.elements.content?.value ?? "";
    const wordCount = countWords(contentHtml);
    if (wordCount < ARTICLE_MIN_WORDS) {
      block(
        `Your article is too short — ${wordCount.toLocaleString()} words, minimum is ${ARTICLE_MIN_WORDS.toLocaleString()}. Keep writing, then submit again.`
      );
      return;
    }
    if (wordCount > ARTICLE_MAX_WORDS) {
      block(
        `Your article is too long — ${wordCount.toLocaleString()} words, maximum is ${ARTICLE_MAX_WORDS.toLocaleString()}. Trim it down, then submit again.`
      );
      return;
    }

    const coverImageFile = form.elements.coverImage?.files?.[0];
    if (!coverImageFile && !hasCoverImage) {
      block("Upload a featured image before submitting.");
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} {...formProps}>
      {formError && <p className="form-error article-form-guard-error">{formError}</p>}
      {children}
    </form>
  );
}
