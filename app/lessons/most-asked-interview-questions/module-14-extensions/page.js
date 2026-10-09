import ModuleLessonIndex from '../../../components/ModuleLessonIndex';

export const metadata = {
  title: 'Module 14: Extensions - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL extensions interview questions split into lessons: extension basics and upgrades, UUID and pgcrypto and citext, search extensions, and PostGIS with pgvector.',
};

export default function Module14ExtensionsIndex() {
  return (
    <ModuleLessonIndex
      title="Module 14: Extensions"
      intro="Extensions are add-ons that give PostgreSQL features the core database does not ship with, and these lessons cover the ones interviewers ask about most."
      lessons={[
        {
          title: 'Lesson 1: Extension Basics',
          href: '/lessons/most-asked-interview-questions/module-14-extensions/lesson-01-extension-basics',
          blurb:
            'What an extension is, creating and listing and dropping them, managed host allowlists, install schema, pg_dump and Prisma migrations, privileges, and safe upgrades.',
        },
        {
          title: 'Lesson 2: UUID, pgcrypto and citext',
          href: '/lessons/most-asked-interview-questions/module-14-extensions/lesson-02-uuid-crypto-citext',
          blurb:
            'gen_random_uuid vs uuid-ossp vs pgcrypto, UUID primary key trade-offs, what pgcrypto is for, where to hash passwords, and citext vs a lower(email) unique index.',
        },
        {
          title: 'Lesson 3: Search Extensions',
          href: '/lessons/most-asked-interview-questions/module-14-extensions/lesson-03-search-extensions',
          blurb:
            'pg_trgm trigram matching, hstore vs JSONB, trigram vs full-text search, unaccent for accent-insensitive search, and when to move search to a dedicated engine.',
        },
        {
          title: 'Lesson 4: PostGIS and pgvector',
          href: '/lessons/most-asked-interview-questions/module-14-extensions/lesson-04-postgis-and-pgvector',
          blurb:
            'PostGIS and geography vs geometry, pgvector nearest-neighbour queries, storing embeddings and dimension mismatch, IVFFlat vs HNSW, and choosing extensions for a SaaS app.',
        },
      ]}
    />
  );
}
