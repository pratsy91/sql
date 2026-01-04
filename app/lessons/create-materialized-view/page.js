import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'CREATE MATERIALIZED VIEW - PostgreSQL Learning',
  description: 'Learn about creating materialized views in PostgreSQL and refreshing them',
};

export default function CreateMaterializedView() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">CREATE MATERIALIZED VIEW</h1>
        
        <CodeBlock
          title="SQL: Materialized Views"
          language="sql"
          code={`-- Create materialized view
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
  status,
  COUNT(*) AS user_count,
  AVG(EXTRACT(YEAR FROM AGE(created_at))) AS avg_account_age
FROM users
GROUP BY status;

-- Query materialized view
SELECT * FROM user_stats;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW user_stats;

-- Concurrent refresh (doesn't lock view)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;

-- Requires unique index for CONCURRENTLY
CREATE UNIQUE INDEX ON user_stats (status);

-- Drop materialized view
DROP MATERIALIZED VIEW user_stats;`}
        />
      </div>
    </LessonLayout>
  );
}

