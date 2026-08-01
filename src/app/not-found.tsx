import Link from "next/link";

export default function NotFoundPage() {
  return <><h1>Page not found</h1><p>The requested page does not exist.</p><Link href="/">Return to the navigator</Link></>;
}
