type JsonLdNode = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdNode | JsonLdNode[];
}

// Escapes `<` so a value containing `</script>` cannot close the tag early
// (https://nextjs.org/docs/app/guides/json-ld).
export function serializeJsonLd(data: JsonLdNode | JsonLdNode[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is a non-executed data block and serializeJsonLd escapes `<`
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      type="application/ld+json"
    />
  );
}
