import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 11: Other Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL network, geometric, XML, and text-search types — inet vs cidr, PostGIS vs built-in geometry, XML vs JSON, tsvector',
};

export default function MaiqM02L11OtherTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 11: Other Types (Network, Geometric, XML, Text Search)</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          These types come up less often than JSONB, but interviewers still ask inet vs cidr, when to use PostGIS, XML vs JSON, and tsvector.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are INET, CIDR, and MACADDR?">
            <p>
              They are dedicated types for network addresses. Do not store IPs as <code>TEXT</code> if you need to query subnets.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>INET:</strong> an IPv4 or IPv6 address, optionally with a prefix length</li>
              <li><strong>CIDR:</strong> a network. Host bits must be zero. Use it for &quot;the 10.0.0.0/8 range&quot;</li>
              <li><strong>MACADDR / MACADDR8:</strong> hardware addresses</li>
              <li><code>&lt;&lt;</code> means &quot;is contained in this network&quot;. That is the operator interviewers want</li>
            </ul>
            <CodeBlock
              title="INET vs CIDR"
              language="sql"
              code={`CREATE TABLE servers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hostname   TEXT NOT NULL,
  ip_address INET NOT NULL
);

INSERT INTO servers (hostname, ip_address)
VALUES ('app-1', '192.168.1.100');

SELECT hostname FROM servers
WHERE ip_address << '192.168.1.0/24'::inet;

SELECT host(ip_address), family(ip_address) FROM servers;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is XML in PostgreSQL, and when would you use it instead of JSON?">
            <p>
              Postgres has an <code>XML</code> type and functions such as <code>xpath()</code>. For new applications, JSONB is almost always the better document type.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use XML when you must store or validate documents that already arrive as XML (invoices, SOAP, government schemas)</li>
              <li>JSONB has better indexing (GIN), a richer operator set, and first-class Prisma support</li>
              <li>XML is well-formed on insert. Invalid XML is rejected</li>
            </ul>
            <CodeBlock
              title="XML type"
              language="sql"
              code={`CREATE TABLE documents (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content XML NOT NULL
);

INSERT INTO documents (content)
VALUES ('<book><title>PostgreSQL Guide</title></book>');

SELECT xpath('//title/text()', content) FROM documents;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is the difference between built-in geometric types and PostGIS?">
            <p>
              Postgres ships with simple 2D types: <code>point</code>, <code>box</code>, <code>circle</code>, <code>polygon</code>, and a few more.
              PostGIS is the extension you use for real maps.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Built-in geometry is Cartesian 2D. No SRID, no geography, no proper distance on a globe</li>
              <li>PostGIS adds <code>geometry</code> / <code>geography</code>, spatial indexes, and functions such as <code>ST_DWithin</code></li>
              <li>Interview rule: a &quot;store lat/long and find nearby stores&quot; question is PostGIS (or at least a <code>point</code> plus earthdistance). Not two float columns with a homemade haversine in every query if you can avoid it</li>
              <li>Prisma has no native PostGIS type. You use raw SQL or a supporting library</li>
            </ul>
            <CodeBlock
              title="Built-in point"
              language="sql"
              code={`CREATE TABLE locations (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  coordinates POINT NOT NULL
);

INSERT INTO locations (name, coordinates)
VALUES ('HQ', point(77.5946, 12.9716));

SELECT name FROM locations
WHERE coordinates <-> point(77.6, 13.0) < 0.2;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are tsvector and tsquery?">
            <p>
              They are the built-in full-text search types. <code>tsvector</code> is a document, <code>tsquery</code> is a search. The operator is <code>@@</code>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><code>to_tsvector(&apos;english&apos;, body)</code> tokenises and stems the text</li>
              <li>Index with GIN on a stored generated <code>tsvector</code> column</li>
              <li><code>websearch_to_tsquery</code> is the friendliest way to turn a search box into a query (Postgres 11+)</li>
              <li>For fuzzy names you still want <code>pg_trgm</code>. Full-text search is not a substitute for trigram similarity</li>
            </ul>
            <CodeBlock
              title="Full-text search types"
              language="sql"
              code={`SELECT to_tsvector('english', 'Postgres indexes make queries fast')
       @@ to_tsquery('english', 'index & query');  -- true (stemming)

SELECT id, title
FROM articles
WHERE search @@ websearch_to_tsquery('english', 'postgres index');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="When do these 'other' types belong in a schema, and when do you skip them?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>INET:</strong> yes, if you query subnets, ban lists, or rate-limit by CIDR. TEXT plus application parsing will be slower and wrong at the edges (IPv6)</li>
              <li><strong>Geometric:</strong> skip for maps. Use PostGIS. Built-in types are fine for simple game boards or UI layout, not GIS</li>
              <li><strong>XML:</strong> only for inbound/outbound XML documents. Do not model your domain as XML in 2026</li>
              <li><strong>tsvector:</strong> yes for in-database search on millions of rows. For autocomplete, use trigram. For relevance across many document types, consider an external search engine</li>
              <li>Prisma does not map INET, geometry, XML, or tsvector as first-class scalars. Keep them in SQL migrations and query with typed raw SQL, or store a Prisma-friendly shadow column</li>
            </ul>
            <CodeBlock
              title="INET in Prisma via native type"
              language="typescript"
              code={`model Server {
  id        Int    @id @default(autoincrement())
  hostname  String
  ipAddress String @db.Inet
}`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
