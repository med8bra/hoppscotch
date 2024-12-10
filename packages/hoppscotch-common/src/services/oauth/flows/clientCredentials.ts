import { createFlowConfig, decodeResponseAsJSON } from "../oauth.service"
import { z } from "zod"
import { getService } from "~/modules/dioc"
import * as E from "fp-ts/Either"
import { useToast } from "~/composables/toast"
import { ClientCredentialsGrantTypeParams } from "@hoppscotch/data"
import { KernelInterceptorService } from "~/services/kernel-interceptor.service"
import { content } from "@hoppscotch/kernel"

const kernelInterceptor = getService(KernelInterceptorService)

const ClientCredentialsFlowParamsSchema = ClientCredentialsGrantTypeParams.pick(
  {
    authEndpoint: true,
    clientID: true,
    clientSecret: true,
    scopes: true,
  }
).refine((params) => {
  return (
    params.authEndpoint.length >= 1 &&
    params.clientID.length >= 1 &&
    (!params.scopes || params.scopes.length >= 1)
  )
})

export type ClientCredentialsFlowParams = z.infer<
  typeof ClientCredentialsFlowParamsSchema
>

export const getDefaultClientCredentialsFlowParams =
  (): ClientCredentialsFlowParams => ({
    authEndpoint: "",
    clientID: "",
    clientSecret: "",
    scopes: undefined,
  })

const initClientCredentialsOAuthFlow = async (
  params: ClientCredentialsFlowParams
) => {
  const toast = useToast()

  const requestParams = {
    grant_type: "client_credentials",
    client_id: params.clientID,
    ...(params.clientSecret && { client_secret: params.clientSecret }),
    ...(params.scopes && { scope: params.scopes }),
  }

  const { response } = kernelInterceptor.execute({
    id: Date.now(),
    url: params.authEndpoint,
    method: "POST",
    version: "HTTP/1.1",
    headers: {
      "Content-Type": ["application/x-www-form-urlencoded"],
      Accept: ["application/json"],
    },
    content: content.urlencoded(requestParams),
  })

  const result = await response

  if (E.isLeft(result)) {
    return E.left("AUTH_TOKEN_REQUEST_FAILED" as const)
  }

  const jsonResponse = decodeResponseAsJSON(result.right)
  if (E.isLeft(jsonResponse)) return E.left("AUTH_TOKEN_REQUEST_FAILED")

  const withAccessTokenSchema = z.object({
    access_token: z.string(),
  })

  const parsedTokenResponse = withAccessTokenSchema.safeParse(
    jsonResponse.right
  )

  if (!parsedTokenResponse.success) {
    toast.error("AUTH_TOKEN_REQUEST_INVALID_RESPONSE")
  }

  return parsedTokenResponse.success
    ? E.right(parsedTokenResponse.data)
    : E.left("AUTH_TOKEN_REQUEST_INVALID_RESPONSE" as const)
}

export default createFlowConfig(
  "CLIENT_CREDENTIALS" as const,
  ClientCredentialsFlowParamsSchema,
  initClientCredentialsOAuthFlow,
  () => Promise.resolve(E.left("NOT_IMPLEMENTED"))
)
