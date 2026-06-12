const DataProcessor = (() => {

  // ─── State ───────────────────────────────────────────────────────────────────
  let allProducts = [];

  // ─── CSV Parsing ─────────────────────────────────────────────────────────────
  function normalizeHeader(header) {
    const map = {
      uniqid: 'uniq_id',
      productid: 'uniq_id',
      id: 'uniq_id',
      productname: 'product_name',
      name: 'product_name',
      productcategorytree: 'product_category_tree',
      categorytree: 'product_category_tree',
      retailprice: 'retail_price',
      mrp: 'retail_price',
      originalprice: 'retail_price',
      discountedprice: 'discounted_price',
      saleprice: 'discounted_price',
      brand: 'brand',
      iskadvantageproduct: 'is_FK_Advantage_product',
      isfkadvantageproduct: 'is_FK_Advantage_product',
      fkadvantage: 'is_FK_Advantage_product',
      productrating: 'product_rating',
      rating: 'product_rating',
    };
    const key = String(header || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return map[key] || key;
  }

  function parseCSV(file, onProgress) {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      Papa.parse(file, {
        header: true,
        transformHeader: normalizeHeader,
        skipEmptyLines: true,
        worker: false,
        step: () => {
          rowCount++;
          if (rowCount % 5000 === 0 && onProgress) onProgress(rowCount);
        },
        complete: (results) => {
          allProducts = cleanData(results.data);
          resolve(allProducts);
        },
        error: reject,
      });
    });
  }

  // ─── Data Cleaning ────────────────────────────────────────────────────────────
  function cleanData(raw) {
    return raw
      .map(row => {
        const parseNumber = value => {
          const sanitized = String(value || '').replace(/[₹,\s]/g, '');
          return Number.parseFloat(sanitized) || 0;
        };

        const parseBoolean = value => {
          const normalized = String(value || '').trim().toLowerCase();
          return ['true', '1', 'yes', 'y'].includes(normalized);
        };

        const retail     = parseNumber(row.retail_price);
        const discounted = parseNumber(row.discounted_price);
        const discount   = (retail > 0 && discounted > 0 && discounted < retail)
          ? Math.round(((retail - discounted) / retail) * 100)
          : 0;
        const category = extractCategory(row.product_category_tree);
        return {
          id:               row.uniq_id || row.uniqid || '',
          product_name:     (row.product_name || row.productname || '').trim().substring(0, 80),
          brand:            (row.brand || 'Unknown').trim(),
          category,
          retail_price:     retail,
          discounted_price: discounted,
          discount_pct:     discount,
          savings:          retail - discounted,
          is_fk_advantage:  parseBoolean(row.is_FK_Advantage_product || row.isfkadvantage || row.fkadvantage),
          rating:           parseNumber(row.product_rating || row.rating),
        };
      })
      .filter(p => p.retail_price > 0);
  }

  function extractCategory(tree) {
    if (!tree) return 'Other';
    const cleaned = tree.replace(/["[\]]/g, '').trim();
    const parts   = cleaned.split('>>');
    return (parts[0] || 'Other').trim();
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────────
  function getKPIs() {
    const products    = allProducts;
    const withDiscount = products.filter(p => p.discount_pct > 0);
    const avgDiscount  = withDiscount.length
      ? Math.round(withDiscount.reduce((s, p) => s + p.discount_pct, 0) / withDiscount.length)
      : 0;
    const maxDiscount  = Math.max(...products.map(p => p.discount_pct));
    const categories   = new Set(products.map(p => p.category));
    const brands       = new Set(products.map(p => p.brand));
    const topCat       = topByCount(products, 'category', 1);
    return {
      total:       products.length,
      avgDiscount,
      maxDiscount,
      categories:  categories.size,
      brands:      brands.size,
      topCategory: topCat[0]?.label || '—',
    };
  }

  // ─── Overview Charts ──────────────────────────────────────────────────────────
  function getPriceSegments() {
    const segments = { Budget: 0, 'Mid-Range': 0, Premium: 0, Luxury: 0 };
    allProducts.forEach(p => {
      if      (p.retail_price <   500) segments['Budget']++;
      else if (p.retail_price <  2000) segments['Mid-Range']++;
      else if (p.retail_price < 10000) segments['Premium']++;
      else                             segments['Luxury']++;
    });
    return Object.entries(segments).map(([label, count]) => ({ label, count }));
  }

  function getFKAdvantage() {
    const fk  = allProducts.filter(p => p.is_fk_advantage).length;
    const reg = allProducts.length - fk;
    return [
      { label: 'FK Advantage', count: fk  },
      { label: 'Regular',      count: reg },
    ];
  }

  function getTopCategories(n = 10) {
    return topByCount(allProducts, 'category', n);
  }

  // ─── Price / Discount Histograms ──────────────────────────────────────────────
  function getPriceHistogram(max = 20000, bins = 20) {
    const step    = max / bins;
    const buckets = Array.from({ length: bins }, (_, i) => ({
      label: `₹${Math.round(i * step / 1000)}k–${Math.round((i + 1) * step / 1000)}k`,
      count: 0,
    }));
    allProducts.forEach(p => {
      if (p.discounted_price > 0 && p.discounted_price <= max) {
        const idx = Math.min(Math.floor(p.discounted_price / step), bins - 1);
        buckets[idx].count++;
      }
    });
    return buckets;
  }

  function getDiscountHistogram() {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      label: `${i * 10}–${(i + 1) * 10}%`,
      count: 0,
    }));
    allProducts.forEach(p => {
      if (p.discount_pct > 0 && p.discount_pct <= 100) {
        const idx = Math.min(Math.floor(p.discount_pct / 10), 9);
        buckets[idx].count++;
      }
    });
    return buckets;
  }

  // ─── Top Deals ────────────────────────────────────────────────────────────────
  function getTopDeals(n = 20) {
    return allProducts
      .filter(p => p.discount_pct > 0 && p.retail_price > 0)
      .sort((a, b) => b.discount_pct - a.discount_pct)
      .slice(0, n);
  }

  // ─── Category Intelligence ────────────────────────────────────────────────────
  function getCategoryAvgPrice(n = 15) {
    const map = {};
    allProducts.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p.retail_price);
    });
    return Object.entries(map)
      .map(([label, prices]) => ({
        label,
        avg:   Math.round(prices.reduce((s, v) => s + v, 0) / prices.length),
        count: prices.length,
      }))
      .filter(c => c.count >= 5)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, n);
  }

  function getCategoryAvgDiscount(n = 15) {
    const map = {};
    allProducts.forEach(p => {
      if (p.discount_pct > 0) {
        if (!map[p.category]) map[p.category] = [];
        map[p.category].push(p.discount_pct);
      }
    });
    return Object.entries(map)
      .map(([label, discounts]) => ({
        label,
        avg:   Math.round(discounts.reduce((s, v) => s + v, 0) / discounts.length),
        count: discounts.length,
      }))
      .filter(c => c.count >= 5)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, n);
  }

  // ─── Brand Intelligence ───────────────────────────────────────────────────────
  function getBrandCount(n = 15) {
    return topByCount(allProducts, 'brand', n);
  }

  function getBrandAvgDiscount(n = 15) {
    const map = {};
    allProducts.forEach(p => {
      if (p.discount_pct > 0) {
        if (!map[p.brand]) map[p.brand] = [];
        map[p.brand].push(p.discount_pct);
      }
    });
    return Object.entries(map)
      .map(([label, discounts]) => ({
        label,
        avg:   Math.round(discounts.reduce((s, v) => s + v, 0) / discounts.length),
        count: discounts.length,
      }))
      .filter(c => c.count >= 3)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, n);
  }

  function getBrandPriceCompare(n = 12) {
    const topBrands = new Set(topByCount(allProducts, 'brand', n).map(b => b.label));
    const map       = {};
    allProducts.forEach(p => {
      if (!topBrands.has(p.brand)) return;
      if (!map[p.brand]) map[p.brand] = { retail: [], discounted: [] };
      if (p.retail_price     > 0) map[p.brand].retail.push(p.retail_price);
      if (p.discounted_price > 0) map[p.brand].discounted.push(p.discounted_price);
    });
    return Object.entries(map)
      .map(([label, d]) => ({
        label,
        avgRetail:     Math.round(avg(d.retail)),
        avgDiscounted: Math.round(avg(d.discounted)),
      }))
      .sort((a, b) => b.avgRetail - a.avgRetail);
  }

  // ─── Scatter Plot ─────────────────────────────────────────────────────────────
  function getScatterData(maxPrice = 50000) {
    const SAMPLE   = 3000;
    const filtered = allProducts.filter(
      p => p.retail_price > 0 && p.discounted_price > 0
        && p.retail_price <= maxPrice && p.discounted_price <= maxPrice
    );
    let sampled = filtered;
    if (filtered.length > SAMPLE) {
      const shuffled = filtered.slice().sort(() => Math.random() - 0.5);
      sampled = shuffled.slice(0, SAMPLE);
    }

    const segColor = p => {
      if (p.retail_price <   500) return 'rgba(16,185,129,0.6)';
      if (p.retail_price <  2000) return 'rgba(59,130,246,0.6)';
      if (p.retail_price < 10000) return 'rgba(139,92,246,0.6)';
      return 'rgba(244,63,94,0.6)';
    };

    return sampled.map(p => ({
      x:     p.retail_price,
      y:     p.discounted_price,
      label: p.product_name,
      color: segColor(p),
    }));
  }

  // ─── Deal Finder ──────────────────────────────────────────────────────────────
  function getDealsData() {
    return allProducts
      .filter(p => p.discount_pct > 0)
      .sort((a, b) => b.discount_pct - a.discount_pct);
  }

  function getUniqueCategories() {
    return [...new Set(allProducts.map(p => p.category))].sort((a, b) => a.localeCompare(b));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function topByCount(arr, key, n) {
    const map = {};
    arr.forEach(p => { map[p[key]] = (map[p[key]] || 0) + 1; });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  function avg(arr) {
    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    parseCSV,
    getKPIs,
    getPriceSegments,
    getFKAdvantage,
    getTopCategories,
    getPriceHistogram,
    getDiscountHistogram,
    getTopDeals,
    getCategoryAvgPrice,
    getCategoryAvgDiscount,
    getBrandCount,
    getBrandAvgDiscount,
    getBrandPriceCompare,
    getScatterData,
    getDealsData,
    getUniqueCategories,
  };
})();
