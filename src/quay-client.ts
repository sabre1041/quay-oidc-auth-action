import {HttpClient} from '@actions/http-client'
import {BasicCredentialHandler} from '@actions/http-client/lib/auth'
import {RequestOptions} from '@actions/http-client/lib/interfaces'
import * as https from 'https'

export interface ExchangeTokenOptions {
  hostname: string
  username: string
  protocol: string
  oidcToken: string
  tlsCertificate?: string
  verifySsl: boolean
}

export interface ExchangeTokenResult {
  token: string
  expiration: string
}

interface QuayTokenResponse {
  token: string
}

export function getTokenExpiration(token: string): string {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Quay returned an invalid JWT: expected 3 parts')
  }

  const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
  const claims = JSON.parse(payload)

  if (typeof claims.exp !== 'number') {
    throw new Error('Quay JWT is missing the exp claim')
  }

  return new Date(claims.exp * 1000).toISOString()
}

export async function exchangeToken(
  options: ExchangeTokenOptions
): Promise<ExchangeTokenResult> {
  const requestOptions: RequestOptions = {}

  if (!options.verifySsl) {
    requestOptions.ignoreSslError = true
  }

  const credHandler = new BasicCredentialHandler(
    options.username,
    options.oidcToken
  )
  const client = new HttpClient(
    'quay-oidc-auth-action',
    [credHandler],
    requestOptions
  )

  if (options.tlsCertificate) {
    const agent = new https.Agent({ca: options.tlsCertificate})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(client as any)._agent = agent
  }

  const url = `${options.protocol}://${options.hostname}/oauth2/federation/robot/token`

  const response = await client.getJson<QuayTokenResponse>(url)

  if (response.statusCode !== 200) {
    throw new Error(
      `Quay returned HTTP ${response.statusCode}. Verify that the robot account "${options.username}" has OIDC federation configured for GitHub Actions.`
    )
  }

  if (!response.result?.token) {
    throw new Error(
      'Unexpected response from Quay: missing token field'
    )
  }

  const expiration = getTokenExpiration(response.result.token)

  return {
    token: response.result.token,
    expiration
  }
}
