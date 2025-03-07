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

export async function getCustomerById(customer_id: string) {
    const { data, error } = await supabase
        .from("customer")
        .select("*")
        .eq("customer_id", customer_id)
        .single();
    if (error) {
        throw error;
    }
    return data;
}