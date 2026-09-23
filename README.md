# Building IEnumerable from Scratch

An interactive, step-by-step tutorial for experienced C#/.NET developers. It builds `IEnumerable<T>` and `IEnumerator<T>` out of smaller ideas instead of explaining them top-down.

**Live site:** https://pinkmachine19.github.io/csharp-generics-to-ienumerable/

## What it teaches

It opens with a **Start here** page: the objective, the finished code, the questions that make it confusing, and the route through the steps. Then each step adds one small idea to the previous one:

1. Start here: objective, destination code, the confusion, the plan
2. A plain concrete class (`Box`)
3. Why a fixed type is limiting
4. Generic class (`Box<T>`)
5. `T` in fields, parameters and return types
6. A generic interface (`IBox<T>`)
7. Implementing a generic interface
8. One abstraction returning another (`IBoxProvider<T>.GetBox()`)
9. Separating data from traversal state
10. Building a walker (`_position`, `MoveNext()`, `Current`)
11. The collection hands out independent walkers
12. A contract for walkers (`IMyEnumerator<T>`)
13. A contract for collections (`IMyEnumerable<T>`)
14. Iterating by hand
15. The real `IEnumerable<T>` / `IEnumerator<T>`
16. What `foreach` compiles to
17. The Iterator pattern and the design ideas underneath
18. The final mental model
19. Summary

The goal is to understand how framework abstractions are assembled from classes, generics, interfaces, composition and delegation, so that other abstractions (`IServiceProvider`, `IAsyncEnumerable<T>`, factories, LINQ) become readable too.

Features: Previous/Next navigation (also ← / → keys), a step menu, progress bar, resume via `localStorage`, a Reset button, "predict then reveal" questions, and two small interactive walkers.

## Run locally

It is plain static HTML, CSS and JavaScript, with no build step and no dependencies.

Open `index.html` directly in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Enable GitHub Pages

1. Go to the repository's **Settings → Pages**.
2. Under **Build and deployment**, pick **Deploy from a branch**.
3. Choose branch `main`, folder `/ (root)`, and save.

The site appears at `https://<owner>.github.io/<repo>/` after a minute. The empty `.nojekyll` file tells Pages to serve the files as they are, without running Jekyll.

## Repository structure

```
index.html        Page shell: header, lesson container, Previous/Next bar
styles.css        Layout, light/dark theme, code and diagram styling
js/highlight.js   Tiny regex-based C# syntax highlighter
js/lessons.js     All lesson content (one object per step)
js/app.js         Rendering, navigation, localStorage, reveal answers, widgets
.nojekyll         Serve files as-is on GitHub Pages
```

To edit or add a step, change `js/lessons.js`. Each lesson is an object with `title`, `intro`, `code`, `diagram`, `changed`, `why`, `predict`, `before` and optionally `full` (the "Show complete code so far" section), `sections`, `codeTitle` and `eyebrow`. In prose fields, `{{like this}}` renders as inline code.
