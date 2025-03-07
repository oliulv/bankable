import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Replace these with your Supabase project credentials
const SUPABASE_URL = "https://mnwccxwhucukvcqzrwiz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2NjeHdodWN1a3ZjcXpyd2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MzYxNjMsImV4cCI6MjA1NTIxMjE2M30.uf-HgrpLMwLcoo45KI8VMyWIs5BiFSQ90JUwfrrwwLw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage as any,
        persistSession: true,
        detectSessionInUrl: false,
    },
});