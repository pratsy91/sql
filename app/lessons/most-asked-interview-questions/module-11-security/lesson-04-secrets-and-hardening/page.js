import LessonLayout from '../../../../components/LessonLayout';
import CodeBlock from '../../../../components/CodeBlock';
import InterviewQACard from '../../../../components/InterviewQACard';

export const metadata = {
  title: 'Lesson 4: Secrets and Hardening - Module 11 - Most Asked Interview Questions',
  description:
    'Most asked PostgreSQL hardening interview questions: handling connection secrets, never logging the connection string, sslmode options, encryption at rest vs in transit, pg_hba and SCRAM, credential rotation, and least-privilege Prisma migrations.',
};

export default function MaiqSecLesson04SecretsHardening() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-2">Lesson 4: Secrets and Hardening</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          A perfect permission model still fails if the password is in a log file or the connection is not
          encrypted. This lesson covers how to store credentials, how to protect the connection itself, and
          how to rotate secrets without downtime.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Junior</h2>

          <InterviewQACard level="Junior" question="How should database secrets be handled in connection strings?">
            <p>
              Keep credentials in environment variables or a secret manager, never in git. URL-encode the
              password so special characters do not break the connection string, require TLS with{' '}
              <code>sslmode=require</code> or stronger, and rotate passwords regularly. Use different
              credentials for every environment and every service.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                A secret manager such as AWS Secrets Manager, Vault, or Doppler adds rotation and an audit
                trail that plain env vars do not have
              </li>
              <li>
                Commit a <code>.env.example</code> with empty values and keep <code>.env</code> in{' '}
                <code>.gitignore</code>
              </li>
              <li>
                Characters like <code>@</code>, <code>/</code>, and <code>#</code> in a password must be
                percent-encoded
              </li>
              <li>
                Best of all, use no long-lived password: IAM database authentication or a client certificate
                issues short-lived credentials
              </li>
              <li>
                If a secret ever reaches git, rotate it. Deleting the commit does not undo the exposure
              </li>
            </ul>
            <CodeBlock
              title="Prisma / Node env pattern"
              language="typescript"
              code={`// .env (not committed)
DATABASE_URL="postgresql://app_user:SECRET@db.example.com:5432/shop?sslmode=require"

// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Never log DATABASE_URL; redact connection strings in error reporters`}
            />
            <CodeBlock
              title="Fail fast if a secret is missing or unsafe"
              language="typescript"
              code={`function requireDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set');

  const url = new URL(raw);
  const mode = url.searchParams.get('sslmode');
  if (process.env.NODE_ENV === 'production' && mode !== 'verify-full') {
    throw new Error('Production requires sslmode=verify-full');
  }
  return raw;
}`}
            />
          </InterviewQACard>

          <InterviewQACard level="Junior" question="Why must you never log the connection string?">
            <p>
              The connection string contains the password. Logs are copied everywhere: to stdout, to a log
              aggregator, into error tracking tools, into support tickets, and into screenshots. One{' '}
              <code>console.log</code> of the config object can hand your production password to everyone
              with read access to the logs, which is usually far more people than have database access.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                The common accident is not a direct log line. It is a startup banner, a thrown connection
                error that includes the URL, or dumping the whole <code>process.env</code>
              </li>
              <li>
                Logs are usually retained for months and are rarely encrypted or access-controlled as
                tightly as the database
              </li>
              <li>
                Register a redaction rule in your logger and error reporter, and keep a masking helper for
                debug output
              </li>
              <li>
                Log the host and database name if you need to identify the target. Never the credentials
              </li>
              <li>
                Same rule for the database server itself: <code>log_statement = all</code> writes parameter
                values, including personal data, into the server log
              </li>
            </ul>
            <CodeBlock
              title="Redact instead of printing"
              language="typescript"
              code={`export function maskDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '[unparseable connection string]';
  }
}

// Safe startup log
console.log('[db] connecting to', maskDatabaseUrl(process.env.DATABASE_URL ?? ''));

// Make the logger strip it everywhere (pino example)
const logger = pino({
  redact: {
    paths: ['DATABASE_URL', 'env.DATABASE_URL', '*.connectionString', '*.password'],
    censor: '***',
  },
});`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mid-Level</h2>

          <InterviewQACard level="Mid" question="What are the sslmode options and which one should you use?">
            <p>
              <code>sslmode</code> controls two separate things: whether the connection is encrypted, and
              whether the client checks that the server is really the server it expects. Encryption without
              verification still allows a man-in-the-middle attack, because an attacker can present their
              own certificate. The short answer for production is{' '}
              <code>sslmode=verify-full</code> with a pinned root certificate.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>disable:</strong> no encryption at all. Never outside a local machine
              </li>
              <li>
                <strong>allow / prefer:</strong> encrypt only if the server offers it.{' '}
                <code>prefer</code> is the libpq default, and it silently falls back to plaintext
              </li>
              <li>
                <strong>require:</strong> encryption is mandatory, but the certificate is not checked. Stops
                passive sniffing, not impersonation
              </li>
              <li>
                <strong>verify-ca:</strong> also checks that the certificate was signed by a trusted
                authority
              </li>
              <li>
                <strong>verify-full:</strong> additionally checks that the hostname matches the certificate.
                This is the only setting that fully protects the credentials
              </li>
              <li>
                Verification needs the root certificate on the client, supplied with{' '}
                <code>sslrootcert</code>. Managed providers publish theirs
              </li>
              <li>
                Enforce it on the server too with <code>hostssl</code> lines in <code>pg_hba.conf</code>, so
                a misconfigured client cannot connect in plaintext
              </li>
            </ul>
            <CodeBlock
              title="Connection strings by environment"
              language="bash"
              code={`# Local development only
DATABASE_URL="postgresql://app_user:dev@localhost:5432/shop?sslmode=disable"

# Minimum for anything over a network
DATABASE_URL="postgresql://app_user:SECRET@db.internal:5432/shop?sslmode=require"

# Production: encrypted and verified
DATABASE_URL="postgresql://app_user:SECRET@db.example.com:5432/shop?sslmode=verify-full&sslrootcert=/etc/ssl/certs/rds-ca.pem"

# Check what the live session negotiated
psql "$DATABASE_URL" -c "SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid();"`}
            />
          </InterviewQACard>

          <InterviewQACard level="Mid" question="What is the difference between encryption at rest and encryption in transit?">
            <p>
              <strong>In transit</strong> protects data while it moves over the network between your app and
              the database, and it is TLS. <strong>At rest</strong> protects data sitting on disk, in
              backups, and in snapshots, usually through disk or volume encryption. They defend against
              different attackers, so you need both, and neither protects you from a leaked password.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                In transit stops network sniffing and man-in-the-middle attacks. Use{' '}
                <code>verify-full</code>
              </li>
              <li>
                At rest stops someone who obtains a disk, a snapshot, or a backup file. Cloud providers do
                this at the volume level with a managed key
              </li>
              <li>
                At rest encryption is invisible to a valid SQL connection. An attacker with credentials
                reads plaintext, which is why it is not an access control
              </li>
              <li>
                Encrypt the backups and the WAL archive too. A backup bucket is a very common weak spot
              </li>
              <li>
                For a few highly sensitive fields, add application-level encryption or hashing so even a
                full database dump does not reveal them. Remember an encrypted column cannot be searched or
                indexed normally
              </li>
              <li>
                Never encrypt passwords. Hash them with a slow algorithm such as bcrypt, scrypt, or Argon2
              </li>
            </ul>
            <CodeBlock
              title="Field-level protection where it matters"
              language="sql"
              code={`CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Password: hashed, never decryptable
UPDATE users SET password_hash = crypt('user-password', gen_salt('bf', 12))
WHERE id = 1;

SELECT id FROM users
WHERE id = 1 AND password_hash = crypt('user-password', password_hash);

-- Searchable-by-exact-value pattern: store a hash for lookup,
-- keep the sensitive value encrypted by the application
ALTER TABLE customers ADD COLUMN tax_id_hash bytea;
CREATE INDEX customers_tax_id_hash_idx ON customers (tax_id_hash);`}
            />
          </InterviewQACard>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Senior / Experienced</h2>

          <InterviewQACard level="Senior" question="What authentication and connection hardening topics are commonly asked for PostgreSQL?">
            <p>
              Interviewers expect awareness of <code>pg_hba.conf</code>, the file that decides which hosts,
              users, and databases may connect and with which authentication method. Know that{' '}
              <code>scram-sha-256</code> replaces the old <code>md5</code>, that TLS should be required for
              clients, that password authentication must never be exposed to the public internet, that
              pooling uses fixed application roles, and that sensitive grants should be audited. Restrict
              remote superuser login and keep admin access on a separate network.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Rules are matched top to bottom and the first match wins, so put the narrow rules first and
                a final reject at the end
              </li>
              <li>
                Set <code>password_encryption = scram-sha-256</code> and then reset every password, because
                existing hashes stay in the old format
              </li>
              <li>
                <code>hostssl</code> accepts only encrypted connections; <code>hostnossl</code> is the
                opposite and is almost never what you want
              </li>
              <li>
                <code>cert</code> authentication uses client certificates and removes the password entirely
              </li>
              <li>
                Bind PostgreSQL to a private network, use security groups or a firewall, and reach it through
                a bastion or a private link rather than the open internet
              </li>
              <li>
                Set <code>connection_limit</code> per role, plus <code>statement_timeout</code> and{' '}
                <code>idle_in_transaction_session_timeout</code>, so one client cannot exhaust the server
              </li>
              <li>
                Turn on <code>log_connections</code> and <code>log_disconnections</code>, and consider the{' '}
                <code>pgaudit</code> extension for real audit trails
              </li>
              <li>
                Reload with <code>SELECT pg_reload_conf()</code>; most of these changes do not need a
                restart
              </li>
            </ul>
            <CodeBlock
              title="Illustrative pg_hba.conf lines"
              language="bash"
              code={`# TYPE     DATABASE  USER       ADDRESS      METHOD
hostssl    shop      app_user   10.0.0.0/8   scram-sha-256
hostssl    shop      migrator   10.0.1.5/32  scram-sha-256
local      all       postgres                peer
host       all       all        0.0.0.0/0    reject`}
            />
            <CodeBlock
              title="Server-side guard rails"
              language="sql"
              code={`ALTER SYSTEM SET password_encryption = 'scram-sha-256';
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
SELECT pg_reload_conf();

ALTER ROLE app_user CONNECTION LIMIT 40;
ALTER ROLE app_user SET statement_timeout = '15s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '30s';

-- Anyone still using the old hash format?
SELECT rolname FROM pg_authid WHERE rolpassword LIKE 'md5%';`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you rotate database credentials without downtime?">
            <p>
              The trick is to never have a moment where the only valid credential is one that the running
              application does not have. You do that by overlapping: create the new secret while the old one
              still works, roll the application onto it, verify, and only then remove the old one. A single
              role with one password cannot be rotated safely, so design for two.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Two-role pattern:</strong> keep <code>app_user_a</code> and{' '}
                <code>app_user_b</code>, both members of one group role that holds the privileges. Rotate the
                idle one, switch traffic, then rotate the other next time
              </li>
              <li>
                <strong>Grace period:</strong> deploy the new secret, watch authentication errors and
                connection counts, and keep the old credential valid until every instance has restarted,
                including cron jobs and workers
              </li>
              <li>
                <code>VALID UNTIL</code> gives a hard expiry, which is useful for the retired credential
              </li>
              <li>
                Remember every consumer: application instances, background workers, migration pipelines, BI
                tools, and developer laptops. A forgotten consumer is how rotation causes an outage
              </li>
              <li>
                A pooler such as PgBouncer holds open connections. Reload it so it picks up the new
                credential instead of reusing the old one
              </li>
              <li>
                The real goal is removing long-lived passwords: IAM authentication or Vault dynamic
                credentials issue a short-lived token per connection, so rotation becomes automatic
              </li>
              <li>
                Rehearse it. Rotation is an incident-time action, so it must be boring and scripted
              </li>
            </ul>
            <CodeBlock
              title="Overlapping rotation with a group role"
              language="sql"
              code={`-- Privileges live on the group, not on the login roles
CREATE ROLE app_rw NOLOGIN;
GRANT USAGE ON SCHEMA app TO app_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_rw;

CREATE ROLE app_user_a LOGIN PASSWORD 'old-secret' IN ROLE app_rw;
CREATE ROLE app_user_b LOGIN PASSWORD 'new-secret' IN ROLE app_rw;

-- Step 1: set the new password on the idle role
ALTER ROLE app_user_b PASSWORD 'new-secret';

-- Step 2: deploy the app with the app_user_b connection string, rolling restart

-- Step 3: confirm nothing uses the old role any more
SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;

-- Step 4: retire the old credential
ALTER ROLE app_user_a VALID UNTIL '2026-10-02 00:00:00+05:30';
-- Later, once logs are clean:
ALTER ROLE app_user_a NOLOGIN;`}
            />
            <CodeBlock
              title="Reload consumers after the switch"
              language="bash"
              code={`# Update the secret, then roll the workloads
aws secretsmanager put-secret-value --secret-id prod/db/app --secret-string "$NEW_URL"
kubectl rollout restart deployment/api deployment/worker

# Make the pooler pick up new credentials without dropping traffic
psql -p 6432 -U pgbouncer pgbouncer -c 'RELOAD;'

# Watch for authentication failures during the window
psql "$ADMIN_URL" -c "SELECT usename, client_addr, backend_start FROM pg_stat_activity ORDER BY backend_start DESC LIMIT 20;"`}
            />
          </InterviewQACard>

          <InterviewQACard level="Senior" question="How do you combine Prisma migrations with a least-privilege runtime role?">
            <p>
              Run <code>prisma migrate</code> as a privileged migrator role that owns the tables. Point the
              application at a different <code>DATABASE_URL</code> whose role has only the data privileges it
              needs. After each migration the new objects must be granted to the app role, which is what{' '}
              <code>ALTER DEFAULT PRIVILEGES</code> automates. RLS policies must live in raw SQL migration
              files, because the Prisma schema does not model policies.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use <code>directUrl</code> for migrations so they bypass the pooler, and keep the migrator
                credential out of the application runtime entirely
              </li>
              <li>
                Run migrations from CI or a one-off job, never automatically from a web process on boot
              </li>
              <li>
                The migrator owning the tables is also what makes <code>FORCE ROW LEVEL SECURITY</code>
                necessary, since the app role must not be the owner
              </li>
              <li>
                Add grants and policies with <code>prisma migrate dev --create-only</code>, then edit the
                generated SQL file so it is reviewed like any other code
              </li>
              <li>
                Add a smoke test that connects as the app role and asserts it cannot create or drop a table
              </li>
            </ul>
            <CodeBlock
              title="Migration SQL for grants + RLS"
              language="sql"
              code={`-- prisma/migrations/.../migration.sql (excerpt)
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "Document"
  FOR ALL TO app_user
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON "Document" TO app_user;

-- So the next migration does not need a manual grant
ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;`}
            />
            <CodeBlock
              title="Two URLs, two roles"
              language="bash"
              code={`# CI / migration job only
DIRECT_URL="postgresql://migrator:SECRET@primary:5432/shop?sslmode=verify-full"
npx prisma migrate deploy

# Application runtime: pooled, DML only
DATABASE_URL="postgresql://app_user:SECRET@pooler:6543/shop?pgbouncer=true&sslmode=verify-full"

# Prove the runtime role cannot change the schema
psql "$DATABASE_URL" -c 'CREATE TABLE should_fail (id int);'  # expect: permission denied`}
            />
          </InterviewQACard>
        </section>
      </div>
    </LessonLayout>
  );
}
