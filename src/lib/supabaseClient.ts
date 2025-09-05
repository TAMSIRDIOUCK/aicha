//rc/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vzhcjvvgpbtfolxnpapy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aGNqdnZncGJ0Zm9seG5wYXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDM2NjQsImV4cCI6MjA2ODc3OTY2NH0.8u-z9iou6prxy_yk1S_49-kFRwLCm8gTDiWAa18lS3g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
