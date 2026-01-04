import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Full-Text Search (Advanced) - PostgreSQL Learning',
  description: 'Learn about advanced PostgreSQL full-text search including custom dictionaries and custom configurations',
};

export default function FulltextSearchAdvanced() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Full-Text Search (Advanced)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Custom Dictionaries</h2>

          <CodeBlock
            title="SQL: Custom Dictionary Configuration"
            language="sql"
            code={`-- View available dictionaries
SELECT 
  dictname,
  dictinitoption
FROM pg_ts_dict
ORDER BY dictname;

-- Create custom dictionary (requires dictionary file)
-- Dictionary files are in: $sharedir/tsearch_data/

-- Use custom dictionary in text search configuration
CREATE TEXT SEARCH CONFIGURATION my_config (COPY = english);

-- Alter configuration to use custom dictionary
ALTER TEXT SEARCH CONFIGURATION my_config
ALTER MAPPING FOR asciiword, word
WITH unaccent, my_custom_dict, english_stem;

-- View text search configurations
SELECT 
  cfgname,
  cfgowner::regrole AS owner
FROM pg_ts_config
ORDER BY cfgname;

-- View configuration mappings
SELECT 
  c.cfgname,
  t.alias AS token_type,
  d.dictname
FROM pg_ts_config c
JOIN pg_ts_config_map m ON c.oid = m.mapcfg
JOIN pg_ts_parser p ON c.cfgparser = p.oid
JOIN pg_ts_token_type t ON p.prsstart = t.tokid
JOIN pg_ts_dict d ON m.mapdict = d.oid
WHERE c.cfgname = 'my_config'
ORDER BY t.alias;

-- Test text search configuration
SELECT to_tsvector('my_config', 'The quick brown fox');
SELECT to_tsquery('my_config', 'quick & fox');

-- Use custom configuration
SELECT *
FROM documents
WHERE to_tsvector('my_config', content) @@ to_tsquery('my_config', 'search term');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Custom Configurations</h2>

          <CodeBlock
            title="SQL: Text Search Configurations"
            language="sql"
            code={`-- Create custom text search configuration
CREATE TEXT SEARCH CONFIGURATION my_config (COPY = english);

-- Alter configuration mappings
ALTER TEXT SEARCH CONFIGURATION my_config
ALTER MAPPING FOR asciiword, word
WITH unaccent, english_stem;

-- Add mapping for specific token types
ALTER TEXT SEARCH CONFIGURATION my_config
ALTER MAPPING FOR asciiword
WITH unaccent, english_stem;

ALTER TEXT SEARCH CONFIGURATION my_config
ALTER MAPPING FOR word
WITH unaccent, english_stem;

-- Remove mapping
ALTER TEXT SEARCH CONFIGURATION my_config
DROP MAPPING FOR asciiword;

-- Add mapping for multiple token types
ALTER TEXT SEARCH CONFIGURATION my_config
ALTER MAPPING FOR asciiword, word, numword
WITH unaccent, english_stem;

-- View configuration details
SELECT 
  cfgname,
  cfgparser::regproc AS parser
FROM pg_ts_config
WHERE cfgname = 'my_config';

-- Test configuration
SELECT 
  to_tsvector('my_config', 'The PostgreSQL database') AS vector,
  to_tsquery('my_config', 'PostgreSQL & database') AS query;

-- Use configuration in queries
SELECT *
FROM documents
WHERE to_tsvector('my_config', content) @@ to_tsquery('my_config', 'search');

-- Set default configuration
SET default_text_search_config = 'my_config';

-- Check current configuration
SHOW default_text_search_config;

-- Use default configuration (no need to specify)
SELECT to_tsvector('The quick brown fox');
SELECT to_tsquery('quick & fox');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Advanced Text Search</h2>

          <CodeBlock
            title="SQL: Advanced Text Search Features"
            language="sql"
            code={`-- Phrase search
SELECT *
FROM documents
WHERE to_tsvector('english', content) @@ phraseto_tsquery('english', 'PostgreSQL database');

-- Proximity search
SELECT *
FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'PostgreSQL <-> database');
-- <-> means adjacent, <2> means within 2 words

-- Weighted search
SELECT 
  title,
  content,
  ts_rank(
    to_tsvector('english', title || ' ' || content),
    to_tsquery('english', 'search')
  ) AS rank
FROM documents
ORDER BY rank DESC;

-- Weighted tsvector
SELECT 
  title,
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', content), 'B') AS weighted_vector
FROM documents;

-- Rank with weights
SELECT 
  title,
  ts_rank_cd(
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', content), 'B'),
    to_tsquery('english', 'search')
  ) AS rank
FROM documents
ORDER BY rank DESC;

-- Highlight matches
SELECT 
  title,
  ts_headline(
    'english',
    content,
    to_tsquery('english', 'search'),
    'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
  ) AS headline
FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'search');

-- Multiple search terms
SELECT *
FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'PostgreSQL | database | query');

-- Negation in search
SELECT *
FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'PostgreSQL & !database');

-- Search with prefix
SELECT *
FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'Postgre:*');

-- Search in multiple columns
SELECT *
FROM documents
WHERE 
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')) 
  @@ to_tsquery('english', 'search');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Text Search Indexes</h2>

          <CodeBlock
            title="SQL: Text Search Indexes"
            language="sql"
            code={`-- GIN index on tsvector
CREATE INDEX idx_documents_content_tsvector 
ON documents USING gin(to_tsvector('english', content));

-- Query using index
SELECT *
FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'search');

-- Pre-computed tsvector column
ALTER TABLE documents ADD COLUMN content_tsvector tsvector;

-- Create trigger to update tsvector
CREATE TRIGGER documents_tsvector_update
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(content_tsvector, 'pg_catalog.english', content);

-- Or use generated column (PostgreSQL 12+)
ALTER TABLE documents 
ADD COLUMN content_tsvector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create index on generated column
CREATE INDEX idx_documents_content_tsvector 
ON documents USING gin(content_tsvector);

-- Query using pre-computed tsvector
SELECT *
FROM documents
WHERE content_tsvector @@ to_tsquery('english', 'search');

-- GIN index with jsonb_path_ops (for JSONB full-text search)
CREATE INDEX idx_documents_data_tsvector 
ON documents USING gin(to_tsvector('english', data::text));

-- Composite index with tsvector
CREATE INDEX idx_documents_composite 
ON documents USING gin(content_tsvector, status);

-- Partial index on tsvector
CREATE INDEX idx_documents_active_tsvector 
ON documents USING gin(content_tsvector)
WHERE status = 'active';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Advanced Full-Text Search</h2>

          <CodeBlock
            title="Prisma: Advanced Text Search"
            language="prisma"
            code={`// Prisma doesn't have direct full-text search support
// Use raw SQL for advanced text search

// Create text search configuration
await prisma.$executeRaw\`
  CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS my_config (COPY = english)
\`;

// Alter configuration
await prisma.$executeRaw\`
  ALTER TEXT SEARCH CONFIGURATION my_config
  ALTER MAPPING FOR asciiword, word
  WITH unaccent, english_stem
\`;

// Create tsvector column
await prisma.$executeRaw\`
  ALTER TABLE "Document" 
  ADD COLUMN IF NOT EXISTS content_tsvector tsvector
\`;

// Create generated column (PostgreSQL 12+)
await prisma.$executeRaw\`
  ALTER TABLE "Document"
  ADD COLUMN content_tsvector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
\`;

// Create GIN index
await prisma.$executeRaw\`
  CREATE INDEX idx_documents_content_tsvector 
  ON "Document" USING gin(content_tsvector)
\`;

// Full-text search query
const results = await prisma.$queryRaw\`
  SELECT 
    id,
    title,
    content,
    ts_rank(content_tsvector, to_tsquery('english', $1)) AS rank
  FROM "Document"
  WHERE content_tsvector @@ to_tsquery('english', $1)
  ORDER BY rank DESC
\`, 'search term';

// Phrase search
const phraseResults = await prisma.$queryRaw\`
  SELECT *
  FROM "Document"
  WHERE content_tsvector @@ phraseto_tsquery('english', $1)
\`, 'exact phrase';

// Highlight matches
const highlighted = await prisma.$queryRaw\`
  SELECT 
    id,
    title,
    ts_headline(
      'english',
      content,
      to_tsquery('english', $1),
      'StartSel=<mark>, StopSel=</mark>'
    ) AS headline
  FROM "Document"
  WHERE content_tsvector @@ to_tsquery('english', $1)
\`, 'search term';

// Weighted search
const weighted = await prisma.$queryRaw\`
  SELECT 
    id,
    title,
    ts_rank_cd(
      setweight(to_tsvector('english', title), 'A') ||
      setweight(to_tsvector('english', content), 'B'),
      to_tsquery('english', $1)
    ) AS rank
  FROM "Document"
  WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('english', $1)
  ORDER BY rank DESC
\`, 'search term';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use pre-computed tsvector</strong> - faster than computing on-the-fly</li>
              <li><strong>Create GIN indexes</strong> - essential for performance</li>
              <li><strong>Use appropriate configuration</strong> - match your language/content</li>
              <li><strong>Use weights</strong> - prioritize important fields</li>
              <li><strong>Monitor index size</strong> - GIN indexes can be large</li>
              <li><strong>Use phrase search</strong> - for exact phrase matching</li>
              <li><strong>Test ranking functions</strong> - ts_rank vs ts_rank_cd</li>
              <li><strong>Use highlighting</strong> - improve user experience</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

