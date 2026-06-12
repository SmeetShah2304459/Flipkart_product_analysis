

(() => {


  const $ = id => document.getElementById(id);

  const uploadScreen = $('upload-screen');
  const loadingScreen = $('loading-screen');
  const dashboard = $('dashboard');
  const csvInput = $('csv-input');
  const reloadBtn = $('reload-btn');
  const hamburger = $('hamburger');
  const sidebar = $('sidebar');


  const sections = ['overview', 'price-analysis', 'categories', 'brands', 'deal-finder', 'scatter'];
  const sectionMeta = {
    'overview': { title: 'Overview', sub: 'Dataset summary & key performance indicators' },
    'price-analysis': { title: 'Price Analysis', sub: 'Distribution of prices and discount patterns' },
    'categories': { title: 'Category Intelligence', sub: 'Average prices and discounts by product category' },
    'brands': { title: 'Brand Intelligence', sub: 'Top brands by volume, pricing, and discount strategy' },
    'deal-finder': { title: 'Deal Finder', sub: 'Sortable table of the best discounted products' },
    'scatter': { title: 'Price Scatter Plot', sub: 'Retail vs discounted price correlation analysis' },
  };


  function activateSection(id) {
    sections.forEach(s => {
      document.getElementById(`section-${s}`)?.classList.remove('active');
      document.querySelector(`.nav-item[data-section="${s}"]`)?.classList.remove('active');
    });
    document.getElementById(`section-${id}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-section="${id}"]`)?.classList.add('active');
    $('page-title').textContent = sectionMeta[id]?.title || '';
    $('page-sub').textContent = sectionMeta[id]?.sub || '';

    if (window.innerWidth <= 820) closeSidebar();
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      activateSection(item.dataset.section);
    });
  });


  let overlay = null;

  function openSidebar() {
    sidebar.classList.add('open');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeSidebar);
    }
    overlay.classList.add('show');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay?.classList.remove('show');
  }

  hamburger?.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });


  csvInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    startParsing(file);
  });

  reloadBtn?.addEventListener('click', () => {
    dashboard.classList.add('hidden');
    uploadScreen.classList.remove('hidden');
    csvInput.value = '';
  });

  async function startParsing(file) {
    uploadScreen.classList.add('hidden');
    loadingScreen.classList.remove('fade-out', 'hidden');
    loadingScreen.style.display = 'flex';
    $('loader-bar').style.width = '0%';
    $('loading-text').textContent = 'Parsing CSV…';

    let fakeProgress = 0;
    const fakeInterval = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 8, 85);
      $('loader-bar').style.width = fakeProgress + '%';
    }, 120);

    try {
      const data = await DataProcessor.parseCSV(file, rowCount => {
        $('loading-text').textContent = `Parsed ${rowCount.toLocaleString()} rows…`;
      });

      if (!data || data.length === 0) {
        clearInterval(fakeInterval);
        $('loading-text').textContent = 'No valid products were found in the CSV. Check header names and numeric values.';
        await sleep(1200);
        loadingScreen.classList.add('fade-out');
        await sleep(500);
        loadingScreen.style.display = 'none';
        uploadScreen.classList.remove('hidden');
        return;
      }

      $('loading-text').textContent = 'Building analytics…';
      $('loader-bar').style.width = '90%';
      await sleep(200);

      clearInterval(fakeInterval);
      $('loader-bar').style.width = '100%';
      $('loading-text').textContent = 'Rendering dashboard…';
      await sleep(300);

      buildDashboard(file.name);

      loadingScreen.classList.add('fade-out');
      await sleep(500);
      loadingScreen.style.display = 'none';
      dashboard.classList.remove('hidden');
      activateSection('overview');

    } catch (err) {
      clearInterval(fakeInterval);
      $('loading-text').textContent = 'Error: ' + err.message;
      console.error(err);
    }
  }


  function buildDashboard(filename) {
    const kpis = DataProcessor.getKPIs();


    $('badge-text').textContent = `${kpis.total.toLocaleString()} products loaded`;
    $('sidebar-dataset').textContent = filename;


    animateCounter($('kpi-total').querySelector('.kpi-value'), kpis.total);
    animateCounter($('kpi-discount').querySelector('.kpi-value'), kpis.avgDiscount, '%');
    animateCounter($('kpi-maxdiscount').querySelector('.kpi-value'), kpis.maxDiscount, '%');
    animateCounter($('kpi-categories').querySelector('.kpi-value'), kpis.categories);

    $('kpi-delta-discount').textContent = `across ${kpis.brands.toLocaleString()} brands`;
    $('kpi-delta-maxdiscount').textContent = `top deal in dataset`;
    $('kpi-delta-categories').textContent = `top: ${kpis.topCategory}`;


    Charts.renderSegments(DataProcessor.getPriceSegments());
    Charts.renderFKAdvantage(DataProcessor.getFKAdvantage());
    Charts.renderTopCategories(DataProcessor.getTopCategories(10));
    Charts.renderPriceHistogram(DataProcessor.getPriceHistogram(30000, 20));
    Charts.renderDiscountHistogram(DataProcessor.getDiscountHistogram());
    Charts.renderTopDeals(DataProcessor.getTopDeals(20));
    Charts.renderCatAvgPrice(DataProcessor.getCategoryAvgPrice(15));
    Charts.renderCatDiscount(DataProcessor.getCategoryAvgDiscount(15));
    Charts.renderBrandCount(DataProcessor.getBrandCount(15));
    Charts.renderBrandDiscount(DataProcessor.getBrandAvgDiscount(15));
    Charts.renderBrandPriceCompare(DataProcessor.getBrandPriceCompare(12));


    buildDealTable();
    buildScatter(50000);
  }


  function animateCounter(el, target, suffix = '') {
    const duration = 1200;
    const start = performance.now();
    const from = 0;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current = Math.round(from + (target - from) * eased);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function getSortDirection(col) {
    return (dealSort.col === col && dealSort.dir === 'desc') ? 'asc' : 'desc';
  }

  function clearSortHeaders() {
    document.querySelectorAll('.deal-table th').forEach(t => t.classList.remove('active-sort'));
  }

  function handleSortHeaderClick(event) {
    const th = event.currentTarget;
    const col = th.dataset.col;
    dealSort.dir = getSortDirection(col);
    dealSort.col = col;
    dealPage = 1;
    clearSortHeaders();
    th.classList.add('active-sort');
    th.querySelector('.sort-icon').textContent = dealSort.dir === 'desc' ? '↓' : '↑';
    renderDealTable();
  }

  let dealData = [];
  let dealFilter = { search: '', category: '', minDiscount: 0 };
  let dealSort = { col: 'discount_pct', dir: 'desc' };
  let dealPage = 1;
  const ROWS_PER_PAGE = 25;

  function buildDealTable() {
    dealData = DataProcessor.getDealsData();


    const catSelect = $('deal-filter-cat');
    DataProcessor.getUniqueCategories().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      catSelect.appendChild(opt);
    });

    $('deal-search').addEventListener('input', e => {
      dealFilter.search = e.target.value.toLowerCase().trim();
      dealPage = 1; renderDealTable();
    });
    catSelect.addEventListener('change', e => {
      dealFilter.category = e.target.value;
      dealPage = 1; renderDealTable();
    });
    $('deal-filter-min').addEventListener('change', e => {
      dealFilter.minDiscount = Number.parseInt(e.target.value, 10) || 0;
      dealPage = 1; renderDealTable();
    });


    document.querySelectorAll('.deal-table th.sortable').forEach(th => {
      th.addEventListener('click', handleSortHeaderClick);
    });

    renderDealTable();
  }

  function getFilteredDeals() {
    let data = dealData.slice();
    if (dealFilter.search) {
      data = data.filter(d =>
        d.product_name.toLowerCase().includes(dealFilter.search) ||
        d.brand.toLowerCase().includes(dealFilter.search) ||
        d.category.toLowerCase().includes(dealFilter.search)
      );
    }
    if (dealFilter.category) data = data.filter(d => d.category === dealFilter.category);
    if (dealFilter.minDiscount) data = data.filter(d => d.discount_pct >= dealFilter.minDiscount);


    data.sort((a, b) => {
      let av = a[dealSort.col];
      let bv = b[dealSort.col];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av === bv) return 0;
      if (dealSort.dir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
    return data;
  }

  function renderDealTable() {
    const filtered = getFilteredDeals();
    const total = filtered.length;
    const pages = Math.ceil(total / ROWS_PER_PAGE);
    const start = (dealPage - 1) * ROWS_PER_PAGE;
    const page = filtered.slice(start, start + ROWS_PER_PAGE);

    $('deal-count').textContent = `${total.toLocaleString()} deals`;

    const tbody = $('deal-table-body');
    tbody.innerHTML = '';

    if (page.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>No products match your filters</span></div></td></tr>';
      $('pagination').innerHTML = '';
      return;
    }

    page.forEach((prod, i) => {
      const rank = start + i + 1;
      let rankClass = '';
      if (rank === 1) rankClass = 'gold';
      else if (rank === 2) rankClass = 'silver';
      else if (rank === 3) rankClass = 'bronze';

      let discClass = 'low';
      if (prod.discount_pct >= 60) discClass = 'high';
      else if (prod.discount_pct >= 30) discClass = 'medium';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td title="${prod.product_name}">${prod.product_name}</td>
        <td>${prod.brand}</td>
        <td title="${prod.category}">${prod.category.substring(0, 30)}${prod.category.length > 30 ? '…' : ''}</td>
        <td><span class="price-text price-original">₹${prod.retail_price.toLocaleString()}</span></td>
        <td><span class="price-text price-sale">₹${prod.discounted_price.toLocaleString()}</span></td>
        <td><span class="discount-badge ${discClass}">${prod.discount_pct}% off</span></td>
        <td><span class="savings-text">₹${prod.savings.toLocaleString()}</span></td>
      `;
      tbody.appendChild(tr);
    });


    const pg = $('pagination');
    pg.innerHTML = '';
    const range = pagRange(dealPage, pages);
    range.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'pg-btn' + (p === dealPage ? ' active' : '');
      btn.textContent = p === '…' ? '…' : p;
      if (p !== '…') {
        btn.addEventListener('click', () => { dealPage = p; renderDealTable(); });
      }
      pg.appendChild(btn);
    });
  }

  function pagRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', cur - 1, cur, cur + 1, '…', total];
  }


  function buildScatter(maxPrice) {
    Charts.renderScatter(DataProcessor.getScatterData(maxPrice));
  }

  $('scatter-range')?.addEventListener('input', e => {
    const val = Number.parseInt(e.target.value, 10);
    $('scatter-max-label').textContent = '₹' + val.toLocaleString();
    e.target.style.backgroundSize = ((val - 500) / (200000 - 500) * 100) + '% 100%';
    buildScatter(val);
  });


  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

})();
