

const Charts = (() => {


  Chart.defaults.color = '#8ba0c0';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = '#0d1526';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(59,130,246,0.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.titleColor = '#f0f6ff';
  Chart.defaults.plugins.tooltip.bodyColor = '#8ba0c0';
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;

  const PALETTE = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#f43f5e', '#06b6d4', '#84cc16', '#ec4899',
    '#6366f1', '#14b8a6', '#f97316', '#a855f7',
    '#22d3ee', '#fb923c', '#4ade80', '#facc15',
  ];

  function gradient(ctx, color1, color2, height = 300) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, color1);
    g.addColorStop(1, color2);
    return g;
  }

  const chartInstances = {};

  function destroy(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
  }

  function register(id, chart) {
    chartInstances[id] = chart;
    return chart;
  }


  function renderSegments(data) {
    destroy('segments');
    const ctx = document.getElementById('chart-segments').getContext('2d');
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];
    return register('segments', new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: colors,
          borderColor: colors.map(c => c + '44'),
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        cutout: '65%',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyleWidth: 10 } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 800 },
      }
    }));
  }

  function renderFKAdvantage(data) {
    destroy('fk-advantage');
    const ctx = document.getElementById('chart-fk-advantage').getContext('2d');
    return register('fk-advantage', new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ['#3b82f6', 'rgba(255,255,255,0.1)'],
          borderColor: ['rgba(59,130,246,0.5)', 'rgba(255,255,255,0.1)'],
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        cutout: '65%',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyleWidth: 10 } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 900 },
      }
    }));
  }

  function renderTopCategories(data) {
    destroy('top-categories');
    const ctx = document.getElementById('chart-top-categories').getContext('2d');
    return register('top-categories', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Products',
          data: data.map(d => d.count),
          backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
          borderColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxRotation: 25 } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true,
            ticks: { callback: v => v.toLocaleString() }
          },
        },
        animation: { duration: 700, easing: 'easeOutQuart' },
      }
    }));
  }


  function renderPriceHistogram(data) {
    destroy('price-hist');
    const ctx = document.getElementById('chart-price-hist').getContext('2d');
    const g = gradient(ctx, '#3b82f6', 'rgba(59,130,246,0.05)');
    return register('price-hist', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Products',
          data: data.map(d => d.count),
          backgroundColor: g,
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true,
            ticks: { callback: v => v.toLocaleString() }
          },
        },
        animation: { duration: 600 },
      }
    }));
  }


  function renderDiscountHistogram(data) {
    destroy('discount-hist');
    const ctx = document.getElementById('chart-discount-hist').getContext('2d');
    const g = gradient(ctx, '#10b981', 'rgba(16,185,129,0.05)');
    return register('discount-hist', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Products',
          data: data.map(d => d.count),
          backgroundColor: g,
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true,
            ticks: { callback: v => v.toLocaleString() }
          },
        },
        animation: { duration: 600 },
      }
    }));
  }

  function renderTopDeals(data) {
    destroy('top-deals');
    const ctx = document.getElementById('chart-top-deals').getContext('2d');
    const labels = data.map(d => d.product_name.substring(0, 40));
    const colors = data.map(d => {
      if (d.discount_pct >= 70) return '#10b981';
      if (d.discount_pct >= 50) return '#3b82f6';
      return '#8b5cf6';
    });
    return register('top-deals', new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Discount %',
          data: data.map(d => d.discount_pct),
          backgroundColor: colors.map(c => c + 'cc'),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.x}% off — Save ₹${data[ctx.dataIndex].savings.toLocaleString()}`,
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, max: 100,
            ticks: { callback: v => v + '%' }
          },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
        animation: { duration: 700 },
      }
    }));
  }


  function renderCatAvgPrice(data) {
    destroy('cat-avg-price');
    const ctx = document.getElementById('chart-cat-avg-price').getContext('2d');
    return register('cat-avg-price', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Avg Retail Price (₹)',
          data: data.map(d => d.avg),
          backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length] + 'bb'),
          borderColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ₹${ctx.parsed.x.toLocaleString()}` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true,
            ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
          },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
        animation: { duration: 700 },
      }
    }));
  }


  function renderCatDiscount(data) {
    destroy('cat-discount');
    const ctx = document.getElementById('chart-cat-discount').getContext('2d');
    return register('cat-discount', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Avg Discount %',
          data: data.map(d => d.avg),
          backgroundColor: data.map(d => {
            if (d.avg >= 60) return '#10b981cc';
            if (d.avg >= 40) return '#3b82f6cc';
            return '#8b5cf6cc';
          }),
          borderColor: data.map(d => {
            if (d.avg >= 60) return '#10b981';
            if (d.avg >= 40) return '#3b82f6';
            return '#8b5cf6';
          }),
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.parsed.x}% average discount` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, max: 100,
            ticks: { callback: v => v + '%' }
          },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
        animation: { duration: 700 },
      }
    }));
  }


  function renderBrandCount(data) {
    destroy('brand-count');
    const ctx = document.getElementById('chart-brand-count').getContext('2d');
    const g = gradient(ctx, '#8b5cf6', 'rgba(139,92,246,0.05)');
    return register('brand-count', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Products',
          data: data.map(d => d.count),
          backgroundColor: g,
          borderColor: '#8b5cf6',
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 40, font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true,
            ticks: { callback: v => v.toLocaleString() }
          },
        },
        animation: { duration: 600 },
      }
    }));
  }


  function renderBrandDiscount(data) {
    destroy('brand-discount');
    const ctx = document.getElementById('chart-brand-discount').getContext('2d');
    const g = gradient(ctx, '#f59e0b', 'rgba(245,158,11,0.05)');
    return register('brand-discount', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Avg Discount %',
          data: data.map(d => d.avg),
          backgroundColor: g,
          borderColor: '#f59e0b',
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 40, font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, max: 100,
            ticks: { callback: v => v + '%' }
          },
        },
        animation: { duration: 600 },
      }
    }));
  }


  function renderBrandPriceCompare(data) {
    destroy('brand-price-compare');
    const ctx = document.getElementById('chart-brand-price-compare').getContext('2d');
    return register('brand-price-compare', new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Avg Retail Price',
            data: data.map(d => d.avgRetail),
            backgroundColor: 'rgba(59,130,246,0.6)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 5,
          },
          {
            label: 'Avg Discounted Price',
            data: data.map(d => d.avgDiscounted),
            backgroundColor: 'rgba(16,185,129,0.6)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString()}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 30, font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true,
            ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
          },
        },
        animation: { duration: 700 },
      }
    }));
  }


  function renderScatter(data) {
    destroy('scatter');
    const ctx = document.getElementById('chart-scatter').getContext('2d');


    const maxVal = Math.max(...data.map(d => d.x), 500);

    return register('scatter', new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Products',
            data: data,
            backgroundColor: data.map(d => d.color),
            borderColor: 'transparent',
            pointRadius: 3.5,
            pointHoverRadius: 6,
          },
          {
            label: 'No Discount Line',
            data: [{ x: 0, y: 0 }, { x: maxVal, y: maxVal }],
            type: 'line',
            borderColor: 'rgba(255,255,255,0.15)',
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              filter: item => item.text !== 'Products',
            }
          },
          tooltip: {
            filter: item => item.datasetIndex === 0,
            callbacks: {
              label: ctx => {
                const d = ctx.raw;
                const discount = d.x > 0 ? Math.round(((d.x - d.y) / d.x) * 100) : 0;
                return [
                  ` ${d.label}`,
                  ` Retail: ₹${d.x.toLocaleString()} → Sale: ₹${d.y.toLocaleString()}`,
                  ` Discount: ${discount}%`,
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: 'Retail Price (₹)', color: '#8ba0c0' },
            ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: 'Discounted Price (₹)', color: '#8ba0c0' },
            ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
          },
        },
        animation: { duration: 800 },
      }
    }));
  }

  return {
    renderSegments,
    renderFKAdvantage,
    renderTopCategories,
    renderPriceHistogram,
    renderDiscountHistogram,
    renderTopDeals,
    renderCatAvgPrice,
    renderCatDiscount,
    renderBrandCount,
    renderBrandDiscount,
    renderBrandPriceCompare,
    renderScatter,
  };
})();
