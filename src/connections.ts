import z from 'zod'
import type { RutterClient } from './client'
import { RutterSchemaMismatchError } from './errors'
import {
  zConnectionResponse,
  zListConnectionsResponse,
  zExchangeTokenResponse,
  zDeleteConnectionResponse,
  zGetAccessTokenConnectionResponse,
} from './generated/zod.gen'

type TConnectionResponse = z.infer<typeof zConnectionResponse>
type TListConnectionsResponse = z.infer<typeof zListConnectionsResponse>
type TExchangeTokenResponse = z.infer<typeof zExchangeTokenResponse>
type TDeleteConnectionResponse = z.infer<typeof zDeleteConnectionResponse>
type TGetAccessTokenConnectionResponse = z.infer<
  typeof zGetAccessTokenConnectionResponse
>

export class RutterConnectionsApi {
  constructor(private readonly client: RutterClient) {}

  async create(params: { platform: string }): Promise<TConnectionResponse> {
    const endpoint = '/connections'
    const response = await this.client.post<unknown>(endpoint, params)

    const result = zConnectionResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async list(): Promise<TListConnectionsResponse> {
    const endpoint = '/connections'
    const response = await this.client.get<unknown>(endpoint)

    const result = zListConnectionsResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async get(accessToken: string): Promise<TGetAccessTokenConnectionResponse> {
    const endpoint = '/connections'
    const response = await this.client.get<unknown>(endpoint, {
      access_token: accessToken,
    })

    const result = zGetAccessTokenConnectionResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async exchangeToken(params: {
    public_token: string
  }): Promise<TExchangeTokenResponse> {
    const endpoint = '/item/public_token/exchange'
    const response = await this.client.post<unknown>(endpoint, params)

    const result = zExchangeTokenResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }

  async delete(accessToken: string): Promise<TDeleteConnectionResponse> {
    const endpoint = '/connections'
    const response = await this.client.delete<unknown>(endpoint, {
      access_token: accessToken,
    })

    const result = zDeleteConnectionResponse.safeParse(response)
    if (!result.success) {
      throw new RutterSchemaMismatchError(
        endpoint,
        z.prettifyError(result.error),
      )
    }

    return result.data
  }
}
