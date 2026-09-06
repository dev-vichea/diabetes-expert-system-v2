#!/usr/bin/env python3
"""
Generate a secure SECRET_KEY for your Vercel deployment.
Run: python generate_secret_key.py
"""

import secrets
import urllib.parse

def generate_secret_key():
    """Generate a secure random secret key."""
    return secrets.token_hex(32)

def url_encode_password(password):
    """URL encode a password for use in DATABASE_URL."""
    return urllib.parse.quote(password, safe='')

def main():
    print("=" * 70)
    print("🔐 Secure SECRET_KEY Generator for Vercel Deployment")
    print("=" * 70)
    print()
    
    # Generate SECRET_KEY
    secret_key = generate_secret_key()
    print("✅ Generated SECRET_KEY:")
    print(f"   {secret_key}")
    print()
    print("📋 Copy this value to Vercel Environment Variable: SECRET_KEY")
    print()
    
    # Help with password encoding
    print("-" * 70)
    print("🔒 Need to URL-encode your Supabase password?")
    print("-" * 70)
    encode = input("Do you want to encode a password? (y/n): ").lower().strip()
    
    if encode == 'y':
        password = input("Enter your Supabase password: ").strip()
        encoded = url_encode_password(password)
        print()
        print("✅ URL-Encoded Password:")
        print(f"   {encoded}")
        print()
        print("📋 Use this encoded password in your DATABASE_URL")
        print()
        
        # Show example DATABASE_URL
        print("-" * 70)
        print("📝 Example DATABASE_URL format:")
        print("-" * 70)
        print(f"postgresql+psycopg://postgres.PROJECT_REF:{encoded}@aws-0-REGION.pooler.supabase.com:5432/postgres")
        print()
        print("Replace PROJECT_REF and REGION with your actual Supabase values")
    
    print()
    print("=" * 70)
    print("✨ Done! Add these to Vercel Environment Variables")
    print("=" * 70)

if __name__ == "__main__":
    main()
