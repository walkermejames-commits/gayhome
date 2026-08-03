import Link from "next/link";
import { requirePartnerUser, requirePhase6Admin, type Phase6AdminRole } from "@/server/phase6-authorization";

export async function Phase6AdminWorkspace({ title, intro, roles = ["administrator", "data_steward", "regional_reviewer"], children }: { title: string; intro: string; roles?: readonly Phase6AdminRole[]; children?: React.ReactNode }) {
  const access = await requirePhase6Admin(roles);
  if (!access) return <><h1>Access denied</h1><p>This administrative view requires an active, server-verified Phase 6 role.</p><Link href="/profile">Go to profile</Link></>;
  return <><h1>{title}</h1><p className="lede">{intro}</p><p className="callout">Phase 6 preview: publication and external integrations remain disabled.</p>{children}</>;
}

export async function PartnerWorkspace({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  const access = await requirePartnerUser();
  if (!access) return <><h1>Partner access required</h1><p>A verified organisation, active agreement and active partner user are required. Partner status never grants access to private cases.</p><Link href="/partners/onboarding">View onboarding requirements</Link></>;
  return <><h1>{title}</h1><p className="lede">{intro}</p><p className="callout">Sandbox only. Your organisation can propose changes but cannot publish them.</p>{children}</>;
}
