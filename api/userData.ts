import { supabase } from "../supabaseClient";

export async function getCustomerAccounts(customerId: string) {
  const { data, error } = await supabase
    .from("account")
    .select(`
      *,
      product:product_id (
        product_id, 
        product_name, 
        product_type, 
        product_benefits
      )
    `)
    .eq("customer_id", customerId);

  if (error) throw error;
  return data || [];
}

export async function getAccountTransactions(accountId: string) {
  const { data, error } = await supabase
    .from("transaction")
    .select("*")
    .eq("account_id", accountId)
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProductDetails(productId: string) {
  // First get the base product
  const { data: productData, error: productError } = await supabase
    .from("product")
    .select("*")
    .eq("product_id", productId)
    .single();

  if (productError) throw productError;
  
  // Then get specific product details based on product type
  if (productData) {
    const tableName = getTableNameFromProductType(productData.product_type);
    
    if (tableName) {
      const { data: details, error: detailsError } = await supabase
        .from(tableName)
        .select("*")
        .eq("product_id", productId)
        .single();
        
      if (detailsError) throw detailsError;
      
      return {
        ...productData,
        details
      };
    }
    
    return productData;
  }
  
  return null;
}

function getTableNameFromProductType(productType: string): string | null {
  switch (productType) {
    case "Personal Current Account": return "personal_current_account";
    case "Savings": return "savings_account";
    case "Credit Card": return "credit_card";
    case "Overdraft": return "overdraft";
    default: return null;
  }
}