import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';

export const metadata = {
  title: 'Core SQL Fundamentals - Interview Cheatsheet',
  description: 'Essential SQL fundamentals for interviews',
};

export default function CoreSQLFundamentals() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Core SQL Fundamentals - Interview Cheatsheet</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SQL Command Categories</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DDL (Data Definition Language)</h3>
            <p className="text-sm mb-2">Commands that define database structure:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>CREATE:</strong> CREATE TABLE, DATABASE, INDEX, VIEW, etc.</li>
              <li><strong>ALTER:</strong> ALTER TABLE, DATABASE, etc.</li>
              <li><strong>DROP:</strong> DROP TABLE, DATABASE, INDEX, etc.</li>
              <li><strong>TRUNCATE:</strong> Remove all rows from a table</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DML (Data Manipulation Language)</h3>
            <p className="text-sm mb-2">Commands that manipulate data:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>INSERT:</strong> Add new rows</li>
              <li><strong>UPDATE:</strong> Modify existing rows</li>
              <li><strong>DELETE:</strong> Remove rows</li>
              <li><strong>UPSERT:</strong> INSERT ... ON CONFLICT (PostgreSQL)</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DQL (Data Query Language)</h3>
            <p className="text-sm mb-2">Commands that query data:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>SELECT:</strong> Retrieve data from tables</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">DCL (Data Control Language)</h3>
            <p className="text-sm mb-2">Commands that control access:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>GRANT:</strong> Give privileges to users</li>
              <li><strong>REVOKE:</strong> Remove privileges from users</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">TCL (Transaction Control Language)</h3>
            <p className="text-sm mb-2">Commands that manage transactions:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>BEGIN/START TRANSACTION:</strong> Start a transaction</li>
              <li><strong>COMMIT:</strong> Save changes permanently</li>
              <li><strong>ROLLBACK:</strong> Undo changes</li>
              <li><strong>SAVEPOINT:</strong> Create a point to rollback to</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SELECT Statement Syntax</h2>
          <CodeBlock
            title="Complete SELECT Syntax"
            language="sql"
            code={`SELECT 
  [DISTINCT | ALL]
  [* | column_list]
FROM 
  table_name [alias]
  [JOIN ...]
[WHERE 
  condition]
[GROUP BY 
  column_list]
[HAVING 
  condition]
[ORDER BY 
  column_list [ASC | DESC]]
[LIMIT 
  count [OFFSET offset]]
[FOR UPDATE | FOR SHARE];`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">SELECT Execution Order</h3>
          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2"><strong>Important for Interviews:</strong> SQL executes clauses in this order:</p>
            <ol className="list-decimal pl-6 space-y-1 text-sm">
              <li><strong>FROM</strong> - Select tables</li>
              <li><strong>JOIN</strong> - Combine tables</li>
              <li><strong>WHERE</strong> - Filter rows</li>
              <li><strong>GROUP BY</strong> - Group rows</li>
              <li><strong>HAVING</strong> - Filter groups</li>
              <li><strong>SELECT</strong> - Select columns</li>
              <li><strong>DISTINCT</strong> - Remove duplicates</li>
              <li><strong>ORDER BY</strong> - Sort results</li>
              <li><strong>LIMIT/OFFSET</strong> - Limit results</li>
            </ol>
            <p className="text-sm mt-2 text-red-600 dark:text-red-400">
              <strong>Key Point:</strong> You cannot use column aliases from SELECT in WHERE clause because WHERE executes before SELECT!
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JOIN Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">INNER JOIN</h3>
              <p className="text-sm mb-2">Returns only matching rows from both tables</p>
              <CodeBlock
                title="INNER JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
INNER JOIN orders o ON u.id = o.user_id;`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">LEFT JOIN</h3>
              <p className="text-sm mb-2">Returns all rows from left table + matching rows from right</p>
              <CodeBlock
                title="LEFT JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">RIGHT JOIN</h3>
              <p className="text-sm mb-2">Returns all rows from right table + matching rows from left</p>
              <CodeBlock
                title="RIGHT JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;`}
              />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">FULL OUTER JOIN</h3>
              <p className="text-sm mb-2">Returns all rows from both tables</p>
              <CodeBlock
                title="FULL OUTER JOIN Example"
                language="sql"
                code={`SELECT * 
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;`}
              />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Interview Tip: JOIN vs Subquery</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>JOIN:</strong> Better for combining columns from multiple tables</li>
              <li><strong>Subquery:</strong> Better for filtering or aggregating before joining</li>
              <li><strong>EXISTS:</strong> Better for checking existence (often faster than JOIN)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregate Functions</h2>
          <CodeBlock
            title="Common Aggregate Functions"
            language="sql"
            code={`-- COUNT: Count rows
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT email) FROM users;

-- SUM: Sum of numeric values
SELECT SUM(amount) FROM orders;

-- AVG: Average of numeric values
SELECT AVG(price) FROM products;

-- MIN/MAX: Minimum/Maximum values
SELECT MIN(created_at), MAX(created_at) FROM orders;

-- GROUP_CONCAT (PostgreSQL: string_agg)
SELECT string_agg(name, ', ') FROM categories;`}
          />

          <div className="bg-blue-50 dark:bg-zinc-800 p-4 rounded-lg mb-4 mt-4">
            <h3 className="font-semibold mb-2">GROUP BY Rules</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>All non-aggregated columns in SELECT must be in GROUP BY</li>
              <li>You can GROUP BY multiple columns</li>
              <li>HAVING filters groups (WHERE filters rows before grouping)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Window Functions</h2>
          <CodeBlock
            title="Window Functions Syntax"
            language="sql"
            code={`SELECT 
  column1,
  column2,
  aggregate_function(column3) OVER (
    PARTITION BY column1
    ORDER BY column2
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS window_result
FROM table_name;`}
          />

          <CodeBlock
            title="Common Window Functions"
            language="sql"
            code={`-- ROW_NUMBER: Sequential number for each row
SELECT 
  name,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- RANK: Rank with gaps for ties
SELECT 
  name,
  RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- DENSE_RANK: Rank without gaps
SELECT 
  name,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- LAG/LEAD: Access previous/next row
SELECT 
  date,
  amount,
  LAG(amount) OVER (ORDER BY date) AS prev_amount,
  LEAD(amount) OVER (ORDER BY date) AS next_amount
FROM sales;

-- SUM/AVG/COUNT: Running totals
SELECT 
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) AS running_total,
  AVG(amount) OVER (PARTITION BY region) AS region_avg
FROM sales;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subqueries</h2>
          
          <h3 className="text-xl font-semibold mb-3">Types of Subqueries</h3>
          <CodeBlock
            title="Scalar Subquery (Returns single value)"
            language="sql"
            code={`-- Returns single value, can be used in SELECT, WHERE, HAVING
SELECT 
  name,
  (SELECT AVG(salary) FROM employees) AS avg_salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);`}
          />

          <CodeBlock
            title="Row Subquery (Returns single row)"
            language="sql"
            code={`-- Returns single row with multiple columns
