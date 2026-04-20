import psycopg
import sys

def check_connection():
    try:
        # Try connecting with the current user (Mac default)
        conn = psycopg.connect("host=127.0.0.1 port=5432 dbname=postgres user=kiddd", autocommit=True)
        print("Successfully connected as 'kiddd' to 'postgres' database.")
        
        with conn.cursor() as cur:
            cur.execute("SELECT rolname FROM pg_roles;")
            roles = [r[0] for r in cur.fetchall()]
            print(f"Available roles: {roles}")
            
            cur.execute("SELECT datname FROM pg_database;")
            dbs = [d[0] for d in cur.fetchall()]
            print(f"Available databases: {dbs}")
            
        conn.close()
    except Exception as e:
        print(f"Failed to connect as 'kiddd': {e}")

if __name__ == "__main__":
    check_connection()
