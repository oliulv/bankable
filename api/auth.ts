import { supabase } from "../supabaseClient";

export async function signInWithNames(name: string, surname: string) {
    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    
    console.log(`Searching for customer with name: "${trimmedName}" and surname: "${trimmedSurname}"`);

    // Add wildcards to help ensure a match.
    const { data, error } = await supabase
        .from("customer")
        .select("*")
        .ilike("name", `%${trimmedName}%`)
        .ilike("surname", `%${trimmedSurname}%`)
        .maybeSingle();

    if (error) {
        console.error("Query error:", error);
        throw error;
    }
    if (!data) {
        console.error("No matching customer found");
        throw new Error("No matching customer found");
    }
    console.log("Found customer:", data);
    return data;
}