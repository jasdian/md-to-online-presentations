(() => {
  const sections = document.querySelectorAll("section");
  const total = sections.length;
  if (!total) return;

  let current = 0;
  let overview = false;

  // UI elements
  const counter = document.getElementById("slide-counter");
  const progress = document.getElementById("progress-bar");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnNotes = document.getElementById("btn-notes");
  const btnPdf = document.getElementById("btn-pdf");
  const dotContainer = document.getElementById("dot-indicators");

  // Build dot indicators
  const dots = [];
  if (dotContainer) {
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.setAttribute("aria-label", "Slide " + (i + 1));
      dot.addEventListener("click", () => goTo(i));
      dotContainer.appendChild(dot);
      dots.push(dot);
    }
  }

  // Build notes panel
  const notesPanel = document.createElement("aside");
  notesPanel.id = "notes-panel";
  notesPanel.innerHTML = '<h2>Speaker Notes</h2><div id="notes-content"></div>';
  document.body.appendChild(notesPanel);
  const notesContent = document.getElementById("notes-content");

  function updateUI() {
    if (counter) counter.textContent = (current + 1) + " / " + total;
    if (progress) progress.style.width = ((current + 1) / total * 100) + "%";

    // Update dots
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("active", i === current);
    }

    // Update prev/next state
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.disabled = current === total - 1;

    // Update notes content
    if (notesContent) {
      const noteEl = sections[current].querySelector("aside.notes");
      notesContent.innerHTML = noteEl
        ? noteEl.innerHTML
        : '<p class="notes-empty">No notes for this slide.</p>';
    }
  }

  let scrollLock = false;
  let scrollLockTimer = 0;

  function goTo(n) {
    n = Math.max(0, Math.min(n, total - 1));
    if (n === current && scrollLock) return;
    current = n;

    if (!overview) {
      clearTimeout(scrollLockTimer);
      scrollLock = true;
      document.documentElement.classList.add("scroll-navigating");
      sections[current].scrollIntoView({ behavior: "smooth" });
      scrollLockTimer = setTimeout(() => {
        document.documentElement.classList.remove("scroll-navigating");
        scrollLock = false;
      }, 800);
    }

    history.replaceState(null, "", "#" + (current + 1));
    updateUI();
  }

  function toggleOverview() {
    overview = !overview;
    document.body.classList.toggle("overview", overview);
    if (!overview) {
      scrollLock = true;
      document.documentElement.classList.add("scroll-navigating");
      sections[current].scrollIntoView();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("scroll-navigating");
          scrollLock = false;
        });
      });
    }
  }

  function toggleNotes() {
    document.body.classList.toggle("notes-open");
    if (btnNotes) btnNotes.classList.toggle("active");
  }

  // Theme toggle
  const btnTheme = document.getElementById("btn-theme");
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("deck-theme", theme);
    if (btnTheme) btnTheme.textContent = theme === "light" ? "☀" : "☽";
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(cur === "dark" ? "light" : "dark");
  }
  // Init theme: localStorage or default dark
  setTheme(localStorage.getItem("deck-theme") || "dark");

  // Toolbar buttons
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);
  if (btnNotes) btnNotes.addEventListener("click", toggleNotes);
  if (btnPdf) btnPdf.addEventListener("click", () => window.print());
  if (btnPrev) btnPrev.addEventListener("click", () => goTo(current - 1));
  if (btnNext) btnNext.addEventListener("click", () => goTo(current + 1));

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case " ":
        e.preventDefault();
        goTo(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        goTo(current - 1);
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(total - 1);
        break;
      case "f":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }
        break;
      case "o":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleOverview();
        }
        break;
      case "n":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleNotes();
        }
        break;
    }
  });

  // Footnote anchor navigation
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#fn'], a[href^='#fnref']");
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById(link.getAttribute("href").slice(1));
    if (!target) return;
    // Find which slide contains this target
    const section = target.closest("section");
    if (section) {
      const idx = Array.from(sections).indexOf(section);
      if (idx >= 0) goTo(idx);
    }
  });

  // Click/tap navigation
  document.addEventListener("click", (e) => {
    if (overview) {
      const section = e.target.closest("section");
      if (!section) return;
      const idx = Array.from(sections).indexOf(section);
      if (idx >= 0) {
        toggleOverview();
        goTo(idx);
      }
      return;
    }
    // Normal mode: tap left third = back, right third = forward
    if (e.target.closest("a, button, input, textarea, select, pre, code, #toolbar, #bottom-nav, #notes-panel")) return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.33) goTo(current - 1);
    else if (x > 0.67) goTo(current + 1);
  });

  // Scroll-based current slide detection
  let scrollTimeout;
  document.addEventListener("scroll", () => {
    if (overview || scrollLock) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const viewMid = window.innerHeight / 2;
      for (let i = 0; i < total; i++) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top <= viewMid && rect.bottom > viewMid) {
          if (current !== i) {
            current = i;
            history.replaceState(null, "", "#" + (current + 1));
            updateUI();
          }
          break;
        }
      }
    }, 80);
  });

  // Hash navigation on load
  const hash = parseInt(location.hash.slice(1), 10);
  if (hash > 0 && hash <= total) {
    current = hash - 1;
  }
  scrollLock = true;
  sections[current].scrollIntoView();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { scrollLock = false; });
  });
  updateUI();
})();
