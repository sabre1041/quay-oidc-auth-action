import * as core from '@actions/core'
import {exchangeToken} from './quay-client'

export async function run(): Promise<void> {
  try {
    const hostname = core.getInput('hostname')
    const username = core.getInput('username', {required: true})
    const protocol = core.getInput('protocol')
    const tlsCertificate = core.getInput('tls-certificate')
    const verifySsl = core.getBooleanInput('verify-ssl')

    core.info('Requesting OIDC token from GitHub...')
    const oidcToken = await core.getIDToken()

    core.info(`Exchanging OIDC token with Quay at ${hostname}...`)
    const result = await exchangeToken({
      hostname,
      username,
      protocol,
      oidcToken,
      tlsCertificate: tlsCertificate || undefined,
      verifySsl
    })

    core.setSecret(result.token)
    core.setOutput('token', result.token)
    core.setOutput('username', username)
    core.setOutput('expiration', result.expiration)

    core.info(`Authentication successful. Token expires at ${result.expiration}`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

run()
