import { authLogin, authLogout } from "@/redux/slices/auth";
import type { Account } from "@/types/auth";

import useAppDispatch from "./useAppDispatch";
import useAppSelector from "./useAppSelector";
import useAppToast from "./useAppToast";

interface UseAuth {
  isLoggedIn: boolean;
  login: (account: Account) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuth = (): UseAuth => {
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((state) => state.auth);
  const toast = useAppToast();

  const login = async (account: Account): Promise<void> => {
    const response = await dispatch(authLogin(account));

    switch (response.meta.requestStatus) {
      case "fulfilled":
        toast({ status: "success", description: "Log in successfully!" });
        break;
      case "rejected":
        toast({
          status: "error",
          description: "Incorrect account information",
        });
        break;
      default:
        throw new Error("Unknown request status");
    }
  };

  const logout = async (): Promise<void> => {
    await dispatch(authLogout());
  };

  return { isLoggedIn, login, logout };
};

export default useAuth;
