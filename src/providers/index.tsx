"use client"

import { ZeroXKeyProvider } from "@0xkey-io/react-wallet-kit"

import { zeroXKeyConfig } from "@/config/0xkey"

import { AuthProvider } from "./auth-provider"
import { ThemeProvider } from "./theme-provider"

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    forcedTheme="light"
    enableSystem={false}
    disableTransitionOnChange
  >
    <ZeroXKeyProvider
      config={zeroXKeyConfig}
      callbacks={{
        onSessionExpired: () => {},
      }}
    >
      <AuthProvider> {children}</AuthProvider>
    </ZeroXKeyProvider>
  </ThemeProvider>
)
