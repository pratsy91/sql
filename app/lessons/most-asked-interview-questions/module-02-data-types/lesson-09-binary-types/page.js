import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 9: Binary Types - Module 2 - Most Asked Interview Questions',
  description:
    'Most asked interview questions on PostgreSQL BYTEA — storing binary, encode/decode, files in the database vs object storage, TOAST, and Prisma Bytes',
};

export default function MaiqM02L09BinaryTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 9: Binary Types</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          BYTEA is how Postgres stores raw bytes. The most asked follow-up is whether files belong in the database at all.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is BYTEA?">
            <p>
              <code>BYTEA</code> is a variable-length binary string. Use it for small blobs: thumbnails, encrypted tokens, checksums, or a protobuf payload.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prisma maps this to <code>Bytes</code></li>
              <li>The default text output is hex, prefixed with <code>\\x</code></li>
              <li>Use <code>encode(bytes, &apos;hex&apos;)</code> / <code>decode(&apos;...&apos;, &apos;hex&apos;)</code> to convert</li>
              <li>Do not store a file as <code>TEXT</code> with Base64 unless you have a clear reason. BYTEA is the type for bytes</li>
            </ul>
            <CodeBlock
              title="BYTEA basics"
              language="sql"
              code={`CREATE TABLE secrets (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token BYTEA NOT NULL
);

INSERT INTO secrets (token) VALUES (decode('deadbeef', 'hex'));
SELECT encode(token, 'hex') FROM secrets;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is BYTEA and when do you store binary in Postgres?">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>BYTEA:</strong> Variable-length binary string</li>
              <li>OK for small blobs (avatar thumbnails, encrypted tokens)</li>
              <li>Large files usually belong in object storage (S3); store URL/key in Postgres</li>
              <li>Prisma maps this to <code>Bytes</code></li>
              <li>Postgres also has a separate large object system with an <code>oid</code> and streaming functions, but it is legacy for most apps and is not backed up with a plain table dump the same way</li>
              <li>The default output format is hex, so a 1 MB file becomes about 2 MB of text over the wire unless the driver uses the binary protocol</li>
            </ul>
            <CodeBlock
              title="BYTEA with a checksum"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE attachments (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  filename TEXT NOT NULL,
  content  BYTEA NOT NULL,
  sha256   BYTEA GENERATED ALWAYS AS (digest(content, 'sha256')) STORED
);

SELECT filename,
       length(content)               AS bytes,
       pg_size_pretty(length(content)::bigint) AS pretty,
       encode(sha256, 'hex')         AS checksum
FROM attachments;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Should you store files in the database or in object storage?">
            <p>
              For anything more than small thumbnails, use object storage such as S3, Google Cloud Storage, or Azure Blob, and keep only the key and the
              metadata in Postgres. Interviewers ask this to hear you weigh transactions against cost and operations.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Why the database is tempting:</strong> one backup, one transaction, permissions already work, and no orphaned files. If a transaction rolls back, the file goes away with it</li>
              <li><strong>Why object storage usually wins:</strong> storage is far cheaper per gigabyte, you can serve files through a CDN, uploads and downloads bypass the database entirely, and your backups stay small and fast to restore</li>
              <li><strong>The hidden costs of blobs in Postgres:</strong> large values live in TOAST, every update rewrites the row, WAL grows with every write, and a 500 GB database takes far longer to restore than a 5 GB one</li>
              <li><strong>Rough guidance:</strong> a few kilobytes is fine in BYTEA, a few hundred kilobytes is a judgement call, and megabytes belong outside</li>
              <li><strong>The orphan problem:</strong> object storage has no transactions, so you need a plan. Insert the row first with a pending state, upload, then mark it ready, and run a sweeper for rows that never completed</li>
              <li><strong>When keeping it in the database is right:</strong> small encrypted secrets, generated PDFs you must be able to reproduce exactly for audit, or a regulated environment where the file must never leave the database boundary</li>
              <li>Use presigned URLs so the browser uploads straight to storage and your server never holds the bytes</li>
            </ul>
            <CodeBlock
              title="Metadata in Postgres, bytes in storage"
              language="sql"
              code={`CREATE TABLE documents (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id     BIGINT NOT NULL REFERENCES users (id),
  storage_key  TEXT NOT NULL UNIQUE,
  bucket       TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL CHECK (size_bytes > 0),
  checksum     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'deleted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DELETE FROM documents
WHERE status = 'pending' AND created_at < now() - INTERVAL '1 day';`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How does TOAST affect BYTEA, and what about large objects?">
            <p>
              Values larger than about 2 kB are compressed and stored out of line in a TOAST table. That is automatic. You still pay for WAL and backups.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Updating any column on a row can force the BYTEA to be rewritten depending on how the tuple is stored</li>
              <li>Large objects (<code>lo_*</code> functions, <code>oid</code> columns) stream in chunks and can be more than 1 GB. They are not dumped the same way as table data with a plain <code>pg_dump</code> unless you include blobs</li>
              <li>Almost every modern app should pick BYTEA for small blobs or object storage for large files, not large objects</li>
              <li>In Prisma, <code>Bytes</code> is a Node <code>Buffer</code>. Do not send multi-megabyte buffers through your API as JSON</li>
            </ul>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
