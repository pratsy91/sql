import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CHECK Constraint - PostgreSQL Learning',
  description: 'Learn about CHECK constraints in PostgreSQL including column-level, table-level, and complex expressions',
};

export default function CheckConstraint() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CHECK Constraint</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Column-Level CHECK</h2>

          <CodeBlock
            title="SQL: Column-Level CHECK"
            language="sql"
            code={`-- Create table with column-level CHECK constraints
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) CHECK (price > 0),
  stock INTEGER CHECK (stock >= 0),
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Insert valid data
INSERT INTO products (name, price, stock, discount_percent)
VALUES ('Laptop', 999.99, 10, 15);

-- Insert invalid data (will fail)
INSERT INTO products (name, price, stock, discount_percent)
VALUES ('Phone', -100, 5, 20);
-- Error: new row for relation "products" violates check constraint "products_price_check"

INSERT INTO products (name, price, stock, discount_percent)
VALUES ('Tablet', 500, -5, 20);
-- Error: violates check constraint "products_stock_check"`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Table-Level CHECK</h2>

          <CodeBlock
            title="SQL: Table-Level CHECK"
            language="sql"
            code={`-- Table-level CHECK (can reference multiple columns)
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  room_number INTEGER NOT NULL,
  CONSTRAINT valid_dates CHECK (check_out > check_in),
  CONSTRAINT future_check_in CHECK (check_in >= CURRENT_DATE)
);

-- Valid reservation
INSERT INTO reservations (check_in, check_out, room_number)
VALUES ('2024-06-01', '2024-06-05', 101);

-- Invalid reservation (check_out before check_in)
INSERT INTO reservations (check_in, check_out, room_number)
VALUES ('2024-06-05', '2024-06-01', 102);
-- Error: violates check constraint "valid_dates"

-- Complex table-level CHECK
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  bonus DECIMAL(10, 2) DEFAULT 0,
  CONSTRAINT salary_positive CHECK (salary > 0),
  CONSTRAINT bonus_not_exceed_salary CHECK (bonus <= salary),
  CONSTRAINT valid_name CHECK (LENGTH(first_name) > 0 AND LENGTH(last_name) > 0)
);`}
          />
          <CodeBlock
            title="Prisma: CHECK Constraint"
            language="prisma"
            code={`// schema.prisma
// Prisma doesn't directly support CHECK constraints in schema
// Use raw SQL in migrations

model Product {
  id             Int      @id @default(autoincrement())
  name           String   @db.VarChar(200)
  price          Decimal  @db.Decimal(10, 2)
  stock          Int
  discountPercent Int     @map("discount_percent")
  
  @@map("products")
}

// Add CHECK constraints in migration
// In migration SQL:
// ALTER TABLE products ADD CONSTRAINT products_price_check CHECK (price > 0);
// ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);
// ALTER TABLE products ADD CONSTRAINT products_discount_check 
//   CHECK (discount_percent >= 0 AND discount_percent <= 100);

// Or use raw SQL
await prisma.$executeRaw\`
  ALTER TABLE products 
  ADD CONSTRAINT products_price_check CHECK (price > 0)
\`;

// Validate in application code as well
const product = await prisma.product.create({
  data: {
    name: 'Laptop',
    price: new Decimal('999.99'),
    stock: 10,
    discountPercent: 15,
  },
});

// Application-level validation
if (product.price <= 0) {
  throw new Error('Price must be positive');
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Complex CHECK Expressions</h2>

          <CodeBlock
            title="SQL: Complex CHECK Expressions"
            language="sql"
            code={`-- CHECK with functions
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  age INTEGER,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_age CHECK (age >= 0 AND age <= 150)
);

-- CHECK with date functions
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CONSTRAINT valid_event_dates CHECK (
    end_date >= start_date AND 
    start_date >= CURRENT_DATE
  )
);

-- CHECK with subqueries (PostgreSQL 9.2+)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled')),
  CONSTRAINT positive_total CHECK (total > 0)
);

-- CHECK with CASE expressions
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  CONSTRAINT valid_category_price CHECK (
    CASE 
      WHEN category = 'premium' THEN price >= 100
      WHEN category = 'standard' THEN price >= 10 AND price < 100
      WHEN category = 'budget' THEN price < 10
      ELSE true
    END
  )
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Adding CHECK Constraints</h2>

          <CodeBlock
            title="SQL: Adding CHECK Constraints"
            language="sql"
            code={`-- Add CHECK constraint to existing table
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0);

-- Add CHECK constraint without name (auto-generated)
ALTER TABLE products ADD CHECK (stock >= 0);

-- Add table-level CHECK
ALTER TABLE reservations 
ADD CONSTRAINT valid_dates CHECK (check_out > check_in);

-- Drop CHECK constraint
ALTER TABLE products DROP CONSTRAINT products_price_positive;

-- Disable CHECK constraint (not directly supported, must drop and recreate)
-- Or use triggers for conditional validation`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

