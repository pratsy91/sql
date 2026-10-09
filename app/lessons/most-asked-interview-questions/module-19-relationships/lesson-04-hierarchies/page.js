import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Hierarchies - Module 19 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on hierarchical data in SQL: self-referencing manager and employee tables, recursive CTEs to walk a tree, limiting depth, materialized paths, adjacency list versus closure table versus ltree, preventing cycles, and designing comment threads for high read volume.',
};

export default function M19L4Hierarchies() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Hierarchies</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Trees are the shape relational tables handle least naturally: org charts, categories, comment threads,
          folders. This lesson covers the one-column solution, how to walk a tree in SQL, the alternatives when
          walking is too slow, and the two things that always go wrong — cycles and unbounded depth.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard
            level="Junior"
            question="How do you model a self-referencing relationship (manager / employee)?"
          >
            <p>
              A self-referencing relationship is a table whose foreign key points back at itself. The classic
              pattern is an <strong>adjacency list</strong>: each row stores the id of its parent, and nothing else.
            </p>
            <p>
              The <code>manager_id</code> column is nullable, because the person at the top has no manager. That
              NULL is what marks the root of the tree.
            </p>
            <CodeBlock
              title="Adjacency list"
              language="sql"
              code={`CREATE TABLE employees (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  manager_id INT REFERENCES employees(id) ON DELETE SET NULL
);

-- Index the foreign key: "who reports to this person" is the main query
CREATE INDEX employees_manager_id_idx ON employees (manager_id);

-- Direct reports
SELECT * FROM employees WHERE manager_id = 10;

-- The top of the tree
SELECT * FROM employees WHERE manager_id IS NULL;

-- The whole hierarchy under employee 1
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees e
  JOIN tree t ON e.manager_id = t.id
)
SELECT * FROM tree;`}
            />
            <p>
              Note the <code>ON DELETE SET NULL</code>. CASCADE would be a disaster here: deleting a middle manager
              would delete their entire reporting line. SET NULL orphans the subtree at the top level, which is
              wrong too but recoverable; in a real system you would use RESTRICT and force a reassignment.
            </p>
            <CodeBlock
              title="Prisma self-relation"
              language="typescript"
              code={`model Employee {
  id        Int        @id @default(autoincrement())
  name      String
  managerId Int?
  manager   Employee?  @relation("OrgChart", fields: [managerId], references: [id])
  reports   Employee[] @relation("OrgChart")

  @@index([managerId])
}`}
            />
            <p>
              The relation needs a name, <code>&quot;OrgChart&quot;</code> here, because both sides point at the same
              model and Prisma cannot otherwise tell which field pairs with which. Prisma can read a fixed number of
              levels with nested <code>include</code>, but it has no recursive query, so anything of unknown depth
              needs raw SQL.
            </p>
            <CodeBlock
              title="Prisma: two levels down, and the recursive escape hatch"
              language="typescript"
              code={`// Fixed depth: fine when you know the shape
const boss = await prisma.employee.findUnique({
  where: { id: 1 },
  include: { reports: { include: { reports: true } } },
});

// Unknown depth: use raw SQL with a recursive CTE
const subtree = await prisma.$queryRawUnsafe(
  'WITH RECURSIVE tree AS (' +
    'SELECT id, name, manager_id, 1 AS depth FROM employees WHERE id = $1 ' +
    'UNION ALL ' +
    'SELECT e.id, e.name, e.manager_id, t.depth + 1 FROM employees e ' +
    'JOIN tree t ON e.manager_id = t.id) ' +
  'SELECT * FROM tree ORDER BY depth',
  rootId
);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Write a recursive CTE to walk a tree, and explain how it works."
          >
            <p>
              <code>WITH RECURSIVE</code> is how SQL follows a chain of unknown length. It has exactly two parts
              joined by <code>UNION ALL</code>:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The <strong>base case</strong> runs once and produces the starting rows
              </li>
              <li>
                The <strong>recursive part</strong> refers to the CTE by name, and runs again and again. Each round
                only sees the rows the previous round produced, not everything so far
              </li>
              <li>It stops automatically when a round produces no rows</li>
            </ul>
            <p>
              Change the direction by swapping which column you join on. Joining{' '}
              <code>child.parent_id = tree.id</code> walks downwards to descendants; joining{' '}
              <code>parent.id = tree.parent_id</code> walks upwards to ancestors.
            </p>
            <CodeBlock
              title="Downwards: everyone under a manager"
              language="sql"
              code={`WITH RECURSIVE subordinates AS (
  -- base case: the starting row
  SELECT id, name, manager_id, 1 AS depth, name::text AS path
  FROM employees
  WHERE id = $1

  UNION ALL

  -- recursive part: children of whatever the last round found
  SELECT e.id, e.name, e.manager_id, s.depth + 1, s.path || ' > ' || e.name
  FROM employees e
  JOIN subordinates s ON e.manager_id = s.id
)
SELECT depth, path, id, name
FROM subordinates
ORDER BY path;`}
            />
            <p>
              Building up a <code>path</code> string as you go gives you two things for free: an ordering that keeps
              each child directly under its parent, and a human-readable breadcrumb.
            </p>
            <CodeBlock
              title="Upwards: the chain of managers above someone"
              language="sql"
              code={`WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE id = $1

  UNION ALL

  SELECT m.id, m.name, m.manager_id, c.level + 1
  FROM employees m
  JOIN chain c ON m.id = c.manager_id
)
SELECT level, id, name FROM chain ORDER BY level;`}
            />
            <CodeBlock
              title="Aggregate over a subtree"
              language="sql"
              code={`-- Total headcount and salary cost under each top-level department
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, id AS root_id FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.root_id
  FROM employees e JOIN tree t ON e.manager_id = t.id
)
SELECT r.name AS root, count(*) AS headcount, sum(e.salary) AS cost
FROM tree t
JOIN employees e ON e.id = t.id
JOIN employees r ON r.id = t.root_id
GROUP BY r.name
ORDER BY cost DESC;`}
            />
            <p>
              Two practical notes. Use <code>UNION ALL</code>, not <code>UNION</code>: plain{' '}
              <code>UNION</code> deduplicates on every round, which is slower and is not a real defence against
              cycles. And the recursion needs an index on the joined column — without{' '}
              <code>employees_manager_id_idx</code> every round scans the whole table.
            </p>
            <p>
              PostgreSQL 14 and later also accepts the standard spelling{' '}
              <code>WITH RECURSIVE ... SEARCH DEPTH FIRST BY id SET ordercol</code>, which builds the ordering
              column for you instead of you concatenating a path by hand.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you limit the depth of a recursive query?"
          >
            <p>
              Carry a depth counter in the CTE and filter on it inside the recursive part. Putting the limit in the
              outer <code>WHERE</code> is the common mistake: the recursion still walks the entire tree, and you
              only throw the deep rows away at the end.
            </p>
            <CodeBlock
              title="The limit must be inside the recursion"
              language="sql"
              code={`-- Right: recursion stops at depth 3
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 1 AS depth
  FROM employees WHERE id = $1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees e
  JOIN tree t ON e.manager_id = t.id
  WHERE t.depth < 3          -- inside: the walk really stops
)
SELECT * FROM tree;

