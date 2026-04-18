export interface Account {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
}

export interface VerifyResponse {
  email: string;
  id: string;
  username: string;
}
