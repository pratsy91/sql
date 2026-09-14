import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 12: Backup & Recovery - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL backup and recovery interview questions: pg_dump, pg_restore, WAL, PITR, RPO/RTO, and why Prisma migrate is not a backup strategy.',
};

export default function Module12() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 12: Backup &amp; Recovery</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 12 — Junior → Senior. Covers logical vs physical
          backups, <code>pg_dump</code>/<code>pg_restore</code>, WAL archiving, base backups, PITR,
          RPO/RTO, backup testing, and Prisma migration limits (PostgreSQL 15/16/17).
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-700 dark:text-emerald-400">
            Junior Level
          </h2>

          <InterviewQACard level="Junior" question="What is the difference between logical and physical backups?">
            <p>
              <strong>Logical</strong> backups export SQL or archive objects (tables, data) via tools like{' '}
              <code>pg_dump</code>—portable across versions/machines, selective, but slower for huge DBs.
              <strong>Physical</strong> backups copy cluster files (base backup + WAL)—faster restore for
              large systems and required for PITR, but tied more tightly to PostgreSQL version and
              filesystem layout.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does pg_dump do? How is pg_dumpall different?">
            <p>
              <code>pg_dump</code> backs up a <em>single database</em> (schema + data).{' '}
              <code>pg_dumpall</code> dumps <em>all databases</em> in the cluster plus global objects
              (roles, tablespaces). Day-to-day app backups usually use <code>pg_dump</code>; cluster-wide
              disaster recovery often needs both dump styles or a physical strategy.
            </p>
            <CodeBlock
              title="Basic dump commands"
              language="bash"
              code={`# Single database, custom format (recommended)
pg_dump -Fc -f shop.dump shop

# Plain SQL (human-readable, easy to edit; less flexible restore)
pg_dump -Fp -f shop.sql shop

# Globals + all DBs
pg_dumpall -g -f globals.sql
pg_dumpall -f full_cluster.sql`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Custom format vs plain SQL format—when do you use each?">
            <p>
              <strong>Plain (<code>-Fp</code>)</strong>: a <code>.sql</code> script; restore with{' '}
              <code>psql</code>. Good for small DBs and inspecting SQL. <strong>Custom (<code>-Fc</code>)</strong>:
              compressed archive restored with <code>pg_restore</code>; supports parallel restore, selective
              object restore, and reordering. Prefer custom (or directory <code>-Fd</code>) for production.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Does Prisma migrate replace database backups?">
            <p>
              <strong>No.</strong> Migrations version schema changes; they do not snapshot production data.
              Accidental <code>DROP</code>, bad data writes, ransomware, or region failure still need{' '}
              <code>pg_dump</code> / physical backups / PITR. Treat migrate history and backups as separate
              concerns.
            </p>
            <CodeBlock
              title="Mental model"
              language="typescript"
              code={`// prisma migrate deploy  → applies schema DDL to a database
// It does NOT:
// - copy row data safely for disaster recovery
// - provide point-in-time rollback of business data
// - replace WAL archiving or snapshots

// You still need scheduled backups + restore drills`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you restore a custom-format dump with pg_restore?">
            <p>
              Create an empty target database (or restore into an existing one carefully), then run{' '}
              <code>pg_restore</code>. Use <code>-j</code> for parallelism with custom/directory formats.
            </p>
            <CodeBlock
              title="pg_restore examples"
              language="bash"
              code={`createdb shop_restore
pg_restore -d shop_restore -j 4 shop.dump

# List contents / restore one table
pg_restore -l shop.dump
pg_restore -d shop_restore -t orders shop.dump`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">
            Mid Level
          </h2>

          <InterviewQACard level="Mid" question="What are RPO and RTO?">
            <p>
              <strong>RPO (Recovery Point Objective)</strong>: how much data loss is acceptable (e.g., 5
              minutes → need frequent WAL archiving). <strong>RTO (Recovery Time Objective)</strong>: how
              long restore may take (e.g., 1 hour → influences backup format, parallelism, standby use).
              Interviewers want you to map backup strategy to these numbers.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is WAL archiving and why does it matter for backups?">
            <p>
              Write-Ahead Log records every change before it is durable. Archiving copies finished WAL
              segments to durable storage so you can replay changes after a base backup—enabling continuous
              backup and point-in-time recovery. Without archived WAL, you typically restore only to the
              backup snapshot time.
            </p>
            <CodeBlock
              title="Key settings (conceptual)"
              language="sql"
              code={`-- postgresql.conf (illustrative)
wal_level = replica          -- or logical if needed
archive_mode = on
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'
-- PG 15+: often use archive_library / backup tools (pgBackRest, Barman) instead of raw cp`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a base backup?">
            <p>
              A consistent copy of the data directory taken while the server runs (e.g.,{' '}
              <code>pg_basebackup</code>), used with WAL to restore a cluster. It is the foundation of
              physical backup / PITR strategies and of building replicas.
            </p>
            <CodeBlock
              title="pg_basebackup"
              language="bash"
              code={`pg_basebackup -h primary -D /var/lib/postgresql/16/main \
  -U replicator -Fp -Xs -P -R
# -Xs streams WAL during backup; -R writes standby signaling (PG 12+)`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why must you test backups? What do you verify?">
            <ul className="list-disc pl-5 space-y-1">
              <li>Restore completes within RTO on realistic hardware</li>
              <li>Application can connect and critical queries work</li>
              <li>Row counts / checksums / business invariants match expectations</li>
              <li>Roles, extensions, and privileges were included</li>
              <li>For PITR: restore to a chosen timestamp and confirm expected data</li>
            </ul>
            <p>Untested backups are a hope, not a plan—this is a classic senior-flavored mid question.</p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you dump only schema or only data? How does that relate to Prisma?">
            <p>
              <code>pg_dump --schema-only</code> / <code>--data-only</code> help clone structures or move
              data. Prisma migrations own <em>intended</em> schema evolution in app repos; dumps capture{' '}
              <em>actual</em> production state (including manual hotfixes). For disaster recovery, dump data
              (and globals); do not assume migration replay alone rebuilds production.
            </p>
            <CodeBlock
              title="Selective dumps"
              language="bash"
              code={`pg_dump -Fc --schema-only -f schema.dump shop
pg_dump -Fc --data-only -f data.dump shop
pg_dump -Fc -t orders -t order_items -f orders.dump shop`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What should be backed up besides table data when using Prisma?">
            <ul className="list-disc pl-5 space-y-1">
              <li>Roles / grants / RLS policies (often in SQL migrations or separate dumps)</li>
              <li>Extensions (<code>CREATE EXTENSION</code>)</li>
              <li>Sequences’ current values (included in proper dumps)</li>
              <li>Large objects if used</li>
              <li>Migration history table (<code>_prisma_migrations</code>) so environments stay consistent</li>
            </ul>
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-amber-700 dark:text-amber-400">
            Senior Level
          </h2>

          <InterviewQACard level="Senior" question="Explain Point-in-Time Recovery (PITR).">
            <p>
              PITR restores a base backup, then replays archived WAL up to a target time, transaction ID, or
              recovery point. Requires <code>wal_level</code> sufficient for archiving, continuous WAL
              archive, and a base backup taken before the target. Used to recover from operator error (e.g.,
              bad DELETE) without losing the entire day.
            </p>
            <CodeBlock
              title="recovery signal (PG 12+ style)"
              language="bash"
              code={`# After restoring data directory from base backup:
# Place WAL archive access + create recovery.signal
# postgresql.auto.conf / postgresql.conf:
# restore_command = 'cp /wal_archive/%f %p'
# recovery_target_time = '2026-09-09 08:15:00+05:30'
# Then start PostgreSQL; promote when recovery ends`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you design backups for a large production PostgreSQL 16 database?">
            <p>
              Typical design: physical backups with <strong>pgBackRest</strong> or <strong>Barman</strong>{' '}
              (full + differential/incremental), WAL archiving to object storage, periodic{' '}
              <code>pg_dump</code> of critical schemas for portability, automated restore drills, monitoring
              of archive lag, and encryption at rest. Use a standby for fast RTO; use PITR for precise RPO.
              Avoid relying solely on volume snapshots without flush/consistency guarantees.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What are common pg_dump / pg_restore production pitfalls?">
            <ul className="list-disc pl-5 space-y-1">
              <li>Forgetting globals (roles) when moving clusters—<code>pg_dump</code> alone is not enough</li>
              <li>Extension / shared library mismatch on target</li>
              <li>Restoring into a non-empty DB and hitting object conflicts</li>
              <li>Taking logical dumps as the only backup for multi-TB clusters (too slow)</li>
              <li>Not using <code>--no-owner</code> / role mapping when targets differ</li>
              <li>Assuming parallel <code>-j</code> works with plain SQL format (it does not)</li>
            </ul>
            <CodeBlock
              title="Safer restore flags (example)"
              language="bash"
              code={`pg_restore -d shop_restore \
  --no-owner --role=migrator \
  --exit-on-error \
  -j 8 shop.dump`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do backups interact with replicas and failover?">
            <p>
              Replicas are for HA and read scaling—they are not a substitute for backups (replicas can
              replicate bad deletes instantly). Take base backups from the primary or from a standby (with
              tool support). After failover, ensure WAL archiving and backup scheduling follow the new
              primary. Test that backup credentials and slots survive topology changes.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Interview closer: 'We use Prisma — what is your backup story?'">
            <p>
              Strong answer structure: (1) continuous physical backup + WAL for PITR meeting RPO/RTO;
              (2) periodic logical dumps for portability; (3) migrations in git for schema intent; (4)
              restore runbooks practiced quarterly; (5) separate credentials and encrypted storage; (6)
              explicit statement that migrate deploy never replaces backups. Mention verifying{' '}
              <code>_prisma_migrations</code> after restore so app deploys stay aligned.
            </p>
            <CodeBlock
              title="Post-restore checklist (app-aware)"
              language="bash"
              code={`# 1) Restore DB via pgBackRest / pg_restore
# 2) Verify extensions & roles
# 3) Confirm prisma migration table
psql -d shop -c 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;'
# 4) Smoke-test app against restored DB
# 5) Only then retire the incident / cut traffic`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
