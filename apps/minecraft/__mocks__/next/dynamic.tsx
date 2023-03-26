function DynamicComponent() {
  return <div data-testid="dynamic-component" />
}

const dynamic = (func: { toString: () => string }) => {
  const functionString = func.toString()

  const match = functionString.match(/"(.*?)"/)

  if (!match) throw new Error("Could not find module path")

  // eslint-disable-next-line import/no-dynamic-require
  return DynamicComponent
}

export default dynamic
