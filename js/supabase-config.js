// ============================================================
// SUPABASE CONFIGURATION
// Connected to: Tess Sari-Sari Store project
// ============================================================

var SUPABASE_URL = 'https://scptxdgjosyrtkiffksb.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjcHR4ZGdqb3N5cnRraWZma3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDgzNjEsImV4cCI6MjA5NTQ4NDM2MX0.vIkz0ldYfyYWJqbwS3pdHy7qVUrtjNXRKPKeXwq11Qo';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function isConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}
