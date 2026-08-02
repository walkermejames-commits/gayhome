import Link from "next/link";
import { currentSession } from "@/server/auth-cookie";
import { getPool } from "@/server/db/pool";
import type { OperationalRole } from "@/server/operations-auth";

export async function SecureOperationalWorkspace({ title, intro, roles, children }:{ title:string;intro:string;roles:readonly OperationalRole[];children?:React.ReactNode }) {
  const session=await currentSession();
  if(!session)return <><h1>Sign in required</h1><p>Operational tools need a valid staff or partner session.</p><Link href="/profile">Go to My profile</Link></>;
  const access=await getPool().query("SELECT 1 FROM professional_roles WHERE user_id=$1 AND role='administrator' AND status='active' AND (expires_at IS NULL OR expires_at>now()) UNION ALL SELECT 1 FROM operational_role_assignments WHERE user_id=$1 AND role=ANY($2) AND status='active' AND (expires_at IS NULL OR expires_at>now()) LIMIT 1",[session.userId,roles]);
  if(!access.rowCount)return <><h1>Access denied</h1><p>Your active role does not permit this operational workspace. Direct URLs do not bypass access control.</p></>;
  return <><div className="page-heading"><div><h1>{title}</h1><p className="lede">{intro}</p></div><span className="status">Controlled access</span></div>{children}</>;
}
