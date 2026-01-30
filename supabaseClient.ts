
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uykoknajrwwiwdhaefod.supabase.co';
const supabaseKey = 'sb_publishable_RUobDq6QOpXuHrseKg5g8A_9gKHPCGe';

export const supabase = createClient(supabaseUrl, supabaseKey);
