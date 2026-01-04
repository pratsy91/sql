import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Common Interview Questions - Interview Cheatsheet',
  description: 'Common PostgreSQL and SQL interview questions with answers',
};

export default function CommonInterviewQuestions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Common Interview Questions - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SQL Fundamentals Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q1: What is the difference between DELETE, TRUNCATE, and DROP?</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Operation</th>
                  <th className="text-left p-2">What it does</th>
                  <th className="text-left p-2">Rollback</th>
                  <th className="text-left p-2">WHERE clause</th>
                  <th className="text-left p-2">Speed</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2"><strong>DELETE</strong></td>
                  <td className="p-2">Removes rows</td>
                  <td className="p-2">Yes</td>
                  <td className="p-2">Yes</td>
                  <td className="p-2">Slow</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2"><strong>TRUNCATE</strong></td>
                  <td className="p-2">Removes all rows</td>
                  <td className="p-2">In transaction: Yes</td>
                  <td className="p-2">No</td>
                  <td className="p-2">Very Fast</td>
                </tr>
                <tr>
                  <td className="p-2"><strong>DROP</strong></td>
                  <td className="p-2">Removes table structure</td>
                  <td className="p-2">No</td>
                  <td className="p-2">N/A</td>
                  <td className="p-2">Fast</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q2: Explain the difference between WHERE and HAVING</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>WHERE:</strong> Filters rows BEFORE grouping (can't use aggregate functions)</li>
              <li><strong>HAVING:</strong> Filters groups AFTER grouping (can use aggregate functions)</li>
              <li><strong>Execution order:</strong> WHERE → GROUP BY → HAVING → SELECT</li>
            </ul>
            <CodeBlock
              title="WHERE vs HAVING Example"
              language="sql"
              code={`-- WHERE: Filter individual rows before grouping
SELECT department, AVG(salary) AS avg_salary
FROM employees
WHERE hire_date > '2020-01-01'  -- Filters rows first
GROUP BY department;

-- HAVING: Filter groups after grouping
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 50000;  -- Filters groups`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q3: What is the difference between UNION and UNION ALL?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>UNION:</strong> Combines results and removes duplicates (slower, needs sorting)</li>
              <li><strong>UNION ALL:</strong> Combines results keeping all duplicates (faster, no sorting)</li>
            </ul>
            <CodeBlock
              title="UNION vs UNION ALL"
              language="sql"
              code={`-- UNION: Removes duplicates
SELECT name FROM table1
UNION
SELECT name FROM table2;
-- If 'John' appears in both, only one 'John' in result

-- UNION ALL: Keeps duplicates
SELECT name FROM table1
UNION ALL
SELECT name FROM table2;
-- If 'John' appears in both, two 'John' in result`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q4: Explain INNER JOIN vs LEFT JOIN vs RIGHT JOIN vs FULL OUTER JOIN</h3>
            <CodeBlock
              title="JOIN Types Visualized"
              language="sql"
              code={`-- INNER JOIN: Only matching rows from both tables
SELECT * FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- Result: Only users who have orders AND only orders with valid users

-- LEFT JOIN: All rows from left table + matching from right
SELECT * FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Result: All users (even without orders) + matching orders (NULL if no order)

-- RIGHT JOIN: All rows from right table + matching from left
SELECT * FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
-- Result: All orders (even without users) + matching users (NULL if no user)

-- FULL OUTER JOIN: All rows from both tables
SELECT * FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
-- Result: All users + all orders (NULLs where no match)`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Database Design Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q5: What is Normalization and why is it important?</h3>
            <p className="text-sm mb-2">
              Normalization is organizing database to reduce redundancy and dependency. Normal forms:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>1NF:</strong> Atomic values, no repeating groups</li>
              <li><strong>2NF:</strong> 1NF + no partial dependencies</li>
              <li><strong>3NF:</strong> 2NF + no transitive dependencies</li>
              <li><strong>BCNF:</strong> 3NF + every determinant is a candidate key</li>
            </ul>
            <p className="text-sm mt-2"><strong>Benefits:</strong> Reduces redundancy, prevents update anomalies, saves storage, improves data integrity</p>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q6: When would you denormalize a database?</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Performance:</strong> Read-heavy workloads, reduce JOINs</li>
              <li><strong>Reporting:</strong> Data warehousing, star schemas</li>
              <li><strong>Aggregations:</strong> Pre-computed summary tables</li>
              <li><strong>Trade-off:</strong> Accept redundancy for faster queries, must maintain consistency</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q7: Explain Primary Key vs Foreign Key vs Unique Key</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Primary Key:</strong> Unique identifier for row, NOT NULL, only one per table, creates clustered index</li>
              <li><strong>Foreign Key:</strong> References primary key in another table, enforces referential integrity, allows NULLs</li>
              <li><strong>Unique Key:</strong> Ensures uniqueness, allows NULLs, can have multiple per table, creates non-clustered index</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance & Optimization Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q8: How do you optimize a slow query?</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>Use EXPLAIN ANALYZE to see execution plan</li>
              <li>Identify sequential scans on large tables</li>
              <li>Check for missing indexes on WHERE/JOIN columns</li>
              <li>Update statistics with ANALYZE</li>
              <li>Rewrite query (JOINs vs subqueries, avoid SELECT *)</li>
              <li>Consider partitioning for very large tables</li>
              <li>Use covering indexes for index-only scans</li>
              <li>Check for N+1 query problems</li>
            </ol>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q9: When should you create an index?</h3>
            <p className="text-sm mb-2"><strong>Create indexes for:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Primary keys and foreign keys (usually automatic)</li>
              <li>Columns used frequently in WHERE clauses</li>
              <li>Columns used in JOIN conditions</li>
              <li>Columns used in ORDER BY</li>
              <li>Columns used in GROUP BY</li>
            </ul>
            <p className="text-sm mt-2"><strong>Don't create indexes for:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Small tables (sequential scan faster)</li>
              <li>Low cardinality columns (few unique values)</li>
              <li>Write-heavy tables (indexes slow down INSERT/UPDATE/DELETE)</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q10: Explain the N+1 query problem</h3>
            <p className="text-sm mb-2">
              Problem: Execute 1 query to get N records, then execute N additional queries (one per record).
            </p>
            <CodeBlock
              title="N+1 Problem and Solution"
              language="sql"
              code={`-- BAD: N+1 queries
-- Query 1: Get all users
SELECT * FROM users;  -- Returns 100 users

-- Then for each user (100 queries!):
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 2;
-- ... 100 more queries

-- GOOD: Single query with JOIN
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Single query gets all data`}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">PostgreSQL-Specific Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q11: What is MVCC and how does PostgreSQL use it?</h3>
            <p className="text-sm mb-2">
              MVCC (Multi-Version Concurrency Control) maintains multiple versions of rows. Each transaction 
              sees a snapshot of the database. Benefits:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Readers don't block writers</li>
              <li>Writers don't block readers</li>
              <li>Better concurrency than locking-based systems</li>
              <li>Each row has xmin (creation xid) and xmax (deletion xid)</li>
              <li>Old versions cleaned up by VACUUM</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q12: Explain JSON vs JSONB in PostgreSQL</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-left p-2">JSON</th>
                  <th className="text-left p-2">JSONB</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Storage</td>
                  <td className="p-2">Text (exact copy)</td>
                  <td className="p-2">Binary (parsed)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Query Speed</td>
                  <td className="p-2">Slower (parses each time)</td>
                  <td className="p-2">Faster (pre-parsed)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Indexing</td>
                  <td className="p-2">Limited</td>
                  <td className="p-2">Full GIN support</td>
                </tr>
                <tr>
                  <td className="p-2">Use Case</td>
                  <td className="p-2">Exact formatting needed</td>
                  <td className="p-2">Querying/indexing (recommended)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q13: What are the ACID isolation levels in PostgreSQL?</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li><strong>READ UNCOMMITTED:</strong> Not actually supported (treated as READ COMMITTED)</li>
              <li><strong>READ COMMITTED:</strong> Default, prevents dirty reads</li>
              <li><strong>REPEATABLE READ:</strong> Prevents non-repeatable reads</li>
              <li><strong>SERIALIZABLE:</strong> Highest isolation, prevents all anomalies</li>
            </ol>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q14: How does PostgreSQL handle deadlocks?</h3>
            <p className="text-sm mb-2">
              PostgreSQL automatically detects deadlocks and aborts one of the transactions. Deadlock detector 
              runs periodically and cancels the transaction that has done the least work.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Prevent by acquiring locks in consistent order</li>
              <li>Keep transactions short</li>
              <li>Application should retry on deadlock errors</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Coding Problems</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q15: Find the second highest salary</h3>
            <CodeBlock
              title="Multiple Solutions"
              language="sql"
              code={`-- Method 1: Subquery with MAX
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Method 2: ORDER BY with LIMIT
SELECT salary AS second_highest
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Method 3: DENSE_RANK (handles ties)
SELECT salary AS second_highest
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 2;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q16: Find duplicate emails</h3>
            <CodeBlock
              title="Finding Duplicates"
              language="sql"
              code={`-- Method 1: GROUP BY with HAVING
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Method 2: Window function
SELECT email, COUNT(*) OVER (PARTITION BY email) AS count
FROM users
HAVING COUNT(*) OVER (PARTITION BY email) > 1;

-- Method 3: Self JOIN
SELECT DISTINCT u1.email
FROM users u1
JOIN users u2 ON u1.email = u2.email AND u1.id != u2.id;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q17: Get employees earning more than their managers</h3>
            <CodeBlock
              title="Self JOIN Problem"
              language="sql"
              code={`SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager, m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q18: Find customers who never placed an order</h3>
            <CodeBlock
              title="Multiple Solutions"
              language="sql"
              code={`-- Method 1: LEFT JOIN with NULL check
SELECT c.*
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;

-- Method 2: NOT IN (watch out for NULLs!)
SELECT *
FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);

-- Method 3: NOT EXISTS (recommended)
SELECT *
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q19: Get department with highest average salary</h3>
            <CodeBlock
              title="Aggregation with Subquery"
              language="sql"
              code={`-- Method 1: Subquery
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) = (
  SELECT MAX(avg_sal) 
  FROM (SELECT AVG(salary) AS avg_sal FROM employees GROUP BY department) dept_avg
);

-- Method 2: ORDER BY with LIMIT
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC
LIMIT 1;

-- Method 3: Window function
SELECT department, avg_salary
FROM (
  SELECT department, AVG(salary) AS avg_salary,
         MAX(AVG(salary)) OVER () AS max_avg_salary
  FROM employees
  GROUP BY department
) dept_stats
WHERE avg_salary = max_avg_salary;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q20: Get running total of sales</h3>
            <CodeBlock
              title="Window Function"
              language="sql"
              code={`SELECT 
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) AS running_total
FROM sales
ORDER BY date;

-- With partition
SELECT 
  date,
  region,
  amount,
  SUM(amount) OVER (PARTITION BY region ORDER BY date) AS running_total
FROM sales
ORDER BY region, date;`}
            />
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