SELECT * 
FROM employees
WHERE (department, salary) = (
  SELECT department, MAX(salary)
  FROM employees
  GROUP BY department
  LIMIT 1
);`}
          />

          <CodeBlock
            title="Column Subquery (Returns single column)"
            language="sql"
            code={`-- Returns multiple rows, single column
SELECT * 
FROM products
WHERE category_id IN (
  SELECT id FROM categories WHERE active = true
);`}
          />

          <CodeBlock
            title="Table Subquery (Returns table)"
            language="sql"
            code={`-- Returns table, used in FROM clause
SELECT * 
FROM (
  SELECT department, AVG(salary) AS avg_sal
  FROM employees
  GROUP BY department
) AS dept_avg
WHERE avg_sal > 50000;`}
          />

          <CodeBlock
            title="EXISTS vs IN - Interview Favorite"
            language="sql"
            code={`-- EXISTS: Stops after first match (often faster)
SELECT * 
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.customer_id = c.id
);

-- IN: Must evaluate all values
SELECT * 
FROM customers
WHERE id IN (
  SELECT customer_id FROM orders
);

-- Interview Tip: EXISTS is generally faster for large datasets
-- Use IN when you need to check against a small, static list`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Table Expressions (CTEs)</h2>
          <CodeBlock
            title="CTE Syntax"
            language="sql"
            code={`WITH cte_name AS (
  SELECT ...
),
another_cte AS (
  SELECT ...
)
SELECT * FROM cte_name;`}
          />

          <CodeBlock
            title="Recursive CTE (Important for Interviews!)"
            language="sql"
            code={`-- Find all ancestors of an employee
