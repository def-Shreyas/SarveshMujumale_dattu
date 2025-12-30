# services/safety_intelligence/pdf_generator.py

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm


def generate_case_study_pdf(cases: list, output_path: str, query: str):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    story = []

    # Title
    story.append(Paragraph("<b>DATTU – Safety Intelligence Case Studies</b>", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Query:</b> {query}", styles["BodyText"]))
    story.append(Spacer(1, 12))

    # Cases
    for idx, case in enumerate(cases, start=1):
        story.append(Paragraph(f"<b>{idx}. {case['title']}</b>", styles["Heading2"]))
        story.append(Spacer(1, 6))

        meta = (
            f"<b>Year:</b> {case['year']} | "
            f"<b>Country:</b> {case['country']} | "
            f"<b>Industry:</b> {case['industry']} | "
            f"<b>Severity:</b> {case['severity']}"
        )
        story.append(Paragraph(meta, styles["Italic"]))
        story.append(Spacer(1, 6))

        story.append(Paragraph(case["summary"], styles["BodyText"]))
        story.append(Spacer(1, 6))

        story.append(Paragraph("<b>Key Lessons:</b>", styles["BodyText"]))
        for lesson in case.get("lessons_learned", []):
            story.append(Paragraph(f"- {lesson}", styles["BodyText"]))

        story.append(Spacer(1, 6))
        story.append(
            Paragraph(
                f"<b>Source:</b> <a href='{case['source_url']}'>{case['source_url']}</a>",
                styles["BodyText"],
            )
        )
        story.append(Spacer(1, 18))

    doc.build(story)