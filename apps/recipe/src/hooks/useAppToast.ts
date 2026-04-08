import { toast } from "sonner";

interface ToastOptions {
  description: string;
  status: "success" | "error" | "info" | "warning";
}

const useAppToast = () => (options: ToastOptions) => {
  switch (options.status) {
    case "success":
      toast.success(options.description);
      break;
    case "error":
      toast.error(options.description);
      break;
    case "warning":
      toast.warning(options.description);
      break;
    default:
      toast.info(options.description);
  }
};

export default useAppToast;
