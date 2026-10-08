const toastEl = document.querySelector("[data-toast]");
const shareBtn = document.querySelector("[data-share]");

function formatCount(n) {
  if (!Number.isFinite(n)) return "—";
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) {
    const k = n / 1000;
    const text = k >= 100 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
    return `${text}K`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function formatFrame(n, finalText) {
  if (/^\d+\.\dK$/.test(finalText)) {
    const intWidth = finalText.indexOf(".");
    const [intPart, frac] = (n / 1000).toFixed(1).split(".");
    return `${intPart.padStart(intWidth, " ")}.${frac}K`;
  }
  if (/^\d+K$/.test(finalText)) {
    return `${String(Math.round(n / 1000)).padStart(finalText.length - 1, " ")}K`;
  }
  if (/^\d+\.\dM$/.test(finalText)) {
    const intWidth = finalText.indexOf(".");
    const [intPart, frac] = (n / 1_000_000).toFixed(1).split(".");
    return `${intPart.padStart(intWidth, " ")}.${frac}M`;
  }
  return String(Math.round(n)).padStart(finalText.length, " ");
}

function paintCount(el, text) {
  const chars = [...text];
  if (el.childElementCount !== chars.length) {
    el.replaceChildren(
      ...chars.map((ch) => {
        const span = document.createElement("span");
        const blank = ch === " ";
        span.className = /[\d ]/.test(ch) ? "followers__ch" : "followers__ch followers__ch--mark";
        if (blank) span.classList.add("followers__ch--blank");
        span.textContent = blank ? "0" : ch;
        return span;
      }),
    );
    return;
  }
  chars.forEach((ch, i) => {
    const span = el.children[i];
    const blank = ch === " ";
    span.classList.toggle("followers__ch--blank", blank);
    span.textContent = blank ? "0" : ch;
  });
}

function animateCount(el, value) {
  const finalText = formatCount(value);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    paintCount(el, finalText);
    return;
  }

  paintCount(el, formatFrame(0, finalText));

  const start = performance.now();
  const duration = 900;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    paintCount(el, t < 1 ? formatFrame(value * eased, finalText) : finalText);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function playCounts() {
  const el = document.querySelector("[data-count]");
  const value = Number(el?.dataset.value);
  if (!el || !Number.isFinite(value)) return;
  animateCount(el, value);
}

async function sharePage() {
  const payload = {
    title: document.body.dataset.shareTitle || document.title,
    text: document.body.dataset.shareText || "",
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
  } catch {
    // fall through to copy
  }
  try {
    await navigator.clipboard.writeText(window.location.href);
    toastEl.hidden = false;
    setTimeout(() => {
      toastEl.hidden = true;
    }, 1800);
  } catch {
    toastEl.textContent = "Copy this page URL from the address bar";
    toastEl.hidden = false;
  }
}

shareBtn?.addEventListener("click", sharePage);
playCounts();
