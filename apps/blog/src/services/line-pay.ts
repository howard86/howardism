import { createHmac, randomUUID } from "node:crypto"

import { env } from "@/config/env.mjs"

type RequestApiParam = {
  amount: number // Payment amount
  currency: string // Payment currency (ISO 4217)
  orderId: string // An order ID of payment request from the merchant
  packages: {
    id: string // An unique ID of package list
    amount: number // Total amount of products per package
    userFee?: number // User fee: Respond if a commission is found within the payment amount.
    name?: string // Name of the package or name of internal shops
    products: {
      id?: string // ID of sales products of the merchant
      name: string // Name of the sales products
      imageUrl?: string // Image URL of the sales products
      quantity: number // Number of products
      price: number // Price of each product
      originalPrice?: number // Original price of each product
    }[]
  }[]
  redirectUrls: {
    appPackageName?: string // An information to prevent phishing while transferring between apps in Android.
    confirmUrl: string // A merchant URL user moves to after requesting the payment.
    confirmUrlType?: string // A navigation type of the ConfirmURL after user approves the payment request.
    cancelUrl: string // A URL that moves to the next when LINE Pay member cancels the payment from the payment page.
  }
  options?: {
    payment?: {
      capture?: boolean // Regarding automatic payment
      payType?: string // Payment options
    }
    display?: {
      locale?: string // Language codes of the payment standby screen. The default language is English (en).
      checkConfirmUrlBrowser?: boolean // Checking the payment browser when moving to the ConfirmURL
    }
    shipping?: {
      type?: string // Shipping address options
      feeAmount?: number // Shipping fee
      feeInquiryUrl?: string // A URL to check shipping method
      feeInquiryType?: string // Shipping fee options
      address?: {
        country?: string // Shipping country
        postalCode?: string // Shipping postal code
        state?: string // Shipping region
        city?: string // Shipping address
        detail?: string // Shipping detail
        optional?: string // Additional information of the shipping address
        recipient?: {
          firstName?: string // Recipient name
          lastName?: string // Recipient last name
          firstNameOptional?: string // Additional information of the recipient first name
          lastNameOptional?: string // Additional information of the recipient last name
          email?: string // Email of the recipient
          phoneNo?: string // Phone number of the recipient
        }
      }
    }
    familyService?: {
      addFriends?: {
        type?: string // Service type of the friend add list
        idList?: string[] // A list of ID by service
      }[]
    }
    extra?: {
      branchName?: string // Branch Name where the payment is requested from
      branchId?: string // Branch Id where the payment is requested.
    }
  }
}

type ConfirmApiParam = {
  amount: number // Payment amount
  currency: string // Payment currency (ISO 4217)
}

const enum LinePayApiEndpoints {
  Request = "/v3/payments/request",
  Confirm = "/v3/payments/{transactionId}/confirm",
  Capture = "/v3/payments/authorizations/{transactionId}/capture",
}

export const enum RequestApiReturnCode {
  Success = "0000",
  NonExistingMerchant = "1104",
  MerchantCannotUseLinePay = "1105",
  HeaderInfoError = "1106",
  AmountInfoError = "1124",
  PaymentInProgress = "1145",
  TransactionRecordExists = "1172",
  UnsupportedCurrency = "1178",
  PaymentAmountLessThanZero = "1183",
  MerchantCannotUsePreapprovedPayment = "1194",
  ParameterError = "2101",
  JsonDataFormatError = "2102",
  InternalError = "9000",
}

type RequestApiResponse = {
  returnCode: RequestApiReturnCode // Return code
  returnMessage: string // Return message
  info: {
    transactionId: number // Transaction ID
    paymentAccessToken: string // The code value entered when code is used instead of scanner in the LINE Pay.
    paymentUrl: {
      app: string // App URL to move to the payment page
      web: string // Web URL to move to the payment page
    }
  }
}

