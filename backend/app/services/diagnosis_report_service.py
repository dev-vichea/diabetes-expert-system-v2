"""Modernized Clinical PDF Assessment Report Service.

Generates publication-quality clinical diagnostic reports with modern medical
typography, clinic logo integration, color-coded abnormal biomarker flags, and
full bilingual support (English & Khmer / ភាសាខ្មែរ).
"""

from __future__ import annotations

import html
import json
import logging
import re
from datetime import date, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from app.errors import ApiError

logger = logging.getLogger(__name__)

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.platypus import (
        HRFlowable,
        Image,
        KeepTogether,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
FONTS_DIR = STATIC_DIR / "fonts"
KHMER_FONT_NOTO = FONTS_DIR / "NotoSansKhmer.ttf"
KHMER_FONT_KANTUMRUY = FONTS_DIR / "KantumruyPro.ttf"
KHMER_FONT_BATTAMBANG = FONTS_DIR / "Battambang-Regular.ttf"
KHMER_FONT_DEFAULT = FONTS_DIR / "KhmerFont.ttf"
KHMER_FONT_PATH = KHMER_FONT_NOTO if KHMER_FONT_NOTO.is_file() else KHMER_FONT_DEFAULT
LOGO_PATH_OPT = STATIC_DIR / "images" / "logo_pdf.png"
LOGO_PATH_ORIG = STATIC_DIR / "images" / "logo.png"
EXACT_KM_PATH = Path(__file__).resolve().parents[1] / "locales" / "exact-en-km.json"


def _ensure_khmer_font() -> bool:
    """Register Khmer TrueType font if available."""
    if not REPORTLAB_AVAILABLE:
        return False
    try:
        if "KhmerFont" not in pdfmetrics.getRegisteredFontNames():
            if KHMER_FONT_PATH.is_file():
                pdfmetrics.registerFont(TTFont("KhmerFont", str(KHMER_FONT_PATH)))
            elif Path("/System/Library/Fonts/Supplemental/Khmer Sangam MN.ttf").is_file():
                pdfmetrics.registerFont(TTFont("KhmerFont", "/System/Library/Fonts/Supplemental/Khmer Sangam MN.ttf"))
        return "KhmerFont" in pdfmetrics.getRegisteredFontNames()
    except Exception:
        return False


def _load_km_translations() -> dict[str, str]:
    if EXACT_KM_PATH.is_file():
        try:
            with EXACT_KM_PATH.open(encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


# Clinical Biomarkers Definitions
LAB_DEFINITIONS_EN = (
    ("fasting_glucose", "Fasting Blood Glucose", "mg/dL", "70 - 99 normal | 100 - 125 impaired | ≥126 diabetic range"),
    ("fasting_plasma_glucose", "Fasting Plasma Glucose", "mg/dL", "70 - 99 normal | 100 - 125 impaired | ≥126 diabetic range"),
    ("hba1c", "Hemoglobin A1c (HbA1c)", "%", "< 5.7 normal | 5.7 - 6.4 prediabetes | ≥6.5 diabetic range"),
    ("2h_ogtt_75g", "2-Hour OGTT (75g)", "mg/dL", "< 140 normal | 140 - 199 impaired | ≥200 diabetic range"),
    ("random_plasma_glucose", "Random Blood Glucose", "mg/dL", "≥200 with symptoms confirms diabetic range"),
    ("blood_glucose", "Capillary Blood Glucose", "mg/dL", "Clinical correlation required"),
)

LAB_DEFINITIONS_KM = (
    ("fasting_glucose", "ជាតិស្ករពេលអត់អាហារ (Fasting Glucose)", "mg/dL", "70 - 99 ធម្មតា | 100 - 125 ខ្សោយ | ≥126 ទឹកនោមផ្អែម"),
    ("fasting_plasma_glucose", "ប្លាស្មាជាតិស្ករពេលអត់អាហារ (FPG)", "mg/dL", "70 - 99 ធម្មតា | 100 - 125 ខ្សោយ | ≥126 ទឹកនោមផ្អែម"),
    ("hba1c", "អេម៉ូក្លូប៊ីន A1c (HbA1c)", "%", "< 5.7 ធម្មតា | 5.7 - 6.4 មុនទឹកនោមផ្អែម | ≥6.5 ទឹកនោមផ្អែម"),
    ("2h_ogtt_75g", "តេស្ត 2-Hour OGTT (75g)", "mg/dL", "< 140 ធម្មតា | 140 - 199 ធ្លាក់ចុះ | ≥200 ទឹកនោមផ្អែម"),
    ("random_plasma_glucose", "ជាតិស្ករចៃដន្យ (Random Glucose)", "mg/dL", "≥200 រួមជាមួយរោគសញ្ញា បញ្ជាក់ពីជំងឺទឹកនោមផ្អែម"),
    ("blood_glucose", "ជាតិស្ករក្នុងឈាម (Blood Glucose)", "mg/dL", "ទាមទារការពិនិត្យបន្ថែមពីគ្រូពេទ្យ"),
)

SYMPTOM_LABELS_EN = {
    "frequent_urination": "Frequent urination (Polyuria)",
    "polyuria": "Polyuria",
    "excessive_thirst": "Excessive thirst (Polydipsia)",
    "polydipsia": "Polydipsia",
    "weight_loss": "Unexplained weight loss",
    "unexplained_weight_loss": "Unexplained weight loss",
    "fatigue": "Generalized fatigue / lethargy",
    "blurred_vision": "Blurred vision",
    "nausea": "Nausea",
    "vomiting": "Vomiting",
    "abdominal_pain": "Abdominal pain",
    "sweating": "Diaphoresis (sweating)",
    "shaking": "Tremors / shaking",
    "dizziness": "Dizziness / lightheadedness",
    "slow_healing": "Slow-healing wounds / ulcers",
    "tingling_hands_feet": "Paresthesia (tingling in hands/feet)",
    "frequent_infections": "Recurrent cutaneous / urinary infections",
    "acanthosis_nigricans": "Acanthosis nigricans",
}

SYMPTOM_LABELS_KM = {
    "frequent_urination": "នោមញឹកញាប់ (Polyuria)",
    "polyuria": "នោមច្រើន/នោមញឹកញាប់",
    "excessive_thirst": "ស្រេកទឹកខ្លាំង (Polydipsia)",
    "polydipsia": "ស្រេកទឹកខ្លាំងខុសធម្មតា",
    "weight_loss": "ស្រកទម្ងន់មិនដឹងមូលហេតុ",
    "unexplained_weight_loss": "ស្រកទម្ងន់មិនដឹងមូលហេតុ",
    "fatigue": "អស់កម្លាំង ល្ហិតល្ហៃ",
    "blurred_vision": "ស្រវាំងភ្នែក មើលមិនច្បាស់",
    "nausea": "ចង្អោរ",
    "vomiting": "ក្អួត",
    "abdominal_pain": "ឈឺពោះ",
    "sweating": "បែកញើសច្រើន",
    "shaking": "ញ័រដៃជើង",
    "dizziness": "វិលមុខ",
    "slow_healing": "របួសជាសះស្បើយយឺត",
    "tingling_hands_feet": "ស្ពឹក ឬស្រពន់ចុងដៃចុងជើង",
    "frequent_infections": "ឆ្លងរោគញឹកញាប់ (ស្បែក/ផ្លូវនោម)",
    "acanthosis_nigricans": "ស្បែកឡើងខ្មៅក្រាស់នៅកញ្ចឹងក/ក្លៀក",
}

RISK_FACTOR_LABELS_EN = {
    "family_history": "Family history of Type 2 Diabetes",
    "family_history_diabetes": "Family history of diabetes",
    "physical_activity_low": "Low physical activity / sedentary lifestyle",
    "sedentary_lifestyle": "Sedentary lifestyle",
    "hypertension": "Essential hypertension",
    "obesity": "Clinical obesity (BMI ≥ 30 kg/m²)",
    "high_cholesterol": "Dyslipidemia / hypercholesterolemia",
    "smoking": "Tobacco smoking history",
    "pcos_history": "Polycystic Ovary Syndrome (PCOS)",
    "gestational_history": "Gestational diabetes history (GDM)",
    "ethnicity_high_risk": "High-risk ethnic demographic",
}

RISK_FACTOR_LABELS_KM = {
    "family_history": "មានប្រវត្តិគ្រួសារកើតជំងឺទឹកនោមផ្អែម",
    "family_history_diabetes": "មានប្រវត្តិគ្រួសារកើតជំងឺទឹកនោមផ្អែម",
    "physical_activity_low": "ខ្វះការធ្វើលំហាត់ប្រាណ / អង្គុយច្រើន",
    "sedentary_lifestyle": "របៀបរស់នៅអង្គុយច្រើន",
    "hypertension": "ជំងឺលើសសម្ពាធឈាម",
    "obesity": "ភាពធាត់ (BMI ≥ 30 kg/m²)",
    "high_cholesterol": "លើសជាតិខ្លាញ់ក្នុងឈាម",
    "smoking": "ប្រវត្តិជក់បារី",
    "pcos_history": "ប្រវត្តិកើតដុំគីសអូវែ (PCOS)",
    "gestational_history": "ធ្លាប់កើតទឹកនោមផ្អែមពេលមានផ្ទៃពោះ (GDM)",
    "ethnicity_high_risk": "ប្រជាសាស្ត្រជនជាតិហានិភ័យខ្ពស់",
}

METRIC_DEFINITIONS_EN = (
    ("age", "Patient Age", "years"),
    ("bmi", "Body Mass Index (BMI)", "kg/m²"),
    ("weight_kg", "Body Weight", "kg"),
    ("height_cm", "Standing Height", "cm"),
    ("waist_circumference", "Waist Circumference", "cm"),
)

METRIC_DEFINITIONS_KM = (
    ("age", "អាយុអ្នកជំងឺ", "ឆ្នាំ"),
    ("bmi", "សន្ទស្សន៍ម៉ាសរាងកាយ (BMI)", "kg/m²"),
    ("weight_kg", "ទម្ងន់", "kg"),
    ("height_cm", "កម្ពស់", "cm"),
    ("waist_circumference", "ទំហំចង្កេះ", "cm"),
)


def render_diagnosis_report_pdf(diagnosis_result, *, lang: str = "en", config: dict[str, Any] | None = None) -> tuple[bytes, str]:
    """Render a publication-quality clinical PDF report. Uses WeasyPrint HTML template when available, with ReportLab fallback."""
    if WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE:
        try:
            return render_html_report_weasyprint(diagnosis_result, lang=lang, config=config)
        except Exception as e:
            logger.warning("WeasyPrint HTML PDF generation failed (%s); falling back to ReportLab.", e)

    if not REPORTLAB_AVAILABLE:
        raise ApiError(
            status_code=503,
            code="pdf_generation_unavailable",
            message="PDF generation is unavailable. Install backend requirements and try again.",
        )

    config = config or {}
    is_km = str(lang).lower().strip() == "km"
    has_khmer_font = _ensure_khmer_font()
    font_name = "KhmerFont" if (is_km and has_khmer_font) else "Helvetica"
    font_bold = "KhmerFont" if (is_km and has_khmer_font) else "Helvetica-Bold"

    km_dict = _load_km_translations() if is_km else {}

    # Color Palette - Professional Medical Navy & Clean Slate Accents
    C_NAVY_DARK = colors.HexColor("#0F294A")
    C_NAVY = colors.HexColor("#1E3A8A")
    C_BLUE = colors.HexColor("#2563EB")
    C_SLATE_DARK = colors.HexColor("#1E293B")
    C_SLATE_MID = colors.HexColor("#475569")
    C_SLATE_LIGHT = colors.HexColor("#F8FAFC")
    C_SLATE_BORDER = colors.HexColor("#CBD5E1")
    C_ALERT_RED = colors.HexColor("#DC2626")
    C_EMERALD = colors.HexColor("#16A34A")

    patient = getattr(diagnosis_result, "patient", None) or (diagnosis_result.get("patient") if isinstance(diagnosis_result, dict) else None)
    session = getattr(diagnosis_result, "assessment_session", None) or (diagnosis_result.get("assessment_session") if isinstance(diagnosis_result, dict) else None)
    clinician = (
        getattr(diagnosis_result, "reviewed_by_user", None)
        or getattr(diagnosis_result, "diagnosed_by_user", None)
        or (diagnosis_result.get("reviewed_by_user") or diagnosis_result.get("clinician") if isinstance(diagnosis_result, dict) else None)
    )
    facts = getattr(diagnosis_result, "facts_json", None)
    if facts is None and isinstance(diagnosis_result, dict):
        facts = diagnosis_result.get("facts_json") or diagnosis_result.get("clinical_inputs") or diagnosis_result.get("facts")
    facts = facts or {}

    created_at = getattr(diagnosis_result, "created_at", None) or (diagnosis_result.get("created_at") if isinstance(diagnosis_result, dict) else None) or datetime.utcnow()
    res_id = getattr(diagnosis_result, "id", None) or (diagnosis_result.get("id") or diagnosis_result.get("assessment_id") if isinstance(diagnosis_result, dict) else None) or 1
    report_number = _build_report_number(res_id, created_at)
    patient_name = (
        getattr(patient, "full_name", None)
        or (patient.get("full_name") if isinstance(patient, dict) else None)
        or ("អ្នកជំងឺ" if is_km else "Confidential Patient")
    )
    file_name = f"clinical-report-{res_id}-{lang}-{_slugify(patient_name)}.pdf"

    # Clinic info
    clinic_name = (
        "មជ្ឈមណ្ឌលឯកទេសជំងឺទឹកនោមផ្អែម និងសុខភាពមេតាបូលីស"
        if is_km
        else str(config.get("REPORT_CLINIC_NAME") or "Endocrinology & Diabetes Clinical Center").strip()
    )
    clinic_address = (
        "ដេប៉ាតឺម៉ង់វេជ្ជសាស្ត្រផ្ទៃក្នុង និងជំងឺទឹកនោមផ្អែម"
        if is_km
        else str(config.get("REPORT_CLINIC_ADDRESS") or "Department of Endocrinology & Metabolic Health").strip()
    )
    clinic_phone = str(config.get("REPORT_CLINIC_PHONE") or "+1 (800) 555-GLUC").strip()
    clinic_email = str(config.get("REPORT_CLINIC_EMAIL") or "clinical-decision-support@diabetes-care.org").strip()

    report_title = "របាយការណ៍វិនិច្ឆ័យ និងវាយតម្លៃជំងឺទឹកនោមផ្អែម" if is_km else "Diabetes Clinical Assessment Report"

    styles = _build_styles(getSampleStyleSheet, ParagraphStyle, colors, C_NAVY_DARK, C_SLATE_DARK, C_SLATE_MID, font_name, font_bold)
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=16 * mm,
        title=report_title,
        author=clinic_name,
        subject=f"Clinical Assessment Report #{res_id}",
    )

    recommendations = _extract_recommendations(diagnosis_result, is_km=is_km, km_dict=km_dict)
    measurements = _extract_metric_rows(facts, is_km=is_km)
    lab_rows = _extract_lab_rows(facts, is_km=is_km)
    symptoms = _extract_flagged_labels(facts, SYMPTOM_LABELS_KM if is_km else SYMPTOM_LABELS_EN)
    risk_factors = _extract_flagged_labels(facts, RISK_FACTOR_LABELS_KM if is_km else RISK_FACTOR_LABELS_EN)

    # Translate Diagnosis Outcome
    raw_diagnosis = str(
        getattr(diagnosis_result, "diagnosis", None)
        or (diagnosis_result.get("diagnosis") if isinstance(diagnosis_result, dict) else None)
        or "Clinical Assessment"
    ).strip()
    display_diagnosis = km_dict.get(raw_diagnosis, raw_diagnosis) if is_km else raw_diagnosis

    impression_summary = _build_impression_summary(diagnosis_result, clinician, is_km=is_km, display_diagnosis=display_diagnosis)
    default_rec = getattr(diagnosis_result, "recommendation", None) or (diagnosis_result.get("recommendation") if isinstance(diagnosis_result, dict) else None) or "Clinical glycemic follow-up based on physician review."
    primary_recommendation = recommendations[0] if recommendations else (
        "សូមពិគ្រោះជាមួយគ្រូពេទ្យជំនាញដើម្បីរៀបចំផែនការតាមដានជាតិស្ករ។"
        if is_km
        else default_rec
    )

    story = []

    # -------------------------------------------------------------
    # 1. CLINIC HEADER WITH LOGO
    # -------------------------------------------------------------
    logo_path = str(LOGO_PATH_OPT if LOGO_PATH_OPT.is_file() else LOGO_PATH_ORIG)
    story.extend(
        _build_modern_header_with_logo(
            clinic_name=clinic_name,
            clinic_address=clinic_address,
            clinic_phone=clinic_phone,
            clinic_email=clinic_email,
            report_title=report_title,
            report_number=report_number,
            created_at=created_at,
            logo_path=logo_path,
            is_km=is_km,
            styles=styles,
            colors=colors,
            c_navy=C_NAVY_DARK,
            c_blue=C_BLUE,
            c_slate_border=C_SLATE_BORDER,
            c_slate_bg=C_SLATE_LIGHT,
            mm=mm,
        )
    )
    story.append(Spacer(1, 3.5 * mm))

    # -------------------------------------------------------------
    # 2. PATIENT DEMOGRAPHICS & ENCOUNTER DETAILS
    # -------------------------------------------------------------
    lbl_patient = "ឈ្មោះអ្នកជំងឺ" if is_km else "Patient Name"
    lbl_id = "លេខសម្គាល់" if is_km else "Patient ID"
    lbl_sex = "ភេទ" if is_km else "Biological Sex"
    lbl_age = "អាយុ / ថ្ងៃខែឆ្នាំកំណើត" if is_km else "Age / DOB"
    lbl_sub = "កាលបរិច្ឆេទបញ្ជូន" if is_km else "Submitted Date"
    lbl_doc = "គ្រូពេទ្យពិនិត្យ" if is_km else "Attending Clinician"
    lbl_dxid = "លេខកូដវិនិច្ឆ័យ" if is_km else "Assessment ID"
    lbl_status = "ស្ថានភាព" if is_km else "Encounter Status"

    patient_rows = [
        [lbl_patient, patient_name, lbl_id, str(getattr(patient, "id", None) or (patient.get("id") if isinstance(patient, dict) else None) or getattr(diagnosis_result, "patient_id", None) or (diagnosis_result.get("patient_id") if isinstance(diagnosis_result, dict) else None) or "N/A")],
        [lbl_sex, _format_gender(getattr(patient, "gender", None) or (patient.get("gender") if isinstance(patient, dict) else None), is_km=is_km), lbl_age, _format_age(getattr(patient, "date_of_birth", None) or (patient.get("date_of_birth") if isinstance(patient, dict) else None), facts, is_km=is_km)],
        [lbl_sub, _format_datetime(getattr(session, "submitted_at", None) or (session.get("submitted_at") if isinstance(session, dict) else None) or created_at), lbl_doc, getattr(clinician, "name", None) or (clinician.get("name") if isinstance(clinician, dict) else None) or ("ប្រព័ន្ធជំនាញគាំទ្រការសម្រេចចិត្ត" if is_km else "Clinical Decision Support")],
        [lbl_dxid, f"#{res_id}", lbl_status, "បានបញ្ចប់ការវាយតម្លៃ" if is_km else "Clinical Complete"],
    ]
    sec_patient_title = "ព័ត៌មានអ្នកជំងឺ និងការពិនិត្យ" if is_km else "Patient & Encounter Demographics"
    story.extend(_section_heading(sec_patient_title, styles, C_NAVY_DARK, C_BLUE, colors))
    story.append(_build_styled_four_column_table(patient_rows, styles, colors, C_SLATE_LIGHT, C_SLATE_BORDER, [32 * mm, 59 * mm, 32 * mm, 59 * mm]))
    story.append(Spacer(1, 4 * mm))

    # -------------------------------------------------------------
    # 3. CLINICAL IMPRESSION & CERTAINTY SCORE CARD
    # -------------------------------------------------------------
    certainty = getattr(diagnosis_result, "certainty", None)
    if certainty is None and isinstance(diagnosis_result, dict):
        certainty = diagnosis_result.get("certainty") or diagnosis_result.get("confidence") or 0.0
    certainty = float(certainty or 0.0)
    certainty_pct = round(certainty * 100 if certainty <= 1.0 else certainty, 1)

    is_urgent = bool(getattr(diagnosis_result, "is_urgent", False) or (diagnosis_result.get("is_urgent", False) if isinstance(diagnosis_result, dict) else False))
    urgent_reason = getattr(diagnosis_result, "urgent_reason", None) or (diagnosis_result.get("urgent_reason") if isinstance(diagnosis_result, dict) else None) or ""

    status_text = (
        ("ត្រូវការពិនិត្យបន្ទាន់" if is_urgent else "ការថែទាំគ្លីនិកស្តង់ដារ")
        if is_km
        else ("URGENT CLINICAL REVIEW" if is_urgent else "ROUTINE CLINICAL CARE")
    )
    status_color = C_ALERT_RED if is_urgent else C_EMERALD

    urgent_desc = ""
    if is_urgent:
        urgent_desc = km_dict.get(urgent_reason, urgent_reason) if is_km else urgent_reason

    certainty_desc = "ការផ្គូផ្គងក្បួនវិនិច្ឆ័យស្វ័យប្រវត្តិ" if is_km else "Deterministic rule inference match"

    lbl_outcome = "លទ្ធផលវិនិច្ឆ័យ" if is_km else "Diagnostic Outcome"
    lbl_clin_status = "ស្ថានភាពគ្លីនិក" if is_km else "Clinical Status"
    lbl_cf = "កម្រិតទំនុកចិត្ត (Certainty)" if is_km else "Certainty Factor (CF)"
    lbl_summary = "សេចក្តីសង្ខេបគ្លីនិក" if is_km else "Clinical Summary"
    lbl_rec = "ការណែនាំចម្បង:" if is_km else "Primary Recommendation:"

    impression_rows = [
        [lbl_outcome, f"<b><font size='11' color='{C_NAVY_DARK.hexval()}'>{_safe_text(display_diagnosis)}</font></b>"],
        [lbl_clin_status, f"<font color='{status_color.hexval()}'><b>{status_text}</b></font>{' · ' + _safe_text(urgent_desc) if urgent_desc else ''}"],
        [lbl_cf, f"<b>{certainty_pct}% Confidence</b> &nbsp;·&nbsp; <font color='{C_SLATE_MID.hexval()}'>{certainty_desc}</font>"],
        [lbl_summary, f"{_safe_text(impression_summary)}<br/><br/><b>{lbl_rec}</b> {_safe_text(primary_recommendation)}"],
    ]
    sec_impression_title = "លទ្ធផលវិនិច្ឆ័យ និងការវាយតម្លៃគ្លីនិក" if is_km else "Clinical Impression & Diagnostic Outcome"
    story.extend(_section_heading(sec_impression_title, styles, C_NAVY_DARK, C_BLUE, colors))
    story.append(_build_styled_label_value_table(impression_rows, styles, colors, C_SLATE_LIGHT, C_SLATE_BORDER, [44 * mm, 138 * mm]))
    story.append(Spacer(1, 4 * mm))

    # -------------------------------------------------------------
    # 4. LABORATORY FINDINGS & QUANTITATIVE BIOMARKERS
    # -------------------------------------------------------------
    sec_lab_title = "លទ្ធផលតេស្តមន្ទីរពិសោធន៍ និងជីវសញ្ញាសម្គាល់" if is_km else "Laboratory Findings & Metabolic Biomarkers"
    story.extend(_section_heading(sec_lab_title, styles, C_NAVY_DARK, C_BLUE, colors))
    story.append(_build_modern_lab_table(lab_rows, styles, colors, C_NAVY, C_SLATE_LIGHT, C_SLATE_BORDER, mm, is_km=is_km))
    story.append(Spacer(1, 3.5 * mm))

    if measurements:
        measurement_rows = [[label, f"{_format_numeric(value)} {unit}".strip()] for label, value, unit in measurements]
        story.append(_build_styled_label_value_table(measurement_rows, styles, colors, C_SLATE_LIGHT, C_SLATE_BORDER, [44 * mm, 138 * mm]))
        story.append(Spacer(1, 4 * mm))

    # -------------------------------------------------------------
    # 5. SYMPTOMS & RISK PROFILE (DUAL LIST)
    # -------------------------------------------------------------
    left_title = "រោគសញ្ញាដែលបានកត់ត្រា" if is_km else "Reported Symptoms"
    right_title = "កត្តាហានិភ័យមេតាបូលីស" if is_km else "Metabolic Risk Factors"
    sec_symptom_title = "រោគសញ្ញា និងទម្រង់ហានិភ័យ" if is_km else "Symptoms & Risk Profile"

    story.append(KeepTogether([
        *_section_heading(sec_symptom_title, styles, C_NAVY_DARK, C_BLUE, colors),
        _build_dual_list_table(
            left_title=left_title,
            left_items=symptoms,
            right_title=right_title,
            right_items=risk_factors,
            styles=styles,
            colors=colors,
            bg_color=C_SLATE_LIGHT,
            border_color=C_SLATE_BORDER,
            mm=mm,
            is_km=is_km,
        ),
        Spacer(1, 4 * mm),
    ]))

    # -------------------------------------------------------------
    # 6. CLINICAL RECOMMENDATIONS
    # -------------------------------------------------------------
    sec_rec_title = "ការណែនាំគ្លីនិក និងការថែទាំសុខភាព" if is_km else "Clinical Recommendations & Care Protocol"
    story.append(KeepTogether([
        *_section_heading(sec_rec_title, styles, C_NAVY_DARK, C_BLUE, colors),
        _build_recommendations_table(recommendations, styles, colors, C_SLATE_LIGHT, C_SLATE_BORDER, mm, is_km=is_km),
        Spacer(1, 4 * mm),
    ]))

    # -------------------------------------------------------------
    # 7. CLINICIAN REVIEW & OFFICIAL AUTHORIZATION
    # -------------------------------------------------------------
    raw_review = getattr(diagnosis_result, "review_note", None) or (diagnosis_result.get("review_note") if isinstance(diagnosis_result, dict) else None) or (
        "ការវាយតម្លៃត្រូវបានត្រួតពិនិត្យស្របតាមក្បួនវេជ្ជសាស្ត្រ និងគោលការណ៍ណែនាំគ្លីនិក។"
        if is_km
        else "Clinical decision support assessment generated and reviewed against clinical knowledge base."
    )
    reviewed_at = getattr(diagnosis_result, "reviewed_at", None) or (diagnosis_result.get("reviewed_at") if isinstance(diagnosis_result, dict) else None)
    status_label = _format_status_text(is_urgent, is_km=is_km)
    date_label = _format_review_date(reviewed_at, is_km=is_km)
    review_status_line = f"ស្ថានភាព: {status_label} | កាលបរិច្ឆេទ: {date_label}" if is_km else f"Status: {status_label} | Date: {date_label}"

    sec_auth_title = "ការពិនិត្យ និងការបញ្ជាក់ពីគ្រូពេទ្យ" if is_km else "Clinician Review & Authorization"
    lbl_review_box = "កំណត់ចំណាំរបស់គ្រូពេទ្យពិនិត្យ" if is_km else "CLINICIAN REVIEW NOTE"
    lbl_auth_box = "ការអនុម័ត និងហត្ថលេខាគ្រូពេទ្យ" if is_km else "PHYSICIAN AUTHORIZATION & STAMP"
    lbl_verified_stamp = "កំណត់ត្រាគ្លីនិកត្រូវបានផ្ទៀងផ្ទាត់ (VALIDATED CDS RECORD)" if is_km else "VALIDATED CLINICAL CDS RECORD"
    lbl_doc_title = "គ្រូពេទ្យឯកទេស:" if is_km else "Clinician:"
    lbl_sig = "ហត្ថលេខា:" if is_km else "Signature:"

    verification_table = Table(
        [
            [
                Paragraph(f"<b>{lbl_review_box}</b>", styles["TableLabel"]),
                Paragraph(f"<b>{lbl_auth_box}</b>", styles["TableLabel"]),
            ],
            [
                Paragraph(f"{_safe_text(raw_review)}<br/><br/><font size='8' color='{C_SLATE_MID.hexval()}'>{review_status_line}</font>", styles["TableValue"]),
                Paragraph(
                    f"<b>{lbl_doc_title}</b> {getattr(clinician, 'name', None) or (clinician.get('name') if isinstance(clinician, dict) else None) or ('វេជ្ជបណ្ឌិតឯកទេស' if is_km else 'Attending Endocrinologist')}<br/>"
                    f"<b>Report ID:</b> #{res_id}<br/>"
                    f"<b>Security Seal:</b> <u>{lbl_verified_stamp}</u><br/>"
                    f"<font size='8' color='{C_SLATE_MID.hexval()}'>Electronically authenticated under clinical protocols.</font><br/><br/>"
                    f"<b>{lbl_sig}</b> <i>{getattr(clinician, 'name', None) or (clinician.get('name') if isinstance(clinician, dict) else None) or 'Dr. Verified Signature'}</i>",
                    styles["TableValue"],
                ),
            ],
        ],
        colWidths=[100 * mm, 82 * mm],
    )
    verification_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), C_SLATE_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.7, C_SLATE_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, C_SLATE_BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    story.append(KeepTogether([
        *_section_heading(sec_auth_title, styles, C_NAVY_DARK, C_BLUE, colors),
        verification_table,
        Spacer(1, 3 * mm),
    ]))

    # Legal Disclaimer
    disclaimer = (
        "<b>ការបដិសេធផ្នែកវេជ្ជសាស្ត្រ៖</b> របាយការណ៍នេះបង្កើតឡើងដោយប្រព័ន្ធជំនាញគាំទ្រការសម្រេចចិត្តជំងឺទឹកនោមផ្អែម ដើម្បីជួយសម្រួលដល់ការវិភាគរបស់គ្រូពេទ្យផ្អែកលើស្តង់ដារ ADA/WHO។ វាមិនជំនួសការវិនិច្ឆ័យផ្ទាល់របស់គ្រូពេទ្យជំនាញ ឬការសង្គ្រោះបន្ទាន់ឡើយ។"
        if is_km
        else "<b>CLINICAL DISCLAIMER:</b> This report is generated by the Diabetes Expert Decision Support System to assist clinical workflows based on ADA/WHO guidelines. It does not substitute for independent professional clinical judgement, emergency care, or confirmatory laboratory diagnostics."
    )
    story.append(Paragraph(disclaimer, styles["Disclaimer"]))

    # Footer Page Numbering Canvas
    def draw_footer(canvas_obj, page_count: int):
        canvas_obj.saveState()
        page_width, _ = A4
        line_y = 12 * mm
        footer_y = 7 * mm
        canvas_obj.setStrokeColor(C_SLATE_BORDER)
        canvas_obj.setLineWidth(0.6)
        canvas_obj.line(doc.leftMargin, line_y, page_width - doc.rightMargin, line_y)

        canvas_obj.setFillColor(C_SLATE_MID)
        canvas_obj.setFont(font_bold, 7.5)
        canvas_obj.drawString(doc.leftMargin, footer_y + 3, clinic_name.upper())

        canvas_obj.setFont(font_name, 7)
        footer_sub = "ឯកសារវេជ្ជសាស្ត្រសម្ងាត់" if is_km else "Confidential Clinical Document"
        canvas_obj.drawString(doc.leftMargin, footer_y - 4, f"{footer_sub} · {clinic_address}")

        canvas_obj.setFont(font_name, 7.5)
        canvas_obj.drawCentredString(page_width / 2, footer_y + 3, f"Ref: {report_number}")

        canvas_obj.setFont(font_bold, 7.5)
        page_str = f"ទំព័រ {canvas_obj._pageNumber} នៃ {page_count}" if is_km else f"Page {canvas_obj._pageNumber} of {page_count}"
        canvas_obj.drawRightString(page_width - doc.rightMargin, footer_y + 3, page_str)
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


