from __future__ import annotations

import html
import re
from datetime import date, datetime
from io import BytesIO
from typing import Any

from app.errors import ApiError

LAB_DEFINITIONS = (
    ("fasting_glucose", "Fasting Glucose", "mg/dL", "70-99 normal | 100-125 impaired | >=126 diabetic range"),
    ("fasting_plasma_glucose", "Fasting Plasma Glucose", "mg/dL", "70-99 normal | 100-125 impaired | >=126 diabetic range"),
    ("hba1c", "HbA1c", "%", "<5.7 normal | 5.7-6.4 prediabetes | >=6.5 diabetic range"),
    ("2h_ogtt_75g", "2-Hour OGTT (75 g)", "mg/dL", "<140 normal | 140-199 impaired | >=200 diabetic range"),
    ("random_plasma_glucose", "Random Plasma Glucose", "mg/dL", ">=200 with symptoms suggests diabetes"),
    ("blood_glucose", "Blood Glucose", "mg/dL", "Clinical correlation required"),
)

METRIC_DEFINITIONS = (
    ("age", "Age", "years"),
    ("bmi", "BMI", "kg/m2"),
    ("weight_kg", "Weight", "kg"),
    ("height_cm", "Height", "cm"),
    ("waist_circumference", "Waist Circumference", "cm"),
)

SYMPTOM_LABELS = {
    "frequent_urination": "Frequent urination",
    "polyuria": "Polyuria",
    "excessive_thirst": "Excessive thirst",
    "polydipsia": "Polydipsia",
    "weight_loss": "Weight loss",
    "unexplained_weight_loss": "Unexplained weight loss",
    "fatigue": "Fatigue",
    "blurred_vision": "Blurred vision",
    "nausea": "Nausea",
    "vomiting": "Vomiting",
    "abdominal_pain": "Abdominal pain",
    "sweating": "Sweating",
    "shaking": "Shaking",
    "dizziness": "Dizziness",
    "slow_healing": "Slow-healing wounds",
    "tingling_hands_feet": "Tingling hands/feet",
    "frequent_infections": "Frequent infections",
    "acanthosis_nigricans": "Acanthosis nigricans",
}

RISK_FACTOR_LABELS = {
    "family_history": "Family history of diabetes",
    "family_history_diabetes": "Family history of diabetes",
    "physical_activity_low": "Low physical activity",
    "sedentary_lifestyle": "Sedentary lifestyle",
    "hypertension": "Hypertension",
    "obesity": "Obesity",
    "high_cholesterol": "High cholesterol",
    "smoking": "Smoking",
    "pcos_history": "PCOS history",
    "gestational_history": "Gestational diabetes history",
    "ethnicity_high_risk": "High-risk ethnicity",
    "type2_risk_increased": "Increased type 2 diabetes risk",
    "prediabetes_possible": "Prediabetes history/pattern",
}


REPORT_TITLE = "Diabetes Assessment Report"


