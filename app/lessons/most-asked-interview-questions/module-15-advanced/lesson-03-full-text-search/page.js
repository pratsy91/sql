import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Full-Text Search - Module 15 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL full-text search interview questions: tsvector and tsquery, stored tsvector with GIN, to_tsquery vs plainto_tsquery vs websearch_to_tsquery, ts_rank, field weighting, and when to use Elasticsearch.',
};

export default function Module15Lesson03FullTextSearch() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Full-Text Search</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Full-text search means searching by words rather than by exact string match, so &quot;running&quot;
          finds &quot;run&quot; and common words like &quot;the&quot; are ignored. PostgreSQL has this built
          in, and interviewers want to know you can set it up properly and rank the results.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is full-text search in PostgreSQL at a high level?">
            <p>Four pieces, and naming them cleanly is most of the answer:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>tsvector</code>: your document turned into a sorted list of normalised words, called
                lexemes, with their positions. <code>to_tsvector</code> builds it.
              </li>
              <li>
                <code>tsquery</code>: the search terms, normalised the same way, combined with AND, OR, and
                NOT.
              </li>
              <li>
                <code>@@</code>: the match operator. It asks whether a <code>tsvector</code> satisfies a{' '}
                <code>tsquery</code>.
              </li>
              <li>
                <strong>GIN index</strong>: what makes it fast, plus <code>ts_rank</code> to order results by
                relevance.
              </li>
            </ul>
            <p>
              The normalisation step is the important idea. A text search configuration such as{' '}
              <code>english</code> lowercases the text, removes stop words, and stems each word to its root, so
              the stored form and the query form meet in the middle. This handles a great many applications
              without adding Elasticsearch.
            </p>
            <CodeBlock
              title="Basic full-text search"
              language="sql"
              code={`-- See what normalisation does
SELECT to_tsvector('english', 'PostgreSQL is running the indexes faster');
-- 'faster':6 'index':5 'postgresql':1 'run':3
-- note: 'is' and 'the' were dropped, 'running' became 'run'

SELECT to_tsquery('english', 'indexing');   -- 'index'

-- A match, even though no word matches literally
SELECT to_tsvector('english', 'PostgreSQL is running the indexes')
       @@ to_tsquery('english', 'index & run') AS matched;   -- true

SELECT title
FROM articles
WHERE to_tsvector('english', body) @@ plainto_tsquery('english', 'postgres indexing');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="How do you set up production-grade full-text search with tsvector plus GIN?"
          >
            <p>
              The query in the previous answer works but is slow, because{' '}
              <code>to_tsvector(&apos;english&apos;, body)</code> is computed for every row on every search.
              Production means computing it once, on write, into a stored column and indexing that.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use a <code>STORED</code> generated column. Before PostgreSQL 12 you needed a trigger, and you
                may still see that in older codebases.
              </li>
              <li>
                Always name the configuration explicitly, such as <code>&apos;english&apos;</code>. Relying on
                the <code>default_text_search_config</code> setting is not immutable and the generated column
                will be rejected.
              </li>
              <li>
                Wrap every column in <code>coalesce(col, &apos;&apos;)</code>, because concatenating a NULL
                makes the whole vector NULL.
              </li>
              <li>
                Use <code>setweight</code> to mark which field each word came from, so you can rank title
                matches above body matches.
              </li>
              <li>
                Index it with <strong>GIN</strong>. GiST is smaller but lossy and slower for search. Build it{' '}
                <code>CONCURRENTLY</code> on a live table.
              </li>
            </ul>
            <CodeBlock
              title="Stored tsvector plus GIN"
              language="sql"
              code={`ALTER TABLE articles
  ADD COLUMN document tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED;

CREATE INDEX CONCURRENTLY articles_document_idx
  ON articles USING GIN (document);

-- Fast, ranked search
SELECT title, ts_rank(document, q) AS rank
FROM articles, plainto_tsquery('english', 'replication lag') q
WHERE document @@ q
ORDER BY rank DESC
LIMIT 20;

-- Confirm the index is used
EXPLAIN (ANALYZE, COSTS OFF)
SELECT id FROM articles
WHERE document @@ plainto_tsquery('english', 'replication lag');`}
            />
            <CodeBlock
              title="Prisma side"
              language="prisma"
              code={`model Article {
  id       String  @id @default(cuid())
  title    String
  summary  String?
  body     String
  // Maintained by PostgreSQL; Prisma cannot model tsvector natively
  document Unsupported("tsvector")?

  @@map("articles")
}`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="to_tsquery vs plainto_tsquery vs websearch_to_tsquery: which one do you use?"
          >
            <p>
              All three turn a string into a <code>tsquery</code>. They differ in how much syntax the user is
              allowed to type and what happens when the input is messy.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>to_tsquery</code>: expects real operator syntax with <code>&amp;</code>, <code>|</code>,{' '}
                <code>!</code>, and <code>&lt;-&gt;</code>. Most powerful, and it{' '}
                <strong>throws a syntax error</strong> on arbitrary user input. Never pass a raw search box to
                it.
              </li>
              <li>
                <code>plainto_tsquery</code>: takes plain text, ignores punctuation, and joins every word with
                AND. Safe, but the user cannot express OR or a phrase, and one unusual word makes the whole
                search return nothing.
              </li>
              <li>
                <code>phraseto_tsquery</code>: joins words with the followed-by operator, so it matches only an
                actual phrase in order.
              </li>
              <li>
                <code>websearch_to_tsquery</code>, added in PostgreSQL 11: understands the syntax users
                already know from web search engines. Quoted phrases, <code>or</code>, and a leading{' '}
                <code>-</code> to exclude. It never raises a syntax error on bad input.
              </li>
            </ul>
            <p>
              Recommendation for a user-facing search box: <code>websearch_to_tsquery</code>. It is safe against
              malformed input and gives users useful control. Use <code>to_tsquery</code> only for queries your
              own code constructs, such as adding <code>:*</code> for prefix matching in autocomplete.
            </p>
            <CodeBlock
              title="The same input through each function"
              language="sql"
              code={`SELECT websearch_to_tsquery('english', '"read replica" or failover -kafka');
-- ( 'read' <-> 'replica' | 'failov' ) & !'kafka'

SELECT plainto_tsquery('english', 'read replica failover');
-- 'read' & 'replica' & 'failov'   (everything ANDed)

SELECT phraseto_tsquery('english', 'read replica');
-- 'read' <-> 'replica'            (must be adjacent)

SELECT to_tsquery('english', 'replica & !kafka');
-- works, but this input would crash it:
-- SELECT to_tsquery('english', 'replica &');   -- syntax error

-- Prefix matching for autocomplete: build it yourself
SELECT to_tsquery('english', 'repl:*');`}
            />
            <CodeBlock
              title="Safe autocomplete from Prisma"
              language="typescript"
              code={`// Strip anything that is not a word character, then add the prefix marker
function toPrefixQuery(input) {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\\s]/g, ' ')
    .split(/\\s+/)
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => w + ':*').join(' & ');
}

