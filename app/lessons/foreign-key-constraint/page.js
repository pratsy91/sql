import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'FOREIGN KEY Constraint - PostgreSQL Learning',
  description: 'Learn about FOREIGN KEY constraints including referential integrity, ON DELETE/UPDATE actions, and deferrable constraints',
};

export default function ForeignKeyConstraint() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">FOREIGN KEY Constraint</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Foreign Key</h2>

          <CodeBlock
            title="SQL: Basic Foreign Key"
            language="sql"
            code={`-- Create parent table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Create child table with FOREIGN KEY
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Insert parent first
INSERT INTO categories (name) VALUES ('Electronics');
INSERT INTO categories (name) VALUES ('Clothing');

-- Insert child with valid foreign key
INSERT INTO products (name, category_id) VALUES ('Laptop', 1);
INSERT INTO products (name, category_id) VALUES ('T-Shirt', 2);

-- Insert with invalid foreign key (will fail)
INSERT INTO products (name, category_id) VALUES ('Invalid Product', 999);
-- Error: insert or update on table "products" violates foreign key constraint`}
          />
          <CodeBlock
            title="Prisma: Foreign Key"
            language="prisma"
            code={`// schema.prisma
model Category {
  id       Int       @id @default(autoincrement())
  name     String    @db.VarChar(100)
  products Product[]
  
  @@map("categories")
}

model Product {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(200)
  categoryId Int      @map("category_id")
  category   Category @relation(fields: [categoryId], references: [id])
  
  @@map("products")
}

// Usage
const category = await prisma.category.create({
  data: {
    name: 'Electronics',
  },
});

const product = await prisma.product.create({
  data: {
    name: 'Laptop',
    categoryId: category.id,
  },
});

// Prisma handles foreign key relationships automatically`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ON DELETE Actions</h2>

          <CodeBlock
            title="SQL: ON DELETE Actions"
            language="sql"
            code={`-- ON DELETE RESTRICT (default) - prevents deletion if referenced
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  total DECIMAL(10, 2),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ON DELETE CASCADE - deletes child records when parent is deleted
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ON DELETE SET NULL - sets foreign key to NULL when parent is deleted
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ON DELETE SET DEFAULT - sets foreign key to default value
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 0,
  setting_key VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET DEFAULT
);

-- ON DELETE NO ACTION - same as RESTRICT but checked at end of transaction
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE NO ACTION
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ON UPDATE Actions</h2>

          <CodeBlock
            title="SQL: ON UPDATE Actions"
            language="sql"
            code={`-- ON UPDATE CASCADE - updates foreign key when parent key changes
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE CASCADE
);

-- ON UPDATE RESTRICT - prevents update if referenced
CREATE TABLE user_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE RESTRICT
);

-- ON UPDATE SET NULL - sets foreign key to NULL when parent key changes
CREATE TABLE user_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE SET NULL
);

-- Combined ON DELETE and ON UPDATE
CREATE TABLE order_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  status VARCHAR(20),
  FOREIGN KEY (order_id) REFERENCES orders(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Deferrable Constraints</h2>

          <CodeBlock
            title="SQL: Deferrable Constraints"
            language="sql"
            code={`-- DEFERRABLE INITIALLY DEFERRED - checked at end of transaction
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Allows inserting in any order within a transaction
BEGIN;
INSERT INTO orders (user_id) VALUES (999);  -- OK (deferred)
INSERT INTO users (id, username, email) VALUES (999, 'newuser', 'new@example.com');
COMMIT;  -- Constraint checked here

-- DEFERRABLE INITIALLY IMMEDIATE - checked immediately but can be deferred
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id)
    DEFERRABLE INITIALLY IMMEDIATE
);

-- Defer constraint check
BEGIN;
SET CONSTRAINTS products_category_id_fkey DEFERRED;
INSERT INTO products (category_id) VALUES (999);
INSERT INTO categories (id, name) VALUES (999, 'New Category');
COMMIT;

-- NOT DEFERRABLE (default) - always checked immediately
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) NOT DEFERRABLE
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Composite Foreign Keys</h2>

          <CodeBlock
            title="SQL: Composite Foreign Keys"
            language="sql"
            code={`-- Parent table with composite primary key
CREATE TABLE order_items (
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

-- Child table referencing composite key
CREATE TABLE order_item_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  note TEXT,
  FOREIGN KEY (order_id, product_id) REFERENCES order_items(order_id, product_id)
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>ON DELETE CASCADE</strong> for dependent data (order items when order deleted)</li>
              <li><strong>ON DELETE RESTRICT</strong> to prevent accidental deletions</li>
              <li><strong>ON DELETE SET NULL</strong> for optional relationships</li>
              <li><strong>Index foreign keys</strong> for better join performance</li>
              <li><strong>Use DEFERRABLE</strong> when you need to insert in any order</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

