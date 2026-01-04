import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Foreign Keys & Cascade Options - Database Relationships',
  description: 'Learn about foreign keys, cascade options, and referential integrity',
};

export default function ForeignKeysCascadeOptions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Foreign Keys & Cascade Options</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is a Foreign Key?</h2>
          <p className="mb-4">
            A foreign key is a column (or set of columns) in one table that references the primary key 
            (or unique key) of another table. It enforces referential integrity by ensuring that values 
            in the foreign key column must exist in the referenced table.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Foreign Key Syntax</h2>
          
          <CodeBlock
            title="Creating Foreign Keys"
            language="sql"
            code={`-- Method 1: Inline during table creation
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Method 2: Separate ALTER TABLE statement
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT NOW()
);

ALTER TABLE orders
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Method 3: Named constraint inline
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ON DELETE Cascade Options</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">What Happens When Parent Row is Deleted?</h3>
            <p className="text-sm mb-2">
              When you try to delete a row that is referenced by foreign keys, PostgreSQL needs to know 
              what to do with the child rows (rows that reference it).
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">1. RESTRICT / NO ACTION (Default)</h3>
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2">
              <strong>Behavior:</strong> Prevents deletion of parent row if child rows exist. 
              Transaction will fail with an error.
            </p>
          </div>
          <CodeBlock
            title="RESTRICT Example"
            language="sql"
            code={`CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  -- or: ON DELETE NO ACTION (same thing)
);

-- If you try to delete a category that has products:
DELETE FROM categories WHERE id = 1;
-- ERROR: update or delete on table "categories" violates foreign key constraint