-- Wrong: walks the whole tree, then discards rows
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 1 AS depth FROM employees WHERE id = $1
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees e JOIN tree t ON e.manager_id = t.id
)
SELECT * FROM tree WHERE depth <= 3;`}
            />
            <p>
              A depth cap is also your safety net against a cycle. If bad data ever creates a loop, an uncapped
              recursive query runs until it exhausts memory or hits{' '}
              <code>statement_timeout</code>; with a cap it returns a wrong-but-finite answer instead of taking the
              database down.
            </p>
            <p>
              Separately, limit depth in the product. Comment threads that nest without limit are unreadable and
              produce unbounded queries, so most sites cap replies at three or four levels and show the rest as a
              flat list. Enforcing that in the schema is better than hoping the UI remembers.
            </p>
            <CodeBlock
              title="Store depth and enforce the cap in the database"
              language="sql"
              code={`ALTER TABLE comments ADD COLUMN depth INT NOT NULL DEFAULT 0;
ALTER TABLE comments ADD CONSTRAINT comments_depth_check CHECK (depth BETWEEN 0 AND 3);

CREATE OR REPLACE FUNCTION set_comment_depth() RETURNS trigger AS $fn$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 0;
  ELSE
    SELECT depth + 1 INTO NEW.depth FROM comments WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER comments_set_depth
BEFORE INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION set_comment_depth();

