import axios from "axios"

const cms = axios.create({ baseURL: process.env.CMS_URL })

export default cms
