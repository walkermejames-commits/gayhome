import Link from "next/link";
import { PartnerWorkspace } from "@/components/phase6-workspaces";

export default function Page() {
  return <PartnerWorkspace title="Partner portal" intro="Controlled tools for approved providers and professional partners.">
    <p>Partner access is organisation-scoped and never confers private case access. Partners cannot search users, publish corrections, change gates or activate features.</p>
    <div className="action-grid">
      <Link className="action-card" href="/partners/profile"><strong>Organisation profile</strong>Review controlled organisation details.</Link>
      <Link className="action-card" href="/partners/services"><strong>Service information</strong>Review represented services.</Link>
      <Link className="action-card" href="/partners/proposals"><strong>Correction proposals</strong>Propose an evidence-backed change without publishing it.</Link>
      <Link className="action-card" href="/partners/training"><strong>Training</strong>Complete privacy, safety and verification learning.</Link>
    </div>
  </PartnerWorkspace>;
}
