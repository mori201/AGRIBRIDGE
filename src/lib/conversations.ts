export const CONV_SELECT = "id,last_message_at,product_id,user_a,user_b, ua:profiles!conversations_user_a_fkey(id,full_name,avatar_url), ub:profiles!conversations_user_b_fkey(id,full_name,avatar_url), products(title)";
type Person = { id: string; full_name: string; avatar_url: string | null };
export type Conv = { id: string; last_message_at: string; user_a: string; user_b: string; ua: Person; ub: Person; products: { title: string } | null };
