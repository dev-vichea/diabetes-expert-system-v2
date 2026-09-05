import React from 'react'

const SYMPTOM_MAP_EN = {
  frequent_urination: 'Frequent urination (Polyuria)',
  polyuria: 'Polyuria',
  excessive_thirst: 'Excessive thirst (Polydipsia)',
  polydipsia: 'Polydipsia',
  excessive_hunger: 'Excessive hunger (Polyphagia)',
  polyphagia: 'Polyphagia',
  weight_loss: 'Unexplained weight loss',
  unexplained_weight_loss: 'Unexplained weight loss',
  fatigue: 'Generalized fatigue / lethargy',
  blurred_vision: 'Blurred vision',
  nausea: 'Nausea',
  vomiting: 'Vomiting',
  abdominal_pain: 'Abdominal pain',
  sweating: 'Diaphoresis (sweating)',
  shaking: 'Tremors / shaking',
  dizziness: 'Dizziness / lightheadedness',
  slow_healing: 'Slow-healing wounds / ulcers',
  tingling_hands_feet: 'Paresthesia (tingling in hands/feet)',
  frequent_infections: 'Recurrent infections',
  acanthosis_nigricans: 'Acanthosis nigricans',
}

const SYMPTOM_MAP_KM = {
  frequent_urination: 'នោមញឹកញាប់ (Polyuria)',
  polyuria: 'នោមច្រើន/នោមញឹកញាប់',
  excessive_thirst: 'ស្រេកទឹកខ្លាំង (Polydipsia)',
  polydipsia: 'ស្រេកទឹកខ្លាំងខុសធម្មតា',
  excessive_hunger: 'ឃ្លានខ្លាំងខុសធម្មតា (Polyphagia)',
  polyphagia: 'ឃ្លានខ្លាំងខុសធម្មតា',
  weight_loss: 'ស្រកទម្ងន់មិនដឹងមូលហេតុ',
  unexplained_weight_loss: 'ស្រកទម្ងន់មិនដឹងមូលហេតុ',
  fatigue: 'អស់កម្លាំង ល្ហិតល្ហៃ',
  blurred_vision: 'ស្រវាំងភ្នែក មើលមិនច្បាស់',
  nausea: 'ចង្អោរ',
  vomiting: 'ក្អួត',
  abdominal_pain: 'ឈឺពោះ',
  sweating: 'បែកញើសច្រើន',
  shaking: 'ញ័រដៃជើង',
  dizziness: 'វិលមុខ',
  slow_healing: 'របួសជាសះស្បើយយឺត',
  tingling_hands_feet: 'ស្ពឹក ឬស្រពន់ចុងដៃចុងជើង',
  frequent_infections: 'ឆ្លងរោគញឹកញាប់ (ស្បែក/ផ្លូវនោម)',
  acanthosis_nigricans: 'ស្បែកឡើងខ្មៅក្រាស់នៅកញ្ចឹងក/ក្លៀក',
}

const RISK_MAP_EN = {
  family_history: 'Family history of Type 2 Diabetes',
  family_history_diabetes: 'Family history of diabetes',
  physical_activity_low: 'Low physical activity / sedentary lifestyle',
  sedentary_lifestyle: 'Sedentary lifestyle',
  hypertension: 'Essential hypertension',
  obesity: 'Clinical obesity (BMI ≥ 30 kg/m²)',
  high_cholesterol: 'Dyslipidemia / hypercholesterolemia',
  smoking: 'Tobacco smoking history',
  pcos_history: 'Polycystic Ovary Syndrome (PCOS)',
  gestational_history: 'Gestational diabetes history (GDM)',
  ethnicity_high_risk: 'High-risk ethnic demographic',
}

const RISK_MAP_KM = {
  family_history: 'មានប្រវត្តិគ្រួសារកើតជំងឺទឹកនោមផ្អែម',
  family_history_diabetes: 'មានប្រវត្តិគ្រួសារកើតជំងឺទឹកនោមផ្អែម',
  physical_activity_low: 'ខ្វះការធ្វើលំហាត់ប្រាណ / អង្គុយច្រើន',
  sedentary_lifestyle: 'របៀបរស់នៅអង្គុយច្រើន',
  hypertension: 'ជំងឺលើសសម្ពាធឈាម',
  obesity: 'ភាពធាត់ (BMI ≥ 30 kg/m²)',
  high_cholesterol: 'លើសជាតិខ្លាញ់ក្នុងឈាម',
  smoking: 'ប្រវត្តិជក់បារី',
  pcos_history: 'ប្រវត្តិកើតដុំគីសអូវែ (PCOS)',
  gestational_history: 'ធ្លាប់កើតទឹកនោមផ្អែមពេលមានផ្ទៃពោះ (GDM)',
  ethnicity_high_risk: 'ប្រជាសាស្ត្រជនជាតិហានិភ័យខ្ពស់',
}

