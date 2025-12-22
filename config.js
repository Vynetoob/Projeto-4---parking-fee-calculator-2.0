// config.js
const SUPABASE_URL = 'https://plvyevfdbilfpnlueory.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdnlldmZkYmlsZnBubHVlb3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODMyNDEsImV4cCI6MjA4MTk1OTI0MX0.R33pXdpXDHXfLzH3vSk_n7E52PQoe9_ibHMpwGyOKTg';

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Torna o cliente disponível para os outros arquivos
window.supabase = supabaseClient;