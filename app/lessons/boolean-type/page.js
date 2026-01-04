import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Boolean Type - PostgreSQL Learning',
  description: 'Learn about PostgreSQL boolean data type including true, false, null, and boolean operators',
};

export default function BooleanType() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Boolean Type</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Boolean Overview</h2>
          <p className="mb-4">
            PostgreSQL provides a native BOOLEAN type that can store three values: true, false, and NULL.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Value</th>
                  <th className="text-left p-2">Storage</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><code>TRUE</code> or <code>true</code> or <code>'t'</code> or <code>'yes'</code> or <code>'on'</code> or <code>'1'</code></td>
                  <td className="p-2">1 byte</td>
                  <td className="p-2">True value</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>FALSE</code> or <code>false</code> or <code>'f'</code> or <code>'no'</code> or <code>'off'</code> or <code>'0'</code></td>
                  <td className="p-2">1 byte</td>
                  <td className="p-2">False value</td>
                </tr>
                <tr>
                  <td className="p-2"><code>NULL</code></td>
                  <td className="p-2">1 byte</td>
                  <td className="p-2">Unknown/undefined value</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Creating Boolean Columns</h2>

          <CodeBlock
            title="SQL: Boolean Type"
            language="sql"
            code={`-- Create table with boolean columns
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  is_active BOOLEAN,
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT TRUE,
  email_confirmed BOOLEAN
);

-- Insert boolean values (various formats accepted)
INSERT INTO users (username, is_active, is_verified, is_premium, email_confirmed)
VALUES 
  ('alice', TRUE, FALSE, TRUE, 't'),
  ('bob', 'yes', 'no', 'on', 'off'),
  ('charlie', '1', '0', true, false),
  ('diana', NULL, FALSE, TRUE, NULL);

-- All these formats are equivalent
SELECT 
  username,
  is_active,
  is_verified,
  is_premium,
  email_confirmed
FROM users;

-- Boolean values display as 't' or 'f' by default
SELECT * FROM users;

-- Format boolean output
SELECT 
  username,
  CASE 
    WHEN is_active THEN 'Active'
    WHEN is_active IS FALSE THEN 'Inactive'
    ELSE 'Unknown'
  END AS status
FROM users;`}
          />
          <CodeBlock
            title="Prisma: Boolean Type"
            language="prisma"
            code={`// schema.prisma
model User {
  id              Int      @id @default(autoincrement())
  username        String   @db.VarChar(50)
  isActive        Boolean  @map("is_active") @default(false)
  isVerified      Boolean  @map("is_verified") @default(false)
  isPremium       Boolean  @map("is_premium") @default(true)
  emailConfirmed  Boolean? @map("email_confirmed")
  
  @@map("users")
}

// Usage
const user = await prisma.user.create({
  data: {
    username: 'alice',
    isActive: true,
    isVerified: false,
    isPremium: true,
    emailConfirmed: true,
  },
});

// Query with boolean filters
const activeUsers = await prisma.user.findMany({
  where: {
    isActive: true,
  },
});

const verifiedPremiumUsers = await prisma.user.findMany({
  where: {
    isVerified: true,
    isPremium: true,
  },
});

// Handle NULL values
const usersWithEmailStatus = await prisma.user.findMany({
  where: {
    emailConfirmed: {
      not: null,
    },
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Boolean Operators</h2>
          <p className="mb-4">
            PostgreSQL provides logical operators for working with boolean values.
          </p>

          <CodeBlock
            title="SQL: Boolean Operators"
            language="sql"
            code={`-- Create table for examples
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  in_stock BOOLEAN,
  on_sale BOOLEAN,
  featured BOOLEAN
);

INSERT INTO products (name, in_stock, on_sale, featured)
VALUES 
  ('Laptop', TRUE, FALSE, TRUE),
  ('Mouse', TRUE, TRUE, FALSE),
  ('Keyboard', FALSE, TRUE, TRUE),
  ('Monitor', TRUE, FALSE, FALSE);

-- AND operator
SELECT * FROM products WHERE in_stock AND on_sale;
SELECT * FROM products WHERE in_stock = TRUE AND on_sale = TRUE;

-- OR operator
SELECT * FROM products WHERE in_stock OR on_sale;
SELECT * FROM products WHERE featured OR on_sale;

-- NOT operator
SELECT * FROM products WHERE NOT in_stock;
SELECT * FROM products WHERE in_stock IS NOT TRUE;

-- Combined operators
SELECT * FROM products 
WHERE (in_stock AND on_sale) OR featured;

