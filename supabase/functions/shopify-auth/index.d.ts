
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHOPIFY_API_KEY: string;
      SHOPIFY_API_SECRET: string;
    }
  }
}

export {}
