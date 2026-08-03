import { CorrectionProposalForm } from "@/components/operational-forms";
import { PartnerWorkspace } from "@/components/phase6-workspaces";

export default function Page() {
  return <PartnerWorkspace title="Correction proposals" intro="Submit evidence-backed corrections for controlled review.">
    <p>Proposals move through submitted, review and revision states. Only a separate publisher role can link an independently approved dataset revision.</p>
    <CorrectionProposalForm />
  </PartnerWorkspace>;
}
