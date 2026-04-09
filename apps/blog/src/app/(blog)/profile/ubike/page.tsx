"use client";

import dynamic from "next/dynamic";

import { Container } from "@/app/(common)/Container";

const DynamicUbikeMap = dynamic(() => import("./UbikeMap"), { ssr: false });

export default function UbikePage() {
  return (
    <Container className="mt-20 md:flex">
      <h1 className="sr-only">Ubike</h1>

      <div className="md:mockup-phone">
        <div className="camera" />
        <div className="display">
          <div className="md:artboard artboard-demo phone-2 relative w-full bg-muted max-md:h-[calc(100vh-40px)]">
            <DynamicUbikeMap />
          </div>
        </div>
      </div>
    </Container>
  );
}
