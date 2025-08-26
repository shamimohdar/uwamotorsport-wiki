import "./globals.css"
import { ReactNode } from "react"
import Providers from "./providers"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="mx-auto max-w-5xl p-4">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}