import { ZeroXKeyProviderConfig } from "@0xkey-io/react-wallet-kit"

import { env } from "@/env.mjs"

const {
  NEXT_PUBLIC_ORGANIZATION_ID,
  NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_AUTH_PROXY_URL,
  NEXT_PUBLIC_AUTH_PROXY_ID,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_EXPORT_IFRAME_URL,
  NEXT_PUBLIC_IMPORT_IFRAME_URL,
  NEXT_PUBLIC_RP_ID,
  NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID,
} = env

export const customWallet = {
  walletName: "Default Wallet",
  walletAccounts: [
    {
      curve: "CURVE_SECP256K1" as const,
      pathFormat: "PATH_FORMAT_BIP32" as const,
      path: `m/44'/60'/0'/0/0`,
      addressFormat: "ADDRESS_FORMAT_ETHEREUM" as const,
    },
  ],
}

export const zeroXKeyConfig: ZeroXKeyProviderConfig = {
  organizationId: NEXT_PUBLIC_ORGANIZATION_ID,
  authProxyConfigId: NEXT_PUBLIC_AUTH_PROXY_ID,
  authProxyUrl: NEXT_PUBLIC_AUTH_PROXY_URL,
  apiBaseUrl: NEXT_PUBLIC_BASE_URL,
  exportIframeUrl: NEXT_PUBLIC_EXPORT_IFRAME_URL,
  importIframeUrl: NEXT_PUBLIC_IMPORT_IFRAME_URL,
  passkeyConfig: {
    rpId: NEXT_PUBLIC_RP_ID || undefined,
  },
  auth: {
    autoRefreshSession: true,
    oauthConfig: {
      oauthRedirectUri: NEXT_PUBLIC_APP_URL,
      googleClientId: NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || undefined,
      appleClientId: NEXT_PUBLIC_APPLE_OAUTH_CLIENT_ID || undefined,
    },
    createSuborgParams: {
      passkeyAuth: {
        userName: "Passkey User",
        passkeyName: "Default Passkey",
        customWallet,
      },
      emailOtpAuth: {
        userName: "Email User",
        customWallet,
      },
      oauth: {
        userName: "OAuth User",
        customWallet,
      },
    },
  },

  ui: {
    logoLight: "/logos/0xkey-lockup.svg",
    logoDark: "/logos/0xkey-lockup-dark.svg",
    borderRadius: "12px",
  },
}
