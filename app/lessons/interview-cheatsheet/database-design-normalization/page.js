import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Database Design & Normalization - Interview Cheatsheet',
  description: 'Database design principles and normalization for interviews',
};

export default function DatabaseDesignNormalization() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Database Design & Normalization - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Database Design Principles</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">ACID Properties</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Atomicity:</strong> All operations in a transaction succeed or all fail</li>
              <li><strong>Consistency:</strong> Database remains in valid state after transaction</li>
              <li><strong>Isolation:</strong> Concurrent transactions don't interfere with each other</li>
              <li><strong>Durability:</strong> Committed transactions persist even after system failure</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Entity Relationship Concepts</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Entity:</strong> Thing or object (e.g., User, Product, Order)</li>
              <li><strong>Attribute:</strong> Property of an entity (e.g., name, email, price)</li>
              <li><strong>Relationship:</strong> Association between entities</li>
              <li><strong>Cardinality:</strong> One-to-One, One-to-Many, Many-to-Many</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Normalization Forms</h2>
          
          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">First Normal Form (1NF)</h3>
            <p className="text-sm mb-2"><strong>Rules:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Each column must contain atomic (indivisible) values</li>
              <li>No repeating groups or arrays</li>
              <li>Each row must be unique</li>
            </ul>
            <CodeBlock
              title="Violates 1NF (Has arrays)"
              language="sql"
              code={`-- BAD: Hobbies stored as comma-separated values
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  hobbies VARCHAR(200)  -- "reading, swimming, coding"
);

-- GOOD: Separate table
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE user_hobbies (
  user_id INT REFERENCES users(id),
  hobby VARCHAR(50)
);`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Second Normal Form (2NF)</h3>
            <p className="text-sm mb-2"><strong>Rules:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Must be in 1NF</li>
              <li>All non-key attributes must fully depend on the primary key</li>
              <li>No partial dependencies</li>
            </ul>
            <CodeBlock
              title="Violates 2NF (Partial Dependency)"
              language="sql"
              code={`-- BAD: Course_name depends only on course_id, not (student_id, course_id)
CREATE TABLE enrollments (
  student_id INT,
  course_id INT,
  course_name VARCHAR(100),  -- Depends only on course_id
  grade CHAR(1),
  PRIMARY KEY (student_id, course_id)
);

-- GOOD: Separate tables
CREATE TABLE courses (
  course_id INT PRIMARY KEY,
  course_name VARCHAR(100)
);

CREATE TABLE enrollments (
  student_id INT,
  course_id INT REFERENCES courses(course_id),
  grade CHAR(1),
  PRIMARY KEY (student_id, course_id)
);`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Third Normal Form (3NF)</h3>
            <p className="text-sm mb-2"><strong>Rules:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Must be in 2NF</li>
              <li>No transitive dependencies (non-key attributes shouldn't depend on other non-key attributes)</li>
            </ul>
            <CodeBlock
              title="Violates 3NF (Transitive Dependency)"
              language="sql"
              code={`-- BAD: Zip_code determines city and state
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  zip_code VARCHAR(10),
  city VARCHAR(50),      -- Depends on zip_code, not id
  state VARCHAR(50)      -- Depends on zip_code, not id
);

-- GOOD: Separate zip_code table
CREATE TABLE zip_codes (
  zip_code VARCHAR(10) PRIMARY KEY,
  city VARCHAR(50),
  state VARCHAR(50)
);

CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  zip_code VARCHAR(10) REFERENCES zip_codes(zip_code)
);`}
            />
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Boyce-Codd Normal Form (BCNF)</h3>
            <p className="text-sm mb-2"><strong>Rules:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Must be in 3NF</li>
              <li>Every determinant must be a candidate key</li>
              <li>Stricter than 3NF</li>
            </ul>
            <CodeBlock
              title="BCNF Example"
              language="sql"
              code={`-- Example where 3NF is satisfied but BCNF is not
-- If a course can be taught by multiple instructors
-- and an instructor teaches only one course

-- BAD: instructor_id determines course_id, but instructor_id is not a key
CREATE TABLE teaching (
  student_id INT,
  course_id INT,
  instructor_id INT,  -- Determines course_id but not a key
  PRIMARY KEY (student_id, course_id)
);

-- GOOD: Separate tables
CREATE TABLE course_instructor (
  course_id INT PRIMARY KEY,
  instructor_id INT UNIQUE
);

CREATE TABLE teaching (
  student_id INT,
  course_id INT REFERENCES course_instructor(course_id),
  PRIMARY KEY (student_id, course_id)
);`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Denormalization</h2>
          <p className="mb-4">
            Sometimes we intentionally denormalize for performance. Know when and why!
          </p>
          
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">When to Denormalize</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Read-heavy workloads:</strong> Reduce JOIN operations</li>
              <li><strong>Reporting queries:</strong> Pre-compute aggregations</li>
              <li><strong>Performance critical:</strong> Accept data redundancy for speed</li>
              <li><strong>Data warehousing:</strong> Star/snowflake schemas</li>
            </ul>
          </div>

          <CodeBlock
            title="Example: Denormalized for Performance"
            language="sql"
            code={`-- Normalized: Requires JOIN
SELECT o.id, o.total, u.name, u.email
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Denormalized: Faster reads, but must maintain consistency
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  user_name VARCHAR(100),    -- Denormalized
  user_email VARCHAR(100),   -- Denormalized
  total DECIMAL(10,2)
);

-- Trade-off: Must update order when user changes name/email`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Indexing Strategy</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Primary Key Index</h3>
            <p className="text-sm">Automatically created, unique, clustered (in most DBs)</p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">When to Create Indexes</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Foreign key columns (often automatic)</li>
              <li>Columns used in WHERE clauses frequently</li>
              <li>Columns used in JOIN conditions</li>
              <li>Columns used for sorting (ORDER BY)</li>
              <li>Columns used for grouping (GROUP BY)</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">When NOT to Create Indexes</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Small tables (sequential scan faster)</li>
              <li>Columns with low cardinality (few unique values)</li>
              <li>Write-heavy tables (indexes slow down INSERT/UPDATE/DELETE)</li>
              <li>Columns rarely used in queries</li>
            </ul>
          </div>

          <CodeBlock
            title="Composite Index Order Matters!"
            language="sql"
            code={`-- Query: WHERE category_id = 1 AND status = 'active'
-- GOOD: Index on (category_id, status)
CREATE INDEX idx_category_status ON products(category_id, status);

-- BAD: Index on (status, category_id) - can't use efficiently
CREATE INDEX idx_status_category ON products(status, category_id);

-- Rule: Put most selective column first, or columns used together
-- PostgreSQL can use index for: (category_id), (category_id, status)
-- But NOT efficiently for: (status) alone`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Explain Normalization</h3>
            <p className="text-sm mb-2">
              Normalization is the process of organizing data to reduce redundancy and improve data integrity. 
              It involves dividing tables and establishing relationships. The main goals are:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Eliminate data redundancy</li>
              <li>Prevent update anomalies (insert, update, delete)</li>
              <li>Ensure data integrity</li>
              <li>Reduce storage space</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Normalization vs Denormalization Trade-offs</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Aspect</th>
                  <th className="text-left p-2">Normalized</th>
                  <th className="text-left p-2">Denormalized</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Data Redundancy</td>
                  <td className="p-2">Low</td>
                  <td className="p-2">High</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Storage</td>
                  <td className="p-2">Less</td>
                  <td className="p-2">More</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Query Performance</td>
                  <td className="p-2">Slower (JOINs)</td>
                  <td className="p-2">Faster (no JOINs)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Update Performance</td>
                  <td className="p-2">Faster (one place)</td>
                  <td className="p-2">Slower (multiple places)</td>
                </tr>
                <tr>
                  <td className="p-2">Data Integrity</td>
                  <td className="p-2">Better</td>
                  <td className="p-2">Must maintain manually</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is a Surrogate Key vs Natural Key?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Natural Key:</strong> Business-meaningful identifier (e.g., email, SSN, product_code)</li>
              <li><strong>Surrogate Key:</strong> System-generated identifier with no business meaning (e.g., auto-increment ID, UUID)</li>
            </ul>
            <p className="text-sm mt-2"><strong>Trade-offs:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Natural keys: Can change, composite keys possible</li>
              <li>Surrogate keys: Stable, simpler foreign keys, no business meaning</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How do you handle Many-to-Many relationships?</h3>
            <CodeBlock
              title="Many-to-Many Relationship Pattern"
              language="sql"
              code={`-- Use junction/bridge table
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(100)
);

CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  enrolled_at TIMESTAMP,
  PRIMARY KEY (student_id, course_id)
);

-- Query students taking a course
SELECT s.* 
FROM students s
JOIN enrollments e ON s.id = e.student_id
WHERE e.course_id = 1;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: What is Database Sharding?</h3>
            <p className="text-sm mb-2">
              Sharding is horizontal partitioning where data is distributed across multiple databases/servers 
              based on a shard key. Each shard contains a subset of data.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Range Sharding:</strong> Data partitioned by range (e.g., user_id 1-1000 in shard1)</li>
              <li><strong>Hash Sharding:</strong> Data partitioned by hash function (e.g., hash(user_id) % num_shards)</li>
              <li><strong>Directory Sharding:</strong> Lookup table maps keys to shards</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

