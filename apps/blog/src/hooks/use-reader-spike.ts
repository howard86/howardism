import { useSearchParams } from "next/navigation";

/**
 * Check if ?readerSpike=1 is present.
 */
export function useReaderSpike(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("readerSpike") === "1";
}
