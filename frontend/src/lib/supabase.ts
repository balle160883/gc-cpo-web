import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xygarchwyrflpzywcpid.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z2FyY2h3eXJmbHB6eXdjcGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzM1OTcsImV4cCI6MjA4ODc0OTU5N30.DSUUQtGNYmTZgh-vhQb8aTkmxwScTYIZ58Zaa9yjqts';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
