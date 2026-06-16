# Quay OIDC Auth Action

Authenticate to [Quay.io](https://quay.io) or a private Red Hat Quay instance using GitHub Actions OIDC federation. This action exchanges a GitHub-issued OIDC JWT for a short-lived Quay robot account token, eliminating the need to manage long lived credentials.

## Prerequisites

1. A Quay robot account with OIDC federation configured for GitHub Actions:
   - **Issuer:** `https://token.actions.githubusercontent.com`
   - **Subject:** Set to match your repository (e.g., `repo:org/repo:ref:refs/heads/main`)
2. The workflow must have `id-token: write` permission.

## Usage

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: sabre1041/quay-oidc-auth-action@main
        id: quay-auth
        with:
          username: myorg+cicd_robot

      - uses: docker/login-action@v3
        with:
          registry: quay.io
          username: ${{ steps.quay-auth.outputs.username }}
          password: ${{ steps.quay-auth.outputs.token }}

      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: quay.io/myorg/myimage:latest
```

### Private Quay Instance

A private instance of Red Hat Quay can be used by specifying the `hostname` input parameter with the hostname of the Quay instance. In addition, a TLS certificate that is not trusted by GitHub can be specified using the `tls-certificate` input parameter. The following shows how to utilize a private instance of Red Hat Quay along with the associated TLS certificate stored within a GitHub actions Secret.

```yaml
      - uses: org/quay-oidc-auth-action@v1
        id: quay-auth
        with:
          hostname: quay.example.com
          username: myorg+cicd_robot
          tls-certificate: ${{ secrets.QUAY_CA_CERT }}
```

### Disable SSL Verification

Instead of specifying the TLS certificate, SSL verification can be disabled by specifying the `verify-ssl` input parameter as shown below:

```yaml
      - uses: org/quay-oidc-auth-action@v1
        id: quay-auth
        with:
          hostname: quay.internal
          username: myorg+cicd_robot
          verify-ssl: 'false'
```

## Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `hostname` | No | `quay.io` | Quay server hostname |
| `username` | **Yes** | — | Robot account name (e.g., `org+robot_name`) |
| `protocol` | No | `https` | Protocol (`http` or `https`) |
| `tls-certificate` | No | — | Custom CA certificate in PEM format |
| `verify-ssl` | No | `true` | Whether to verify SSL certificates |

## Outputs

| Name | Description |
|------|-------------|
| `token` | Short-lived Quay robot account token (masked in logs) |
| `username` | The robot account username |
| `expiration` | Token expiration time in ISO 8601 format |

## How It Works

1. The action requests an OIDC JWT from GitHub's token provider.
2. A request to `https://<hostname>/oauth2/federation/robot/token` is made using HTTP Basic Auth (username = robot account, password = GitHub OIDC JWT).
3. Quay validates the JWT against the configured OIDC issuer and returns a short-lived token.
4. The token along with the expiration time is set as an output for subsequent tasks.

## License

Apache-2.0
