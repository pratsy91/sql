import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Triggers in PL/pgSQL - PostgreSQL Learning',
  description: 'Learn about creating trigger functions in PL/pgSQL, working with NEW and OLD records',
};

export default function TriggersPLpgSQL() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Triggers in PL/pgSQL</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Triggers?</h2>
          <p className="mb-4">
            Triggers are functions that automatically execute when certain database events occur 
            (INSERT, UPDATE, DELETE). Trigger functions in PL/pgSQL can access NEW and OLD records 
            to perform validation, logging, or other operations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Trigger Functions</h2>

          <CodeBlock
            title="SQL: Basic Trigger Function"
            language="sql"
            code={`-- Basic trigger function for INSERT
CREATE OR REPLACE FUNCTION log_user_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_audit (user_id, action, timestamp)
  VALUES (NEW.id, 'INSERT', NOW());
  
  RETURN NEW;  -- Must return NEW for INSERT/UPDATE triggers
END;
$$;

-- Create trigger
CREATE TRIGGER user_insert_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_insert();

-- Trigger function for UPDATE
CREATE OR REPLACE FUNCTION log_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_audit (user_id, action, old_value, new_value, timestamp)
  VALUES (NEW.id, 'UPDATE', OLD.name, NEW.name, NOW());
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_update_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_update();

-- Trigger function for DELETE
CREATE OR REPLACE FUNCTION log_user_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_audit (user_id, action, old_value, timestamp)
  VALUES (OLD.id, 'DELETE', OLD.name, NOW());
  
  RETURN OLD;  -- Must return OLD for DELETE triggers
END;
$$;

CREATE TRIGGER user_delete_trigger
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_delete();`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">NEW and OLD Records</h2>

          <CodeBlock
            title="SQL: Working with NEW and OLD"
            language="sql"
            code={`-- Accessing NEW record fields
CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_at := NOW();  -- Modify NEW before insert/update
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_created_at_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_created_at();

-- Comparing OLD and NEW values
CREATE OR REPLACE FUNCTION track_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO change_log (table_name, record_id, field, old_value, new_value)
    VALUES ('users', NEW.id, 'name', OLD.name, NEW.name);
  END IF;
  
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO change_log (table_name, record_id, field, old_value, new_value)
    VALUES ('users', NEW.id, 'email', OLD.email, NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_changes_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION track_changes();

-- Using NEW to modify data before insert
CREATE OR REPLACE FUNCTION normalize_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));  -- Normalize email
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_email_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION normalize_email();

-- Accessing all fields in NEW
CREATE OR REPLACE FUNCTION log_all_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'NEW record: id=%, name=%, email=%', NEW.id, NEW.name, NEW.email;
  RETURN NEW;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">BEFORE vs AFTER Triggers</h2>

          <CodeBlock
            title="SQL: BEFORE and AFTER Triggers"
            language="sql"
            code={`-- BEFORE trigger (can modify NEW)
CREATE OR REPLACE FUNCTION validate_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate before insert
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF NEW.age < 0 THEN
    RAISE EXCEPTION 'Age cannot be negative';
  END IF;
  
  -- Can modify NEW
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_user_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user();

-- AFTER trigger (cannot modify, but can access NEW/OLD)
CREATE OR REPLACE FUNCTION update_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update statistics after insert
  UPDATE user_stats 
  SET total_users = (SELECT COUNT(*) FROM users)
  WHERE id = 1;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stats_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_statistics();

-- BEFORE trigger for validation
CREATE OR REPLACE FUNCTION check_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.amount > (SELECT balance FROM accounts WHERE id = NEW.account_id) THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_balance_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_balance();`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INSTEAD OF Triggers</h2>

          <CodeBlock
            title="SQL: INSTEAD OF Triggers"
            language="sql"
            code={`-- INSTEAD OF trigger for views
CREATE VIEW user_view AS
SELECT id, name, email FROM users;

-- INSTEAD OF trigger function
CREATE OR REPLACE FUNCTION user_view_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO users (name, email) 
  VALUES (NEW.name, NEW.email);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_view_insert_trigger
  INSTEAD OF INSERT ON user_view
  FOR EACH ROW
  EXECUTE FUNCTION user_view_insert();

-- INSTEAD OF UPDATE
CREATE OR REPLACE FUNCTION user_view_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users 
  SET name = NEW.name, email = NEW.email
  WHERE id = OLD.id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_view_update_trigger
  INSTEAD OF UPDATE ON user_view
  FOR EACH ROW
  EXECUTE FUNCTION user_view_update();

-- INSTEAD OF DELETE
CREATE OR REPLACE FUNCTION user_view_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER user_view_delete_trigger
  INSTEAD OF DELETE ON user_view
  FOR EACH ROW
  EXECUTE FUNCTION user_view_delete();`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Conditional Triggers</h2>

          <CodeBlock
            title="SQL: Conditional Triggers"
            language="sql"
            code={`-- Trigger with WHEN condition
CREATE OR REPLACE FUNCTION log_important_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO important_changes (user_id, field, old_value, new_value)
  VALUES (NEW.id, 'status', OLD.status, NEW.status);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER important_updates_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)  -- Only when status changes
  EXECUTE FUNCTION log_important_updates();

-- Trigger only on specific column changes
CREATE OR REPLACE FUNCTION log_email_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO email_changes (user_id, old_email, new_email, changed_at)
  VALUES (NEW.id, OLD.email, NEW.email, NOW());
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER email_changes_trigger
  AFTER UPDATE OF email ON users  -- Only trigger on email column
  FOR EACH ROW
  EXECUTE FUNCTION log_email_changes();

-- Conditional logic inside trigger function
CREATE OR REPLACE FUNCTION smart_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if certain conditions are met
  IF NEW.status = 'deleted' OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_log (table_name, record_id, action, timestamp)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NOW());
  END IF;
  
  RETURN NEW;
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Trigger Special Variables</h2>

          <CodeBlock
            title="SQL: Trigger Special Variables"
            language="sql"
            code={`-- Using TG_TABLE_NAME, TG_OP, TG_WHEN, etc.
CREATE OR REPLACE FUNCTION generic_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    operation,
    when_timing,
    record_id,
    old_data,
    new_data,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,      -- Name of the table
    TG_OP,              -- Operation: INSERT, UPDATE, DELETE
    TG_WHEN,            -- BEFORE or AFTER
    COALESCE(NEW.id, OLD.id),
    row_to_json(OLD),   -- Old record as JSON
    row_to_json(NEW),   -- New record as JSON
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Using TG_ARGV for trigger arguments
CREATE OR REPLACE FUNCTION conditional_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  log_level TEXT;
BEGIN
  -- Get log level from trigger arguments
  log_level := TG_ARGV[0];
  
  IF log_level = 'DEBUG' OR TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, timestamp)
    VALUES (TG_TABLE_NAME, TG_OP, COALESCE(NEW.id, OLD.id), NOW());
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER debug_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION conditional_audit('DEBUG');

-- Using TG_NARGS to check argument count
CREATE OR REPLACE FUNCTION flexible_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_NARGS > 0 THEN
    -- Has arguments, use them
    RAISE NOTICE 'Trigger called with % arguments', TG_NARGS;
  ELSE
    -- No arguments, use default behavior
    RAISE NOTICE 'Trigger called without arguments';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Triggers</h2>

          <CodeBlock
            title="Prisma: Creating Triggers"
            language="prisma"
            code={`// Prisma doesn't support creating triggers directly
// Use raw SQL to create triggers

// Create trigger function
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION log_user_changes()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    INSERT INTO user_audit (user_id, action, timestamp)
    VALUES (NEW.id, TG_OP, NOW());
    
    RETURN NEW;
  END;
  $$;
\`;

// Create trigger
await prisma.$executeRaw\`
  CREATE TRIGGER user_changes_trigger
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_changes();
\`;

// Trigger with validation
await prisma.$executeRaw\`
  CREATE OR REPLACE FUNCTION validate_user_email()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF NEW.email IS NULL OR NEW.email !~ '^[^@]+@[^@]+\\.[^@]+$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    RETURN NEW;
  END;
  $$;
\`;

await prisma.$executeRaw\`
  CREATE TRIGGER validate_email_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_email();
\`;

// Triggers work automatically with Prisma operations
const user = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
// Trigger will fire automatically

// Drop trigger
await prisma.$executeRaw\`
  DROP TRIGGER IF EXISTS user_changes_trigger ON users
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use BEFORE triggers</strong> for validation and data modification</li>
              <li><strong>Use AFTER triggers</strong> for logging and side effects</li>
              <li><strong>Always return NEW or OLD</strong> as appropriate</li>
              <li><strong>Use WHEN clause</strong> to conditionally fire triggers</li>
              <li><strong>Keep triggers simple</strong> - avoid complex logic</li>
              <li><strong>Handle exceptions</strong> in trigger functions</li>
              <li><strong>Use TG_OP and TG_TABLE_NAME</strong> for generic triggers</li>
              <li><strong>Test triggers thoroughly</strong> - they fire automatically</li>
              <li><strong>Document trigger behavior</strong> - they can be hard to debug</li>
              <li><strong>Consider performance</strong> - triggers fire for every row</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

