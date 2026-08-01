import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { DiscreetToggle } from "@/components/discreet-toggle";
import { SafeExitButton } from "@/components/safe-exit-button";
import { getCatalog } from "@/server/catalog";

const geist=Geist({subsets:["latin"],display:"swap"});
export const metadata:Metadata={title:{default:"Kent Housing Navigator",template:"%s | Kent Housing Navigator"},description:"A calm, privacy-aware route to housing and homelessness support in Kent and Medway.",robots:{index:false,follow:false}};
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>){const catalog=await getCatalog();return <html lang="en-GB"><body className={geist.className}><a className="skip-link" href="#main-content">Skip to main content</a><header className="site-header"><Link className="brand" href="/">Kent Housing Navigator</Link><nav aria-label="Primary navigation"><Link href="/help-now">Get help now</Link><Link href="/my-plan">My next steps</Link><Link href="/apply">Apply</Link><Link href="/support">Find support</Link><Link href="/letters">Letters</Link><Link href="/evidence">Evidence</Link><Link href="/profile">My profile</Link><Link href="/case">My case</Link><Link href="/consent">Consent</Link><Link href="/advocate">Advocate</Link><Link href="/privacy">Privacy</Link></nav><DiscreetToggle/><SafeExitButton/></header><main id="main-content">{children}</main><footer><p>Support information is loaded from controlled dataset {catalog.metadata.version}, checked {catalog.metadata.verifiedOn}. Always check the verification date shown.</p><p><Link href="/accessibility">Accessibility</Link> · <Link href="/discreet-mode">Discreet mode</Link> · <Link href="/settings/data">Data controls</Link></p></footer></body></html>}