-- A reply beyond level 3 now fails the CHECK, in every code path.`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Adjacency list vs closure table vs ltree — when do you use each?"
          >
            <p>
              All three store the same tree. They differ in whether reading a subtree is a recursive walk or a
              single indexed lookup, and in how much work a move costs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Adjacency list:</strong> one <code>parent_id</code> column. Writes and moves are trivial;
                reading a deep tree needs a recursive CTE. The right default for org charts and comments
              </li>
              <li>
                <strong>Closure table:</strong> a second table storing every ancestor-and-descendant pair, with the
                distance between them. Subtree and ancestor queries become one indexed join with no recursion.
                Moving a subtree means rewriting many rows
              </li>
              <li>
                <strong>
                  <code>ltree</code>
                </strong>{' '}
                (a PostgreSQL extension): a path of labels such as{' '}
                <code>Root.Engineering.Backend</code> in one column, with GiST index operators. Excellent for
                category trees that are read constantly and reorganised rarely
              </li>
            </ul>
            <CodeBlock
              title="Closure table"
              language="sql"
              code={`CREATE TABLE category_tree (
  ancestor_id   INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  descendant_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  depth         INT NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);
CREATE INDEX category_tree_descendant_idx ON category_tree (descendant_id);

-- Every row also points at itself with depth 0, which makes the queries uniform.

-- Whole subtree: no recursion at all
SELECT c.* FROM category_tree t
JOIN categories c ON c.id = t.descendant_id
WHERE t.ancestor_id = $1;

-- Full breadcrumb, in order
SELECT c.* FROM category_tree t
JOIN categories c ON c.id = t.ancestor_id
WHERE t.descendant_id = $1
ORDER BY t.depth DESC;`}
            />
            <CodeBlock
              title="Inserting into a closure table"
              language="sql"
              code={`-- Adding node 55 under parent 7: copy the parent's ancestors, plus self
INSERT INTO category_tree (ancestor_id, descendant_id, depth)
SELECT t.ancestor_id, 55, t.depth + 1
FROM category_tree t
WHERE t.descendant_id = 7
UNION ALL
SELECT 55, 55, 0;`}
            />
            <CodeBlock
              title="ltree"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  path ltree NOT NULL
);
CREATE INDEX categories_path_gist ON categories USING GIST (path);

-- Descendants of Engineering, at any depth
SELECT * FROM categories WHERE path <@ 'Root.Engineering';

-- Direct children only
SELECT * FROM categories WHERE path ~ 'Root.Engineering.*{1}';

-- Move a whole subtree with one update
UPDATE categories
SET path = 'Root.Product' || subpath(path, nlevel('Root.Engineering'::ltree))
WHERE path <@ 'Root.Engineering';`}
            />
            <p>
              How to choose, in one sentence: start with the adjacency list, because it is the only one with no
              redundancy to keep in sync. Move to <code>ltree</code> when subtree reads dominate and your platform
              allows the extension. Use a closure table when you need the same speed without extensions, or you need
              per-edge data such as a depth-limited permission inheritance, and you accept a trigger to maintain it.
            </p>
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you store a materialized path in one column?"
          >
            <p>
              A <strong>materialized path</strong> means each row stores its full ancestry as text, such as{' '}
              <code>/1/7/55/</code>. Subtree queries become a prefix match, which a plain B-tree index can serve, so
              you need no extension and no recursion.
            </p>
            <CodeBlock
              title="Materialized path with a plain text column"
              language="sql"
              code={`CREATE TABLE categories (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id BIGINT REFERENCES categories(id),
  name      TEXT NOT NULL,
  path      TEXT NOT NULL     -- e.g. '/1/7/55/'
);

-- text_pattern_ops makes LIKE 'prefix%' use the index
CREATE INDEX categories_path_idx ON categories (path text_pattern_ops);

-- Whole subtree under /1/7/ in one indexed scan
SELECT * FROM categories WHERE path LIKE '/1/7/%' ORDER BY path;

-- Depth for free: count the separators
SELECT id, name, length(path) - length(replace(path, '/', '')) - 1 AS depth
FROM categories;

-- Ancestors: the ids are already in the path
SELECT * FROM categories
WHERE id = ANY (string_to_array(trim(both '/' from '/1/7/55/'), '/')::bigint[]);`}
            />
            <p>
              The leading and trailing slashes matter. Without them, <code>/1/7%</code> also matches{' '}
              <code>/1/70/</code>, which is a real and very confusing bug.
            </p>
            <p>
              Keep the path correct with a trigger, so no code path can write a wrong one. The cost of this design
              is the move: relocating a subtree has to rewrite the path of every descendant.
            </p>
            <CodeBlock
              title="A trigger keeps the path correct"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION set_category_path() RETURNS trigger AS $fn$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := '/' || NEW.id || '/';
  ELSE
    SELECT path INTO parent_path FROM categories WHERE id = NEW.parent_id;
    NEW.path := parent_path || NEW.id || '/';
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER categories_set_path
BEFORE INSERT ON categories
FOR EACH ROW EXECUTE FUNCTION set_category_path();`}
            />
            <CodeBlock
              title="Moving a subtree rewrites its descendants"
              language="sql"
              code={`-- Move node 7 (and everything under it) to live under node 3
