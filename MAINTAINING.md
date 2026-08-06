# Maintaining this site

Notes to self about how the site is put together. Nothing here is user-facing.

The site is built with [Jekyll](https://jekyllrb.com/), which GitHub Pages runs
automatically on every push. There is nothing to install and no build step to
run: edit, commit, push, and the live site updates in a minute or so. If a
build fails it shows up in the repository's Actions tab.

| I want to change...                         | Edit                                             |
| ------------------------------------------- | ------------------------------------------------ |
| The content of a page                        | that page's `.html` file, below the `---` block   |
| A page's title, description, or header quote | the `---` front matter at the top of that page    |
| The nav, the social links, the footer quote  | `_config.yml`                                     |
| The shared page shell (`<head>`, scripts)    | `_layouts/default.html`                           |
| The nav / footer / intro markup              | the matching file in `_includes/`                 |

Each page holds only its own content; the header, nav, footer and `<head>`
come from the layout, so a change to any of them applies everywhere at once.

## Things that will bite you

**`assets/css/main.css` is the source — there is no Sass build.** The theme
originally shipped `assets/sass/`, but the CSS had been edited by hand and the
two had diverged (the Sass still pointed the background at a `bg.jpg` that
does not exist), so compiling it would have silently broken the site. The
directory was deleted; `git log -- assets/sass` will find it if you ever want
it back. Edit `main.css` directly.

**Font Awesome ships only `woff2` and `woff` here.** The `eot`, `ttf` and
`svg` fallbacks for IE and Android 2 were removed, along with the entire
`fa-regular-400` family, which nothing on the site used. If you ever add an
icon with the `far` class it will not render until that font is restored.

**Font Awesome 5.9 has no ORCID or Google Scholar icon.** The INSPIRE-HEP link
in the nav uses `fa-graduation-cap` for that reason.

## Previewing locally (optional, needs Ruby)

```sh
gem install bundler jekyll
jekyll serve   # http://localhost:4000
```
