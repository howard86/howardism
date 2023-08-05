import { Container } from "@/app/(common)/Container"

import UbikeMap from "./UbikeMap"

export default function UbikePage() {
  return (
    <Container className="mt-20 flex">
      <h1 className="sr-only">Ubike</h1>

      {/* TODO: fix RWD */}
      <div className="mockup-phone">
        <div className="camera" />
        <div className="display">
          <div className="artboard artboard-demo phone-1 relative">
            <UbikeMap />
          </div>
        </div>
      </div>
    </Container>
  )
}
