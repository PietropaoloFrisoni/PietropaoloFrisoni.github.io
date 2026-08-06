# Pietropaolo Frisoni - Computational Scientist

Welcome to my personal GitHub.io page. 

I am Pietropaolo Frisoni, a computational scientist passionate about exploring the intersections of physics, mathematics, and computer science. When not working on those, I can usually be found playing the guitar.

I currently work as an Advanced Quantum Software Engineer at [IQM Quantum Computers](https://www.meetiqm.com/) in Munich, where I am a core contributor to [Qrisp](https://qrisp.eu/), an open-source high-level framework for writing and compiling quantum algorithms.

## Website Overview

- **[Personal Website](https://pietropaolofrisoni.github.io/)**: My experience, publications, and projects.
- **[LinkedIn](https://www.linkedin.com/in/pietropaolo-frisoni-757b3b217/)**: LinkedIn for professional networking.
- **[Inspire](https://inspirehep.net/authors/2122225)**: My academic profile (which I currently do not use that much).

## Editing the site

The site is built with [Jekyll](https://jekyllrb.com/), which GitHub Pages runs
automatically on every push. There is nothing to install and no build step to
run: edit, commit, push, and the live site updates in a minute or so.

| I want to change...                        | Edit                                    |
| ------------------------------------------ | --------------------------------------- |
| The content of a page                       | that page's `.html` file, below the `---` block |
| A page's title, description, or quote       | the `---` front matter at the top of that page |
| The nav, the social links, the footer quote | `_config.yml`                           |
| The shared page shell (`<head>`, scripts)   | `_layouts/default.html`                  |
| The nav / footer / intro markup             | the matching file in `_includes/`        |

Each page holds only its own content; the header, nav, footer and `<head>` come
from the layout, so a change to any of them applies everywhere at once.

`assets/sass/` is kept for reference only. It is **not** the source of
`assets/css/main.css` — that file has been edited directly and the two have
diverged, so compiling the Sass would undo those edits. `_config.yml` excludes
the directory from the built site.

To preview locally (optional, needs Ruby):

```sh
gem install bundler jekyll
jekyll serve   # http://localhost:4000
```

## Contact

Feel free to reach out if you have collaboration ideas or if you just want to connect:

- Email: pietropfrisoni@gmail.com

Thank you for visiting my GitHub.io page
