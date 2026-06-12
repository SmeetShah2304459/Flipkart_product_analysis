# 📊 FlipAnalytics — Flipkart Price Intelligence Dashboard

> Upload any Flipkart product CSV and instantly get a full-featured analytics dashboard — price breakdowns, discount intelligence, brand comparisons, category trends, and a live deal finder. Zero backend. Zero setup.

---

![Status](https://img.shields.io/badge/status-active-10b981?style=for-the-badge&logo=statuspage&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-single--file-3b82f6?style=for-the-badge&logo=html5&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.2-f59e0b?style=for-the-badge&logo=chart.js&logoColor=white)
![PapaParse](https://img.shields.io/badge/PapaParse-5.4.1-8b5cf6?style=for-the-badge)
![No Backend](https://img.shields.io/badge/backend-none-f43f5e?style=for-the-badge)

---

## ✨ Features

| Section | What you get |
|---|---|
| **Overview** | 4 animated KPI cards — total products, avg discount, max discount, category count |
| **Price Analysis** | Price distribution histogram, discount spread histogram, top 20 most-discounted products |
| **Category Intelligence** | Avg retail price by category, avg discount % by category (top 15 each) |
| **Brand Intelligence** | Top brands by volume, avg discount % per brand, grouped retail vs sale price comparison |
| **Deal Finder** | Fully sortable + filterable table with search, category filter, minimum discount filter, and pagination |
| **Scatter Plot** | Retail vs discounted price scatter with adjustable price range slider, color-coded by price tier |

---

## 🚀 How to Use

**Option A — Single file (recommended)**

1. Download `flipkart_dashboard.html`
2. Open it in any modern browser (Chrome, Firefox, Edge, Safari)
3. Click **Choose CSV File**, upload your Flipkart product CSV, done

**Option B — From source**

```
flipkart-dashboard/
├── index.html          ← open this in a local server (see note below)
├── style.css
├── data-processor.js
├── charts.js
└── dashboard.js
```

> ⚠️ **Important:** `index.html` requires a local server due to browser `file://` security restrictions. Use VS Code Live Server, or run `python3 -m http.server 8080` in the project folder and open `http://localhost:8080`.

---

## 📁 CSV Format

The dashboard accepts any CSV with Flipkart-style product columns. Headers are **auto-normalized** — underscores, spaces, and casing differences are handled automatically.

### Required columns

| Your CSV header | Normalized to | Notes |
|---|---|---|
| `uniq_id` / `product_id` / `id` | `uniq_id` | Unique product identifier |
| `product_name` / `name` | `product_name` | Product title |
| `brand` | `brand` | Brand name |
| `product_category_tree` / `category_tree` | `product_category_tree` | Format: `"Category >> Sub >> Item"` |
| `retail_price` / `mrp` / `original_price` | `retail_price` | Must be numeric (₹ symbol auto-stripped) |
| `discounted_price` / `sale_price` | `discounted_price` | Must be numeric |
| `is_FK_Advantage_product` / `fk_advantage` | `is_FK_Advantage_product` | `TRUE` / `FALSE` |
| `product_rating` / `rating` | `product_rating` | Numeric, e.g. `4.3` |

### Minimum data requirements for all charts to render

- At least **5 products per category** for category intelligence charts
- At least **3 products per brand** for brand intelligence charts
- At least **1 product with `discounted_price < retail_price`** for discount charts

A sample file `flipkart_sample.csv` with 200 products is included to get you started.

---

## 🛠 Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [Chart.js](https://www.chartjs.org/) | 4.4.2 | All 11 interactive charts |
| [PapaParse](https://www.papaparse.com/) | 5.4.1 | Fast in-browser CSV parsing |
| [Inter](https://fonts.google.com/specimen/Inter) | — | UI typography |
| [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | — | Code / numeric accents |

No frameworks. No build step. No npm. Pure HTML, CSS, and vanilla JS.

---

## 🗂 Project Structure

```
flipkart-dashboard/
│
├── index.html              # App shell — layout, sections, chart canvases
├── style.css               # Dark theme design system + responsive layout
├── data-processor.js       # CSV parsing, data cleaning, all analytics computations
├── charts.js               # Chart.js wrappers for all 11 chart types
├── dashboard.js            # App controller — file upload, KPI animation, deal table, scatter
│
├── flipkart_dashboard.html # ✅ Self-contained single-file build (recommended)
└── flipkart_sample.csv     # 200-row sample dataset ready to upload
```

---

## 📊 Charts Included

1. **Price Range Segments** — Doughnut (Budget / Mid-Range / Premium / Luxury)
2. **FK Advantage vs Regular** — Doughnut
3. **Top 10 Categories by Product Count** — Bar
4. **Price Distribution Histogram** — Bar (20 bins)
5. **Discount Distribution Histogram** — Bar (10% buckets)
6. **Top 20 Most Discounted Products** — Horizontal bar
7. **Average Retail Price by Category** — Horizontal bar (top 15)
8. **Average Discount % by Category** — Horizontal bar (top 15)
9. **Top 15 Brands by Product Count** — Bar
10. **Top 15 Brands — Avg Discount %** — Bar
11. **Retail vs Discounted Price — Top 12 Brands** — Grouped bar
12. **Scatter Plot: Retail vs Discounted Price** — Scatter with diagonal reference line

---

## 🐛 Known Fixes Applied

| Bug | Root cause | Fix |
|---|---|---|
| "No valid products found" on any valid CSV | PapaParse `step` + `complete` used together — `results.data` is always `[]` when `step` is active | Rows now collected manually inside `step` into a local array, passed to `cleanData` in `complete` |
| Brand / category charts empty with small datasets | `getBrandAvgDiscount` requires ≥3 products/brand; `getCategoryAvgPrice` requires ≥5 products/category | Sample CSV updated to 200 products with 5–10 per brand |
| Source files blocked when opened via `file://` | Browser CORS policy blocks sibling `.js` file loads | Bundled single-file `flipkart_dashboard.html` provided |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  Built with vanilla JS · No backend required · Works offline after first load
</div>