def render_diagnosis_report_pdf(diagnosis_result, *, config: dict[str, Any]) -> tuple[bytes, str]:
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as exc:
        raise ApiError(
            status_code=503,
            code="pdf_generation_unavailable",
            message="PDF generation is unavailable. Install backend requirements and try again.",
        ) from exc

    patient = diagnosis_result.patient
    session = diagnosis_result.assessment_session
    clinician = diagnosis_result.reviewed_by_user or diagnosis_result.diagnosed_by_user
    facts = diagnosis_result.facts_json or {}

    created_at = diagnosis_result.created_at or datetime.utcnow()
    report_number = _build_report_number(diagnosis_result.id, created_at)
    patient_name = getattr(patient, "full_name", None) or "Patient"
    file_name = f"assessment-report-{diagnosis_result.id}-{_slugify(patient_name)}.pdf"

    clinic_name = str(config.get("REPORT_CLINIC_NAME") or "General Diabetes Clinic").strip()
    clinic_address = str(config.get("REPORT_CLINIC_ADDRESS") or "Clinical Services Unit").strip()
    clinic_phone = str(config.get("REPORT_CLINIC_PHONE") or "").strip()
    clinic_email = str(config.get("REPORT_CLINIC_EMAIL") or "").strip()

    styles = _build_styles(getSampleStyleSheet, ParagraphStyle, colors)
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=14 * mm,
        bottomMargin=20 * mm,
        title=REPORT_TITLE,
        author=clinic_name,
        subject=f"Clinical assessment report #{diagnosis_result.id}",
    )

    recommendations = _extract_recommendations(diagnosis_result)
    measurements = _extract_metric_rows(facts)
    lab_rows = _extract_lab_rows(facts)
    symptoms = _extract_flagged_labels(facts, SYMPTOM_LABELS)
    risk_factors = _extract_flagged_labels(facts, RISK_FACTOR_LABELS)
    impression_summary = _build_impression_summary(diagnosis_result, clinician)
    primary_recommendation = recommendations[0] if recommendations else (diagnosis_result.recommendation or "Clinical follow-up based on physician review.")

    story = []
    story.extend(
        _build_report_header(
            clinic_name=clinic_name,
            clinic_address=clinic_address,
            clinic_phone=clinic_phone,
            clinic_email=clinic_email,
            report_number=report_number,
            created_at=created_at,
            styles=styles,
            paragraph_cls=Paragraph,
            table_cls=Table,
            table_style_cls=TableStyle,
            hr_flowable=HRFlowable,
            colors=colors,
            mm=mm,
        )
    )

    patient_rows = [
        ["Patient Name", patient_name, "Age", _format_age(getattr(patient, "date_of_birth", None), facts)],
        ["Patient ID", getattr(patient, "id", None) or diagnosis_result.patient_id or "N/A", "Submitted", _format_datetime(getattr(session, "submitted_at", None) or created_at)],
        ["Sex", _format_gender(getattr(patient, "gender", None)), "Completed", _format_datetime(getattr(session, "completed_at", None) or created_at)],
        ["Date of Birth", _format_date(getattr(patient, "date_of_birth", None)), "Clinician", getattr(clinician, "name", None) or "System-assisted assessment"],
    ]
    story.extend(_section_heading("Patient Details", styles, Paragraph, HRFlowable, colors))
    story.append(_build_four_column_table(patient_rows, styles, colors, Paragraph, Table, TableStyle, [31 * mm, 52 * mm, 31 * mm, 58 * mm]))
    story.append(Spacer(1, 4 * mm))

    impression_rows = [
        ["Assessment Outcome", diagnosis_result.diagnosis],
        ["Status", _format_status_detail(diagnosis_result.is_urgent, diagnosis_result.urgent_reason)],
        [
            "Summary",
            f"{_safe_text(impression_summary)}<br/><br/><b>Primary recommendation:</b> {_safe_text(primary_recommendation)}",
        ],
        ["Confidence score", _safe_text(_format_confidence_summary(diagnosis_result.certainty))],
    ]
    story.extend(_section_heading("Clinical Impression", styles, Paragraph, HRFlowable, colors))
    story.append(_build_label_value_table(impression_rows, styles, colors, Paragraph, Table, TableStyle, [44 * mm, 128 * mm]))
    story.append(Spacer(1, 4 * mm))

    if measurements:
        story.extend(_section_heading("Assessment Measurements", styles, Paragraph, HRFlowable, colors))
        measurement_rows = [[label, f"{_format_numeric(value)} {unit}".strip()] for label, value, unit in measurements]
        story.append(_build_label_value_table(measurement_rows, styles, colors, Paragraph, Table, TableStyle, [44 * mm, 128 * mm]))
        story.append(Spacer(1, 4 * mm))

    story.extend(_section_heading("Laboratory Findings", styles, Paragraph, HRFlowable, colors))
    story.append(_build_lab_table(lab_rows, styles, colors, Paragraph, Table, TableStyle, mm))

    story.append(PageBreak())

    story.extend(_section_heading("Symptoms & Risk Profile", styles, Paragraph, HRFlowable, colors))
    story.append(
        _build_dual_list_table(
            left_title="Reported Symptoms",
            left_items=symptoms,
            right_title="Risk Factors",
            right_items=risk_factors,
            styles=styles,
            colors=colors,
            paragraph_cls=Paragraph,
            table_cls=Table,
            table_style_cls=TableStyle,
            mm=mm,
        )
    )
    story.append(Spacer(1, 4 * mm))

    story.extend(_section_heading("Clinical Recommendations", styles, Paragraph, HRFlowable, colors))
    story.append(_build_recommendations_table(recommendations, styles, colors, Paragraph, Table, TableStyle, mm))
    story.append(Spacer(1, 4 * mm))

    story.extend(_section_heading("Clinician Review", styles, Paragraph, HRFlowable, colors))
    story.append(
        _build_review_box(
            review_note=diagnosis_result.review_note or "No additional clinician review note has been recorded.",
            reviewed_at=diagnosis_result.reviewed_at,
            is_urgent=diagnosis_result.is_urgent,
            urgent_reason=diagnosis_result.urgent_reason,
            styles=styles,
            colors=colors,
            paragraph_cls=Paragraph,
            table_cls=Table,
            table_style_cls=TableStyle,
            mm=mm,
        )
    )
    story.append(Spacer(1, 4 * mm))

    story.extend(_section_heading("Authorization", styles, Paragraph, HRFlowable, colors, show_divider=True))
    story.append(
        _build_signature_section(
            heading=f"Patient: {patient_name}",
            details=[
                "Acknowledges the assessment result.",
                f"Assessment ID: {diagnosis_result.id or 'N/A'}",
            ],
            signature_label="Patient Signature",
            styles=styles,
            paragraph_cls=Paragraph,
            table_cls=Table,
            table_style_cls=TableStyle,
            mm=mm,
        )
    )
    story.append(Spacer(1, 4 * mm))

    story.extend(_section_heading("Disclaimer", styles, Paragraph, HRFlowable, colors, show_divider=True))
    disclaimer = (
        "This report is generated from the submitted assessment data and clinical rule set available in the system at the time of issue. "
        "It supports clinical workflow and does not replace direct physician judgement, confirmatory testing, or emergency evaluation when indicated."
    )
    story.append(Paragraph(_safe_text(disclaimer), styles["Disclaimer"]))
    story.append(Spacer(1, 4 * mm))

    story.extend(_section_heading("Reviewed / Attending Doctor", styles, Paragraph, HRFlowable, colors, show_divider=True))
    story.append(
        _build_signature_section(
            heading=f"Doctor: {getattr(clinician, 'name', None) or 'Pending clinician assignment'}",
            details=[
                f"Assessment mode: {_format_mode(getattr(session, 'mode', None))}",
                f"Review status: {_format_status_text(diagnosis_result.is_urgent)}",
            ],
            signature_label="Doctor Signature",
            styles=styles,
            paragraph_cls=Paragraph,
            table_cls=Table,
            table_style_cls=TableStyle,
            mm=mm,
        )
    )

    def draw_footer(canvas_obj, page_count: int):
        canvas_obj.saveState()
        page_width, _ = A4
        line_y = 14 * mm
        footer_y = 9 * mm
        canvas_obj.setStrokeColor(colors.black)
        canvas_obj.setLineWidth(0.6)
        canvas_obj.line(doc.leftMargin, line_y, page_width - doc.rightMargin, line_y)
        canvas_obj.setFillColor(colors.black)
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.drawString(doc.leftMargin, footer_y + 3, clinic_name.upper())
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawString(doc.leftMargin, footer_y - 6, clinic_address or "Clinical report details")
        canvas_obj.setFont("Helvetica", 7.5)
        canvas_obj.drawCentredString(page_width / 2, footer_y + 3, report_number)
        canvas_obj.drawRightString(page_width - doc.rightMargin, footer_y + 3, f"Page {canvas_obj._pageNumber} of {page_count}")
        canvas_obj.restoreState()

    class NumberedCanvas(canvas.Canvas):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            page_count = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                draw_footer(self, page_count)
                super().showPage()
            super().save()

    doc.build(story, canvasmaker=NumberedCanvas)
    return buffer.getvalue(), file_name


