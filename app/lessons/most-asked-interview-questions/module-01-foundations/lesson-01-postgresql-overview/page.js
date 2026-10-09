import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: PostgreSQL Overview - Module 1 - Most Asked Interview Questions',
  description:
    'Most asked interview questions about what PostgreSQL is, SQL vs PostgreSQL, open source licensing, ORDBMS, RDBMS vs NoSQL, and PostgreSQL vs MySQL',
};

export default function MaiqM01L01PostgresqlOverview() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: PostgreSQL Overview</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The first questions in almost every Postgres interview. What the product is, how it compares to other databases, and why teams pick it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is PostgreSQL?">
            <p>
              PostgreSQL (people say &quot;Postgres&quot;) is a free database that stores data in tables and lets you query it with SQL.
              It is known for being reliable and for extra features like JSON, arrays, and plugins.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Transactions are safe: a change is all saved, or none of it is (ACID)</li>
              <li>You can add extras such as maps (PostGIS) or fuzzy search (pg_trgm)</li>
              <li>Common for websites, reports, and apps with many customers</li>
              <li>Interview versions people mention now: Postgres 15, 16, and 17</li>
            </ul>
            <CodeBlock
              title="Check the server version"
              language="sql"
              code={`SELECT version();
SHOW server_version;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is SQL, and how is it different from PostgreSQL?">
            <p>
              SQL is the language you write to talk to a database (SELECT, INSERT, and so on). PostgreSQL is one product that understands SQL.
              MySQL and SQL Server also use SQL, but some commands differ.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>SQL = the questions and commands</li>
              <li>PostgreSQL = the server that stores the data and runs those commands</li>
              <li>In interviews, say which database you mean, because syntax is not 100% the same</li>
            </ul>
            <CodeBlock
              title="Same idea, different dialect"
              language="sql"
              code={`-- PostgreSQL: limit rows
SELECT name FROM users ORDER BY id LIMIT 10;

-- SQL Server writes the same thing differently
-- SELECT TOP 10 name FROM users ORDER BY id;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Is PostgreSQL really free and open source?">
            <p>
              Yes. Postgres is released under the PostgreSQL License, which is a short permissive license similar to the MIT and BSD licenses.
              You can use it in a commercial product, change the code, and ship it, with no license fee.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>No per-core or per-user cost, unlike Oracle or SQL Server</li>
              <li>Built by a worldwide community, not owned by one company</li>
              <li>You may still pay a cloud provider (AWS RDS, Google Cloud SQL, Neon, Supabase) for hosting and support, not for the database itself</li>
              <li>The permissive license is why so many products embed Postgres or build on top of it</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is the difference between RDBMS and NoSQL?">
            <p>
              An RDBMS keeps data in tables with columns and links between tables. NoSQL is a group of other styles: documents, simple key-value pairs, or graphs. The shape of the data is often looser.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>RDBMS (PostgreSQL, MySQL):</strong> SQL, joins, and rules that keep data correct</li>
              <li><strong>NoSQL (MongoDB, Redis, Cassandra):</strong> flexible documents or keys, often easier to spread across many machines</li>
              <li>Use tables when data is related (orders, users). Use NoSQL for cache, logs, or documents that change shape a lot</li>
              <li>Postgres can store JSON too, so many apps stay on Postgres instead of adding MongoDB</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="PostgreSQL is called an ORDBMS. What does that mean?">
            <p>
              ORDBMS means object-relational database management system. It is a relational database (tables, rows, joins) that also lets you
              define your own types and behaviour, the way object-oriented code does.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You can create your own data types, including composite types that hold several fields</li>
              <li>You can create your own functions and operators, and even your own index types</li>
              <li>Tables can inherit from other tables, which is how old-style partitioning worked</li>
              <li>Short interview answer: &quot;relational at its core, but extensible with custom types, functions, and operators&quot;</li>
            </ul>
            <CodeBlock
              title="A custom type and a table that uses it"
              language="sql"
              code={`CREATE TYPE full_address AS (
  line1 TEXT,
  city  TEXT,
  pin   TEXT
);

CREATE TABLE customers (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name    TEXT NOT NULL,
  address full_address
);

SELECT name, (address).city FROM customers;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How does PostgreSQL compare with MySQL?">
            <p>
              Both are free SQL databases and both are good. Postgres leans toward correctness and features. MySQL leans toward simple, very fast
              read-heavy setups and has a longer history in shared hosting.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Data correctness:</strong> Postgres rejects bad values by default. MySQL historically accepted them more easily in older modes</li>
              <li><strong>Schema changes:</strong> Postgres can run most DDL inside a transaction and roll it back. MySQL cannot roll back DDL</li>
              <li><strong>Features:</strong> Postgres has stronger JSONB, arrays, window functions, CTEs, partial indexes, and extensions</li>
              <li><strong>Concurrency:</strong> Both use MVCC. Postgres keeps old row versions in the table and cleans them with VACUUM; MySQL InnoDB uses an undo log</li>
              <li><strong>Replication:</strong> MySQL has a long history of easy read replicas; Postgres has streaming and logical replication, plus tools like Patroni for failover</li>
              <li>Honest answer: pick Postgres for complex queries and strict data rules, MySQL if the team already knows it well</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why do teams choose PostgreSQL for new projects?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>One database for many needs:</strong> relational tables, JSONB documents, full-text search, and geo data with PostGIS</li>
              <li><strong>No license cost:</strong> and it runs everywhere, from a laptop to every major cloud</li>
              <li><strong>Safe migrations:</strong> most schema changes can be wrapped in a transaction</li>
              <li><strong>Strong tooling:</strong> Prisma, Drizzle, Hibernate, Django, and Rails all support it well</li>
              <li><strong>Good query planner:</strong> handles joins, CTEs, and window functions that reporting needs</li>
              <li>The practical benefit: fewer moving parts. You delay adding Mongo, Elasticsearch, or Redis until you truly need them</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="When would you NOT choose PostgreSQL?">
            <p>
              Interviewers like this question because it shows you are not just a fan. Postgres is a single-writer, single-node database by default,
              so some workloads fit other tools better.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Very high write volume across regions:</strong> a multi-writer store such as Cassandra, or a Postgres-compatible distributed database like CockroachDB or Yugabyte, fits better</li>
              <li><strong>Pure caching or rate limiting:</strong> Redis is far cheaper per operation</li>
              <li><strong>Huge analytics scans:</strong> a column store such as ClickHouse, BigQuery, or Snowflake beats row storage. Inside Postgres you can reach for extensions first</li>
              <li><strong>Massive blob storage:</strong> put files in S3 or similar and keep only the key in Postgres</li>
              <li><strong>Very large connection counts with no pooler:</strong> each connection is a process, so you must add PgBouncer or similar</li>
              <li>Good closing line: start on Postgres, then move only the one workload that outgrows it</li>
            </ul>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
