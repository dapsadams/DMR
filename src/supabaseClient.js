import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cauooevvzrqkkyzducbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdW9vZXZ2enJxa2t5emR1Y2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDIxNTEsImV4cCI6MjA5NTgxODE1MX0.f8-B-FaMmx9tzONoIn0eg0dLtz_q7eVgOXs4gHUQpCU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);