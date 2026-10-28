/* ============================================================
   Nangili Chandra Sekhar — portfolio interactions
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. Hero 3D scene — a telecom core: central node, orbiting
        network functions, inter-node links, particle field.
     --------------------------------------------------------- */
  function initScene() {
    var canvas = document.getElementById("scene");
    if (!canvas || !window.THREE || reduceMotion) return;

    var THREE = window.THREE;
    var renderer, scene, camera, net, nodes = [], clock;

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

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.02);

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(0, 0, 17);

    clock = new THREE.Clock();
    net = new THREE.Group();
    scene.add(net);

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0x4a5c8c, 1.15));

    var cyanLight = new THREE.PointLight(0x2ef2d0, 55, 40, 2);
    cyanLight.position.set(6, 7, 9);
    scene.add(cyanLight);

    var blueLight = new THREE.PointLight(0x4f8cff, 45, 40, 2);
    blueLight.position.set(-8, -5, 7);
    scene.add(blueLight);

    var violetLight = new THREE.PointLight(0x9b6bff, 35, 40, 2);
    violetLight.position.set(0, -7, -6);
    scene.add(violetLight);

    /* ---------- glow sprite texture (procedural) ---------- */
    function glowTexture() {
      var size = 128;
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var g = c.getContext("2d");
      var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, "rgba(120,255,232,1)");
      grd.addColorStop(0.22, "rgba(46,242,208,0.55)");
      grd.addColorStop(0.55, "rgba(79,140,255,0.14)");
      grd.addColorStop(1, "rgba(79,140,255,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }

    var glowMap = glowTexture();

    /* ---------- core ---------- */
    var core = new THREE.Group();
    net.add(core);

    var coreShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.45, 1),
      new THREE.MeshStandardMaterial({
        color: 0x0a2130,
        emissive: 0x1de9c4,
        emissiveIntensity: 0.35,
        metalness: 0.85,
        roughness: 0.28,
        flatShading: true,
        transparent: true,
        opacity: 0.92
      })
    );
    core.add(coreShell);

    var coreWire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.46, 1)),
      new THREE.LineBasicMaterial({
        color: 0x5effe4,
        transparent: true,
        opacity: 0.5
      })
    );
    core.add(coreWire);

    var halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.85
      })
    );
    halo.scale.set(8.5, 8.5, 1);
    core.add(halo);

    var innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xd8fff8 })
    );
    core.add(innerCore);

    /* ---------- orbiting network functions ---------- */
    var NODES = 21;
    var position = new THREE.Vector3();
    var nodeGeo = new THREE.SphereGeometry(0.075, 12, 12);
    var linkPositions = [];
    var peerPositions = [];

    function fibonacciSphere(i, total, radius) {
      var y = 1 - (i / (total - 1)) * 2;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = i * 2.399963229728653;
      return new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      );
    }

    var basePositions = [];

    for (var i = 0; i < NODES; i++) {
      var radius = 3.9 + Math.random() * 1.5;
      var p = fibonacciSphere(i, NODES, radius);
      p.x += (Math.random() - 0.5) * 0.9;
      p.y += (Math.random() - 0.5) * 0.9;
      p.z += (Math.random() - 0.5) * 0.9;
      basePositions.push(p.clone());

      var isAccent = i % 4 === 0;
      var mat = new THREE.MeshStandardMaterial({
        color: isAccent ? 0x8fe9ff : 0xbcd2ff,
        emissive: isAccent ? 0x2ef2d0 : 0x4f8cff,
        emissiveIntensity: isAccent ? 1.5 : 0.95,
        metalness: 0.5,
        roughness: 0.35
      });

      var node = new THREE.Mesh(nodeGeo, mat);
      node.position.copy(p);
      node.userData.phase = Math.random() * Math.PI * 2;
      node.userData.base = p.clone();
      node.userData.speed = 0.6 + Math.random() * 0.9;
      net.add(node);
      nodes.push(node);

      // link: core -> node
      position.set(0, 0, 0);
      linkPositions.push(0, 0, 0, p.x, p.y, p.z);
    }

    /* ---------- peer links between nearby nodes ---------- */
    for (var a = 0; a < NODES; a++) {
      var nearest = [];
      for (var b = 0; b < NODES; b++) {
        if (a === b) continue;
        nearest.push({ i: b, d: basePositions[a].distanceTo(basePositions[b]) });
      }
      nearest.sort(function (m, n) { return m.d - n.d; });
      for (var k = 0; k < 2; k++) {
        var other = nearest[k];
        if (!other || other.d > 2.4) continue;
        var pa = basePositions[a];
        var pb = basePositions[other.i];
        peerPositions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
      }
    }

    var linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.Float32BufferAttribute(linkPositions, 3));
    net.add(new THREE.LineSegments(
      linkGeo,
      new THREE.LineBasicMaterial({ color: 0x2ef2d0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })
    ));

    var peerGeo = new THREE.BufferGeometry();
    peerGeo.setAttribute("position", new THREE.Float32BufferAttribute(peerPositions, 3));
    net.add(new THREE.LineSegments(
      peerGeo,
      new THREE.LineBasicMaterial({ color: 0x6f9dff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending })
    ));

    /* ---------- orbital rings ---------- */
    var ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4f8cff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });

    var ringConfigs = [
      { r: 3.3, tilt: 0.9, rot: 0.2 },
      { r: 4.9, tilt: -0.6, rot: 1.1 },
      { r: 6.3, tilt: 0.35, rot: -0.7 }
    ];

    var rings = [];

    ringConfigs.forEach(function (cfg, idx) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r, 0.006, 6, 180),
        ringMaterial.clone()
      );
      ring.material.opacity = 0.1 + idx * 0.04;
      ring.rotation.x = Math.PI / 2 + cfg.tilt;
      ring.rotation.y = cfg.rot;
      ring.userData.spin = (idx % 2 === 0 ? 1 : -1) * (0.05 + idx * 0.02);
      net.add(ring);
      rings.push(ring);
    });

    /* ---------- particle field ---------- */
    var particleCount = 850;
    var particlePositions = new Float32Array(particleCount * 3);
    for (var q = 0; q < particleCount; q++) {
      var dist = 9 + Math.random() * 16;
      var v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize().multiplyScalar(dist);
      particlePositions[q * 3] = v.x;
      particlePositions[q * 3 + 1] = v.y;
      particlePositions[q * 3 + 2] = v.z;
    }

    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    var particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
      color: 0x9fb8e8,
      size: 0.055,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    scene.add(particles);

    /* ---------- responsive layout ---------- */
    var hero = canvas.parentElement;
    var isWide = true;

    function resize() {
      var w = hero.clientWidth || window.innerWidth;
      var h = hero.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      isWide = w >= 900;
      if (isWide) {
        net.position.set(3.6, 0.2, 0);
        net.scale.setScalar(1);
        camera.position.z = 17;
      } else {
        net.position.set(0, 1.6, -2);
        net.scale.setScalar(0.78);
        camera.position.z = 19;
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
    var target = { x: 0, y: 0 };

    window.addEventListener("pointermove", function (e) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* ---------- animation loop ---------- */
    var running = false;
    var rafId = null;

    function frame() {
      rafId = requestAnimationFrame(frame);

      var t = clock.getElapsedTime();

      target.x += (pointer.x - target.x) * 0.045;
      target.y += (pointer.y - target.y) * 0.045;

      net.rotation.y = t * 0.15 + target.x * 0.35;
      net.rotation.x = Math.sin(t * 0.22) * 0.1 + target.y * 0.22;
      net.rotation.z = Math.sin(t * 0.14) * 0.05;

      core.rotation.y = -t * 0.3;
      core.rotation.x = t * 0.18;
      coreShell.scale.setScalar(1 + Math.sin(t * 1.6) * 0.025);
      halo.material.opacity = 0.72 + Math.sin(t * 1.4) * 0.16;
      innerCore.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);

      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var base = node.userData.base;
        var ph = node.userData.phase;
        node.position.set(
          base.x + Math.sin(t * node.userData.speed + ph) * 0.16,
          base.y + Math.cos(t * node.userData.speed * 0.8 + ph) * 0.16,
          base.z + Math.sin(t * node.userData.speed * 0.6 + ph) * 0.16
        );
        node.scale.setScalar(1 + Math.sin(t * 2 + ph) * 0.22);
      }

      for (var r = 0; r < rings.length; r++) {
        rings[r].rotation.z += rings[r].userData.spin * 0.004;
      }

      particles.rotation.y = t * 0.012;
      particles.rotation.x = Math.sin(t * 0.05) * 0.05;

      camera.position.x += (target.x * 1.1 - camera.position.x) * 0.05;
      camera.position.y += (-target.y * 0.9 - camera.position.y) * 0.05;
      camera.lookAt(net.position.x * 0.25, 0, 0);

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

    var visible = true;

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
     2. Scroll reveal
     --------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    // stagger siblings inside the same grid/section
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
     3. 3D tilt on cards (pointer only)
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
     4. Animated counters
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
     5. Rotating role titles
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
     6. Nav / progress / misc
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
    initScene();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
