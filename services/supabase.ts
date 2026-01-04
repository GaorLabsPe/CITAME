
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * CITAME SaaS - Conexión Cloud Supabase
 * Credenciales vinculadas al proyecto del usuario.
 */
const SUPABASE_URL = 'https://svarnhmnkiauudfeqqhp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXJuaG1ua2lhdXVkZmVxcWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzUwNjAsImV4cCI6MjA4MzA1MTA2MH0.Orqe8I3as1QGPtb6kIQ_0CJVQmThNsnxu4t8C0mn_Vs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
