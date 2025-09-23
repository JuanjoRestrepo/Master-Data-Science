// charts-main.js - Modernized UI: search, chips, topN, download augmented CSV
(function () {
  // --- Palette & helpers
  const palette = [
    '#2563eb',
    '#f97316',
    '#f59e0b',
    '#10b981',
    '#7c3aed',
    '#06b6d4',
  ];
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

  // --- state
  let headersGlobal = [];
  let itemsGlobal = [];

  // --- ensure UI (container/header/controls/grid) ---
  function ensureUI() {
    // container
    if (!document.querySelector('.container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'container';
      // move body children into wrapper preserving order (header is already in HTML)
      while (document.body.firstChild) {
        wrapper.appendChild(document.body.firstChild);
      }
      document.body.appendChild(wrapper);
    }
    // ensure debug
    if (!document.getElementById('debugStatus')) {
      const dbg = document.createElement('div');
      dbg.id = 'debugStatus';
      dbg.innerHTML = `<strong>Debug status</strong><ul id="statusList"></ul>`;
      document.querySelector('.container').prepend(dbg);
      logStatus('Debug status creado automáticamente.');
    }

    // insert controls area before .grid or at top
    if (!document.getElementById('controlsArea')) {
      const controls = document.createElement('div');
      controls.id = 'controlsArea';
      controls.className = 'card';
      controls.innerHTML = `
        <label class="small">Category:</label>
        <select id="selCategory"><option value="__all__">All</option></select>
        <div style="width:12px"></div>
        <label class="small">Search:</label>
        <input id="searchTitle" type="search" placeholder="Buscar título..." />
        <label class="small" style="margin-left:8px">Top N:</label>
        <input id="inputTopN" type="range" min="5" max="50" value="10" />
        <span id="labelTopN">10</span>
        <button id="btnRegenerate" class="btn btn-primary">Regenerar aleatorios</button>
        <button id="btnDownload" class="btn btn-ghost">Descargar CSV aumentado</button>
        <button id="btnToggleDebug" class="btn btn-ghost">Toggle Debug</button>
      `;
      const grid =
        document.querySelector('.grid') || document.createElement('div');
      grid.classList.add('grid');
      const container = document.querySelector('.container');
      container.insertBefore(controls, grid);
      logStatus('Controles insertados.');
      // events
      document.getElementById('inputTopN').addEventListener('input', (e) => {
        document.getElementById('labelTopN').textContent = e.target.value;
        redrawFiltered();
      });
      document
        .getElementById('selCategory')
        .addEventListener('change', redrawFiltered);
      document.getElementById('searchTitle').addEventListener('input', () => {
        debounceRedraw();
      });
      document.getElementById('btnRegenerate').addEventListener('click', () => {
        regenerateRandoms();
      });
      document
        .getElementById('btnToggleDebug')
        .addEventListener('click', () => {
          const dbg = document.getElementById('debugStatus');
          dbg.style.display = dbg.style.display === 'none' ? '' : 'none';
        });
      document.getElementById('btnDownload').addEventListener('click', () => {
        createDownloadButton();
      });
    }
    // ensure grid and cards exist (preserves existing if present)
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
        const h = document.createElement('div');
        h.className = 'chart-title';
        h.textContent = it.title;
        const cdiv = document.createElement('div');
        cdiv.id = it.id;
        cdiv.style.minHeight = '300px';
        card.appendChild(h);
        card.appendChild(cdiv);
        grid.appendChild(card);
      }
    });
  }

  // --- fetch + build items ---
  async function drawAll() {
    logStatus('Iniciando carga CSV...');
    try {
      const resp = await fetch('data/android_games_sales.csv', {
        cache: 'no-store',
      });
      if (!resp.ok) {
        logStatus('Fetch falla: ' + resp.status, 'error');
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
      // missing columns?
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
          'Columnas faltantes detectadas: ' +
            missing.join(', ') +
            '. Se generarán en memoria.'
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
        logStatus('Valores generados (no se sobrescribe archivo local).');
      } else logStatus('Todas las columnas existen.');
      const dataRows = rows
        .slice(1)
        .filter((r) => r.length === headersGlobal.length);
      // helpers
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
      logStatus(`Items construidos: ${itemsGlobal.length}`);
      populateCategorySelect();
      redrawFiltered();
      // hide debug after success
      setTimeout(() => {
        const dbg = document.getElementById('debugStatus');
        if (dbg) dbg.style.display = 'none';
      }, 600);
      logStatus('Render inicial completado.');
    } catch (e) {
      logStatus('Error drawAll: ' + (e.message || e), 'error');
      console.error(e);
    }
  }

  // --- controls helpers ---
  function populateCategorySelect() {
    const sel = document.getElementById('selCategory');
    if (!sel) return;
    const cats = Array.from(
      new Set(itemsGlobal.map((it) => it.category || '(unknown)'))
    ).sort();
    sel.innerHTML =
      '<option value="__all__">All</option>' +
      cats.map((c) => `<option value="${c}">${c}</option>`).join('');
    // chips area
    let chips = document.getElementById('chipsArea');
    if (!chips) {
      chips = document.createElement('div');
      chips.id = 'chipsArea';
      chips.className = 'chips';
      document
        .getElementById('controlsArea')
        .insertBefore(
          chips,
          document.getElementById('selCategory').nextSibling
        );
    }
    chips.innerHTML = cats
      .slice(0, 8)
      .map((c) => `<div class="chip" data-cat="${c}">${c}</div>`)
      .join('');
    chips.querySelectorAll('.chip').forEach((ch) => {
      ch.addEventListener('click', (ev) => {
        const cat = ev.currentTarget.getAttribute('data-cat');
        document.getElementById('selCategory').value = cat;
        // active styling
        chips
          .querySelectorAll('.chip')
          .forEach((x) => x.classList.remove('active'));
        ev.currentTarget.classList.add('active');
        redrawFiltered();
      });
    });
    logStatus(`Categorias cargadas (${cats.length}).`);
  }

  // --- search debounce
  let debounceTimer = null;
  function debounceRedraw() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      redrawFiltered();
    }, 300);
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
    logStatus('Aleatorios regenerados.');
    redrawFiltered();
  }

  // --- create download button functionality ---
  function createDownloadButton() {
    if (!itemsGlobal.length || !headersGlobal.length) {
      logStatus('No hay datos para descargar.', 'error');
      return;
    }
    // build CSV (semicolon)
    const headerRow = headersGlobal.slice();
    // Map items to row order: try preserve original header names by building map
    const rows = itemsGlobal.map((it) => {
      // build row with same order as headersGlobal
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
          // fallback empty
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
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    logStatus('CSV aumentado preparado. Descarga iniciada.');
  }

  // --- redraw pipeline (draws all charts) ---
  function getFilteredItems() {
    const sel = document.getElementById('selCategory');
    const search = (
      document.getElementById('searchTitle') || { value: '' }
    ).value
      .trim()
      .toLowerCase();
    const topN = Number(document.getElementById('inputTopN')?.value || 10);
    let arr = itemsGlobal.slice();
    if (sel && sel.value && sel.value !== '__all__')
      arr = arr.filter((it) => it.category === sel.value);
    if (search)
      arr = arr.filter((it) => (it.title || '').toLowerCase().includes(search));
    return { items: arr, topN };
  }

  function redrawFiltered() {
    try {
      const { items, topN } = getFilteredItems();
      // A Top10
      const dtTop = new google.visualization.DataTable();
      dtTop.addColumn('string', 'Title');
      dtTop.addColumn('number', 'Global Sales');
      items
        .slice()
        .sort((a, b) => nn(b.global) - nn(a.global))
        .slice(0, topN)
        .forEach((t) => dtTop.addRow([t.title, nn(t.global)]));
      const chartTop = new google.visualization.ColumnChart(
        document.getElementById('chart_top10')
      );
      chartTop.draw(dtTop, {
        legend: { position: 'none' },
        chartArea: { left: 140, top: 40, width: '62%' },
        height: 360,
        colors: [palette[0]],
        animation: { startup: true, duration: 450 },
      });

      // B Pie
      const sumUS = items.reduce((s, i) => s + nn(i.us), 0),
        sumEU = items.reduce((s, i) => s + nn(i.eu), 0),
        sumJP = items.reduce((s, i) => s + nn(i.jp), 0);
      const sumOther = items.reduce(
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
      const chartPie = new google.visualization.PieChart(
        document.getElementById('chart_pie_regions')
      );
      chartPie.draw(dtPie, {
        pieHole: 0.45,
        legend: { position: 'right', alignment: 'center' },
        pieSliceText: 'percentage',
        chartArea: { left: 20, top: 40, width: '60%' },
        height: 360,
        colors: palette,
      });

      // C Avg rating by category (for current selection)
      const byCat = {};
      items.forEach((it) => {
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
        legend: { position: 'none' },
        chartArea: { left: 140, top: 40, width: '60%' },
        vAxis: { minValue: 0, maxValue: 5 },
        height: 360,
        colors: [palette[3]],
      });

      // D Scatter
      const validScatter = items
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
      const chartScatter = new google.visualization.ChartWrapper({
        chartType: 'ScatterChart',
        dataTable: dtScatter,
        options: {
          hAxis: { title: 'Installs' },
          vAxis: { title: 'Price' },
          pointSize: 6,
          legend: 'none',
          tooltip: { isHtml: false },
          height: 360,
          colors: [palette[0]],
        },
        containerId: 'chart_scatter',
      });
      chartScatter.draw();

      // E Growth line
      const growthByCat = {};
      items.forEach((it) => {
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
        chartArea: { left: 140, top: 40, width: '55%' },
        height: 360,
        colors: [palette[4], palette[0]],
      });

      // F Table
      const dtTable = new google.visualization.DataTable();
      dtTable.addColumn('string', 'Title');
      dtTable.addColumn('number', 'User Rating');
      dtTable.addColumn('number', 'Global Sales');
      const tableRows = items
        .filter((it) => !isNaN(it.user_rating))
        .sort((a, b) => b.user_rating - a.user_rating || b.global - a.global)
        .slice(0, 20);
      tableRows.forEach((r) =>
        dtTable.addRow([r.title, nn(r.user_rating), nn(r.global)])
      );
      const chartTable = new google.visualization.Table(
        document.getElementById('chart_table')
      );
      chartTable.draw(dtTable, {
        showRowNumber: true,
        width: '100%',
        height: 360,
      });

      logStatus('Redraw OK — items=' + items.length + ', topN=' + topN);
    } catch (e) {
      logStatus('Error redrawFiltered: ' + (e.message || e), 'error');
      console.error(e);
    }
  }

  // --- init ---
  (function init() {
    ensureUI();
    if (typeof google === 'undefined' || !google.charts) {
      const s = document.createElement('script');
      s.src = 'https://www.gstatic.com/charts/loader.js';
      s.onload = () => {
        logStatus('Google loader OK');
        google.charts.load('current', {
          packages: ['corechart', 'table', 'scatter'],
        });
        google.charts.setOnLoadCallback(drawAll);
      };
      s.onerror = () =>
        logStatus('Error cargando Google Charts loader', 'error');
      document.head.appendChild(s);
    } else {
      google.charts.load('current', {
        packages: ['corechart', 'table', 'scatter'],
      });
      google.charts.setOnLoadCallback(drawAll);
    }
  })();

  // expose createDownloadButton globally for UI button
  window.createDownloadButton = createDownloadButton;
  window.redrawFiltered = redrawFiltered;
})();
