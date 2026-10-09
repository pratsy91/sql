import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 3: High Availability and Failover - Module 13 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL HA interview questions: failover, promoting a replica, split brain and fencing, sync vs async trade-offs, read-your-writes with Prisma, connection routing, and HA architecture.',
};

export default function Module13Lesson03HaAndFailover() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 3: High Availability and Failover</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          High availability (HA) means the database keeps serving even when a server dies. That needs more
          than a replica: something must notice the failure, pick a new primary, and make sure your app
          reconnects to the right place. These are the design questions senior interviews focus on.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What is failover at a high level?">
            <p>
              Failover is the act of turning a standby into the new primary because the old primary is gone.
              Three things have to happen, in this order:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Detect</strong>: something decides the primary is really dead and not just slow.
              </li>
              <li>
                <strong>Promote</strong>: one standby is promoted and starts accepting writes.
              </li>
              <li>
                <strong>Redirect</strong>: clients must find the new primary, through DNS, a virtual IP, or
                a pooler such as PgBouncer or HAProxy.
              </li>
            </ul>
            <p>
              In production a tool does this, not a human: Patroni, repmgr, or your cloud provider&apos;s
              managed failover. And the old primary must never come back as a primary without being
              rebuilt, or you get split brain.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you promote a replica?">
            <p>
              Promotion tells the standby to stop replaying WAL from the old primary and become writable.
              After it happens, <code>pg_is_in_recovery()</code> flips from <code>true</code> to{' '}
              <code>false</code> and the node starts its own new WAL timeline (a timeline is a branch number
              PostgreSQL uses so the old and new histories cannot be confused).
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>pg_ctl promote</code> or the SQL function <code>pg_promote()</code> is the actual
                mechanism.
              </li>
              <li>
                Other standbys were following the old primary, so they must be re-pointed at the new one
                (<code>pg_rewind</code> is the usual tool) or rebuilt.
              </li>
              <li>
                The old primary must be <strong>fenced</strong>, meaning shut down or blocked from the
                network, before you promote.
              </li>
              <li>Promotion is one-way. Going back means rebuilding the node as a standby.</li>
            </ul>
            <CodeBlock
              title="Promotion and verification"
              language="sql"
              code={`-- From a shell on the standby
--   pg_ctl promote -D /var/lib/postgresql/data

-- Or from SQL on the standby (PostgreSQL 12 and later)
SELECT pg_promote(wait => true, wait_seconds => 60);

-- Confirm it worked
SELECT pg_is_in_recovery();          -- now false
SELECT timeline_id FROM pg_control_checkpoint();  -- incremented

-- Re-point a surviving standby at the new primary, then reload
-- ALTER SYSTEM SET primary_conninfo = 'host=new-primary user=replicator';
-- SELECT pg_reload_conf();`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you handle read-your-writes when using a Prisma read replica?"
          >
            <p>
              The problem: you write a row on the primary, immediately read it back from a replica that is
              200 ms behind, and get nothing. The user sees their own change disappear. Replication lag is
              normal, so the application has to decide what to do about it.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Simplest and best</strong>: after a write, read from the primary for the rest of that
                request or session.
              </li>
              <li>
                <strong>Route by path</strong>: user-facing dashboards go to the primary, analytics and
                reports go to replicas.
              </li>
              <li>
                <strong>Return the written row</strong> from the write itself instead of re-reading it.
              </li>
              <li>
                <strong>Synchronous replication</strong> removes the lag but makes every commit slower.
              </li>
              <li>
                <strong>Design the UX for it</strong>: show an optimistic result and refresh later.
              </li>
            </ul>
            <CodeBlock
              title="Route reads to the primary right after a write"
              language="typescript"
              code={`const order = await prismaWrite.order.create({ data });

// Same request: read from the primary so we cannot miss our own write
const fresh = await prismaWrite.order.findUnique({
  where: { id: order.id },
  include: { items: true },
});

// A later, unrelated report can safely use the replica
const monthly = await prismaRead.order.groupBy({
  by: ['status'],
  _count: true,
});`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Mid"
            question="How do you route reads and writes to different nodes?"
          >
            <p>
              Somebody has to decide which connection a query goes to. There are three places to do it, and
              interviewers like hearing the trade-offs.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>In the application</strong>: two Prisma clients, one per URL. Fully explicit, easy to
                reason about, but every developer must remember which client to use.
              </li>
              <li>
                <strong>In a pooler or proxy</strong>: PgBouncer with HAProxy, pgpool, or a cloud reader
                endpoint. The app sees one host, and failover is handled below the app. This is the common
                production choice.
              </li>
              <li>
                <strong>By DNS</strong>: a writer record and a reader record. Simple, but DNS caching makes
                failover slow.
              </li>
            </ul>
            <p>
              Two rules regardless of approach: migrations always go to the primary, and the pool must
              refuse writes on a replica rather than fail deep inside a transaction.
            </p>
            <CodeBlock
              title="Explicit routing with a guard"
              language="typescript"
              code={`// lib/db.ts
import { PrismaClient } from '@prisma/client';

export const dbWrite = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

export const dbRead = process.env.DATABASE_REPLICA_URL
  ? new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_REPLICA_URL } },
    })
  : dbWrite; // no replica configured: fall back to the primary safely

// Startup check so a misconfigured URL fails loudly, not at 3am
export async function assertRoles() {
  const [w] = await dbWrite.$queryRawUnsafe(
    'SELECT pg_is_in_recovery() AS replica'
  );
  if (w.replica) throw new Error('DATABASE_URL points at a replica');
}`}
            />
            <CodeBlock
              title="HAProxy style health checks"
              language="sql"
              code={`-- The writer backend accepts a node only when this returns false
SELECT pg_is_in_recovery();

-- The reader backend accepts a node only when it returns true
-- and lag is acceptable
SELECT now() - pg_last_xact_replay_timestamp() < interval '5 seconds' AS fresh;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What is split brain, and how do you prevent it?">
            <p>
              Split brain is when two nodes both believe they are the primary and both accept writes. Now
              you have two divergent histories, and there is no automatic way to merge them. Some customer
              orders exist on one node only, some on the other. Recovering means choosing which writes to
              throw away.
            </p>
            <p>
              How it happens: the network partitions, the monitoring tool cannot reach the primary, it
              assumes the primary is dead and promotes a standby. But the old primary was healthy the whole
              time and kept serving the clients on its side of the partition.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Fencing / STONITH</strong>: before promoting, forcibly stop the old primary. Kill the
                VM, revoke its network access, or remove its virtual IP.
              </li>
              <li>
                <strong>Quorum</strong>: require a majority of nodes to agree before promoting. Patroni gets
                this from a distributed store such as etcd or Consul, so a minority partition can never
                promote.
              </li>
              <li>
                <strong>Demote on isolation</strong>: a primary that loses sight of the cluster should make
                itself read-only instead of continuing to accept writes.
              </li>
              <li>
                <strong>One routing source of truth</strong>: if clients reach the database only through a
                proxy that follows the leader key, an orphaned primary gets no traffic.
              </li>
            </ul>
            <p>
              The honest senior answer: split brain is prevented by consensus and fencing at the
              orchestration layer, not by PostgreSQL itself. Hand-written failover scripts are where teams
              get burned.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Deep dive: sync vs async trade-offs in production.">
            <p>
              Asynchronous replication keeps the primary fast and keeps it running even if every replica is
              down, because commits never wait. The cost is a non-zero <strong>RPO</strong>: on a sudden
              primary loss you lose whatever had not shipped yet.
            </p>
            <p>
              Synchronous replication shrinks that loss window to almost nothing, but now every commit waits
              for a network round trip to the slowest synchronous standby, and if no synchronous standby is
              available your writes block until you reconfigure. Availability and durability pull against
              each other here.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A common shape: one nearby synchronous standby for HA, plus asynchronous replicas further
                away for read scaling and disaster recovery.
              </li>
              <li>
                <code>ANY 1 (s1, s2)</code> means any one of two standbys can satisfy the wait, so one slow
                node does not stall commits. This is quorum commit.
              </li>
              <li>
                <code>synchronous_commit</code> has levels. <code>remote_write</code> waits for the standby
                OS, <code>on</code> waits for its disk flush, <code>remote_apply</code> waits until the row
                is visible to readers there. Only <code>remote_apply</code> gives consistent reads on that
                standby, and it is the slowest.
              </li>
              <li>
                You can set it per transaction, so only money-moving writes pay the cost.
              </li>
              <li>Always measure p99 commit latency before and after. Do not guess.</li>
            </ul>
            <CodeBlock
              title="Quorum sync, plus per-transaction control"
              language="sql"
              code={`-- postgresql.conf on the primary
synchronous_commit = on
synchronous_standby_names = 'ANY 1 (standby1, standby2)'

-- Who is actually synchronous right now?
SELECT application_name, sync_state, state FROM pg_stat_replication;

-- Cheap writes opt out of waiting
BEGIN;
SET LOCAL synchronous_commit = off;
INSERT INTO page_views (path, at) VALUES ('/home', now());
COMMIT;

-- Critical writes can demand visibility on the standby
BEGIN;
SET LOCAL synchronous_commit = remote_apply;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="When should you NOT use a replica (or replication alone) for a problem?"
          >
            <ul className="list-disc pl-6 space-y-1">
              <li>
                As your only backup. Replicas copy <code>DELETE</code> and <code>TRUNCATE</code> too. You
                still need backups and point-in-time recovery.
              </li>
              <li>
                For strong cross-region consistency, unless you accept either lag or the latency of
                synchronous commit across regions.
              </li>
              <li>
                For write scaling. More standbys add zero write capacity. That needs partitioning, sharding,
                or removing work from the write path.
              </li>
              <li>
                When the app genuinely cannot tolerate stale reads and you are unwilling to route those
                reads to the primary.
              </li>
              <li>
                When nobody owns slot and WAL retention monitoring. An abandoned slot can fill the primary
                disk and stop all writes.
              </li>
              <li>
                To fix a slow query. A slow query is still slow on a replica. Fix the query or the index
                first.
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How do cascading replication and hot standby queries affect design?"
          >
            <p>
              <strong>Cascading replication</strong> means a standby can feed other standbys instead of every
              standby streaming from the primary. That keeps WAL sender load and network fan-out off the
              primary, which matters across regions: ship WAL once to a regional standby, and let local
              replicas chain from it. The cost is added lag for the downstream nodes and a longer chain to
              repair during failover.
            </p>
            <p>
              <strong>Hot standby query conflicts</strong> are the subtler half. WAL replay may need to
              remove a row version that a long-running query on the standby is still reading. PostgreSQL has
              to pick one: delay replay, or cancel the query.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <code>max_standby_streaming_delay</code> is how long replay may wait for queries. Small
                values favour freshness, large values favour long reports.
              </li>
              <li>
                <code>hot_standby_feedback = on</code> tells the primary which rows the standby still needs,
                so <code>VACUUM</code> holds off. It prevents most cancellations but can cause bloat on the
                primary.
              </li>
              <li>
                Practical split: <strong>HA standbys</strong> prioritise replay, so keep the delay low. A{' '}
                <strong>reporting replica</strong> prioritises queries, so allow a large delay and accept
                that it sits further behind.
              </li>
            </ul>
            <p>
              Trying to make one replica serve both HA and heavy analytics is the design mistake. Give each
              job its own node with its own settings.
            </p>
            <CodeBlock
              title="Two replicas, two personalities"
              language="sql"
              code={`-- HA standby: stay current, cancel long queries if needed
-- max_standby_streaming_delay = 10s
-- hot_standby_feedback = off

-- Reporting replica: let big queries finish, tolerate lag
-- max_standby_streaming_delay = 30min
-- hot_standby_feedback = on

-- Cascading: a standby streams from another standby
-- ALTER SYSTEM SET primary_conninfo = 'host=regional-standby user=replicator';

-- Did a query get cancelled by replay? Check the conflict counters
SELECT datname, confl_snapshot, confl_lock, confl_bufferpin
FROM pg_stat_database_conflicts;`}
            />
          </InterviewQACard>

          <InterviewQACard
            level="Senior"
            question="How would you explain an HA architecture with PostgreSQL and Prisma to an interviewer?"
          >
            <p>Answer it as layers, from the database outwards:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Data layer</strong>: one primary takes all writes. One nearby standby, synchronous or
                quorum-synchronous, exists purely for HA. Optional asynchronous replicas handle reporting and
                read scaling.
              </li>
              <li>
                <strong>Orchestration</strong>: Patroni with etcd, or the managed provider&apos;s failover.
                It owns detection, quorum, promotion, and fencing so no human races the machine.
              </li>
              <li>
                <strong>Connection layer</strong>: a pooler with a writer endpoint and a reader endpoint.
                Health checks use <code>pg_is_in_recovery()</code>, so the writer endpoint always follows the
                real primary.
              </li>
              <li>
                <strong>Application layer</strong>: Prisma gets two clients. The write client holds{' '}
                <code>DATABASE_URL</code> and is the only one used for mutations and{' '}
                <code>prisma migrate deploy</code>. The read client holds the reader URL and is used for
                lag-tolerant reads. Paths that need read-your-writes use the write client on purpose.
              </li>
              <li>
                <strong>Durability layer</strong>: backups plus WAL archiving for point-in-time recovery,
                restores tested on a schedule. Replication is not a backup.
              </li>
              <li>
                <strong>Observability</strong>: alerts on replication lag, slot retained WAL, standby count,
                and failover events.
              </li>
            </ul>
            <p>
              The closing line that lands well: Prisma does not manage replication at all. The topology lives
              in infrastructure, and the application only chooses which connection string a query uses.
            </p>
            <CodeBlock
              title="Environment shape"
              language="typescript"
              code={`// .env
// DATABASE_URL=postgresql://app@pgbouncer-writer:6432/shop?connection_limit=10
// DATABASE_REPLICA_URL=postgresql://app@pgbouncer-reader:6432/shop?connection_limit=20

// Migrations must never run against the reader endpoint.
// CI deploy step:
//   DATABASE_URL=$DATABASE_URL npx prisma migrate deploy`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
