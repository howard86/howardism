import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@howardism/design-system";

export const Default = () => (
  <Tabs className="w-96" defaultValue="notes">
    <TabsList>
      <TabsTrigger value="notes">Notes</TabsTrigger>
      <TabsTrigger value="sources">Sources</TabsTrigger>
      <TabsTrigger value="questions">Questions</TabsTrigger>
    </TabsList>
    <TabsContent value="notes">
      <p className="text-sm">
        42 notes in Evals & Benchmarks, revised 23 Nov 2026.
      </p>
    </TabsContent>
    <TabsContent value="sources">
      <p className="text-sm">118 sources cited across this domain.</p>
    </TabsContent>
    <TabsContent value="questions">
      <p className="text-sm">9 open questions.</p>
    </TabsContent>
  </Tabs>
);

export const LineVariant = () => (
  <Tabs className="w-96" defaultValue="sources">
    <TabsList variant="line">
      <TabsTrigger value="notes">Notes</TabsTrigger>
      <TabsTrigger value="sources">Sources</TabsTrigger>
      <TabsTrigger disabled value="questions">
        Questions
      </TabsTrigger>
    </TabsList>
    <TabsContent value="sources">
      <p className="text-sm">118 sources cited across this domain.</p>
    </TabsContent>
  </Tabs>
);
