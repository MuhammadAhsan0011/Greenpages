"use client";

// This component MUST be a Client Component because it fetches and posts
// comments live from the browser (useState/useEffect) and reacts to the
// current user's auth state. Keeping it as an isolated island means the
// blog post page around it (article content, SEO metadata, JSON-LD) stays
// statically generated — only this comment thread is fetched client-side.

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function Comments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!active) return;
      setUser(userData.user ?? null);

      if (userData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userData.user.id)
          .single();
        if (active) setAuthorName(profile?.full_name ?? "Member");
      }

      const { data: commentRows } = await supabase
        .from("comments")
        .select("id, body, created_at, profiles(full_name)")
        .eq("post_slug", slug)
        .order("created_at", { ascending: true });

      if (active) {
        setComments(commentRows ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug, supabase]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user || !body.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_slug: slug, author_id: user.id, body: body.trim() })
      .select("id, body, created_at")
      .single();
    setSubmitting(false);

    if (!error && data) {
      setComments((previous) => [
        ...previous,
        { ...data, profiles: { full_name: authorName } },
      ]);
      setBody("");
    }
  }

  return (
    <div className="comments-section">
      <h2>Comments {!loading && `(${comments.length})`}</h2>

      {loading ? (
        <p>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p>No comments yet — be the first to share your thoughts.</p>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <div className="comment-meta">
                <span className="comment-author">
                  {comment.profiles?.full_name ?? "Member"}
                </span>
                <time className="comment-date" dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="comment-body">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <label htmlFor="comment-body" className="visually-hidden">
            Add a comment
          </label>
          <textarea
            id="comment-body"
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your thoughts..."
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <p>
          <Link href="/login">Sign in</Link> to join the conversation.
        </p>
      )}
    </div>
  );
}
