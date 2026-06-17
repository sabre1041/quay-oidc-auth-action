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

      - uses: sabre1041/quay-oidc-auth-action@v1
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

A private instance of Red Hat Quay can be used by specifying the `hostname` input parameter with the hostname of the Quay instance. In addition, a TLS certificate that is not trusted by GitHub can be provided as a base64-encoded string using the `tls-certificate-base64` input parameter. The following shows how to utilize a private instance of Red Hat Quay along with the associated TLS certificate stored as a base64-encoded value within a GitHub Actions secret.

```yaml
      - uses: org/quay-oidc-auth-action@v1
        id: quay-auth
        with:
          hostname: quay.example.com
          username: myorg+cicd_robot
          tls-certificate-base64: ${{ secrets.QUAY_CA_CERT_BASE64 }}
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
| `tls-certificate-base64` | No | — | Base64-encoded custom CA certificate in PEM format |
| `verify-ssl` | No | `true` | Whether to verify SSL certificates |

## Outputs

| Name | Description |
|------|-------------|
| `token` | Short-lived Quay robot account token (masked in logs) |
| `username` | The robot account username |
| `expiration` | Token expiration time in ISO 8601 format |

## Quay Configuration

OIDC federation in Quay is facilitated through the use of a Robot Account. Once the Robot Account has been created with the appropriate repository permissions, configure federation by navigating to the Robot Accounts page, click the kabob and select **Set robot federation**.

Enter the following parameters:

* Issuer URL:  https://token.actions.githubusercontent.com
* Subject: repo:<org-or-username>/<repo-name>:ref:refs/heads/<branch-name>

Replace the parameters in the subject with the appropriate repository and branch.

## How It Works

1. The action requests an OIDC JWT from GitHub's token provider.
2. A request to `https://<hostname>/oauth2/federation/robot/token` is made using HTTP Basic Auth (username = robot account, password = GitHub OIDC JWT).
3. Quay validates the JWT against the configured OIDC issuer and returns a short-lived token.
4. The token along with the expiration time is set as an output for subsequent tasks.

## License

Apache-2.0
