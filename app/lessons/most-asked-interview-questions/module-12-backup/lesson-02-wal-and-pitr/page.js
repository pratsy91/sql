import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: WAL and Point-in-Time Recovery - Module 12 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL WAL interview questions: what WAL is, WAL archiving, base backups, continuous archiving vs nightly dumps, and what you need to recover to an exact minute.',
};

export default function MaiqBackupLesson02WalPitr() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: WAL and Point-in-Time Recovery</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A nightly dump can only bring you back to last night. WAL is what lets you come back to 14:32,
          one minute before somebody ran the wrong DELETE. This lesson explains the write-ahead log in
          plain words and then builds point-in-time recovery on top of it.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What is WAL, in simple words?">
            <p>
              WAL stands for Write-Ahead Log. Before PostgreSQL changes any data page, it first writes a
              small note describing the change into a sequential log file, and only that note has to reach
              disk before the transaction can be called committed. The actual data pages are written later
              in the background. The rule is simply: log first, change the data after.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Why:</strong> if the server loses power, PostgreSQL replays the log on startup and
                rebuilds every committed change. That is crash recovery
              </li>
              <li>
                <strong>Why it is fast:</strong> appending to one sequential file is far cheaper than
                flushing many scattered pages on every commit
              </li>
              <li>
                WAL lives in the <code>pg_wal</code> directory as 16 MB segment files with long hexadecimal
                names
              </li>
              <li>
                A checkpoint is the moment PostgreSQL flushes the dirty pages to their real place, after
                which older WAL is no longer needed for crash recovery
              </li>
              <li>
                The same log drives replication and backups, because a stream of every change is exactly
                what a replica or a recovery needs
              </li>
            </ul>
            <CodeBlock
              title="Looking at WAL"
              language="sql"
              code={`-- Current position in the log
SELECT pg_current_wal_lsn();

-- How much WAL is on disk right now
SELECT count(*) AS segments, pg_size_pretty(sum(size)) AS total
FROM pg_ls_waldir();

-- Settings that control it
SHOW wal_level;        -- minimal | replica | logical
SHOW max_wal_size;
SHOW archive_mode;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is WAL archiving and why does it matter for backups?">
            <p>
              The write-ahead log records every change before it becomes durable. Archiving copies each
              finished WAL segment to durable storage, so you can replay those changes on top of a base
              backup. That is what turns a one-time snapshot into continuous backup and makes point-in-time
              recovery possible. Without archived WAL you can normally only restore to the moment the backup
              was taken.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>wal_level</code> must be <code>replica</code> or higher, and{' '}
                <code>archive_mode</code> must be on
              </li>
              <li>
                The archive command must be safe to retry and must never overwrite an existing file, because
                PostgreSQL will retry on failure
              </li>
              <li>
                If archiving fails, WAL piles up in <code>pg_wal</code> and can fill the disk, which takes
                the database down. Monitor <code>pg_stat_archiver</code> and alert on failures
              </li>
              <li>
                Use a real backup tool such as pgBackRest or Barman rather than a hand-written{' '}
                <code>cp</code>. They handle retries, compression, encryption, and verification
              </li>
              <li>
                Keep the archive on separate storage from the database. An archive on the same disk protects
                you from nothing
              </li>
            </ul>
            <CodeBlock
              title="Key settings (conceptual)"
              language="sql"
              code={`-- postgresql.conf (illustrative)
wal_level = replica          -- or logical if needed
archive_mode = on
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'
-- PG 15+: often use archive_library / backup tools (pgBackRest, Barman) instead of raw cp`}
            />
            <CodeBlock
              title="Is archiving actually healthy?"
              language="sql"
              code={`SELECT archived_count, last_archived_wal, last_archived_time,
       failed_count, last_failed_wal, last_failed_time
FROM pg_stat_archiver;

-- WAL waiting to be archived: should stay near zero
SELECT count(*) AS ready_to_archive
FROM pg_ls_dir('pg_wal/archive_status') AS f
WHERE f LIKE '%.ready';

-- Replication slots also hold WAL back
SELECT slot_name, active, pg_size_pretty(
  pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
) AS retained_wal
FROM pg_replication_slots;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is a base backup?">
            <p>
              A base backup is a consistent copy of the whole data directory taken while the server keeps
              running, for example with <code>pg_basebackup</code>. On its own it is a snapshot; combined
              with archived WAL it becomes the starting point for restoring a cluster to any later moment.
              It is also how you build a new replica.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                It is a physical backup, so it includes every database, every index, and the configuration
                files in the data directory
              </li>
              <li>
                It is not an instant snapshot. It takes time, and it is consistent because the WAL generated
                during the copy is included or replayed
              </li>
              <li>
                <code>-Xs</code> streams WAL in a second connection while the copy runs, which makes the
                backup self-contained
              </li>
              <li>
                It needs a role with <code>REPLICATION</code> rights and a free replication connection slot
              </li>
              <li>
                Restoring one table out of a base backup is not possible, which is why teams keep logical
                dumps as well
              </li>
            </ul>
            <CodeBlock
              title="pg_basebackup"
              language="bash"
              code={`pg_basebackup -h primary -D /var/lib/postgresql/16/main \\
  -U replicator -Fp -Xs -P -R
# -Xs streams WAL during backup; -R writes standby signaling (PG 12+)

# Compressed tar, useful for shipping to object storage
pg_basebackup -h primary -D /backups/base_2026_10_01 \\
  -U replicator -Ft -z -Xs -P

# With a real backup tool instead
pgbackrest --stanza=shop backup --type=full`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Continuous archiving or a nightly dump - what is the real difference?">
            <p>
              A nightly dump gives you one recovery point per day. Continuous archiving gives you every
              moment. The difference is measured in how much data you lose, which is your recovery point
              objective, and it is usually the deciding argument in an interview answer.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Nightly dump:</strong> worst case you lose almost a full day of work. Restoring also
                means rebuilding every index, which is slow on a large database
              </li>
              <li>
                <strong>Continuous archiving:</strong> worst case you lose the seconds since the last
                archived segment, and you can stop the recovery at any chosen time
              </li>
              <li>
                Dumps are simple, portable across major versions, and let you restore a single table.
                Archiving is all-or-nothing at the cluster level
              </li>
              <li>
                Archiving costs continuous storage and needs monitoring, because silent archive failure is a
                real risk
              </li>
              <li>
                The usual production answer is both: continuous physical backup with WAL as the primary
                strategy, plus periodic logical dumps for portability and partial restores
              </li>
              <li>
                Force a segment switch with <code>pg_switch_wal()</code> if you need the most recent
                activity archived immediately
              </li>
            </ul>
            <CodeBlock
              title="Two strategies side by side"
              language="bash"
              code={`# Strategy A: nightly logical dump. RPO up to 24 hours.
0 2 * * * pg_dump -Fc -f /backups/shop_$(date +%F).dump shop

# Strategy B: weekly base backup + continuous WAL. RPO seconds.
0 1 * * 0 pgbackrest --stanza=shop backup --type=full
0 1 * * 1-6 pgbackrest --stanza=shop backup --type=incr
# archive_command ships every finished segment automatically

# Make sure the newest activity is archived before a risky change
psql -c 'SELECT pg_switch_wal();'`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Explain Point-in-Time Recovery (PITR).">
            <p>
              PITR restores a base backup and then replays archived WAL up to a target time, a transaction
              id, or a named recovery point. It needs a <code>wal_level</code> high enough for archiving,
              continuous WAL archiving, and a base backup taken before the target. It is what you use to
              recover from operator error, such as a bad DELETE, without losing the whole day.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Recovery always restores the entire cluster, not one table. The common trick is to restore
                to a temporary server, dump the rows you need, then copy them back into production
              </li>
              <li>
                <code>recovery_target_action</code> decides what happens when the target is reached:{' '}
                <code>pause</code> lets you inspect before promoting, which is the safe default
              </li>
              <li>
                Reaching the target creates a new timeline. Keep the old WAL, because you may want to try a
                slightly different target
              </li>
              <li>
                Do not point recovery at your live data directory. Restore into a new directory so the
                original stays untouched
              </li>
              <li>
                Replay speed determines your recovery time. A week of WAL since the last base backup can
                take hours to replay, which is why incremental or more frequent base backups matter
              </li>
            </ul>
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
            <CodeBlock
              title="A full PITR run, step by step"
              language="bash"
              code={`# 1) Restore the base backup into a NEW directory
pgbackrest --stanza=shop --delta \\
  --type=time --target='2026-10-01 14:31:00+05:30' \\
  --target-action=pause \\
  --pg1-path=/var/lib/postgresql/16/recovery restore

# Or by hand:
#   tar -xf base.tar -C /var/lib/postgresql/16/recovery
#   touch /var/lib/postgresql/16/recovery/recovery.signal
#   cat >> postgresql.auto.conf  (restore_command, recovery_target_time,
#                                 recovery_target_action = 'pause')

# 2) Start it on a spare port and watch the log replay
pg_ctl -D /var/lib/postgresql/16/recovery -o '-p 5433' start

# 3) Verify the data landed where you expected, while still paused
psql -p 5433 -d shop -c 'SELECT count(*) FROM orders;'
psql -p 5433 -d shop -c 'SELECT max(created_at) FROM orders;'

# 4) Happy? Finish recovery and open for writes
psql -p 5433 -c 'SELECT pg_wal_replay_resume();'
pg_ctl -D /var/lib/postgresql/16/recovery promote

# 5) Usually you only want the lost rows back in production
pg_dump -p 5433 -Fc -t orders -f recovered_orders.dump shop`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="What exactly do you need in place to restore to an exact minute?">
            <p>
              This is the practical version of the PITR question, and the answer is a checklist. If any one
              item is missing, precise recovery is impossible no matter how good the rest is.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>1. A base backup taken before the target time.</strong> You can only move forward
                through WAL, never backwards
              </li>
              <li>
                <strong>2. An unbroken chain of archived WAL</strong> from that base backup to the target. A
                single missing segment stops recovery there
              </li>
              <li>
                <strong>3. <code>wal_level</code> at least <code>replica</code> and archiving that was
                already on.</strong> You cannot archive the past
              </li>
              <li>
                <strong>4. A recovery target</strong>, which can be a timestamp, a transaction id, an LSN, or
                a named restore point. Named restore points are the most reliable, so create one before any
                risky operation
              </li>
              <li>
                <strong>5. The right timestamp, with a timezone.</strong> Target time is compared against
                commit times, so know whether your log is in UTC or local time, and bear in mind the target
                is inclusive of transactions that committed at or before it
              </li>
              <li>
                <strong>6. Somewhere to restore to:</strong> enough disk for the base backup plus replayed
                WAL, and a separate directory or host
              </li>
              <li>
                <strong>7. The same major version and compatible extensions and libraries,</strong> because
                a physical restore is not portable across major versions
              </li>
              <li>
                <strong>8. A way to find the exact moment.</strong> In practice you get this from
                application logs, an audit table, or <code>pg_waldump</code> on the archived segments
              </li>
              <li>
                <strong>9. A tested runbook.</strong> Everything above is theory until somebody has actually
                run it under time pressure
              </li>
            </ul>
            <CodeBlock
              title="Make the target easy to hit"
              language="sql"
              code={`-- Before a risky migration or bulk update, name the moment
SELECT pg_create_restore_point('before_price_backfill');

-- Then recovery can target the name instead of guessing a timestamp:
-- recovery_target_name = 'before_price_backfill'

-- Confirm what a session considers "now" so timestamps line up
SHOW timezone;
SELECT now(), pg_current_wal_lsn();`}
            />
            <CodeBlock
              title="Finding the bad transaction in the archive"
              language="bash"
              code={`# Which segments do we have, and is the chain complete?
ls /wal_archive | sort | head
pgbackrest --stanza=shop info

# Inspect a segment to find the offending statement boundary
pg_waldump /wal_archive/000000010000000A000000B3 | grep -i 'DELETE' | head

# Target options, pick one:
#   recovery_target_time = '2026-10-01 14:31:00+05:30'
#   recovery_target_xid  = '48219931'
#   recovery_target_lsn  = '0/AB3000028'
#   recovery_target_name = 'before_price_backfill'
#   recovery_target_inclusive = off   # stop just BEFORE the target`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