WITH target AS (
  SELECT path AS old_path FROM categories WHERE id = 7
), newbase AS (
  SELECT path || '7/' AS new_path FROM categories WHERE id = 3
)
UPDATE categories c
SET path = (SELECT new_path FROM newbase)
        || substring(c.path from length((SELECT old_path FROM target)) + 1)
WHERE c.path LIKE (SELECT old_path FROM target) || '%';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="How do you prevent cycles in a self-referencing table?"
          >
            <p>
              A foreign key does not stop a cycle. Nothing prevents employee 1 reporting to employee 2 while
              employee 2 reports to employee 1: both rows point at rows that exist. The constraint is satisfied and
              the tree is broken.
            </p>
            <p>
              A cycle is nasty because the damage shows up somewhere else. Every recursive query over that table now
              runs forever, so the symptom is a timeout in an unrelated report, hours after the bad update.
            </p>
            <p>There are three layers of defence, and a good answer mentions more than one.</p>
            <p>
              <strong>1. Detect it while reading, so a cycle cannot hang a query.</strong> PostgreSQL 14 and later
              has a <code>CYCLE</code> clause; before that you carry an array of visited ids.
            </p>
            <CodeBlock
              title="Cycle-safe recursive queries"
              language="sql"
              code={`-- PostgreSQL 14+: the server tracks it for you
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id FROM employees WHERE id = $1
  UNION ALL
  SELECT e.id, e.name, e.manager_id
  FROM employees e JOIN tree t ON e.manager_id = t.id
) CYCLE id SET is_cycle USING path
SELECT id, name, is_cycle FROM tree WHERE NOT is_cycle;

-- Any version: carry the visited ids yourself
WITH RECURSIVE tree AS (
  SELECT id, manager_id, ARRAY[id] AS visited
  FROM employees WHERE id = $1
  UNION ALL
  SELECT e.id, e.manager_id, t.visited || e.id
  FROM employees e
  JOIN tree t ON e.manager_id = t.id
  WHERE NOT e.id = ANY (t.visited)     -- stop before revisiting
)
SELECT * FROM tree;`}
            />
            <p>
              <strong>2. Reject it on write, so it can never exist.</strong> A trigger walks up from the proposed
              parent and refuses the change if it meets the row being updated. This is the real fix, because it
              protects every writer.
            </p>
            <CodeBlock
              title="A trigger that refuses to create a cycle"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION no_manager_cycle() RETURNS trigger AS $fn$
