// Tutorial shell: renders one lesson at a time, handles Previous / Next,
// remembers the current step in localStorage, and drives the small widgets.
(function () {
  var STORAGE_KEY = "ienumerable-tutorial:v2:step";
  var lessons = window.LESSONS;
  var total = lessons.length;
  var ITEMS = [10, 20, 30];

  var el = {
    lesson: document.getElementById("lesson"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    counter: document.getElementById("counter"),
    fill: document.getElementById("progress-fill"),
    progress: document.querySelector(".progress"),
    jump: document.getElementById("jump"),
    reset: document.getElementById("reset")
  };

  var current = 1;

  // ---------- storage (wrapped: private mode can throw) ----------

  function loadStep() {
    try {
      var n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      return isValid(n) ? n : null;
    } catch (e) { return null; }
  }
  function saveStep(n) {
    try { localStorage.setItem(STORAGE_KEY, String(n)); } catch (e) { /* ignore */ }
  }
  function clearStep() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }
  function isValid(n) { return typeof n === "number" && n >= 1 && n <= total; }

  function stepFromHash() {
    var n = parseInt(location.hash.replace("#", ""), 10);
    return isValid(n) ? n : null;
  }

  // ---------- rendering helpers ----------

  // {{code}} in prose -> <code>escaped</code>
  function prose(html) {
    return (html || "").replace(/\{\{([\s\S]+?)\}\}/g, function (_, c) {
      return "<code>" + escapeHtml(c) + "</code>";
    });
  }

  function clean(src) { return src.replace(/^\n+/, "").replace(/\s+$/, ""); }

  function codeBlocks(blocks) {
    if (!blocks) return "";
    return blocks.map(function (b) {
      return (b.label ? '<div class="code-label">// ' + escapeHtml(b.label) + "</div>" : "") +
        '<pre class="code"><code>' + highlightCSharp(clean(b.src)) + "</code></pre>";
    }).join("");
  }

  function section(title, body) {
    return body ? "<h2>" + title + "</h2>" + body : "";
  }

  function renderLesson(lesson, n) {
    var h = "";
    var eyebrow = lesson.summary ? "Summary" : "Step " + n + " of " + total;
    if (lesson.eyebrow) eyebrow = lesson.eyebrow + " · " + eyebrow;
    h += '<p class="eyebrow">' + eyebrow + "</p>";
    h += "<h1>" + escapeHtml(lesson.title) + "</h1>";
    h += '<div class="intro">' + prose(lesson.intro) + "</div>";

    if (lesson.code) h += section(lesson.codeTitle || "The code", codeBlocks(lesson.code));
    (lesson.sections || []).forEach(function (s) {
      h += section(escapeHtml(s.title), '<div class="card">' + prose(s.html) + "</div>");
    });
    if (lesson.widget) h += section("Try it", '<div class="widget" id="widget"></div>');
    if (lesson.diagram) h += section(lesson.diagramTitle || (lesson.summary ? "The progression" : "The picture"),
      '<pre class="diagram">' + escapeHtml(clean(lesson.diagram)) + "</pre>");
    if (lesson.changed) h += section("What changed?", '<div class="card">' + prose(lesson.changed) + "</div>");
    if (lesson.why) h += section(lesson.summary ? "The deeper point" : "Why?",
      '<div class="card">' + prose(lesson.why) + "</div>" + codeBlocks(lesson.code2));

    (lesson.extra || []).forEach(function (x) {
      h += '<details class="more"><summary>' + escapeHtml(x.summary) + '</summary><div class="more-body">' +
        prose(x.html) + "</div></details>";
    });

    if (lesson.predict && lesson.predict.length) {
      h += section("Predict, then reveal", '<div class="predict">' + lesson.predict.map(function (p, i) {
        return '<div class="card"><p class="q">' + prose(p.q) + "</p>" +
          '<button class="btn btn-small reveal" type="button" aria-expanded="false" aria-controls="ans-' + i + '">Reveal answer</button>' +
          '<div class="answer" id="ans-' + i + '" hidden>' + prose(p.a) + "</div></div>";
      }).join("") + "</div>");
    }

    if (lesson.before) h += section("Before moving on", '<div class="card before">' + prose(lesson.before) + "</div>");

    if (lesson.full) {
      h += '<details class="more"><summary>Show complete code so far</summary><div class="more-body">' +
        '<pre class="code"><code>' + highlightCSharp(clean(lesson.full)) + "</code></pre></div></details>";
    }
    return h;
  }

  // ---------- navigation ----------

  function go(n, opts) {
    opts = opts || {};
    if (!isValid(n)) n = 1;
    current = n;
    saveStep(n);
    if (location.hash !== "#" + n) history.replaceState(null, "", "#" + n);

    var paint = function () {
      el.lesson.innerHTML = renderLesson(lessons[n - 1], n);
      // highlight any raw <pre data-cs> blocks embedded in prose
      el.lesson.querySelectorAll("pre[data-cs]").forEach(function (pre) {
        pre.innerHTML = "<code>" + highlightCSharp(pre.textContent) + "</code>";
      });
      mountWidget(lessons[n - 1].widget);
      el.lesson.classList.remove("fading");
    };

    if (opts.instant) { paint(); }
    else {
      el.lesson.classList.add("fading");
      setTimeout(paint, 150);
      window.scrollTo(0, 0);
    }

    el.prev.disabled = n === 1;
    el.next.disabled = n === total;
    el.counter.textContent = "Step " + n + " of " + total;
    el.fill.style.width = (n / total * 100) + "%";
    el.progress.setAttribute("aria-valuemax", total);
    el.progress.setAttribute("aria-valuenow", n);
    el.jump.value = String(n);
    document.title = lessons[n - 1].title + " · Building IEnumerable";
  }

  el.prev.addEventListener("click", function () { if (current > 1) go(current - 1); });
  el.next.addEventListener("click", function () { if (current < total) go(current + 1); });
  el.jump.addEventListener("change", function () { go(parseInt(el.jump.value, 10)); });
  el.reset.addEventListener("click", function () {
    if (!confirm("Reset the tutorial and go back to step 1?")) return;
    clearStep();
    go(1);
  });
  document.querySelector(".brand").addEventListener("click", function (e) {
    e.preventDefault();
    go(1);
  });

  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "select" || tag === "input" || tag === "textarea" || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight" && current < total) go(current + 1);
    if (e.key === "ArrowLeft" && current > 1) go(current - 1);
  });

  window.addEventListener("hashchange", function () {
    var n = stepFromHash();
    if (n && n !== current) go(n);
  });

  // reveal-answer buttons (delegated, since lesson HTML is re-rendered)
  el.lesson.addEventListener("click", function (e) {
    var btn = e.target.closest(".reveal");
    if (!btn) return;
    var ans = document.getElementById(btn.getAttribute("aria-controls"));
    var open = ans.hidden;
    ans.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Hide answer" : "Reveal answer";
  });

  // ---------- widgets ----------

  function cellsHtml(pos) {
    var h = '<div class="cells" aria-hidden="true">';
    h += cell("start", "before", pos === -1, true);
    ITEMS.forEach(function (v, i) { h += cell(String(v), "[" + i + "]", pos === i, false); });
    h += cell("end", "past end", pos >= ITEMS.length, true);
    return h + "</div>";
  }
  function cell(label, idx, here, slot) {
    return '<div class="cell' + (slot ? " slot" : "") + (here ? " here" : "") + '">' +
      '<span class="idx">' + idx + '</span><span class="box">' + label + "</span>" +
      '<span class="caret">' + (here ? "▲" : "") + "</span></div>";
  }
  function currentText(pos) {
    if (pos < 0 || pos >= ITEMS.length) return "throws IndexOutOfRangeException";
    return String(ITEMS[pos]);
  }

  function mountWidget(cfg) {
    var host = document.getElementById("widget");
    if (!host || !cfg) return;
    if (cfg.type === "walker") mountWalkers(host, cfg.walkers);
    if (cfg.type === "loop") mountLoop(host);
  }

  function mountWalkers(host, names) {
    var state = names.map(function (name) { return { name: name, pos: -1, log: "" }; });
    host.innerHTML = '<p class="widget-title">' + (names.length > 1
      ? "Two walkers from the same MyNumbers. Move them independently."
      : "A NumberWalker over 10, 20, 30. Call its members and watch _position.") + "</p>" +
      state.map(function (_, i) { return '<div class="walker" data-i="' + i + '"></div>'; }).join("");

    function draw(i) {
      var s = state[i];
      var node = host.querySelector('.walker[data-i="' + i + '"]');
      node.innerHTML =
        '<div class="walker-name">' + s.name + "</div>" +
        cellsHtml(s.pos) +
        '<div class="walker-state">_position = <b>' + s.pos + "</b></div>" +
        '<div class="walker-controls">' +
        '<button class="btn btn-small btn-code" data-act="move" type="button">' + s.name + ".MoveNext()</button>" +
        '<button class="btn btn-small btn-code" data-act="current" type="button">' + s.name + ".Current</button>" +
        '<button class="btn btn-small" data-act="new" type="button">New walker</button>' +
        "</div>" +
        '<div class="log" aria-live="polite">' + s.log + "</div>";
    }

    host.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var i = parseInt(btn.closest(".walker").dataset.i, 10);
      var s = state[i];
      var act = btn.dataset.act;
      if (act === "move") {
        s.pos++;
        var ok = s.pos < ITEMS.length;
        s.log = s.name + ".MoveNext() → <span class=\"" + (ok ? "t" : "f") + "\">" + ok + "</span>";
      } else if (act === "current") {
        var v = currentText(s.pos);
        s.log = s.name + ".Current → <span class=\"" + (/throws/.test(v) ? "f" : "t") + "\">" + v + "</span>";
      } else {
        s.pos = -1;
        s.log = "GetWalker() → fresh walker, _position = -1";
      }
      draw(i);
      var again = host.querySelector('.walker[data-i="' + i + '"] button[data-act="' + act + '"]');
      if (again) again.focus();
    });

    state.forEach(function (_, i) { draw(i); });
  }

  function mountLoop(host) {
    var lines = [
      "var numbers = new MyNumbers();",
      "var enumerator = numbers.GetEnumerator();",
      "while (enumerator.MoveNext())",
      "{",
      "    Console.WriteLine(enumerator.Current);",
      "}"
    ];

    // Build the trace: each entry is one thing the program does.
    var trace = [
      { line: 0, pos: null, out: [], note: "Create the collection. No walker exists yet." },
      { line: 1, pos: -1, out: [], note: "<code>GetEnumerator()</code> returns a fresh walker. <code>_position = -1</code> (before start)." }
    ];
    var out = [];
    for (var p = 0; p <= ITEMS.length; p++) {
      var ok = p < ITEMS.length;
      trace.push({ line: 2, pos: p, out: out.slice(), note: "<code>MoveNext()</code>: _position → " + p + ". " + p + " &lt; 3 is <b>" + ok + "</b>." +
        (ok ? " Enter the loop body." : " Loop exits.") });
      if (ok) {
        out.push(String(ITEMS[p]));
        trace.push({ line: 4, pos: p, out: out.slice(), note: "<code>Current</code> → _items[" + p + "] = <b>" + ITEMS[p] + "</b>. Printed." });
      }
    }
    trace.push({ line: 5, pos: ITEMS.length, out: out.slice(), note: "Done. The walker is exhausted; to walk again, call <code>GetEnumerator()</code> for a new one." });

    var i = 0;
    function draw() {
      var t = trace[i];
      host.innerHTML =
        '<p class="widget-title">Step through the loop one call at a time.</p>' +
        '<pre class="code trace-code"><code>' + lines.map(function (l, k) {
          return '<span class="line' + (k === t.line ? " active" : "") + '">' + highlightCSharp(l) + "</span>";
        }).join("\n") + "</code></pre>" +
        (t.pos === null ? '<div class="walker-state">no walker yet</div>'
          : cellsHtml(t.pos) + '<div class="walker-state">_position = <b>' + t.pos + "</b></div>") +
        '<p class="trace-note">' + t.note + "</p>" +
        '<div class="console"><span class="prompt">console&gt;</span>' + (t.out.length ? "\n" + t.out.join("\n") : "") + "</div>" +
        '<div class="walker-controls">' +
        '<button class="btn btn-small" data-act="back" type="button"' + (i === 0 ? " disabled" : "") + ">&larr; Back</button>" +
        '<button class="btn btn-small btn-primary" data-act="step" type="button"' + (i === trace.length - 1 ? " disabled" : "") + ">Step &rarr;</button>" +
        '<button class="btn btn-small" data-act="restart" type="button">Restart</button>' +
        '<span class="counter" style="align-self:center">' + (i + 1) + " / " + trace.length + "</span>" +
        "</div>";
    }
    host.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var act = btn.dataset.act;
      if (act === "step" && i < trace.length - 1) i++;
      if (act === "back" && i > 0) i--;
      if (act === "restart") i = 0;
      draw();
      var again = host.querySelector('button[data-act="' + act + '"]:not(:disabled)') ||
        host.querySelector('button[data-act="restart"]');
      again.focus();
    });
    draw();
  }

  // ---------- boot ----------

  el.jump.innerHTML = lessons.map(function (l, k) {
    return '<option value="' + (k + 1) + '">' + (l.summary ? "Summary" : (k + 1) + ". " + escapeHtml(l.title)) + "</option>";
  }).join("");

  go(stepFromHash() || loadStep() || 1, { instant: true });
})();
