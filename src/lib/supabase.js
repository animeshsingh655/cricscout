import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://xxvasvjltxdvmefunchl.supabase.co'
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dmFzdmpsdHhkdm1lZnVuY2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTQwMDcsImV4cCI6MjA5NjI5MDAwN30.izAahhRocc8TjKZJEhJrY_vWYCCtBKDTNLaEzguNu_s'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