-- RESTRICT is the default if you don't specify ON DELETE`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">2. CASCADE</h3>
          <div className="bg-orange-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2">
              <strong>Behavior:</strong> When parent row is deleted, automatically delete all child rows.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Warning:</strong> Can cause cascading deletes! Use carefully.
            </p>
          </div>
          <CodeBlock
            title="CASCADE Example"
            language="sql"
            code={`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- When you delete a user:
DELETE FROM users WHERE id = 1;
-- Automatically deletes:
-- 1. All orders for that user (because of CASCADE)
-- 2. All order_items for those orders (because of CASCADE)

-- Use CASCADE when:
-- - Child data has no meaning without parent (e.g., order_items without order)
-- - You want automatic cleanup`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">3. SET NULL</h3>
          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2">
              <strong>Behavior:</strong> When parent row is deleted, set foreign key column to NULL in child rows.
            </p>
            <p className="text-sm">
              <strong>Requirement:</strong> Foreign key column must allow NULL values.
            </p>
          </div>
          <CodeBlock
            title="SET NULL Example"
            language="sql"
            code={`CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT,  -- Must allow NULL!
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Insert product with category
INSERT INTO products (category_id, name) VALUES (1, 'Laptop');

-- Delete the category
DELETE FROM categories WHERE id = 1;

-- Product now has category_id = NULL
SELECT * FROM products;
-- id | category_id | name
-- 1  | NULL       | Laptop

-- Use SET NULL when:
-- - Child data can exist without parent (orphaned records are valid)
-- - You want to preserve historical data but remove the relationship`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">4. SET DEFAULT</h3>
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2">
              <strong>Behavior:</strong> When parent row is deleted, set foreign key column to its default value.
            </p>
          </div>
          <CodeBlock
            title="SET DEFAULT Example"
            language="sql"
            code={`CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT DEFAULT 0,  -- Must have default value
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET DEFAULT
);

-- Use SET DEFAULT when:
-- - You have a default/fallback category (e.g., "Uncategorized")
-- - Less common than CASCADE or SET NULL`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ON UPDATE Cascade Options</h2>
          <p className="mb-4">
            Similar to ON DELETE, but controls what happens when the primary key of the parent row is updated.
          </p>
          
          <CodeBlock
            title="ON UPDATE Options"
            language="sql"
            code={`-- CASCADE: Update foreign key when parent key changes
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE  -- If user.id changes, update orders.user_id
);

-- RESTRICT: Prevent updating parent key if child rows exist
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) 
    ON UPDATE RESTRICT  -- Can't change category.id if products reference it
);

-- Note: ON UPDATE is less common because:
-- - Primary keys (especially SERIAL/IDENTITY) rarely change
-- - Updating primary keys is generally not recommended`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Choosing the Right Cascade Option</h2>
          
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Cascade Option</th>
                <th className="text-left p-2">Use When</th>
                <th className="text-left p-2">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2"><strong>RESTRICT</strong></td>
                <td className="p-2">Child data is important and shouldn't be deleted</td>
                <td className="p-2">Categories with products (prevent deleting category if products exist)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2"><strong>CASCADE</strong></td>
                <td className="p-2">Child data has no meaning without parent</td>
                <td className="p-2">Orders → Order Items (delete order items when order is deleted)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2"><strong>SET NULL</strong></td>
                <td className="p-2">Child data can exist independently</td>
                <td className="p-2">Products → Category (product can exist without category)</td>
              </tr>
              <tr>
                <td className="p-2"><strong>SET DEFAULT</strong></td>
                <td className="p-2">Have a default/fallback value</td>
                <td className="p-2">Products → Category (set to "Uncategorized" category)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Composite Foreign Keys</h2>
          <p className="mb-4">
            Foreign keys can reference composite primary keys (multiple columns).
          </p>
          
          <CodeBlock
            title="Composite Foreign Key Example"
            language="sql"
            code={`-- Parent table with composite primary key
CREATE TABLE order_items (
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

-- Child table referencing composite key
CREATE TABLE order_item_notes (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  note_text TEXT,
  FOREIGN KEY (order_id, product_id) 
    REFERENCES order_items(order_id, product_id) 
    ON DELETE CASCADE
);

-- Both columns together form the foreign key`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indexing Foreign Keys</h2>
          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2">
              <strong>Best Practice:</strong> Always create indexes on foreign key columns! 
              PostgreSQL doesn't create them automatically (unlike primary keys).
            </p>
          </div>
          
          <CodeBlock
            title="Indexing Foreign Keys"
            language="sql"
            code={`CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT NOW()
);

-- Create foreign key
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Create index on foreign key (IMPORTANT!)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Why index foreign keys?
-- 1. Faster JOINs: SELECT * FROM users u JOIN orders o ON u.id = o.user_id
-- 2. Faster CASCADE operations: When deleting parent, finding child rows is faster
-- 3. Faster constraint checking: Validating foreign key references`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Optional vs Required Relationships</h2>
          
          <CodeBlock
            title="Required Relationship (NOT NULL)"
            language="sql"
            code={`-- Product MUST have a category
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,  -- NOT NULL = required
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);`}
          />

          <CodeBlock
            title="Optional Relationship (NULL allowed)"
            language="sql"
            code={`-- Product CAN exist without a category
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT,  -- NULL allowed = optional
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Query to find products without category:
SELECT * FROM products WHERE category_id IS NULL;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Managing Foreign Keys</h2>
          
          <CodeBlock
            title="Foreign Key Management Commands"
            language="sql"
            code={`-- List all foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Drop foreign key constraint
ALTER TABLE orders 
DROP CONSTRAINT fk_orders_user_id;

-- Disable foreign key temporarily (PostgreSQL doesn't support this directly)
-- Instead, drop and recreate, or use a transaction`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Mistakes to Avoid</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. Forgetting to Index Foreign Keys</h3>
            <p className="text-sm">Always create indexes on foreign key columns for performance.</p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Using Wrong Cascade Option</h3>
            <p className="text-sm">
              Using CASCADE when you should use RESTRICT can lead to accidental data loss.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Circular Dependencies</h3>
            <p className="text-sm">
              Table A references Table B, Table B references Table A - creates problems.
              Use junction tables or rethink the design.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">4. Orphaned Records</h3>
            <p className="text-sm">
              Records with foreign keys pointing to non-existent parent rows. 
              Foreign keys prevent this, but be careful when disabling constraints.
            </p>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

