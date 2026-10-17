(() => {
  const hero = document.getElementById("home");
  const canvas = document.getElementById("hero-globe");
  if (!hero || !canvas) return;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const cities = [
    [51.5, -0.1], [48.9, 2.4], [52.5, 13.4], [40.7, -74], [34.05, -118.2], [37.8, -122.4],
    [19.4, -99.1], [-23.5, -46.6], [6.5, 3.4], [30.05, 31.2], [25.2, 55.3], [-26.2, 28],
    [-1.3, 36.8], [19.1, 72.9], [1.3, 103.8], [31.2, 121.5], [35.7, 139.7], [37.6, 127],
    [-33.9, 151.2], [43.7, -79.4], [55.8, 37.6], [-34.6, -58.4],
  ];
  const bonds = [
    [3, 0], [0, 10], [10, 14], [14, 16], [16, 18], [4, 16], [3, 7], [8, 0],
    [13, 14], [5, 17], [9, 1], [11, 10], [6, 3], [2, 3], [15, 14], [19, 0],
  ];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0;
  let running = false;
  let rotation = reduced ? -0.35 : 0.4;

  function place(lat, lon) {
    const phi = lat * Math.PI / 180;
    const theta = lon * Math.PI / 180 + rotation;
    const cosLat = Math.cos(phi);
    return {
      x: cosLat * Math.sin(theta),
      y: Math.sin(phi),
      z: cosLat * Math.cos(theta),
    };
  }

  function blend(a, b, t) {
    const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
    const omega = Math.acos(dot);
    if (omega < 0.001) return a;
    const sine = Math.sin(omega);
    const left = Math.sin((1 - t) * omega) / sine;
    const right = Math.sin(t * omega) / sine;
    return {
      x: left * a.x + right * b.x,
      y: left * a.y + right * b.y,
      z: left * a.z + right * b.z,
    };
  }

  let sized = "";

  function layout() {
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    const narrow = width < 760;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const next = `${width}x${height}@${ratio}`;
    if (next !== sized) {
      sized = next;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    return {
      width,
      height,
      cx: width * (narrow ? 0.74 : 0.72),
      cy: height * (narrow ? 0.58 : 0.5),
      radius: Math.min(height * (narrow ? 0.26 : 0.32), width * (narrow ? 0.32 : 0.24)),
    };
  }

  function draw() {
    const view = layout();
    const { width, height, cx, cy, radius } = view;
    context.clearRect(0, 0, width, height);

    for (let star = 0; star < 48; star += 1) {
      const seed = Math.sin(star * 12.9898) * 43758.5453;
      const unit = seed - Math.floor(seed);
      const seed2 = Math.sin(star * 78.233) * 24634.6345;
      const unit2 = seed2 - Math.floor(seed2);
      context.fillStyle = `rgba(180, 205, 230, ${0.15 + (star % 5) * 0.06})`;
      context.fillRect(unit * width, unit2 * height * 0.85, star % 4 === 0 ? 1.6 : 1, star % 4 === 0 ? 1.6 : 1);
    }

    const ocean = context.createRadialGradient(cx - radius * 0.28, cy - radius * 0.32, radius * 0.08, cx, cy, radius);
    ocean.addColorStop(0, "#2a4d78");
    ocean.addColorStop(0.5, "#163154");
    ocean.addColorStop(1, "#0a1830");
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fillStyle = ocean;
    context.fill();

    context.beginPath();
    context.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
    context.strokeStyle = "rgba(0, 168, 255, 0.55)";
    context.lineWidth = 2;
    context.shadowColor = "rgba(0, 168, 255, 0.85)";
    context.shadowBlur = 18;
    context.stroke();
    context.shadowBlur = 0;

    context.lineWidth = 0.6;
    context.strokeStyle = "rgba(140, 190, 230, 0.16)";
    for (let lat = -60; lat <= 60; lat += 30) {
      context.beginPath();
      let drawing = false;
      for (let lon = -180; lon <= 180; lon += 6) {
        const point = place(lat, lon);
        if (point.z <= 0.05) {
          drawing = false;
          continue;
        }
        const x = cx + point.x * radius;
        const y = cy - point.y * radius;
        if (!drawing) {
          context.moveTo(x, y);
          drawing = true;
        } else context.lineTo(x, y);
      }
      context.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      context.beginPath();
      let drawing = false;
      for (let lat = -80; lat <= 80; lat += 4) {
        const point = place(lat, lon);
        if (point.z <= 0.05) {
          drawing = false;
          continue;
        }
        const x = cx + point.x * radius;
        const y = cy - point.y * radius;
        if (!drawing) {
          context.moveTo(x, y);
          drawing = true;
        } else context.lineTo(x, y);
      }
      context.stroke();
    }

    const points = cities.map(([lat, lon]) => place(lat, lon));
    const screen = (point, lift = 1) => ({
      x: cx + point.x * radius * lift,
      y: cy - point.y * radius * lift,
      z: point.z,
    });

    points.forEach((point) => {
      if (point.z <= 0.05) return;
      const dot = screen(point);
      const warm = context.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 2.2 + point.z * 2);
      warm.addColorStop(0, `rgba(255, 214, 140, ${0.35 + point.z * 0.65})`);
      warm.addColorStop(1, "rgba(255, 170, 70, 0)");
      context.fillStyle = warm;
      context.beginPath();
      context.arc(dot.x, dot.y, 3 + point.z * 2, 0, Math.PI * 2);
      context.fill();
    });

    bonds.forEach((pair, index) => {
      const start = points[pair[0]];
      const end = points[pair[1]];
      const pulse = reduced ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.012 + index * 0.9));
      if (pulse < 0.08) return;
      const travel = reduced ? 0.55 : (frame * 0.004 + index * 0.17) % 1;
      context.beginPath();
      let drawing = false;
      for (let step = 0; step <= 28; step += 1) {
        const point = blend(start, end, step / 28);
        if (point.z <= 0.02) {
          drawing = false;
          continue;
        }
        const dot = screen(point, 1.035);
        if (!drawing) {
          context.moveTo(dot.x, dot.y);
          drawing = true;
        } else context.lineTo(dot.x, dot.y);
      }
      context.strokeStyle = `rgba(0, 168, 255, ${0.18 + pulse * 0.55})`;
      context.lineWidth = 1.15;
      context.shadowColor = "rgba(0, 168, 255, 0.7)";
      context.shadowBlur = 8;
      context.stroke();
      context.shadowBlur = 0;

      const head = blend(start, end, travel);
      if (head.z > 0.05) {
        const dot = screen(head, 1.045);
        context.beginPath();
        context.fillStyle = `rgba(190, 230, 255, ${0.45 + pulse * 0.55})`;
        context.arc(dot.x, dot.y, 2.2, 0, Math.PI * 2);
        context.fill();
      }
      [start, end].forEach((point) => {
        if (point.z <= 0.05) return;
        const dot = screen(point, 1.02);
        context.beginPath();
        context.fillStyle = `rgba(120, 210, 255, ${0.5 + point.z * 0.5})`;
        context.arc(dot.x, dot.y, 2.4, 0, Math.PI * 2);
        context.fill();
      });
    });

    hero.classList.add("hero-live");
  }

  function tick() {
    if (!running) return;
    frame += 1;
    rotation += 0.00115;
    draw();
    window.requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    if (reduced) {
      draw();
      return;
    }
    window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  const seen = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) start();
    else stop();
  });
  seen.observe(hero);
  window.addEventListener("resize", () => { if (!running || reduced) draw(); });
  start();
})();
