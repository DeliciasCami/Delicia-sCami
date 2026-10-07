// ============================================
// Cliente Supabase compartido por toda la app
// ============================================
const SUPABASE_URL = "https://kwjlvrvuzfdjfezlxqxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3amx2cnZ1emZkamZlemx4cXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjM2OTcsImV4cCI6MjEwNjgzOTY5N30.roNpCFolqZwIKSAeoYgvH2SWGJvht_0sVfThDKoUV78";

// El SDK se carga vía <script> en index.html, así que `supabase` es global
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);