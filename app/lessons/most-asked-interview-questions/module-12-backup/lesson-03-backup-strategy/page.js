import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: Backup Strategy - Module 12 - Most Asked Interview Questions',
  description:
    'Most asked backup strategy interview questions: RPO and RTO, the 3-2-1 rule, testing restores, retention and cost, is a replica a backup, designing backups for large databases, failover, and the Prisma backup story.',
};

export default function MaiqBackupLesson03Strategy() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: Backup Strategy</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Knowing the commands is the easy part. Interviewers use this topic to find out whether you have
          ever owned a production database: how much data may be lost, how long recovery may take, who
          proved the backup works, and what it all costs.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is the 3-2-1 backup rule?">
            <p>
              Keep <strong>3</strong> copies of the data, on <strong>2</strong> different kinds of storage,
              with <strong>1</strong> copy off-site. It is an old rule from general IT, and it survives
              because every large data loss story is a story of copies that failed together.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>3 copies:</strong> the live database plus at least two backups, so one bad backup is
                not the end
              </li>
              <li>
                <strong>2 media or locations:</strong> for example a local disk and object storage. A backup
                on the same volume as the database dies with the database
              </li>
              <li>
                <strong>1 off-site:</strong> a different region or a different provider, so a datacentre or
                account problem cannot take everything
              </li>
              <li>
                The modern addition is often called 3-2-1-1-0: one copy immutable or offline, and zero
                errors in your last restore test. Immutable object storage with a lock protects against
                ransomware and against a compromised account deleting the backups
              </li>
              <li>
                Watch for the hidden single point of failure: backups in the same cloud account, encrypted
                with one key, deletable by one credential
              </li>
            </ul>
            <CodeBlock
              title="What 3-2-1 looks like in practice"
              language="bash"
              code={`# Copy 1: the primary database (not a backup, just the source)
# Copy 2: local backup repository, fast to restore from
pgbackrest --stanza=shop backup --type=incr

# Copy 3: replicated to object storage in another region, versioned and locked
aws s3 sync /var/lib/pgbackrest s3://acme-db-backups/shop/ --storage-class STANDARD_IA
aws s3api put-object-lock-configuration --bucket acme-db-backups \\
  --object-lock-configuration 'ObjectLockEnabled=Enabled,Rule={DefaultRetention={Mode=COMPLIANCE,Days=35}}'

# And the zero: prove the newest backup restores cleanly
pgbackrest --stanza=shop check`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Does Prisma migrate replace database backups?">
            <p>
              <strong>No.</strong> Migrations version your schema changes; they do not snapshot production
              data. An accidental <code>DROP</code>, a bad bulk update, ransomware, or a region failure all
              still need <code>pg_dump</code>, physical backups, or point-in-time recovery. Treat migration
              history and backups as two separate concerns.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Migrations move forward. There is no reliable undo for a migration that already dropped a
                column, because the data is gone
              </li>
              <li>
                <code>prisma db push</code> and <code>prisma migrate reset</code> are actively dangerous
                near production data. Reset drops the database
              </li>
              <li>
                Take a backup immediately before any destructive migration, and create a named restore point
              </li>
            </ul>
            <CodeBlock
              title="Mental model"
              language="typescript"
              code={`// prisma migrate deploy  -> applies schema DDL to a database
// It does NOT:
// - copy row data safely for disaster recovery
// - provide point-in-time rollback of business data
// - replace WAL archiving or snapshots

// You still need scheduled backups + restore drills`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are RPO and RTO?">
            <p>
              <strong>RPO, the Recovery Point Objective</strong>, is how much data you may lose. An RPO of 5
              minutes means you need WAL archiving every few minutes, not a nightly dump.{' '}
              <strong>RTO, the Recovery Time Objective</strong>, is how long the recovery may take. An RTO of
              1 hour drives your backup format, your parallelism, and whether you keep a warm standby.
              Interviewers want you to connect the strategy to these two numbers.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                RPO is about the past, RTO is about the future. They are set by the business, not by
                engineering taste
              </li>
              <li>
                Different data can have different targets. Payment records may need minutes; an analytics
                copy may tolerate a day
              </li>
              <li>
                A standby that can be promoted gives a very small RTO, but it does not improve RPO for
                logical mistakes, because the mistake is replicated
              </li>
              <li>
                Always state your numbers with evidence from a real drill. &quot;Our measured restore is 40
                minutes for 900 GB&quot; is a much stronger answer than a promise
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Why must you test backups? What do you verify?">
            <ul className="list-disc pl-6 space-y-1">
              <li>The restore completes within your RTO on realistic hardware</li>
              <li>The application can connect and the critical queries work</li>
              <li>Row counts, checksums, and business invariants match expectations</li>
              <li>Roles, extensions, and privileges were included</li>
              <li>For PITR: restore to a chosen timestamp and confirm the expected data is there</li>
              <li>
                Statistics were refreshed with <code>ANALYZE</code>, so the restored database is not
                mysteriously slow
              </li>
              <li>
                Someone other than the author can follow the runbook, because the expert will be on holiday
                during the real incident
              </li>
            </ul>
            <p>
              Untested backups are a hope, not a plan. This is a classic senior-flavoured mid-level
              question.
            </p>
            <CodeBlock
              title="Automated restore drill"
              language="bash"
              code={`set -euo pipefail

# 1) Restore the newest backup into a throwaway database
createdb drill_$(date +%Y%m%d)
pg_restore -d drill_$(date +%Y%m%d) --exit-on-error -j 4 /backups/latest.dump

# 2) Structural checks
psql -d drill_$(date +%Y%m%d) -c 'ANALYZE;'
psql -d drill_$(date +%Y%m%d) -c 'SELECT extname FROM pg_extension ORDER BY 1;'

# 3) Business invariants: fail loudly if they do not hold
psql -d drill_$(date +%Y%m%d) -v ON_ERROR_STOP=1 -c "
  DO \\$do\\$
  BEGIN
    IF (SELECT count(*) FROM orders) = 0 THEN
      RAISE EXCEPTION 'orders table is empty after restore';
    END IF;
    IF EXISTS (SELECT 1 FROM orders WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'orphan orders found after restore';
    END IF;
  END
  \\$do\\$;"

# 4) Record how long it took, then drop the drill database
dropdb drill_$(date +%Y%m%d)`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What should be backed up besides table data when using Prisma?">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Roles, grants, and RLS policies, which usually live in SQL migrations or a separate globals
                dump
              </li>
              <li>
                Extensions, meaning the <code>CREATE EXTENSION</code> statements and any version pinning
              </li>
              <li>The current values of sequences, which proper dumps do include</li>
              <li>Large objects, if your application uses them</li>
              <li>
                The migration history table, <code>_prisma_migrations</code>, so environments stay
                consistent and the next deploy does not try to re-apply old migrations
              </li>
              <li>
                Server configuration that behaviour depends on, such as timezone, collation and locale
                settings, and custom parameters used by RLS policies
              </li>
              <li>
                Anything outside PostgreSQL that the rows point at: uploaded files in object storage, search
                indexes, and secrets. A restored database with dangling file references is only half a
                recovery
              </li>
            </ul>
            <CodeBlock
              title="Capturing the parts a table dump misses"
              language="bash"
              code={`# Roles, passwords and tablespaces (cluster-wide objects)
pg_dumpall --globals-only -f globals.sql

# Extensions and their versions, for the runbook
psql -d shop -Atc 'SELECT extname, extversion FROM pg_extension ORDER BY 1;' > extensions.txt

# Prisma migration state
psql -d shop -c 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;' > migrations.txt

# Non-default server settings that behaviour depends on
psql -d shop -Atc "SELECT name || ' = ' || setting FROM pg_settings WHERE source <> 'default';" > settings.txt`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Is a replica a backup?">
            <p>
              No. A replica is a live copy that applies every change within seconds, which means it faithfully
              copies your mistakes too. If someone runs <code>DELETE FROM orders</code> on the primary, the
              rows are gone on the replica before you can react. A replica protects against hardware and
              availability failures. A backup protects against wrong data.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A replica helps your RTO, because promoting it is fast. It does nothing for your RPO against
                logical errors
              </li>
              <li>
                It does not protect against a dropped table, a bad migration, corruption that replicates, or
                a malicious actor with database access
              </li>
              <li>
                A replica has no history. A backup archive lets you go back to any point in the retention
                window
              </li>
              <li>
                Delayed replication with <code>recovery_min_apply_delay</code> is a useful middle ground: a
                standby kept one hour behind gives you a window to stop the damage from being applied
              </li>
              <li>
                The right answer in an interview: replicas are for availability, backups are for recovery,
                and you need both
              </li>
            </ul>
            <CodeBlock
              title="A delayed standby as a safety net"
              language="sql"
              code={`-- On the standby: stay one hour behind the primary
ALTER SYSTEM SET recovery_min_apply_delay = '1h';
SELECT pg_reload_conf();

-- If something bad happens on the primary, freeze the standby immediately
SELECT pg_wal_replay_pause();

-- Then recover the good rows from the standby before resuming
SELECT pg_is_wal_replay_paused();

-- Normal replication health check
SELECT client_addr, state, sent_lsn, replay_lsn,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you decide retention, and how do you keep the cost sane?">
            <p>
              Retention is how far back you can go. It is a business decision driven by three things: how
              long a mistake can stay unnoticed, what compliance requires, and what you are willing to pay.
              A common shape is dense recent history and sparse older history.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A typical policy: continuous WAL for the last 7 to 14 days, daily backups for a month,
                monthly for a year, and yearly if regulation demands it
              </li>
              <li>
                The quiet mistake is retention shorter than your detection time. If a corrupted import is
                found after 10 days and you keep 7, the backup is useless
              </li>
              <li>
                Cost levers: compression, incremental or differential backups instead of daily fulls,
                lifecycle rules that move old backups to cold storage, and excluding tables you can rebuild
              </li>
              <li>
                Cold storage is cheap to keep and slow and expensive to read, so never put your newest
                backup there. Restoring from archive tiers can take hours
              </li>
              <li>
                Deletion must be as reliable as creation, or storage grows forever. Let the backup tool
                expire backups, so it never deletes WAL that a retained backup still needs
              </li>
              <li>
                Personal data has the opposite pressure: privacy rules may require deleting it, and old
                backups are a place it hides. Retention should be defensible in both directions
              </li>
            </ul>
            <CodeBlock
              title="Retention configured once, enforced automatically"
              language="bash"
              code={`# pgbackrest.conf
# [global]
# repo1-retention-full=4          ; keep 4 weekly fulls
# repo1-retention-diff=7          ; keep a week of differentials
# repo1-retention-archive=14      ; 14 days of WAL for PITR
# repo1-retention-archive-type=full
# repo1-cipher-type=aes-256-cbc

# Expiry that understands which WAL is still needed
pgbackrest --stanza=shop expire

# Lifecycle for the off-site copy: cheap after 30 days, gone after a year
aws s3api put-bucket-lifecycle-configuration --bucket acme-db-backups \\
  --lifecycle-configuration file://lifecycle.json

# What are we actually keeping, and how big is it?
pgbackrest --stanza=shop info
aws s3 ls s3://acme-db-backups/shop/ --recursive --summarize | tail -2`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="How would you design backups for a large production PostgreSQL database?">
            <p>
              A typical design: physical backups with <strong>pgBackRest</strong> or{' '}
              <strong>Barman</strong>, using full plus differential or incremental backups; WAL archiving to
              object storage; periodic <code>pg_dump</code> of critical schemas for portability; automated
              restore drills; monitoring of archive lag; and encryption at rest. Keep a standby for a fast
              RTO and use PITR for a precise RPO. Do not rely on volume snapshots alone unless the provider
              guarantees a consistent, crash-safe snapshot.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Take the base backup from a standby when you can, so the primary keeps its I/O for user
                traffic
              </li>
              <li>
                Alert on backup age, archive failures, and repository size, not just on job exit codes. A
                job that succeeds while archiving silently fails is the classic trap
              </li>
              <li>
                Turn on <code>data_checksums</code> so corruption is detected early instead of being backed
                up for months
              </li>
              <li>
                Encrypt the repository and keep the key in a manager. A readable backup bucket is a full
                database breach
              </li>
              <li>
                Write the runbook for the worst case: total region loss, at 3am, by whoever is on call, with
                exact commands and expected durations
              </li>
              <li>
                Give the backup tool its own limited role, not a superuser, and keep its credentials out of
                the application environment
              </li>
            </ul>
            <CodeBlock
              title="Backup health checks worth alerting on"
              language="sql"
              code={`-- Archiver failures and staleness
SELECT archived_count, failed_count,
       last_archived_time,
       age(now(), last_archived_time) AS since_last_archive
FROM pg_stat_archiver;

-- Are checksums on? (must be decided at initdb time)
SHOW data_checksums;

-- Corruption counters, per database
SELECT datname, checksum_failures, checksum_last_failure
FROM pg_stat_database
WHERE checksum_failures > 0;

-- Replication slots that could block WAL cleanup
SELECT slot_name, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots
ORDER BY 3 DESC;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do backups interact with replicas and failover?">
            <p>
              Replicas give you high availability and read scaling; they are not a substitute for backups,
              because a bad DELETE replicates instantly. You can take base backups from the primary or from a
              standby if your tool supports it. After a failover, make sure WAL archiving and the backup
              schedule follow the new primary, and check that backup credentials and replication slots
              survived the topology change.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The most common post-failover incident is silent: the new primary was never configured to
                archive, so WAL stops flowing and PITR coverage ends without an error anywhere
              </li>
              <li>
                A failover creates a new timeline. Your backup repository must keep the history files, or
                recovery across the switch point becomes impossible
              </li>
              <li>
                Build archiving and backup configuration into every node from the start, so any node can
                become the primary without manual steps
              </li>
              <li>
                Automated failover managers such as Patroni need the same treatment: the backup
                configuration follows whichever node is the leader, not a fixed hostname
              </li>
              <li>
                After any failover, verify a fresh backup and a fresh restore before declaring the incident
                closed
              </li>
            </ul>
            <CodeBlock
              title="Post-failover checklist"
              language="bash"
              code={`# Who is the primary now?
psql -c 'SELECT pg_is_in_recovery();'   # false on the primary

# Is the new primary archiving at all?
psql -c 'SHOW archive_mode;'
psql -c 'SELECT last_archived_time, failed_count FROM pg_stat_archiver;'

# Force a segment and confirm it reaches the repository
psql -c 'SELECT pg_switch_wal();'
pgbackrest --stanza=shop check

# Timeline history must be present for cross-failover recovery
ls /wal_archive | grep '\\.history'

# Take a fresh full backup so the chain starts on the new timeline
pgbackrest --stanza=shop backup --type=full`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Interview closer: we use Prisma - what is your backup story?">
            <p>
              A strong answer has a clear structure: (1) continuous physical backup plus WAL for PITR that
              meets the agreed RPO and RTO; (2) periodic logical dumps for portability and single-table
              recovery; (3) migrations in git as the record of schema intent; (4) restore runbooks practiced
              on a schedule; (5) separate credentials and encrypted, off-site, immutable storage; and (6) an
              explicit statement that <code>migrate deploy</code> never replaces backups. Mention verifying{' '}
              <code>_prisma_migrations</code> after a restore so application deploys stay aligned.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Name your numbers: the RPO, the RTO, and the last measured restore time. That is what turns
                a list of tools into an owned system
              </li>
              <li>
                Mention the destructive-migration habit: back up and create a named restore point right
                before the migration runs
              </li>
              <li>
                Mention what lives outside the database, such as uploaded files, and how those are restored
                to a matching point in time
              </li>
            </ul>
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
            <CodeBlock
              title="Guard rail around a destructive migration"
              language="bash"
              code={`set -euo pipefail

# A known-good point to come back to, and a fresh backup
psql "$DIRECT_URL" -c "SELECT pg_create_restore_point('before_' || 'drop_legacy_cols');"
pgbackrest --stanza=shop backup --type=incr

# Review the SQL before it runs anywhere near production
npx prisma migrate diff \\
  --from-url "$DIRECT_URL" \\
  --to-schema-datamodel prisma/schema.prisma \\
  --script > pending.sql

npx prisma migrate deploy

# Confirm the app and the database agree on migration state
psql "$DIRECT_URL" -c 'SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL;'`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
