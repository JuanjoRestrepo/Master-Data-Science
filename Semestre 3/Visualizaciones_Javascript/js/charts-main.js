// charts-main.js - versión corregida y completa
// Dependencias: Google Charts loader (https://www.gstatic.com/charts/loader.js)
// Asume archivo CSV en data/android_games_sales.csv (separador ';')

google.charts.load('current', { packages: ['corechart', 'table', 'scatter'] });
google.charts.setOnLoadCallback(drawAll);

async function drawAll() {
  try {
    // --- Carga CSV ---
    const resp = await fetch('data/android_games_sales.csv');
    if (!resp.ok) throw new Error('CSV not found: ' + resp.status);
    let txt = await resp.text();
    // eliminar BOM si existe y trim
    txt = txt.replace(/^\uFEFF/, '').trim();
    const rows = txt
      .split(/\r?\n/)
      .map((r) => r.split(';').map((c) => (c === undefined ? '' : c.trim())));
    const headers = rows[0].map((h) => (h ? h.trim() : ''));
    const dataRows = rows.slice(1).filter((r) => r.length === headers.length);

    // --- utilidades para mapear nombre de columna a índice ---
    function idx(name) {
      let i = headers.indexOf(name);
      if (i >= 0) return i;
      i = headers
        .map((h) => (h ? h.toLowerCase() : ''))
        .indexOf(name.toLowerCase());
      return i >= 0 ? i : -1;
    }

    // índices (ajusta si tus nombres cambian)
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

    // --- Parsing robusto de números ---
    function parseNumberFromString(v) {
      if (v === null || v === undefined) return NaN;
      const s = String(v).trim();
      if (s === '') return NaN;

      // Normalizar y detectar valores no numéricos
      if (/^(na|n\/a|none|null|-)$/i.test(s)) return NaN;
      if (/^free$/i.test(s)) return 0; // decisión: Free => precio 0

      // Quitar espacios internos
      let t = s.replace(/\s+/g, '');

      // Manejar sufijos M / K (1.2M, 800K, 1.2M+)
      let m = t.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[Mｍ]\+?$/);
      if (m) return parseFloat(m[1]) * 1_000_000;
      let k = t.match(/^([+-]?[0-9]*\.?[0-9]+)\s*[Kk]\+?$/);
      if (k) return parseFloat(k[1]) * 1_000;

      // Manejar formatos con palabra 'million' o 'thousand' (opcional)
      m = t.match(/^([+-]?[0-9]*\.?[0-9]+)(million|millions)$/i);
      if (m) return parseFloat(m[1]) * 1_000_000;
      k = t.match(/^([+-]?[0-9]*\.?[0-9]+)(k|thousand|thousands)$/i);
      if (k) return parseFloat(k[1]) * 1_000;

      // Quitar comas y signos '+' (1,000,000+ -> 1000000)
      t = t.replace(/[,+]/g, '');

      // Quitar caracteres no numéricos (excepto punto y signo menos)
      t = t.replace(/[^0-9.\-]/g, '');

      if (t === '' || t === '.' || t === '-') return NaN;
      const n = parseFloat(t);
      return isNaN(n) ? NaN : n;
    }

    // wrapper seguro
    function toNum(r, i) {
      if (i === -1) return NaN;
      try {
        return parseNumberFromString(r[i]);
      } catch (e) {
        return NaN;
      }
    }

    // --- Construcción de items (objeto por fila) ---
    const items = dataRows.map((r) => ({
      title: r[iTitle] || '',
      global: toNum(r, iGlobal),
      us: toNum(r, iUS),
      eu: toNum(r, iEU),
      jp: toNum(r, iJP),
      category: (iCategory >= 0 ? r[iCategory] : '') || '(unknown)',
      user_rating: toNum(r, iUserRating),
      installs: toNum(r, iInstalls),
      price: toNum(r, iPrice),
      growth30: toNum(r, iGrowth30),
      growth60: toNum(r, iGrowth60),
      rawRow: r, // útil para debug
    }));

    const nn = (x) => (isNaN(x) || x === null ? 0 : x);

    // --- A Top10 (barra columnas) ---
    const top10 = items
      .slice()
      .sort((a, b) => nn(b.global) - nn(a.global))
      .slice(0, 10);

    const dtTop = new google.visualization.DataTable();
    dtTop.addColumn('string', 'Title');
    dtTop.addColumn('number', 'Global Sales');
    top10.forEach((t) => dtTop.addRow([t.title, nn(t.global)]));
    const optTop = {
      legend: { position: 'none' },
      chartArea: { left: 160, top: 40, width: '60%' },
      height: 360,
    };
    const chartTop = new google.visualization.ColumnChart(
      document.getElementById('chart_top10')
    );
    chartTop.draw(dtTop, optTop);

    // --- B Pie regions ---
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

    // --- C Avg user rating by category (top 8 by count) ---
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
      chartArea: { left: 160, top: 40, width: '60%' },
      vAxis: { minValue: 0, maxValue: 5 },
      height: 360,
    });

    // --- D Scatter installs vs price (top 200 by installs) ---
    const validScatter = items
      .filter((i) => !isNaN(i.installs) && !isNaN(i.price) && i.installs > 0)
      .sort((a, b) => b.installs - a.installs)
      .slice(0, 200);

    // debug: mostrar primeras filas inválidas (opcional)
    const someInvalid = items
      .filter((i) => isNaN(i.installs) || isNaN(i.price))
      .slice(0, 10);
    if (someInvalid.length) {
      console.log(
        'Filas con installs/price no numérico (muestra 10):',
        someInvalid
      );
    }

    const dtScatter = new google.visualization.DataTable();
    dtScatter.addColumn('number', 'Installs');
    dtScatter.addColumn('number', 'Price');
    // tooltip como string (role) evita conflicto de tipos en ejes
    dtScatter.addColumn({
      type: 'string',
      role: 'tooltip',
      p: { html: false },
    });

    validScatter.forEach((it) => {
      const tooltip = `${it.title}\nInstalls: ${Math.round(
        nn(it.installs)
      ).toLocaleString()}\nPrice: ${nn(it.price)}`;
      dtScatter.addRow([nn(it.installs), nn(it.price), tooltip]);
    });

    const chartScatterWrapper = new google.visualization.ChartWrapper({
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
    chartScatterWrapper.draw();

    // --- E Growth line (avg per category top6) ---
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
      g30: growthByCat[k].count ? growthByCat[k].g30 / growthByCat[k].count : 0,
      g60: growthByCat[k].count ? growthByCat[k].g60 / growthByCat[k].count : 0,
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

    // --- F Table top-rated games ---
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

    // --- Redraw en resize (mantener responsive) ---
    window.addEventListener('resize', () => {
      try {
        chartTop.draw(dtTop, optTop);
        chartPie.draw(dtPie, {
          pieHole: 0.4,
          chartArea: { left: 20, top: 40, width: '80%' },
          height: 360,
        });
        chartBar.draw(dtCat, {
          legend: { position: 'none' },
          chartArea: { left: 160, top: 40, width: '60%' },
          vAxis: { minValue: 0, maxValue: 5 },
          height: 360,
        });
        chartScatterWrapper.draw();
        chartLine.draw(dtGrowth, {
          chartArea: { left: 140, top: 40, width: '55%' },
          height: 360,
        });
        chartTable.draw(dtTable, { showRowNumber: true, width: '100%' });
      } catch (e) {
        console.warn('Error al redibujar en resize:', e);
      }
    });
  } catch (e) {
    console.error(e);
    document.body.appendChild(document.createElement('pre')).textContent =
      'Error: ' + e.message;
  }
}
