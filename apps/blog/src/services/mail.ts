import client from "@sendgrid/client"

const apiKey = process.env.SENDGRID_API_KEY
const contactListId = process.env.SENDGRID_CONTACT_LIST_ID

client.setApiKey(apiKey as string)

export const subscribeToNewsletter = async (email: string) => {
  if (!apiKey) throw new Error("Missing env=SENDGRID_API_KEY")
  if (!contactListId) throw new Error("Missing env=SENDGRID_CONTACT_LIST_ID")

  return client.request({
    method: "PUT",
    url: "/v3/marketing/contacts",
    body: {
      contacts: [{ email }],
      list_ids: [contactListId],
    },
  })
}
