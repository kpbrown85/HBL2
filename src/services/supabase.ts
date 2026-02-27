import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Lazy initialization to prevent build-time errors
let supabaseClient: any = null;

export const supabase = {
  from: (table: string) => {
    if (!supabaseClient) {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
      }
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient.from(table);
  }
};
