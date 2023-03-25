import { sampleSize } from "@/utils/array"

describe("array", () => {
  describe("sampleSize", () => {
    it("should return a new copy of array that matches the original array after sort", () => {
      expect.hasAssertions()
      const input = [1, 23, 12, 321, 2, 44, 57, 84, 31, 23]
      const result = sampleSize(input)

      // sort will mutate the original copy
      expect([...result].sort()).toStrictEqual([...input].sort())
      for (const number of result) {
        expect(input.includes(number)).toBeTruthy()
      }
    })
  })
})
