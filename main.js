/* ============================================================
   Nangili Chandra Sekhar — portfolio interactions
   - 3D "SDM core lattice" hero (Three.js)
   - mobile nav, scroll reveal, active section, copy-to-clipboard
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     1. Hero scene — subscriber data lattice
     ========================================================= */
  function initScene() {
    var canvas = document.getElementById("scene");
    var stage = document.getElementById("stage");
    if (!canvas || !stage || !window.THREE) {
      if (stage) stage.classList.add("no-webgl");
      return;
    }

    var THREE = window.THREE;
    var renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (err) {
      stage.classList.add("no-webgl");
      return;
    }

    var INK = 0x0f5f52;
    var LEAF = 0x17806e;
    var AMBER = 0xa9511f;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    var root = new THREE.Group();
    root.rotation.z = -0.14;
    scene.add(root);

    /* ---------- round sprite for points ---------- */
    function dotTexture() {
      var size = 64;
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var g = c.getContext("2d");
      var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, "rgba(15,95,82,1)");
      grd.addColorStop(0.55, "rgba(15,95,82,0.85)");
      grd.addColorStop(1, "rgba(15,95,82,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }

    /* ---------- node cloud on a sphere ---------- */
    var R = 2.45;
    var COUNT = 150;
    var points = [];
    var golden = Math.PI * (3 - Math.sqrt(5));

    for (var i = 0; i < COUNT; i++) {
      var y = 1 - (i / (COUNT - 1)) * 2;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = golden * i;
      var jitter = 0.94 + Math.random() * 0.1;
      points.push(new THREE.Vector3(
        Math.cos(theta) * r * R * jitter,
        y * R * jitter,
        Math.sin(theta) * r * R * jitter
      ));
    }

    var dotGeo = new THREE.BufferGeometry().setFromPoints(points);
    var dotMat = new THREE.PointsMaterial({
      size: 0.115,
      map: dotTexture(),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      sizeAttenuation: true
    });
    root.add(new THREE.Points(dotGeo, dotMat));

    /* ---------- edges between nearby nodes ---------- */
    var segs = [];
    var pulseEdges = [];
    var MAX = 0.95;

    for (var a = 0; a < points.length; a++) {
      var links = 0;
      for (var b = a + 1; b < points.length && links < 3; b++) {
        var d = points[a].distanceTo(points[b]);
        if (d < MAX) {
          segs.push(points[a].x, points[a].y, points[a].z, points[b].x, points[b].y, points[b].z);
          pulseEdges.push([points[a], points[b]]);
          links++;
        }
      }
    }

    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    var lineMat = new THREE.LineBasicMaterial({
      color: LEAF,
      transparent: true,
      opacity: 0.16
    });
    root.add(new THREE.LineSegments(lineGeo, lineMat));

    /* ---------- inner core ---------- */
    var core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.92, 1),
      new THREE.MeshBasicMaterial({
        color: INK,
        wireframe: true,
        transparent: true,
        opacity: 0.13
      })
    );
    root.add(core);

    var coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 24, 24),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.07 })
    );
    root.add(coreGlow);

    /* ---------- orbit rings ---------- */
    var ringGroup = new THREE.Group();
    root.add(ringGroup);
    var ringSpecs = [
      { r: 3.05, tilt: 0.42, roll: 0.2, op: 0.26 },
      { r: 3.42, tilt: -0.62, roll: 0.9, op: 0.16 },
      { r: 3.78, tilt: 1.12, roll: -0.4, op: 0.1 }
    ];

    ringSpecs.forEach(function (spec) {
      var curve = new THREE.EllipseCurve(0, 0, spec.r, spec.r, 0, Math.PI * 2, false, 0);
      var pts = curve.getPoints(160).map(function (p) {
        return new THREE.Vector3(p.x, p.y, 0);
      });
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var mat = new THREE.LineBasicMaterial({
        color: INK,
        transparent: true,
        opacity: spec.op
      });
      var ring = new THREE.LineLoop(geo, mat);
      ring.rotation.x = spec.tilt;
      ring.rotation.y = spec.roll;
      ringGroup.add(ring);
    });

    /* ---------- travelling signal pulses ---------- */
    var pulses = [];
    var PULSES = 9;

    for (var p = 0; p < PULSES; p++) {
      var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 10, 10),
        new THREE.MeshBasicMaterial({ color: p % 3 === 0 ? AMBER : LEAF })
      );
      var edge = pulseEdges[Math.floor(Math.random() * pulseEdges.length)];
      if (!edge) continue;
      mesh.userData = {
        from: edge[0].clone(),
        to: edge[1].clone(),
        t: Math.random(),
        speed: 0.0022 + Math.random() * 0.0042
      };
      pulses.push(mesh);
      root.add(mesh);
    }

    /* ---------- pointer + scroll response ---------- */
    var pointer = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var scrollTilt = 0;

    if (!reduceMotion) {
      window.addEventListener("pointermove", function (e) {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });

      window.addEventListener("scroll", function () {
        scrollTilt = Math.min(window.pageYOffset / 900, 1);
      }, { passive: true });
    }

    /* ---------- sizing ---------- */
    function resize() {
      var w = stage.clientWidth;
      var h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    else window.addEventListener("resize", resize);

    /* ---------- pause when off-screen ---------- */
    var running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(stage);
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) running = running || true;
    });

    /* ---------- animation ---------- */
    var clock = new THREE.Clock();

    function frame() {
      requestAnimationFrame(frame);
      if (!running) return;

      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;

      if (!reduceMotion) {
        target.x += (pointer.y * 0.16 - target.x) * 0.05;
        target.y += (pointer.x * 0.22 - target.y) * 0.05;

        root.rotation.y += dt * 0.14;
        root.rotation.x = target.x + Math.sin(t * 0.3) * 0.04 + scrollTilt * 0.16;
        root.rotation.y += target.y * dt;

        ringGroup.rotation.z += dt * 0.05;
        ringGroup.rotation.x = Math.sin(t * 0.22) * 0.08 - scrollTilt * 0.1;

        core.rotation.y -= dt * 0.3;
        core.rotation.x += dt * 0.12;

        pulses.forEach(function (mesh) {
          var u = mesh.userData;
          u.t += u.speed;
          if (u.t > 1) {
            u.t = 0;
            var next = pulseEdges[Math.floor(Math.random() * pulseEdges.length)];
            if (next) { u.from.copy(next[0]); u.to.copy(next[1]); }
          }
          mesh.position.lerpVectors(u.from, u.to, u.t);
          var s = 0.65 + Math.sin(u.t * Math.PI) * 0.7;
          mesh.scale.setScalar(s);
        });
      }

      renderer.render(scene, camera);
    }

    frame();
  }

  /* =========================================================
     2. Contact scene — open channel beacon
     ========================================================= */
  function initContactScene() {
    var canvas = document.getElementById("contact-scene");
    var stage = document.getElementById("contact-stage");
    if (!canvas || !stage || !window.THREE) return;

    var THREE = window.THREE;
    var renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "low-power"
      });
    } catch (err) {
      return;
    }

    var MINT = 0x7fd6c2;
    var PAPER = 0xf6f4ef;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7.9);

    var root = new THREE.Group();
    root.rotation.z = -0.18;
    scene.add(root);

    var globe = new THREE.Group();
    root.add(globe);

    var R = 1.95;
    var lineMat = new THREE.LineBasicMaterial({
      color: MINT,
      transparent: true,
      opacity: 0.2
    });

    /* latitudes */
    for (var i = 1; i < 10; i++) {
      var phi = (i / 10) * Math.PI;
      var y = Math.cos(phi) * R;
      var rr = Math.sin(phi) * R;
      var lat = [];
      for (var a = 0; a <= 72; a++) {
        var t = (a / 72) * Math.PI * 2;
        lat.push(new THREE.Vector3(Math.cos(t) * rr, y, Math.sin(t) * rr));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lat), lineMat));
    }

    /* meridians */
    for (var m = 0; m < 8; m++) {
      var theta = (m / 8) * Math.PI * 2;
      var lon = [];
      for (var b = 0; b <= 72; b++) {
        var ph = (b / 72) * Math.PI;
        lon.push(new THREE.Vector3(
          Math.cos(theta) * Math.sin(ph) * R,
          Math.cos(ph) * R,
          Math.sin(theta) * Math.sin(ph) * R
        ));
      }
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lon), lineMat));
    }

    /* nodes sitting on the sphere */
    var nodes = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    var N = 70;
    for (var k = 0; k < N; k++) {
      var yy = 1 - (k / (N - 1)) * 2;
      var rad = Math.sqrt(Math.max(0, 1 - yy * yy));
      var ang = golden * k;
      nodes.push(new THREE.Vector3(
        Math.cos(ang) * rad * R * 1.01,
        yy * R * 1.01,
        Math.sin(ang) * rad * R * 1.01
      ));
    }

    var nodeGeo = new THREE.BufferGeometry().setFromPoints(nodes);
    globe.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({
      color: MINT,
      size: 0.075,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true
    })));

    /* core */
    var core = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 20),
      new THREE.MeshBasicMaterial({ color: PAPER })
    );
    root.add(core);

    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 20, 20),
      new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.1, depthWrite: false })
    );
    root.add(glow);

    /* expanding signal rings */
    var pulseRings = [];
    for (var p = 0; p < 3; p++) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(0.995, 1, 96),
        new THREE.MeshBasicMaterial({
          color: MINT,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = 0.22;
      ring.userData.offset = p / 3;
      pulseRings.push(ring);
      root.add(ring);
    }

    /* sizing */
    function resize() {
      var w = stage.clientWidth;
      var h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    else window.addEventListener("resize", resize);

    /* pause when out of view */
    var running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(stage);
    }

    var clock = new THREE.Clock();

    function frame() {
      requestAnimationFrame(frame);
      if (!running) return;

      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;

      if (!reduceMotion) {
        root.rotation.y += dt * 0.09;
        root.rotation.x = Math.sin(t * 0.28) * 0.06;
        globe.rotation.y -= dt * 0.05;
        core.scale.setScalar(0.9 + Math.sin(t * 1.6) * 0.1);
        glow.scale.setScalar(1 + Math.sin(t * 1.6) * 0.06);

        pulseRings.forEach(function (ring) {
          var phase = (t * 0.24 + ring.userData.offset) % 1;
          ring.scale.setScalar(0.35 + phase * 1.75);
          ring.material.opacity = 0.3 * (1 - phase) * (1 - phase);
        });
      }

      renderer.render(scene, camera);
    }

    frame();
  }

  /* =========================================================
     3. Year
     ========================================================= */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     4. Mobile navigation
     ========================================================= */
  var rail = document.getElementById("rail");
  var toggle = document.getElementById("nav-toggle");

  function closeNav() {
    if (!rail || !toggle) return;
    rail.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (rail && toggle) {
    toggle.addEventListener("click", function () {
      var open = rail.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    rail.querySelectorAll(".rail-nav a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    document.addEventListener("click", function (e) {
      if (!rail.classList.contains("is-open")) return;
      if (!rail.contains(e.target)) closeNav();
    });
  }

  /* =========================================================
     5. Reveal on scroll
     ========================================================= */
  var revealables = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* =========================================================
     6. Active section in the sidebar
     ========================================================= */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".rail-nav a"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      return id && id.length > 1 ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    var visible = new Map();

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      });

      var best = null;
      var bestRatio = 0;
      visible.forEach(function (ratio, id) {
        if (ratio >= bestRatio) { bestRatio = ratio; best = id; }
      });

      if (best) setActive(best);
    }, {
      rootMargin: "-18% 0px -55% 0px",
      threshold: [0.05, 0.25, 0.5, 0.75]
    });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* =========================================================
     7. Copy to clipboard
     ========================================================= */
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    var original = button.textContent;

    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";

      function done() {
        button.classList.add("is-done");
        button.textContent = "Copied to clipboard";
        window.setTimeout(function () {
          button.classList.remove("is-done");
          button.textContent = original;
        }, 2200);
      }

      function fallback() {
        var input = document.createElement("textarea");
        input.value = value;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        try { document.execCommand("copy"); } catch (err) { /* ignore */ }
        document.body.removeChild(input);
        done();
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done, fallback);
      } else {
        fallback();
      }
    });
  });

  /* =========================================================
     7b. Contact links - never a dead click
     ========================================================= */
  function copySilently(value) {
    function legacy() {
      var input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.top = "-1000px";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try { document.execCommand("copy"); } catch (err) { /* ignore */ }
      document.body.removeChild(input);
    }

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).catch(legacy);
    }
    legacy();
    return Promise.resolve();
  }

  function flashLink(link, message) {
    var value = link.querySelector(".cl-value");
    if (!value) return;
    if (!value.dataset.original) value.dataset.original = value.textContent;
    value.textContent = message;
    link.classList.add("is-done");
    window.clearTimeout(link.flashTimer);
    link.flashTimer = window.setTimeout(function () {
      value.textContent = value.dataset.original;
      link.classList.remove("is-done");
    }, 2600);
  }

  document.querySelectorAll("a.contact-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;

      var href = link.getAttribute("href") || "";
      var isMail = href.indexOf("mailto:") === 0;
      var isTel = href.indexOf("tel:") === 0;

      // Email / phone: let the mail or dialler app open, and copy as a backup.
      if (isMail || isTel) {
        var value = href.replace(/^mailto:/i, "").replace(/^tel:/i, "").split("?")[0];
        copySilently(value);
        flashLink(link, "Copied — " + value);
        return;
      }

      // External profile: open a tab; if that is blocked, navigate in this
      // tab; if even that is blocked, copy the link so the click still helps.
      if (/^https?:/i.test(href)) {
        e.preventDefault();

        var win = null;
        try {
          // No "noopener" feature string: with it window.open() returns null
          // even on success. Detach the opener on the window instead.
          win = window.open(href, "_blank");
          if (win) win.opener = null;
        } catch (err) {
          win = null;
        }

        if (win) return;

        var here = window.location.href;
        try { window.location.href = href; } catch (err2) { /* sandboxed */ }

        window.setTimeout(function () {
          if (window.location.href !== here) return;
          copySilently(href);
          flashLink(link, "Link copied — paste in your browser");
        }, 700);
      }
    });
  });

  /* =========================================================
     8. Smooth anchors with sticky-header offset
     ========================================================= */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var targetEl = document.querySelector(id);
      if (!targetEl) return;

      e.preventDefault();
      var headerOffset = window.innerWidth <= 900 ? 76 : 0;
      var top = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: top,
        behavior: reduceMotion ? "auto" : "smooth"
      });

      if (history.replaceState) history.replaceState(null, "", id);
    });
  });

  /* =========================================================
     boot
     ========================================================= */
  function boot() {
    initScene();
    initContactScene();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
