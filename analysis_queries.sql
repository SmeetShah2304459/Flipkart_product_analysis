-- ============================================================
--  Flipkart E-Commerce Price Intelligence — SQL Analysis
--  Dataset: flipkart_com-ecommerce_sample.csv (Kaggle)
--  Tool:    SQLite / PostgreSQL / MySQL (standard SQL)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. TABLE SETUP
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flipkart_products (
    uniq_id                  TEXT PRIMARY KEY,
    product_name             TEXT,
    product_category_tree    TEXT,
    retail_price             REAL,
    discounted_price         REAL,
    brand                    TEXT,
    is_FK_Advantage_product  TEXT,
    product_rating           REAL
);

-- Derived/cleaned view used by most queries below
CREATE VIEW IF NOT EXISTS products AS
SELECT
    uniq_id,
    TRIM(product_name)                                    AS product_name,
    TRIM(COALESCE(brand, 'Unknown'))                      AS brand,
    -- Extract root category from tree string like ["Cat >> Sub >> Sub2"]
    TRIM(SUBSTR(
        REPLACE(REPLACE(product_category_tree, '"', ''), '[', ''),
        1,
        INSTR(
            REPLACE(REPLACE(product_category_tree, '"', ''), '[', '') || '>',
            '>'
        ) - 1
    ))                                                    AS category,
    retail_price,
    discounted_price,
    CASE
        WHEN retail_price > 0 AND discounted_price > 0
             AND discounted_price < retail_price
        THEN ROUND(((retail_price - discounted_price) / retail_price) * 100)
        ELSE 0
    END                                                   AS discount_pct,
    retail_price - discounted_price                       AS savings,
    CASE WHEN is_FK_Advantage_product = 'true' THEN 1 ELSE 0 END AS is_fk_advantage,
    product_rating                                        AS rating
FROM flipkart_products
WHERE retail_price > 0;


-- ────────────────────────────────────────────────────────────
-- 1. DATASET OVERVIEW — KPIs
-- ────────────────────────────────────────────────────────────

-- 1a. High-level summary metrics
SELECT
    COUNT(*)                                             AS total_products,
    COUNT(DISTINCT brand)                                AS unique_brands,
    COUNT(DISTINCT category)                             AS unique_categories,
    ROUND(AVG(CASE WHEN discount_pct > 0 THEN discount_pct END), 1)
                                                         AS avg_discount_pct,
    MAX(discount_pct)                                    AS max_discount_pct,
    ROUND(AVG(retail_price), 0)                          AS avg_retail_price,
    ROUND(MIN(retail_price), 0)                          AS min_retail_price,
    ROUND(MAX(retail_price), 0)                          AS max_retail_price
FROM products;

-- 1b. FK Advantage vs Regular split
SELECT
    CASE WHEN is_fk_advantage = 1 THEN 'FK Advantage' ELSE 'Regular' END AS product_type,
    COUNT(*)                                              AS total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)   AS pct_of_total,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct
FROM products
GROUP BY is_fk_advantage;


-- ────────────────────────────────────────────────────────────
-- 2. PRICE SEGMENTATION
-- ────────────────────────────────────────────────────────────

-- 2a. Products by price tier
SELECT
    CASE
        WHEN retail_price <    500 THEN '1. Budget      (< ₹500)'
        WHEN retail_price <   2000 THEN '2. Mid-Range   (₹500–₹2k)'
        WHEN retail_price <  10000 THEN '3. Premium     (₹2k–₹10k)'
        ELSE                            '4. Luxury      (> ₹10k)'
    END                                                   AS price_tier,
    COUNT(*)                                              AS products,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)   AS pct_share,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct,
    ROUND(AVG(savings), 0)                                AS avg_savings_inr
FROM products
GROUP BY price_tier
ORDER BY price_tier;

-- 2b. Discount distribution buckets (10-percent bands)
SELECT
    CASE
        WHEN discount_pct BETWEEN  1 AND 10  THEN '01–10%'
        WHEN discount_pct BETWEEN 11 AND 20  THEN '11–20%'
        WHEN discount_pct BETWEEN 21 AND 30  THEN '21–30%'
        WHEN discount_pct BETWEEN 31 AND 40  THEN '31–40%'
        WHEN discount_pct BETWEEN 41 AND 50  THEN '41–50%'
        WHEN discount_pct BETWEEN 51 AND 60  THEN '51–60%'
        WHEN discount_pct BETWEEN 61 AND 70  THEN '61–70%'
        WHEN discount_pct BETWEEN 71 AND 80  THEN '71–80%'
        WHEN discount_pct BETWEEN 81 AND 90  THEN '81–90%'
        WHEN discount_pct BETWEEN 91 AND 100 THEN '91–100%'
        ELSE '0% (no discount)'
    END                                                   AS discount_band,
    COUNT(*)                                              AS products
