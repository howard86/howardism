import { ReactNode, useState, createContext } from "react";

type Auth = {
  jwt: string;
  setJwt: (jwt: string) => void;
};

export const DEFAULT_JWT = "";

export const AuthContext = createContext<Auth>({
  jwt: DEFAULT_JWT,
  setJwt: () => {
    throw new Error("Failed to register AuthContextProvider");
  },
});

const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [jwt, setJwt] = useState(DEFAULT_JWT);

  return <AuthContext.Provider value={{ jwt, setJwt }}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
