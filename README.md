# Tap Pop

A portrait-phone bartender game: Overcooked, but you are behind the bar. Orders arrive as tickets, you tap spirits, mixers, and garnishes, and you serve before patience runs out.

Play it at **https://andyperlitch.github.io/tap-pop/**

This is a static PWA (HTML, CSS, ES modules). No build step. Paths are relative so GitHub Pages can serve the site under `/tap-pop/`.

## How to play

1. Start a **shift** (about two minutes). Tickets stack at the top. Each one has a recipe hint and a patience bar.
2. Tap a ticket to make that drink. Tap bottles, mixers, then garnishes. Order does not matter.
3. Recipe icons check off as you add them. A wrong ingredient **spoils** the glass — hit **Trash** and start over.
4. **Serve** when the glass matches. Faster serves pay a bigger tip. Serving quickly in a row builds a **combo** multiplier.
5. When two or more open tickets are the same drink, they show an **xN BATCH** badge. Turn on **Batch**, add the recipe once, then **Batch pour** to fill every matching ticket (shorter pour time and a score bonus).
6. **Hold** parks the current glass so you can start another. **Special** freezes every ticket’s patience for a few seconds, once per shift.
7. Missed tickets cost a life. Three walk-outs or the clock hitting zero ends the shift. High score is saved on the phone (`localStorage`).

Sound is optional (mute on the start and pause screens). Haptics use `navigator.vibrate` when the phone supports it.

## Install to the home screen

The game is meant to run as a standalone app, not a Safari/Chrome tab.

### iPhone / iPad (Safari)

1. Open https://andyperlitch.github.io/tap-pop/ in **Safari** (not Chrome in-app browsers).
2. Tap the **Share** button, then **Add to Home Screen**.
3. Confirm the name **Tap Pop**. Launch it from the home-screen icon.

### Android (Chrome)

1. Open https://andyperlitch.github.io/tap-pop/ in Chrome.
2. Tap the menu, then **Install app** or **Add to Home screen**.
3. Open Tap Pop from the icon. It should launch full screen.

After the first successful load, a service worker caches the app shell so a shift still starts offline.

## Deploys and versioning

GitHub Actions (`.github/workflows/pages.yml`) deploys `main` to GitHub Pages.

On every deploy the workflow **stamps a version**:

- Writes `version.json` (`{"version":"<shortsha>-<unixtime>"}`)
- Replaces `?v=DEV` on the CSS tag, the module entry, and ES module imports
- Sets `<meta name="app-version">`
- Renames the service-worker cache to `tap-pop-<version>`

That cache-busts script/CSS the same way as `career-day-test` (`?v=<unixtime>` on every script). Stale cached JS cannot mix with a new HTML shell.

**Updates never auto-reload.** The client polls `version.json` (`cache: 'no-store'`) on load, when the tab becomes visible or focused, and every 60 seconds. It also calls `registration.update()` and watches `onupdatefound`. If a new version (or a waiting worker) is found, a toast says **New version available. Refresh** with Refresh and **×**.

- **Refresh** posts `{type:'SKIP_WAITING'}` to the waiting worker and reloads **once** on `controllerchange`.
- **×** dismisses the toast for that version (saved in `localStorage`).

Do not add a live-reload that calls `location.reload()` on its own.

## Enable GitHub Pages (first time)

The workflow needs Pages to use **GitHub Actions** as the source:

1. Repo **Settings → Pages**
2. **Build and deployment → Source:** GitHub Actions
3. Merge this PR to `main` (or run **Actions → Deploy GitHub Pages → Run workflow**)

The public URL is https://andyperlitch.github.io/tap-pop/ once the first workflow succeeds. If Pages is still on “Deploy from a branch”, switch it to GitHub Actions; the workflow cannot finish until that is set.

Local play: serve the folder over HTTP (modules and the service worker need a origin, not `file://`):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.
