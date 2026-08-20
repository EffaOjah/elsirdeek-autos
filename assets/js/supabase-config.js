const SUPABASE_URL = 'https://nxoezyruuajpbvckwlbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54b2V6eXJ1dWFqcGJ2Y2t3bGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDI0NDUsImV4cCI6MjEwMjgxODQ0NX0.JSLCxvGLsE4CjAaGkrBOIfT6nQ13Uv4pXK58gyZ28ww';

// Initialize the Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
