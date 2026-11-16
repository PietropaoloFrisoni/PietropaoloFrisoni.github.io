# Homepage redesign (work in progress)

Jekyll skips folders that start with an underscore, so nothing in here appears on the live site.

- **Prototype (the master copy):** https://claude.ai/artifact/Qs2652duWum6MBbxXmX4Bo, a Design canvas in my claude.ai account. It's private: the link only opens for my account.
- **`Main.dc.html`** (the page) and **`canvas.json`** (the canvas layout and its notes): a backup snapshot of that prototype, last refreshed on 16 Nov 2026. They're in the canvas tool's own format and don't open as a normal web page. When they fall behind the canvas, refresh them from it.

## Working from a different Claude account

The canvas link above won't open from another account. Instead, ask Claude to create a new Design canvas from `canvas.json` and `Main.dc.html`. One manual step: the two photos in `Main.dc.html` point to uploads that only exist in the original canvas. Upload them to the new canvas and use their new addresses instead:

- `/_blob/29bff3b6abae53656b4221102b8ef915` is `_redesign/profile-code.jpg` (the profile picture in the hero)
- `/_blob/ca780177e1148cab867a76d2fed4bdc9` is `images/LifeRoad.jpg` (the photo in the About section)

The new canvas then becomes the master copy; update the link above.

## Direction

- Position: theoretical physics + HPC + quantum computing, not tied to specific papers or projects.
- Hero: one set of points that re-forms into three scenes, fitted to the visible part of the screen. First, a binary black hole on curved spacetime that spirals in, merges and rings down (gravitational waves, lensed stars, a strain readout). Then a compute cluster (racks, switches, data packets). Last, the 5-qubit quantum Fourier transform, ending in measurements. It can be paused and shows a still image to visitors who prefer reduced motion.
- Backdrop: a starfield with a soft glow in the current field's colour; dot-grid paper in light mode.
- Profile picture (the GitHub "pic with code") beside the name in the hero. Its background may be changed later.
- Sections, in this order: About, Experience, Education, Teaching & Outreach, Publications, with the full content of the current pages. Each opens with its quote (Feynman, Einstein, Galilei, Landau, Poincaré); Newton stays in the footer. No news section.
- The About text is my own wording (Nov 2026); keep it as written.
- Copy stays about the work: first person only in the About text and the hero intro.
- No mention of Munich or Germany, and no "engineer" label in headlines.
- Colours: physics amber, HPC teal, quantum violet. Dark by default, with a light toggle.
- The final site stays on GitHub Pages + Jekyll: no build step, plain JavaScript.

## Still to do

1. Review the remaining draft copy (the contact headline).
2. Check which field(s) each paper is tagged with.
3. Add the remaining tutorials and demos, and the new Udemy courses, to Teaching & Outreach.
4. Port to the real site on a new branch, then merge into `main`: separate pages for Experience, Education, Teaching & Outreach and Publications (as now), papers and talks as `_data/*.yml` files, and a new layout replacing the HTML5 UP template and jQuery.

## Picking up on another laptop

The notes and the backup live on `main`, in this folder. Clone or pull the repo, then tell Claude: "continue the homepage redesign, the notes are in `_redesign/README.md`".
