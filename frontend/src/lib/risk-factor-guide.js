// Maps a matched risk-factor label (Title Case, e.g. "Family History") to its
// guide entry key under diagnosisResult.riskGuide.items.*.
// Labels come from the backend's `_to_readable_label` (snake_case → Title Case),
// so aliases below cover both the raw field names and common spellings.
const RISK_KEY_BY_LABEL = {
  'family history': 'familyHistory',
  'family history of diabetes': 'familyHistory',
  obesity: 'obesity',
  obese: 'obesity',
  overweight: 'overweight',
  hypertension: 'hypertension',
  'high blood pressure': 'hypertension',
  'sedentary lifestyle': 'sedentaryLifestyle',
  'physical inactivity': 'sedentaryLifestyle',
  'gestational history': 'gestationalHistory',
  'gestational diabetes': 'gestationalHistory',
  'past gestational diabetes': 'gestationalHistory',
  'history of gestational diabetes': 'gestationalHistory',
  smoking: 'smoking',
  smoker: 'smoking',
  'current smoker': 'smoking',
  'high cholesterol': 'highCholesterol',
  dyslipidemia: 'highCholesterol',
  'pcos history': 'pcosHistory',
  pcos: 'pcosHistory',
  'polycystic ovary syndrome': 'pcosHistory',
  'ethnicity high risk': 'ethnicityHighRisk',
  'high risk ethnicity': 'ethnicityHighRisk',
  'high-risk ethnicity': 'ethnicityHighRisk',
  prediabetes: 'overweight',
}

export function getRiskGuideKey(label) {
  return RISK_KEY_BY_LABEL[String(label || '').trim().toLowerCase()] || null
}
