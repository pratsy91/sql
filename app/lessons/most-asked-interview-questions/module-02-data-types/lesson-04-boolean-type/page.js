import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Boolean Type - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL BOOLEAN — true/false/NULL, three-valued logic, IS TRUE vs equals, partial indexes, and NOT NULL flags',
};

export default function MaiqM02L04BooleanType() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Boolean Type</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Flags look simple. Interviews test whether you know that SQL booleans have three values, not two, and that a NULL flag silently drops rows.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the BOOLEAN type used for?">
            <p>
              <code>BOOLEAN</code> stores a flag: true, false, or NULL. Use it for yes/no columns such as <code>is_active</code>, <code>is_verified</code>, or <code>email_confirmed</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Storage is 1 byte</li>
              <li>Do not store flags as <code>CHAR(1)</code>, <code>&apos;Y&apos;/&apos;N&apos;</code>, or <code>0/1</code> integers. Use a real boolean</li>
              <li>In Prisma this is <code>Boolean</code></li>
            </ul>
            <CodeBlock
              title="BOOLEAN column"
              language="sql"
              code={`CREATE TABLE users (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true
);`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Which values can you insert into a BOOLEAN column?">
            <p>
              Postgres accepts several spellings. They all become true or false. Case does not matter.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>True:</strong> <code>TRUE</code>, <code>true</code>, <code>&apos;t&apos;</code>, <code>&apos;yes&apos;</code>, <code>&apos;on&apos;</code>, <code>&apos;1&apos;</code></li>
              <li><strong>False:</strong> <code>FALSE</code>, <code>false</code>, <code>&apos;f&apos;</code>, <code>&apos;no&apos;</code>, <code>&apos;off&apos;</code>, <code>&apos;0&apos;</code></li>
              <li><strong>Unknown:</strong> <code>NULL</code></li>
              <li>Prefer writing <code>TRUE</code> / <code>FALSE</code> in SQL. The string forms are accepted, but they look like a code smell in reviews</li>
            </ul>
            <CodeBlock
              title="Accepted boolean literals"
              language="sql"
              code={`INSERT INTO users (email, is_active) VALUES
  ('a@x.com', TRUE),
  ('b@x.com', 't'),
  ('c@x.com', 'yes'),
  ('d@x.com', '1');

SELECT TRUE::boolean, 'no'::boolean, NULL::boolean;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is three-valued logic, and how does a NULL boolean behave?">
            <p>
              SQL has three truth values, not two: true, false, and unknown. A NULL boolean means &quot;we do not know&quot;, and any comparison with NULL
              produces unknown. A <code>WHERE</code> clause keeps a row only when the result is true, so unknown rows are dropped.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>NULL = NULL</code> is not true. Use <code>IS NULL</code> and <code>IS NOT NULL</code></li>
              <li><code>WHERE is_active = false</code> silently skips rows where <code>is_active</code> is NULL. This is the bug interviewers are testing for</li>
              <li><code>NOT NULL</code> is still unknown, so <code>WHERE NOT is_active</code> also drops those rows</li>
              <li><code>true OR NULL</code> is true, and <code>false AND NULL</code> is false, because the answer is already decided. The others stay unknown</li>
              <li>Use <code>IS TRUE</code>, <code>IS NOT TRUE</code>, <code>IS DISTINCT FROM</code>, or <code>coalesce()</code> when you want NULL treated as a value</li>
              <li>The clean fix is to declare flags as <code>BOOLEAN NOT NULL DEFAULT false</code> so the third state never exists</li>
            </ul>
            <CodeBlock
              title="NULL boolean pitfalls"
              language="sql"
              code={`SELECT NULL = NULL          AS eq,        -- NULL (unknown)
       NULL IS NULL         AS is_null,   -- true
       true OR NULL         AS t_or_null, -- true
       false AND NULL       AS f_and_null,-- false
       (NULL::boolean) IS NOT TRUE AS not_true; -- true

-- Misses rows where is_active IS NULL
SELECT count(*) FROM users WHERE is_active = false;

-- Includes them
SELECT count(*) FROM users WHERE is_active IS NOT TRUE;
SELECT count(*) FROM users WHERE coalesce(is_active, false) = false;

-- Safer design
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between WHERE flag = false and WHERE flag IS NOT TRUE?">
            <p>
              <code>= false</code> keeps only rows that are exactly false. <code>IS NOT TRUE</code> keeps false and NULL. Interviewers use this to see if you remember three-valued logic.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>IS TRUE</code> / <code>IS FALSE</code> / <code>IS UNKNOWN</code> treat NULL as its own state</li>
              <li><code>IS DISTINCT FROM</code> compares with NULL as a real value: <code>flag IS DISTINCT FROM true</code> matches false and NULL</li>
              <li>If the column is <code>NOT NULL</code>, <code>= false</code> and <code>IS FALSE</code> are the same, which is why the NOT NULL default is the real fix</li>
            </ul>
            <CodeBlock
              title="IS TRUE vs equals"
              language="sql"
              code={`-- flag | = true | IS TRUE | = false | IS FALSE | IS NOT TRUE
-- t    | yes    | yes     | no      | no       | no
-- f    | no     | no      | yes     | yes      | yes
-- NULL | no     | no      | no      | no       | yes

SELECT * FROM users WHERE is_active IS DISTINCT FROM true;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Should you index a BOOLEAN column?">
            <p>
              A normal B-tree on a boolean is usually a waste: there are only two values, so the index is not selective. A partial index on the rare value is the interview answer.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>If almost every row is <code>is_active = true</code>, index the inactive rows: <code>WHERE is_active = false</code></li>
              <li>The same idea applies to <code>is_deleted</code>, <code>is_featured</code>, or any sparse flag</li>
              <li>If the split is close to 50/50, a boolean index rarely helps. Filter on a more selective column instead</li>
              <li>Combine the flag with another column if you always query both: <code>(user_id) WHERE is_unread = true</code></li>
            </ul>
            <CodeBlock
              title="Partial index on the rare flag"
              language="sql"
              code={`-- Most users are active. Index only the inactive ones.
CREATE INDEX users_inactive_idx
  ON users (id)
  WHERE is_active = false;

-- Unread messages per inbox
CREATE INDEX messages_unread_idx
  ON messages (inbox_id, created_at DESC)
  WHERE is_read = false;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="BOOLEAN vs CHAR(1) vs SMALLINT for flags — which do you pick?">
            <p>
              Use <code>BOOLEAN</code>. The other two are leftovers from databases that did not have a boolean type.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>CHAR(1)</code> with Y/N needs extra CHECKs, collations, and case handling</li>
              <li><code>SMALLINT</code> 0/1 is what MySQL people bring over. It wastes space and allows 2, 3, and -1 unless you add a CHECK</li>
              <li>Prisma, JDBC, and every modern driver map boolean cleanly. Fake flags do not</li>
              <li>If you later need a third business state such as pending, that is an ENUM or a lookup table, not a nullable boolean</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How should boolean flags be designed in production schemas?">
            <p>
              Make flags <code>NOT NULL</code> with a default. Add a partial index only when one side is rare. Do not invent a third meaning for NULL.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>NULL as &quot;not decided yet&quot; always leaks into reports. Use a status ENUM if you need more than yes/no</li>
              <li>Name flags as predicates: <code>is_active</code>, <code>has_2fa</code>, not <code>active_flag</code> or <code>status</code></li>
              <li>Avoid double negatives such as <code>is_not_deleted</code></li>
              <li>When many flags grow on one table, a status column or a small lookup is clearer than ten booleans</li>
              <li>In Prisma, <code>Boolean @default(false)</code> generates <code>NOT NULL DEFAULT false</code>. Do not leave it optional unless the unknown state is a real business case</li>
            </ul>
            <CodeBlock
              title="Production flag"
              language="sql"
              code={`ALTER TABLE users
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL;

-- Prisma
-- isActive Boolean @default(true)`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
