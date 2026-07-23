# Raspberry Pi private deployment

This project deploys to a Raspberry Pi over Tailscale whenever `master` is pushed.

## GitHub repository secrets

Add these secrets in GitHub:

- `TS_AUTHKEY`: an ephemeral, reusable Tailscale auth key that can join your tailnet.
- `PI_SSH_PRIVATE_KEY`: a private SSH key whose public key is present in `/home/hyeonil/.ssh/authorized_keys` on the Raspberry Pi.

## Raspberry Pi prerequisites

Run these once on the Raspberry Pi:

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo tailscale up
sudo tailscale serve --yes --https=443 localhost:3000
```

The deployed files are placed in:

```text
/var/www/smartfactory-pv
```

The private Tailscale URL is:

```text
https://hyeonil.tail4b4a48.ts.net
```

Only devices/users allowed into your Tailscale tailnet can open that URL.
