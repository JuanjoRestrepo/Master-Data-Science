// charts-main.js - Modern UI + branding colors + export PNG/PDF + formatting + Dark/Light mode + html2canvas table export
(function () {
  // --------- Helpers ----------
  function logStatus(msg, level = 'info') {
    console[level === 'error' ? 'error' : 'log']('[status]', msg);
    const ul = document.getElementById('statusList');
    if (ul) {
      const li = document.createElement('li');
      li.textContent = msg;
      if (level === 'error') li.style.color = '#b91c1c';
      ul.appendChild(li);
    }
  }

  function parseNumberFromString(v) {
    if (v == null) return NaN;
    const s = String(v).trim();
    if (!s) return NaN;
    if (/^(na|n\/a|none|null|-)$/i.test(s)) return NaN;
    if (/^free$/i.test(s)) return 0;
    let t = s.replace(/\s+/g, '');
    let m = t.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[Mｍ]\+?$/);
    if (m) return parseFloat(m[1]) * 1_000_000;
    let k = t.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[Kk]\+?$/);
    if (k) return parseFloat(k[1]) * 1_000;
    t = t.replace(/[,+]/g, '').replace(/[^0-9.\-]/g, '');
    if (t === '' || t === '.' || t === '-') return NaN;
    const n = parseFloat(t);
    return isNaN(n) ? NaN : n;
  }

  const nn = (x) => (isNaN(x) || x === null ? 0 : x);

  // Devuelve colores actuales del tema leyendo variables CSS
  function getThemeColors() {
    const cs = getComputedStyle(document.body);
    const textColor = (cs.getPropertyValue('--text') || '').trim() || '#0f172a';
    const mutedColor =
      (cs.getPropertyValue('--muted') || '').trim() || '#6b7280';
    return { textColor, mutedColor };
  }

  // --------- State ----------
  let headersGlobal = [];
  let itemsGlobal = [];
  let chartMap = {}; // store chart instances by id
  let palette = ['#2563eb', '#f97316', '#10b981']; // default palette (3 colors)

  // --------- UI ensure ----------
  function ensureUI() {
    // create container
    if (!document.querySelector('.container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'container';
      // move existing children into wrapper
      while (document.body.firstChild)
        wrapper.appendChild(document.body.firstChild);
      document.body.appendChild(wrapper);
    }

    // debug area
    if (!document.getElementById('debugStatus')) {
      const dbg = document.createElement('div');
      dbg.id = 'debugStatus';
      dbg.innerHTML = '<strong>Debug status</strong><ul id="statusList"></ul>';
      document.querySelector('.container').prepend(dbg);
      logStatus('Debug status creado.');
    }

    // controls area
    if (!document.getElementById('controlsArea')) {
      const controls = document.createElement('div');
      controls.id = 'controlsArea';
      controls.className = 'card';
      controls.innerHTML = `
        <label class="small">Category:</label>
        <select id="selCategory"><option value="__all__">All</option></select>
        <label class="small" style="margin-left:8px">Search:</label>
        <input id="searchTitle" type="search" placeholder="Buscar título..." />
        <label class="small" style="margin-left:8px">Top N:</label>
        <input id="inputTopN" type="range" min="5" max="50" value="10" />
        <span id="labelTopN">10</span>
        <label class="small" style="margin-left:8px">Color 1</label><input id="color1" type="color" value="${palette[0]}" />
        <label class="small">Color 2</label><input id="color2" type="color" value="${palette[1]}" />
        <label class="small">Color 3</label><input id="color3" type="color" value="${palette[2]}" />
        <button id="btnApplyColors" class="btn btn-ghost">Aplicar colores</button>
        <button id="btnRegenerate" class="btn btn-primary">Regenerar aleatorios</button>
        <button id="btnDownload" class="btn btn-ghost">Descargar CSV aumentado</button>
        <button id="btnToggleDebug" class="btn btn-ghost">Toggle Debug</button>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          <div class="theme-toggle" id="themeToggle" title="Cambiar Dark/Light mode">
            <label style="display:inline-flex;align-items:center;gap:8px">
              <input id="themeCheckbox" type="checkbox" aria-label="Toggle dark mode" />
              <span id="themeLabel">Dark</span>
            </label>
          </div>
        </div>
      `;
      const grid =
        document.querySelector('.grid') || document.createElement('div');
      grid.classList.add('grid');
      document.querySelector('.container').insertBefore(controls, grid);

      // events
      document.getElementById('inputTopN').addEventListener('input', (e) => {
        document.getElementById('labelTopN').textContent = e.target.value;
        redrawFiltered();
      });
      document
        .getElementById('selCategory')
        .addEventListener('change', redrawFiltered);
      document
        .getElementById('searchTitle')
        .addEventListener('input', () => debounceRedraw());
      document
        .getElementById('btnRegenerate')
        .addEventListener('click', regenerateRandoms);
      document
        .getElementById('btnToggleDebug')
        .addEventListener('click', () => {
          const dbg = document.getElementById('debugStatus');
          dbg.style.display = dbg.style.display === 'none' ? '' : 'none';
        });
      document
        .getElementById('btnDownload')
        .addEventListener('click', createDownloadButton);
      document
        .getElementById('btnApplyColors')
        .addEventListener('click', () => {
          palette = [
            document.getElementById('color1').value,
            document.getElementById('color2').value,
            document.getElementById('color3').value,
          ];
          logStatus('Nueva paleta aplicada: ' + palette.join(', '));
          redrawFiltered();
        });
    }

    // cards & grid
    const required = [
      { id: 'chart_top10', title: 'Figure A — Top 10 by Global Sales' },
      {
        id: 'chart_pie_regions',
        title: 'Figure B — Regional sales share (sum)',
      },
      {
        id: 'chart_bar_rating',
        title: 'Figure C — Avg User Rating by Category',
      },
      { id: 'chart_scatter', title: 'Figure D — Installs vs Price (scatter)' },
      {
        id: 'chart_line_growth',
        title: 'Figure E — Growth 30 vs 60 (avg) top categories',
      },
      { id: 'chart_table', title: 'Figure F — Top-rated games table' },
    ];
    let grid = document.querySelector('.grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'grid';
      document.querySelector('.container').appendChild(grid);
    }
    required.forEach((it) => {
      if (!document.getElementById(it.id)) {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = 'card_' + it.id;
        const h = document.createElement('div');
        h.className = 'chart-title';
        h.textContent = it.title;
        card.appendChild(h);

        // toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'card-toolbar';
        toolbar.innerHTML = `<div class="icon-btn" data-target="${it.id}" data-action="png" title="Descargar PNG"><span>PNG</span></div>
                             <div class="icon-btn" data-target="${it.id}" data-action="pdf" title="Descargar PDF"><span>PDF</span></div>
                             <div class="icon-btn" data-target="${it.id}" data-action="csv" title="Descargar CSV"><span>CSV</span></div>`;
        card.appendChild(toolbar);

        const cdiv = document.createElement('div');
        cdiv.id = it.id;
        cdiv.style.minHeight = '300px';
        card.appendChild(cdiv);
        grid.appendChild(card);

        // attach toolbar events
        toolbar.querySelectorAll('.icon-btn').forEach((btn) => {
          btn.addEventListener('click', async (ev) => {
            const target = ev.currentTarget.getAttribute('data-target');
            const action = ev.currentTarget.getAttribute('data-action');
            await handleExportAction(target, action);
          });
        });
      }
    });

    // theme wiring
    const themeToggleEl = document.getElementById('themeToggle');
    if (themeToggleEl) {
      const cb = document.getElementById('themeCheckbox');
      setTimeout(() => initThemeFromStorage(), 50);
      cb.addEventListener('change', (e) => {
        const checked = !!e.target.checked;
        document.getElementById('themeLabel').textContent = checked
          ? 'Dark'
          : 'Light';
        applyTheme(checked);
      });
    }
  }

  // --------- Export handlers ----------
  async function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const src =
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => {
        logStatus('jsPDF cargado.');
        resolve();
      };
      s.onerror = () => {
        logStatus('No se pudo cargar jsPDF', 'error');
        reject();
      };
      document.head.appendChild(s);
    });
  }

  // Export element to PNG using html2canvas
  async function exportElementAsPNG(element, filename = 'export.png') {
    if (typeof html2canvas === 'undefined') {
      logStatus('html2canvas no disponible para exportar PNG.', 'error');
      return;
    }
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const uri = canvas.toDataURL('image/png');
      downloadURI(uri, filename);
      logStatus(`PNG exportado: ${filename}`);
    } catch (e) {
      logStatus(
        'Error exportando elemento a PNG: ' + (e.message || e),
        'error'
      );
      console.error(e);
    }
  }

  async function exportTableAsPNG() {
    const el = document.getElementById('chart_table');
    if (!el) {
      logStatus('Elemento de tabla no encontrado', 'error');
      return;
    }
    const tableDOM = el.querySelector('table') || el;
    await exportElementAsPNG(tableDOM, 'chart_table.png');
  }

  function downloadURI(uri, name) {
    const a = document.createElement('a');
    a.href = uri;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleExportAction(targetId, action) {
    try {
      // CSV (table) special case
      if (action === 'csv' && targetId === 'chart_table') {
        createDownloadButton();
        return;
      }
      // PNG for table: use html2canvas
      if (action === 'png' && targetId === 'chart_table') {
        await exportTableAsPNG();
        return;
      }

      const chartObj = chartMap[targetId];
      if (!chartObj) {
        logStatus('Chart no disponible para export: ' + targetId, 'error');
        return;
      }
      const chartNative = chartObj.getChart ? chartObj.getChart() : chartObj;
      if (!chartNative || typeof chartNative.getImageURI !== 'function') {
        logStatus(
          'Este tipo de elemento no admite export de imagen: ' + targetId,
          'error'
        );
        return;
      }
      const uri = chartNative.getImageURI();
      if (action === 'png') {
        downloadURI(uri, `${targetId}.png`);
        logStatus('PNG descargado: ' + targetId);
        return;
      }
      if (action === 'pdf') {
        await ensureJsPdf();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape' });
        const w = pdf.internal.pageSize.getWidth() - 20;
        const h = pdf.internal.pageSize.getHeight() - 20;
        pdf.addImage(uri, 'PNG', 10, 10, w, h);
        pdf.save(`${targetId}.pdf`);
        logStatus('PDF generado: ' + targetId);
        return;
      }
    } catch (e) {
      logStatus(
        'Error exportando ' + targetId + ': ' + (e.message || e),
        'error'
      );
      console.error(e);
    }
  }

  // --------- CSV download builder ----------
  function createDownloadButton() {
    if (!itemsGlobal.length || !headersGlobal.length) {
      logStatus('No hay datos para descargar.', 'error');
      return;
    }
    const headerRow = headersGlobal.slice();
    const rows = itemsGlobal.map((it) => {
      return headerRow
        .map((h) => {
          const key = (h || '').toLowerCase();
          if (key === 'title')
            return `"${(it.title || '').replace(/"/g, '""')}"`;
          if (key.includes('us') && it.us !== undefined) return String(it.us);
          if (key.includes('eu') && it.eu !== undefined) return String(it.eu);
          if (key.includes('jp') && it.jp !== undefined) return String(it.jp);
          if (key.includes('global') && it.global !== undefined)
            return String(it.global);
          if (key.includes('user') && it.user_rating !== undefined)
            return String(it.user_rating);
          if (key.includes('critic') && it.critic_rating !== undefined)
            return String(it.critic_rating);
          if (key === 'category')
            return `"${(it.category || '').replace(/"/g, '""')}"`;
          if (key === 'price') return String(it.price || 0);
          if (key === 'installs') return String(it.installs || 0);
          return '';
        })
        .join(';');
    });
    const csvText = [headerRow.join(';')].concat(rows).join('\r\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'android_games_sales_augmented.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    logStatus('CSV aumentado descargado.');
  }

  // --------- Data load + build items ----------
  async function drawAll() {
    logStatus('Cargando CSV...');
    try {
      const resp = await fetch('data/android_games_sales.csv', {
        cache: 'no-store',
      });
      if (!resp.ok) {
        logStatus('Fetch failed: ' + resp.status, 'error');
        return;
      }
      const txt = (await resp.text()).replace(/^\uFEFF/, '').trim();
      if (!txt) {
        logStatus('CSV vacío', 'error');
        return;
      }
      const rows = txt
        .split(/\r?\n/)
        .map((r) => r.split(';').map((c) => (c === undefined ? '' : c.trim())));
      headersGlobal = rows[0].map((h) => (h ? h.trim() : ''));
      const required = [
        'US_Sales',
        'EU_sales',
        'Global_sales',
        'JP_sales',
        'User_rating',
        'Critic_Rating',
      ];
      const missing = required.filter(
        (c) =>
          headersGlobal
            .map((h) => (h ? h.toLowerCase() : ''))
            .indexOf(c.toLowerCase()) === -1
      );
      if (missing.length) {
        logStatus(
          'Columnas faltantes: ' +
            missing.join(', ') +
            '. Se generarán (memoria).'
        );
        headersGlobal = headersGlobal.concat(missing);
        for (let i = 1; i < rows.length; i++) {
          while (rows[i].length < headersGlobal.length - missing.length)
            rows[i].push('');
          const newVals = missing.map((col) => {
            if (/Sales/i.test(col))
              return String(Math.floor(Math.random() * 1_000_000) + 1);
            if (/User_rating/i.test(col))
              return String((Math.random() * 4 + 1).toFixed(1));
            if (/Critic_Rating/i.test(col))
              return String(Math.floor(Math.random() * 81) + 20);
            return String(Math.floor(Math.random() * 1_000_000) + 1);
          });
          rows[i] = rows[i].concat(newVals);
        }
        logStatus('Aleatorios agregados en memoria.');
      } else logStatus('Todas las columnas existen.');
      const dataRows = rows
        .slice(1)
        .filter((r) => r.length === headersGlobal.length);
      function idx(name) {
        let i = headersGlobal.indexOf(name);
        if (i >= 0) return i;
        i = headersGlobal
          .map((h) => (h ? h.toLowerCase() : ''))
          .indexOf(name.toLowerCase());
        return i >= 0 ? i : -1;
      }
      const iTitle = idx('title'),
        iGlobal = idx('Global_sales'),
        iUS = idx('US_Sales'),
        iEU = idx('EU_sales'),
        iJP = idx('JP_sales'),
        iCategory = idx('category'),
        iUserRating =
          idx('User_rating') >= 0 ? idx('User_rating') : idx('average rating'),
        iInstalls = idx('installs'),
        iPrice = idx('price'),
        iGrowth30 = idx('growth (30 days)'),
        iGrowth60 = idx('growth (60 days)');
      itemsGlobal = dataRows.map((r) => ({
        title: (iTitle >= 0 ? r[iTitle] : '') || '',
        global: parseNumberFromString(iGlobal >= 0 ? r[iGlobal] : '') || 0,
        us: parseNumberFromString(iUS >= 0 ? r[iUS] : '') || 0,
        eu: parseNumberFromString(iEU >= 0 ? r[iEU] : '') || 0,
        jp: parseNumberFromString(iJP >= 0 ? r[iJP] : '') || 0,
        category: (iCategory >= 0 ? r[iCategory] : '') || '(unknown)',
        user_rating:
          parseNumberFromString(iUserRating >= 0 ? r[iUserRating] : '') || NaN,
        installs:
          parseNumberFromString(iInstalls >= 0 ? r[iInstalls] : '') || 0,
        price: parseNumberFromString(iPrice >= 0 ? r[iPrice] : '') || 0,
        growth30:
          parseNumberFromString(iGrowth30 >= 0 ? r[iGrowth30] : '') || 0,
        growth60:
          parseNumberFromString(iGrowth60 >= 0 ? r[iGrowth60] : '') || 0,
      }));
      logStatus('Items construidos: ' + itemsGlobal.length);
      populateCategorySelect();
      redrawFiltered();
      setTimeout(() => {
        const dbg = document.getElementById('debugStatus');
        if (dbg) dbg.style.display = 'none';
      }, 600);
      logStatus('Render inicial OK');
    } catch (e) {
      logStatus('Error drawAll: ' + (e.message || e), 'error');
      console.error(e);
    }
  }

  // --------- Controls helpers ----------
  function populateCategorySelect() {
    const sel = document.getElementById('selCategory');
    if (!sel) return;
    const cats = Array.from(
      new Set(itemsGlobal.map((it) => it.category || '(unknown)'))
    ).sort();
    sel.innerHTML =
      '<option value="__all__">All</option>' +
      cats.map((c) => `<option value="${c}">${c}</option>`).join('');
    let chips = document.getElementById('chipsArea');
    if (!chips) {
      chips = document.createElement('div');
      chips.id = 'chipsArea';
      chips.className = 'chips';
      document.getElementById('controlsArea').appendChild(chips);
    }
    chips.innerHTML = cats
      .slice(0, 8)
      .map((c) => `<div class="chip" data-cat="${c}">${c}</div>`)
      .join('');
    chips.querySelectorAll('.chip').forEach((ch) =>
      ch.addEventListener('click', (ev) => {
        const cat = ev.currentTarget.getAttribute('data-cat');
        document.getElementById('selCategory').value = cat;
        chips
          .querySelectorAll('.chip')
          .forEach((x) => x.classList.remove('active'));
        ev.currentTarget.classList.add('active');
        redrawFiltered();
      })
    );
    logStatus('Categorias cargadas: ' + cats.length);
  }
  let debounceTimer = null;
  function debounceRedraw() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => redrawFiltered(), 300);
  }
  function regenerateRandoms() {
    itemsGlobal.forEach((it) => {
      it.us = Math.floor(Math.random() * 1_000_000) + 1;
      it.eu = Math.floor(Math.random() * 1_000_000) + 1;
      it.jp = Math.floor(Math.random() * 1_000_000) + 1;
      it.global = it.us + it.eu + it.jp + Math.floor(Math.random() * 10000);
      it.user_rating = Number((Math.random() * 4 + 1).toFixed(1));
      it.critic_rating = Math.floor(Math.random() * 81) + 20;
    });
    logStatus('Aleatorios regenerados');
    redrawFiltered();
  }

  // --------- Theme (Dark/Light) ----------
  function applyTheme(isDark) {
    if (isDark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    try {
      localStorage.setItem('dashboard_theme_dark', isDark ? '1' : '0');
    } catch (e) {}
    // redraw charts to respect theme
    if (typeof redrawFiltered === 'function') {
      setTimeout(() => redrawFiltered(), 80);
    }
  }
  function initThemeFromStorage() {
    let stored = null;
    try {
      stored = localStorage.getItem('dashboard_theme_dark');
    } catch (e) {}
    const isDark =
      stored === '1' ||
      (stored === null &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const cb = document.getElementById('themeCheckbox');
    if (cb) {
      cb.checked = isDark;
      const lbl = document.getElementById('themeLabel');
      if (lbl) lbl.textContent = isDark ? 'Dark' : 'Light';
    }
    applyTheme(isDark);
  }

  // --------- Redraw (draws all charts & stores chart instances) ----------
  function redrawFiltered() {
    try {
      const sel = document.getElementById('selCategory');
      const search = (
        document.getElementById('searchTitle') || { value: '' }
      ).value
        .trim()
        .toLowerCase();
      const topN = Number(document.getElementById('inputTopN')?.value || 10);

      let arr = itemsGlobal.slice();
      if (sel && sel.value !== '__all__')
        arr = arr.filter((it) => it.category === sel.value);
      if (search)
        arr = arr.filter((it) =>
          (it.title || '').toLowerCase().includes(search)
        );

      const theme = getThemeColors();
      const textColor = theme.textColor;
      const mutedColor = theme.mutedColor;

      // sync font: take body computed font-family first token
      const fontName = (
        getComputedStyle(document.body).fontFamily || 'Inter, Arial, sans-serif'
      )
        .split(',')[0]
        .replace(/["']/g, '');

      // ---------- A: TopN (Column) ----------
      const dtTop = new google.visualization.DataTable();
      dtTop.addColumn('string', 'Title');
      dtTop.addColumn('number', 'Global Sales');
      arr
        .slice()
        .sort((a, b) => nn(b.global) - nn(a.global))
        .slice(0, topN)
        .forEach((t) => dtTop.addRow([t.title, nn(t.global)]));
      const nf = new google.visualization.NumberFormat({ pattern: '#,###' });
      nf.format(dtTop, 1);
      const chartTop = new google.visualization.ColumnChart(
        document.getElementById('chart_top10')
      );
      chartTop.draw(dtTop, {
        fontName: fontName,
        legend: {
          position: 'none',
          textStyle: { color: textColor, fontName: fontName },
        },
        chartArea: { left: 120, top: 40, width: '62%' },
        height: 360,
        colors: [palette[0]],
        vAxis: {
          format: '#,###',
          textStyle: { color: textColor, fontName: fontName },
          titleTextStyle: { color: textColor, fontName: fontName },
        },
        hAxis: { textStyle: { color: textColor, fontName: fontName } },
        animation: { startup: true, duration: 420 },
        titleTextStyle: { color: textColor, fontName: fontName },
        backgroundColor: { fill: 'transparent' },

        // ---- tooltip forzado a estilo light ----
        tooltip: {
          textStyle: { color: '#111', fontName: fontName },
          isHtml: true,
        },
      });
      chartMap['chart_top10'] = chartTop;

      // ---------- B: Pie ----------
      const sumUS = arr.reduce((s, i) => s + nn(i.us), 0),
        sumEU = arr.reduce((s, i) => s + nn(i.eu), 0),
        sumJP = arr.reduce((s, i) => s + nn(i.jp), 0);
      const sumOther = arr.reduce(
        (s, i) => s + (nn(i.global) - nn(i.us) - nn(i.eu) - nn(i.jp)),
        0
      );
      const dtPie = new google.visualization.DataTable();
      dtPie.addColumn('string', 'Region');
      dtPie.addColumn('number', 'Sales');
      dtPie.addRows([
        ['US', sumUS],
        ['Europe', sumEU],
        ['Japan', sumJP],
        ['Other', sumOther],
      ]);

      const pieColors = [
        palette[0] || '#2563eb', // US - azul (usa tu primer color si está definido)
        palette[1] || '#f97316', // Europe - naranja
        palette[2] || '#10b981', // Japan - verde
        '#8b5cf6', // Other - púrpura recomendado
      ];

      const chartPie = new google.visualization.PieChart(
        document.getElementById('chart_pie_regions')
      );
      chartPie.draw(dtPie, {
        fontName: fontName,
        pieHole: 0.45,
        legend: {
          position: 'right',
          alignment: 'center',
          textStyle: { color: textColor, fontName: fontName },
        },
        pieSliceText: 'percentage',
        chartArea: { left: 20, top: 40, width: '60%' },
        height: 360,
        colors: pieColors,
        backgroundColor: { fill: 'transparent' },
        tooltip: {
          textStyle: { color: '#111', fontName: fontName },
          isHtml: true,
        },
      });
      chartMap['chart_pie_regions'] = chartPie;

      // ---------- C: Avg user rating by category (Bar) ----------
      const byCat = {};
      arr.forEach((it) => {
        const c = it.category || '(unknown)';
        if (!byCat[c]) byCat[c] = { sum: 0, count: 0 };
        if (!isNaN(it.user_rating)) {
          byCat[c].sum += it.user_rating;
          byCat[c].count += 1;
        }
      });
      const catArr = Object.keys(byCat).map((k) => ({
        cat: k,
        avg: byCat[k].count ? byCat[k].sum / byCat[k].count : 0,
        count: byCat[k].count,
      }));
      const topCats = catArr.sort((a, b) => b.count - a.count).slice(0, 8);
      const dtCat = new google.visualization.DataTable();
      dtCat.addColumn('string', 'Category');
      dtCat.addColumn('number', 'Avg User Rating');
      topCats.forEach((c) => dtCat.addRow([c.cat, Number(c.avg.toFixed(2))]));
      const chartBar = new google.visualization.BarChart(
        document.getElementById('chart_bar_rating')
      );
      chartBar.draw(dtCat, {
        fontName: fontName,
        legend: {
          position: 'none',
          textStyle: { color: textColor, fontName: fontName },
        },
        chartArea: { left: 140, top: 40, width: '60%' },
        vAxis: {
          minValue: 0,
          maxValue: 5,
          format: '#,###',
          textStyle: { color: textColor, fontName: fontName },
        },
        hAxis: { textStyle: { color: textColor, fontName: fontName } },
        height: 360,
        colors: [palette[2]],
        backgroundColor: { fill: 'transparent' },
        tooltip: { textStyle: { color: textColor, fontName: fontName } },
      });
      chartMap['chart_bar_rating'] = chartBar;

      // ---------- D: Scatter ----------
      const validScatter = arr
        .filter((i) => !isNaN(i.installs) && !isNaN(i.price) && i.installs > 0)
        .sort((a, b) => b.installs - a.installs)
        .slice(0, 200);
      const dtScatter = new google.visualization.DataTable();
      dtScatter.addColumn('number', 'Installs');
      dtScatter.addColumn('number', 'Price');
      dtScatter.addColumn({
        type: 'string',
        role: 'tooltip',
        p: { html: false },
      });
      validScatter.forEach((it) =>
        dtScatter.addRow([
          nn(it.installs),
          nn(it.price),
          `${it.title}\nInstalls: ${Math.round(
            nn(it.installs)
          ).toLocaleString()}\nPrice: ${nn(it.price)}`,
        ])
      );
      const chartScatter = new google.visualization.ScatterChart(
        document.getElementById('chart_scatter')
      );
      chartScatter.draw(dtScatter, {
        fontName: fontName,
        hAxis: {
          title: 'Installs',
          format: 'short',
          textStyle: { color: textColor, fontName: fontName },
          titleTextStyle: { color: textColor, fontName: fontName },
        },
        vAxis: {
          title: 'Price',
          format: '#,###',
          textStyle: { color: textColor, fontName: fontName },
          titleTextStyle: { color: textColor, fontName: fontName },
        },
        pointSize: 6,
        legend: 'none',
        height: 360,
        colors: [palette[0]],
        backgroundColor: { fill: 'transparent' },
        tooltip: { textStyle: { color: textColor, fontName: fontName } },
      });
      chartMap['chart_scatter'] = chartScatter;

      // ---------- E: Growth line ----------
      const growthByCat = {};
      arr.forEach((it) => {
        const c = it.category || '(unknown)';
        if (!growthByCat[c]) growthByCat[c] = { g30: 0, g60: 0, count: 0 };
        if (!isNaN(it.growth30)) growthByCat[c].g30 += it.growth30;
        if (!isNaN(it.growth60)) growthByCat[c].g60 += it.growth60;
        growthByCat[c].count += 1;
      });
      const gArr = Object.keys(growthByCat).map((k) => ({
        cat: k,
        g30: growthByCat[k].count
          ? growthByCat[k].g30 / growthByCat[k].count
          : 0,
        g60: growthByCat[k].count
          ? growthByCat[k].g60 / growthByCat[k].count
          : 0,
        count: growthByCat[k].count,
      }));
      const gTop = gArr.sort((a, b) => b.count - a.count).slice(0, 6);
      const dtGrowth = new google.visualization.DataTable();
      dtGrowth.addColumn('string', 'Category');
      dtGrowth.addColumn('number', 'Growth30');
      dtGrowth.addColumn('number', 'Growth60');
      gTop.forEach((g) =>
        dtGrowth.addRow([
          g.cat,
          Number(g.g30.toFixed(2)),
          Number(g.g60.toFixed(2)),
        ])
      );
      const chartLine = new google.visualization.LineChart(
        document.getElementById('chart_line_growth')
      );
      chartLine.draw(dtGrowth, {
        fontName: fontName,
        chartArea: { left: 140, top: 40, width: '55%' },
        height: 360,
        colors: [palette[1], palette[0]],
        backgroundColor: { fill: 'transparent' },
        hAxis: { textStyle: { color: textColor, fontName: fontName } },
        vAxis: { textStyle: { color: textColor, fontName: fontName } },
        legend: { textStyle: { color: textColor, fontName: fontName } },
        tooltip: { textStyle: { color: textColor, fontName: fontName } },
      });
      chartMap['chart_line_growth'] = chartLine;

      // ---------- F: Table ----------
      const dtTable = new google.visualization.DataTable();
      dtTable.addColumn('string', 'Title');
      dtTable.addColumn('number', 'User Rating');
      dtTable.addColumn('number', 'Global Sales');
      const tableRows = arr
        .filter((it) => !isNaN(it.user_rating))
        .sort((a, b) => b.user_rating - a.user_rating || b.global - a.global)
        .slice(0, 20);
      tableRows.forEach((r) =>
        dtTable.addRow([r.title, nn(r.user_rating), nn(r.global)])
      );
      const fmt = new google.visualization.NumberFormat({ pattern: '#,###' });
      fmt.format(dtTable, 2);
      const chartTable = new google.visualization.Table(
        document.getElementById('chart_table')
      );
      chartTable.draw(dtTable, {
        showRowNumber: true,
        width: '100%',
        height: 360,
        fontName: fontName,
      });
      chartMap['chart_table'] = chartTable;

      // Aplicar estilo fijo a la tabla (siempre blanco/negro y fuente fija)
      (function applyTableTheme() {
        const fixedFont = fontName + ', Arial, sans-serif';
        const applyNow = () => {
          try {
            const container = document.getElementById('chart_table');
            if (!container) return false;
            const tableEl = container.querySelector('table');
            if (!tableEl) return false;

            // Forzar estilo fijo: texto negro y fondo blanco
            tableEl.style.color = '#111';
            tableEl.style.background = '#fff';
            tableEl.style.fontFamily = fixedFont;

            // Cabeceras
            const ths = tableEl.querySelectorAll('th');
            ths.forEach((th) => {
              th.style.color = '#111';
              th.style.fontWeight = '600';
              th.style.background = '#f9f9f9';
              th.style.borderBottom = '1px solid #ddd';
            });

            // Filas / celdas
            tableEl.querySelectorAll('td').forEach((td) => {
              td.style.color = '#111';
              td.style.background = '#fff';
            });

            // Ajustes generales
            tableEl.style.borderCollapse = 'separate';
            tableEl.style.borderSpacing = '0 4px';
            tableEl.style.width = '100%';

            return true;
          } catch (err) {
            return false;
          }
        };

        if (applyNow()) return;
        setTimeout(() => {
          if (applyNow()) return;
          setTimeout(() => applyNow(), 140);
        }, 30);

        // also set font on container itself as backup
        try {
          const c = document.getElementById('chart_table');
          if (c) c.style.fontFamily = fixedFont;
        } catch (e) {}
      })();

      // Ensure tooltips inherit page font (some charts/tooltips created later)
      try {
        const tooltips = document.querySelectorAll(
          '.google-visualization-tooltip'
        );
        tooltips.forEach((t) => {
          t.style.fontFamily = fontName + ', Arial, sans-serif';
        });
      } catch (e) {}

      // Backup: asegurar que cualquier tooltip creado dinámicamente tenga el estilo forzado
      setTimeout(() => {
        try {
          document
            .querySelectorAll(
              '.google-visualization-tooltip, div[role="tooltip"]'
            )
            .forEach((t) => {
              t.style.background = '#fff';
              t.style.color = '#111';
              t.style.border = '1px solid rgba(0,0,0,0.08)';
              t.style.boxShadow = '0 8px 20px rgba(2,6,23,0.08)';
              t.style.fontFamily = fontName + ', Arial, sans-serif';
              t.style.padding = '6px 8px';
              t.style.borderRadius = '6px';
            });
        } catch (e) {
          /* ignore */
        }
      }, 80);

      logStatus(`Redraw OK. items=${arr.length}, topN=${topN}`);
    } catch (e) {
      logStatus('Error redrawFiltered: ' + (e.message || e), 'error');
      console.error(e);
    }
  }

  // --------- Init ----------
  function init() {
    ensureUI();
    // load google charts if needed
    if (typeof google === 'undefined' || !google.charts) {
      const s = document.createElement('script');
      s.src = 'https://www.gstatic.com/charts/loader.js';
      s.onload = () => {
        google.charts.load('current', { packages: ['corechart', 'table'] });
        google.charts.setOnLoadCallback(drawAll);
      };
      s.onerror = () => logStatus('Error cargando Google Charts', 'error');
      document.head.appendChild(s);
    } else {
      google.charts.load('current', { packages: ['corechart', 'table'] });
      google.charts.setOnLoadCallback(drawAll);
    }
  }

  // --------- Draw initial (calls drawAll defined above) ----------
  async function drawAll() {
    try {
      await (async () => {
        /* wait for DOM ready */
      })();
      logStatus('Cargando CSV...');
      const resp = await fetch('data/android_games_sales.csv', {
        cache: 'no-store',
      });
      if (!resp.ok) {
        logStatus('Fetch error: ' + resp.status, 'error');
        return;
      }
      const txt = (await resp.text()).replace(/^\uFEFF/, '').trim();
      if (!txt) {
        logStatus('CSV vacío', 'error');
        return;
      }
      const rows = txt
        .split(/\r?\n/)
        .map((r) => r.split(';').map((c) => (c === undefined ? '' : c.trim())));
      headersGlobal = rows[0].map((h) => (h ? h.trim() : ''));
      const required = [
        'US_Sales',
        'EU_sales',
        'Global_sales',
        'JP_sales',
        'User_rating',
        'Critic_Rating',
      ];
      const missing = required.filter(
        (c) =>
          headersGlobal
            .map((h) => (h ? h.toLowerCase() : ''))
            .indexOf(c.toLowerCase()) === -1
      );
      if (missing.length) {
        headersGlobal = headersGlobal.concat(missing);
        for (let i = 1; i < rows.length; i++) {
          while (rows[i].length < headersGlobal.length - missing.length)
            rows[i].push('');
          const newVals = missing.map((col) => {
            if (/Sales/i.test(col))
              return String(Math.floor(Math.random() * 1_000_000) + 1);
            if (/User_rating/i.test(col))
              return String((Math.random() * 4 + 1).toFixed(1));
            if (/Critic_Rating/i.test(col))
              return String(Math.floor(Math.random() * 81) + 20);
            return String(Math.floor(Math.random() * 1_000_000) + 1);
          });
          rows[i] = rows[i].concat(newVals);
        }
        logStatus('Columnas faltantes generadas (memoria).');
      } else logStatus('Todas las columnas están presentes.');
      const dataRows = rows
        .slice(1)
        .filter((r) => r.length === headersGlobal.length);
      function idx(name) {
        let i = headersGlobal.indexOf(name);
        if (i >= 0) return i;
        i = headersGlobal
          .map((h) => (h ? h.toLowerCase() : ''))
          .indexOf(name.toLowerCase());
        return i >= 0 ? i : -1;
      }
      const iTitle = idx('title'),
        iGlobal = idx('Global_sales'),
        iUS = idx('US_Sales'),
        iEU = idx('EU_sales'),
        iJP = idx('JP_sales'),
        iCategory = idx('category'),
        iUserRating =
          idx('User_rating') >= 0 ? idx('User_rating') : idx('average rating'),
        iInstalls = idx('installs'),
        iPrice = idx('price'),
        iGrowth30 = idx('growth (30 days)'),
        iGrowth60 = idx('growth (60 days)');
      itemsGlobal = dataRows.map((r) => ({
        title: (iTitle >= 0 ? r[iTitle] : '') || '',
        global: parseNumberFromString(iGlobal >= 0 ? r[iGlobal] : '') || 0,
        us: parseNumberFromString(iUS >= 0 ? r[iUS] : '') || 0,
        eu: parseNumberFromString(iEU >= 0 ? r[iEU] : '') || 0,
        jp: parseNumberFromString(iJP >= 0 ? r[iJP] : '') || 0,
        category: (iCategory >= 0 ? r[iCategory] : '') || '(unknown)',
        user_rating:
          parseNumberFromString(iUserRating >= 0 ? r[iUserRating] : '') || NaN,
        installs:
          parseNumberFromString(iInstalls >= 0 ? r[iInstalls] : '') || 0,
        price: parseNumberFromString(iPrice >= 0 ? r[iPrice] : '') || 0,
        growth30:
          parseNumberFromString(iGrowth30 >= 0 ? r[iGrowth30] : '') || 0,
        growth60:
          parseNumberFromString(iGrowth60 >= 0 ? r[iGrowth60] : '') || 0,
      }));
      logStatus(`Items: ${itemsGlobal.length}`);
      populateCategorySelect();
      redrawFiltered();
      setTimeout(() => {
        const dbg = document.getElementById('debugStatus');
        if (dbg) dbg.style.display = 'none';
      }, 400);
    } catch (e) {
      logStatus('Error drawAll: ' + (e.message || e), 'error');
      console.error(e);
    }
  }

  // expose some functions (for debugging)
  window.redrawFiltered = redrawFiltered;
  window.regenerateRandoms = regenerateRandoms;
  window.createDownloadButton = createDownloadButton;

  // Start
  init();
})();
