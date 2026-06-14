"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@howardism/ui/components/tabs";

import type { ShelfManifestEntry } from "@/lib/shelf-rows";

import { SavedList } from "./saved-list";
import { ShelfList } from "./shelf-list";

/**
 * The Shelf's tabbed shell: automatic reading History and deliberate Saved
 * lists, both resolved against the same build-time article manifest.
 */
export function ShelfTabs({ manifest }: { manifest: ShelfManifestEntry[] }) {
  return (
    <Tabs className="mt-8" defaultValue="history">
      <TabsList>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="saved">Saved</TabsTrigger>
      </TabsList>
      <TabsContent value="history">
        <ShelfList manifest={manifest} />
      </TabsContent>
      <TabsContent value="saved">
        <SavedList manifest={manifest} />
      </TabsContent>
    </Tabs>
  );
}
