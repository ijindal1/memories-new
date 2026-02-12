export interface Env {
  DB: D1Database;
  DESCOPE_PROJECT_ID: string;
  APP_URL: string;
}

export interface UserData {
  sub: string;
  email?: string;
  name?: string;
}
