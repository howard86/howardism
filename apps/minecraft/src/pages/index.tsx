import dynamic from "next/dynamic"

const DynamicGame = dynamic(() => import("@/components/Game"), { ssr: false })

export default function Home() {
  return (
    <div style={{ height: "900px" }}>
      <DynamicGame />
    </div>
  )
}
