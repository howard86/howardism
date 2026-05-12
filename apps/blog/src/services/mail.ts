import client from "@sendgrid/client";

const apiKey = process.env.SENDGRID_API_KEY;
const contactListId = process.env.SENDGRID_CONTACT_LIST_ID;

/** Validates the API key and returns the configured client. */
function getConfiguredClient(): typeof client {
  if (!apiKey) {
    throw new Error("Missing env=SENDGRID_API_KEY");
  }
  client.setApiKey(apiKey);
  return client;
}

export const subscribeToNewsletter = (email: string) => {
  if (!contactListId) {
    throw new Error("Missing env=SENDGRID_CONTACT_LIST_ID");
  }
  const c = getConfiguredClient();
  return c.request({
    method: "PUT",
    url: "/v3/marketing/contacts",
    body: {
      contacts: [{ email }],
      list_ids: [contactListId],
    },
  });
};
