import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Account, LoginResponse } from "@/types/auth";
import api, {
  deleteAuthorizationHeader,
  LocalAPIResponse,
  updateAuthorizationHeader,
} from "../api";

interface AuthState {
  isLoggedIn: boolean;
  jwt: string;
}

const initialState: AuthState = {
  isLoggedIn: false,
  jwt: "",
};

export const authLogin = createAsyncThunk(
  "auth/login",
  async (account: Account): Promise<LocalAPIResponse<LoginResponse>> => {
    const response = await api.post<LocalAPIResponse<LoginResponse>>("/auth/login", account);

    return response.data;
  }
);

const { actions, reducer } = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authLogout: () => {
      deleteAuthorizationHeader();
      return initialState;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(authLogin.fulfilled, (state, action) => {
        state.isLoggedIn = action.payload.success;
        state.jwt = action.payload.jwt;
        updateAuthorizationHeader(action.payload.jwt);
      })
      .addCase(authLogin.rejected, () => initialState),
});

export const { authLogout } = actions;
export default reducer;
