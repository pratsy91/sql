import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Numeric Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL numeric data types including integers, decimals, floats, serials, and money',
};

export default function NumericTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Numeric Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Integer Types</h2>
          <p className="mb-4">
            PostgreSQL provides three integer types with different storage sizes and ranges.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Storage</th>
                  <th className="text-left p-2">Range</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><code>smallint</code></td>
                  <td className="p-2">2 bytes</td>
                  <td className="p-2">-32,768 to 32,767</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>integer</code> or <code>int</code></td>
                  <td className="p-2">4 bytes</td>
                  <td className="p-2">-2,147,483,648 to 2,147,483,647</td>
                </tr>
                <tr>
                  <td className="p-2"><code>bigint</code></td>
                  <td className="p-2">8 bytes</td>
                  <td className="p-2">-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="SQL: Integer Types"
            language="sql"
            code={`-- Create table with integer types
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  category_id INTEGER,
  stock_count SMALLINT,
  price INTEGER  -- in cents
);

-- Insert values
INSERT INTO products (id, category_id, stock_count, price)
VALUES (1, 10, 100, 1999);

-- Integer operations
SELECT 
  id,
  category_id,
  stock_count,
  price / 100.0 AS price_in_dollars,
  stock_count * 2 AS double_stock
FROM products;

-- Integer functions
SELECT 
  ABS(-42) AS absolute_value,
  CEIL(4.3) AS ceiling,
  FLOOR(4.7) AS floor,
  ROUND(4.5) AS rounded,
  TRUNC(4.789, 2) AS truncated,
  MOD(10, 3) AS modulo,
  POWER(2, 8) AS power,
  SQRT(16) AS square_root,
  RANDOM() AS random_number
FROM products LIMIT 1;`}
          />
          <CodeBlock
            title="Prisma: Integer Types"
            language="prisma"
            code={`// schema.prisma
model Product {
  id          BigInt  @id @default(autoincrement())
  categoryId  Int     @map("category_id")
  stockCount  Int     @map("stock_count") @db.SmallInt
  price       Int     // in cents
  
  @@map("products")
}

// Usage
const product = await prisma.product.create({
  data: {
    categoryId: 10,
    stockCount: 100,
    price: 1999,
  },
});

// Query with calculations
const products = await prisma.$queryRaw\`
  SELECT 
    id,
    category_id,
    stock_count,
    price / 100.0 AS price_in_dollars
  FROM products
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Decimal/Numeric Types</h2>
          <p className="mb-4">
            The <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">NUMERIC</code> and <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">DECIMAL</code> types are equivalent. 
            They store exact numeric values with user-specified precision and scale.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Syntax:</strong> <code>NUMERIC(precision, scale)</code> or <code>DECIMAL(precision, scale)</code></p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>precision:</strong> Total number of digits</li>
              <li><strong>scale:</strong> Number of digits after decimal point</li>
              <li>If precision/scale not specified, can store any precision and scale</li>
            </ul>
          </div>

          <CodeBlock
            title="SQL: Decimal/Numeric Types"
            language="sql"
            code={`-- Create table with numeric types
CREATE TABLE financial_data (
  id SERIAL PRIMARY KEY,
  account_balance NUMERIC(10, 2),      -- 10 digits, 2 after decimal
  interest_rate DECIMAL(5, 4),         -- 5 digits, 4 after decimal (e.g., 0.1234)
  exact_value NUMERIC,                 -- Arbitrary precision
  price DECIMAL(8, 2)                  -- 8 digits, 2 after decimal
);

-- Insert values
INSERT INTO financial_data (account_balance, interest_rate, exact_value, price)
VALUES 
  (1234567.89, 0.0525, 123.4567890123456789, 99.99),
  (999999.99, 0.0001, 0.0000000001, 0.01);

-- Numeric operations
SELECT 
  account_balance,
  interest_rate,
  account_balance * interest_rate AS interest_amount,
  ROUND(account_balance * interest_rate, 2) AS rounded_interest,
  account_balance + 1000.50 AS new_balance
FROM financial_data;

-- Numeric functions
SELECT 
  account_balance,
  CEIL(account_balance) AS ceiling,
  FLOOR(account_balance) AS floor,
  ROUND(account_balance, 1) AS rounded_to_one,
  TRUNC(account_balance, 0) AS truncated,
  ABS(account_balance) AS absolute_value
FROM financial_data;`}
          />
          <CodeBlock
            title="Prisma: Decimal/Numeric Types"
            language="prisma"
            code={`// schema.prisma
model FinancialData {
  id            Int      @id @default(autoincrement())
  accountBalance Decimal  @map("account_balance") @db.Decimal(10, 2)
  interestRate  Decimal  @map("interest_rate") @db.Decimal(5, 4)
  exactValue    Decimal? @map("exact_value")
  price         Decimal  @db.Decimal(8, 2)
  
  @@map("financial_data")
}

// Usage
const data = await prisma.financialData.create({
  data: {
    accountBalance: new Decimal('1234567.89'),
    interestRate: new Decimal('0.0525'),
    exactValue: new Decimal('123.4567890123456789'),
    price: new Decimal('99.99'),
  },
});

// Query with calculations
const results = await prisma.$queryRaw\`
  SELECT 
    account_balance,
    interest_rate,
    account_balance * interest_rate AS interest_amount
  FROM financial_data
\`;

// Note: Install decimal.js for Decimal type
// npm install decimal.js
// import { Decimal } from 'decimal.js'`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Floating-Point Types</h2>
          <p className="mb-4">
            Floating-point types store approximate numeric values. They are faster but less precise than NUMERIC.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Storage</th>
                  <th className="text-left p-2">Precision</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><code>real</code></td>
                  <td className="p-2">4 bytes</td>
                  <td className="p-2">6 decimal digits</td>
                </tr>
                <tr>
                  <td className="p-2"><code>double precision</code></td>
                  <td className="p-2">8 bytes</td>
                  <td className="p-2">15 decimal digits</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="SQL: Floating-Point Types"
            language="sql"
            code={`-- Create table with floating-point types
CREATE TABLE measurements (
  id SERIAL PRIMARY KEY,
  temperature REAL,                    -- Single precision
  pressure DOUBLE PRECISION,            -- Double precision
  velocity REAL,
  acceleration DOUBLE PRECISION
);

-- Insert values
INSERT INTO measurements (temperature, pressure, velocity, acceleration)
VALUES 
  (25.5, 1013.25, 10.5, 9.80665),
  (-10.2, 1020.5, 0.0, 0.0);

-- Floating-point operations
SELECT 
  temperature,
  pressure,
  temperature * 9/5 + 32 AS fahrenheit,
  pressure / 1013.25 AS normalized_pressure,
  velocity + acceleration * 1.0 AS new_velocity
FROM measurements;

-- Floating-point functions
SELECT 
  temperature,
  ROUND(temperature, 1) AS rounded_temp,
  CEIL(temperature) AS ceiling_temp,
  FLOOR(temperature) AS floor_temp,
  ABS(temperature) AS absolute_temp,
  POWER(velocity, 2) AS velocity_squared,
  SQRT(acceleration) AS sqrt_acceleration
FROM measurements;`}
          />
          <CodeBlock
            title="Prisma: Floating-Point Types"
            language="prisma"
            code={`// schema.prisma
model Measurement {
  id          Int     @id @default(autoincrement())
  temperature Float?  @db.Real
  pressure    Float   @db.DoublePrecision
  velocity    Float?  @db.Real
  acceleration Float  @db.DoublePrecision
  
  @@map("measurements")
}

// Usage
const measurement = await prisma.measurement.create({
  data: {
    temperature: 25.5,
    pressure: 1013.25,
    velocity: 10.5,
    acceleration: 9.80665,
  },
});

// Query with calculations
const results = await prisma.$queryRaw\`
  SELECT 
    temperature,
    temperature * 9/5 + 32 AS fahrenheit
  FROM measurements
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Serial Types</h2>
          <p className="mb-4">
            Serial types are auto-incrementing integers. They create a sequence and set the column as default.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Underlying Type</th>
                  <th className="text-left p-2">Range</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><code>smallserial</code></td>
                  <td className="p-2">smallint</td>
                  <td className="p-2">1 to 32,767</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><code>serial</code></td>
                  <td className="p-2">integer</td>
                  <td className="p-2">1 to 2,147,483,647</td>
                </tr>
                <tr>
                  <td className="p-2"><code>bigserial</code></td>
                  <td className="p-2">bigint</td>
                  <td className="p-2">1 to 9,223,372,036,854,775,807</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            title="SQL: Serial Types"
            language="sql"
            code={`-- Create table with serial types
CREATE TABLE users (
  id SERIAL PRIMARY KEY,              -- Auto-incrementing integer
  user_code SMALLSERIAL,              -- Auto-incrementing smallint
  record_id BIGSERIAL,                 -- Auto-incrementing bigint
  username VARCHAR(50)
);

-- Insert values (serial columns auto-increment)
INSERT INTO users (username) VALUES ('alice');
INSERT INTO users (username) VALUES ('bob');
INSERT INTO users (username) VALUES ('charlie');

-- View the generated IDs
SELECT id, user_code, record_id, username FROM users;

-- Get current sequence value
SELECT currval('users_id_seq');
SELECT currval('users_user_code_seq');
SELECT currval('users_record_id_seq');

-- Set sequence value
SELECT setval('users_id_seq', 100);

-- Get next sequence value
SELECT nextval('users_id_seq');

-- Reset sequence
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Manual insert with explicit ID (affects sequence)
INSERT INTO users (id, username) VALUES (50, 'dave');
-- Next auto-generated ID will be 51, not 4`}
          />
          <CodeBlock
            title="Prisma: Serial Types"
            language="prisma"
            code={`// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  userCode  Int      @default(autoincrement()) @map("user_code") @db.SmallInt
  recordId  BigInt   @default(autoincrement()) @map("record_id")
  username  String   @db.VarChar(50)
  
  @@map("users")
}

// Usage - IDs are auto-generated
const user1 = await prisma.user.create({
  data: {
    username: 'alice',
  },
});

const user2 = await prisma.user.create({
  data: {
    username: 'bob',
  },
});

// Prisma handles sequences automatically
// You can also manually set IDs if needed
const user3 = await prisma.user.create({
  data: {
    id: 100,
    username: 'charlie',
  },
});

// Reset sequence using raw SQL
await prisma.$executeRaw\`ALTER SEQUENCE users_id_seq RESTART WITH 1\`;

// Get current sequence value
const currentId = await prisma.$queryRaw\`SELECT currval('users_id_seq')\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Money Type</h2>
          <p className="mb-4">
            The <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">MONEY</code> type stores currency amounts. 
            It's stored as 8 bytes and has a fixed precision. Note: This type is locale-dependent.
          </p>

          <CodeBlock
            title="SQL: Money Type"
            language="sql"
            code={`-- Create table with money type
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  amount MONEY,
  description TEXT
);