BEGIN
  IF NEW.manager_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.manager_id = NEW.id THEN
    RAISE EXCEPTION 'an employee cannot manage themselves';
  END IF;

  IF EXISTS (
    WITH RECURSIVE up AS (
      SELECT id, manager_id FROM employees WHERE id = NEW.manager_id
      UNION ALL
      SELECT e.id, e.manager_id
      FROM employees e JOIN up ON e.id = up.manager_id
    )
    SELECT 1 FROM up WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'that change would create a management cycle';
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER employees_no_cycle
BEFORE INSERT OR UPDATE OF manager_id ON employees
FOR EACH ROW EXECUTE FUNCTION no_manager_cycle();`}
            />
            <p>
              <strong>3. Make cycles unrepresentable.</strong> With a materialized path or an{' '}
              <code>ltree</code> column, a cycle is impossible by construction: a node&apos;s path contains its
              ancestors, so it can never contain itself. That is a genuine argument for those designs beyond read
              speed.
            </p>
            <CodeBlock
              title="Cheap structural guards"
              language="sql"
              code={`-- Self-reference, the most common case, needs no trigger
ALTER TABLE employees
  ADD CONSTRAINT employees_not_self_managed CHECK (manager_id <> id);

-- A path column makes a cycle unrepresentable
ALTER TABLE categories
  ADD CONSTRAINT categories_path_contains_self
  CHECK (path LIKE '%/' || id || '/');`}
            />
            <p>
              Mention the trade-off: the trigger runs a recursive query on every reassignment, which is fine for an
              org chart and too slow for a table with millions of writes per hour. There, the usual compromise is a
              cheap <code>CHECK</code> plus a scheduled job that detects cycles and alerts, accepting a short window
              of bad data.
            </p>
            <CodeBlock
              title="A watchdog query for the scheduled job"
              language="sql"
              code={`WITH RECURSIVE walk AS (
  SELECT id AS start_id, manager_id, 1 AS depth
  FROM employees WHERE manager_id IS NOT NULL
  UNION ALL
  SELECT w.start_id, e.manager_id, w.depth + 1
  FROM walk w JOIN employees e ON e.id = w.manager_id
  WHERE w.depth < 50
)
SELECT DISTINCT start_id FROM walk WHERE manager_id = start_id;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How would you design comment threads (self-referencing) for high read volume?"
          >
            <p>
              The design is driven by the read pattern: one page load needs the top-level comments for a post,
              sorted, paginated, with a few replies each and a count of the rest. Fetching a whole thread and
              assembling it in application code does not survive a popular post.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Adjacency list with <code>parent_id</code> for writes, plus a <code>post_id</code> on every comment
                including replies, so you can fetch a whole thread with one indexed lookup and never recurse on the
                read path
              </li>
              <li>
                Materialize a path (<code>ltree</code> or a text column) when you genuinely need deep subtree
                filters, because it also gives you the correct display order for free
              </li>
              <li>
                Cap nesting depth, and paginate top-level comments separately from replies. Fetch three replies per
                comment for the page and load the rest on demand
              </li>
              <li>
                Denormalize <code>reply_count</code> on the parent, so the list view does not aggregate
              </li>
              <li>
                Index for the exact sorts you offer, usually newest first and best first, and use cursor pagination
                rather than offset
              </li>
              <li>
                Cache the rendered first page per post, with the comment count as part of the cache key so a new
                comment invalidates it
              </li>
            </ul>
            <CodeBlock
              title="Comments schema"
              language="typescript"
              code={`model Comment {
  id         String    @id @default(cuid())
  postId     String
  parentId   String?
  depth      Int       @default(0)
  path       String                       // '/root/child/' for ordering
  body       String
  score      Int       @default(0)
  replyCount Int       @default(0)
  createdAt  DateTime  @default(now())

  post    Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("Thread", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[] @relation("Thread")

  @@index([postId, createdAt])
  @@index([postId, score(sort: Desc)])
  @@index([parentId])
  @@index([postId, path])
}`}
            />
            <CodeBlock
              title="One query per page: top-level comments, newest first"
              language="typescript"
              code={`const top = await prisma.comment.findMany({
  where: { postId, parentId: null },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: 20,
  cursor: cursorId ? { id: cursorId } : undefined,
  skip: cursorId ? 1 : 0,
  select: {
    id: true, body: true, createdAt: true, replyCount: true,
    author: { select: { id: true, displayName: true } },
  },
});`}
            />
            <CodeBlock
              title="Top three replies per comment, in one statement"
              language="sql"
              code={`-- LATERAL runs the inner query once per parent, and stops at 3 each time
SELECT p.id AS parent_id, r.id, r.body, r.created_at
FROM unnest($1::text[]) AS p(id)
CROSS JOIN LATERAL (
  SELECT c.id, c.body, c.created_at
  FROM comments c
  WHERE c.parent_id = p.id
  ORDER BY c.score DESC, c.id DESC
  LIMIT 3
) r;`}
            />
            <CodeBlock
              title="Keep reply_count correct in the database"
              language="sql"
              code={`CREATE OR REPLACE FUNCTION bump_reply_count() RETURNS trigger AS $fn$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER comments_reply_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION bump_reply_count();`}
            />
            <p>
              Finally, decide what delete means, because it shapes the read path. Hard-deleting a comment with
              replies either destroys the replies through the cascade or leaves them orphaned. Most products
              soft-delete instead, blanking the body and keeping the node so the thread structure survives. That is
              a case where the awkwardness of soft delete is genuinely the right answer.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
