import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { Account, LoginResponse } from "@/types/auth";

import api, { type LocalAPIResponse } from "../api";

interface AuthState {
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  isLoggedIn: false,
};

export const authLogin = createAsyncThunk(
  "auth/login",
  async (account: Account): Promise<LocalAPIResponse<LoginResponse>> => {
    const response = await api.post<LocalAPIResponse<LoginResponse>>(
      "/auth/login",
      account
    );

    return response.data;
  }
);

export const authLogout = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

const { reducer } = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(authLogin.fulfilled, (state, action) => {
        state.isLoggedIn = action.payload.success;
      })
      .addCase(authLogin.rejected, () => initialState)
      .addCase(authLogout.fulfilled, () => initialState)
      .addCase(authLogout.rejected, () => initialState),
});

export default reducer;