SELECT * FROM products 
WHERE in_stock AND NOT on_sale;

-- IS TRUE, IS FALSE, IS NOT TRUE, IS NOT FALSE
SELECT * FROM products WHERE in_stock IS TRUE;
SELECT * FROM products WHERE in_stock IS FALSE;
SELECT * FROM products WHERE in_stock IS NOT TRUE;  -- Includes NULL
SELECT * FROM products WHERE in_stock IS NOT FALSE; -- Includes NULL

-- IS NULL, IS NOT NULL
SELECT * FROM products WHERE in_stock IS NULL;
SELECT * FROM products WHERE in_stock IS NOT NULL;

-- Boolean expressions
SELECT 
  name,
  in_stock,
  on_sale,
  in_stock AND on_sale AS both_true,
  in_stock OR on_sale AS either_true,
  NOT in_stock AS not_in_stock
FROM products;

-- Boolean aggregation
SELECT 
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE in_stock) AS in_stock_count,
  COUNT(*) FILTER (WHERE on_sale) AS on_sale_count,
  COUNT(*) FILTER (WHERE in_stock AND on_sale) AS both_count,
  BOOL_AND(in_stock) AS all_in_stock,
  BOOL_OR(on_sale) AS any_on_sale
FROM products;`}
          />
          <CodeBlock
            title="Prisma: Boolean Operators"
            language="prisma"
            code={`// schema.prisma
model Product {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  inStock   Boolean  @map("in_stock")
  onSale    Boolean  @map("on_sale")
  featured  Boolean
  
  @@map("products")
}

// AND operator
const inStockAndOnSale = await prisma.product.findMany({
  where: {
    inStock: true,
    onSale: true,
  },
});

// OR operator
const inStockOrOnSale = await prisma.product.findMany({
  where: {
    OR: [
      { inStock: true },
      { onSale: true },
    ],
  },
});

// NOT operator
const notInStock = await prisma.product.findMany({
  where: {
    inStock: false,
  },
});

// Combined conditions
const complexQuery = await prisma.product.findMany({
  where: {
    OR: [
      {
        AND: [
          { inStock: true },
          { onSale: true },
        ],
      },
      { featured: true },
    ],
  },
});

// Boolean aggregation using raw SQL
const stats = await prisma.$queryRaw\`
  SELECT 
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE in_stock) AS in_stock_count,
    BOOL_AND(in_stock) AS all_in_stock,
    BOOL_OR(on_sale) AS any_on_sale
  FROM products
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Boolean Functions</h2>

          <CodeBlock
            title="SQL: Boolean Functions"
            language="sql"
            code={`-- Create table for examples
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  setting_name VARCHAR(100),
  enabled BOOLEAN,
  value BOOLEAN
);

INSERT INTO settings (setting_name, enabled, value)
VALUES 
  ('notifications', TRUE, TRUE),
  ('dark_mode', FALSE, TRUE),
  ('auto_save', TRUE, FALSE),
  ('backup', NULL, TRUE);

-- Boolean aggregation functions
SELECT 
  BOOL_AND(enabled) AS all_enabled,
  BOOL_OR(enabled) AS any_enabled,
  COUNT(*) FILTER (WHERE enabled) AS enabled_count,
  COUNT(*) FILTER (WHERE enabled IS TRUE) AS true_count,
  COUNT(*) FILTER (WHERE enabled IS FALSE) AS false_count,
  COUNT(*) FILTER (WHERE enabled IS NULL) AS null_count
FROM settings;

-- Convert boolean to text
SELECT 
  setting_name,
  enabled,
  enabled::text AS enabled_text,
  CASE 
    WHEN enabled THEN 'Yes'
    WHEN enabled IS FALSE THEN 'No'
    ELSE 'Unknown'
  END AS enabled_label
FROM settings;

-- Convert text/number to boolean
SELECT 
  'true'::boolean AS from_text_true,
  'false'::boolean AS from_text_false,
  't'::boolean AS from_t,
  'f'::boolean AS from_f,
  'yes'::boolean AS from_yes,
  'no'::boolean AS from_no,
  'on'::boolean AS from_on,
  'off'::boolean AS from_off,
  '1'::boolean AS from_one,
  '0'::boolean AS from_zero;

-- Boolean in WHERE clauses
SELECT * FROM settings WHERE enabled;
SELECT * FROM settings WHERE NOT enabled;
SELECT * FROM settings WHERE enabled IS TRUE;
SELECT * FROM settings WHERE enabled IS FALSE;
SELECT * FROM settings WHERE enabled IS NULL;
SELECT * FROM settings WHERE enabled IS NOT NULL;

