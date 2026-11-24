import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@howardism/design-system";

export const ArticleCard = () => (
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Harness Swap vs. Rerun Noise</CardTitle>
      <CardDescription>
        How much of a benchmark delta survives once you rerun the same harness
        five times.
      </CardDescription>
      <CardAction>
        <Badge variant="secondary">Concept</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Agent Systems · 25 min read · revised 23 Nov 2026
      </p>
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Read</Button>
      <Button size="sm" variant="outline">
        Save
      </Button>
    </CardFooter>
  </Card>
);

export const Small = () => (
  <Card className="max-w-xs" size="sm">
    <CardHeader>
      <CardTitle>Reading streak</CardTitle>
      <CardDescription>12 articles this month</CardDescription>
    </CardHeader>
  </Card>
);