WITH RECURSIVE employee_hierarchy AS (
  -- Anchor: Start with CEO
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Recursive: Find subordinates
  SELECT e.id, e.name, e.manager_id, eh.level + 1
  FROM employees e
  INNER JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy;`}
          />

          <div className="bg-green-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">CTE vs Subquery - Interview Questions</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>CTE:</strong> More readable, reusable in same query, can be recursive</li>
              <li><strong>Subquery:</strong> More compact, sometimes better performance</li>
              <li><strong>Use CTE:</strong> Complex queries, recursive queries, multiple references</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Set Operations</h2>
          <CodeBlock
            title="UNION, INTERSECT, EXCEPT"
            language="sql"
            code={`-- UNION: Combine results, removes duplicates
SELECT name FROM table1
UNION
SELECT name FROM table2;

-- UNION ALL: Combine results, keeps duplicates (faster)
SELECT name FROM table1
UNION ALL
SELECT name FROM table2;

-- INTERSECT: Common rows in both queries
SELECT id FROM table1
INTERSECT
SELECT id FROM table2;

-- EXCEPT: Rows in first query but not in second
SELECT id FROM table1
EXCEPT
SELECT id FROM table2;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Interview Questions</h2>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Difference between WHERE and HAVING?</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>WHERE:</strong> Filters rows before grouping (can't use aggregate functions)</li>
              <li><strong>HAVING:</strong> Filters groups after grouping (can use aggregate functions)</li>
              <li><strong>Both:</strong> Can be used together - WHERE first, then HAVING</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Difference between DELETE, TRUNCATE, and DROP?</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>DELETE:</strong> Removes rows, can be rolled back, can have WHERE clause, slower</li>
              <li><strong>TRUNCATE:</strong> Removes all rows, faster, resets auto-increment, can be rolled back (in transaction)</li>
              <li><strong>DROP:</strong> Removes entire table structure, cannot be rolled back</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: Difference between RANK, DENSE_RANK, and ROW_NUMBER?</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>ROW_NUMBER:</strong> Sequential numbers (1, 2, 3, 4, 5)</li>
              <li><strong>RANK:</strong> Same rank for ties, gaps after ties (1, 2, 2, 4, 5)</li>
              <li><strong>DENSE_RANK:</strong> Same rank for ties, no gaps (1, 2, 2, 3, 4)</li>
            </ul>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How to find duplicate rows?</h3>
            <CodeBlock
              title="Finding Duplicates"
              language="sql"
              code={`-- Method 1: GROUP BY with HAVING
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Method 2: Window function
SELECT * FROM (
  SELECT *, 
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
  FROM users
) t WHERE rn > 1;`}
            />
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Q: How to delete duplicates?</h3>
            <CodeBlock
              title="Deleting Duplicates"
              language="sql"
              code={`-- Keep one row, delete others
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  GROUP BY email
);

-- Or using CTID (PostgreSQL specific)
DELETE FROM users 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM users 
  GROUP BY email
);`}
            />
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

