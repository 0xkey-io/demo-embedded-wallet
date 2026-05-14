import { Toaster } from "sonner"

import { Aurora } from "@/components/aurora"
import { InverseAuthGuard } from "@/components/auth-guard"
import Features from "@/components/features"

interface LandingLayoutProps {
  children: React.ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <InverseAuthGuard>
      <main className="h-screen">
        <div className="grid h-full lg:grid-cols-[2fr_3fr]">
          <div className="relative hidden overflow-hidden lg:block">
            <Aurora />
            <div className="relative z-10 h-full">
              <Features />
            </div>
          </div>
          <div className="flex items-center justify-center px-6">
            {children}
            <Toaster />
          </div>
        </div>
      </main>
    </InverseAuthGuard>
  )
}
