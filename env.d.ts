declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SITE_URL?: string
    DATABASE_URL?: string
    DATABASE_PROVIDER?: 'postgresql' | 'sqlite'
    ADMIN_SESSION_SECRET?: string
  }
}
