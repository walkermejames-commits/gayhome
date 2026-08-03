import { SecureOperationalWorkspace } from "@/components/secure-operational-workspace";

export default function Page() {
  return <SecureOperationalWorkspace roles={["partner_administrator", "pilot_administrator"]} title="Partner onboarding" intro="Record accountable contacts, agreements, training and scope before professional access is approved.">
    <ol>
      <li>Organisation identity and responsible administrator verified.</li>
      <li>Safeguarding, data-protection and accessibility contacts reviewed.</li>
      <li>Agreement approved with expiry and revocation controls.</li>
      <li>Privacy, consent and service-verification training completed.</li>
      <li>A least-privilege, time-limited professional role assigned.</li>
    </ol>
    <p>Completing this checklist does not activate the partner portal or create case access.</p>
  </SecureOperationalWorkspace>;
}
