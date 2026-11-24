import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useForm,
} from "@howardism/design-system";

const Subscribe = ({ invalid }: { invalid?: boolean }) => {
  const form = useForm({
    defaultValues: { email: invalid ? "not-an-email" : "" },
    errors: invalid
      ? { email: { type: "pattern", message: "Enter a valid email address." } }
      : undefined,
  });
  return (
    <Form {...form}>
      <form className="grid w-80 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weekly digest</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>
                New and revised AI-research notes, once a week.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button">Subscribe</Button>
      </form>
    </Form>
  );
};

export const Default = () => <Subscribe />;
export const WithError = () => <Subscribe invalid />;
