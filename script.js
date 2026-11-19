document.addEventListener("DOMContentLoaded", () => {
  const yearNode = document.querySelector("[data-current-year]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const networkCanvas = document.querySelector("[data-network-canvas]");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#site-nav");
  const compactNavigation = window.matchMedia("(max-width: 960px)");

  if (menuToggle && navigation) {
    const setMenuOpen = (open) => {
      menuToggle.setAttribute("aria-expanded", String(open));
    };
    const updateMenu = () => {
      menuToggle.hidden = !compactNavigation.matches;
      setMenuOpen(false);
    };

    updateMenu();
    compactNavigation.addEventListener("change", updateMenu);
    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") === "false");
    });
    navigation.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (compactNavigation.matches && link) {
        setMenuOpen(false);
        const destination = document.getElementById(link.hash.slice(1));
        destination?.setAttribute("tabindex", "-1");
        destination?.focus({ preventScroll: true });
      }
    });
    menuToggle.closest("header").addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  if (networkCanvas) {
    initializeNetworkBackground(networkCanvas);
  }

  if (!themeToggle) {
    return;
  }

  const root = document.documentElement;

  const updateTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  };

  updateTheme(root.dataset.theme);

  themeToggle.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    updateTheme(theme);

    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch (error) {
      console.warn("Unable to save the theme preference.", error);
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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let particles = [];
  let connections = new Uint8Array();
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
  let starColor = "";
  let starCoreColor = "";
  let starGlowColor = "";
  let shootingStar = null;
  const starInterval = () => 2 + Math.random() * 2;
  let nextShootingStarIn = 0.75 + Math.random() * 0.35;
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
    starColor = styles.getPropertyValue("--network-star").trim();
    starCoreColor = styles.getPropertyValue("--network-star-core").trim();
    starGlowColor = styles.getPropertyValue("--network-star-glow").trim();
  };

  const createParticles = () => {
    const particleCount = Math.min(
      isMobile ? 38 : 70,
      Math.max(isMobile ? 14 : 22, Math.floor((width * height) / 16000))
    );

    particles = Array.from({ length: particleCount }, () => {
      const z = Math.random() * depthRange;
      const scale = focalLength / (focalLength + z);
      const direction = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 13;

      return {
        x: (Math.random() - 0.5) * (width / scale),
        y: (Math.random() - 0.5) * (height / scale),
        z,
        vx: Math.cos(direction) * speed,
        vy: Math.sin(direction) * speed,
        vz: (Math.random() - 0.5) * 40,
      };
    });
    connections = new Uint8Array(particleCount);
  };

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    isMobile = width <= 600 || window.matchMedia("(pointer: coarse)").matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
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
    if (!document.hidden) draw();
  };

  const drawShootingStar = () => {
    const progress = shootingStar.elapsed / shootingStar.duration;
    const fade = Math.min(1, progress / 0.16, (1 - progress) / 0.32) *
      (reducedMotion.matches ? 0.75 : 1);
    const x = shootingStar.x + shootingStar.vx * shootingStar.elapsed;
    const y = shootingStar.y + shootingStar.vy * shootingStar.elapsed;
    const tailX = x - shootingStar.tailX;
    const tailY = y - shootingStar.tailY;
    const trail = context.createLinearGradient(tailX, tailY, x, y);

    trail.addColorStop(0, `rgb(${starColor} / 0)`);
    trail.addColorStop(0.45, `rgb(${starColor} / 0.34)`);
    trail.addColorStop(0.82, `rgb(${starColor} / 0.86)`);
    trail.addColorStop(1, `rgb(${starCoreColor})`);

    context.save();
    context.lineCap = "round";
    context.strokeStyle = trail;
    context.shadowColor = starGlowColor;
    context.beginPath();
    context.moveTo(tailX, tailY);
    context.lineTo(x, y);
    context.globalAlpha = fade * 0.38;
    context.lineWidth = isMobile ? 5 : 8;
    context.shadowBlur = isMobile ? 9 : 19;
    context.stroke();
    context.globalAlpha = fade;
    context.lineWidth = isMobile ? 2.1 : 2.8;
    context.shadowBlur = 0;
    context.stroke();

    context.fillStyle = `rgb(${starCoreColor})`;
    context.shadowBlur = isMobile ? 12 : 22;
    context.beginPath();
    context.arc(x, y, isMobile ? 2.6 : 3.4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const updateShootingStar = (elapsedSeconds) => {
    nextShootingStarIn -= elapsedSeconds;

    if (shootingStar) {
      shootingStar.elapsed += elapsedSeconds;
      if (shootingStar.elapsed >= shootingStar.duration) {
        shootingStar = null;
      }
    }

    if (nextShootingStarIn <= 0) {
      const direction = Math.random() < 0.5 ? 1 : -1;
      const startX = width * (0.08 + Math.random() * 0.2);
      const distanceX = direction * width * (0.53 + Math.random() * 0.18);
      const distanceY = Math.min(height * 0.3, Math.abs(distanceX) * (0.28 + Math.random() * 0.24));
      const duration = 0.82 + Math.random() * 0.54;
      const tailLength = Math.min(isMobile ? 145 : 290, Math.max(78, width * 0.25));
      const tailScale = tailLength / Math.hypot(distanceX, distanceY);

      shootingStar = {
        x: direction === 1 ? startX : width - startX,
        y: height * (0.12 + Math.random() * 0.56),
        vx: distanceX / duration,
        vy: distanceY / duration,
        elapsed: 0,
        duration,
        tailX: distanceX * tailScale,
        tailY: distanceY * tailScale,
      };
      nextShootingStarIn = starInterval();
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
    connections.fill(0);
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
        const screenDistanceSquared = screenX * screenX + screenY * screenY;
        if (screenDistanceSquared >= maxScreenDistanceSquared) {
          continue;
        }

        const proximity = 1 - screenDistanceSquared / maxScreenDistanceSquared;
        context.globalAlpha = ((first.brightness + second.brightness) / 2) * proximity;
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

    const frameSeconds = lastFrameTime === null ? 0 : (time - lastFrameTime) / 1000;
    const elapsedSeconds = Math.min(frameSeconds, 0.05);
    const particleStep = elapsedSeconds * (reducedMotion.matches ? 0.65 : 1);
    lastFrameTime = time;
    animationElapsed += elapsedSeconds;

    for (const particle of particles) {
      particle.x += particle.vx * particleStep;
      particle.y += particle.vy * particleStep;
      particle.z += particle.vz * particleStep;

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

    if (isMobile && !reducedMotion.matches) {
      targetParallaxX = Math.sin(animationElapsed * 0.22) * 8;
      targetParallaxY = Math.cos(animationElapsed * 0.17) * 5;
    }
    const parallaxEase = 1 - Math.exp(-elapsedSeconds * 3);
    parallaxX += (targetParallaxX - parallaxX) * parallaxEase;
    parallaxY += (targetParallaxY - parallaxY) * parallaxEase;

    updateShootingStar(frameSeconds);
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
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      targetParallaxX = 0;
      targetParallaxY = 0;
    }
  });
  window.addEventListener(
    "pointermove",
    (event) => {
      if (!isMobile && event.pointerType === "mouse" && !reducedMotion.matches) {
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
    if (!document.hidden) draw();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}
