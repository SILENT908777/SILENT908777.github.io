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
  let focalLength = 0;
  let depthRange = 0;
  let isMobile = false;
  let dotColor = "";
  let alternateDotColor = "";
  let lineColor = "";
  let glowColor = "";
  let shootingStar = null;
  let nextShootingStarIn = 2.5 + Math.random() * 2;
  let lastFrameTime = null;
  let animationElapsed = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let targetParallaxX = 0;
  let targetParallaxY = 0;

  const updateColors = () => {
    const styles = getComputedStyle(root);
    dotColor = styles.getPropertyValue("--network-dot").trim();
    alternateDotColor = styles.getPropertyValue("--network-dot-alt").trim();
    lineColor = styles.getPropertyValue("--network-line").trim();
    glowColor = styles.getPropertyValue("--network-glow").trim();
  };

  const createParticles = () => {
    const particleCount = Math.min(
      isMobile ? 38 : 70,
      Math.max(isMobile ? 14 : 22, Math.floor((width * height) / 16000))
    );

    particles = Array.from({ length: particleCount }, () => {
      const z = Math.random() * depthRange;
      const scale = focalLength / (focalLength + z);

      return {
        x: (Math.random() - 0.5) * (width / scale),
        y: (Math.random() - 0.5) * (height / scale),
        z,
        vx: (Math.random() - 0.5) * 13.2,
        vy: (Math.random() - 0.5) * 13.2,
        vz: (Math.random() - 0.5) * 28,
      };
    });
  };

  const resize = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    isMobile = width <= 600 || window.matchMedia("(pointer: coarse)").matches;
    focalLength = Math.max(280, Math.min(width, height) * 0.9);
    depthRange = Math.max(420, Math.min(width, height) * 0.9);

    if (isMobile) {
      targetParallaxX = 0;
      targetParallaxY = 0;
    }

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

  const projectParticle = (particle, index) => {
    const scale = focalLength / (focalLength + particle.z);
    const depth = particle.z / depthRange;
    const depthBrightness = 1 - depth;

    return {
      index,
      particle,
      z: particle.z,
      x: width / 2 + particle.x * scale + parallaxX * depth,
      y: height / 2 + particle.y * scale + parallaxY * depth,
      radius: 1 + depthBrightness * 1.4,
      brightness: 0.34 + depthBrightness * 0.66,
    };
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    const projected = particles
      .map(projectParticle)
      .sort((a, b) => b.z - a.z);
    const connections = new Uint8Array(particles.length);
    const maxScreenDistance = isMobile ? 105 : 135;
    const maxWorldDistance = Math.min(
      190,
      Math.max(130, Math.min(width, height) * 0.24)
    );
    const maxScreenDistanceSquared = maxScreenDistance * maxScreenDistance;
    const maxWorldDistanceSquared = maxWorldDistance * maxWorldDistance;

    context.lineCap = "round";
    context.strokeStyle = lineColor;
    context.shadowColor = glowColor;

    for (let i = 0; i < projected.length; i += 1) {
      const first = projected[i];
      const firstParticle = first.particle;

      for (let j = i + 1; j < projected.length; j += 1) {
        if (
          connections[first.index] >= 4 ||
          connections[projected[j].index] >= 4
        ) {
          continue;
        }

        const second = projected[j];
        const secondParticle = second.particle;
        const dx = firstParticle.x - secondParticle.x;
        const dy = firstParticle.y - secondParticle.y;
        const dz = firstParticle.z - secondParticle.z;
        if (dx * dx + dy * dy + dz * dz > maxWorldDistanceSquared) {
          continue;
        }

        const screenX = first.x - second.x;
        const screenY = first.y - second.y;
        if (
          screenX * screenX + screenY * screenY >
          maxScreenDistanceSquared
        ) {
          continue;
        }

        context.globalAlpha = (first.brightness + second.brightness) / 2;
        context.lineWidth = 0.55 + context.globalAlpha * 0.55;
        context.shadowBlur = 3 + context.globalAlpha * 3;
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.stroke();
        connections[first.index] += 1;
        connections[second.index] += 1;
      }
    }

    for (const point of projected) {
      context.globalAlpha = point.brightness;
      context.fillStyle =
        point.index % 2 === 0 ? dotColor : alternateDotColor;
      context.shadowBlur = 4 + point.brightness * 5;
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
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
    animationElapsed += elapsedSeconds;

    for (const particle of particles) {
      particle.x += particle.vx * elapsedSeconds;
      particle.y += particle.vy * elapsedSeconds;
      particle.z += particle.vz * elapsedSeconds;

      if (particle.z < 0 || particle.z > depthRange) {
        particle.vz *= -1;
        particle.z = Math.max(0, Math.min(depthRange, particle.z));
      }

      const scale = focalLength / (focalLength + particle.z);
      const halfWidth = width / (2 * scale);
      const halfHeight = height / (2 * scale);
      if (particle.x < -halfWidth || particle.x > halfWidth) {
        particle.vx *= -1;
        particle.x = Math.max(-halfWidth, Math.min(halfWidth, particle.x));
      }
      if (particle.y < -halfHeight || particle.y > halfHeight) {
        particle.vy *= -1;
        particle.y = Math.max(-halfHeight, Math.min(halfHeight, particle.y));
      }
    }

    if (isMobile) {
      targetParallaxX = Math.sin(animationElapsed * 0.22) * 8;
      targetParallaxY = Math.cos(animationElapsed * 0.17) * 5;
    }
    const parallaxEase = 1 - Math.exp(-elapsedSeconds * 3);
    parallaxX += (targetParallaxX - parallaxX) * parallaxEase;
    parallaxY += (targetParallaxY - parallaxY) * parallaxEase;

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
  window.addEventListener(
    "pointermove",
    (event) => {
      if (!isMobile) {
        targetParallaxX = (event.clientX / width - 0.5) * 24;
        targetParallaxY = (event.clientY / height - 0.5) * 18;
      }
    },
    { passive: true }
  );
  document.addEventListener("pointerleave", () => {
    targetParallaxX = 0;
    targetParallaxY = 0;
  });
  new MutationObserver(() => {
    updateColors();
    draw();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}
