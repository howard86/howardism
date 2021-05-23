import { useContext, useState } from "react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { AuthContext, DEFAULT_JWT } from "@/components/AuthProvider";
import type { Account } from "@/types/auth";

type UseAuth = {
  jwt: string;
  isLoggedIn: boolean;
  login: (account: Account) => void;
  logout: () => void;
};

// TODO: consider manage auth by redux
const useAuth = (): UseAuth => {
  const { jwt, setJwt } = useContext(AuthContext);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const toast = useToast({ duration: 5000, isClosable: true, position: "bottom" });

  const login = (account: Account): void => {
    axios
      .post("/api/auth/login", account)
      .then((response) => {
        toast({ status: "success", description: "Log in successfully!" });
        setJwt(response.data.jwt);
        setLoggedIn(true);
      })
      .catch((error) => {
        console.error(error);
        toast({ status: "error", description: "Incorrect account information" });
      });
  };

  const logout = (): void => {
    setJwt(DEFAULT_JWT);
    setLoggedIn(false);
  };

  return { jwt, isLoggedIn, login, logout };
};

export default useAuth;
