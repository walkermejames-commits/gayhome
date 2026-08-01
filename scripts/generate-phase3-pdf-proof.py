from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

root = Path(__file__).resolve().parents[1]
output = root / "output" / "pdf"
output.mkdir(parents=True, exist_ok=True)
target = output / "phase3-case-summary-proof.pdf"
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ProofTitle", parent=styles["Title"], fontSize=24, leading=29, textColor=colors.HexColor("#321436"), alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="ProofH2", parent=styles["Heading2"], fontSize=16, leading=20, textColor=colors.HexColor("#321436"), spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name="ProofBody", parent=styles["BodyText"], fontSize=12, leading=17, textColor=colors.HexColor("#20242c"), spaceAfter=6))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setTitle("Synthetic Phase 3 case summary proof")
    canvas.setAuthor("Kent Housing Navigator")
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#4f5663"))
    canvas.drawString(20 * mm, 13 * mm, "Synthetic test data - KHN-2026-PROOF")
    canvas.drawRightString(190 * mm, 13 * mm, f"Page {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=18*mm, bottomMargin=22*mm, title="Synthetic Phase 3 case summary proof", author="Kent Housing Navigator")
story = [Paragraph("Case summary", styles["ProofTitle"]), Paragraph("Case reference: KHN-2026-PROOF", styles["ProofBody"]), Paragraph("Generated: 1 August 2026", styles["ProofBody"]), Paragraph("Synthetic data only. Sensitive categories and evidence files are excluded.", styles["ProofBody"]), Spacer(1, 5*mm), Paragraph("Overview", styles["ProofH2"])]
overview = [["Case title", "Synthetic accessibility proof"], ["Status", "Active"], ["Urgency", "Standard"], ["Council duty", "Not confirmed - verify with the council"]]
table = Table(overview, colWidths=[45*mm, 115*mm], repeatRows=0)
table.setStyle(TableStyle([("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTNAME",(1,0),(1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),11),("LEADING",(0,0),(-1,-1),15),("TEXTCOLOR",(0,0),(-1,-1),colors.HexColor("#20242c")),("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#777777")),("BACKGROUND",(0,0),(0,-1),colors.HexColor("#e4f3f1")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7)]))
story.extend([table, Paragraph("Important dates", styles["ProofH2"]), Paragraph("2 August 2026, 10:00 - Verify the suggested follow-up date. This is estimated, not a confirmed legal deadline.", styles["ProofBody"]), Paragraph("Recent chronology", styles["ProofH2"]), Paragraph("1 August 2026, 14:00 - User note", styles["ProofBody"]), Paragraph("The user recorded a synthetic contact event. No real person, address, council reference or evidence is included.", styles["ProofBody"]), PageBreak(), Paragraph("Export manifest", styles["ProofH2"]), Paragraph("Included", styles["Heading3"]), Paragraph("Case summary, selected timeline event, and selected deadline.", styles["ProofBody"]), Paragraph("Excluded", styles["Heading3"]), Paragraph("Evidence files, health, abuse history, immigration, criminal-justice information, children's information, previous names, full addresses and contact details.", styles["ProofBody"]), Paragraph("Review note", styles["ProofH2"]), Paragraph("The user must review this manifest before sharing. Export does not send email and does not create an external disclosure automatically.", styles["ProofBody"])])
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(target)
