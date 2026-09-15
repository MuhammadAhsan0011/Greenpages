# Green Pages — Deployment Rules

This project is worked on from more than one device/session. These rules apply
to every Claude Code session in this repo, not just the one currently open.

## Never deploy without explicit, same-conversation permission

- **Never run `npx vercel --prod` (or any other production deploy) unless the
  user explicitly asks for it in that conversation** — e.g. "deploy kardo",
  "deploy this", "push it live", "haan deploy kardo" in answer to a direct
  question. Committing and pushing to git is a completely separate action
  from deploying, and pushing must never trigger a deploy by itself.
- If the user says "just push to git, don't deploy" (or anything similar in
  Urdu/English), only run `git add` / `git commit` / `git push` and stop
  there. Do not deploy later in the same turn, later in the same
  conversation, or "since it's a small fix" — always wait to be asked again.
- If it's unclear whether "push" means git-push-only or push-and-deploy, ask
  before running `vercel --prod`.
- A standing "don't deploy right now" from the user is durable — it holds
  until the user explicitly says to deploy, even across separate
  conversations/sessions/devices working in this same repo.
- Before deploying, it's worth checking `git log -1` / `vercel ls` to see
  whether another session already deployed the pending commits, so you don't
  duplicate work — but that check is not a substitute for the user's
  explicit go-ahead in *this* conversation.

## Standard workflow

- Repo root: `d:\Ahsan\marketing learning project` (path may differ per
  device).
- Commit + push: `git add -A && git commit -m "..." && git push`.
- Deploy (only when explicitly asked): `npx vercel --prod` from the repo
  root. Production domain: https://www.greenpagespk.com.
