/* eslint-disable prefer-destructuring */
const config = {
  domain: process.env.NEXT_PUBLIC_DOMAIN_NAME,
  cmsApiEndpoint: process.env.CMS_API_ENDPOINT,
}

export const CMS_API_ENDPOINT = process.env.CMS_API_ENDPOINT
export const CMS_API_KEY = process.env.CMS_API_KEY

export default config
