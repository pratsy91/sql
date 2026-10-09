import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Search Extensions - Module 14 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on pg_trgm trigram search, hstore vs JSONB, trigram vs full-text search, unaccent for accent-insensitive search, and when to move to a dedicated search engine.',
};

export default function Module14Lesson03SearchExtensions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Search Extensions</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Users type half a word, spell names wrong, and leave out accents. These extensions are how
          PostgreSQL copes: <code>pg_trgm</code> for fuzzy matching, <code>unaccent</code> for stripping
          accent marks, and <code>hstore</code> as the older key-value type you should know but rarely
          choose.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is hstore? How does it compare to JSONB?">
            <p>
              <code>hstore</code> stores a flat set of key and value pairs, where both are strings. It came
              long before JSON support existed in PostgreSQL. <code>JSONB</code> does everything hstore does
              and much more: nested objects, arrays, real numbers, booleans, richer operators, and better
              index options.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>hstore</strong>: flat only, values are always text, no nesting, no arrays.
              </li>
              <li>
                <strong>JSONB</strong>: nested structures, real data types, path queries, GIN indexing, and it
                is part of core PostgreSQL with no extension needed.
              </li>
              <li>
                For a new design, choose JSONB. Mention hstore as the legacy option you would keep if you
                inherited it, and note that converting is a one-line cast.
              </li>
            </ul>
            <CodeBlock
              title="hstore, and converting to JSONB"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS hstore;

CREATE TABLE settings (
  id   INT PRIMARY KEY,
  data HSTORE
);

INSERT INTO settings VALUES (1, 'theme => dark, lang => en');
SELECT data -> 'theme' FROM settings;       -- always returns text

-- Migrating an old column to JSONB
ALTER TABLE settings
  ALTER COLUMN data TYPE JSONB USING hstore_to_jsonb(data);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What does pg_trgm do?">
            <p>
              A <strong>trigram</strong> is a group of three consecutive characters. <code>pg_trgm</code>{' '}
              breaks text into trigrams so PostgreSQL can measure how similar two strings are, and can index
              those trigrams. That gives you two things a normal B-tree index cannot: fuzzy matching of
              misspelled words, and fast <code>LIKE</code> or <code>ILIKE</code> searches with a leading
              wildcard.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>similarity(a, b)</code> returns a score from 0 to 1.
              </li>
              <li>
                The <code>%</code> operator is true when the score passes a threshold you control with{' '}
                <code>pg_trgm.similarity_threshold</code>.
              </li>
              <li>
                <code>&lt;-&gt;</code> is the distance operator, which is <code>1 - similarity</code>, so you
                can order by closeness.
              </li>
              <li>
                A GIN index with <code>gin_trgm_ops</code> is the usual choice. GiST with{' '}
                <code>gist_trgm_ops</code> is smaller and supports nearest-neighbour ordering.
              </li>
              <li>
                Typical uses: typeahead search, admin lookup of customer names, catching typos.
              </li>
            </ul>
            <CodeBlock
              title="Trigram similarity and index"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX users_name_trgm ON users USING GIN (name gin_trgm_ops);

-- How similar are these strings?
SELECT similarity('jonathan', 'jonathon');   -- about 0.6

-- Fuzzy match, ordered by best score
SELECT name, similarity(name, 'jonathon') AS score
FROM users
WHERE name % 'jonathon'
ORDER BY score DESC
LIMIT 20;

-- Leading wildcard search now uses the index
SELECT name FROM users WHERE name ILIKE '%than%';

-- Tune how strict % is (default 0.3)
SET pg_trgm.similarity_threshold = 0.4;`}
            />
            <CodeBlock
              title="Trigram search from Prisma"
              language="typescript"
              code={`// Prisma has no trigram operator, so use parameterised raw SQL
const sql = [
  'SELECT id, name, similarity(name, $1) AS score',
  'FROM users',
  'WHERE name % $1',
  'ORDER BY score DESC',
  'LIMIT 20',
].join(' ');

