import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eirvvliunspawqtbdubh.supabase.co';
const supabaseKey = 'sb_publishable_EUfTVcDjTxLRl3s8chLSPw_tPJWSROn';

export const supabase = createClient(supabaseUrl, supabaseKey);