import client from "@sendgrid/client";

const apiKey = process.env.SENDGRID_API_KEY;
const contactListId = process.env.SENDGRID_CONTACT_LIST_ID;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

/** Validates the API key and returns the configured client. */
function getConfiguredClient(): typeof client {
  if (!apiKey) {
    throw new Error("Missing env=SENDGRID_API_KEY");
  }
  client.setApiKey(apiKey);
  return client;
}

export const sendTransactionalEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (!fromEmail) {
    throw new Error("Missing env=SENDGRID_FROM_EMAIL");
  }
  const c = getConfiguredClient();
  await c.request({
    method: "POST",
    url: "/v3/mail/send",
    body: {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail },
      subject,
      content: [{ type: "text/html", value: html }],
    },
  });
};

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
