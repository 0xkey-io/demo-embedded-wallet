"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useZeroXKey } from "@0xkey-io/react-wallet-kit"

interface AuthState {
  loading: boolean
  sessionExpiring: boolean
}

const AuthContext = createContext<{
  state: AuthState
}>({
  state: { loading: false, sessionExpiring: false },
})

const SESSION_WARNING_THRESHOLD_S = 30

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { session, clientState } = useZeroXKey()
  const warningTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [sessionExpiring, setSessionExpiring] = useState(false)

  const loading = clientState === undefined

  useEffect(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = undefined
    }

    if (!session?.expiry) {
      setSessionExpiring(false)
      return
    }

    const expiryMs = session.expiry * 1000
    const warningTime = expiryMs - SESSION_WARNING_THRESHOLD_S * 1000
    const now = Date.now()
    const timeUntilWarning = warningTime - now

    if (timeUntilWarning <= 0) {
      setSessionExpiring(true)
    } else {
      setSessionExpiring(false)
      warningTimeoutRef.current = setTimeout(() => {
        setSessionExpiring(true)
      }, timeUntilWarning)
    }

    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [session])

  return (
    <AuthContext.Provider
      value={{
        state: { loading, sessionExpiring },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