const tsq = toPrefixQuery(userInput);
if (tsq) {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT id, title FROM articles WHERE document @@ to_tsquery($1, $2) LIMIT 10',
    'english',
    tsq
  );
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you rank results with ts_rank?">
            <p>
              <code>@@</code> only tells you whether a row matches. <code>ts_rank</code> tells you{' '}
              <em>how well</em>, returning a number you sort by. Without it your search results come back in
              whatever order the index produced, which users read as broken.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>ts_rank</code> scores by how often and how prominently the terms appear.
              </li>
              <li>
                <code>ts_rank_cd</code> also considers <strong>cover density</strong>, meaning how close the
                matched words are to each other. It is usually better for multi-word queries.
              </li>
              <li>
                Compute the <code>tsquery</code> once, not twice. Put it in a <code>CROSS JOIN</code>, a CTE, or
                a lateral join so it is not evaluated per row in both places.
              </li>
              <li>
                Ranking is <strong>not indexable</strong>. PostgreSQL must score every matching row, so a query
                that matches a million rows is slow no matter what. Narrow the match first, then rank.
              </li>
              <li>
                Blend in business signals. Pure text relevance rarely gives the best ordering on its own, so
                combine it with recency or popularity.
              </li>
              <li>
                <code>ts_headline</code> produces the highlighted snippet for the results page. It is expensive,
                so apply it only to the rows you are about to display.
              </li>
            </ul>
            <CodeBlock
              title="Ranking, blending, and highlighting"
              language="sql"
              code={`-- Compute the query once
WITH q AS (SELECT websearch_to_tsquery('english', 'replication lag') AS tsq)
SELECT a.title,
       ts_rank_cd(a.document, q.tsq) AS rank
FROM articles a, q
WHERE a.document @@ q.tsq
ORDER BY rank DESC
LIMIT 20;

-- Blend relevance with freshness so new articles surface
WITH q AS (SELECT websearch_to_tsquery('english', 'replication lag') AS tsq)
SELECT a.title,
       ts_rank_cd(a.document, q.tsq) * exp(
         -extract(epoch FROM now() - a.published_at) / (86400 * 30)
       ) AS score
FROM articles a, q
WHERE a.document @@ q.tsq
ORDER BY score DESC
LIMIT 20;

-- Highlight only the page of rows you will render
WITH q AS (SELECT websearch_to_tsquery('english', 'replication lag') AS tsq),
hits AS (
  SELECT a.id, a.title, a.body, ts_rank_cd(a.document, q.tsq) AS rank
  FROM articles a, q
  WHERE a.document @@ q.tsq
  ORDER BY rank DESC
  LIMIT 20
)
SELECT h.id, h.title,
       ts_headline('english', h.body,
                   (SELECT tsq FROM q),
                   'MaxWords=30, MinWords=10') AS snippet
FROM hits h ORDER BY h.rank DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you make a title count more than the body?"
          >
            <p>
              Use <code>setweight</code>. Every lexeme in a <code>tsvector</code> can carry a label from{' '}
              <code>A</code> to <code>D</code>, and ranking functions apply a different multiplier to each
              label. So you tag title words <code>A</code> and body words <code>C</code>, and a title match
              scores higher automatically.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The default multipliers are <code>{'{ D: 0.1, C: 0.2, B: 0.4, A: 1.0 }'}</code>. Note the array
                passed to <code>ts_rank</code> is ordered D, C, B, A, which is backwards from how people expect
                and a very common bug.
              </li>
              <li>
                Labels are stored in the vector, so you set them once when building the generated column.
              </li>
              <li>
                You can override the weights per query, which lets you tune ranking without rebuilding the
                index.
              </li>
              <li>
                Weights also let you restrict a search to one field, by filtering on the label.
              </li>
            </ul>
            <CodeBlock
              title="Weighted vector and custom weights"
              language="sql"
              code={`-- Labels assigned once, when the column is generated
ALTER TABLE articles
  ADD COLUMN document tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tags, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED;

-- See the labels
SELECT setweight(to_tsvector('english', 'Replication basics'), 'A');
-- 'basic':2A 'replic':1A

-- Default weighting: a title hit already outranks a body hit
WITH q AS (SELECT websearch_to_tsquery('english', 'replication') AS tsq)
SELECT title, ts_rank(document, q.tsq) AS rank
FROM articles, q WHERE document @@ q.tsq ORDER BY rank DESC;

-- Push the title even harder. The array order is {D, C, B, A}.
WITH q AS (SELECT websearch_to_tsquery('english', 'replication') AS tsq)
SELECT title,
       ts_rank('{0.05, 0.1, 0.4, 1.0}', document, q.tsq) AS rank
FROM articles, q WHERE document @@ q.tsq ORDER BY rank DESC;

-- Title-only search: keep just the A lexemes
SELECT title FROM articles
WHERE ts_filter(document, '{a}') @@ websearch_to_tsquery('english', 'replication');`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="When do you leave PostgreSQL full-text search for Elasticsearch?"
          >
            <p>
              Start with PostgreSQL. It is already there, it is transactional, results join directly against
              your live data, and permission filtering happens in the same query. Then name the specific limits
              that justify a second system, because a candidate who reaches for Elasticsearch by default is
              guessing.
            </p>
            <p>Signals that you have outgrown it:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Ranking cannot be indexed.</strong> Once a common query matches hundreds of thousands of
                rows, PostgreSQL must score them all before it can sort. This is the real ceiling, and it
                arrives sooner than people expect.
              </li>
              <li>
                <strong>Search relevance becomes a product.</strong> Synonyms, per-field fuzziness,
                learning-to-rank, personalised results, and query suggestions are features Elasticsearch ships
                and PostgreSQL does not.
              </li>
              <li>
                <strong>Faceted search at scale.</strong> Counting matches per category over a large result set
                on every keystroke is what an inverted-index engine is built for.
              </li>
              <li>
                <strong>Write amplification.</strong> A large GIN index slows every insert and update on the
                table and generates bloat. When search indexing starts hurting your transactional write path,
                move it.
              </li>
              <li>
                <strong>Language coverage.</strong> The bundled dictionaries are good, but not comparable to
                dedicated analysers for many languages, or for CJK text.
              </li>
              <li>
                <strong>Multi-source search.</strong> When one search box must span several services or
                databases, an external index is the natural home.
              </li>
            </ul>
            <p>Then state the costs honestly, which is what separates a senior answer:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You now own a sync pipeline, and it will drift. Results can show deleted rows and miss new
                ones.
              </li>
              <li>
                Permissions must be enforced twice, and getting this wrong leaks data across tenants.
              </li>
              <li>
                Reindexing, cluster sizing, version upgrades, and on-call coverage are all new work.
              </li>
              <li>No transactions, so the index is always eventually consistent with the database.</li>
            </ul>
            <p>
              The middle path to propose: keep PostgreSQL as the source of truth and feed the search engine from
              an outbox table or logical replication. Query the engine for IDs and ranking, then fetch the
              authoritative rows from PostgreSQL. Also try the cheaper fixes first, because they often buy you
              years: filter before ranking, restrict the searchable corpus with a partial index, cache popular
              queries, or precompute a materialised view for the common case.
            </p>
            <CodeBlock
              title="Cheaper fixes to try before adding a second system"
              language="sql"
              code={`-- 1. Narrow the corpus with a partial index
CREATE INDEX articles_published_doc_idx
  ON articles USING GIN (document)
  WHERE published_at IS NOT NULL AND deleted_at IS NULL;

-- 2. Filter hard before ranking, so fewer rows need scoring
WITH q AS (SELECT websearch_to_tsquery('english', $1) AS tsq),
candidates AS (
  SELECT id, title, document
  FROM articles, q
  WHERE document @@ q.tsq
    AND published_at > now() - interval '2 years'
  LIMIT 2000                      -- cap the work, then rank the cap
)
SELECT c.id, c.title, ts_rank_cd(c.document, q.tsq) AS rank
FROM candidates c, q
ORDER BY rank DESC
LIMIT 20;

-- 3. Precompute results for the hottest queries
CREATE MATERIALIZED VIEW popular_search_results AS
SELECT t.term,
       a.id AS article_id,
       ts_rank_cd(a.document, websearch_to_tsquery('english', t.term)) AS rank
FROM popular_terms t
JOIN articles a
  ON a.document @@ websearch_to_tsquery('english', t.term);

CREATE UNIQUE INDEX popular_search_results_key
  ON popular_search_results (term, article_id);

REFRESH MATERIALIZED VIEW CONCURRENTLY popular_search_results;`}
            />
            <CodeBlock
              title="If you do move: PostgreSQL stays the source of truth"
              language="typescript"
              code={`// 1. Search engine returns ranked IDs only
const hits = await searchClient.search({ index: 'articles', query });
const ids = hits.map((h) => h.id);

// 2. PostgreSQL returns the authoritative rows, with real permissions applied
const rows = await prisma.article.findMany({
  where: { id: { in: ids }, tenantId, deletedAt: null },
});

// 3. Restore the engine's ranking order
const byId = new Map(rows.map((r) => [r.id, r]));
const ordered = ids.map((id) => byId.get(id)).filter(Boolean);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
