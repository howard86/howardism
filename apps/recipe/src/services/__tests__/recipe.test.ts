import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";

const mockGet = mock<
  (url: string, config?: unknown) => Promise<{ data: unknown }>
>(() => Promise.resolve({ data: { id: 1, title: "r" } }));
const mockPost = mock<
  (url: string, body?: unknown, config?: unknown) => Promise<{ data: unknown }>
>(() => Promise.resolve({ data: true }));

mock.module("@/services/cms", () => ({
  default: { get: mockGet, post: mockPost },
}));

describe("services/recipe", () => {
  let getRecipeById: typeof import("../recipe").getRecipeById;
  let createRecipe: typeof import("../recipe").createRecipe;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    mockGet.mockClear();
    mockPost.mockClear();
    errorSpy = spyOn(console, "error").mockImplementation(() => undefined);
    const mod = await import("../recipe");
    getRecipeById = mod.getRecipeById;
    createRecipe = mod.createRecipe;
  });

  describe("getRecipeById (allow-list)", () => {
    it("proceeds for alphanumeric IDs", async () => {
      mockGet.mockResolvedValueOnce({ data: { id: 1, title: "ok" } });
      const result = await getRecipeById("abc123");
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet.mock.calls[0]?.[0]).toBe("/recipes/abc123");
      expect(result).toMatchObject({ id: 1, title: "ok" });
    });

    it("proceeds for numeric IDs (Strapi v4)", async () => {
      mockGet.mockResolvedValueOnce({ data: { id: 42, title: "ok" } });
      await getRecipeById("42");
      expect(mockGet.mock.calls[0]?.[0]).toBe("/recipes/42");
    });

    it("proceeds for 24-char documentId (Strapi v5)", async () => {
      const docId = "a1b2c3d4e5f6a7b8c9d0e1f2";
      mockGet.mockResolvedValueOnce({ data: { id: docId, title: "ok" } });
      await getRecipeById(docId);
      expect(mockGet.mock.calls[0]?.[0]).toBe(`/recipes/${docId}`);
    });

    it("rejects ID containing a slash (#547 regression)", async () => {
      const result = await getRecipeById("../etc/passwd");
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("rejects ID containing URL-encoded traversal", async () => {
      const result = await getRecipeById("..%2Fetc%2Fpasswd");
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("rejects ID containing a NUL byte", async () => {
      const result = await getRecipeById("abc\x00def");
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("rejects empty string", async () => {
      const result = await getRecipeById("");
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("rejects ID longer than 64 chars", async () => {
      const tooLong = "a".repeat(65);
      const result = await getRecipeById(tooLong);
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("rejects ID with a dot (no extension traversal)", async () => {
      const result = await getRecipeById("abc.def");
      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("returns null on CMS error without leaking", async () => {
      mockGet.mockRejectedValueOnce(new Error("503"));
      const result = await getRecipeById("abc");
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("createRecipe (raw-JWT signature)", () => {
    it("constructs Bearer header from raw JWT internally", async () => {
      mockPost.mockResolvedValueOnce({ data: true });
      const recipe = {
        description: "d",
        title: "t",
        ingredients: [],
        seasonings: [],
        steps: [],
      };
      const ok = await createRecipe(recipe, "abc");
      expect(ok).toBe(true);
      const config = mockPost.mock.calls[0]?.[2] as {
        headers?: Record<string, string>;
      };
      expect(config?.headers?.Authorization).toBe("Bearer abc");
    });
  });
});
