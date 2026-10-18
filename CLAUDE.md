# ocean-x

The digital artifact for our immersive experience. Built by the Hyper Island MA class (ten people, one team) with Claude Code.

## What this is

A single-page web experience that is opened live during the final presentation ("the immersive experience"), which is otherwise run from the class Miro board. This repo is the only code the class owns. Everything else (talk, record, files) lives in Slack and Miro.

## Where things live

- Slack workspace "Tide Readers": daily check-ins, blockers, the log, files
- Miro board: material pool, storyline frames, presentation
- This repo: the artifact's code
- Vercel: two projects from this repo, both deploy `main` automatically. `public/` is the artifact at ocean-x.tidereaders.org; `site/` is the landing page at tidereaders.org

## Conventions

- Plain HTML, CSS and JavaScript in `public/` until the artifact needs more. No framework before it earns its place.
- `site/` is the one-page front door for tidereaders.org. Keep it to links; it is not where the artifact lives.
- `public/index.html` is the entry point. Keep it working at all times; `main` is always deployable.
- Work on a branch, open a pull request, merge to `main`. Small PRs, one idea each.
- Commit messages: imperative, one line, say what changed for a visitor ("Add opening scene", "Fix mobile layout"), not what you did in the editor.
- Assets go in `public/assets/`, named lowercase with hyphens.
- No secrets, keys or personal data in the repo. If the artifact needs an API key, stop and ask in #blockers.

## Working with Claude Code here

- Read this file and the README first.
- Before building something new, check the Miro storyline for what the artifact is meant to do in the presentation, and ask in Slack if the brief is unclear.
- Prefer finishing one small thing that works over starting three.
- When a PR changes what a visitor sees, say so in the PR description in one or two sentences so non-builders in the class can follow.
