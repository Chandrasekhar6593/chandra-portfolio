/* ============================================================
   Nangili Chandra Sekhar — portfolio interactions
   Scene: global telecom mesh — wireframe globe, roaming arcs,
   orbit rings and starfield.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. Hero 3D scene
     --------------------------------------------------------- */
  function initScene() {
    var canvas = document.getElementById("scene");
    if (!canvas || !window.THREE || reduceMotion) return;

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
      canvas.style.display = "none";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);
    if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(0, 0, 15.5);

    var clock = new THREE.Clock();

    var root = new THREE.Group();
    scene.add(root);

    var globeRoot = new THREE.Group();
    root.add(globeRoot);

    var globe = new THREE.Group();
    globeRoot.add(globe);

    var R = 2.4;

    /* ---------- soft halo behind the globe ---------- */
    function radialTexture() {
      var size = 256;
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var g = c.getContext("2d");
      var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, "rgba(90,255,232,0.85)");
      grd.addColorStop(0.18, "rgba(46,242,208,0.35)");
      grd.addColorStop(0.45, "rgba(79,140,255,0.14)");
      grd.addColorStop(0.75, "rgba(155,107,255,0.06)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }

    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.42
    }));
    halo.scale.set(9.5, 9.5, 1);
    halo.position.z = -1.2;
    globeRoot.add(halo);

    /* ---------- wireframe globe ---------- */
    var SEG = 128;

    var cyanLine = new THREE.LineBasicMaterial({
      color: 0x5cf7e0, transparent: true, opacity: 0.26,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    var blueLine = new THREE.LineBasicMaterial({
      color: 0x5f97ff, transparent: true, opacity: 0.36,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    // latitude circles
    [-60, -30, 0, 30, 60].forEach(function (lat, idx) {
      var phi = (lat * Math.PI) / 180;
      var r = Math.cos(phi) * R;
      var y = Math.sin(phi) * R;
      var pts = [];
      for (var s = 0; s <= SEG; s++) {
        var th = (s / SEG) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
      }
      globe.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        idx === 2 ? blueLine : cyanLine
      ));
    });

    // meridian great circles
    for (var m = 0; m < 6; m++) {
      var mpts = [];
      for (var s2 = 0; s2 <= SEG; s2++) {
        var t2 = (s2 / SEG) * Math.PI * 2;
        mpts.push(new THREE.Vector3(Math.cos(t2) * R, Math.sin(t2) * R, 0));
      }
      var mline = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(mpts),
        m % 3 === 0 ? blueLine : cyanLine
      );
      mline.rotation.y = (m / 6) * Math.PI;
      globe.add(mline);
    }

    // thin atmosphere shell
    var atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.06, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x2f88a8, transparent: true, opacity: 0.1,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    globe.add(atmo);

    /* ---------- roaming arcs with travelling pulses ---------- */
    var arcColors = [0x2ef2d0, 0x6fa8ff, 0x9b6bff, 0xd8fff8];
    var arcs = [];

    function surfacePoint(radius) {
      var u = Math.random() * 2 - 1;
      var th = Math.random() * Math.PI * 2;
      var s = Math.sqrt(Math.max(0, 1 - u * u));
      return new THREE.Vector3(Math.cos(th) * s * radius, u * radius, Math.sin(th) * s * radius);
    }

    var made = 0;
    var attempt = 0;
    while (made < 11 && attempt < 600) {
      attempt++;
      var a = surfacePoint(R);
      var b = surfacePoint(R);
      var dist = a.distanceTo(b);
      if (dist < 2.3) continue;

      var mid = a.clone().add(b).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(R + dist * 0.32);

      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));

      globe.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: arcColors[made % arcColors.length],
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })));

      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.048, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xeafffb, transparent: true, opacity: 0.95 })
      );
      globe.add(dot);

      arcs.push({
        curve: curve,
        dot: dot,
        t: Math.random(),
        speed: 0.05 + Math.random() * 0.07
      });
      made++;
    }

    /* ---------- orbit rings + satellites ---------- */
    var rings = [];
    [
      { r: 3.15, tilt: 1.15, rot: 0.4, color: 0x4f8cff },
      { r: 3.75, tilt: -0.72, rot: 1.2, color: 0x9b6bff },
      { r: 4.35, tilt: 0.45, rot: -0.7, color: 0x2ef2d0 }
    ].forEach(function (cfg, idx) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r, 0.0075, 6, 220),
        new THREE.MeshBasicMaterial({
          color: cfg.color, transparent: true, opacity: 0.36,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      ring.rotation.x = Math.PI / 2 + cfg.tilt;
      ring.rotation.z = cfg.rot;
      globeRoot.add(ring);

      var sat = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xd6fff7 })
      );
      ring.add(sat);

      rings.push({
        sat: sat,
        radius: cfg.r,
        speed: 0.22 + idx * 0.11,
        phase: idx * 2.1
      });
    });

    /* ---------- starfield ---------- */
    var STAR_COUNT = 1100;
    var starPositions = new Float32Array(STAR_COUNT * 3);
    for (var i = 0; i < STAR_COUNT; i++) {
      var d = 16 + Math.random() * 34;
      var v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize().multiplyScalar(d);
      starPositions[i * 3] = v.x;
      starPositions[i * 3 + 1] = v.y;
      starPositions[i * 3 + 2] = v.z;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xa9c2ef,
      size: 0.16,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    scene.add(stars);

    /* ---------- responsive framing ---------- */
    var hero = canvas.parentElement;

    function resize() {
      var w = hero.clientWidth || window.innerWidth;
      var h = hero.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      if (w >= 900) {
        globeRoot.position.set(3.7, 0, 0);
        globeRoot.scale.setScalar(1);
        camera.position.z = 15.5;
      } else {
        globeRoot.position.set(0, 1.4, -1.6);
        globeRoot.scale.setScalar(0.82);
        camera.position.z = 16.5;
      }
      camera.updateProjectionMatrix();
    }
    resize();

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(hero);
    } else {
      window.addEventListener("resize", resize);
    }

    /* ---------- pointer parallax ---------- */
    var pointer = { x: 0, y: 0 };
    var smooth = { x: 0, y: 0 };

    window.addEventListener("pointermove", function (e) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* ---------- loop ---------- */
    var running = false;
    var rafId = null;
    var visible = true;
    var spin = 0;

    function frame() {
      rafId = requestAnimationFrame(frame);

      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.getElapsedTime();

      smooth.x += (pointer.x - smooth.x) * 0.045;
      smooth.y += (pointer.y - smooth.y) * 0.045;

      spin += dt * 0.11;
      globe.rotation.y = spin;

      globeRoot.rotation.x = Math.sin(t * 0.2) * 0.07 + smooth.y * 0.2;
      globeRoot.rotation.z = Math.sin(t * 0.16) * 0.03;
      root.rotation.y = smooth.x * 0.28;

      for (var i = 0; i < arcs.length; i++) {
        var arc = arcs[i];
        arc.t += dt * arc.speed;
        if (arc.t > 1) arc.t -= 1;
        arc.dot.position.copy(arc.curve.getPoint(arc.t));
        arc.dot.scale.setScalar(1 + Math.sin(t * 6 + i) * 0.18);
      }

      for (var r = 0; r < rings.length; r++) {
        var ring = rings[r];
        var ang = t * ring.speed + ring.phase;
        ring.sat.position.set(Math.cos(ang) * ring.radius, Math.sin(ang) * ring.radius, 0);
      }

      halo.material.opacity = 0.36 + Math.sin(t * 1.1) * 0.07;
      stars.rotation.y = t * 0.008;
      stars.rotation.x = Math.sin(t * 0.04) * 0.03;

      camera.position.x += (smooth.x * 0.85 - camera.position.x) * 0.05;
      camera.position.y += (-smooth.y * 0.65 - camera.position.y) * 0.05;
      camera.lookAt(globeRoot.position.x * 0.18, 0, 0);

      renderer.render(scene, camera);
    }

    function start() {
      if (running) return;
      running = true;
      clock.start();
      frame();
    }

    function stop() {
      if (!running) return;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (visible) start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      }, { threshold: 0.02 }).observe(hero);
    }

    start();
  }

  /* ---------------------------------------------------------
     2. Toast (feedback for copy actions)
     --------------------------------------------------------- */
  var toastTimer = null;

  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove("show");
    }, 3200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (err) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------------------------------------------------------
     3. Email / phone links — always give the user something
     --------------------------------------------------------- */
  function initContactLinks() {
    var links = document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]');

    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href");
        var isMail = href.indexOf("mailto:") === 0;
        var value = href
          .replace(/^mailto:/, "")
          .replace(/^tel:/, "")
          .split("?")[0]
          .trim();

        // keep the default behaviour so a configured mail/phone app still opens
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;

        copyText(value).then(function () {
          toast((isMail ? "Email copied — " : "Number copied — ") + value);
        }, function () {
          toast(isMail ? "Email: " + value : "Phone: " + value);
        });
      });
    });

    // make the address itself easy to select
    Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (el) {
      el.addEventListener("click", function () {
        copyText(el.getAttribute("data-copy")).then(function () {
          toast("Copied — " + el.getAttribute("data-copy"));
        });
      });
    });
  }

  /* ---------------------------------------------------------
     4. Scroll reveal
     --------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    items.forEach(function (el) {
      var siblings = el.parentElement
        ? Array.prototype.filter.call(el.parentElement.children, function (c) {
            return c.classList.contains("reveal");
          })
        : [];
      var idx = siblings.indexOf(el);
      if (idx > 0) el.style.setProperty("--d", Math.min(idx * 90, 450) + "ms");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        if (el.hasAttribute("data-tilt")) {
          window.setTimeout(function () { el.classList.add("ready"); }, 950);
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     5. 3D tilt on cards (pointer only)
     --------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var cards = document.querySelectorAll("[data-tilt]");

    Array.prototype.forEach.call(cards, function (card) {
      var raf = null;

      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;

        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var rx = (0.5 - py) * 7;
          var ry = (px - 0.5) * 9;
          card.style.transform =
            "perspective(950px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) +
            "deg) translate3d(0,-4px,0)";
        });
      }, { passive: true });

      card.addEventListener("pointerleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     6. Animated counters
     --------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function animate(el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";

      if (reduceMotion) {
        el.textContent = end.toFixed(decimals) + suffix;
        return;
      }

      var start = performance.now();
      var duration = 1400;

      function tick(now) {
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
     7. Rotating role titles
     --------------------------------------------------------- */
  function initRoleRotator() {
    var el = document.getElementById("role-text");
    if (!el) return;

    var roles = [
      "SDM Deployment Engineer",
      "Telecom Core Network Engineer",
      "IMS / VoLTE Operations",
      "CNF / VNF & Kubernetes Ops",
      "Change & Service Validation"
    ];

    if (reduceMotion) {
      el.textContent = roles[0];
      return;
    }

    var roleIndex = 0;
    var charIndex = roles[0].length;
    var deleting = false;

    function step() {
      var current = roles[roleIndex];

      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex >= current.length) {
          deleting = true;
          window.setTimeout(step, 2100);
          return;
        }
        window.setTimeout(step, 52 + Math.random() * 40);
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          window.setTimeout(step, 320);
          return;
        }
        window.setTimeout(step, 26);
      }
    }

    window.setTimeout(function () { deleting = true; step(); }, 2600);
  }

  /* ---------------------------------------------------------
     8. Nav / progress / misc
     --------------------------------------------------------- */
  function initChrome() {
    var nav = document.getElementById("nav");
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    var progress = document.getElementById("progress");
    var year = document.getElementById("year");

    if (year) year.textContent = new Date().getFullYear();

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle("scrolled", y > 24);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (nav) nav.classList.toggle("open", open);
        document.body.style.overflow = open ? "hidden" : "";
      });

      Array.prototype.forEach.call(links.querySelectorAll("a"), function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          if (nav) nav.classList.remove("open");
          document.body.style.overflow = "";
        });
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && links.classList.contains("open")) {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          if (nav) nav.classList.remove("open");
          document.body.style.overflow = "";
        }
      });
    }
  }

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */
  function boot() {
    initChrome();
    initReveal();
    initTilt();
    initCounters();
    initRoleRotator();
    initContactLinks();
    initScene();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
