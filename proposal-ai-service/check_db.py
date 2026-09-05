import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_YzeP01pmBNrc@ep-wispy-heart-aygyyy0a-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

def main():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'proposals';")
    cols = cur.fetchall()
    print("Existing columns in 'proposals':", cols)

    # Required columns in Proposal.java
    # id UUID, title VARCHAR, customer_requirement TEXT, status VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP,
    # user_id UUID, plan_tasks TEXT, research_findings TEXT, pricing_tiers TEXT, selected_pricing TEXT, draft_proposal TEXT, final_proposal TEXT
    alter_statements = [
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS customer_requirement TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS plan_tasks TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS research_findings TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pricing_tiers TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS selected_pricing TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS draft_proposal TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS final_proposal TEXT;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS user_id UUID;",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS status VARCHAR(255);",
        "ALTER TABLE proposals ADD COLUMN IF NOT EXISTS title VARCHAR(255);"
    ]

    for stmt in alter_statements:
        cur.execute(stmt)
        print("Executed:", stmt)

    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'proposals';")
    updated_cols = cur.fetchall()
    print("\nUpdated columns in 'proposals':", updated_cols)

    conn.close()

if __name__ == "__main__":
    main()
