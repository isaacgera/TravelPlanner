<script>
  // Trip → Itinerary: clean, printable one-page summary. Ported from renderSummary().
  // Save/Export: PDF on desktop (jsPDF), JPEG on mobile (canvas.toBlob) — same
  // adaptive strategy as the shipped app, but the libs are VENDORED via npm and
  // bundled by Vite (no CDN), and imported lazily so they don't bloat the main
  // chunk. A DX win over the shipped app's runtime CDN-script loading.
  import { announce } from "../../lib/router.svelte.js";
  import { fmtDate, fmtRange, dateList } from "../../lib/dates.js";

  let { trip } = $props();

  const places = $derived((trip.places || []).map((p) => p.name).filter(Boolean));
  const days = $derived(dateList(trip.startDate, trip.endDate));

  let summaryEl;
  let exporting = $state(false);

  function entriesFor(iso) {
    return (trip.itinerary || []).find((d) => d.date === iso)?.entries ?? [];
  }

  async function saveExport() {
    if (!summaryEl) return;
    const isMobile = window.innerWidth < 720;
    const filename = `${(trip.name || "trip").replace(/[^a-z0-9 _-]/gi, "")}-itinerary-${new Date().toISOString().slice(0, 10)}`;
    exporting = true;
    try {
      // Lazy-load so the export libs are a separate chunk, not in the main bundle.
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(summaryEl, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      if (isMobile) {
        // Mobile: JPEG (simpler, shareable, fewer deps needed at runtime).
        const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
        if (!blob) throw new Error("Could not generate the image.");
        downloadBlob(blob, `${filename}.jpg`);
        announce("Itinerary exported as image.");
      } else {
        // Desktop: multi-page A4 PDF via canvas slicing.
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableW = pageW - margin * 2;
        const usableH = pageH - margin * 2;
        const imgH = (canvas.height * usableW) / canvas.width;

        if (imgH <= usableH) {
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableW, imgH);
        } else {
          const pxPerPage = (canvas.width * usableH) / usableW;
          let srcY = 0, page = 0;
          while (srcY < canvas.height) {
            const sliceH = Math.min(pxPerPage, canvas.height - srcY);
            const slice = document.createElement("canvas");
            slice.width = canvas.width;
            slice.height = sliceH;
            slice.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
            if (page > 0) pdf.addPage();
            pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, usableW, (sliceH * usableW) / canvas.width);
            srcY += sliceH;
            page++;
          }
        }
        pdf.save(`${filename}.pdf`);
        announce("Itinerary exported as PDF.");
      }
    } catch (err) {
      announce(`Could not export: ${err.message}`, true);
    } finally {
      exporting = false;
    }
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
</script>

<div style="display:flex;justify-content:flex-end;margin-bottom:.5rem">
  <button class="btn btn-sm no-print" type="button" onclick={saveExport} disabled={exporting}>
    {exporting ? "Generating…" : "💾 Save / Export"}
  </button>
</div>

<div class="card summary" bind:this={summaryEl}>
  <h3 class="summary-title">{trip.name || "Trip"}</h3>
  <p class="meta">{trip.country?.name ? trip.country.name + " · " : ""}{fmtRange(trip.startDate, trip.endDate)}</p>

  {#if places.length}
    <p><strong>Places covered: </strong>{places.join(", ")}</p>
  {/if}
  {#if (trip.travellers || []).length}
    <p><strong>Travellers: </strong>{trip.travellers.join(", ")}</p>
  {/if}

  {#if (trip.flights || []).length}
    <h4 class="summary-h">Flights</h4>
    {#each trip.flights as fl (fl.id)}
      <p class="summary-line">
        {fl.label ? fl.label + ": " : ""}{fl.from || "?"} → {fl.to || "?"}{fl.flightNo ? " (" + fl.flightNo + ")" : ""}{fl.date ? " — " + fmtDate(fl.date) : ""}{fl.depTime ? ", dep " + fl.depTime : ""}{fl.arrTime ? ", arr " + fl.arrTime : ""}
      </p>
    {/each}
  {/if}

  {#if (trip.stays || []).length}
    <h4 class="summary-h">Accommodation</h4>
    {#each trip.stays as st (st.id)}
      <p class="summary-line">
        {st.name}{st.city ? ", " + st.city : ""}{st.checkIn ? " — in " + fmtDate(st.checkIn) : ""}{st.checkOut ? ", out " + fmtDate(st.checkOut) : ""}
      </p>
    {/each}
  {/if}

  {#if days.length}
    <h4 class="summary-h">Itinerary</h4>
    {#each days as iso (iso)}
      <div class="summary-day">
        <div class="summary-day-date">{fmtDate(iso, { weekday: "short", day: "numeric", month: "short" })}</div>
        <div class="summary-day-body">
          {#if entriesFor(iso).length}
            {#each entriesFor(iso) as t}
              <div>{t}</div>
            {/each}
          {:else}
            <div class="meta">—</div>
          {/if}
        </div>
      </div>
    {/each}
  {:else}
    <p class="meta">Set trip dates to build the day-by-day itinerary.</p>
  {/if}
</div>