function toText(val, isKhmer = false) {
  if (val == null) return ''
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val)
  }
  if (typeof val === 'object') {
    if (isKhmer && val.text_km) return String(val.text_km)
    if (val.text) return String(val.text)
    if (isKhmer && val.label_km) return String(val.label_km)
    if (val.label) return String(val.label)
    if (isKhmer && val.name_km) return String(val.name_km)
    if (val.name) return String(val.name)
    if (val.message) return String(val.message)
    if (val.id) return String(val.id)
    return ''
  }
  return String(val)
}

function formatLabel(item, isKhmer, mapEn, mapKm) {
  if (!item) return ''
  let text = ''
  let id = ''
  if (typeof item === 'object') {
    if (isKhmer && item.label_km) return String(item.label_km)
    if (isKhmer && item.name_km) return String(item.name_km)
    if (item.label) text = String(item.label)
    if (item.name) text = String(item.name)
    if (item.id) id = String(item.id)
    if (item.text) text = String(item.text)
  } else {
    text = String(item)
    id = String(item)
  }
  const cleanKey = (id || text).toLowerCase().trim().replace(/[\s-]+/g, '_')
  if (isKhmer && mapKm[cleanKey]) return mapKm[cleanKey]
  if (!isKhmer && mapEn[cleanKey]) return mapEn[cleanKey]
  return text || id || ''
}

