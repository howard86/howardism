import type { Account } from "@/types/auth";
import { authLogin, authLogout } from "@/redux/slices/auth";
import useAppSelector from "./useAppSelector";
import useAppDispatch from "./useAppDispatch";
import useAppToast from "./useAppToast";

type UseAuth = {
  isLoggedIn: boolean;
  login: (account: Account) => Promise<void>;
  logout: VoidFunction;
};

// TODO: consider manage auth by redux
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
        toast({ status: "error", description: "Incorrect account information" });
        break;
      default:
        throw new Error("Unknown request status");
    }
  };

  const logout = (): void => {
    dispatch(authLogout());
  };

  return { isLoggedIn, login, logout };
};

export default useAuth;
