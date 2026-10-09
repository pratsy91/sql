import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 1: Replication Basics - Module 13 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL replication basics interview questions: primary vs replica, read replicas, read-only standbys, hot standby, sync vs async, replication lag, and why replication is not a backup.',
};

export default function Module13Lesson01ReplicationBasics() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 1: Replication Basics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Replication means PostgreSQL keeps a second copy of your database on another server. One server
          takes the writes, the other copies follow along. This lesson covers the words interviewers use
          most: primary, replica, standby, hot standby, and lag.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="What are a primary and a replica in PostgreSQL?">
            <p>
              The <strong>primary</strong> is the one server that accepts writes. Every change it makes is
              first written to the WAL (the Write-Ahead Log, an ordered list of every change). A{' '}
              <strong>replica</strong> (also called a <strong>standby</strong>) reads that WAL and applies
              the same changes to its own copy of the data, so it stays almost identical to the primary.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Primary: read and write. The single source of truth.</li>
              <li>Replica: read-only. It follows the primary.</li>
              <li>Good for: staying online if a server dies, and spreading out read traffic.</li>
              <li>
                Not good for: undoing mistakes. A bad <code>DELETE</code> is copied to the replica too.
              </li>
            </ul>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why use read replicas? What are common use cases?">
            <ul className="list-disc pl-6 space-y-1">
              <li>Move heavy reporting and analytics <code>SELECT</code> queries off the primary</li>
              <li>Scale read-heavy APIs such as product catalogs and feeds</li>
              <li>Keep BI tools (dashboards) away from the server that handles customer writes</li>
              <li>Keep a warm standby ready so a failure can be recovered from faster</li>
            </ul>
            <p>
              With Prisma you can create a second client that points at the replica URL and use it only for
              read paths. Never send writes or migrations there.
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

// Read-only path: safe on the replica
const products = await prismaRead.product.findMany({ take: 50 });

// Writes and migrations: primary only
await prismaWrite.order.create({ data: { total: 1999, userId: 'u_1' } });`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Can you write to a streaming replica? Why not?">
            <p>
              No. A streaming replica is <strong>read-only</strong>. It is replaying the primary WAL in
              exact order, so letting it invent its own changes would break that order and the two copies
              would drift apart forever. An <code>INSERT</code> on a standby fails with a
              &quot;cannot execute INSERT in a read-only transaction&quot; error.
            </p>
            <p>
              The only way a standby starts accepting writes is if you <strong>promote</strong> it, which
              means it stops being a replica and becomes a primary. Saying &quot;I would send some writes
              to the replica to spread the load&quot; is the classic wrong answer interviewers listen for.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Synchronous vs asynchronous replication at a high level?">
            <p>
              The difference is simply: does the primary wait for the replica before telling your app
              &quot;commit done&quot;?
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Asynchronous</strong> (the default): the primary commits immediately and sends the
                WAL afterwards. Fast writes, but if the primary dies right then, the last few commits may
                never have reached the replica.
              </li>
              <li>
                <strong>Synchronous</strong>: the primary waits until at least one standby confirms it has
                the data. Almost no data loss, but every commit now pays the network round trip, and if the
                standby is down your writes can stall.
              </li>
            </ul>
            <p>
              The trade-off has a name: async gives you a small <strong>RPO</strong> (recovery point
              objective, meaning how much data you could lose) that is not zero, sync gets you close to
              zero at the cost of write latency.
            </p>
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What is replication lag?">
            <p>
              Lag is how far behind the primary a replica currently is. You can measure it in bytes of WAL
              not yet applied, or in seconds of delay. Common causes are slow network, slow disks on the
              standby, long-running queries on the standby, or a single replay process that cannot keep up
              with a write burst.
            </p>
            <p>
              Practical effect: an app reading from a replica may not see a row it just inserted on the
              primary. That is the &quot;read-your-writes&quot; problem, and you must design for it.
            </p>
            <CodeBlock
              title="Check lag"
              language="sql"
              code={`-- On the primary: how far behind is each standby, in bytes?