-- Set locale for money formatting (optional)
SET lc_monetary = 'en_US.UTF-8';

-- Insert values
INSERT INTO transactions (amount, description)
VALUES 
  ('$100.50', 'Purchase'),
  ('$1,234.56', 'Sale'),
  ('-$50.00', 'Refund'),
  (100.50, 'Direct numeric value');

-- Money operations
SELECT 
  amount,
  amount * 2 AS double_amount,
  amount + '$10.00'::money AS increased_amount,
  amount - '$5.00'::money AS decreased_amount
FROM transactions;

-- Format money
SELECT 
  amount,
  to_char(amount, 'FM$999,999,999.00') AS formatted,
  amount::numeric AS as_numeric
FROM transactions;

-- Aggregate functions with money
SELECT 
  SUM(amount) AS total,
  AVG(amount) AS average,
  MIN(amount) AS minimum,
  MAX(amount) AS maximum,
  COUNT(*) AS transaction_count
FROM transactions;

-- Comparison operations
SELECT * FROM transactions WHERE amount > '$100.00'::money;
SELECT * FROM transactions WHERE amount BETWEEN '$50.00'::money AND '$200.00'::money;`}
          />
          <CodeBlock
            title="Prisma: Money Type"
            language="prisma"
            code={`// schema.prisma
