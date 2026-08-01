"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert"><h1>Something went wrong</h1><p>No information was submitted. You can safely try this page again.</p><button className="primary" type="button" onClick={reset}>Try again</button></div>;
}
