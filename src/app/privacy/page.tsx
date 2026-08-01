import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy and device safety" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy and device safety</h1>
      <p className="lede">Choose the least persistent mode that works for you. A quick exit changes the visible page, but cannot guarantee removal of browser, network or device records.</p>
      <h2>Storage modes</h2>
      <dl>
        <dt><strong>Guest</strong></dt><dd>No profile is required and application preparation keeps values in memory only.</dd>
        <dt><strong>Public device</strong></dt><dd>An opaque, short-lived session cookie is used; profile persistence is not allowed.</dd>
        <dt><strong>Private device</strong></dt><dd>The schema supports encrypted server-side facts and independently shareable fields. Account storage is not enabled in this phase.</dd>
      </dl>
      <h2>Important limitation</h2>
      <p>Do not assume that clearing browser history or using quick exit removes every trace. If another person monitors the device or network, consider using a safer device or speaking with a trusted support service.</p>
    </>
  );
}
