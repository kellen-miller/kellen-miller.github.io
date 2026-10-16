// Shared isometric drawing kit for the theme variants.
// Every object is drawn in garage world coordinates (u, v = floor, z = height),
// so the same function draws it in the full scene or alone in a vignette.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = { line: "var(--il-line)", top: "var(--il-top)", left: "var(--il-left)", right: "var(--il-right)", dark: "var(--il-dark)", acc: "var(--acc)", mute: "var(--mute)", faint: "var(--faint)", ink: "var(--ink)", bg: "var(--bg)" };
  const NSS = { "vector-effect": "non-scaling-stroke" };
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const sty = (fill, stroke, w) => `fill:${fill};stroke:${stroke || "none"};stroke-width:${w || 0};stroke-linejoin:round`;
  const rect = (g, x, y, w, h, fill, stroke, sw) => el("rect", Object.assign({ x, y, width: w, height: h, style: sty(fill, stroke, sw) }, NSS), g);
  const line = (g, x1, y1, x2, y2, stroke, sw) => el("line", Object.assign({ x1, y1, x2, y2, style: `stroke:${stroke};stroke-width:${sw || 1}` }, NSS), g);
  const text = (g, x, y, s, attrs) => { const n = el("text", Object.assign({ x, y }, attrs), g); n.textContent = s; return n; };
  const circle = (g, cx, cy, r, style) => el("circle", Object.assign({ cx, cy, r, style }, NSS), g);
  const path = (g, d, style) => el("path", Object.assign({ d, style }, NSS), g);
  const small = (g, x, y, s, size, fill) => text(g, x, y, s, { style: `fill:${fill || "var(--mute)"};font:500 ${size}px var(--mono)` });

  // Isometric context: k = scale, (ox, oy) = screen position of the world origin.
  function Iso(svg, k, ox, oy, lw) {
    lw = lw || 1.1;
    const P = (u, v, z) => [ox + (u - v) * .866 * k, oy + ((u + v) * .5 - (z || 0)) * k];
    const pts = a => a.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ");
    return {
      svg, k, P,
      box(u, v, w, d, z0, h, f) {
        f = f || {};
        const z1 = z0 + h, g = el("g", {}, svg);
        el("polygon", { points: pts([P(u, v + d, z0), P(u + w, v + d, z0), P(u + w, v + d, z1), P(u, v + d, z1)]), style: sty(f.left || C.left, C.line, lw) }, g);
        el("polygon", { points: pts([P(u + w, v, z0), P(u + w, v + d, z0), P(u + w, v + d, z1), P(u + w, v, z1)]), style: sty(f.right || C.right, C.line, lw) }, g);
        el("polygon", { points: pts([P(u, v, z1), P(u + w, v, z1), P(u + w, v + d, z1), P(u, v + d, z1)]), style: sty(f.top || C.top, C.line, lw) }, g);
        return g;
      },
      poly(arr, fill, stroke, w) { return el("polygon", { points: pts(arr), style: sty(fill, stroke, w) }, svg); },
      faceL(u, v, z) { const [x, y] = P(u, v, z); return el("g", { transform: `matrix(${.866 * k} ${.5 * k} 0 ${k} ${x} ${y})` }, svg); },
      faceR(u, v, z) { const [x, y] = P(u, v, z); return el("g", { transform: `matrix(${.866 * k} ${-.5 * k} 0 ${k} ${x} ${y})` }, svg); },
      floor(u, v, z) { const [x, y] = P(u, v, z); return el("g", { transform: `matrix(${.866 * k} ${.5 * k} ${-.866 * k} ${.5 * k} ${x} ${y})` }, svg); },
      cyl(u, v, z0, r, h, side, top) {
        const [cx, cyb] = P(u, v, z0), cyt = cyb - h * k, rx = r * 1.2247 * k, ry = r * .7071 * k, g = el("g", {}, svg);
        el("path", { d: `M${cx - rx},${cyt}V${cyb}A${rx},${ry} 0 0 0 ${cx + rx},${cyb}V${cyt}Z`, style: sty(side, C.line, lw) }, g);
        el("ellipse", { cx, cy: cyt, rx, ry, style: sty(top, C.line, lw) }, g);
        return { g, cx, cy: cyt, rx, ry };
      },
      tire(u, v, z0, r, h) {
        const t = this.cyl(u, v, z0, r, h, C.right, C.top);
        el("path", { d: `M${t.cx - t.rx},${t.cy + h * k * .5}A${t.rx},${t.ry} 0 0 0 ${t.cx + t.rx},${t.cy + h * k * .5}`, style: sty("none", C.dark, 1) }, t.g);
        el("ellipse", { cx: t.cx, cy: t.cy, rx: t.rx * .8, ry: t.ry * .8, style: sty("none", C.acc, 1.6) }, t.g);
        el("ellipse", { cx: t.cx, cy: t.cy, rx: t.rx * .56, ry: t.ry * .56, style: sty(C.left, C.line, .8) }, t.g);
        el("ellipse", { cx: t.cx, cy: t.cy + 1, rx: t.rx * .22, ry: t.ry * .22, style: sty(C.dark, C.line, .6) }, t.g);
        return t;
      }
    };
  }

  // Iso context whose world point (u, v, z) lands at screen (cx, cy).
  function IsoAt(svg, k, u, v, z, cx, cy, lw) {
    return Iso(svg, k, cx - (u - v) * .866 * k, cy - ((u + v) * .5 - z) * k, lw);
  }

  // ───────── Objects (world coordinates) ─────────
  const obj = {
    room(I, o) {
      o = o || {};
      const P = I.P;
      I.box(0, 0, 380, 240, -14, 14, { top: "var(--il-floor, var(--il-left))", left: C.right, right: C.dark });
      const fl = I.floor(0, 0, 0);
      for (let u = 40; u < 380; u += 40) line(fl, u, 0, u, 240, "var(--il-top)", 1);
      for (let v = 40; v < 240; v += 40) line(fl, 0, v, 380, v, "var(--il-top)", 1);
      if (o.pitbox !== false) {
        rect(fl, 132, 150, 160, 82, "none", C.acc, 1.8);
        [[132, 150], [292, 150], [132, 232], [292, 232]].forEach(([u, v]) => { line(fl, u - 8, v, u + 8, v, C.acc, 1.8); line(fl, u, v - 8, u, v + 8, C.acc, 1.8); });
      }
      I.poly([P(0, 0, 0), P(380, 0, 0), P(380, 0, 72), P(270, 0, 72), P(270, 0, 150), P(0, 0, 150)], C.bg, C.line, 1.1);
      I.poly([P(0, 0, 0), P(0, 240, 0), P(0, 240, 72), P(0, 170, 72), P(0, 170, 150), P(0, 0, 150)], "var(--il-dark)", C.line, 1.1);
    },
    shutter(I) {
      const sh = I.faceL(130, 0, 112);
      rect(sh, 0, 0, 112, 112, C.dark, C.line, 1.1);
      rect(sh, 0, 0, 112, 60, "var(--il-top)", C.line, 1.1);
      for (let y = 6; y < 60; y += 6) line(sh, 0, y, 112, y, "var(--il-left)", 1);
    },
    // skills: tool pegboard on the back wall
    skills(I) {
      const pg = I.faceL(18, 0, 140);
      rect(pg, 0, 0, 92, 66, "var(--il-left)", C.line, 1.1);
      for (let x = 6; x < 92; x += 8) for (let y = 6; y < 66; y += 8) circle(pg, x, y, .7, "fill:var(--il-top)");
      const tool = (d, acc) => path(pg, d, `fill:${acc ? "none" : "var(--il-top)"};stroke:${acc ? "var(--acc)" : "var(--il-line)"};stroke-width:1.1`);
      tool("M8,8 h6 v14 h-1.5 v26 h-3 v-26 h-1.5 z");
      tool("M20,10 a6,6 0 1 1 10,0 l-3,3 v34 h-4 v-34 z M23,6 v5 h4 v-5", true);
      line(pg, 36, 12, 76, 12, "var(--il-line)", 1.1);
      [3, 3.6, 4.2, 4.8, 5.4].forEach((r, i) => circle(pg, 39 + i * 8.6, 18, r, "fill:var(--il-top);stroke:var(--il-line);stroke-width:1"));
      circle(pg, 50, 40, 9, "fill:none;stroke:var(--il-line);stroke-width:2.4");
      circle(pg, 50, 40, 5, "fill:none;stroke:var(--il-line);stroke-width:1.2");
      path(pg, "M64,30 h12 v4 h-12 z M66,34 v14 h8 v-14", "fill:var(--il-top);stroke:var(--il-line);stroke-width:1.1");
      rect(pg, 80, 8, 6, 42, "none", "var(--faint)", 1);
    },
    // venae-machinae: wiring harness on a board on the left wall
    venae(I) {
      const hb = I.faceR(0, 158, 138);
      rect(hb, 0, 0, 112, 70, "var(--il-left)", C.line, 1.1);
      path(hb, "M8,36 C30,36 40,30 56,30 S90,24 104,16", "fill:none;stroke:var(--il-line);stroke-width:2.6");
      path(hb, "M56,30 C64,40 70,52 92,56", "fill:none;stroke:var(--il-line);stroke-width:1.6");
      path(hb, "M34,33 C34,46 26,54 16,58", "fill:none;stroke:var(--acc);stroke-width:1.4");
      path(hb, "M78,27 C80,16 86,10 96,8", "fill:none;stroke:var(--acc);stroke-width:1.4");
      [[4, 33], [100, 13], [88, 53], [12, 55], [93, 5]].forEach(([x, y]) => rect(hb, x, y, 7, 6, C.dark, C.line, .9));
      [[20, 35], [46, 31], [70, 28]].forEach(([x, y]) => circle(hb, x, y, 1.6, "fill:var(--faint)"));
    },
    tires(I) { for (let i = 0; i < 3; i++) I.tire(198, 40, i * 13, 22, 13); },
    pitboard(I) {
      I.box(66, 206, 4, 4, 0, 40);
      I.box(40, 208, 56, 3, 40, 56, { left: C.dark });
      const pb = I.faceL(40, 211, 96);
      text(pb, 6, 22, "P1", { style: "fill:var(--acc);font:800 20px var(--wide);font-stretch:125%" });
      text(pb, 6, 36, "KM", { style: "fill:var(--ink);font:700 11px var(--wide);font-stretch:125%" });
      small(pb, 6, 49, "L14  +0.3", 8);
    },
    bench(I) {
      I.box(250, 8, 112, 50, 0, 46);
      const bf = I.faceL(250, 58, 46);
      rect(bf, 6, 6, 46, 14, "none", C.line, .8); rect(bf, 60, 6, 46, 14, "none", C.line, .8);
      line(bf, 25, 13, 33, 13, C.line, 1.4); line(bf, 79, 13, 87, 13, C.line, 1.4);
      I.cyl(350, 30, 46, 5, 9, C.right, C.dark);
    },
    // deburr: bench grinder throwing sparks (sits on the bench, z = 46)
    deburr(I) {
      const wheel = u => { const g = I.faceR(u, 46, 70); circle(g, 12, 12, 11, "fill:var(--il-top);stroke:var(--il-line);stroke-width:1.1"); circle(g, 12, 12, 3, "fill:var(--il-dark);stroke:var(--il-line);stroke-width:.8"); return g; };
      wheel(282);
      I.box(288, 26, 30, 20, 46, 16);
      I.box(296, 30, 14, 12, 46, 4, { top: "var(--il-left)" });
      const w2 = wheel(324);
      ["M22,20 l14,6", "M23,22 l10,10", "M21,23 l6,12", "M24,18 l16,1"].forEach((d, i) => path(w2, d, "fill:none;stroke:var(--acc);stroke-width:1.1;stroke-linecap:round").setAttribute("class", "spark s" + i));
    },
    // sup: tool chest with drawers named after update jobs
    sup(I) {
      I.box(256, 104, 52, 40, 0, 62);
      const tc = I.faceL(256, 144, 62);
      ["brew", "rustup", "skills", "uv", "mas"].forEach((job, i) => {
        rect(tc, 4, 4 + i * 11, 44, 9, "none", C.line, .8);
        small(tc, 7, 10.6 + i * 11, job, 4.6, i === 1 ? "var(--acc)" : "var(--mute)");
        line(tc, 34, 8.5 + i * 11, 44, 8.5 + i * 11, "var(--il-line)", 1.2);
      });
    },
    // chief: pit radio + headset (sits on the tool chest, z = 62)
    chief(I) {
      const P = I.P;
      I.box(268, 112, 24, 18, 62, 14);
      const rf = I.faceL(268, 130, 76);
      const h = [1, 3, 5, 2, 6, 4, 2, 5, 1];
      for (let i = 0; i < 9; i++) line(rf, 3 + i * 2, 7 - h[i], 3 + i * 2, 7 + h[i], i === 4 ? "var(--acc)" : "var(--il-line)", 1);
      circle(rf, 20, 7, 2.6, "fill:none;stroke:var(--il-line);stroke-width:1");
      const [x, y] = P(288, 114, 76), s = I.k / 1.15;
      el("line", { x1: x, y1: y, x2: x, y2: y - 34 * s, style: "stroke:var(--il-line);stroke-width:1.2" }, I.svg);
      el("circle", { cx: x, cy: y - 34 * s, r: 2.2, class: "led", style: "fill:var(--acc)" }, I.svg);
      const [hx, hy] = P(300, 136, 62);
      el("path", { d: `M${hx - 8 * s},${hy}a${8 * s},${8 * s} 0 0 1 ${16 * s},0`, style: "fill:none;stroke:var(--il-line);stroke-width:1.6" }, I.svg);
      [-8, 8].forEach(dx => el("ellipse", { cx: hx + dx * s, cy: hy + 1, rx: 3 * s, ry: 4 * s, style: "fill:var(--il-top);stroke:var(--il-line);stroke-width:1" }, I.svg));
    },
    // celerity: rotary engine on a stand, wired to its duct controller
    celerity(I) {
      const cab = I.floor(0, 0, 0);
      path(cab, "M150,198 C166,198 170,206 186,206", "fill:none;stroke:var(--il-line);stroke-width:1.4");
      I.box(132, 188, 20, 16, 0, 10);
      { const f = I.faceL(132, 204, 10); circle(f, 5, 5, 1.4, "fill:var(--acc)"); line(f, 9, 5, 17, 5, "var(--faint)", 1); }
      I.box(178, 190, 54, 6, 0, 4);
      I.box(202, 168, 6, 50, 0, 4);
      I.box(202, 190, 6, 6, 4, 40);
      const troch = (cx, cy, R, e) => { let d = ""; for (let i = 0; i <= 72; i++) { const t = i / 72 * Math.PI * 2, x = cx + R * Math.cos(t) + e * Math.cos(3 * t), y = cy + R * .78 * Math.sin(t) + e * Math.sin(3 * t); d += (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2); } return d + "Z"; };
      [[178, 4, "var(--il-left)"], [182, 9, "var(--il-top)"], [191, 3, "var(--il-left)"], [194, 9, "var(--il-top)"], [203, 4, "var(--il-left)"]].forEach(([v, t, fill]) => {
        for (const vv of [v, v + t]) { const f = I.faceL(178, vv, 84); path(f, troch(26, 26, 22, 3.2), `fill:${vv === v ? "var(--il-right)" : fill};stroke:var(--il-line);stroke-width:1`); }
      });
      const f = I.faceL(178, 207, 84);
      path(f, "M26,12 Q36,30 40,37 Q26,41 12,37 Q16,30 26,12 Z", "fill:none;stroke:var(--acc);stroke-width:1.5").setAttribute("class", "rotor");
      circle(f, 26, 30, 4, "fill:var(--il-dark);stroke:var(--il-line);stroke-width:1");
      circle(f, 26, 30, 1.2, "fill:var(--acc)");
      I.box(196, 186, 16, 14, 72, 8, { top: C.acc });
    }
  };

  // Where each project's object sits, for callouts and vignettes.
  const anchors = {
    celerity: { at: [196, 211, 40], center: [190, 196, 40] },
    venae: { at: [0, 100, 110], center: [0, 102, 103] },
    deburr: { at: [324, 34, 66], center: [304, 36, 58] },
    chief: { at: [288, 114, 108], center: [282, 124, 76] },
    sup: { at: [256, 140, 30], center: [282, 124, 31] },
    skills: { at: [80, 0, 120], center: [64, 0, 107] }
  };

  function garage(svg, opts) {
    opts = opts || {};
    const k = opts.k || 1.15, ox = opts.ox || 430, oy = opts.oy || 205;
    svg = el("g", { class: "art" }, svg);
    const I = Iso(svg, k, ox, oy);
    // each project object gets its own <g data-obj> so pages can highlight it
    const part = (name, fn) => fn(Iso(el("g", { "data-obj": name }, svg), k, ox, oy));
    obj.room(I, opts); part("skills", obj.skills); obj.shutter(I); part("venae", obj.venae);
    if (opts.tires !== false) obj.tires(I);
    if (opts.pitboard !== false) obj.pitboard(I);
    obj.bench(I); part("deburr", obj.deburr); part("sup", obj.sup); part("chief", obj.chief); part("celerity", obj.celerity);
    return I;
  }

  // One object alone on a small floor tile (or wall panel), centered in the svg.
  function vignette(svg, name, k) {
    const vb = svg.viewBox.baseVal, a = anchors[name].center;
    const I = IsoAt(el("g", { class: "art" }, svg), k, a[0], a[1], a[2], vb.x + vb.width / 2, vb.y + vb.height * .44);
    const tile = (u0, v0, w, d) => I.box(u0, v0, w, d, -6, 6, { top: "var(--il-floor, var(--il-left))", left: C.right, right: C.dark });
    if (name === "celerity") { tile(122, 160, 130, 72); obj.celerity(I); }
    if (name === "deburr") { I.box(268, 14, 76, 44, 0, 46); obj.deburr(I); }
    if (name === "sup") { tile(244, 92, 76, 64); obj.sup(I); }
    if (name === "chief") { I.box(258, 104, 46, 40, 40, 22); obj.chief(I); }
    if (name === "skills") { I.poly([I.P(8, 0, 0), I.P(120, 0, 0), I.P(120, 0, 150), I.P(8, 0, 150)], "var(--il-dark)", "var(--il-line)", 1.1); obj.skills(I); }
    if (name === "venae") { I.poly([I.P(0, 40, 0), I.P(0, 170, 0), I.P(0, 170, 150), I.P(0, 40, 150)], "var(--il-dark)", "var(--il-line)", 1.1); obj.venae(I); }
    return I;
  }

  window.KM = { NS, C, el, sty, rect, line, text, circle, path, small, Iso, IsoAt, obj, anchors, garage, vignette };
})();

