export default {
    expo: {
      name: "BankableApp",
      // ... other expo config
      extra: {
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        togetherAiApiKey: process.env.TOGETHER_AI_API_KEY,
        databaseUrl: process.env.DATABASE_URL,
      },
    },
  };