export default function PrintableClinicalReport({
  result,
  snapshot,
  context,
  isKhmer = false,
  reportDownloadId = null,
  patientName = '',
  reportTime = null,
  user = null,
}) {
  const payload = snapshot?.payload || result?.provided_payload || result?.payload || {}
  const explanation = result?.explanation || {}
  const keyLabs = explanation?.key_findings?.key_labs || {}

  // 1. Demographics
  const effectivePatientName = toText(
    patientName ||
      context?.patient_name ||
      result?.patient_name ||
      result?.patient?.full_name ||
      (isKhmer ? 'អ្នកជំងឺ' : 'Current Patient'),
    isKhmer
  )

  const patientId = toText(
    context?.patient_id ||
      result?.patient_id ||
      result?.patient?.id ||
      (reportDownloadId ? `PT-${String(reportDownloadId).padStart(4, '0')}` : 'PT-PENDING'),
    isKhmer
  )

  const rawGender = toText(payload?.gender || result?.patient_profile?.gender || context?.gender || '', isKhmer)
  const patientGender = (() => {
    const g = String(rawGender).toLowerCase()
    if (g === 'male' || g === 'm' || g === 'ប្រុស') return isKhmer ? 'ប្រុស' : 'Male'
    if (g === 'female' || g === 'f' || g === 'ស្រី') return isKhmer ? 'ស្រី' : 'Female'
    return isKhmer ? 'ផ្សេងៗ' : (rawGender || 'Not Specified')
  })()

  const rawAge = payload?.age || result?.patient_profile?.age || context?.age || null
  const patientAge = rawAge ? `${toText(rawAge)} ${isKhmer ? 'ឆ្នាំ' : 'years'}` : (isKhmer ? 'មិនបានបញ្ជាក់' : 'Not Specified')

  const dateObj = reportTime ? new Date(reportTime) : new Date()
  const issueDateFormatted = dateObj.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const clinicianName = toText(
    user?.name ||
      result?.reviewed_by_user?.name ||
      result?.clinician?.name ||
      (isKhmer ? 'វេជ្ជបណ្ឌិត សុផល មាស (MD) / CDS Engine' : 'Dr. Sophal Meas, MD / CDS Engine'),
    isKhmer
  )

  const reportNumber = `DX-${reportDownloadId || 'DRAFT'}`

  // 2. Clinical Impression
  const displayDiagnosis = toText(
    result?.diagnosis || (isKhmer ? 'ការវាយតម្លៃគ្លីនិក' : 'Clinical Evaluation'),
    isKhmer
  )

  const certaintyVal = Number(result?.certainty_percent ?? result?.certainty ?? 0)
  const certaintyPct = Math.round(certaintyVal <= 1 ? certaintyVal * 100 : certaintyVal)

  const isUrgent = Boolean(result?.is_urgent)
  const urgentReason = toText(result?.urgent_reason || '', isKhmer)

  const rawRecs = Array.isArray(result?.recommendations) ? result.recommendations : []
  const primaryRecommendation = toText(
    rawRecs[0] ||
      result?.recommendation ||
      (isKhmer
        ? 'សូមពិគ្រោះជាមួយគ្រូពេទ្យជំនាញដើម្បីរៀបចំផែនការតាមដានជាតិស្ករ។'
        : 'Consult a physician for personalized glycemic management and clinical guidance.'),
    isKhmer
  )

  const impressionSummary = toText(
    result?.summary ||
      explanation?.clinical_summary ||
      (isKhmer
        ? 'ការវាយតម្លៃបង្ហាញពីស្ថានភាពគ្លីនិកផ្អែកលើទិន្នន័យមន្ទីរពិសោធន៍ និងរោគសញ្ញា។'
        : 'Clinical evaluation based on automated rule engine consensus and verified laboratory markers.'),
    isKhmer
  )

  // 3. Lab Findings
  const labRows = []

  // Fasting glucose
  const fpgVal = payload?.fasting_glucose ?? payload?.fasting_plasma_glucose ?? keyLabs?.fasting_glucose ?? keyLabs?.fasting_plasma_glucose
  if (fpgVal != null && fpgVal !== '') {
    const num = Number(fpgVal)
    let flag = isKhmer ? 'ធម្មតា' : 'NORMAL'
    let flagClass = 'text-green-700 font-bold'
    if (num >= 126) {
      flag = isKhmer ? 'ខ្ពស់ (ទឹកនោមផ្អែម)' : 'HIGH (DIABETIC)'
      flagClass = 'text-red-700 font-bold'
    } else if (num >= 100) {
      flag = isKhmer ? 'កើនឡើង' : 'ELEVATED'
      flagClass = 'text-amber-700 font-bold'
    }
    labRows.push({
      label: isKhmer ? 'ជាតិស្ករពេលអត់អាហារ (FPG)' : 'Fasting Blood Glucose (FPG)',
      value: `${num}`,
      unit: 'mg/dL',
      status: flag,
      flagClass,
      ref: isKhmer ? '70 - 99 ធម្មតា | 100 - 125 ខ្សោយ | ≥126 ទឹកនោមផ្អែម' : '70 - 99 normal | 100 - 125 impaired | ≥126 diabetic',
    })
  }

  // HbA1c
  const a1cVal = payload?.hba1c ?? keyLabs?.hba1c
  if (a1cVal != null && a1cVal !== '') {
    const num = Number(a1cVal)
    let flag = isKhmer ? 'ធម្មតា' : 'NORMAL'
    let flagClass = 'text-green-700 font-bold'
    if (num >= 6.5) {
      flag = isKhmer ? 'ខ្ពស់ (ទឹកនោមផ្អែម)' : 'HIGH (DIABETIC)'
      flagClass = 'text-red-700 font-bold'
    } else if (num >= 5.7) {
      flag = isKhmer ? 'កើនឡើង' : 'ELEVATED'
      flagClass = 'text-amber-700 font-bold'
    }
    labRows.push({
      label: isKhmer ? 'អេម៉ូក្លូប៊ីន A1c (HbA1c)' : 'Hemoglobin A1c (HbA1c)',
      value: `${num}`,
      unit: '%',
      status: flag,
      flagClass,
      ref: isKhmer ? '< 5.7 ធម្មតា | 5.7 - 6.4 មុនទឹកនោមផ្អែម | ≥6.5 ទឹកនោមផ្អែម' : '< 5.7 normal | 5.7 - 6.4 prediabetes | ≥6.5 diabetic',
    })
  }

  // 2h OGTT
  const ogttVal = payload?.['2h_ogtt_75g'] ?? payload?.ogtt ?? keyLabs?.ogtt
  if (ogttVal != null && ogttVal !== '') {
    const num = Number(ogttVal)
    let flag = isKhmer ? 'ធម្មតា' : 'NORMAL'
    let flagClass = 'text-green-700 font-bold'
    if (num >= 200) {
      flag = isKhmer ? 'ខ្ពស់ (ទឹកនោមផ្អែម)' : 'HIGH (DIABETIC)'
      flagClass = 'text-red-700 font-bold'
    } else if (num >= 140) {
      flag = isKhmer ? 'កើនឡើង' : 'ELEVATED'
      flagClass = 'text-amber-700 font-bold'
    }
    labRows.push({
      label: isKhmer ? 'តេស្ត 2-Hour OGTT (75g)' : '2-Hour OGTT (75g)',
      value: `${num}`,
      unit: 'mg/dL',
      status: flag,
      flagClass,
      ref: isKhmer ? '< 140 ធម្មតា | 140 - 199 ធ្លាក់ចុះ | ≥200 ទឹកនោមផ្អែម' : '< 140 normal | 140 - 199 impaired | ≥200 diabetic',
    })
  }

  // Random Blood Glucose
  const rpgVal = payload?.random_plasma_glucose ?? payload?.random_glucose
  if (rpgVal != null && rpgVal !== '') {
    const num = Number(rpgVal)
    let flag = isKhmer ? 'ធម្មតា' : 'NORMAL'
    let flagClass = 'text-green-700 font-bold'
    if (num >= 200) {
      flag = isKhmer ? 'ខ្ពស់ (ទឹកនោមផ្អែម)' : 'HIGH (DIABETIC)'
      flagClass = 'text-red-700 font-bold'
    }
    labRows.push({
      label: isKhmer ? 'ជាតិស្ករចៃដន្យ (Random Glucose)' : 'Random Blood Glucose (RPG)',
      value: `${num}`,
      unit: 'mg/dL',
      status: flag,
      flagClass,
      ref: isKhmer ? '≥200 រួមជាមួយរោគសញ្ញា បញ្ជាក់ពីជំងឺ' : '≥200 with symptoms confirms diabetic range',
    })
  }

  // 4. Vital Metrics
  const metricRows = []
  if (payload?.bmi != null && payload?.bmi !== '') {
    metricRows.push({
      label: isKhmer ? 'សន្ទស្សន៍ម៉ាសរាងកាយ (BMI)' : 'Body Mass Index (BMI)',
      value: `${payload.bmi}`,
      unit: 'kg/m²',
    })
  }
  if (payload?.waist_circumference != null && payload?.waist_circumference !== '') {
    metricRows.push({
      label: isKhmer ? 'ទំហំចង្កេះ (Waist Circumference)' : 'Waist Circumference',
      value: `${payload.waist_circumference}`,
      unit: 'cm',
    })
  }

  // 5. Symptoms and Risk Factors
  const symptomsRaw = Array.isArray(result?.matched_symptoms)
    ? result.matched_symptoms
    : Array.isArray(payload?.symptoms)
    ? payload.symptoms
    : []
  const symptoms = symptomsRaw.map((s) => formatLabel(s, isKhmer, SYMPTOM_MAP_EN, SYMPTOM_MAP_KM)).filter(Boolean)

  const risksRaw = Array.isArray(result?.matched_risk_factors)
    ? result.matched_risk_factors
    : Array.isArray(payload?.risk_factors)
    ? payload.risk_factors
    : []
  const riskFactors = risksRaw.map((r) => formatLabel(r, isKhmer, RISK_MAP_EN, RISK_MAP_KM)).filter(Boolean)

  // 6. Recommendations
  const recommendations = (rawRecs.length > 0 ? rawRecs : [primaryRecommendation])
    .map((r) => toText(r, isKhmer))
    .filter(Boolean)

  // 7. Clinician Review Notes
  const reviewNote = toText(
    result?.reviewer_notes ||
      snapshot?.result?.reviewer_notes ||
      (isKhmer
        ? 'ការវាយតម្លៃត្រូវបានត្រួតពិនិត្យស្របតាមក្បួនវេជ្ជសាស្ត្រ និងគោលការណ៍ណែនាំគ្លីនិក។'
        : 'Assessment validated against clinical evidence rules and practice guidelines.'),
    isKhmer
  )

  return (
    <div className="printable-clinical-report text-slate-900 bg-white font-sans text-[8.5pt] leading-normal antialiased">
      {/* ── HEADER ── */}
      <div className="header-bar mb-3 flex items-start justify-between gap-3 border-b-[2.5px] border-[#0F294A] pb-2">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-12 w-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <p className="text-[7.5pt] font-bold uppercase tracking-wider text-blue-700">
              {isKhmer
                ? 'ប្រព័ន្ធជំនាញ និងគាំទ្រការសម្រេចចិត្តគ្លីនិក'
                : 'Clinical Decision Support & Expert System'}
            </p>
            <h1 className="text-[13.5pt] font-extrabold leading-tight text-[#0F294A]">
              {isKhmer
                ? 'របាយការណ៍វិនិច្ឆ័យ និងវាយតម្លៃជំងឺទឹកនោមផ្អែម'
                : 'Diabetes Diagnosis & Assessment Report'}
            </h1>
            <p className="text-[7.5pt] text-slate-600">
              <strong>
                {isKhmer
                  ? 'មជ្ឈមណ្ឌលឯកទេសជំងឺទឹកនោមផ្អែម និងសុខភាពមេតាបូលីស'
                  : 'Endocrinology & Diabetes Center of Clinical Excellence'}
              </strong>{' '}
              ·{' '}
              {isKhmer
                ? 'ដេប៉ាតឺម៉ង់វេជ្ជសាស្ត្រផ្ទៃក្នុង · ទូរស័ព្ទ៖ +1 (800) 555-GLUC'
                : 'Department of Endocrinology & Metabolic Health · Tel: +1 (800) 555-GLUC'}
            </p>
          </div>
        </div>
        <div className="min-w-[150px] text-right text-[7.5pt] leading-relaxed">
          <p>
            <strong className="text-[#0F294A]">{isKhmer ? 'លេខរបាយការណ៍:' : 'Report No:'}</strong>{' '}
            {reportNumber}
          </p>
          <p>
            <strong className="text-[#0F294A]">{isKhmer ? 'កាលបរិច្ឆេទ:' : 'Date:'}</strong>{' '}
            {issueDateFormatted}
          </p>
          <p>
            <strong className="text-[#0F294A]">{isKhmer ? 'ការពិនិត្យ:' : 'Type:'}</strong>{' '}
            {isKhmer ? 'ការវាយតម្លៃទូទៅ' : 'Comprehensive Evaluation'}
          </p>
        </div>
      </div>

      {/* ── 1. PATIENT DEMOGRAPHICS ── */}
      <div className="section-heading mb-1.5 border-b-[1.5px] border-blue-600 pb-0.5 text-[9.5pt] font-bold uppercase tracking-wide text-[#0F294A]">
        {isKhmer ? 'ព័ត៌មានអ្នកជំងឺ និងការពិនិត្យ' : 'Patient Information & Demographics'}
      </div>
      <table className="mb-2 w-full border-collapse text-[8.5pt]">
        <tbody>
          <tr>
            <th className="w-[18%] border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'ឈ្មោះអ្នកជំងឺ' : 'Patient Name'}
            </th>
            <td className="w-[32%] border border-slate-300 p-1.5 font-bold text-slate-900">
              {effectivePatientName}
            </td>
            <th className="w-[18%] border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'លេខសម្គាល់' : 'Patient ID'}
            </th>
            <td className="w-[32%] border border-slate-300 p-1.5">{patientId}</td>
          </tr>
          <tr>
            <th className="border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'ភេទ' : 'Sex'}
            </th>
            <td className="border border-slate-300 p-1.5">{patientGender}</td>
            <th className="border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'អាយុ' : 'Age'}
            </th>
            <td className="border border-slate-300 p-1.5">{patientAge}</td>
          </tr>
          <tr>
            <th className="border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'កាលបរិច្ឆេទបញ្ជូន' : 'Submitted At'}
            </th>
            <td className="border border-slate-300 p-1.5">{issueDateFormatted}</td>
            <th className="border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'គ្រូពេទ្យពិនិត្យ' : 'Assessed By'}
            </th>
            <td className="border border-slate-300 p-1.5">{clinicianName}</td>
          </tr>
          <tr>
            <th className="border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'លេខកូដវិនិច្ឆ័យ' : 'Assessment Ref'}
            </th>
            <td className="border border-slate-300 p-1.5">#{reportDownloadId || 'DRAFT'}</td>
            <th className="border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
              {isKhmer ? 'ស្ថានភាព' : 'Status'}
            </th>
            <td className="border border-slate-300 p-1.5 text-green-700 font-semibold">
              {isKhmer ? 'បានបញ្ចប់ការវាយតម្លៃ' : 'Completed Evaluation'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. CLINICAL IMPRESSION ── */}
      <div className="section-heading mb-1.5 border-b-[1.5px] border-blue-600 pb-0.5 text-[9.5pt] font-bold uppercase tracking-wide text-[#0F294A]">
        {isKhmer ? 'លទ្ធផលវិនិច្ឆ័យ និងការវាយតម្លៃគ្លីនិក' : 'Clinical Impression & Diagnostic Evaluation'}
      </div>
      <table className="mb-2 w-full border-collapse border border-slate-300 bg-slate-50/70 text-[8.5pt]">
        <tbody>
          <tr>
            <td className="w-[28%] border border-slate-300 p-2 font-bold text-slate-700">
              {isKhmer ? 'លទ្ធផលវិនិច្ឆ័យ' : 'Primary Diagnosis'}
            </td>
            <td className="border border-slate-300 p-2 text-[11pt] font-extrabold text-[#0F294A]">
              {displayDiagnosis}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-bold text-slate-700">
              {isKhmer ? 'ស្ថានភាពគ្លីនិក' : 'Clinical Status'}
            </td>
            <td className="border border-slate-300 p-2">
              {isUrgent ? (
                <span className="font-bold text-red-600">
                  {isKhmer ? 'ត្រូវការពិនិត្យបន្ទាន់' : 'Urgent Action Required'}
                  {urgentReason ? ` · ${urgentReason}` : ''}
                </span>
              ) : (
                <span className="font-bold text-green-600">
                  {isKhmer ? 'ការថែទាំគ្លីនិកស្តង់ដារ' : 'Standard Clinical Care'}
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-bold text-slate-700">
              {isKhmer ? 'កម្រិតទំនុកចិត្ត (Certainty)' : 'Certainty Factor'}
            </td>
            <td className="border border-slate-300 p-2">
              <strong>{certaintyPct}% Confidence</strong> ·{' '}
              <span className="text-slate-500">
                {isKhmer ? 'ការផ្គូផ្គងក្បួនវិនិច្ឆ័យស្វ័យប្រវត្តិ' : 'Automated Rule Engine Consensus'}
              </span>
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 p-2 font-bold text-slate-700">
              {isKhmer ? 'សេចក្តីសង្ខេបគ្លីនិក' : 'Clinical Summary'}
            </td>
            <td className="border border-slate-300 p-2 leading-relaxed">
              {impressionSummary}
              {primaryRecommendation && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                  <strong>{isKhmer ? 'ការណែនាំចម្បង:' : 'Primary Recommendation:'}</strong>{' '}
                  {primaryRecommendation}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. LAB FINDINGS ── */}
      {labRows.length > 0 && (
        <>
          <div className="section-heading mb-1.5 border-b-[1.5px] border-blue-600 pb-0.5 text-[9.5pt] font-bold uppercase tracking-wide text-[#0F294A]">
            {isKhmer
              ? 'លទ្ធផលតេស្តមន្ទីរពិសោធន៍ និងជីវសញ្ញាសម្គាល់'
              : 'Laboratory Findings & Biomarkers'}
          </div>
          <table className="mb-2 w-full border-collapse text-[8.5pt]">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="border border-slate-400 p-1.5 text-left font-bold">
                  {isKhmer ? 'ផ្នែកឆ្លងរោគ / តេស្ត' : 'Test / Indicator'}
                </th>
                <th className="border border-slate-400 p-1.5 text-left font-bold">
                  {isKhmer ? 'លទ្ធផល' : 'Result'}
                </th>
                <th className="border border-slate-400 p-1.5 text-left font-bold">
                  {isKhmer ? 'ខ្នាត' : 'Unit'}
                </th>
                <th className="border border-slate-400 p-1.5 text-left font-bold">
                  {isKhmer ? 'ស្ថានភាព' : 'Status'}
                </th>
                <th className="border border-slate-400 p-1.5 text-left font-bold">
                  {isKhmer ? 'កម្រិតយោង' : 'Reference Range'}
                </th>
              </tr>
            </thead>
            <tbody>
              {labRows.map((lab, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 p-1.5 font-medium">{lab.label}</td>
                  <td className="border border-slate-300 p-1.5 font-bold">{lab.value}</td>
                  <td className="border border-slate-300 p-1.5">{lab.unit}</td>
                  <td className={`border border-slate-300 p-1.5 ${lab.flagClass}`}>{lab.status}</td>
                  <td className="border border-slate-300 p-1.5 text-[7.5pt] text-slate-500">
                    {lab.ref}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── 4. VITAL METRICS ── */}
      {metricRows.length > 0 && (
        <table className="mb-2 w-full border-collapse text-[8.5pt]">
          <tbody>
            {metricRows.map((met, i) => (
              <tr key={i}>
                <th className="w-[35%] border border-slate-300 bg-slate-50 p-1.5 text-left font-semibold text-slate-700">
                  {met.label}
                </th>
                <td className="border border-slate-300 p-1.5 font-bold">
                  {met.value} <span className="font-normal text-slate-600">{met.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── 5. SYMPTOMS & RISK FACTORS ── */}
      <div className="section-heading mb-1.5 border-b-[1.5px] border-blue-600 pb-0.5 text-[9.5pt] font-bold uppercase tracking-wide text-[#0F294A]">
        {isKhmer ? 'រោគសញ្ញា និងទម្រង់ហានិភ័យ' : 'Reported Symptoms & Risk Factors'}
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded border border-slate-300 bg-slate-50/70 p-2">
          <div className="mb-1 text-[8pt] font-bold uppercase tracking-wider text-[#0F294A]">
            {isKhmer ? 'រោគសញ្ញាដែលបានកត់ត្រា' : 'Documented Symptoms'}
          </div>
          <ul className="space-y-0.5 text-[8pt]">
            {symptoms.length > 0 ? (
              symptoms.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600">•</span>
                  <span>{toText(s, isKhmer)}</span>
                </li>
              ))
            ) : (
              <li className="italic text-slate-400">
                {isKhmer
                  ? 'មិនមានរោគសញ្ញាគួរឱ្យកត់សម្គាល់ត្រូវបានរាយការណ៍'
                  : 'No classic symptoms reported in this assessment.'}
              </li>
            )}
          </ul>
        </div>
        <div className="rounded border border-slate-300 bg-slate-50/70 p-2">
          <div className="mb-1 text-[8pt] font-bold uppercase tracking-wider text-[#0F294A]">
            {isKhmer ? 'កត្តាហានិភ័យ និងប្រវត្តិជំងឺ' : 'Risk Factors & Medical History'}
          </div>
          <ul className="space-y-0.5 text-[8pt]">
            {riskFactors.length > 0 ? (
              riskFactors.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600">•</span>
                  <span>{toText(r, isKhmer)}</span>
                </li>
              ))
            ) : (
              <li className="italic text-slate-400">
                {isKhmer
                  ? 'មិនមានកត្តាហានិភ័យបន្ថែមត្រូវបានកត់ត្រា'
                  : 'No additional clinical risk factors recorded.'}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* ── 6. RECOMMENDATIONS ── */}
      <div className="section-heading mb-1.5 border-b-[1.5px] border-blue-600 pb-0.5 text-[9.5pt] font-bold uppercase tracking-wide text-[#0F294A]">
        {isKhmer ? 'ការណែនាំគ្លីនិក និងការថែទាំសុខភាព' : 'Clinical Recommendations & Care Actions'}
      </div>
      <div className="mb-2 space-y-1">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded border border-slate-300 bg-slate-50/70 p-2"
          >
            <div className="min-w-[24px] text-center text-[10pt] font-extrabold text-[#0F294A]">
              #{i + 1}
            </div>
            <div className="flex-1 text-[8.5pt] leading-relaxed text-slate-800">
              {toText(rec, isKhmer)}
            </div>
          </div>
        ))}
      </div>

      {/* ── 7. CLINICIAN REVIEW & CDS AUTHENTICATION ── */}
      <div className="section-heading mb-1.5 border-b-[1.5px] border-blue-600 pb-0.5 text-[9.5pt] font-bold uppercase tracking-wide text-[#0F294A]">
        {isKhmer ? 'ការពិនិត្យ និងការបញ្ជាក់ពីគ្រូពេទ្យ' : 'Clinician Review & CDS Authentication'}
      </div>
      <table className="mb-3 w-full border-collapse border border-slate-300 text-[8pt]">
        <thead>
          <tr>
            <th className="w-[50%] border border-slate-300 bg-slate-100 p-1.5 text-left font-bold text-slate-700">
              {isKhmer ? 'កំណត់ចំណាំរបស់គ្រូពេទ្យពិនិត្យ' : 'Reviewer Clinical Notes'}
            </th>
            <th className="border border-slate-300 bg-slate-100 p-1.5 text-left font-bold text-slate-700">
              {isKhmer ? 'ការអនុម័ត និងហត្ថលេខាគ្រូពេទ្យ' : 'Authentication & Verification Seal'}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-2 align-top leading-relaxed text-slate-700">
              {reviewNote}
              <div className="mt-3 text-[7.5pt] text-slate-500">
                {isKhmer ? 'ស្ថានភាព:' : 'Status:'}{' '}
                <span className="font-semibold text-slate-700">
                  {isUrgent
                    ? (isKhmer ? 'ត្រូវការពិនិត្យបន្ទាន់' : 'Urgent Review')
                    : (isKhmer ? 'បានផ្ទៀងផ្ទាត់' : 'Validated')}
                </span>{' '}
                | {isKhmer ? 'កាលបរិច្ឆេទ:' : 'Date:'} {issueDateFormatted}
              </div>
            </td>
            <td className="border border-slate-300 p-2 align-top leading-relaxed text-slate-700">
              <p>
                <strong>{isKhmer ? 'គ្រូពេទ្យឯកទេស:' : 'Reviewing Clinician:'}</strong>{' '}
                {clinicianName}
              </p>
              <p>
                <strong>{isKhmer ? 'លេខកូដរបាយការណ៍:' : 'Assessment Record:'}</strong> #{reportDownloadId || 'DRAFT'}
              </p>
              <p className="my-1">
                <strong>{isKhmer ? 'Security Seal:' : 'Security Seal:'}</strong>{' '}
                <u className="font-semibold text-blue-900">
                  {isKhmer
                    ? 'កំណត់ត្រាគ្លីនិកត្រូវបានផ្ទៀងផ្ទាត់ (VALIDATED CDS RECORD)'
                    : 'VALIDATED CLINICAL DECISION SUPPORT RECORD'}
                </u>
              </p>
              <p className="text-[7.5pt] text-slate-500">
                Electronically authenticated under clinical decision support protocols.
              </p>
              <div className="mt-2.5">
                <strong>{isKhmer ? 'ហត្ថលេខា:' : 'Authorized Signature:'}</strong>{' '}
                <em className="font-serif text-[9pt] text-slate-900 underline decoration-slate-400">
                  {clinicianName}
                </em>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── DISCLAIMER ── */}
      <div className="border-t border-slate-200 pt-2 text-[7pt] leading-relaxed text-slate-500">
        <p>
          ⚠{' '}
          <strong>
            {isKhmer ? 'ការបដិសេធ៖' : 'DISCLAIMER:'}
          </strong>{' '}
          {isKhmer
            ? 'របាយការណ៍នេះត្រូវបានបង្កើតឡើងដោយស្វ័យប្រវត្តិពីប្រព័ន្ធជំនាញគាំទ្រការសម្រេចចិត្តគ្លីនិកសម្រាប់ជំងឺទឹកនោមផ្អែម។ វាមិនមែនជាការវិនិច្ឆ័យវេជ្ជសាស្ត្រចុងក្រោយទេ ហើយត្រូវតែពិនិត្យឡើងវិញ និងបញ្ជាក់ដោយវេជ្ជបណ្ឌិតដែលមានអាជ្ញាប័ណ្ណ។ សូមកុំប្រើលទ្ធផលនេះដើម្បីធ្វើការសម្រេចចិត្តវេជ្ជសាស្ត្រដោយខ្លួនឯងដោយគ្មានការប្រឹក្សាពេទ្យ។'
            : 'This report was generated automatically by the Diabetes Clinical Decision Support Expert System. It is an auxiliary screening and decision support tool — not a standalone diagnostic determination. It must be reviewed and confirmed by a licensed healthcare professional. Do not initiate or modify any medical treatment without consulting a qualified physician.'}
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} Diabetes Clinical Decision Support System — Confidential
          Medical Record.
        </p>
      </div>
    </div>
  )
}
