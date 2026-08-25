/**
 * CARRY N GO — WHOLESALE INQUIRY FORM
 * ------------------------------------------------------------------
 * Vanilla JS, no build step, so this drops straight onto GitHub Pages.
 *
 * Flow: Step 1 (pick items) -> Step 2 (quantity range per item)
 *       -> Step 3 (business details) -> Step 4 (review + send).
 *
 * FUTURE VERSION — see the "NEXT VERSION" comment blocks throughout
 * this file for exactly where each planned feature plugs in:
 *   - Email notifications (customer confirmation + admin alert)
 *   - Admin panel to sort/manage incoming wholesale requests
 *   - ClickUp List as the backend (auto-create a task per inquiry)
 */

(function () {
  "use strict";

  const state = {
    currentStep: 1,
    totalSteps: 4,
    selectedItems: new Set(), // SKUs
    unsureBulk: false,
    quantities: {}, // sku -> range value
  };

  const els = {
    steps: document.querySelectorAll(".step"),
    panels: document.querySelectorAll(".panel"),
    itemGroups: document.getElementById("itemGroups"),
    unsureBulk: document.getElementById("unsureBulk"),
    itemsError: document.getElementById("itemsError"),
    quantityList: document.getElementById("quantityList"),
    quantitySkippedNote: document.getElementById("quantitySkippedNote"),
    contactError: document.getElementById("contactError"),
    receipt: document.getElementById("receipt"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    submitBtn: document.getElementById("submitBtn"),
    successState: document.getElementById("successState"),
    form: document.getElementById("wholesaleForm"),
  };

  /* ------------------------------------------------------------ *
   * STEP 1 — render item checkboxes, grouped by category
   * ------------------------------------------------------------ */

  function groupByCategory(items) {
    const groups = {};
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }

  function renderItemGroups() {
    const groups = groupByCategory(INVENTORY);
    const frag = document.createDocumentFragment();

    Object.keys(groups).forEach((category) => {
      const section = document.createElement("div");
      section.className = "item-category";

      const title = document.createElement("p");
      title.className = "item-category-title";
      title.textContent = category;
      section.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "item-grid";

      groups[category].forEach((item) => {
        const label = document.createElement("label");
        label.className = "check-card";

        label.innerHTML = `
          <input type="checkbox" name="items" value="${item.sku}">
          <span class="check-card-body">
            <span class="check-card-sku">${item.sku}</span>
            <span class="check-card-title">${item.name}</span>
            <span class="check-card-desc">${item.description}</span>
          </span>
        `;

        const checkbox = label.querySelector("input");
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            state.selectedItems.add(item.sku);
          } else {
            state.selectedItems.delete(item.sku);
          }
          clearFieldError(els.itemsError);
        });

        grid.appendChild(label);
      });

      section.appendChild(grid);
      frag.appendChild(section);
    });

    els.itemGroups.appendChild(frag);
  }

  els.unsureBulk.addEventListener("change", () => {
    state.unsureBulk = els.unsureBulk.checked;
    els.itemGroups.style.opacity = state.unsureBulk ? "0.4" : "1";
    els.itemGroups
      .querySelectorAll("input[type='checkbox']")
      .forEach((cb) => (cb.disabled = state.unsureBulk));
    clearFieldError(els.itemsError);
  });

  /* ------------------------------------------------------------ *
   * STEP 2 — render one quantity dropdown per selected item
   * ------------------------------------------------------------ */

  function renderQuantityList() {
    els.quantityList.innerHTML = "";

    if (state.unsureBulk) {
      els.quantitySkippedNote.hidden = false;
      return;
    }
    els.quantitySkippedNote.hidden = true;

    const selected = INVENTORY.filter((i) => state.selectedItems.has(i.sku));

    if (selected.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-note";
      empty.textContent = "No items selected yet — go back to Step 1 to choose what you need.";
      els.quantityList.appendChild(empty);
      return;
    }

    selected.forEach((item) => {
      const row = document.createElement("div");
      row.className = "qty-row";
      row.dataset.sku = item.sku;

      const options = QUANTITY_RANGES.map(
        (r) => `<option value="${r.value}">${r.label}</option>`
      ).join("");

      row.innerHTML = `
        <div class="qty-row-info">
          <span class="qty-row-sku">${item.sku}</span>
          <span class="qty-row-name">${item.name}</span>
        </div>
        <div class="qty-row-select-wrap">
          <select aria-label="Quantity range for ${item.name}">${options}</select>
          <span class="qty-row-error">Minimum wholesale order is ${WHOLESALE_MINIMUM_UNITS} units — please choose a higher range.</span>
        </div>
      `;

      const select = row.querySelector("select");
      if (state.quantities[item.sku]) {
        select.value = state.quantities[item.sku];
      }

      select.addEventListener("change", () => {
        state.quantities[item.sku] = select.value;
        const rangeDef = QUANTITY_RANGES.find((r) => r.value === select.value);
        row.classList.toggle("has-error", !!(rangeDef && rangeDef.belowMinimum));
      });

      els.quantityList.appendChild(row);
    });
  }

  /* ------------------------------------------------------------ *
   * VALIDATION
   * ------------------------------------------------------------ */

  function clearFieldError(el) {
    el.hidden = true;
  }

  function validateStep1() {
    if (state.unsureBulk) return true;
    if (state.selectedItems.size === 0) {
      els.itemsError.hidden = false;
      els.itemsError.scrollIntoView({ block: "center", behavior: "smooth" });
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (state.unsureBulk) return true;

    let ok = true;
    let firstErrorRow = null;

    state.selectedItems.forEach((sku) => {
      const value = state.quantities[sku];
      const rangeDef = QUANTITY_RANGES.find((r) => r.value === value);
      const row = els.quantityList.querySelector(`.qty-row[data-sku="${sku}"]`);

      if (!value || (rangeDef && rangeDef.belowMinimum)) {
        ok = false;
        if (row) {
          row.classList.add("has-error");
          if (!firstErrorRow) firstErrorRow = row;
        }
      }
    });

    if (!ok && firstErrorRow) {
      firstErrorRow.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return ok;
  }

  function validateStep3() {
    const requiredIds = ["contactName", "businessName", "email", "businessType"];
    let ok = true;
    requiredIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el.value.trim()) ok = false;
    });

    const email = document.getElementById("email").value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ok = false;

    if (!ok) {
      els.contactError.hidden = false;
      els.contactError.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      clearFieldError(els.contactError);
    }
    return ok;
  }

  const stepValidators = { 1: validateStep1, 2: validateStep2, 3: validateStep3, 4: () => true };

  /* ------------------------------------------------------------ *
   * STEP 4 — build the review "receipt"
   * ------------------------------------------------------------ */

  function rangeLabel(value) {
    const r = QUANTITY_RANGES.find((x) => x.value === value);
    return r ? r.label : "—";
  }

  function renderReceipt() {
    const selected = INVENTORY.filter((i) => state.selectedItems.has(i.sku));

    const itemsHtml = state.unsureBulk
      ? `<p class="receipt-empty">General bulk quote requested — no specific items selected.</p>`
      : selected.length
      ? selected
          .map(
            (item) => `
        <div class="receipt-line">
          <span>${item.sku} — ${item.name}</span>
          <span>${rangeLabel(state.quantities[item.sku])}</span>
        </div>`
          )
          .join("")
      : `<p class="receipt-empty">No items selected.</p>`;

    const get = (id) => document.getElementById(id).value.trim();
    const selectText = (id) => {
      const el = document.getElementById(id);
      return el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : "—";
    };

    els.receipt.innerHTML = `
      <h3>Items Requested</h3>
      <div class="receipt-section">${itemsHtml}</div>

      <h3>Business Details</h3>
      <div class="receipt-section">
        <div class="receipt-line"><span>Contact</span><span>${get("contactName") || "—"}</span></div>
        <div class="receipt-line"><span>Business</span><span>${get("businessName") || "—"}</span></div>
        <div class="receipt-line"><span>Email</span><span>${get("email") || "—"}</span></div>
        <div class="receipt-line"><span>Phone</span><span>${get("phone") || "—"}</span></div>
        <div class="receipt-line"><span>Type</span><span>${selectText("businessType")}</span></div>
        <div class="receipt-line"><span>Location</span><span>${get("deliveryAddress") || "—"}</span></div>
        <div class="receipt-line"><span>Fulfillment</span><span>${selectText("fulfillment")}</span></div>
        <div class="receipt-line"><span>Timeline</span><span>${selectText("timeline")}</span></div>
      </div>

      ${
        get("notes")
          ? `<h3>Notes</h3><div class="receipt-section"><p class="receipt-empty" style="font-style:normal;color:var(--ink);">${get(
              "notes"
            )}</p></div>`
          : ""
      }
    `;
  }

  /* ------------------------------------------------------------ *
   * STEP NAVIGATION
   * ------------------------------------------------------------ */

  function goToStep(n) {
    state.currentStep = n;

    els.panels.forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.panel) === n);
    });

    els.steps.forEach((step) => {
      const stepNum = Number(step.dataset.step);
      step.classList.toggle("is-active", stepNum === n);
      step.classList.toggle("is-complete", stepNum < n);
    });

    els.prevBtn.disabled = n === 1;

    if (n === 2) renderQuantityList();
    if (n === 4) renderReceipt();

    // Swap the nav button on the final step for the real submit button.
    els.nextBtn.hidden = n === state.totalSteps;
    els.submitBtn.parentElement.style.display = n === state.totalSteps ? "" : "none";

    window.scrollTo({ top: document.querySelector(".stepper").offsetTop - 20, behavior: "smooth" });
  }

  els.nextBtn.addEventListener("click", () => {
    const validator = stepValidators[state.currentStep];
    if (validator && !validator()) return;
    if (state.currentStep < state.totalSteps) goToStep(state.currentStep + 1);
  });

  els.prevBtn.addEventListener("click", () => {
    if (state.currentStep > 1) goToStep(state.currentStep - 1);
  });

  /* ------------------------------------------------------------ *
   * SUBMISSION
   * ------------------------------------------------------------ *
   * NEXT VERSION: replace this whole handler with a POST to a real
   * backend endpoint. Two natural options:
   *
   *   A) Email notifications (customer + admin), e.g. via a small
   *      serverless function (Cloudflare Worker / Netlify Function)
   *      calling an email API (Postmark, Resend, SendGrid). Send a
   *      confirmation to the customer's `email` field and a parallel
   *      alert to the internal wholesale inbox.
   *
   *   B) ClickUp as the system of record: on submit, POST to
   *      https://api.clickup.com/api/v2/list/{list_id}/task with the
   *      form fields mapped to custom fields (Items, Quantities,
   *      Business Name, Contact, Status = "New Inquiry"). This is
   *      also what would power an admin panel — read tasks back out
   *      of that same ClickUp list, sortable by status/date/value.
   *
   * For this demo, we build a mailto: link so the form is genuinely
   * usable today without any backend — it hands off a fully drafted
   * email to the visitor's own mail client.
   * ------------------------------------------------------------ */

  function buildEmailBody() {
    const selected = INVENTORY.filter((i) => state.selectedItems.has(i.sku));
    const get = (id) => document.getElementById(id).value.trim();
    const selectText = (id) => {
      const el = document.getElementById(id);
      return el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : "—";
    };

    const lines = [];
    lines.push("WHOLESALE INQUIRY — Carry n Go");
    lines.push("");
    lines.push("ITEMS REQUESTED");
    if (state.unsureBulk) {
      lines.push("- General bulk quote requested (no specific items selected)");
    } else if (selected.length) {
      selected.forEach((item) => {
        lines.push(`- ${item.sku} ${item.name}: ${rangeLabel(state.quantities[item.sku])}`);
      });
    } else {
      lines.push("- (none selected)");
    }
    lines.push("");
    lines.push("BUSINESS DETAILS");
    lines.push(`Contact: ${get("contactName")}`);
    lines.push(`Business: ${get("businessName")}`);
    lines.push(`Email: ${get("email")}`);
    lines.push(`Phone: ${get("phone") || "—"}`);
    lines.push(`Type: ${selectText("businessType")}`);
    lines.push(`Location: ${get("deliveryAddress") || "—"}`);
    lines.push(`Fulfillment: ${selectText("fulfillment")}`);
    lines.push(`Timeline: ${selectText("timeline")}`);
    if (get("notes")) {
      lines.push("");
      lines.push("NOTES");
      lines.push(get("notes"));
    }
    return lines.join("\n");
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateStep3()) {
      goToStep(3);
      return;
    }

    renderReceipt();

    // NEXT VERSION: swap this mailto for a fetch() POST to the real
    // backend (see block comment above).
    const subject = encodeURIComponent(
      `Wholesale Inquiry — ${document.getElementById("businessName").value.trim() || "New request"}`
    );
    const body = encodeURIComponent(buildEmailBody());
    const mailtoLink = `mailto:wholesale@carryngonow.com?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = "Inquiry drafted ✓";
    els.successState.hidden = false;
  });

  /* ------------------------------------------------------------ *
   * INIT
   * ------------------------------------------------------------ */

  renderItemGroups();
  goToStep(1);
})();