FROM products
GROUP BY discount_band
ORDER BY discount_band;


-- ────────────────────────────────────────────────────────────
-- 3. CATEGORY INTELLIGENCE
-- ────────────────────────────────────────────────────────────

-- 3a. Top 15 categories by product count
SELECT
    category,
    COUNT(*)                                              AS product_count,
    ROUND(AVG(retail_price), 0)                           AS avg_retail_inr,
    ROUND(AVG(discounted_price), 0)                       AS avg_sale_inr,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct,
    MAX(discount_pct)                                     AS max_discount_pct
FROM products
GROUP BY category
HAVING COUNT(*) >= 5
ORDER BY product_count DESC
LIMIT 15;

-- 3b. Top 15 categories by average discount (minimum 5 products)
SELECT
    category,
    COUNT(*)                                              AS products,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct,
    ROUND(AVG(savings), 0)                                AS avg_savings_inr
FROM products
WHERE discount_pct > 0
GROUP BY category
HAVING COUNT(*) >= 5
ORDER BY avg_discount_pct DESC
LIMIT 15;

-- 3c. Most premium categories (highest average retail price)
SELECT
    category,
    COUNT(*)                                              AS products,
    ROUND(AVG(retail_price), 0)                           AS avg_retail_inr,
    ROUND(MIN(retail_price), 0)                           AS min_retail_inr,
    ROUND(MAX(retail_price), 0)                           AS max_retail_inr
FROM products
GROUP BY category
HAVING COUNT(*) >= 5
ORDER BY avg_retail_inr DESC
LIMIT 15;


-- ────────────────────────────────────────────────────────────
-- 4. BRAND INTELLIGENCE
-- ────────────────────────────────────────────────────────────

-- 4a. Top 15 brands by listing volume
SELECT
    brand,
    COUNT(*)                                              AS products,
    ROUND(AVG(retail_price), 0)                           AS avg_retail_inr,
    ROUND(AVG(discounted_price), 0)                       AS avg_sale_inr,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct,
    SUM(CASE WHEN is_fk_advantage = 1 THEN 1 ELSE 0 END)  AS fk_advantage_count
FROM products
GROUP BY brand
HAVING COUNT(*) >= 3
ORDER BY products DESC
LIMIT 15;

-- 4b. Most aggressive discounting brands (avg discount %)
SELECT
    brand,
    COUNT(*)                                              AS discounted_products,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct,
    MAX(discount_pct)                                     AS max_discount_pct,
    ROUND(AVG(savings), 0)                                AS avg_savings_inr
FROM products
WHERE discount_pct > 0
GROUP BY brand
HAVING COUNT(*) >= 3
ORDER BY avg_discount_pct DESC
LIMIT 15;

-- 4c. Retail vs discounted price — top 12 brands (for grouped bar chart)
SELECT
    brand,
    COUNT(*)                                              AS products,
    ROUND(AVG(retail_price), 0)                           AS avg_retail_inr,
    ROUND(AVG(discounted_price), 0)                       AS avg_sale_inr,
    ROUND(AVG(retail_price) - AVG(discounted_price), 0)   AS avg_price_drop_inr,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct
FROM products
WHERE brand IN (
    SELECT brand FROM products
    GROUP BY brand ORDER BY COUNT(*) DESC LIMIT 12
)
GROUP BY brand
ORDER BY avg_retail_inr DESC;


-- ────────────────────────────────────────────────────────────
-- 5. DEAL FINDER — TOP DISCOUNTED PRODUCTS
-- ────────────────────────────────────────────────────────────

-- 5a. Top 20 products by absolute savings (₹)
SELECT
    ROW_NUMBER() OVER (ORDER BY savings DESC)             AS rank,
    product_name,
    brand,
    category,
    retail_price,
    discounted_price,
    discount_pct,
    ROUND(savings, 0)                                     AS savings_inr
FROM products
WHERE discount_pct > 0
ORDER BY savings DESC
LIMIT 20;

