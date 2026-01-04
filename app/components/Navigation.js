'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const phases = [
  {
    id: 'phase-1',
    title: 'Phase 1: Foundations & Setup',
    lessons: [
      { id: 'postgresql-overview', title: 'PostgreSQL Overview', path: '/lessons/postgresql-overview' },
      { id: 'database-fundamentals', title: 'Database Fundamentals', path: '/lessons/database-fundamentals' },
      { id: 'connection-authentication', title: 'Connection & Authentication', path: '/lessons/connection-authentication' },
    ]
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Data Types',
    lessons: [
      { id: 'numeric-types', title: 'Numeric Types', path: '/lessons/numeric-types' },
      { id: 'character-types', title: 'Character Types', path: '/lessons/character-types' },
      { id: 'datetime-types', title: 'Date/Time Types', path: '/lessons/datetime-types' },
      { id: 'boolean-type', title: 'Boolean Type', path: '/lessons/boolean-type' },
      { id: 'binary-types', title: 'Binary Types', path: '/lessons/binary-types' },
      { id: 'geometric-types', title: 'Geometric Types', path: '/lessons/geometric-types' },
      { id: 'network-types', title: 'Network Address Types', path: '/lessons/network-types' },
      { id: 'textsearch-types', title: 'Text Search Types', path: '/lessons/textsearch-types' },
      { id: 'uuid-type', title: 'UUID Type', path: '/lessons/uuid-type' },
      { id: 'json-types', title: 'JSON Types', path: '/lessons/json-types' },
      { id: 'array-types', title: 'Array Types', path: '/lessons/array-types' },
      { id: 'range-types', title: 'Range Types', path: '/lessons/range-types' },
      { id: 'composite-types', title: 'Composite Types', path: '/lessons/composite-types' },
      { id: 'domain-types', title: 'Domain Types', path: '/lessons/domain-types' },
      { id: 'enum-types', title: 'Enum Types', path: '/lessons/enum-types' },
      { id: 'xml-type', title: 'XML Type', path: '/lessons/xml-type' },
      { id: 'custom-types', title: 'Custom Types', path: '/lessons/custom-types' },
    ]
  },
  {
    id: 'phase-3',
    title: 'Phase 3: DDL (Data Definition Language)',
    lessons: [
      { id: 'create-database', title: 'CREATE DATABASE', path: '/lessons/create-database' },
      { id: 'create-schema', title: 'CREATE SCHEMA', path: '/lessons/create-schema' },
      { id: 'create-table', title: 'CREATE TABLE', path: '/lessons/create-table' },
      { id: 'alter-table', title: 'ALTER TABLE', path: '/lessons/alter-table' },
      { id: 'drop-table', title: 'DROP TABLE', path: '/lessons/drop-table' },
      { id: 'create-index', title: 'CREATE INDEX', path: '/lessons/create-index' },
      { id: 'create-view', title: 'CREATE VIEW', path: '/lessons/create-view' },
      { id: 'create-materialized-view', title: 'CREATE MATERIALIZED VIEW', path: '/lessons/create-materialized-view' },
      { id: 'create-sequence', title: 'CREATE SEQUENCE', path: '/lessons/create-sequence' },
      { id: 'create-function', title: 'CREATE FUNCTION', path: '/lessons/create-function' },
      { id: 'create-procedure', title: 'CREATE PROCEDURE', path: '/lessons/create-procedure' },
      { id: 'create-trigger', title: 'CREATE TRIGGER', path: '/lessons/create-trigger' },
      { id: 'create-rule', title: 'CREATE RULE', path: '/lessons/create-rule' },
      { id: 'create-type', title: 'CREATE TYPE', path: '/lessons/create-type' },
      { id: 'create-domain', title: 'CREATE DOMAIN', path: '/lessons/create-domain' },
      { id: 'create-extension', title: 'CREATE EXTENSION', path: '/lessons/create-extension' },
      { id: 'create-role-user', title: 'CREATE ROLE / USER', path: '/lessons/create-role-user' },
      { id: 'tablespaces', title: 'Tablespaces', path: '/lessons/tablespaces' },
    ]
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Constraints',
    lessons: [
      { id: 'not-null-constraint', title: 'NOT NULL', path: '/lessons/not-null-constraint' },
      { id: 'unique-constraint', title: 'UNIQUE', path: '/lessons/unique-constraint' },
      { id: 'primary-key-constraint', title: 'PRIMARY KEY', path: '/lessons/primary-key-constraint' },
      { id: 'foreign-key-constraint', title: 'FOREIGN KEY', path: '/lessons/foreign-key-constraint' },
      { id: 'check-constraint', title: 'CHECK', path: '/lessons/check-constraint' },
      { id: 'exclude-constraint', title: 'EXCLUDE', path: '/lessons/exclude-constraint' },
      { id: 'constraint-management', title: 'Constraint Management', path: '/lessons/constraint-management' },
    ]
  },
  {
    id: 'phase-5',
    title: 'Phase 5: DML (Data Manipulation Language)',
    lessons: [
      { id: 'insert', title: 'INSERT', path: '/lessons/insert' },
      { id: 'update', title: 'UPDATE', path: '/lessons/update' },
      { id: 'delete', title: 'DELETE', path: '/lessons/delete' },
      { id: 'upsert', title: 'UPSERT (INSERT ... ON CONFLICT)', path: '/lessons/upsert' },
      { id: 'copy', title: 'COPY', path: '/lessons/copy' },
    ]
  },
  {
    id: 'phase-6',
    title: 'Phase 6: DQL (Data Query Language) - SELECT',
    lessons: [
      { id: 'basic-select', title: 'Basic SELECT', path: '/lessons/basic-select' },
      { id: 'where-clause', title: 'WHERE clause', path: '/lessons/where-clause' },
      { id: 'order-by', title: 'ORDER BY', path: '/lessons/order-by' },
      { id: 'limit-offset', title: 'LIMIT and OFFSET', path: '/lessons/limit-offset' },
      { id: 'group-by', title: 'GROUP BY', path: '/lessons/group-by' },
      { id: 'having', title: 'HAVING', path: '/lessons/having' },
      { id: 'aggregate-functions', title: 'Aggregate functions', path: '/lessons/aggregate-functions' },
      { id: 'window-functions', title: 'Window functions', path: '/lessons/window-functions' },
      { id: 'joins', title: 'JOINs', path: '/lessons/joins' },
      { id: 'subqueries', title: 'Subqueries', path: '/lessons/subqueries' },
      { id: 'ctes', title: 'Common Table Expressions (CTEs)', path: '/lessons/ctes' },
      { id: 'union-intersect-except', title: 'UNION, INTERSECT, EXCEPT', path: '/lessons/union-intersect-except' },
      { id: 'case-expressions', title: 'CASE expressions', path: '/lessons/case-expressions' },
      { id: 'null-handling', title: 'NULL handling', path: '/lessons/null-handling' },
      { id: 'pattern-matching', title: 'Pattern matching', path: '/lessons/pattern-matching' },
      { id: 'array-operations', title: 'Array operations', path: '/lessons/array-operations' },
      { id: 'json-operations', title: 'JSON/JSONB operations', path: '/lessons/json-operations' },
      { id: 'fulltext-search', title: 'Full-text search', path: '/lessons/fulltext-search' },
    ]
  },
  {
    id: 'phase-7',
    title: 'Phase 7: Functions & Operators',
    lessons: [
      { id: 'string-functions', title: 'String functions', path: '/lessons/string-functions' },
      { id: 'numeric-functions', title: 'Numeric functions', path: '/lessons/numeric-functions' },
      { id: 'datetime-functions', title: 'Date/time functions', path: '/lessons/datetime-functions' },
      { id: 'array-functions', title: 'Array functions', path: '/lessons/array-functions' },
      { id: 'json-functions', title: 'JSON functions', path: '/lessons/json-functions' },
      { id: 'aggregate-functions-detailed', title: 'Aggregate functions (detailed)', path: '/lessons/aggregate-functions-detailed' },
      { id: 'window-functions-detailed', title: 'Window functions (detailed)', path: '/lessons/window-functions-detailed' },
      { id: 'conditional-functions', title: 'Conditional functions', path: '/lessons/conditional-functions' },
      { id: 'type-conversion-functions', title: 'Type conversion functions', path: '/lessons/type-conversion-functions' },
      { id: 'system-information-functions', title: 'System information functions', path: '/lessons/system-information-functions' },
    ]
  },
  {
    id: 'phase-8',
    title: 'Phase 8: PL/pgSQL',
    lessons: [
      { id: 'plpgsql-basics', title: 'PL/pgSQL basics', path: '/lessons/plpgsql-basics' },
      { id: 'control-structures', title: 'Control structures', path: '/lessons/control-structures' },
      { id: 'cursors', title: 'Cursors', path: '/lessons/cursors' },
      { id: 'exception-handling', title: 'Exception handling', path: '/lessons/exception-handling' },
      { id: 'dynamic-sql', title: 'Dynamic SQL', path: '/lessons/dynamic-sql' },
      { id: 'stored-procedures', title: 'Stored procedures', path: '/lessons/stored-procedures' },
      { id: 'triggers-plpgsql', title: 'Triggers in PL/pgSQL', path: '/lessons/triggers-plpgsql' },
    ]
  },
  {
    id: 'phase-9',
    title: 'Phase 9: Transactions & Concurrency',
    lessons: [
      { id: 'transactions', title: 'Transactions', path: '/lessons/transactions' },
      { id: 'isolation-levels', title: 'Isolation levels', path: '/lessons/isolation-levels' },
      { id: 'locking', title: 'Locking', path: '/lessons/locking' },
      { id: 'mvcc', title: 'MVCC (Multi-Version Concurrency Control)', path: '/lessons/mvcc' },
      { id: 'concurrent-operations', title: 'Concurrent operations', path: '/lessons/concurrent-operations' },
    ]
  },
  {
    id: 'phase-10',
    title: 'Phase 10: Performance Optimization',
    lessons: [
      { id: 'query-planning', title: 'Query planning', path: '/lessons/query-planning' },
      { id: 'index-optimization', title: 'Index optimization', path: '/lessons/index-optimization' },
      { id: 'statistics', title: 'Statistics', path: '/lessons/statistics' },
      { id: 'vacuum-optimization', title: 'VACUUM', path: '/lessons/vacuum-optimization' },
      { id: 'query-optimization-techniques', title: 'Query optimization techniques', path: '/lessons/query-optimization-techniques' },
      { id: 'partitioning', title: 'Partitioning', path: '/lessons/partitioning' },
      { id: 'table-inheritance', title: 'Table inheritance', path: '/lessons/table-inheritance' },
    ]
  },
  {
    id: 'phase-11',
    title: 'Phase 11: Security',
    lessons: [
      { id: 'roles-privileges', title: 'Roles and privileges', path: '/lessons/roles-privileges' },
      { id: 'row-level-security', title: 'Row-level security (RLS)', path: '/lessons/row-level-security' },
      { id: 'column-level-security', title: 'Column-level security', path: '/lessons/column-level-security' },
      { id: 'encryption', title: 'Encryption', path: '/lessons/encryption' },
      { id: 'sql-injection-prevention', title: 'SQL injection prevention', path: '/lessons/sql-injection-prevention' },
    ]
  },
  {
    id: 'phase-12',
    title: 'Phase 12: Backup & Recovery',
    lessons: [
      { id: 'pg-dump', title: 'pg_dump', path: '/lessons/pg-dump' },
      { id: 'pg-restore', title: 'pg_restore', path: '/lessons/pg-restore' },
      { id: 'point-in-time-recovery', title: 'Point-in-time recovery (PITR)', path: '/lessons/point-in-time-recovery' },
      { id: 'continuous-archiving', title: 'Continuous archiving', path: '/lessons/continuous-archiving' },
    ]
  },
  {
    id: 'phase-13',
    title: 'Phase 13: Replication',
    lessons: [
      { id: 'streaming-replication', title: 'Streaming replication', path: '/lessons/streaming-replication' },
      { id: 'logical-replication', title: 'Logical replication', path: '/lessons/logical-replication' },
      { id: 'replication-slots', title: 'Replication slots', path: '/lessons/replication-slots' },
    ]
  },
  {
    id: 'phase-14',
    title: 'Phase 14: Extensions',
    lessons: [
      { id: 'popular-extensions', title: 'Popular extensions', path: '/lessons/popular-extensions' },
      { id: 'creating-extensions', title: 'Creating extensions', path: '/lessons/creating-extensions' },
    ]
  },
  {
    id: 'phase-15',
    title: 'Phase 15: Advanced Features',
    lessons: [
      { id: 'foreign-data-wrappers', title: 'Foreign data wrappers (FDW)', path: '/lessons/foreign-data-wrappers' },
      { id: 'table-partitioning-advanced', title: 'Table partitioning (advanced)', path: '/lessons/table-partitioning-advanced' },
      { id: 'advanced-indexing', title: 'Advanced indexing', path: '/lessons/advanced-indexing' },
      { id: 'advanced-json', title: 'Advanced JSON', path: '/lessons/advanced-json' },
      { id: 'fulltext-search-advanced', title: 'Full-text search (advanced)', path: '/lessons/fulltext-search-advanced' },
      { id: 'advanced-aggregation', title: 'Advanced aggregation', path: '/lessons/advanced-aggregation' },
    ]
  },
  {
    id: 'phase-16',
    title: 'Phase 16: Prisma ORM Integration',
    lessons: [
      { id: 'prisma-setup', title: 'Prisma setup', path: '/lessons/prisma-setup' },
      { id: 'prisma-client-operations', title: 'Prisma Client operations', path: '/lessons/prisma-client-operations' },
      { id: 'prisma-advanced-features', title: 'Prisma advanced features', path: '/lessons/prisma-advanced-features' },
      { id: 'mapping-sql-to-prisma', title: 'Mapping SQL concepts to Prisma', path: '/lessons/mapping-sql-to-prisma' },
    ]
  },
  {
    id: 'phase-17',
    title: 'Phase 17: Monitoring & Maintenance',
    lessons: [
      { id: 'system-catalogs', title: 'System catalogs', path: '/lessons/system-catalogs' },
      { id: 'performance-monitoring', title: 'Performance monitoring', path: '/lessons/performance-monitoring' },
      { id: 'logging', title: 'Logging', path: '/lessons/logging' },
      { id: 'maintenance-tasks', title: 'Maintenance tasks', path: '/lessons/maintenance-tasks' },
    ]
  },
  {
    id: 'phase-18',
    title: 'Phase 18: Best Practices & Patterns',
    lessons: [
      { id: 'database-design', title: 'Database design', path: '/lessons/database-design' },
      { id: 'naming-conventions', title: 'Naming conventions', path: '/lessons/naming-conventions' },
      { id: 'query-patterns', title: 'Query patterns', path: '/lessons/query-patterns' },
      { id: 'migration-strategies', title: 'Migration strategies', path: '/lessons/migration-strategies' },
    ]
  },
  {
    id: 'phase-19',
    title: 'Phase 19: Database Relationships & Schema Design',
    lessons: [
      { id: 'relationship-types-fundamentals', title: 'Relationship Types & Fundamentals', path: '/lessons/database-relationships/relationship-types-fundamentals' },
      { id: 'foreign-keys-cascade-options', title: 'Foreign Keys & Cascade Options', path: '/lessons/database-relationships/foreign-keys-cascade-options' },
      { id: 'self-referencing-hierarchical', title: 'Self-Referencing & Hierarchical Relationships', path: '/lessons/database-relationships/self-referencing-hierarchical' },
      { id: 'complete-schema-examples', title: 'Complete Schema Examples', path: '/lessons/database-relationships/complete-schema-examples' },
      { id: 'design-methodology-best-practices', title: 'Design Methodology & Best Practices', path: '/lessons/database-relationships/design-methodology-best-practices' },
    ]
  },
  {
    id: 'phase-20',
    title: 'Phase 20: Interview Cheatsheet',
    lessons: [
      { id: 'core-sql-fundamentals', title: 'Core SQL Fundamentals', path: '/lessons/interview-cheatsheet/core-sql-fundamentals' },
      { id: 'database-design-normalization', title: 'Database Design & Normalization', path: '/lessons/interview-cheatsheet/database-design-normalization' },
      { id: 'database-relationships-cheatsheet', title: 'Database Relationships Cheatsheet', path: '/lessons/interview-cheatsheet/database-relationships-cheatsheet' },
      { id: 'transactions-concurrency', title: 'Transactions & Concurrency', path: '/lessons/interview-cheatsheet/transactions-concurrency' },
      { id: 'query-optimization-performance', title: 'Query Optimization & Performance', path: '/lessons/interview-cheatsheet/query-optimization-performance' },
      { id: 'constraints-security', title: 'Constraints & Security', path: '/lessons/interview-cheatsheet/constraints-security' },
      { id: 'backup-recovery-partitioning', title: 'Backup, Recovery & Partitioning', path: '/lessons/interview-cheatsheet/backup-recovery-partitioning' },
      { id: 'postgresql-specific-features', title: 'PostgreSQL-Specific Features', path: '/lessons/interview-cheatsheet/postgresql-specific-features' },
      { id: 'common-interview-questions', title: 'Common Interview Questions', path: '/lessons/interview-cheatsheet/common-interview-questions' },
    ]
  },
  {
    id: 'phase-21',
    title: 'Phase 21: Practical Queries',
    lessons: [
      { id: 'simple-basic-queries', title: 'Simple to Basic Queries', path: '/lessons/practical-queries/simple-basic-queries' },
      { id: 'joins', title: 'JOINs', path: '/lessons/practical-queries/joins' },
      { id: 'aggregations-group-by', title: 'Aggregations & GROUP BY', path: '/lessons/practical-queries/aggregations-group-by' },
      { id: 'subqueries-ctes', title: 'Subqueries & CTEs', path: '/lessons/practical-queries/subqueries-ctes' },
      { id: 'window-functions-advanced', title: 'Window Functions & Advanced SQL', path: '/lessons/practical-queries/window-functions-advanced' },
      { id: 'complex-scenarios', title: 'Complex Real-World Scenarios', path: '/lessons/practical-queries/complex-scenarios' },
    ]
  }
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-64 bg-zinc-900 text-zinc-100 h-screen fixed left-0 top-0 overflow-y-auto overflow-x-hidden">
      <div className="p-4 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
        <Link href="/">
          <h2 className="text-xl font-bold hover:text-blue-400 transition-colors cursor-pointer">PostgreSQL Learning</h2>
        </Link>
      </div>
      <div className="p-4">
        {phases.map((phase) => (
          <div key={phase.id} className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {phase.title}
            </h3>
            <ul className="space-y-1">
              {phase.lessons.map((lesson) => {
                const isActive = pathname === lesson.path;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={lesson.path}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {lesson.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

