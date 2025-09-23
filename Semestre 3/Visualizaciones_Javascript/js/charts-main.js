// charts-main.js - Auto-layout + filtros (Category, Top-N) + ocultar debug al finalizar
(function () {
  // ---------- Utilities ----------
  function logStatus(msg, level = 'info') {
    console[level === 'error' ? 'error' : 'log']('[status]', msg);
    const ul = document.getElementById('statusList');
    if (!ul) return;
    const li = document.createElement('li');
    li.textContent = msg;
    if (level === 'error') li.style.color = '#b91c1c';
    ul.appendChild(li);
  }

  function ensureStylesheet() {
    if (!document.querySelector('link[href="css/styles.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'css/styles.css';
      document.head.appendChild(l);
      logStatus('Se insertó css/styles.css automáticamente.');
    }
  }

  function ensureGridAndCards() {
    let grid = document.querySelector('.grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'grid';
      const debug = document.getElementById('debugStatus');
      if (debug && debug.nextSibling)
        debug.parentNode.insertBefore(grid, debug.nextSibling);
      else document.body.appendChild(grid);
      logStatus('Se creó elemento .grid dinámicamente.');
    }
    const ids = [
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
    ids.forEach((it) => {
      if (!document.getElementById(it.id)) {
        const card = document.createElement('div');
        card.className = 'card';
        const h = document.createElement('div');
        h.className = 'chart-title';
        h.textContent = it.title;
        card.appendChild(h);
        const chartDiv = document.createElement('div');
        chartDiv.id = it.id;
        chartDiv.style.minHeight = '300px';
        card.appendChild(chartDiv);
        grid.appendChild(card);
        logStatus(`Se creó placeholder para #${it.id}`);
      } else {
        logStatus(`Elemento destino #${it.id} ya existe.`);
      }
    });
  }

  // parsing numbers robusto
  function parseNumberFromString(v) {
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim();
    if (s === '') return NaN;
    if (/^(na|n\/a|none|null|-)$/i.test(s)) return NaN;
    if (/^free$/i.test(s)) return 0;
    let t = s.replace(/\s+/g, '');
    let m = t.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[Mｍ]\+?$/);
    if (m) return parseFloat(m[1]) * 1_000_000;
    let k = t.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[Kk]\+?$/);
    if (k) return parseFloat(k[1]) * 1_000;
    t = t.replace(/[,+]/g, '');
    t = t.replace(/[^0-9.\-]/g, '');
    if (t === '' || t === '.' || t === '-') return NaN;
    const n = parseFloat(t);
    return isNaN(n) ? NaN : n;
  }
  const nn = (x) => (isNaN(x) || x === null ? 0 : x);

  // ---------- App state ----------
  let itemsGlobal = []; // array of item objects
  let headersGlobal = [];

  // ---------- DOM ready ----------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      ensureStylesheet();
      if (!document.getElementById('debugStatus')) {
        const dbg = document.createElement('div');
        dbg.id = 'debugStatus';
        dbg.style =
          'margin:12px 0; padding:10px; background:#fff6; border-radius:8px; border:1px dashed #cbd5e1;';
        dbg.innerHTML =
          '<strong>Debug status</strong><ul id="statusList" style="margin:6px 0 0 18px; padding:0; list-style: decimal;"></ul>';
        document.body.insertBefore(dbg, document.body.firstChild);
        logStatus('debugStatus creado automáticamente.');
      }
      ensureGridAndCards();
      ensureControlsArea(); // crea controles si falta
      // carga Google Charts si hace falta
      if (typeof google === 'undefined' || !google.charts) {
        const s = document.createElement('script');
        s.src = 'https://www.gstatic.com/charts/loader.js';
        s.onload = () => {
          logStatus('Google Charts loader cargado.');
          google.charts.load('current', {
            packages: ['corechart', 'table', 'scatter'],
          });
          google.charts.setOnLoadCallback(drawAll);
        };
        s.onerror = () => {
          logStatus('Error cargando Google Charts loader.', 'error');
        };
        document.head.appendChild(s);
      } else {
        logStatus('Google Charts ya definido.');
        google.charts.load('current', {
          packages: ['corechart', 'table', 'scatter'],
        });
        google.charts.setOnLoadCallback(drawAll);
      }
    } catch (e) {
      logStatus('Error inicializando: ' + e.message, 'error');
    }
  });

  // ---------- Controls UI ----------
  function ensureControlsArea() {
    // create container above grid or inside download_area
    let container = document.getElementById('controlsArea');
    if (!container) {
      const downloadArea = document.getElementById('download_area');
      container = document.createElement('div');
      container.id = 'controlsArea';
      container.className = 'card';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '12px';
      container.style.marginBottom = '12px';
      container.innerHTML = `
        <label style="font-weight:600; margin-right:6px;">Category:</label>
        <select id="selCategory"><option value="__all__">All</option></select>
        <label style="font-weight:600; margin-left:12px;">Top N:</label>
        <input id="inputTopN" type="range" min="5" max="50" value="10" />
        <span id="labelTopN">10</span>
        <button id="btnRegenerate" class="btn btn-primary" title="Regenerate random sales/ratings">Regenerar aleatorios</button>
        <button id="btnToggleDebug" class="btn" title="Mostrar/ocultar debug">Toggle Debug</button>
      `;
      if (downloadArea) downloadArea.appendChild(container);
      else
        document.body.insertBefore(container, document.querySelector('.grid'));
      // events
      document.getElementById('inputTopN').addEventListener('input', (e) => {
        document.getElementById('labelTopN').textContent = e.target.value;
        redrawFiltered();
      });
      document
        .getElementById('selCategory')
        .addEventListener('change', redrawFiltered);
      document.getElementById('btnRegenerate').addEventListener('click', () => {
        // regenerate random values in the in-memory items (US/EU/JP/Global/User/Critic)
        itemsGlobal.forEach((it) => {
          it.us = Math.floor(Math.random() * 1_000_000) + 1;
          it.eu = Math.floor(Math.random() * 1_000_000) + 1;
          it.jp = Math.floor(Math.random() * 1_000_000) + 1;
          it.global = it.us + it.eu + it.jp + Math.floor(Math.random() * 10000);
          it.user_rating = Number((Math.random() * 4 + 1).toFixed(1));
          it.critic_rating = Math.floor(Math.random() * 81) + 20;
        });
        logStatus('Valores aleatorios regenerados (en memoria).');
        redrawFiltered();
      });
      document
        .getElementById('btnToggleDebug')
        .addEventListener('click', () => {
          const dbg = document.getElementById('debugStatus');
          if (!dbg) return;
          dbg.style.display = dbg.style.display === 'none' ? '' : 'none';
        });
      logStatus('Controles creados.');
    }
  }

  // ---------- Draw flow ----------
  async function drawAll() {
    logStatus('drawAll() iniciado - fetch CSV...');
    try {
      const resp = await fetch('data/android_games_sales.csv', {
        cache: 'no-store',
      });
      if (!resp.ok) {
        logStatus('Fetch fallido: ' + resp.status, 'error');
        return;
      }
      let txt = (await resp.text()).replace(/^\uFEFF/, '').trim();
      if (!txt) {
        logStatus('CSV vacío.', 'error');
        return;
      }
      const rows = txt
        .split(/\r?\n/)
        .map((r) => r.split(';').map((c) => (c === undefined ? '' : c.trim())));
      logStatus(`CSV leído. Filas totales: ${rows.length}`);
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
            '. Se generan aleatoriamente (memoria).'
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
        logStatus('Valores aleatorios agregados (en memoria).');
      } else logStatus('Todas las columnas requeridas existen.');
      const dataRows = rows
        .slice(1)
        .filter((r) => r.length === headersGlobal.length);
      logStatus(`Filas válidas (matching length): ${dataRows.length}`);
      // helper idx
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
      // build items
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
      // first draw using default controls
      redrawFiltered();
      // hide debugStatus after success (but leave toggle)
      setTimeout(() => {
        const dbg = document.getElementById('debugStatus');
        if (dbg) dbg.style.display = 'none';
      }, 500);
      logStatus('Render inicial completado. Debug oculto automáticamente.');
    } catch (err) {
      logStatus('Excepción en drawAll: ' + (err.message || err), 'error');
      console.error(err);
    }
  }

  // ---------- Controls helpers ----------
  function populateCategorySelect() {
    const sel = document.getElementById('selCategory');
    if (!sel) return;
    const cats = Array.from(
      new Set(itemsGlobal.map((it) => it.category || '(unknown)'))
    ).sort();
    sel.innerHTML =
      '<option value="__all__">All</option>' +
      cats.map((c) => `<option value="${c}">${c}</option>`).join('');
    logStatus(`Select Category poblado (${cats.length} categorias).`);
  }

  // ---------- Redraw pipeline ----------
  function getFilteredItems() {
    const sel = document.getElementById('selCategory');
    const inputTopN = document.getElementById('inputTopN');
    const category = sel ? sel.value : '__all__';
    const topN = inputTopN ? Number(inputTopN.value) : 10;
    let arr = itemsGlobal.slice();
    if (category && category !== '__all__')
      arr = arr.filter((it) => it.category === category);
    return { items: arr, topN };
  }

  function redrawFiltered() {
    const { items, topN } = getFilteredItems();
    try {
      // A TopN by global
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
      });

      // B Pie regions (suma de la selección)
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
        pieHole: 0.4,
        chartArea: { left: 20, top: 40, width: '80%' },
        height: 360,
      });

      // C Avg user rating by category (within selected category only shows that cat => use global categories)
      // For this chart we'll compute avg across categories present in the current filtered items
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
      });

      // D Scatter installs vs price
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
        },
        containerId: 'chart_scatter',
      });
      chartScatter.draw();

      // E Growth line (avg per category top6)
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
      });

      // F Table top-rated
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

      logStatus(
        'Redraw completado (TopN=' + topN + ', items=' + items.length + ').'
      );
    } catch (e) {
      logStatus('Error en redrawFiltered: ' + (e.message || e), 'error');
      console.error(e);
    }
  }
})(); // end IIFE
