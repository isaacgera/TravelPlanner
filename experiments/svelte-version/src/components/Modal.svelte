<script>
  // Reusable modal dialog, matching the shipped app's openModal():
  // Escape to close, backdrop click to close, focus trap, focus restore.
  //
  // Props:
  //   title:   heading text
  //   onclose: () => void
  //   children: modal body (snippet)
  import { onMount, tick } from "svelte";

  let { title = "", onclose, children } = $props();

  let dialogEl;
  let lastFocused;

  onMount(() => {
    lastFocused = document.activeElement;
    tick().then(() => {
      const focusable = dialogEl?.querySelector(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
      );
      (focusable || dialogEl)?.focus();
    });
    return () => {
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };
  });

  function onKey(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onclose?.();
    } else if (e.key === "Tab") {
      trapFocus(e);
    }
  }

  function trapFocus(e) {
    const items = dialogEl?.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    );
    if (!items || !items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose?.();
  }
</script>

<div class="modal-root" onclick={onBackdrop} onkeydown={onKey} role="presentation">
  <div class="modal" role="dialog" aria-modal="true" aria-label={title} bind:this={dialogEl} tabindex="-1">
    {#if title}<h3>{title}</h3>{/if}
    {@render children?.()}
  </div>
</div>
