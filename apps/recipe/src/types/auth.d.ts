export interface Account {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
}

export interface VerifyResponse {
  email: string;
  id: string;
  username: string;
}