# -----------------------------------------------------------------------------
# HELPER BUILDERS & RENDERERS
# -----------------------------------------------------------------------------


def _build_modern_header_with_logo(
    *,
    clinic_name: str,
    clinic_address: str,
    clinic_phone: str,
    clinic_email: str,
    report_title: str,
    report_number: str,
    created_at: datetime,
    logo_path: str,
    is_km: bool,
    styles,
    colors,
    c_navy,
    c_blue,
    c_slate_border,
    c_slate_bg,
    mm,
):
    contact_parts = [clinic_address]
    if clinic_phone:
        contact_parts.append(f"Tel: {clinic_phone}")
    if clinic_email:
        contact_parts.append(clinic_email)
    contact_line = " · ".join(contact_parts)

    top_badge = "ប្រព័ន្ធជំនាញ និងគាំទ្រការសម្រេចចិត្តគ្លីនិក" if is_km else "DIABETES CLINICAL DECISION SUPPORT & EXPERT SYSTEM"
    left_flowables = [
        Paragraph(f"<b>{top_badge}</b>", styles["HeaderTopBadge"]),
        Spacer(1, 1 * mm),
        Paragraph(f"<b>{_safe_text(report_title)}</b>", styles["HeaderTitle"]),
        Spacer(1, 1 * mm),
        Paragraph(f"<b>{_safe_text(clinic_name)}</b> · {contact_line}", styles["HeaderClinic"]),
    ]

    lbl_rep = "លេខរបាយការណ៍:" if is_km else "Report No:"
    lbl_date = "កាលបរិច្ឆេទ:" if is_km else "Date Issued:"
    lbl_enc = "ការពិនិត្យ:" if is_km else "Encounter:"
    lbl_enc_val = "ការវាយតម្លៃទូទៅ" if is_km else "Comprehensive Screening"

    right_html = (
        f"<b>{lbl_rep}</b> {_safe_text(report_number)}<br/>"
        f"<b>{lbl_date}</b> {_safe_text(_format_issue_date(created_at, is_km=is_km))}<br/>"
        f"<b>{lbl_enc}</b> {lbl_enc_val}"
    )

    # Logo element
    col_widths = [124 * mm, 58 * mm]
    header_cells = [left_flowables, Paragraph(right_html, styles["HeaderRight"])]

    if Path(logo_path).is_file():
        try:
            logo_img = Image(logo_path, width=18 * mm, height=18 * mm)
            col_widths = [22 * mm, 102 * mm, 58 * mm]
            header_cells = [logo_img, left_flowables, Paragraph(right_html, styles["HeaderRight"])]
        except Exception:
            pass

    header_table = Table(
        [header_cells],
        colWidths=col_widths,
        hAlign="LEFT",
    )
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )

    return [
        header_table,
        Table(
            [[""]],
            colWidths=[182 * mm],
            rowHeights=[2],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), c_navy),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]),
        ),
    ]