-- Boolean in CASE expressions
SELECT 
  setting_name,
  CASE enabled
    WHEN TRUE THEN 'Enabled'
    WHEN FALSE THEN 'Disabled'
    ELSE 'Not Set'
  END AS status
FROM settings;`}
          />
          <CodeBlock
            title="Prisma: Boolean Functions"
            language="javascript"
            code={`// schema.prisma
model Setting {
  id          Int      @id @default(autoincrement())
  settingName String   @map("setting_name") @db.VarChar(100)
  enabled     Boolean
  value       Boolean?
  
  @@map("settings")
}

// Boolean aggregation using raw SQL
const stats = await prisma.$queryRaw\`
  SELECT 
    BOOL_AND(enabled) AS all_enabled,
    BOOL_OR(enabled) AS any_enabled,
    COUNT(*) FILTER (WHERE enabled) AS enabled_count
  FROM settings
\`;

// Convert boolean to text
const settingsWithLabels = await prisma.$queryRaw\`
  SELECT 
    setting_name,
    enabled,
    CASE 
      WHEN enabled THEN 'Yes'
      WHEN enabled IS FALSE THEN 'No'
      ELSE 'Unknown'
    END AS enabled_label
  FROM settings
\`;

// Filter with boolean
const enabledSettings = await prisma.setting.findMany({
  where: {
    enabled: true,
  },
});

// Handle NULL boolean values
const settingsWithNulls = await prisma.setting.findMany({
  where: {
    value: {
      not: null,
    },
  },
});

// Process in application code
const settings = await prisma.setting.findMany();
const processed = settings.map(s => ({
  ...s,
  enabledLabel: s.enabled ? 'Yes' : 'No',
}));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Boolean Indexing</h2>
          <p className="mb-4">
            Boolean columns can be indexed, though they're often not very selective. Consider partial indexes for better performance.
          </p>

          <CodeBlock
            title="SQL: Boolean Indexing"
            language="sql"
            code={`-- Create table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  is_completed BOOLEAN,
  is_cancelled BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regular index on boolean (usually not very useful)
CREATE INDEX idx_orders_is_completed ON orders(is_completed);

-- Partial index (more efficient for boolean)
CREATE INDEX idx_orders_active ON orders(user_id) 
WHERE is_completed = FALSE AND is_cancelled = FALSE;

-- Partial index for completed orders
CREATE INDEX idx_orders_completed ON orders(created_at) 
WHERE is_completed = TRUE;

-- Query using partial index
SELECT * FROM orders 
WHERE is_completed = FALSE AND is_cancelled = FALSE;

-- Boolean in composite indexes
CREATE INDEX idx_orders_user_completed ON orders(user_id, is_completed);

-- Query using composite index
SELECT * FROM orders 
WHERE user_id = 123 AND is_completed = TRUE;`}
          />
          <CodeBlock
            title="Prisma: Boolean Indexing"
            language="prisma"
            code={`// schema.prisma
model Order {
  id          Int       @id @default(autoincrement())
  userId      Int       @map("user_id")
  isCompleted Boolean   @map("is_completed") @default(false)
  isCancelled Boolean   @map("is_cancelled") @default(false)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  
  @@index([isCompleted], map: "idx_orders_is_completed")
  @@index([userId, isCompleted], map: "idx_orders_user_completed")
  @@map("orders")
}

// Prisma doesn't directly support partial indexes in schema
// Create them manually using raw SQL
await prisma.$executeRaw\`
  CREATE INDEX IF NOT EXISTS idx_orders_active 
  ON orders(user_id) 
  WHERE is_completed = FALSE AND is_cancelled = FALSE
\`;

// Query with boolean filters (uses indexes)
const activeOrders = await prisma.order.findMany({
  where: {
    isCompleted: false,
    isCancelled: false,
  },
});

const userCompletedOrders = await prisma.order.findMany({
  where: {
    userId: 123,
    isCompleted: true,
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use BOOLEAN</strong> for true/false values instead of integers or strings</li>
              <li><strong>Consider NULL</strong> - it represents "unknown" which is different from false</li>
              <li><strong>Use partial indexes</strong> for boolean columns when querying specific values</li>
              <li><strong>Default values</strong> - set appropriate defaults (usually FALSE)</li>
              <li><strong>Naming</strong> - use "is_", "has_", "can_" prefixes for clarity</li>
              <li><strong>Avoid</strong> storing booleans as integers (0/1) or strings ('Y'/'N')</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