const rows = await prisma.$queryRawUnsafe(sql, query);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Trigram search or built-in full-text search: which one and why?"
          >
            <p>
              They solve different problems and interviewers like to see that you know the difference rather
              than treating both as &quot;search&quot;.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Full-text search</strong> works on <em>words</em>. It splits text into tokens, applies
                stemming so &quot;running&quot; matches &quot;run&quot;, drops stop words, and ranks results.
                It is the right tool for documents, articles, and product descriptions.
              </li>
              <li>
                <strong>Trigram search</strong> works on <em>characters</em>. It knows nothing about language
                or word meaning, so it handles typos, partial words, and short identifiers such as SKUs,
                names, and phone numbers.
              </li>
            </ul>
            <p>
              Concrete contrast: search for <code>databse</code> (misspelled). Full-text finds nothing,
              because the token does not exist. Trigram still finds <code>database</code>, because most of the
              character triples overlap. Now search for <code>running shoes</code> in a long description.
              Full-text matches <code>run</code> and ranks by relevance. Trigram gives a weak similarity score
              on a long string and ranks badly.
            </p>
            <p>
              Strong answer: use full-text for prose, use trigram for names and typo tolerance, and combine
              them when the product needs both. Run full-text first and fall back to trigram when it returns
              too few rows.
            </p>
            <CodeBlock
              title="Full-text first, trigram as the fallback"
              language="sql"
              code={`-- Word based: stemming and ranking
SELECT id, title, ts_rank(document, q) AS rank
FROM articles, websearch_to_tsquery('english', 'running shoes') q
WHERE document @@ q
ORDER BY rank DESC
LIMIT 20;

-- Character based: survives a typo
SELECT id, title, similarity(title, 'databse') AS score
FROM articles
WHERE title % 'databse'
ORDER BY score DESC
LIMIT 20;

-- Both: exact word hits first, fuzzy hits after
SELECT id, title, 1 AS tier FROM articles
WHERE document @@ websearch_to_tsquery('english', 'databse')
UNION ALL
SELECT id, title, 2 AS tier FROM articles
WHERE title % 'databse'
ORDER BY tier, title
LIMIT 20;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you make search ignore accents? What does unaccent do?"
          >
            <p>
              <code>unaccent</code> is a text search dictionary that strips accent marks, so{' '}
              <code>José</code> becomes <code>Jose</code> and <code>Müller</code> becomes{' '}
              <code>Muller</code>. Without it, a user typing <code>Muller</code> never finds{' '}
              <code>Müller</code>, because to the database those are different characters.
            </p>
            <p>
              The catch that trips people up: <code>unaccent()</code> is not marked immutable, so you cannot
              put it directly in an index expression. You wrap it in your own <code>IMMUTABLE</code> function
              that names the dictionary explicitly, then index that. Be aware this is technically a promise
              you are making, so do not change the dictionary afterwards without reindexing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Apply it on both sides: the stored value and the search input.</li>
              <li>
                Combine it with <code>lower()</code> for case-insensitive and accent-insensitive search.
              </li>
              <li>
                For full-text search, build a custom configuration that puts <code>unaccent</code> in front of
                the stemmer.
              </li>
            </ul>
            <CodeBlock
              title="Accent-insensitive trigram search"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT unaccent('José Müller');   -- Jose Muller

-- Wrapper so it can be used in an index
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
'SELECT public.unaccent(''public.unaccent'', $1)';

CREATE INDEX users_name_unaccent_trgm
  ON users USING GIN (immutable_unaccent(lower(name)) gin_trgm_ops);

-- The query must use the exact same expression
SELECT name FROM users
WHERE immutable_unaccent(lower(name)) % immutable_unaccent(lower('muller'));`}
            />
            <CodeBlock
              title="Accent-insensitive full-text configuration"
              language="sql"
              code={`CREATE TEXT SEARCH CONFIGURATION en_unaccent ( COPY = english );

ALTER TEXT SEARCH CONFIGURATION en_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, english_stem;

SELECT to_tsvector('en_unaccent', 'Crème brûlée recipes');
-- tokens are stored without accents, so 'creme brulee' matches`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard
            level="Senior"
            question="When should fuzzy search move out of PostgreSQL into a dedicated search engine?"
          >
            <p>
              PostgreSQL search is excellent value: no extra system, no sync pipeline, and it joins directly
              against your real data with your real permissions. Start there. But name the signals that mean
              you have outgrown it, because that judgement is what the question is testing.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Trigram indexes stop being fast.</strong> GIN trigram indexes grow large and get slow
                once the searched text is long and the table is tens of millions of rows, especially with
                short query strings that match many trigrams.
              </li>
              <li>
                <strong>Search becomes a product, not a feature.</strong> Typo tolerance per field, synonyms,
                faceting, per-user ranking models, and click-through learning are things a search engine gives
                you and PostgreSQL does not.
              </li>
              <li>
                <strong>Write amplification hurts.</strong> Maintaining several GIN indexes slows every insert
                and update on a hot table, and GIN updates create bloat.
              </li>
              <li>
                <strong>Search traffic threatens the transactional database.</strong> When autocomplete is the
                heaviest query on the primary, move it off rather than scaling the primary for it.
              </li>
              <li>
                <strong>Multi-language analysis</strong> beyond what the built-in dictionaries handle.
              </li>
            </ul>
            <p>
              And name the costs honestly, since candidates who jump straight to Elasticsearch usually miss
              these: a second datastore must be kept in sync, so you now own an indexing pipeline, eventual
              consistency, permission filtering in two places, reindex operations, and another thing to
              monitor and pay for.
            </p>
            <p>
              The middle path worth mentioning: keep PostgreSQL as the source of truth and stream changes to
              the search engine with logical replication or an outbox table. Query the engine for ranking and
              then fetch the authoritative rows from PostgreSQL by ID.
            </p>
            <CodeBlock
              title="Outbox pattern for feeding a search index"
              language="sql"
              code={`CREATE TABLE search_outbox (
  id         BIGSERIAL PRIMARY KEY,
  entity     TEXT NOT NULL,
  entity_id  UUID NOT NULL,
  op         TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION queue_search_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO search_outbox (entity, entity_id, op)
  VALUES ('product', COALESCE(NEW.id, OLD.id), lower(TG_OP));
  RETURN NULL;
END;
$$;

CREATE TRIGGER products_search_outbox
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION queue_search_update();`}
            />
            <CodeBlock
              title="Worker draining the outbox"
              language="typescript"
              code={`// Claim a batch without two workers taking the same rows
const claim = [
  'DELETE FROM search_outbox WHERE id IN (',
  '  SELECT id FROM search_outbox ORDER BY id',
  '  FOR UPDATE SKIP LOCKED LIMIT 500',
  ') RETURNING entity, entity_id, op',
].join(' ');

const batch = await prisma.$queryRawUnsafe(claim);

// Push to the search engine, then let the next tick pick up the rest
await searchClient.bulkIndex(batch);`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