def _build_styles(get_sample_style_sheet, paragraph_style, colors, c_navy, c_slate_dark, c_slate_mid, font_name, font_bold):
    styles = get_sample_style_sheet()
    is_km_font = font_name == "KhmerFont"
    styles.add(
        paragraph_style(
            name="HeaderTopBadge",
            fontName=font_bold,
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#2563EB"),
        )
    )
    styles.add(
        paragraph_style(
            name="HeaderTitle",
            fontName=font_bold,
            fontSize=11.5 if is_km_font else 13,
            leading=16 if is_km_font else 15,
            textColor=c_navy,
        )
    )
    styles.add(
        paragraph_style(
            name="HeaderClinic",
            fontName=font_name,
            fontSize=7.5,
            leading=10.5,
            textColor=colors.HexColor("#64748B"),
        )
    )
    styles.add(
        paragraph_style(
            name="HeaderLeft",
            fontName=font_name,
            fontSize=9,
            leading=14 if is_km_font else 13,
            textColor=c_slate_dark,
        )
    )
    styles.add(
        paragraph_style(
            name="HeaderRight",
            fontName=font_name,
            fontSize=8,
            leading=13 if is_km_font else 12,
            textColor=c_slate_dark,
            alignment=2,
        )
    )
    styles.add(
        paragraph_style(
            name="SectionTitle",
            fontName=font_bold,
            fontSize=10.5,
            leading=14 if is_km_font else 13,
            textColor=c_navy,
            spaceAfter=2,
        )
    )
    styles.add(
        paragraph_style(
            name="TableLabel",
            fontName=font_bold,
            fontSize=8.5,
            leading=13 if is_km_font else 11,
            textColor=c_slate_dark,
        )
    )
    styles.add(
        paragraph_style(
            name="TableValue",
            fontName=font_name,
            fontSize=8.5,
            leading=13.5 if is_km_font else 11.5,
            textColor=c_slate_dark,
        )
    )
    styles.add(
        paragraph_style(
            name="RecommendationIndex",
            fontName=font_bold,
            fontSize=12,
            leading=14,
            textColor=c_navy,
            alignment=1,
        )
    )
    styles.add(
        paragraph_style(
            name="Disclaimer",
            fontName=font_name,
            fontSize=7.5,
            leading=9.8,
            textColor=colors.HexColor("#64748B"),
        )
    )
    return styles