// Real projects (public repos, commits by Kellen in the past year; chief capped at the 100-per-page API limit).
window.KM.projects = [
  { id: "celerity", n: "01", name: "celerity", lang: "Rust", commits: 14, object: "Rotary engine on a stand", desc: "Vehicle-control runtime and duct-controller firmware for my FD RX-7." },
  { id: "venae", n: "02", name: "venae-machinae", lang: "TypeScript", commits: 16, object: "Harness board", desc: "Wiring and fluid-system design for hobby car builds, without the CAD overhead." },
  { id: "deburr", n: "03", name: "deburr", lang: "Go", commits: 12, object: "Bench grinder", desc: "Deterministic reports that find the rough edges in Go and TypeScript code." },
  { id: "chief", n: "04", name: "chief", lang: "TypeScript", commits: 100, object: "Pit radio", desc: "A Discord chief of staff for a friends server, with voice, memory and a monthly budget." },
  { id: "sup", n: "05", name: "sup", lang: "Python", commits: 33, object: "Tool chest", desc: "One command that runs every local update job behind a live terminal dashboard." },
  { id: "skills", n: "06", name: "skills", lang: "Python", commits: 46, object: "Pegboard", desc: "My agent skills, versioned and synced to every coding agent on the machine." }
];
window.KM.posts = [
  { date: "Sep 30, 2026", iso: "2026-09-30", title: "Replacing Jekyll with Astro", tag: "web", desc: "Why the old theme went, how content collections replaced front-matter hacks, and what the build looks like now." },
  { date: "Sep 12, 2026", iso: "2026-09-12", title: "Context cancellation in Go, end to end", tag: "go", desc: "Following a request deadline from the HTTP handler to the database driver, and the two places it gets dropped." },
  { date: "Aug 21, 2026", iso: "2026-08-21", title: "Postgres advisory locks in practice", tag: "postgres", desc: "Leader election without adding another service to the stack." },
  { date: "Aug 02, 2026", iso: "2026-08-02", title: "Three mini PCs and a k3s cluster", tag: "homelab", desc: "What broke first, and what I'd buy again." }
];

// Recent build work: latest non-CI commit per project (from GitHub, Oct 2026).
window.KM.builds = [
  { id: "skills", date: "2026-10-15", msg: "Reduce skill router context" },
  { id: "sup", date: "2026-10-09", msg: "Clear stale GOROOT for gup updates" },
  { id: "chief", date: "2026-10-08", msg: "Replace deprecated SQLite installer" },
  { id: "celerity", date: "2026-10-06", msg: "Add Nexus telemetry reception over CAN" },
  { id: "deburr", date: "2026-10-05", msg: "Show audit progress, test TypeScript" },
  { id: "venae", date: "2026-09-02", msg: "Ship the Venae Machinae MVP" }
];
