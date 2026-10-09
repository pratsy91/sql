import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 2: Streaming and Logical Replication - Module 13 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL interview questions on streaming replication, logical replication, publications and subscriptions, replication slots, retained WAL, DDL limits, and major version upgrades.',
};

export default function Module13Lesson02StreamingAndLogical() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 2: Streaming and Logical Replication</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          PostgreSQL has two ways to copy data to another server. Streaming replication copies the whole
          cluster byte for byte. Logical replication copies chosen tables row by row. Interviewers almost
          always ask you to compare them and to explain replication slots.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="How does streaming replication work?">
            <p>
              The primary sends its WAL (the log of every physical change) over a normal network connection
              to each standby. A process called the <strong>WAL sender</strong> runs on the primary and a{' '}
              <strong>WAL receiver</strong> runs on the standby. The standby writes the WAL to disk and
              replays it into its own data files, so it ends up byte-identical to the primary.
            </p>
            <p>The setup has four parts that candidates are expected to name:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A login role with the <code>REPLICATION</code> attribute
              </li>
              <li>
                A <code>pg_hba.conf</code> line allowing that role to connect for replication
              </li>
              <li>
                Primary settings: <code>wal_level = replica</code> or higher, plus enough{' '}
                <code>max_wal_senders</code> and <code>max_replication_slots</code>
              </li>
              <li>
                A starting copy of the data made with <code>pg_basebackup</code>, then{' '}
                <code>standby.signal</code> and <code>primary_conninfo</code> on the standby
              </li>
            </ul>
            <CodeBlock
              title="Replication role and settings"
              language="sql"
              code={`CREATE ROLE replicator LOGIN REPLICATION PASSWORD 'strong-secret';

-- Primary: postgresql.conf
-- wal_level = replica
-- max_wal_senders = 10
-- max_replication_slots = 10

-- Primary: pg_hba.conf
-- host replication replicator 10.0.0.0/24 scram-sha-256

-- Standby: seed the data directory, create standby.signal, set primary_conninfo
-- pg_basebackup -h primary -U replicator -D /var/lib/postgresql/data -R -P`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What is logical replication? Explain publications and subscriptions."
          >
            <p>
              Logical replication does not ship raw WAL blocks. It <strong>decodes</strong> the WAL back
              into row-level changes (&quot;this row was inserted, this row was updated&quot;) and sends
              those. Because it works at the row level, you can replicate only the tables you care about,
              and the two servers can even run different PostgreSQL major versions.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A <strong>publication</strong> lives on the source (the publisher) and says which tables to
                send.
              </li>
              <li>
                A <strong>subscription</strong> lives on the target (the subscriber) and pulls those changes
                and applies them.
              </li>
              <li>
                It needs <code>wal_level = logical</code> on the publisher.
              </li>
            </ul>
            <CodeBlock
              title="Publication and subscription"
              language="sql"
              code={`-- On the publisher
CREATE PUBLICATION pub_orders FOR TABLE orders, order_items;

-- On the subscriber (the tables must already exist with matching columns)
CREATE SUBSCRIPTION sub_orders
  CONNECTION 'host=primary dbname=shop user=repl password=secret'
  PUBLICATION pub_orders;

-- Watch progress
SELECT subname, received_lsn, latest_end_lsn FROM pg_stat_subscription;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Physical streaming vs logical replication: when do you choose which?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Streaming (physical)</strong>: the whole cluster, byte for byte, read-only standby,
                simplest failover story. Pick it for high availability and read scaling.
              </li>
              <li>
                <strong>Logical</strong>: a subset of tables, works across major versions, and the target is
                a normal writable database. Pick it for major version upgrades with near-zero downtime,
                feeding a data warehouse, or CDC-style integrations (CDC means change data capture, pushing
                row changes into another system).
              </li>
            </ul>
            <p>
              One-line answer for an interview: &quot;Physical for HA, logical for moving or sharing
              data.&quot; Then add the caveat that logical replication does not carry DDL, sequences, or
              large objects, so a cutover needs planning.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are replication slots?">
            <p>
              A slot is a bookmark on the primary. It records how far a specific consumer has read, and it
              tells the primary &quot;do not delete WAL newer than this point yet&quot;. That guarantee is
              the point of slots: a standby can disconnect for a while and still catch up, because the WAL
              it needs was not recycled.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Physical slots</strong> serve streaming standbys.
              </li>
              <li>
                <strong>Logical slots</strong> serve subscriptions and CDC tools, and hold the decoding
                position.
              </li>
              <li>
                The same guarantee is also the danger: a slot nobody reads holds WAL forever and fills the
                disk.
              </li>
            </ul>
            <CodeBlock
              title="Inspect slots"
              language="sql"
              code={`SELECT slot_name, slot_type, active, restart_lsn, confirmed_flush_lsn,
       pg_size_pretty(
         pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
       ) AS retained_wal
FROM pg_replication_slots;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="What happens when an inactive slot keeps WAL? How do you handle it?"
          >
            <p>
              This is one of the most common real production outages, so it is a favourite question. If a
              replica is decommissioned or a CDC consumer crashes but its slot is left behind, the primary
              keeps every WAL segment from that slot onward. <code>pg_wal</code> grows without limit until
              the disk is full, and then the primary stops accepting writes. A read-scaling feature has now
              taken down your write path.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Monitor</strong>: alert on retained WAL bytes per slot and on{' '}
                <code>active = false</code>.
              </li>
              <li>
                <strong>Cap it</strong>: <code>max_slot_wal_keep_size</code> (PostgreSQL 13 and later) lets
                the server invalidate a slot instead of running out of disk. The slot dies, the cluster
                survives, and that is the right trade.
              </li>
              <li>
                <strong>Clean up</strong>: always drop the slot when you drop the replica or the
                subscription.
              </li>
            </ul>
            <CodeBlock
              title="Find and drop a stale slot"
              language="sql"
              code={`-- Which slots are abandoned and how much WAL are they pinning?
SELECT slot_name, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots
WHERE NOT active
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;

-- Remove one you are sure is dead
SELECT pg_drop_replication_slot('old_standby_slot');

-- Safety net in postgresql.conf: never pin more than 50GB for a slot
-- max_slot_wal_keep_size = '50GB'`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="Why is DDL not replicated by logical replication? How do you handle schema changes?"
          >
            <p>
              Logical replication sends decoded <em>row</em> changes only. A statement like{' '}
              <code>ALTER TABLE orders ADD COLUMN note text</code> changes the catalog, not rows, so nothing
              is sent. The subscriber keeps its old table definition, and the moment a new row arrives that
              contains a column the subscriber does not know about, the apply worker errors out and
              replication stops until you fix it by hand.
            </p>
            <p>The safe order for an additive change:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Apply the DDL on the subscriber first</li>
              <li>Then apply the same DDL on the publisher</li>
              <li>
                For a dropped column, reverse it: publisher first, subscriber second
              </li>
              <li>
                New tables need the DDL on both sides plus{' '}
                <code>ALTER PUBLICATION ... ADD TABLE</code> and{' '}
                <code>ALTER SUBSCRIPTION ... REFRESH PUBLICATION</code>
              </li>
            </ul>
            <p>
              If you use Prisma, this means <code>prisma migrate deploy</code> must be run against both
              databases in the correct order. Do not assume the replica picks up the migration.
            </p>
            <CodeBlock
              title="Adding a table to an existing publication"
              language="sql"
              code={`-- 1. Create the table on the subscriber (same columns and types)
-- 2. Create the table on the publisher
-- 3. Publisher: start sending it
ALTER PUBLICATION pub_orders ADD TABLE shipments;

-- 4. Subscriber: notice the new table and copy its initial data
ALTER SUBSCRIPTION sub_orders REFRESH PUBLICATION;

-- If apply has stopped, this shows the error
SELECT * FROM pg_stat_subscription_stats;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="Logical replication gotchas interviewers love">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The <strong>initial sync</strong> copies whole tables and can be very heavy. Plan the
                cutover window around it.
              </li>
              <li>
                DDL is not replicated. Schema changes must be coordinated on both sides.
              </li>
              <li>
                <code>UPDATE</code> and <code>DELETE</code> need a way to identify the row. That means a
                primary key, or an explicit <code>REPLICA IDENTITY</code>. Without one the publisher raises
                an error.
              </li>
              <li>
                The subscriber is writable, so local writes can create conflicts (usually a duplicate key)
                that stall apply until you resolve them.
              </li>
              <li>
                <strong>Sequences are not replicated.</strong> After a cutover you must reset every
                sequence, or the new primary will hand out IDs that already exist.
              </li>
              <li>
                Slot and apply lag monitoring is mandatory, not optional.
              </li>
              <li>
                <code>TRUNCATE</code> is replicated only in PostgreSQL 11 and later, and large objects never
                are.
              </li>
            </ul>
            <CodeBlock
              title="Replica identity and sequence fix-up"
              language="sql"
              code={`-- Preferred: DEFAULT, which uses the primary key
ALTER TABLE orders REPLICA IDENTITY DEFAULT;

-- No primary key? FULL logs every column, which is correct but slow
ALTER TABLE legacy_audit REPLICA IDENTITY FULL;

-- After a cutover, advance sequences past the copied data
SELECT setval(
  pg_get_serial_sequence('orders', 'id'),
  (SELECT COALESCE(MAX(id), 1) FROM orders)
);`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do you upgrade a major version with logical replication and near-zero downtime?"
          >
            <p>
              This is the strongest practical reason to know logical replication. Because the publisher and
              subscriber can run different major versions, you can build the new server beside the old one
              and switch over in seconds, instead of taking an hours-long <code>pg_upgrade</code> outage.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Install PostgreSQL 17 on new hardware and create an empty database.</li>
              <li>
                Copy the schema only, with <code>pg_dump --schema-only</code>, or run your Prisma
                migrations against the new database.
              </li>
              <li>
                Create the publication on the old server (PostgreSQL 15) and the subscription on the new
                one. Let the initial copy finish and then let it stream until lag is near zero.
              </li>
              <li>
                Cutover: stop application writes, wait for lag to hit zero, reset all sequences, point the
                app at the new host, drop the subscription.
              </li>
              <li>
                Keep the old server intact and read-only for a while so you can roll back.
              </li>
            </ul>
            <p>
              Trade-off to mention: this is more moving parts than <code>pg_upgrade --link</code>, which is
              much simpler but needs real downtime. Choose based on how much downtime the business will
              accept.
            </p>
            <CodeBlock
              title="Upgrade cutover sketch"
              language="sql"
              code={`-- Old server (PG 15)
ALTER SYSTEM SET wal_level = 'logical';   -- needs a restart
CREATE PUBLICATION pub_all FOR ALL TABLES;

-- New server (PG 17), schema already created
CREATE SUBSCRIPTION sub_all
  CONNECTION 'host=old-db dbname=shop user=repl password=secret'
  PUBLICATION pub_all;

-- Wait until this is effectively zero before cutting over
SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) AS behind_bytes
FROM pg_replication_slots WHERE slot_name = 'sub_all';

-- After the switch, on the new server
DROP SUBSCRIPTION sub_all;`}
            />
            <CodeBlock
              title="Prisma side of the upgrade"
              language="typescript"
              code={`// Build the new database schema with your existing migration history,
// so the new server is structurally identical before replication starts.
//   DATABASE_URL=postgresql://user:pw@new-db:5432/shop npx prisma migrate deploy
//
// At cutover you only change the connection string. No application code changes.`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
