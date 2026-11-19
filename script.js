document.addEventListener("DOMContentLoaded", () => {
  const yearNode = document.querySelector("[data-current-year]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const networkCanvas = document.querySelector("[data-network-canvas]");

  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  if (networkCanvas instanceof HTMLCanvasElement) {
    initializeNetworkBackground(networkCanvas);
  }

  if (!themeToggle) {
    return;
  }

  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let hasSavedTheme = false;

  try {
    const savedTheme = localStorage.getItem("portfolio-theme");
    hasSavedTheme = savedTheme === "light" || savedTheme === "dark";
  } catch (error) {
    console.warn("Unable to read the saved theme preference.", error);
  }

  const updateTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  };

  updateTheme(root.dataset.theme);

  themeToggle.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    updateTheme(theme);
    hasSavedTheme = true;

    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
      console.warn("Unable to save the theme preference.", error);
    }
  });

  systemTheme.addEventListener("change", (event) => {
    if (!hasSavedTheme) {
      updateTheme(event.matches ? "dark" : "light");
    }
  });
});

function initializeNetworkBackground(canvas) {
  const context = canvas.getContext("2d");
  if (!context) {
    console.warn("Unable to initialize the network background canvas.");
    return;
  }

  const root = document.documentElement;
  let particles = [];
  let animationFrame = null;
  let width = 0;
  let height = 0;
  let dotColor = "";
  let alternateDotColor = "";
  let lineColor = "";
  let glowColor = "";
  let shootingStar = null;
  let nextShootingStarIn = 2.5 + Math.random() * 2;
  let lastFrameTime = null;

  const updateColors = () => {
    const styles = getComputedStyle(root);
    dotColor = styles.getPropertyValue("--network-dot").trim();
    alternateDotColor = styles.getPropertyValue("--network-dot-alt").trim();
    lineColor = styles.getPropertyValue("--network-line").trim();
    glowColor = styles.getPropertyValue("--network-glow").trim();
  };

  const createParticles = () => {
    const isMobile = width <= 600;
    const particleCount = Math.min(
      isMobile ? 38 : 70,
      Math.max(isMobile ? 14 : 22, Math.floor((width * height) / 16000))
    );

    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 13.2,
      vy: (Math.random() - 0.5) * 13.2,
    }));
  };

  const resize = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createParticles();
    draw();
  };

  const drawShootingStar = () => {
    const progress = shootingStar.elapsed / shootingStar.duration;
    const fade = Math.sin(progress * Math.PI);
    const x = shootingStar.x + shootingStar.vx * shootingStar.elapsed;
    const y = shootingStar.y + shootingStar.vy * shootingStar.elapsed;
    const speed = Math.hypot(shootingStar.vx, shootingStar.vy);
    const tailTime = shootingStar.tailLength / speed;
    const tailX = x - shootingStar.vx * tailTime;
    const tailY = y - shootingStar.vy * tailTime;
    const trail = context.createLinearGradient(tailX, tailY, x, y);

    trail.addColorStop(0, "rgba(35, 170, 255, 0)");
    trail.addColorStop(0.68, `rgba(40, 184, 255, ${fade * 0.52})`);
    trail.addColorStop(1, `rgba(166, 248, 255, ${fade})`);

    context.save();
    context.lineCap = "round";
    context.lineWidth = 2;
    context.strokeStyle = trail;
    context.shadowBlur = 13;
    context.shadowColor = glowColor;
    context.beginPath();
    context.moveTo(tailX, tailY);
    context.lineTo(x, y);
    context.stroke();

    context.fillStyle = `rgba(210, 250, 255, ${fade})`;
    context.shadowBlur = 16;
    context.beginPath();
    context.arc(x, y, 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const updateShootingStar = (elapsedSeconds) => {
    if (shootingStar) {
      shootingStar.elapsed += elapsedSeconds;
      if (shootingStar.elapsed >= shootingStar.duration) {
        shootingStar = null;
        nextShootingStarIn = 5 + Math.random() * 4;
      }
      return;
    }

    nextShootingStarIn -= elapsedSeconds;
    if (nextShootingStarIn <= 0) {
      const speed = Math.min(440, Math.max(180, width * 0.34));
      const angle = 0.38;
      shootingStar = {
        x: width * (0.15 + Math.random() * 0.55),
        y: height * Math.random() * 0.35,
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        elapsed: 0,
        duration: 0.85,
        tailLength: Math.min(110, Math.max(58, width * 0.08)),
      };
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = lineColor;
    context.lineWidth = 1;
    context.shadowColor = glowColor;

    const connections = new Uint8Array(particles.length);
    const maxDistance = width <= 600 ? 105 : 135;
    const maxConnections = 4;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      context.fillStyle = i % 2 === 0 ? dotColor : alternateDotColor;
      context.shadowBlur = 9;
      context.beginPath();
      context.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2);
      context.fill();

      context.shadowBlur = 5;
      for (let j = i + 1; j < particles.length; j += 1) {
        if (
          connections[i] >= maxConnections ||
          connections[j] >= maxConnections
        ) {
          continue;
        }

        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        if (dx * dx + dy * dy > maxDistance * maxDistance) {
          continue;
        }

        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.stroke();
        connections[i] += 1;
        connections[j] += 1;
      }
    }

    context.shadowBlur = 0;
    if (shootingStar) {
      drawShootingStar();
    }
  };

  const animate = (time) => {
    animationFrame = null;
    if (document.hidden) {
      lastFrameTime = null;
      return;
    }

    const elapsedSeconds =
      lastFrameTime === null ? 0 : Math.min((time - lastFrameTime) / 1000, 0.05);
    lastFrameTime = time;

    for (const particle of particles) {
      particle.x += particle.vx * elapsedSeconds;
      particle.y += particle.vy * elapsedSeconds;

      if (particle.x < 0 || particle.x > width) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      if (particle.y < 0 || particle.y > height) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(height, particle.y));
      }
    }

    updateShootingStar(elapsedSeconds);
    draw();
    startAnimation();
  };

  const startAnimation = () => {
    if (!document.hidden && animationFrame === null) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  };

  const stopAnimation = () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    lastFrameTime = null;
  };

  updateColors();
  resize();
  startAnimation();

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });
  new MutationObserver(() => {
    updateColors();
    draw();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}
