export default {
    expo: {
      name: "BankableApp",
      "scheme": "myapp",
      "newArchEnabled": true,
      "ios": {
        "supportsTablet": true,
        "bundleIdentifier": "com.anonymous.BankableApp"
      },
      // ... other expo config
      extra: {  // Second "extra" object - this is the problem!
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        togetherAiApiKey: process.env.TOGETHER_AI_API_KEY,
        databaseUrl: process.env.DATABASE_URL,
        "eas": {
          "projectId": "7a3c4b96-aa80-40b6-ac9a-c2d6f7b15e16"
          }
      },
    },
  };