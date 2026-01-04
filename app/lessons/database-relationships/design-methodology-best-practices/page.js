import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Design Methodology & Best Practices - Database Relationships',
  description: 'Step-by-step methodology for designing database schemas with relationships',
};

export default function DesignMethodologyBestPractices() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Design Methodology & Best Practices</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Step-by-Step Design Methodology</h2>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 1: Identify Entities</h3>
            <p className="text-sm mb-2">
              List all the "things" or concepts in your domain. Each entity typically becomes a table.
            </p>
            <CodeBlock
              title="Example: E-Commerce Entities"
              language="text"
              code={`Entities for e-commerce:
- User
- Product
- Order
- Category
- Address
- Payment
- Review`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 2: Identify Attributes</h3>
            <p className="text-sm mb-2">
              For each entity, list its properties. These become columns in the table.
            </p>
            <CodeBlock
              title="Example: User Entity Attributes"
              language="text"
              code={`User entity attributes:
- id (primary key)
- email
- password_hash
- first_name
- last_name
- created_at`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 3: Identify Relationships</h3>
            <p className="text-sm mb-2">
              Determine how entities relate to each other. Ask:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Can one entity relate to many of another?</li>
              <li>Can the reverse be true?</li>
            </ul>
            <CodeBlock
              title="Example: E-Commerce Relationships"
              language="text"
              code={`Relationships:
- User → Order (1 user can have many orders = 1:N)
- Order → OrderItem (1 order can have many items = 1:N)
- Product → OrderItem (1 product can be in many orders = 1:N, via OrderItem)
- Product ↔ Category (many products, many categories = M:N? No, 1 product = 1 category = 1:N)
- Product ↔ Tag (1 product can have many tags, 1 tag can be on many products = M:N)`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 4: Determine Relationship Types</h3>
            <p className="text-sm mb-2">
              Classify each relationship as 1:1, 1:N, or M:N.
            </p>
            <CodeBlock
              title="Relationship Classification"
              language="text"
              code={`1:1 Relationships:
- User ↔ UserProfile (1 user = 1 profile)

1:N Relationships:
- User → Order (foreign key on Order table)
- Category → Product (foreign key on Product table)
- Order → OrderItem (foreign key on OrderItem table)

M:N Relationships:
- Product ↔ Tag (requires junction table: product_tags)
- User ↔ User (follows, requires junction table: user_follows)
- Order ↔ Product (via OrderItem - already a junction table with attributes!)`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 5: Implement Relationships</h3>
            <p className="text-sm mb-2">Add foreign keys based on relationship type:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>1:1:</strong> Foreign key with UNIQUE constraint on one side</li>
              <li><strong>1:N:</strong> Foreign key on the "many" side</li>
              <li><strong>M:N:</strong> Create junction table with two foreign keys</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 6: Choose Cascade Options</h3>
            <p className="text-sm mb-2">For each foreign key, decide ON DELETE/ON UPDATE behavior.</p>
            <CodeBlock
              title="Cascade Decision Examples"
              language="sql"
              code={`-- Order items should be deleted when order is deleted
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE

-- Products should NOT be deleted if they have orders
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT

-- Category can be deleted, product becomes uncategorized
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL`}
            />
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 7: Add Indexes</h3>
            <p className="text-sm mb-2">Create indexes on all foreign key columns for performance.</p>
          </div>

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Step 8: Add Constraints</h3>
            <p className="text-sm mb-2">Add CHECK constraints, UNIQUE constraints, and NOT NULL as needed.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          
          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. Always Index Foreign Keys</h3>
            <CodeBlock
              title="Index Foreign Keys"
              language="sql"
              code={`-- PostgreSQL doesn't automatically index foreign keys
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Use Meaningful Foreign Key Names</h3>
            <CodeBlock
              title="Good vs Bad Naming"
              language="sql"
              code={`-- Good: Descriptive names
CREATE TABLE orders (
  user_id INT NOT NULL,  -- Clear: references users table
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bad: Unclear names
CREATE TABLE orders (
  uid INT NOT NULL,  -- What does this reference?
  FOREIGN KEY (uid) REFERENCES users(id)
);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Use Named Constraints</h3>
            <CodeBlock
              title="Named vs Unnamed Constraints"
              language="sql"
              code={`-- Good: Named constraint (easier to drop/modify)
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Can drop easily:
ALTER TABLE orders DROP CONSTRAINT fk_orders_user_id;

-- Bad: Unnamed constraint (harder to manage)
ALTER TABLE orders
ADD FOREIGN KEY (user_id) REFERENCES users(id);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">4. Choose Appropriate Cascade Options</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>CASCADE:</strong> Only when child has no meaning without parent</li>
              <li><strong>RESTRICT:</strong> Default for most cases - prevents accidental data loss</li>
              <li><strong>SET NULL:</strong> When relationship is optional</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">5. Consider Optional vs Required Relationships</h3>
            <CodeBlock
              title="Optional vs Required"
              language="sql"
              code={`-- Required relationship (NOT NULL)
CREATE TABLE orders (
  user_id INT NOT NULL,  -- Every order MUST have a user
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Optional relationship (NULL allowed)
CREATE TABLE products (
  category_id INT,  -- Product can exist without category
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">6. Avoid Circular Dependencies</h3>
            <CodeBlock
              title="Circular Dependency Problem"
              language="sql"
              code={`-- BAD: Circular dependency
CREATE TABLE table_a (
  id SERIAL PRIMARY KEY,
  b_id INT NOT NULL,
  FOREIGN KEY (b_id) REFERENCES table_b(id)
);

CREATE TABLE table_b (
  id SERIAL PRIMARY KEY,
  a_id INT NOT NULL,
  FOREIGN KEY (a_id) REFERENCES table_a(id)
);
-- Problem: Can't insert into either table!

-- SOLUTION: Use junction table or make one relationship optional
CREATE TABLE table_a (
  id SERIAL PRIMARY KEY
);

CREATE TABLE table_b (
  id SERIAL PRIMARY KEY
);

CREATE TABLE a_b_relationship (
  a_id INT NOT NULL,
  b_id INT NOT NULL,
  PRIMARY KEY (a_id, b_id),
  FOREIGN KEY (a_id) REFERENCES table_a(id),
  FOREIGN KEY (b_id) REFERENCES table_b(id)
);`}
            />
          </div>

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">7. Use Composite Primary Keys in Junction Tables</h3>
            <CodeBlock
              title="Junction Table Best Practice"
              language="sql"
              code={`-- Good: Composite primary key prevents duplicates
CREATE TABLE product_tags (
  product_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (product_id, tag_id),  -- Prevents duplicate pairs
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- Also consider adding unique constraints if needed
CREATE UNIQUE INDEX idx_product_tags_unique ON product_tags(product_id, tag_id);
-- (But PRIMARY KEY already enforces this)`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Pitfalls to Avoid</h2>
          
          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">1. Foreign Key on Wrong Side</h3>
            <p className="text-sm mb-2">
              <strong>Mistake:</strong> Putting foreign key on "one" side instead of "many" side in 1:N relationship.
            </p>
            <CodeBlock
              title="Wrong vs Right"
              language="sql"
              code={`-- WRONG: Foreign key on "one" side (users table)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  order_id INT,  -- WRONG! User can have many orders
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- RIGHT: Foreign key on "many" side (orders table)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,  -- CORRECT!
  FOREIGN KEY (user_id) REFERENCES users(id)
);`}
            />
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">2. Forgetting Junction Table for M:N</h3>
            <p className="text-sm mb-2">
              <strong>Mistake:</strong> Trying to put foreign keys directly in both tables.
            </p>
            <CodeBlock
              title="Wrong Approach"
              language="sql"
              code={`-- WRONG: Can't do this for M:N
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tag_id INT,  -- Product can have MANY tags, not just one!
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- RIGHT: Use junction table
CREATE TABLE product_tags (
  product_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);`}
            />
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">3. Missing Indexes on Foreign Keys</h3>
            <p className="text-sm mb-2">
              Foreign keys are not automatically indexed. Always create indexes manually.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">4. Using CASCADE When You Should Use RESTRICT</h3>
            <p className="text-sm mb-2">
              CASCADE can cause accidental data loss. Use RESTRICT unless you're certain CASCADE is appropriate.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">5. Over-normalizing (Splitting 1:1 Unnecessarily)</h3>
            <p className="text-sm mb-2">
              Don't split tables into 1:1 relationships unless there's a good reason (performance, optional data, etc.).
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Design Checklist</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Before Finalizing Your Schema:</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>✓ All entities are identified and have appropriate tables</li>
              <li>✓ All relationships are identified and correctly classified (1:1, 1:N, M:N)</li>
              <li>✓ Foreign keys are on the correct side</li>
              <li>✓ M:N relationships have junction tables</li>
              <li>✓ All foreign keys have appropriate cascade options</li>
              <li>✓ All foreign keys are indexed</li>
              <li>✓ Primary keys are defined for all tables</li>
              <li>✓ Appropriate constraints are in place (NOT NULL, UNIQUE, CHECK)</li>
              <li>✓ No circular dependencies</li>
              <li>✓ Relationships are clearly named and documented</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

