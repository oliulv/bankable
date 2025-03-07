// filepath: /Users/oliulv/Documents/uni/BankableApp/api/userData.ts
import { supabase } from "../supabaseClient";

export async function getUserTransactions(customer_id: string) {
    const { data, error } = await supabase
        .from("transaction")
        .select("*")
        .eq("customer_id", customer_id);
    if (error) {
        throw error;
    }
    return data;
}