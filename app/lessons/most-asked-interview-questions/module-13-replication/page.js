import LessonLayout from '../../../components/LessonLayout';
import CodeBlock from '../../../components/CodeBlock';
import InterviewQACard from '../../../components/InterviewQACard';

export const metadata = {
  title: 'Module 13: Replication - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL replication interview questions: streaming replication, sync vs async, lag, logical replication, slots, failover, and read replica use cases.',
};

export default function Module13() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Module 13: Replication</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Most asked interview questions for Phase 13 — Junior → Senior. Covers primary/replica topology,
          streaming vs logical replication, sync/async tradeoffs, lag, slots, failover, and when not to
          write to replicas (PostgreSQL 15/16/17).
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-700 dark:text-emerald-400">
            Junior Level
          </h2>

          <InterviewQACard level="Junior" question="What are a primary and a replica in PostgreSQL?">
            <p>
              The <strong>primary</strong> (publisher / read-write leader) accepts writes and produces WAL.
              A <strong>replica</strong> (standby) continuously applies that WAL and typically serves
              read-only queries. This improves availability and read scale-out but does not by itself
              protect against logical corruption or bad deletes.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why use read replicas? Common use cases?">
            <ul className="list-disc pl-5 space-y-1">
              <li>Offload heavy reporting / analytics SELECTs</li>
              <li>Scale read-heavy APIs (product catalogs, feeds)</li>
              <li>Isolate BI tools from the primary</li>
              <li>Provide a warm standby for faster failover</li>
            </ul>
            <p>
              With Prisma, you can point a second client at a replica URL for read-only paths—never for
              migrations or writes.
            </p>
            <CodeBlock
              title="Separate Prisma clients (pattern)"
              language="typescript"
              code={`const prismaWrite = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});
const prismaRead = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_REPLICA_URL } },
});

const products = await prismaRead.product.findMany({ take: 50 });
await prismaWrite.order.create({ data: { ... } });`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Can you write to a streaming replica? Why not?">
            <p>
              A hot standby is <strong>read-only</strong>. Writes must go to the primary so there is a
              single source of truth and WAL order stays consistent. Attempting writes on a standby fails
              (unless you promote it). Using a replica for writes is a common interview “trap” answer to
              reject.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Synchronous vs asynchronous replication—high level?">
            <p>
              <strong>Async</strong> (default): primary commits without waiting for replica flush—lower
              write latency, possible data loss on crash. <strong>Sync</strong>: primary waits for at least
              one synchronous standby to confirm—stronger durability, higher commit latency and
              availability coupling.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is replication lag?">
            <p>
              Lag is how far a replica is behind the primary (in time or WAL LSN). Causes include network
              delay, slow disks, heavy queries on the standby, or insufficient apply capacity. Apps reading
              from replicas must tolerate stale data (e.g., “read-your-writes” issues right after insert).
            </p>
            <CodeBlock
              title="Check lag"
              language="sql"
              code={`-- On primary
SELECT client_addr, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_lag
FROM pg_stat_replication;

-- On replica
SELECT now() - pg_last_xact_replay_timestamp() AS replay_delay;`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-400">
            Mid Level
          </h2>

          <InterviewQACard level="Mid" question="How does streaming replication work?">
            <p>
              The primary ships WAL records over the replication protocol to standbys. Standbys write WAL
              and replay it into their data files. Setup typically needs a replication user,{' '}
              <code>pg_hba.conf</code> entries, <code>wal_level = replica</code> (or higher), sufficient{' '}
              <code>max_wal_senders</code>, and a base backup to seed the standby (<code>pg_basebackup</code>).
            </p>
            <CodeBlock
              title="Replication role"
              language="sql"
              code={`CREATE ROLE replicator LOGIN REPLICATION PASSWORD '...';
-- Primary: wal_level=replica, max_wal_senders, max_replication_slots
-- Standby: standby.signal (PG 12+) + primary_conninfo`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is logical replication? Publications and subscriptions?">
            <p>
              Logical replication decodes row changes and replicates selected tables—useful for major
              version upgrades, selective replication, or feeding other systems. A{' '}
              <strong>publication</strong> on the publisher defines which tables/changes to send; a{' '}
              <strong>subscription</strong> on the subscriber pulls and applies them.
            </p>
            <CodeBlock
              title="Publication / subscription"
              language="sql"
              code={`-- Publisher
CREATE PUBLICATION pub_orders FOR TABLE orders, order_items;

-- Subscriber
CREATE SUBSCRIPTION sub_orders
  CONNECTION 'host=primary dbname=shop user=repl password=...'
  PUBLICATION pub_orders;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="Physical streaming vs logical replication—when to choose which?">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Streaming (physical)</strong>: whole-cluster HA, exact binary replica, simplest
                failover path
              </li>
              <li>
                <strong>Logical</strong>: subset of tables, cross-version upgrades, multi-primary-ish
                fan-out (with care), CDC-style integrations
              </li>
            </ul>
            <p>
              Logical does not replicate DDL the same way; sequences, large objects, and some object types
              need extra planning.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What are replication slots?">
            <p>
              Slots track how far a consumer (physical or logical) has read WAL so the primary retains
              needed segments. They prevent premature WAL removal—but a forgotten/broken slot can fill the
              disk. Monitor <code>pg_replication_slots</code> and alert on retained WAL size.
            </p>
            <CodeBlock
              title="Inspect slots"
              language="sql"
              code={`SELECT slot_name, slot_type, active, restart_lsn, confirmed_flush_lsn,
       pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS retained_bytes
FROM pg_replication_slots;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="How do you handle read-your-writes when using a Prisma read replica?">
            <p>
              After a write on the primary, a follow-up read on a lagged replica may miss the new row.
              Patterns: read from primary for the same request/session after writes; route critical paths
              to primary; use synchronous replication (costly); or show eventual consistency in the UX.
            </p>
            <CodeBlock
              title="Route after write"
              language="typescript"
              code={`const order = await prismaWrite.order.create({ data });
// Same request: read from primary to avoid lag
const fresh = await prismaWrite.order.findUnique({ where: { id: order.id } });`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is failover at a high level?">
            <p>
              If the primary fails, a standby is <strong>promoted</strong> to accept writes (e.g.,{' '}
              <code>pg_ctl promote</code> or remove <code>standby.signal</code> / use orchestrators like
              Patroni). Clients must reconnect to the new primary (DNS, proxy, or PgBouncer). Old primary
              must not rejoin as primary without repair—risk of split-brain.
            </p>
          </InterviewQACard>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-amber-700 dark:text-amber-400">
            Senior Level
          </h2>

          <InterviewQACard level="Senior" question="Deep dive: sync vs async tradeoffs in production.">
            <p>
              Async maximizes primary throughput and survives replica outages without blocking commits. Sync
              reduces data-loss window but ties commit latency to the slowest sync standby; if all sync
              standbys die, writes stall (unless you reconfigure). Many teams use async for scale-out
              replicas and sync (or quorum sync in PG) for a nearby HA standby. Document RPO implications
              clearly.
            </p>
            <CodeBlock
              title="Sync config sketch"
              language="sql"
              code={`-- postgresql.conf on primary
synchronous_commit = on
synchronous_standby_names = 'FIRST 1 (standby1)'
-- Measure p99 commit latency before/after enabling`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="When should you NOT use a replica (or replication alone) for a problem?">
            <ul className="list-disc pl-5 space-y-1">
              <li>As your only backup (replicas replicate DELETE/TRUNCATE too)</li>
              <li>For strong cross-region consistency without accepting lag or sync cost</li>
              <li>For write scaling (need sharding/partitioning/CQRS, not more standbys)</li>
              <li>When the app cannot tolerate stale reads and you refuse to route to primary</li>
              <li>When disk/WAL retention from slots is unmanaged</li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do cascading replication and hot standby queries affect design?">
            <p>
              Cascading lets a standby feed other standbys to reduce load on the primary. Hot standby
              allows queries during recovery; long-running queries can conflict with WAL apply (
              <code>max_standby_streaming_delay</code>). Tune apply vs query cancellation based on whether
              the replica is for HA (prefer apply) or reporting (prefer queries).
            </p>
          </InterviewQACard>

          <InterviewQACard level="Senior" question="Logical replication gotchas interviewers love">
            <ul className="list-disc pl-5 space-y-1">
              <li>Initial table sync / copy can be heavy; plan cutovers</li>
              <li>DDL is not fully automatic—coordinate schema changes</li>
              <li>Primary keys (or replica identity) required for UPDATEs/DELETEs</li>
              <li>Conflicts on subscriber if writes happen locally</li>
              <li>Slots and apply lag monitoring are mandatory</li>
              <li>Sequences need separate handling for cutover</li>
            </ul>
            <CodeBlock
              title="Replica identity"
              language="sql"
              code={`ALTER TABLE orders REPLICA IDENTITY FULL;  -- or DEFAULT using PK
-- Prefer PK/UNIQUE for REPLICA IDENTITY DEFAULT`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How would you explain HA architecture with PostgreSQL + Prisma to an interviewer?">
            <p>
              Primary for all Prisma writes and migrations; one sync (or async) streaming standby for HA;
              optional async replicas for read scaling with explicit stale-read handling; connection
              pooler with primary/replica routing; automated failover with fencing; backups/PITR still
              required. Prisma does not manage replication—topology lives in infra, app only chooses URLs.
            </p>
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
