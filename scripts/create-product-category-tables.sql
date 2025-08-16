-- Create table: category_mdx
CREATE TABLE IF NOT EXISTS category_mdx (
  id TEXT NOT NULL,
  language TEXT NOT NULL,
  mdx_full TEXT,
  PRIMARY KEY (id, language)
);

-- Create table: product_mdx
CREATE TABLE IF NOT EXISTS product_mdx (
  id TEXT NOT NULL,
  language TEXT NOT NULL,
  mdx_full TEXT,
  PRIMARY KEY (id, language)
); 