export enum ConfirmApiReturnCode {
  Success = "0000",
  NotLinePayMember = "1101",
  MemberTransactionError = "1102",
  NonExistingMerchant = "1104",
  MerchantCannotUseLinePay = "1105",
  HeaderInfoError = "1106",
  UnacceptableCreditCard = "1110",
  AmountInfoError = "1124",
  PaymentAccountError = "1141",
  LowBalance = "1142",
  NoTransactionHistory = "1150",
  TransactionRecordExists = "1152",
  PaymentAmountMismatch = "1153",
  PaymentRequestInfoNotFound = "1159",
  SelectPaymentMethod = "1169",
  MemberAccountBalanceChanged = "1170",
  OrderNumberAlreadyExists = "1172",
  PaymentExpired = "1180",
  ApiCallDuplicated = "1198",
  InternalRequestError = "1199",
  CreditCardProcessingError = "1280",
  CreditCardPaymentError = "1281",
  CreditCardAuthorizationError = "1282",
  SuspectedFraud = "1283",
  CreditCardPaymentStopped = "1284",
  MissingCreditCardInfo = "1285",
  WrongCreditCardInfo = "1286",
  CreditCardExpired = "1287",
  CreditCardLowBalance = "1288",
  ExceededCreditCardLimit = "1289",
  ExceededCreditCardPerPaymentLimit = "1290",
  StolenCard = "1291",
  SuspendedCard = "1292",
  CVNInputError = "1293",
  CardBlacklisted = "1294",
  WrongCardNumber = "1295",
  CannotProceedAmount = "1296",
  CardDeclined = "1298",
  InternalError = "9000",
}

type ConfirmApiResponse = {
  returnCode: ConfirmApiReturnCode // Return code
  returnMessage: string // Return message
  info: {
    orderId: string // An unique order ID of the merchant sent upon requesting the payment.
    transactionId: number // A transaction ID returned as the payment request result
    authorizationExpireDate?: string // Option: Authorization expiration date and time (ISO 8601)
    regKey?: string // Option: A key for automatic payment
    payInfo?: {
      method: string // A payment method used for payment
      amount: number // Payment amount
      creditCardNickname?: string // Credit card nickname for automatic payment
      creditCardBrand?: string // Credit card brand used for automatic payment
      maskedCreditCardNumber?: string // Masked credit card number
    }[] // Payment Information
    packages?: {
      id: string // An unique ID of package list
      name: string // Name of the sales products
      amount: number // Total amount of products per package
      userFeeAmount: number // User fee: Sent as a respond if a list of fee is found within the payment amount.
    }[]
    shipping?: {
      methodId: string // An ID of shipping method selected by user
      feeAmount: number // Shipping fee
      address?: {
        country: string // Shipping country
        postalCode: string // Shipping postal code
        state: string // Shipping region
        city: string // Shipping address
        detail: string // Shipping detail
        optional: string // Additional information of the shipping address
        recipient: {
          firstName: string // Recipient first name
          lastName: string // Recipient last name
          firstNameOptional: string // Additional information of the recipient first name
          lastNameOptional: string // Additional information of the recipient last name
          email: string // Email of the recipient
          phoneNo: string // Phone number of the recipient
        }
      }
    }
  }
}

const getLinePayAuthorizationHeaders = (uri: string, body: string) => {
  if (!env.LINE_PAY_CHANNEL_SECRET_KEY || !env.LINE_PAY_CHANNEL_ID)
    throw new Error("Missing LINE pay required envs")

  const nonce = randomUUID()
  const signature = createHmac("sha256", env.LINE_PAY_CHANNEL_SECRET_KEY)
    .update(`${env.LINE_PAY_CHANNEL_SECRET_KEY}${uri}${body}${nonce}`)
    .digest("base64")

  const headers = {
    "Content-Type": "application/json",
    "X-LINE-ChannelId": env.LINE_PAY_CHANNEL_ID,
    "X-LINE-Authorization-Nonce": nonce,
    "X-LINE-Authorization": signature,
  } as const

  console.debug("headers :>> ", headers)

  return headers
}

export const requestApi = async (param: RequestApiParam): Promise<RequestApiResponse> => {
  if (!env.LINE_PAY_API_URL) throw new Error("Missing LINE pay api url")

  const body = JSON.stringify(param)

  return fetch(env.LINE_PAY_API_URL + LinePayApiEndpoints.Request, {
    method: "POST",
    headers: getLinePayAuthorizationHeaders(LinePayApiEndpoints.Request, body),
    body,
  }).then((res) => res.json())
}

export const confirmApi = async (
  transactionId: number,
  param: ConfirmApiParam
): Promise<ConfirmApiResponse> => {
  if (!env.LINE_PAY_API_URL) throw new Error("Missing LINE pay api url")

  const uri = LinePayApiEndpoints.Confirm.replace("{transactionId}", transactionId.toString())
  const body = JSON.stringify(param)

  return fetch(env.LINE_PAY_API_URL + uri, {
    method: "POST",
    headers: getLinePayAuthorizationHeaders(uri, body),
    body,
  }).then((res) => res.json())
}
