import type { ChildrenProps } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Toaster } from "sonner";

import store from "@/redux/store";

import Layout from "./layouts/Layout";

export default function GlobalWrapper({ children }: ChildrenProps) {
  return (
    <ReduxProvider store={store}>
      <Layout>{children}</Layout>
      <Toaster position="bottom-center" richColors />
    </ReduxProvider>
  );
}