def _build_report_header(
    *,
    clinic_name: str,
    clinic_address: str,
    clinic_phone: str,
    clinic_email: str,
    report_number: str,
    created_at: datetime,
    styles,
    paragraph_cls,
    table_cls,
    table_style_cls,
    hr_flowable,
    colors,
    mm,
):
    contact_line = _join_clinic_meta(clinic_address, clinic_phone, clinic_email)
    left_html = (
        f"<b>{_safe_text(clinic_name.upper())}</b><br/>"
        f"<font size='16'><b>{_safe_text(REPORT_TITLE)}</b></font>"
    )
    if contact_line:
        left_html += f"<br/><font size='8'>{contact_line}</font>"

    right_html = (
        f"Report number: {_safe_text(report_number)}<br/>"
        f"Issued Date: {_safe_text(_format_issue_date(created_at))}"
    )

    header_table = table_cls(
        [[paragraph_cls(left_html, styles["HeaderLeft"]), paragraph_cls(right_html, styles["HeaderRight"])]],
        colWidths=[112 * mm, 60 * mm],
        hAlign="LEFT",
    )
    header_table.setStyle(
        table_style_cls(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    return [
        header_table,
        hr_flowable(width="100%", thickness=0.7, color=colors.black, spaceBefore=2 * mm, spaceAfter=5),
    ]


def _build_styles(get_sample_style_sheet, paragraph_style, colors):
    styles = get_sample_style_sheet()
    styles.add(
        paragraph_style(
            name="HeaderLeft",
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.black,
        )
    )
    styles.add(
        paragraph_style(
            name="HeaderRight",
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.black,
            alignment=2,
        )
    )
    styles.add(
        paragraph_style(
            name="SectionTitle",
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=colors.black,
            spaceAfter=2,
        )
    )
    styles.add(
        paragraph_style(
            name="TableLabel",
            fontName="Helvetica-Bold",
            fontSize=9.1,
            leading=11.5,
            textColor=colors.black,
        )
    )
    styles.add(
        paragraph_style(
            name="TableValue",
            fontName="Helvetica",
            fontSize=9.1,
            leading=11.5,
            textColor=colors.black,
        )
    )
    styles.add(
        paragraph_style(
            name="ReviewBox",
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.2,
            textColor=colors.black,
        )
    )
    styles.add(
        paragraph_style(
            name="RecommendationIndex",
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=19,
            textColor=colors.black,
            alignment=1,
        )
    )
    styles.add(
        paragraph_style(
            name="SignatureBlock",
            fontName="Helvetica",
            fontSize=9.1,
            leading=11.8,
            textColor=colors.black,
        )
    )
    styles.add(
        paragraph_style(
            name="SignatureMark",
            fontName="Helvetica-Oblique",
            fontSize=13,
            leading=15,
            textColor=colors.black,
            alignment=1,
        )
    )
    styles.add(
        paragraph_style(
            name="Disclaimer",
            fontName="Helvetica",
            fontSize=8.3,
            leading=10.4,
            textColor=colors.black,
        )
    )
    return styles


def _section_heading(title: str, styles, paragraph_cls, hr_flowable, colors, show_divider: bool = False):
    if show_divider:
        return [
            paragraph_cls(_safe_text(title), styles["SectionTitle"]),
            hr_flowable(width="100%", thickness=0.45, color=colors.HexColor("#666666"), spaceAfter=4),
        ]
    return [
        paragraph_cls(_safe_text(title), styles["SectionTitle"]),
        hr_flowable(width="100%", thickness=0, color=colors.white, spaceAfter=4),
    ]


def _build_four_column_table(rows, styles, colors, paragraph_cls, table_cls, table_style_cls, col_widths):
    table_rows = []
    for label_left, value_left, label_right, value_right in rows:
        table_rows.append(
            [
                paragraph_cls(_safe_text(label_left), styles["TableLabel"]),
                paragraph_cls(_safe_text(value_left), styles["TableValue"]),
                paragraph_cls(_safe_text(label_right), styles["TableLabel"]),
                paragraph_cls(_safe_text(value_right), styles["TableValue"]),
            ]
        )

    table = table_cls(table_rows, colWidths=col_widths)
    table.setStyle(
        table_style_cls(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ececec")),
                ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#ececec")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8f8f8f")),
                ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#a9a9a9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _build_label_value_table(rows, styles, colors, paragraph_cls, table_cls, table_style_cls, col_widths):
    table_rows = []
    for label, value in rows:
        table_rows.append([
            paragraph_cls(_safe_text(label), styles["TableLabel"]),
            paragraph_cls(str(value), styles["TableValue"]),
        ])

    table = table_cls(table_rows, colWidths=col_widths)
    table.setStyle(
        table_style_cls(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ececec")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8f8f8f")),
                ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#a9a9a9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _build_lab_table(rows, styles, colors, paragraph_cls, table_cls, table_style_cls, mm):
    table_rows = [[
        paragraph_cls("Test", styles["TableLabel"]),
        paragraph_cls("Result", styles["TableLabel"]),
        paragraph_cls("Unit", styles["TableLabel"]),
        paragraph_cls("Reference / Interpretation", styles["TableLabel"]),
    ]]

    if rows:
        for label, value, unit, reference in rows:
            table_rows.append([
                paragraph_cls(_safe_text(label), styles["TableValue"]),
                paragraph_cls(_safe_text(value), styles["TableValue"]),
                paragraph_cls(_safe_text(unit), styles["TableValue"]),
                paragraph_cls(_safe_text(reference), styles["TableValue"]),
            ])
    else:
        table_rows.append([
            paragraph_cls("No values submitted", styles["TableValue"]),
            paragraph_cls("-", styles["TableValue"]),
            paragraph_cls("-", styles["TableValue"]),
            paragraph_cls("Clinical interpretation should be based on symptoms, risk factors, and physician review.", styles["TableValue"]),
        ])

    table = table_cls(table_rows, colWidths=[46 * mm, 26 * mm, 18 * mm, 82 * mm], repeatRows=1)
    table.setStyle(
        table_style_cls(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ececec")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8f8f8f")),
                ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#a9a9a9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _build_dual_list_table(
    *,
    left_title: str,
    left_items: list[str],
    right_title: str,
    right_items: list[str],
    styles,
    colors,
    paragraph_cls,
    table_cls,
    table_style_cls,
    mm,
):
    table = table_cls(
        [
            [paragraph_cls(_safe_text(left_title), styles["TableLabel"]), paragraph_cls(_safe_text(right_title), styles["TableLabel"])],
            [
                paragraph_cls(_render_bullet_lines(left_items, fallback="No major symptom selections were recorded."), styles["TableValue"]),
                paragraph_cls(_render_bullet_lines(right_items, fallback="No major risk-factor selections were recorded."), styles["TableValue"]),
            ],
        ],
        colWidths=[86 * mm, 86 * mm],
    )
    table.setStyle(
        table_style_cls(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ececec")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8f8f8f")),
                ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#a9a9a9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _build_recommendations_table(recommendations, styles, colors, paragraph_cls, table_cls, table_style_cls, mm):
    items = recommendations or ["No structured recommendations were generated for this assessment."]
    rows = []
    for index, text in enumerate(items, start=1):
        rows.append([
            paragraph_cls(f"{index:02d}", styles["RecommendationIndex"]),
            paragraph_cls(_safe_text(text), styles["TableValue"]),
        ])

    table = table_cls(rows, colWidths=[14 * mm, 158 * mm])
    table.setStyle(
        table_style_cls(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f3f3")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8f8f8f")),
                ("INNERGRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#a9a9a9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _build_review_box(
    *,
    review_note: str,
    reviewed_at: datetime | None,
    is_urgent: bool,
    urgent_reason: str | None,
    styles,
    colors,
    paragraph_cls,
    table_cls,
    table_style_cls,
    mm,
):
    status_line = f"Status: {_format_status_text(is_urgent)} / Date: {_format_review_date(reviewed_at)}"
    if urgent_reason:
        status_line += f" / Note: {_safe_text(urgent_reason)}"

    table = table_cls(
        [[paragraph_cls(f"{_safe_text(review_note)}<br/><br/>{status_line}", styles["ReviewBox"])]],
        colWidths=[172 * mm],
    )
    table.setStyle(
        table_style_cls(
            [
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#8f8f8f")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _build_signature_section(heading, details, signature_label, styles, paragraph_cls, table_cls, table_style_cls, mm):
    left_lines = [f"<b>{_safe_text(heading)}</b>"] + [_safe_text(line) for line in details]
    left_html = "<br/>".join(left_lines)
    right_html = f"________________________<br/>{_safe_text(signature_label)}"

    table = table_cls(
        [[paragraph_cls(left_html, styles["SignatureBlock"]), paragraph_cls(right_html, styles["SignatureMark"])]],
        colWidths=[116 * mm, 56 * mm],
    )
    table.setStyle(
        table_style_cls(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (0, 0), 0),
                ("TOPPADDING", (1, 0), (1, 0), 10 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return table


def _extract_lab_rows(facts: dict[str, Any]) -> list[list[str]]:
    rows = []
    seen = set()
    for key, label, unit, reference in LAB_DEFINITIONS:
        if key not in facts:
            continue
        value = facts.get(key)
        if value in (None, ""):
            continue
        if key == "fasting_plasma_glucose" and "fasting_glucose" in seen:
            continue
        display_label = label
        if key == "fasting_plasma_glucose" and "fasting_glucose" not in facts:
            display_label = "Fasting Plasma Glucose"
        rows.append([display_label, _format_numeric(value), unit, reference])
        seen.add(key)
        if key == "fasting_glucose":
            seen.add("fasting_plasma_glucose")
    return rows


def _extract_metric_rows(facts: dict[str, Any]) -> list[list[str]]:
    rows = []
    for key, label, unit in METRIC_DEFINITIONS:
        value = facts.get(key)
        if value in (None, ""):
            continue
        rows.append([label, _format_numeric(value), unit])
    return rows


def _extract_flagged_labels(facts: dict[str, Any], label_map: dict[str, str]) -> list[str]:
    labels = []
    for key, label in label_map.items():
        if facts.get(key) is True:
            labels.append(label)
    return labels


def _extract_recommendations(diagnosis_result) -> list[str]:
    items = []
    seen = set()

    def add(text: str | None):
        normalized = str(text or "").strip()
        if not normalized:
            return
        key = normalized.lower()
        if key in seen:
            return
        seen.add(key)
        items.append(normalized)

    add(getattr(diagnosis_result, "recommendation", None))

    for rule in getattr(diagnosis_result, "triggered_rules_json", None) or []:
        for output in rule.get("inferred_outputs") or []:
            if output.get("type") == "recommendation":
                add(output.get("value"))

    return items


def _build_impression_summary(diagnosis_result, clinician) -> str:
    clinician_name = getattr(clinician, "name", None) or "pending doctor review"
    summary = (
        f"The submitted assessment data is most consistent with '{diagnosis_result.diagnosis}'. "
        f"The structured rule engine recorded a confidence of {_format_certainty(diagnosis_result.certainty)}. "
    )
    if diagnosis_result.is_urgent:
        summary += "Urgent follow-up is advised based on the assessment profile. "
    else:
        summary += "No urgent alert was stored for this result. "
    summary += f"Clinical oversight: {clinician_name}."
    return summary


def _build_report_number(result_id: int | None, created_at: datetime | None) -> str:
    date_part = (created_at or datetime.utcnow()).strftime("%Y%m%d")
    numeric_part = str(result_id or 0).zfill(5)
    return f"RPT-{date_part}-{numeric_part}"


def _join_clinic_meta(address: str, phone: str, email: str) -> str:
    lines = []
    if address:
        lines.append(_safe_text(address))

    contact_bits = []
    if phone:
        contact_bits.append(_safe_text(phone))
    if email:
        contact_bits.append(_safe_text(email))
    if contact_bits:
        lines.append(" | ".join(contact_bits))

    return "<br/>".join(lines)


def _format_certainty(certainty: Any) -> str:
    try:
        numeric = float(certainty)
    except (TypeError, ValueError):
        return "N/A"
    if numeric <= 1:
        numeric *= 100
    return f"{max(0.0, min(100.0, numeric)):.0f}%"


def _format_confidence_summary(certainty: Any) -> str:
    percent_text = _format_certainty(certainty)
    try:
        numeric = float(str(percent_text).rstrip("%"))
    except ValueError:
        return percent_text
    level = 5 if numeric >= 90 else 4 if numeric >= 75 else 3 if numeric >= 55 else 2 if numeric >= 35 else 1 if numeric > 0 else 0
    return f"{percent_text} ({level}/5)"


def _format_numeric(value: Any) -> str:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return str(value)
    if numeric.is_integer():
        return str(int(numeric))
    return f"{numeric:.1f}"


def _format_date(value: date | None) -> str:
    if not value:
        return "N/A"
    return value.strftime("%d/%m/%Y")


def _format_issue_date(value: datetime | None) -> str:
    if not value:
        return "N/A"
    return value.strftime("%d/%m/%Y")


def _format_review_date(value: datetime | None) -> str:
    if not value:
        return "Pending"
    return value.strftime("%d/%m/%Y")


def _format_datetime(value: datetime | None) -> str:
    if not value:
        return "N/A"
    return value.strftime("%d/%m/%Y at %I:%M %p")


def _format_age(date_of_birth: date | None, facts: dict[str, Any]) -> str:
    if date_of_birth:
        return str(_calculate_age(date_of_birth))
    if facts.get("age") not in (None, ""):
        return _format_numeric(facts.get("age"))
    return "N/A"


def _calculate_age(date_of_birth: date) -> int:
    today = date.today()
    return today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))


def _format_mode(mode: str | None) -> str:
    text = str(mode or "").strip().lower()
    if not text:
        return "Diagnostic"
    return " ".join(segment.capitalize() for segment in text.split("_"))


def _format_gender(gender: str | None) -> str:
    text = str(gender or "").strip().lower()
    if not text:
        return "N/A"
    return " ".join(segment.capitalize() for segment in text.split("_"))


def _format_status_text(is_urgent: bool) -> str:
    return "Urgent" if is_urgent else "Routine"


def _format_status_detail(is_urgent: bool, urgent_reason: str | None) -> str:
    status = _format_status_text(is_urgent)
    if urgent_reason:
        return f"{status} / {_safe_text(urgent_reason)}"
    return status


def _render_bullet_lines(items: list[str], *, fallback: str) -> str:
    if not items:
        return f"&bull; {_safe_text(fallback)}"
    return "<br/>".join(f"&bull; {_safe_text(item)}" for item in items)


def _safe_text(value: Any) -> str:
    return html.escape(str(value if value not in (None, "") else "N/A"))


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(value or "patient").strip().lower())
    slug = slug.strip("-")
    return slug or "patient"
