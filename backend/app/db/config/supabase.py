from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase configuration. Please check your .env file.")

try:
    # Ensure URL starts with https://
    if not SUPABASE_URL.startswith('https://'):
        SUPABASE_URL = f'https://{SUPABASE_URL}'
    
    # Remove trailing slash if present
    SUPABASE_URL = SUPABASE_URL.rstrip('/')
    
    # Initialize Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"Successfully connected to Supabase at {SUPABASE_URL}")
except Exception as e:
    print(f"Error connecting to Supabase: {str(e)}")
    print(f"URL: {SUPABASE_URL}")
    raise 