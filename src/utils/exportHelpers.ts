import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DEFAULT_CATEGORY_DEFINITIONS } from '../data/defaultCategories';
import { GroceryCategory } from '../types/grocery';

export function getDateStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getSelectedGroups(categories: GroceryCategory[]) {
  return categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.selected),
    }))
    .filter((cat) => cat.items.length > 0);
}

export function formatGroceryListText(categories: GroceryCategory[]): string {
  const groups = getSelectedGroups(categories);
  if (groups.length === 0) return '';

  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalQty = groups.reduce(
    (acc, g) => acc + g.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  const lines: string[] = [
    `SMART GROCERY LIST (${getDateStamp()})`,
    `Items: ${totalItems} | Total Qty: ${totalQty}`,
    '',
  ];

  for (const group of groups) {
    lines.push(`[${group.name}]`);
    for (const item of group.items) {
      const checkMark = item.bought ? '[x]' : '[ ]';
      const qtySuffix = item.quantity > 1 ? ` (x${item.quantity})` : '';
      lines.push(`${checkMark} ${item.name}${qtySuffix}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

export async function downloadElementAsJpg(
  element: HTMLElement,
  filename: string,
  scale = 3
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadGroceryPdf(categories: GroceryCategory[]): boolean {
  const groups = getSelectedGroups(categories);
  if (groups.length === 0) return false;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  let y = 18;

  const totalItems = groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalQty = groups.reduce(
    (acc, g) => acc + g.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Smart Grocery List', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${getDateStamp()}  ·  ${totalItems} unique items  ·  ${totalQty} total qty`,
    marginX,
    y + 6
  );

  y += 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  for (const group of groups) {
    ensureSpace(16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(21, 128, 61);
    doc.text(group.name, marginX, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5;

    for (const item of group.items) {
      ensureSpace(8);

      // Draw crisp checkbox square
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.35);
      doc.rect(marginX, y - 3.3, 3.6, 3.6);

      if (item.bought) {
        doc.setDrawColor(21, 128, 61);
        doc.line(marginX + 0.7, y - 1.5, marginX + 1.5, y - 0.5);
        doc.line(marginX + 1.5, y - 0.5, marginX + 3.0, y - 2.6);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(item.bought ? 148 : 15, item.bought ? 163 : 23, item.bought ? 184 : 42);
      const maxNameWidth = contentWidth - 22;
      const lines = doc.splitTextToSize(item.name, maxNameWidth) as string[];
      doc.text(lines[0], marginX + 6, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`x${item.quantity}`, pageWidth - marginX, y, { align: 'right' });

      y += 6.2;

      for (let i = 1; i < lines.length; i++) {
        ensureSpace(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(lines[i], marginX + 6, y);
        y += 5.5;
      }
    }

    y += 4;
  }

  doc.save(`smart-grocery-list-${getDateStamp()}.pdf`);
  return true;
}

export function downloadStandaloneHtml(categories: GroceryCategory[]): void {
  const safeInitialState = JSON.stringify(categories).replace(/</g, '\\u003c');
  const safeDefaultDefs = JSON.stringify(DEFAULT_CATEGORY_DEFINITIONS).replace(
    /</g,
    '\\u003c'
  );

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Grocery List</title>
  <style>
    :root {
      --bg: #f6f7f8;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --accent: #15803d;
      --accent-hover: #166534;
      --accent-soft: #f0fdf4;
      --danger: #dc2626;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 30;
    }
    .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .nav { display: flex; gap: 8px; }
    .nav button, .btn {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .nav button.active, .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-danger { color: var(--danger); }
    .container { max-width: 1280px; margin: 0 auto; padding: 20px 16px 48px; }
    .toolbar {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    input[type="text"], select {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 14px;
      outline: none;
      background: #fff;
      color: var(--text);
    }
    input[type="text"]:focus { border-color: var(--accent); }
    .search-input { flex: 1; min-width: 220px; }
    .segmented {
      display: inline-flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      gap: 4px;
    }
    .segmented button {
      border: none;
      background: transparent;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
      cursor: pointer;
    }
    .segmented button.active {
      background: #fff;
      color: var(--text);
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
      gap: 16px;
      align-items: start;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: 3px solid var(--cat-color, var(--accent));
      border-radius: 12px;
      overflow: hidden;
    }
    .card-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--cat-bg, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }
    .card-title { font-weight: 700; font-size: 15px; color: var(--cat-color, var(--text)); }
    .card-meta { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
    .item-list { list-style: none; margin: 0; padding: 0; }
    .item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 16px;
      min-height: 44px;
      border-bottom: 1px solid #f1f5f9;
    }
    .item-row.selected { background: var(--cat-bg, var(--accent-soft)); }
    .item-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .item-left label { cursor: pointer; font-size: 14px; word-break: break-word; }
    .item-left input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; }
    .item-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .qty-box {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fff;
      font-variant-numeric: tabular-nums;
    }
    .qty-box button {
      border: none;
      background: transparent;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-weight: 700;
    }
    .qty-box span { min-width: 22px; text-align: center; font-size: 13px; font-weight: 600; }
    .icon-btn {
      border: none;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      font-size: 13px;
    }
    .icon-btn:hover { background: #f1f5f9; color: var(--text); }
    .add-inline {
      display: flex;
      gap: 8px;
      padding: 10px 14px;
      background: #fafafa;
      border-top: 1px solid var(--border);
    }
    .add-inline input { flex: 1; min-width: 0; }
    .progress-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .progress-bar-bg {
      height: 10px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      margin-top: 10px;
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--accent);
      transition: width 180ms ease;
    }
    .receipt-shell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .receipt-paper {
      background: #fff;
      color: #000;
      font-family: "Courier New", Courier, monospace;
      padding: 18px 14px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 18px rgba(0,0,0,0.06);
      font-size: 13px;
      line-height: 1.45;
    }
    .receipt-58 { width: 290px; }
    .receipt-80 { width: 410px; }
    .receipt-center { text-align: center; }
    .receipt-divider { border-top: 1px dashed #000; margin: 10px 0; }
    .receipt-cat { font-weight: 700; margin-top: 8px; margin-bottom: 2px; text-transform: uppercase; font-size: 12px; }
    .receipt-line { display: flex; justify-content: space-between; gap: 8px; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 50;
    }
    .modal-backdrop.open { display: flex; }
    .modal {
      background: #fff;
      border-radius: 12px;
      max-width: 440px;
      width: 100%;
      padding: 20px;
      border: 1px solid var(--border);
    }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0f172a;
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      display: none;
      z-index: 60;
    }
    @media print {
      .no-print { display: none !important; }
      body { background: #fff; }
      .receipt-paper { border: none; box-shadow: none; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <header class="header no-print">
    <div class="brand">Smart Grocery List</div>
    <nav class="nav">
      <button id="nav-catalog" class="active" onclick="setMode('catalog')">Catalog</button>
      <button id="nav-checklist" onclick="setMode('checklist')">Generate List</button>
      <button id="nav-receipt" onclick="setMode('receipt')">Thermal Receipt</button>
    </nav>
    <button class="btn btn-primary" onclick="openAddModal()">+ Add Category/Item</button>
  </header>

  <main class="container">
    <section class="toolbar no-print">
      <div class="toolbar-row">
        <input id="searchInput" class="search-input" type="text" placeholder="Search items or categories..." oninput="onSearch(this.value)" />
        <div class="segmented">
          <button id="filter-all" class="active" onclick="setFilter('all')">All</button>
          <button id="filter-selected" onclick="setFilter('selected')">Selected</button>
          <button id="filter-unselected" onclick="setFilter('unselected')">Unselected</button>
        </div>
      </div>
      <div class="toolbar-row">
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <button class="btn" onclick="clearSelection()">Clear Selection</button>
          <button class="btn btn-danger" onclick="resetToOriginal()">Reset to Original</button>
          <button class="btn" onclick="copyText()">Copy Text</button>
          <button class="btn" onclick="window.print()">Print</button>
        </div>
        <div id="summaryStats" class="card-meta"></div>
      </div>
    </section>

    <div id="viewRoot"></div>
  </main>

  <div id="addModal" class="modal-backdrop no-print">
    <div class="modal">
      <h3 style="margin-top:0;">Add Category or Item</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <label style="font-size:13px;font-weight:600;">Category</label>
        <select id="modalCatSelect"></select>
        <input id="modalNewCatInput" type="text" placeholder="Or type a new category name..." />
        <label style="font-size:13px;font-weight:600;">Item Name (optional if adding category only)</label>
        <input id="modalItemInput" type="text" placeholder="e.g., Jasmine Rice" />
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          <button class="btn" onclick="closeAddModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitAddModal()">Save</button>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast no-print"></div>

  <script>
    const STORAGE_KEY = 'smart_grocery_list_v1';
    const DEFAULT_DEFS = ${safeDefaultDefs};
    const BAKED_INITIAL = ${safeInitialState};

    function createDefaults() {
      return DEFAULT_DEFS.map((cat) => ({
        id: cat.id,
        name: cat.name,
        collapsed: false,
        items: cat.items.map((name, idx) => ({
          id: cat.id + '-item-' + idx,
          name: name,
          selected: false,
          quantity: 1,
          bought: false
        }))
      }));
    }

    let state = {
      categories: [],
      mode: 'catalog',
      filter: 'all',
      search: '',
      receiptWidth: '58mm'
    };

    (function init() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          state.categories = JSON.parse(saved);
        } else {
          state.categories = BAKED_INITIAL;
        }
      } catch (e) {
        state.categories = BAKED_INITIAL;
      }
      render();
    })();

    function save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.categories)); } catch (e) {}
    }

    function showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.style.display = 'block';
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2400);
    }

    function setMode(mode) {
      state.mode = mode;
      ['catalog', 'checklist', 'receipt'].forEach((m) => {
        document.getElementById('nav-' + m).classList.toggle('active', m === mode);
      });
      render();
    }

    function setFilter(filter) {
      state.filter = filter;
      ['all', 'selected', 'unselected'].forEach((f) => {
        document.getElementById('filter-' + f).classList.toggle('active', f === filter);
      });
      render();
    }

    function onSearch(val) {
      state.search = val;
      render();
    }

    function toggleCollapse(catId) {
      state.categories = state.categories.map((c) => c.id === catId ? { ...c, collapsed: !c.collapsed } : c);
      save();
      render();
    }

    function toggleItem(catId, itemId) {
      state.categories = state.categories.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          items: c.items.map((it) => it.id === itemId ? { ...it, selected: !it.selected, bought: !it.selected ? false : it.bought } : it)
        };
      });
      save();
      render();
    }

    function toggleBought(catId, itemId) {
      state.categories = state.categories.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          items: c.items.map((it) => it.id === itemId ? { ...it, bought: !it.bought } : it)
        };
      });
      save();
      render();
    }

    function updateQty(catId, itemId, delta) {
      state.categories = state.categories.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          items: c.items.map((it) => it.id === itemId ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it)
        };
      });
      save();
      render();
    }

    function addItemInline(catId, inputId) {
      const input = document.getElementById(inputId);
      const name = (input.value || '').trim();
      if (!name) return;
      state.categories = state.categories.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          collapsed: false,
          items: [...c.items, {
            id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            name: name,
            selected: state.filter !== 'unselected',
            quantity: 1,
            bought: false
          }]
        };
      });
      save();
      render();
    }

    function editItem(catId, itemId) {
      const cat = state.categories.find((c) => c.id === catId);
      const item = cat && cat.items.find((i) => i.id === itemId);
      if (!item) return;
      const next = prompt('Edit item name:', item.name);
      if (next && next.trim()) {
        state.categories = state.categories.map((c) => c.id !== catId ? c : {
          ...c,
          items: c.items.map((i) => i.id === itemId ? { ...i, name: next.trim() } : i)
        });
        save();
        render();
      }
    }

    function deleteItem(catId, itemId) {
      state.categories = state.categories.map((c) => c.id !== catId ? c : {
        ...c,
        items: c.items.filter((i) => i.id !== itemId)
      });
      save();
      render();
    }

    function clearSelection() {
      state.categories = state.categories.map((c) => ({
        ...c,
        items: c.items.map((i) => ({ ...i, selected: false, bought: false }))
      }));
      save();
      render();
      showToast('Selection cleared');
    }

    function resetToOriginal() {
      if (!confirm('Restore the original 12 categories and pre-loaded items?')) return;
      state.categories = createDefaults();
      save();
      render();
      showToast('Restored original 12 categories');
    }

    function copyText() {
      const lines = [];
      state.categories.forEach((c) => {
        const sel = c.items.filter((i) => i.selected);
        if (sel.length) {
          lines.push('[' + c.name + ']');
          sel.forEach((i) => lines.push((i.bought ? '[x] ' : '[ ] ') + i.name + (i.quantity > 1 ? ' (x' + i.quantity + ')' : '')));
          lines.push('');
        }
      });
      if (!lines.length) { showToast('No items selected'); return; }
      navigator.clipboard.writeText(lines.join('\\n').trim()).then(() => showToast('Copied list to clipboard'));
    }

    function openAddModal() {
      const sel = document.getElementById('modalCatSelect');
      sel.innerHTML = state.categories.map((c) => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
      document.getElementById('modalNewCatInput').value = '';
      document.getElementById('modalItemInput').value = '';
      document.getElementById('addModal').classList.add('open');
    }

    function closeAddModal() {
      document.getElementById('addModal').classList.remove('open');
    }

    function submitAddModal() {
      const newCatName = document.getElementById('modalNewCatInput').value.trim();
      const selectedCatId = document.getElementById('modalCatSelect').value;
      const itemName = document.getElementById('modalItemInput').value.trim();

      if (newCatName) {
        const newCat = {
          id: 'cat-' + Date.now(),
          name: newCatName,
          collapsed: false,
          items: itemName ? [{ id: 'item-' + Date.now(), name: itemName, selected: true, quantity: 1, bought: false }] : []
        };
        state.categories.push(newCat);
      } else if (itemName && selectedCatId) {
        state.categories = state.categories.map((c) => c.id !== selectedCatId ? c : {
          ...c,
          collapsed: false,
          items: [...c.items, { id: 'item-' + Date.now(), name: itemName, selected: true, quantity: 1, bought: false }]
        });
      }
      save();
      closeAddModal();
      render();
    }

    function saveReceiptCanvasJpg() {
      const selectedGroups = state.categories
        .map((c) => ({ name: c.name, items: c.items.filter((i) => i.selected) }))
        .filter((g) => g.items.length > 0);
      if (!selectedGroups.length) { showToast('Select items first'); return; }

      const widthPx = state.receiptWidth === '58mm' ? 384 : 576;
      const pad = 20;
      const lineHeight = 26;
      let totalLines = 8;
      selectedGroups.forEach((g) => { totalLines += 2 + g.items.length; });

      const canvas = document.createElement('canvas');
      canvas.width = widthPx;
      canvas.height = Math.max(320, totalLines * lineHeight + 80);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      let y = 38;
      ctx.fillText('SMART GROCERY LIST', widthPx / 2, y);
      y += 24;
      ctx.font = '14px monospace';
      ctx.fillText(new Date().toLocaleString(), widthPx / 2, y);
      y += 20;
      ctx.textAlign = 'left';
      ctx.fillText('-'.repeat(state.receiptWidth === '58mm' ? 28 : 44), pad, y);
      y += 24;

      let totalCount = 0;
      let totalQty = 0;
      selectedGroups.forEach((g) => {
        ctx.font = 'bold 14px monospace';
        ctx.fillText(g.name.toUpperCase(), pad, y);
        y += 22;
        ctx.font = '15px monospace';
        g.items.forEach((it) => {
          totalCount += 1;
          totalQty += it.quantity;
          ctx.textAlign = 'left';
          ctx.fillText('[ ] ' + it.name, pad, y);
          ctx.textAlign = 'right';
          ctx.fillText('x' + it.quantity, widthPx - pad, y);
          y += 24;
        });
        y += 8;
      });

      ctx.textAlign = 'left';
      ctx.font = '14px monospace';
      ctx.fillText('-'.repeat(state.receiptWidth === '58mm' ? 28 : 44), pad, y);
      y += 24;
      ctx.font = 'bold 16px monospace';
      ctx.fillText('TOTAL ITEMS: ' + totalCount + '  QTY: ' + totalQty, pad, y);

      const link = document.createElement('a');
      link.download = 'grocery-receipt-' + state.receiptWidth + '.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.96);
      link.click();
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function render() {
      let selectedCount = 0;
      let totalQty = 0;
      state.categories.forEach((c) => c.items.forEach((i) => {
        if (i.selected) { selectedCount++; totalQty += i.quantity; }
      }));
      document.getElementById('summaryStats').textContent = selectedCount + ' selected · ' + totalQty + ' total qty';

      const root = document.getElementById('viewRoot');

      if (state.mode === 'checklist') {
        const groups = state.categories
          .map((c) => ({ ...c, items: c.items.filter((i) => i.selected) }))
          .filter((c) => c.items.length > 0);
        const picked = groups.reduce((acc, g) => acc + g.items.filter((i) => i.bought).length, 0);
        const pct = selectedCount ? Math.round((picked / selectedCount) * 100) : 0;

        if (!groups.length) {
          root.innerHTML = '<div class="card" style="padding:36px;text-align:center;"><h3>No items selected</h3><p style="color:var(--muted);">Select items in the Catalog to generate your shopping checklist.</p><button class="btn btn-primary" onclick="setMode(\\'catalog\\')">Browse Catalog</button></div>';
          return;
        }

        let html = '<div class="progress-wrap"><div style="display:flex;justify-content:space-between;align-items:center;"><strong>Shopping Progress: ' + picked + ' of ' + selectedCount + ' picked up (' + pct + '%)</strong><button class="btn" onclick="setMode(\\'receipt\\')">Open Thermal Receipt</button></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div></div>';
        html += '<div class="grid">';
        groups.forEach((g) => {
          html += '<div class="card"><div class="card-header"><span class="card-title">' + escapeHtml(g.name) + '</span><span class="card-meta">' + g.items.filter((i) => i.bought).length + '/' + g.items.length + '</span></div><ul class="item-list">';
          g.items.forEach((it) => {
            html += '<li class="item-row ' + (it.bought ? 'selected' : '') + '"><div class="item-left"><input type="checkbox" ' + (it.bought ? 'checked' : '') + ' onchange="toggleBought(\\'' + g.id + '\\',\\'' + it.id + '\\')" /><label style="' + (it.bought ? 'text-decoration:line-through;color:var(--muted);' : '') + '" onclick="toggleBought(\\'' + g.id + '\\',\\'' + it.id + '\\')">' + escapeHtml(it.name) + '</label></div><span class="card-meta">x' + it.quantity + '</span></li>';
          });
          html += '</ul></div>';
        });
        html += '</div>';
        root.innerHTML = html;
        return;
      }

      if (state.mode === 'receipt') {
        const groups = state.categories
          .map((c) => ({ ...c, items: c.items.filter((i) => i.selected) }))
          .filter((c) => c.items.length > 0);
        let html = '<div class="receipt-shell">';
        html += '<div class="no-print" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">'
          + '<div class="segmented">'
          + '<button class="' + (state.receiptWidth === '58mm' ? 'active' : '') + '" onclick="state.receiptWidth=\\'58mm\\';render()">58mm</button>'
          + '<button class="' + (state.receiptWidth === '80mm' ? 'active' : '') + '" onclick="state.receiptWidth=\\'80mm\\';render()">80mm</button>'
          + '</div>'
          + '<button class="btn btn-primary" onclick="saveReceiptCanvasJpg()">Save Receipt JPG</button>'
          + '<button class="btn" onclick="window.print()">Print</button>'
          + '</div>';

        html += '<div class="receipt-paper ' + (state.receiptWidth === '58mm' ? 'receipt-58' : 'receipt-80') + '">';
        html += '<div class="receipt-center"><div style="font-weight:700;font-size:16px;">SMART GROCERY LIST</div><div style="font-size:11px;">' + new Date().toLocaleString() + '</div></div><div class="receipt-divider"></div>';
        if (!groups.length) {
          html += '<div class="receipt-center" style="padding:18px 0;">No items selected.</div>';
        } else {
          groups.forEach((g) => {
            html += '<div class="receipt-cat">' + escapeHtml(g.name) + '</div>';
            g.items.forEach((it) => {
              html += '<div class="receipt-line"><span>[ ] ' + escapeHtml(it.name) + '</span><span>x' + it.quantity + '</span></div>';
            });
          });
        }
        html += '<div class="receipt-divider"></div><div class="receipt-line" style="font-weight:700;"><span>TOTAL ITEMS: ' + selectedCount + '</span><span>QTY: ' + totalQty + '</span></div>';
        html += '</div></div>';
        root.innerHTML = html;
        return;
      }

      const CAT_COLORS = [
        ['#059669', '#ecfdf5'],
        ['#d97706', '#fffbeb'],
        ['#0284c7', '#f0f9ff'],
        ['#0d9488', '#f0fdfa'],
        ['#4f46e5', '#eef2ff'],
        ['#ea580c', '#fff7ed'],
        ['#e11d48', '#fff1f2'],
        ['#7c3aed', '#f5f3ff'],
        ['#db2777', '#fdf2f8'],
        ['#dc2626', '#fef2f2'],
        ['#ca8a04', '#fefce8'],
        ['#0891b2', '#ecfeff']
      ];

      const q = state.search.trim().toLowerCase();
      let html = '<div class="grid">';
      state.categories.forEach((cat, idx) => {
        const pair = CAT_COLORS[idx % CAT_COLORS.length];
        const catMatches = !q || cat.name.toLowerCase().includes(q);
        const visibleItems = cat.items.filter((it) => {
          if (state.filter === 'selected' && !it.selected) return false;
          if (state.filter === 'unselected' && it.selected) return false;
          if (q && !catMatches && !it.name.toLowerCase().includes(q)) return false;
          return true;
        });
        if (q && visibleItems.length === 0 && !catMatches) return;
        const catSelectedCount = cat.items.filter((i) => i.selected).length;

        html += '<div class="card" style="--cat-color:' + pair[0] + ';--cat-bg:' + pair[1] + ';">';
        html += '<div class="card-header" onclick="toggleCollapse(\\'' + cat.id + '\\')"><div><div class="card-title">' + escapeHtml(cat.name) + '</div><div class="card-meta">' + catSelectedCount + ' selected · ' + cat.items.length + ' items</div></div><span>' + (cat.collapsed ? '+' : '−') + '</span></div>';
        if (!cat.collapsed) {
          html += '<ul class="item-list">';
          visibleItems.forEach((it) => {
            html += '<li class="item-row ' + (it.selected ? 'selected' : '') + '">'
              + '<div class="item-left">'
              + '<input type="checkbox" id="chk-' + it.id + '" ' + (it.selected ? 'checked' : '') + ' onchange="toggleItem(\\'' + cat.id + '\\',\\'' + it.id + '\\')" />'
              + '<label for="chk-' + it.id + '">' + escapeHtml(it.name) + '</label>'
              + '</div>'
              + '<div class="item-actions">'
              + (it.selected ? '<div class="qty-box"><button onclick="updateQty(\\'' + cat.id + '\\',\\'' + it.id + '\\',-1)">-</button><span>' + it.quantity + '</span><button onclick="updateQty(\\'' + cat.id + '\\',\\'' + it.id + '\\',1)">+</button></div>' : '')
              + '<button class="icon-btn" title="Edit" onclick="editItem(\\'' + cat.id + '\\',\\'' + it.id + '\\')">✎</button>'
              + '<button class="icon-btn" title="Delete" onclick="deleteItem(\\'' + cat.id + '\\',\\'' + it.id + '\\')">✕</button>'
              + '</div></li>';
          });
          html += '</ul>';
          html += '<div class="add-inline"><input id="add-' + cat.id + '" type="text" placeholder="Add item to ' + escapeHtml(cat.name) + '..." onkeydown="if(event.key===\\'Enter\\')addItemInline(\\'' + cat.id + '\\',\\'add-' + cat.id + '\\')" /><button class="btn" onclick="addItemInline(\\'' + cat.id + '\\',\\'add-' + cat.id + '\\')">Add</button></div>';
        }
        html += '</div>';
      });
      html += '</div>';
      root.innerHTML = html;
    }
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'index.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
