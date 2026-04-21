document.addEventListener("DOMContentLoaded", function () {
  const root = document.querySelector("main.content");
  if (!root) {
    return;
  }

  function isOverlayable(img) {
    if (img.closest("a")) {
      return false;
    }
    if (img.closest(".comments")) {
      return false;
    }
    if (
      img.hasAttribute("data-no-link") ||
      img.hasAttribute("data-no-zoom") ||
      img.classList.contains("no-zoom")
    ) {
      return false;
    }
    return true;
  }

  const overlay = document.createElement("div");
  overlay.id = "post-img-overlay";
  overlay.className = "post-img-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Expanded image");
  overlay.setAttribute("aria-hidden", "true");
  overlay.tabIndex = -1;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "post-img-overlay__close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "\u00d7";

  const inner = document.createElement("div");
  inner.className = "post-img-overlay__inner";

  const big = document.createElement("img");
  big.className = "post-img-overlay__img";
  big.alt = "";
  big.decoding = "async";

  inner.appendChild(big);
  overlay.appendChild(closeBtn);
  overlay.appendChild(inner);
  document.body.appendChild(overlay);

  let lastFocus = null;

  function isOpen() {
    return overlay.classList.contains("post-img-overlay--open");
  }

  function openFrom(img) {
    const src = img.currentSrc || img.src;
    if (!src) {
      return;
    }
    lastFocus = document.activeElement;
    big.src = src;
    big.alt = img.alt || "";
    overlay.classList.add("post-img-overlay--open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("post-img-overlay-open");
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen()) {
      return;
    }
    overlay.classList.remove("post-img-overlay--open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("post-img-overlay-open");
    big.removeAttribute("src");
    big.alt = "";
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
  }

  overlay.addEventListener("click", function (e) {
    if (
      e.target === overlay ||
      e.target === inner ||
      e.target === big
    ) {
      close();
    }
  });
  closeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) {
      close();
    }
  });

  root.querySelectorAll("div.post img").forEach(function (img) {
    if (!isOverlayable(img)) {
      return;
    }
    if (!(img.currentSrc || img.src)) {
      return;
    }
    img.classList.add("post-img-overlayable");
    img.addEventListener("click", function (e) {
      e.preventDefault();
      openFrom(img);
    });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFrom(img);
      }
    });
    if (!img.hasAttribute("tabindex")) {
      img.tabIndex = 0;
    }
    if (!img.hasAttribute("role")) {
      img.setAttribute("role", "button");
    }
    const label = img.alt
      ? "View larger: " + img.alt
      : "View larger image";
    img.setAttribute("aria-label", label);
  });
});
