import { render, screen } from "@testing-library/react"

import Home, { HomeProps } from "@/pages"

describe("home", () => {
  const mockRecipes: HomeProps["recipes"] = [
    {
      id: 1,
      title: "Recipe 1",
      image: [],
      ingredients: [{ id: 1, name: "ingredient 1", unit: "unit", amount: 1 }],
      seasonings: [{ id: 1, name: "seasoning 1", unit: "unit", amount: 1 }],
      steps: [{ id: 1, summary: "summary 1", description: "description 1" }],
      published_at: "2023-03-25T09:13:15.076Z",
      description: "Description 1",
    },
    {
      id: 2,
      title: "Recipe 2",
      image: [],
      ingredients: [{ id: 2, name: "ingredient 2", unit: "unit", amount: 2 }],
      seasonings: [{ id: 2, name: "seasoning 2", unit: "unit", amount: 2 }],
      steps: [{ id: 2, summary: "summary 2", description: "description 2" }],
      published_at: "2023-03-24T09:13:15.076Z",
      description: "Description 2",
    },
  ]

  it("renders featured recipes and all recipes", async () => {
    expect.hasAssertions()
    render(<Home recipes={mockRecipes} />)
    const recipeTitles = await screen.findAllByRole("heading", { level: 2 })
    expect(recipeTitles[0]).toHaveTextContent("Featured Posts")
  })
})