-- 5b. Top 20 products by discount percentage
SELECT
    ROW_NUMBER() OVER (ORDER BY discount_pct DESC)        AS rank,
    product_name,
    brand,
    category,
    retail_price,
    discounted_price,
    discount_pct,
    ROUND(savings, 0)                                     AS savings_inr
FROM products
WHERE discount_pct > 0
ORDER BY discount_pct DESC
LIMIT 20;

-- 5c. Best deals per category (top discount product in each category)
SELECT
    category,
    product_name,
    brand,
    retail_price,
    discounted_price,
    discount_pct,
    ROUND(savings, 0)                                     AS savings_inr
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY category ORDER BY discount_pct DESC) AS rn
    FROM products
    WHERE discount_pct > 0
)
WHERE rn = 1
ORDER BY discount_pct DESC
LIMIT 20;


-- ────────────────────────────────────────────────────────────
-- 6. CORRELATION ANALYSIS (Retail vs Discounted Price)
-- ────────────────────────────────────────────────────────────

-- 6a. Price bucket summary for scatter plot grouping
SELECT
    CASE
        WHEN retail_price <    500 THEN 'Budget'
        WHEN retail_price <   2000 THEN 'Mid-Range'
        WHEN retail_price <  10000 THEN 'Premium'
        ELSE                            'Luxury'
    END                                                   AS segment,
    COUNT(*)                                              AS products,
    ROUND(AVG(retail_price), 0)                           AS avg_retail,
    ROUND(AVG(discounted_price), 0)                       AS avg_discounted,
    ROUND(AVG(discount_pct), 1)                           AS avg_discount_pct,
    ROUND(
        (AVG(retail_price * discounted_price) - AVG(retail_price) * AVG(discounted_price))
        / (
            SQRT(AVG(retail_price * retail_price) - AVG(retail_price) * AVG(retail_price)) *
            SQRT(AVG(discounted_price * discounted_price) - AVG(discounted_price) * AVG(discounted_price))
        ), 4
    )                                                     AS pearson_r
FROM products
WHERE retail_price > 0 AND discounted_price > 0
GROUP BY segment
ORDER BY avg_retail;

-- 6b. Products where discounted price is suspiciously close to retail
--     (potential fake discounts — discount < 2%)
SELECT
    product_name, brand, category,
    retail_price, discounted_price, discount_pct
FROM products
WHERE discount_pct BETWEEN 1 AND 2
ORDER BY retail_price DESC
LIMIT 20;


-- ────────────────────────────────────────────────────────────
-- 7. ADVANCED / BONUS QUERIES
-- ────────────────────────────────────────────────────────────

-- 7a. Category × Price Tier cross-tab (top 5 categories, all tiers)
SELECT
    category,
    SUM(CASE WHEN retail_price <    500 THEN 1 ELSE 0 END) AS budget,
    SUM(CASE WHEN retail_price <   2000
              AND retail_price >=   500 THEN 1 ELSE 0 END) AS mid_range,
    SUM(CASE WHEN retail_price <  10000
              AND retail_price >=  2000 THEN 1 ELSE 0 END) AS premium,
    SUM(CASE WHEN retail_price >= 10000 THEN 1 ELSE 0 END) AS luxury,
    COUNT(*)                                               AS total
FROM products
WHERE category IN (
    SELECT category FROM products
    GROUP BY category ORDER BY COUNT(*) DESC LIMIT 5
)
GROUP BY category
ORDER BY total DESC;

-- 7b. Rating vs discount relationship
SELECT
    CASE
        WHEN rating = 0          THEN 'No Rating'
        WHEN rating < 3.0        THEN '1.0–2.9'
        WHEN rating < 4.0        THEN '3.0–3.9'
        WHEN rating < 4.5        THEN '4.0–4.4'
        ELSE                          '4.5–5.0'
    END                                                    AS rating_band,
    COUNT(*)                                               AS products,
    ROUND(AVG(discount_pct), 1)                            AS avg_discount_pct,
    ROUND(AVG(retail_price), 0)                            AS avg_retail_inr
FROM products
GROUP BY rating_band
ORDER BY rating_band;

-- 7c. Month-over-month style analysis placeholder
--     (dataset has no date column; this query can be adapted when date is available)
-- SELECT
--     strftime('%Y-%m', crawl_date)  AS month,
--     COUNT(*)                       AS listings,
--     ROUND(AVG(discount_pct), 1)    AS avg_discount_pct
-- FROM products
-- GROUP BY month
-- ORDER BY month;
