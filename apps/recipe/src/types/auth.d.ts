export interface Account {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
}

export interface VerifyResponse {
  id: string;
  username: string;
  email: string;
}
