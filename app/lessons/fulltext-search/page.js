import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Full-text search - PostgreSQL Learning',
  description: 'Learn about full-text search in PostgreSQL including to_tsvector, to_tsquery, operators, and ranking functions',
};

export default function FulltextSearch() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Full-text search</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">to_tsvector and to_tsquery</h2>

          <CodeBlock
            title="SQL: to_tsvector and to_tsquery"
            language="sql"
            code={`-- to_tsvector (convert text to search vector)
SELECT to_tsvector('english', 'PostgreSQL is a powerful database');
-- Result: 'power':4 'postgresql':1

-- to_tsquery (convert text to search query)
SELECT to_tsquery('english', 'postgresql & database');

-- Full-text search
SELECT * FROM documents 
WHERE search_vector @@ to_tsquery('english', 'postgresql & database');

-- Search operators in tsquery:
-- & (AND), | (OR), ! (NOT), <-> (followed by)

-- Examples
SELECT * FROM documents 
WHERE search_vector @@ to_tsquery('english', 'postgresql | sql');

SELECT * FROM documents 
WHERE search_vector @@ to_tsquery('english', '!mysql');

SELECT * FROM documents 
WHERE search_vector @@ to_tsquery('english', 'postgresql <-> database');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Full-text Search Operators</h2>

          <CodeBlock
            title="SQL: Full-text Search Operators"
            language="sql"
            code={`-- @@ (matches)
SELECT * FROM documents 
WHERE search_vector @@ to_tsquery('english', 'postgresql');

-- Plain text search (auto-converts to tsquery)
SELECT * FROM documents 
WHERE search_vector @@ plainto_tsquery('english', 'postgresql database');

-- Phrase search
SELECT * FROM documents 
WHERE search_vector @@ phraseto_tsquery('english', 'postgresql database');

-- Web search (handles operators in user input)
SELECT * FROM documents 
WHERE search_vector @@ websearch_to_tsquery('english', 'postgresql database');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ranking Functions</h2>

          <CodeBlock
            title="SQL: Ranking Functions"
            language="sql"
            code={`-- ts_rank (ranking based on frequency)
SELECT 
  id,
  title,
  ts_rank(search_vector, to_tsquery('english', 'postgresql')) AS rank
FROM documents
WHERE search_vector @@ to_tsquery('english', 'postgresql')
ORDER BY rank DESC;

-- ts_rank_cd (coverage density ranking)
SELECT 
  id,
  title,
  ts_rank_cd(search_vector, to_tsquery('english', 'postgresql')) AS rank
FROM documents
WHERE search_vector @@ to_tsquery('english', 'postgresql')
ORDER BY rank DESC;

-- Ranking with normalization
SELECT 
  id,
  title,
  ts_rank(search_vector, query, 32) AS rank  -- 32 = normalize by document length
FROM documents, to_tsquery('english', 'postgresql') query
WHERE search_vector @@ query
ORDER BY rank DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Highlighting Matches</h2>

          <CodeBlock
            title="SQL: Highlighting"
            language="sql"
            code={`-- ts_headline (highlight matching text)
SELECT 
  id,
  title,
  ts_headline('english', content, to_tsquery('english', 'postgresql')) AS headline
FROM documents
WHERE search_vector @@ to_tsquery('english', 'postgresql');

-- ts_headline with options
SELECT 
  id,
  ts_headline(
    'english',
    content,
    to_tsquery('english', 'postgresql'),
    'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
  ) AS headline
FROM documents
WHERE search_vector @@ to_tsquery('english', 'postgresql');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Full-text Search</h2>

          <CodeBlock
            title="Prisma: Full-text Search"
            language="prisma"
            code={`// Prisma doesn't support full-text search directly
// Use raw SQL for all full-text search operations

// Basic search
const results = await prisma.$queryRaw\`
  SELECT * FROM documents
  WHERE search_vector @@ to_tsquery('english', 'postgresql')
\`;

// Search with ranking
const ranked = await prisma.$queryRaw\`
  SELECT 
    id,
    title,
    ts_rank(search_vector, query) AS rank
  FROM documents, to_tsquery('english', 'postgresql') query
  WHERE search_vector @@ query
  ORDER BY rank DESC
\`;

// Search with highlighting
const highlighted = await prisma.$queryRaw\`
  SELECT 
    id,
    title,
    ts_headline('english', content, to_tsquery('english', 'postgresql')) AS headline
  FROM documents
  WHERE search_vector @@ to_tsquery('english', 'postgresql')
\`;

// Complex search query
const complex = await prisma.$queryRaw\`
  SELECT 
    id,
    title,
    ts_rank_cd(search_vector, query) AS rank
  FROM documents, to_tsquery('english', 'postgresql & (database | sql)') query
  WHERE search_vector @@ query
  ORDER BY rank DESC
  LIMIT 10
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