SELECT client_addr, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_lag
FROM pg_stat_replication;

-- On the replica: how old is the newest change it has applied?
SELECT now() - pg_last_xact_replay_timestamp() AS replay_delay;`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="What does hot standby mean?">
            <p>
              A <strong>hot standby</strong> is a replica that you can run <code>SELECT</code> queries
              against <em>while</em> it is still applying WAL. That is the normal setup today and is
              controlled by <code>hot_standby = on</code>, which has been the default since PostgreSQL 10.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Warm standby</strong>: it applies WAL but refuses connections for queries. It only
                exists to take over.
              </li>
              <li>
                <strong>Hot standby</strong>: it applies WAL and also serves read-only queries.
              </li>
            </ul>
            <p>
              So &quot;hot&quot; does not mean faster failover. It means &quot;queryable while
              recovering&quot;.
            </p>
            <CodeBlock
              title="Relevant settings"
              language="sql"
              code={`-- postgresql.conf on the standby
hot_standby = on               -- allow read-only queries (default since PG 10)

-- Let long reporting queries finish instead of being cancelled by WAL replay
max_standby_streaming_delay = 30s`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="How do you check whether a node is a replica?">
            <p>
              One function answers it: <code>pg_is_in_recovery()</code>. It returns <code>true</code> on a
              replica (because a replica is permanently &quot;in recovery&quot;, replaying WAL) and{' '}
              <code>false</code> on a primary. This is the check health endpoints and connection routers
              use before sending a write.
            </p>
            <CodeBlock
              title="Is this node a primary or a replica?"
              language="sql"
              code={`SELECT pg_is_in_recovery();   -- true = replica, false = primary

-- Human readable version
SELECT CASE WHEN pg_is_in_recovery() THEN 'replica' ELSE 'primary' END AS role;

-- A primary lists its connected standbys here (empty on a replica)
SELECT application_name, state, sync_state FROM pg_stat_replication;

-- A replica shows who it is streaming from (empty on a primary)
SELECT status, sender_host, latest_end_lsn FROM pg_stat_wal_receiver;`}
            />
            <CodeBlock
              title="Same check from Prisma"
              language="typescript"
              code={`const rows = await prisma.$queryRawUnsafe(
  'SELECT pg_is_in_recovery() AS is_replica'
);
if (rows[0].is_replica) {
  throw new Error('Refusing to write: this connection points at a replica');
}`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard
            level="Mid"
            question="Does replication protect you from a bad DELETE? Is a replica a backup?"
          >
            <p>
              No, and no. Replication copies <em>everything</em>, including your mistake. If someone runs{' '}
              <code>DELETE FROM orders</code> without a <code>WHERE</code> clause, the replica faithfully
              deletes the same rows a fraction of a second later. Replication protects you from{' '}
              <strong>hardware and host failure</strong>, not from <strong>human or application error</strong>.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                What actually saves you: real backups plus <strong>PITR</strong> (point-in-time recovery,
                meaning restore a base backup and then replay WAL up to the second before the mistake).
              </li>
              <li>
                A <strong>delayed replica</strong> can buy you time. Setting{' '}
                <code>recovery_min_apply_delay</code> keeps a standby intentionally behind, so you have a
                window to stop it before the bad statement is applied.
              </li>
              <li>
                Also cheap and effective: run destructive SQL inside a transaction and check the row count
                before committing.
              </li>
            </ul>
            <CodeBlock
              title="Delayed replica and a safe delete habit"
              language="sql"
              code={`-- On a standby: stay 1 hour behind the primary on purpose
-- postgresql.conf
recovery_min_apply_delay = '1h'

-- Safe habit on the primary: look before you leap
BEGIN;
DELETE FROM orders WHERE created_at < '2020-01-01';
-- Check the reported row count. Wrong number? ROLLBACK.
COMMIT;`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