// Note: Prisma doesn't have native MONEY type support
// Use Decimal or Integer (store in cents) instead

model Transaction {
  id          Int      @id @default(autoincrement())
  amount      Decimal  @db.Decimal(10, 2)  // Store as decimal
  amountCents Int?     @map("amount_cents")  // Or store in cents
  description String?  @db.Text
  
  @@map("transactions")
}

// Or use raw SQL for MONEY type
model TransactionMoney {
  id          Int      @id @default(autoincrement())
  amount      Decimal  @db.Money  // Some Prisma versions support this
  description String?  @db.Text
  
  @@map("transactions_money")
}

// Usage with Decimal (recommended)
const transaction = await prisma.transaction.create({
  data: {
    amount: new Decimal('100.50'),
    description: 'Purchase',
  },
});

// Query money values
const transactions = await prisma.$queryRaw\`
  SELECT 
    amount,
    to_char(amount::money, 'FM$999,999,999.00') AS formatted
  FROM transactions
\`;

// Aggregate operations
const summary = await prisma.$queryRaw\`
  SELECT 
    SUM(amount) AS total,
    AVG(amount) AS average
  FROM transactions
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Numeric Type Comparison</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">When to Use Each Type:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>INTEGER/BIGINT:</strong> Whole numbers, IDs, counts</li>
              <li><strong>NUMERIC/DECIMAL:</strong> Exact decimal values (money, measurements requiring precision)</li>
              <li><strong>REAL/DOUBLE PRECISION:</strong> Approximate values (scientific calculations, when performance matters)</li>
              <li><strong>SERIAL:</strong> Auto-incrementing primary keys</li>
              <li><strong>MONEY:</strong> Currency (though NUMERIC is often preferred for portability)</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