def _section_heading(title: str, styles, c_navy, c_blue, colors):
    return [
        Paragraph(f"<b>{_safe_text(title.upper())}</b>", styles["SectionTitle"]),
        Table(
            [[""]],
            colWidths=[182 * (72 / 25.4)],
            rowHeights=[1.2],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), c_blue),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMMARGIN", (0, 0), (-1, -1), 2),
            ]),
        ),
        Spacer(1, 1.5 * (72 / 25.4)),
    ]


def _build_styled_four_column_table(rows, styles, colors, bg_color, border_color, col_widths):
    table_rows = []
    for label_left, value_left, label_right, value_right in rows:
        table_rows.append([
            Paragraph(f"<b>{_safe_text(label_left)}</b>", styles["TableLabel"]),
            Paragraph(_safe_text(value_left), styles["TableValue"]),
            Paragraph(f"<b>{_safe_text(label_right)}</b>", styles["TableLabel"]),
            Paragraph(_safe_text(value_right), styles["TableValue"]),
        ])

    table = Table(table_rows, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), bg_color),
                ("BACKGROUND", (2, 0), (2, -1), bg_color),
                ("BOX", (0, 0), (-1, -1), 0.6, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ]
        )
    )
    return table


def _build_styled_label_value_table(rows, styles, colors, bg_color, border_color, col_widths):
    table_rows = []
    for label, value in rows:
        table_rows.append([
            Paragraph(f"<b>{_safe_text(label)}</b>", styles["TableLabel"]),
            Paragraph(str(value), styles["TableValue"]),
        ])

    table = Table(table_rows, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), bg_color),
                ("BOX", (0, 0), (-1, -1), 0.6, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def _classify_lab_flag(label: str, value_str: str, is_km: bool = False) -> tuple[str, str, str]:
    """Classify numerical lab value into status badge with Khmer support."""
    try:
        val = float(value_str)
    except (ValueError, TypeError):
        return ("កត់ត្រា" if is_km else "RECORDED", "#334155", "#F1F5F9")

    lbl = label.lower()
    if "fasting" in lbl or "ជាតិស្ករ" in lbl or "blood glucose" in lbl:
        if val >= 126:
            return ("កម្រិតទឹកនោមផ្អែម (DIABETIC)" if is_km else "DIABETIC RANGE", "#991B1B", "#FEF2F2")
        if val >= 100:
            return ("ខ្សោយ / មុនទឹកនោមផ្អែម" if is_km else "ELEVATED / IMPAIRED", "#92400E", "#FEF3C7")
        if val < 70:
            return ("ជាតិស្ករទាប (HYPO)" if is_km else "HYPOGLYCEMIA", "#DC2626", "#FEE2E2")
        return ("ធម្មតា (NORMAL)" if is_km else "NORMAL", "#166534", "#DCFCE7")

    if "hba1c" in lbl:
        if val >= 6.5:
            return ("កម្រិតទឹកនោមផ្អែម (DIABETIC)" if is_km else "DIABETIC RANGE", "#991B1B", "#FEF2F2")
        if val >= 5.7:
            return ("មុនទឹកនោមផ្អែម (PREDIABETES)" if is_km else "PREDIABETES", "#92400E", "#FEF3C7")
        return ("ធម្មតា (NORMAL)" if is_km else "NORMAL", "#166534", "#DCFCE7")

    if "ogtt" in lbl:
        if val >= 200:
            return ("កម្រិតទឹកនោមផ្អែម (DIABETIC)" if is_km else "DIABETIC RANGE", "#991B1B", "#FEF2F2")
        if val >= 140:
            return ("ការអត់ទ្រាំថយចុះ (IMPAIRED)" if is_km else "IMPAIRED TOLERANCE", "#92400E", "#FEF3C7")
        return ("ធម្មតា (NORMAL)" if is_km else "NORMAL", "#166534", "#DCFCE7")

    if "random" in lbl or "ចៃដន្យ" in lbl:
        if val >= 200:
            return ("កម្រិតទឹកនោមផ្អែម (DIABETIC)" if is_km else "DIABETIC RANGE", "#991B1B", "#FEF2F2")
        if val >= 140:
            return ("ឡើងខ្ពស់ (ELEVATED)" if is_km else "ELEVATED", "#92400E", "#FEF3C7")
        return ("ធម្មតា (NORMAL)" if is_km else "NORMAL", "#166534", "#DCFCE7")

    return ("កត់ត្រា" if is_km else "RECORDED", "#334155", "#F1F5F9")


def _build_modern_lab_table(rows, styles, colors, c_navy, bg_color, border_color, mm, is_km: bool = False):
    h_test = "ជីវសញ្ញាសម្គាល់ / តេស្ត" if is_km else "BIOMARKER / TEST"
    h_res = "លទ្ធផល" if is_km else "RESULT"
    h_unit = "ខ្នាត" if is_km else "UNIT"
    h_status = "ស្ថានភាព" if is_km else "STATUS FLAG"
    h_ref = "កម្រិតយោងគ្លីនិក" if is_km else "REFERENCE / CLINICAL CRITERIA"

    table_rows = [[
        Paragraph(f"<b>{h_test}</b>", styles["TableLabel"]),
        Paragraph(f"<b>{h_res}</b>", styles["TableLabel"]),
        Paragraph(f"<b>{h_unit}</b>", styles["TableLabel"]),
        Paragraph(f"<b>{h_status}</b>", styles["TableLabel"]),
        Paragraph(f"<b>{h_ref}</b>", styles["TableLabel"]),
    ]]

    if rows:
        for label, value, unit, reference in rows:
            status, text_color, _ = _classify_lab_flag(label, str(value), is_km=is_km)
            badge_html = f"<font color='{text_color}'><b>{status}</b></font>"
            table_rows.append([
                Paragraph(_safe_text(label), styles["TableValue"]),
                Paragraph(f"<b>{_safe_text(value)}</b>", styles["TableValue"]),
                Paragraph(_safe_text(unit), styles["TableValue"]),
                Paragraph(badge_html, styles["TableValue"]),
                Paragraph(f"<font color='#475569'>{_safe_text(reference)}</font>", styles["TableValue"]),
            ])
    else:
        no_val = "មិនមានទិន្នន័យតេស្តមន្ទីរពិសោធន៍ទេ" if is_km else "No quantitative biomarkers recorded"
        interp_fallback = "ការវាយតម្លៃពឹងផ្អែកលើរោគសញ្ញា និងកត្តាហានិភ័យរបស់អ្នកជំងឺ" if is_km else "Clinical evaluation relies on reported symptomatology and risk profiles."
        table_rows.append([
            Paragraph(no_val, styles["TableValue"]),
            Paragraph("-", styles["TableValue"]),
            Paragraph("-", styles["TableValue"]),
            Paragraph("N/A", styles["TableValue"]),
            Paragraph(interp_fallback, styles["TableValue"]),
        ])

    table = Table(table_rows, colWidths=[48 * mm, 22 * mm, 14 * mm, 38 * mm, 60 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), bg_color),
                ("BOX", (0, 0), (-1, -1), 0.6, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
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
    bg_color,
    border_color,
    mm,
    is_km: bool = False,
):
    fallback_sym = "មិនមានរោគសញ្ញាសំខាន់ត្រូវបានកត់ត្រាទុកឡើយ។" if is_km else "No major symptom selections were recorded."
    fallback_risk = "មិនមានកត្តាហានិភ័យសំខាន់ត្រូវបានកត់ត្រាទុកឡើយ។" if is_km else "No major risk-factor selections were recorded."

    table = Table(
        [
            [Paragraph(f"<b>{_safe_text(left_title)}</b>", styles["TableLabel"]), Paragraph(f"<b>{_safe_text(right_title)}</b>", styles["TableLabel"])],
            [
                Paragraph(_render_bullet_lines(left_items, fallback=fallback_sym), styles["TableValue"]),
                Paragraph(_render_bullet_lines(right_items, fallback=fallback_risk), styles["TableValue"]),
            ],
        ],
        colWidths=[91 * mm, 91 * mm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), bg_color),
                ("BOX", (0, 0), (-1, -1), 0.6, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def _build_recommendations_table(recommendations, styles, colors, bg_color, border_color, mm, is_km: bool = False):
    items = recommendations or (
        ["សូមពិគ្រោះជាមួយគ្រូពេទ្យជំនាញដើម្បីរៀបចំផែនការតាមដានជាតិស្ករ។"]
        if is_km
        else ["No structured recommendations were generated for this assessment."]
    )
    rows = []
    for index, text in enumerate(items, start=1):
        rows.append([
            Paragraph(f"<b>{index:02d}</b>", styles["RecommendationIndex"]),
            Paragraph(_safe_text(text), styles["TableValue"]),
        ])

    table = Table(rows, colWidths=[12 * mm, 170 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), bg_color),
                ("BOX", (0, 0), (-1, -1), 0.6, border_color),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, border_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _build_report_number(diagnosis_result_id: int | None, created_at: Any) -> str:
    if isinstance(created_at, datetime):
        date_part = created_at.strftime("%Y%m%d")
    elif isinstance(created_at, str) and len(created_at) >= 10:
        date_part = re.sub(r"\D", "", created_at[:10])
    else:
        date_part = datetime.utcnow().strftime("%Y%m%d")
    clean_id = diagnosis_result_id or 0
    return f"DX-{date_part}-{clean_id:04d}"


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", value or "").strip().lower()
    return re.sub(r"[-\s]+", "-", cleaned) or "report"


def _safe_text(val: Any) -> str:
    if val is None:
        return ""
    text = str(val)
    return html.escape(text).replace("\n", "<br/>")


def _format_datetime(val: Any) -> str:
    if not val:
        return "N/A"
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d %H:%M")
    return str(val)[:16]


def _format_issue_date(val: Any, is_km: bool = False) -> str:
    if isinstance(val, datetime):
        if is_km:
            return val.strftime("%d-%m-%Y")
        return val.strftime("%B %d, %Y")
    return str(val) if val else "N/A"


def _format_review_date(val: Any, is_km: bool = False) -> str:
    if not val:
        return "រង់ចាំការពិនិត្យ" if is_km else "Pending Review"
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d %H:%M")
    return str(val)[:16]


def _format_gender(val: Any, is_km: bool = False) -> str:
    if not val:
        return "មិនបានបញ្ជាក់" if is_km else "Unspecified"
    text = str(val).strip().lower()
    if text == "male":
        return "ប្រុស (Male)" if is_km else "Male"
    if text == "female":
        return "ស្រី (Female)" if is_km else "Female"
    return str(val).capitalize()


def _format_age(dob: Any, facts: dict, is_km: bool = False) -> str:
    unit = "ឆ្នាំ" if is_km else "yrs"
    if "age" in facts and facts["age"] not in (None, ""):
        return f"{facts['age']} {unit}"
    if isinstance(dob, (date, datetime)):
        today = date.today()
        years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return f"{years} {unit}"
    return "N/A"


def _format_numeric(val: Any) -> str:
    if val is None or val == "":
        return "N/A"
    try:
        f = float(val)
        return f"{f:.1f}".rstrip("0").rstrip(".")
    except (ValueError, TypeError):
        return str(val)


def _format_status_text(is_urgent: bool, is_km: bool = False) -> str:
    if is_km:
        return "ត្រូវការពិនិត្យបន្ទាន់" if is_urgent else "ការតាមដានធម្មតា"
    return "Urgent Review Required" if is_urgent else "Standard Monitoring"


def _extract_recommendations(result: Any, is_km: bool = False, km_dict: dict | None = None) -> list[str]:
    raw = getattr(result, "recommendation", None)
    if raw is None and isinstance(result, dict):
        raw = result.get("recommendation") or result.get("recommendations") or (result.get("diagnosis", {}).get("recommendations") if isinstance(result.get("diagnosis"), dict) else None)
    km_dict = km_dict or {}

    out = []
    if isinstance(raw, list):
        for r in raw:
            if isinstance(r, dict):
                txt = r.get("text_km") if (is_km and r.get("text_km")) else r.get("text")
            else:
                txt = str(r)
            if txt:
                txt_str = str(txt).strip()
                if is_km:
                    txt_str = km_dict.get(txt_str, txt_str)
                out.append(txt_str)
    elif isinstance(raw, str) and raw.strip():
        for line in raw.split("\n"):
            cleaned = line.strip("- •").strip()
            if cleaned:
                if is_km:
                    cleaned = km_dict.get(cleaned, cleaned)
                out.append(cleaned)
    return out


def _extract_metric_rows(facts: dict, is_km: bool = False) -> list[tuple[str, Any, str]]:
    defs = METRIC_DEFINITIONS_KM if is_km else METRIC_DEFINITIONS_EN
    rows = []
    for key, label, unit in defs:
        val = facts.get(key)
        if val not in (None, ""):
            rows.append((label, val, unit))
    return rows


def _extract_lab_rows(facts: dict, is_km: bool = False) -> list[tuple[str, Any, str, str]]:
    defs = LAB_DEFINITIONS_KM if is_km else LAB_DEFINITIONS_EN
    rows = []
    for key, label, unit, reference in defs:
        val = facts.get(key)
        if val not in (None, ""):
            rows.append((label, val, unit, reference))
    return rows


def _extract_flagged_labels(facts: dict, label_map: dict[str, str]) -> list[str]:
    flagged = []
    for key, label in label_map.items():
        val = facts.get(key)
        if val is True or str(val).lower() in ("true", "1", "yes", "present"):
            if label not in flagged:
                flagged.append(label)
    return flagged


def _render_bullet_lines(items: list[str], fallback: str) -> str:
    if not items:
        return f"<font color='#64748B'>{_safe_text(fallback)}</font>"
    return "<br/>".join([f"• {_safe_text(item)}" for item in items])


def _build_impression_summary(result: Any, clinician: Any, is_km: bool = False, display_diagnosis: str = "") -> str:
    clinician_name = (
        getattr(clinician, "name", None)
        or (clinician.get("name") if isinstance(clinician, dict) else None)
        or ("ប្រព័ន្ធជំនាញ" if is_km else "Decision Support System")
    )
    if is_km:
        return f"ការវាយតម្លៃសម្រាប់ {display_diagnosis} ត្រូវបានបញ្ចប់។ លទ្ធផលត្រូវបានបង្កើតឡើងតាមក្បួនវេជ្ជសាស្ត្រ និងពិនិត្យដោយ {clinician_name}។"
    return f"Evaluation for {display_diagnosis} completed. Results generated under validated clinical rules and reviewed by {clinician_name}."


# ─────────────────────────────────────────────────────────────────────────────
# WEASYPRINT RENDERER — Correct Khmer text shaping via Pango / HarfBuzz
# ─────────────────────────────────────────────────────────────────────────────

try:
    from jinja2 import Template as Jinja2Template
    JINJA2_AVAILABLE = True
except ImportError:
    JINJA2_AVAILABLE = False

try:
    import weasyprint as _weasyprint
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    WEASYPRINT_AVAILABLE = False

KHMER_TEMPLATE_PATH = Path(__file__).resolve().parents[1] / "templates" / "report_khmer.html"
ENGLISH_TEMPLATE_PATH = Path(__file__).resolve().parents[1] / "templates" / "report_english.html"


def _get_attr_or_key(obj, attr, default=None):
    """Safely get attribute from ORM model or dict."""
    val = getattr(obj, attr, None)
    if val is None and isinstance(obj, dict):
        val = obj.get(attr, default)
    return val if val is not None else default


def render_html_report_weasyprint(
    diagnosis_result,
    *,
    lang: str = "en",
    config: dict[str, Any] | None = None,
) -> tuple[bytes, str]:
    """Render clinical PDF using HTML template + WeasyPrint for pixel-perfect A4 printing."""
    if not WEASYPRINT_AVAILABLE:
        raise ApiError(
            status_code=503,
            code="weasyprint_unavailable",
            message="WeasyPrint is not available. Install it with: pip install weasyprint",
        )
    if not JINJA2_AVAILABLE:
        raise ApiError(
            status_code=503,
            code="jinja2_unavailable",
            message="Jinja2 is required for PDF generation.",
        )

    config = config or {}
    is_km = str(lang).lower().strip() == "km"
    km_dict = _load_km_translations() if is_km else {}

    # Extract data from diagnosis_result (ORM model or dict)
    patient = _get_attr_or_key(diagnosis_result, "patient")
    clinician = (
        _get_attr_or_key(diagnosis_result, "reviewed_by_user")
        or _get_attr_or_key(diagnosis_result, "diagnosed_by_user")
        or _get_attr_or_key(diagnosis_result, "clinician")
    )
    session = _get_attr_or_key(diagnosis_result, "assessment_session")

    facts = _get_attr_or_key(diagnosis_result, "facts_json")
    if facts is None:
        facts = _get_attr_or_key(diagnosis_result, "clinical_inputs") or _get_attr_or_key(diagnosis_result, "facts") or {}

    created_at = _get_attr_or_key(diagnosis_result, "created_at") or datetime.utcnow()
    res_id = _get_attr_or_key(diagnosis_result, "id") or _get_attr_or_key(diagnosis_result, "assessment_id") or 1

    patient_name = _get_attr_or_key(patient, "full_name") or ("អ្នកជំងឺ" if is_km else "Patient")
    patient_id = str(_get_attr_or_key(patient, "id") or _get_attr_or_key(diagnosis_result, "patient_id") or "N/A")
    patient_gender = _format_gender(_get_attr_or_key(patient, "gender"), is_km=is_km)
    patient_age = _format_age(_get_attr_or_key(patient, "date_of_birth"), facts, is_km=is_km)

    submitted_date = _format_datetime(_get_attr_or_key(session, "submitted_at") or created_at)
    clinician_name = (
        _get_attr_or_key(clinician, "name")
        or ("ប្រព័ន្ធជំនាញគាំទ្រការសម្រេចចិត្ត" if is_km else "Clinical Decision Support System")
    )

    report_number = _build_report_number(res_id, created_at)
    issue_date = _format_issue_date(created_at, is_km=is_km)

    raw_diagnosis = str(
        _get_attr_or_key(diagnosis_result, "diagnosis") or ("ការវាយតម្លៃគ្លីនិក" if is_km else "Clinical Evaluation")
    ).strip()
    display_diagnosis = km_dict.get(raw_diagnosis, raw_diagnosis) if is_km else raw_diagnosis

    certainty = float(_get_attr_or_key(diagnosis_result, "certainty") or _get_attr_or_key(diagnosis_result, "confidence") or 0.0)
    certainty_pct = round(certainty * 100 if certainty <= 1.0 else certainty, 1)

    is_urgent = bool(_get_attr_or_key(diagnosis_result, "is_urgent") or False)
    urgent_reason = _get_attr_or_key(diagnosis_result, "urgent_reason") or ""
    if is_urgent and urgent_reason and is_km:
        urgent_reason = km_dict.get(urgent_reason, urgent_reason)

    impression_summary = _build_impression_summary(
        diagnosis_result, clinician, is_km=is_km, display_diagnosis=display_diagnosis
    )

    recommendations = _extract_recommendations(diagnosis_result, is_km=is_km, km_dict=km_dict)
    default_rec = (
        _get_attr_or_key(diagnosis_result, "recommendation")
        or ("សូមពិគ្រោះជាមួយគ្រូពេទ្យជំនាញដើម្បីរៀបចំផែនការតាមដានជាតិស្ករ។" if is_km
            else "Consult a physician for personalized glycemic management and clinical guidance.")
    )
    primary_recommendation = recommendations[0] if recommendations else default_rec

    raw_lab_rows = _extract_lab_rows(facts, is_km=is_km)
    lab_rows = []
    for label, value, unit, reference in raw_lab_rows:
        flag_text, flag_color, _ = _classify_lab_flag(label, str(value), is_km=is_km)
        flag_class = "flag-high" if "991B1B" in flag_color or "DC2626" in flag_color else (
            "flag-normal" if "166534" in flag_color else ""
        )
        lab_rows.append({
            "label": label,
            "value": _format_numeric(value),
            "unit": unit,
            "reference": reference,
            "flag": flag_text,
            "flag_class": flag_class,
        })

    raw_metrics = _extract_metric_rows(facts, is_km=is_km)
    metric_rows = [{"label": label, "value": _format_numeric(val), "unit": unit} for label, val, unit in raw_metrics]

    symptoms = _extract_flagged_labels(facts, SYMPTOM_LABELS_KM if is_km else SYMPTOM_LABELS_EN)
    risk_factors = _extract_flagged_labels(facts, RISK_FACTOR_LABELS_KM if is_km else RISK_FACTOR_LABELS_EN)

    review_note = (
        _get_attr_or_key(diagnosis_result, "review_note")
        or ("ការវាយតម្លៃត្រូវបានត្រួតពិនិត្យស្របតាមក្បួនវេជ្ជសាស្ត្រ និងគោលការណ៍ណែនាំគ្លីនិក។" if is_km
            else "Assessment validated against clinical evidence rules and practice guidelines.")
    )
    reviewed_at = _get_attr_or_key(diagnosis_result, "reviewed_at")
    status_label = _format_status_text(is_urgent, is_km=is_km)
    review_date = _format_review_date(reviewed_at, is_km=is_km)

    clinic_default_name = "មជ្ឈមណ្ឌលឯកទេសជំងឺទឹកនោមផ្អែម និងសុខភាពមេតាបូលីស" if is_km else "Endocrinology & Diabetes Center of Clinical Excellence"
    clinic_default_address = "ដេប៉ាតឺម៉ង់វេជ្ជសាស្ត្រផ្ទៃក្នុង និងជំងឺទឹកនោមផ្អែម" if is_km else "Department of Endocrinology & Metabolic Health"
    clinic_name = str(config.get("REPORT_CLINIC_NAME") or clinic_default_name).strip()
    clinic_address = str(config.get("REPORT_CLINIC_ADDRESS") or clinic_default_address).strip()
    clinic_phone = str(config.get("REPORT_CLINIC_PHONE") or "+1 (800) 555-GLUC").strip()

    logo_path_str = ""
    if LOGO_PATH_OPT.is_file():
        logo_path_str = LOGO_PATH_OPT.as_uri()
    elif LOGO_PATH_ORIG.is_file():
        logo_path_str = LOGO_PATH_ORIG.as_uri()

    if is_km:
        font_choice = str(config.get("REPORT_KHMER_FONT") or "noto").strip().lower()
        selected_font_path = KHMER_FONT_NOTO
        if "kantumruy" in font_choice and KHMER_FONT_KANTUMRUY.is_file():
            selected_font_path = KHMER_FONT_KANTUMRUY
        elif "battambang" in font_choice and KHMER_FONT_BATTAMBANG.is_file():
            selected_font_path = KHMER_FONT_BATTAMBANG
        elif "sangam" in font_choice and KHMER_FONT_DEFAULT.is_file():
            selected_font_path = KHMER_FONT_DEFAULT
        elif not selected_font_path.is_file():
            selected_font_path = KHMER_FONT_PATH
        font_path_str = selected_font_path.as_uri() if selected_font_path.is_file() else ""
        template_path = KHMER_TEMPLATE_PATH
    else:
        font_path_str = ""
        template_path = ENGLISH_TEMPLATE_PATH

    template_str = template_path.read_text(encoding="utf-8")
    template = Jinja2Template(template_str)
    rendered_html = template.render(
        font_path=font_path_str,
        logo_path=logo_path_str,
        clinic_name=clinic_name,
        clinic_address=clinic_address,
        clinic_phone=clinic_phone,
        report_number=report_number,
        issue_date=issue_date,
        patient_name=patient_name,
        patient_id=patient_id,
        patient_gender=patient_gender,
        patient_age=patient_age,
        submitted_date=submitted_date,
        clinician_name=clinician_name,
        assessment_id=res_id,
        display_diagnosis=display_diagnosis,
        is_urgent=is_urgent,
        urgent_reason=urgent_reason,
        certainty_pct=certainty_pct,
        impression_summary=impression_summary,
        primary_recommendation=primary_recommendation,
        lab_rows=lab_rows,
        metric_rows=metric_rows,
        symptoms=symptoms,
        risk_factors=risk_factors,
        recommendations=recommendations,
        review_note=review_note,
        status_label=status_label,
        review_date=review_date,
        clinician_name_auth=_get_attr_or_key(clinician, "name") or ("វេជ្ជបណ្ឌិតឯកទេស" if is_km else "Attending Endocrinologist"),
        year=datetime.utcnow().year,
    )

    pdf_bytes = _weasyprint.HTML(string=rendered_html).write_pdf()
    lang_tag = "km" if is_km else "en"
    file_name = f"clinical-report-{res_id}-{lang_tag}-{_slugify(patient_name)}.pdf"
    return pdf_bytes, file_name


def render_khmer_report_weasyprint(diagnosis_result, *, config: dict[str, Any] | None = None) -> tuple[bytes, str]:
    return render_html_report_weasyprint(diagnosis_result, lang="km", config=config)


def render_english_report_weasyprint(diagnosis_result, *, config: dict[str, Any] | None = None) -> tuple[bytes, str]:
    return render_html_report_weasyprint(diagnosis_result, lang="en", config=config)

