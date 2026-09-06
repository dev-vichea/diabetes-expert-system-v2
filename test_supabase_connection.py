#!/usr/bin/env python3
"""
Test Supabase database connection before deploying to Vercel.
Usage: python test_supabase_connection.py
"""

import sys
import os
from urllib.parse import urlparse

def test_connection():
    """Test database connection."""
    print("=" * 70)
    print("🔌 Supabase Connection Tester")
    print("=" * 70)
    print()
    
    # Get DATABASE_URL
    database_url = input("Enter your DATABASE_URL (or press Enter to use env var): ").strip()
    
    if not database_url:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ No DATABASE_URL provided or found in environment")
            return
    
    # Validate URL format
    print()
    print("-" * 70)
    print("🔍 Validating URL format...")
    print("-" * 70)
    
    if not database_url.startswith('postgresql+psycopg://'):
        print("⚠️  Warning: URL should start with 'postgresql+psycopg://' for psycopg3")
        print(f"   Current: {database_url.split('://')[0]}://")
        if database_url.startswith('postgresql://'):
            print()
            print("💡 Tip: Replace 'postgresql://' with 'postgresql+psycopg://'")
    else:
        print("✅ URL format looks good")
    
    # Parse URL
    try:
        parsed = urlparse(database_url)
        print()
        print("📋 Connection Details:")
        print(f"   Host: {parsed.hostname}")
        print(f"   Port: {parsed.port}")
        print(f"   Database: {parsed.path[1:]}")
        print(f"   Username: {parsed.username}")
        print(f"   Password: {'*' * len(parsed.password) if parsed.password else 'Not set'}")
    except Exception as e:
        print(f"❌ Failed to parse URL: {e}")
        return
    
    # Test connection
    print()
    print("-" * 70)
    print("🔌 Testing connection...")
    print("-" * 70)
    
    try:
        # Try importing psycopg
        try:
            import psycopg
            print("✅ psycopg is installed")
        except ImportError:
            print("❌ psycopg not found. Install it:")
            print("   pip install 'psycopg[binary]'")
            return
        
        # Try connecting
        print("   Attempting to connect...")
        conn = psycopg.connect(database_url.replace('postgresql+psycopg://', 'postgresql://'))
        print("✅ Connection successful!")
        
        # Test query
        print("   Running test query...")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        print(f"✅ PostgreSQL version: {version[:50]}...")
        
        # Check tables
        print("   Checking for tables...")
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cur.fetchone()[0]
        print(f"✅ Found {table_count} tables in public schema")
        
        if table_count == 0:
            print()
            print("⚠️  No tables found! You need to run migrations:")
            print("   cd backend")
            print(f"   export DATABASE_URL='{database_url}'")
            print("   export FLASK_APP=run.py")
            print("   flask db upgrade")
        
        # List some tables
        if table_count > 0:
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                LIMIT 5
            """)
            tables = [row[0] for row in cur.fetchall()]
            print(f"   Sample tables: {', '.join(tables)}")
        
        cur.close()
        conn.close()
        
        print()
        print("=" * 70)
        print("🎉 Connection test passed! You're ready to deploy.")
        print("=" * 70)
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("💡 Troubleshooting tips:")
        print("   1. Check your password is URL-encoded")
        print("   2. Verify Supabase project is active (not paused)")
        print("   3. Check you're using Session mode pooler URL")
        print("   4. Ensure your IP is allowed in Supabase (usually all IPs allowed)")
        print()
        return

if __name__ == "__main__":
    try:
        test_connection()
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user")
        sys.exit(0)
