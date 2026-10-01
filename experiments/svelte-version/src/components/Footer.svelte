<!-- Forjé branding footer. Tokenised, print-excluded (.no-print). -->
<footer class="app-footer no-print">
  <span class="app-footer-brand">Powered by Forjé</span>
  <span class="app-footer-copy">© 2026 Isaac A Gera. All rights reserved.</span>
</footer>

<style>
  /* Desktop: the Forjé credit lives in the sidebar footer (Nav.svelte), so
     this standalone footer is mobile-only to avoid showing it twice. */
  .app-footer { display: none; }

  @media (max-width: 719px) {
    /* Fixed just above the bottom tab bar so it never jumps with page content
       (matches the shipped app's Session 4 fix). The tab bar is ~62px tall
       plus the iOS safe-area inset. */
    .app-footer {
      display: flex;
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(62px + env(safe-area-inset-bottom, 0px));
      z-index: 35;               /* above content, below the tab bar (40) */
      margin: 0;
      padding: 0.35rem 0.5rem;
      background: var(--bg);
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-light);
      font-size: 0.66rem;
      line-height: 1.4;
      flex-direction: column;
      gap: 0;
    }
  }
  .app-footer-brand {
    color: var(--primary);
    font-weight: 600;
    letter-spacing: 0.2px;
  }
  .app-footer-copy {
    opacity: 0.85;
  }
  @media print {
    .app-footer {
      display: none;
    }
  }
</style>
