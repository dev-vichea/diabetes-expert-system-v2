// Maps a matched-symptom label (Title Case, e.g. "Excessive Thirst") to its
// guide entry key under diagnosisResult.symptomGuide.items.*
const GUIDE_KEY_BY_LABEL = {
  'excessive thirst': 'excessiveThirst',
  polydipsia: 'excessiveThirst',
  'frequent urination': 'frequentUrination',
  polyuria: 'frequentUrination',
  'excessive hunger': 'excessiveHunger',
  polyphagia: 'excessiveHunger',
  'weight loss': 'weightLoss',
  'unexplained weight loss': 'weightLoss',
  fatigue: 'fatigue',
  'blurred vision': 'blurredVision',
  'slow healing': 'slowHealing',
  'tingling hands feet': 'tingling',
  'tingling hands and feet': 'tingling',
  'numbness or tingling in feet': 'tingling',
  'numbness or tingling in your feet': 'tingling',
  'frequent infections': 'frequentInfections',
  'acanthosis nigricans': 'acanthosisNigricans',
  nausea: 'nausea',
  vomiting: 'vomiting',
  'abdominal pain': 'abdominalPain',
  'stomach pain': 'abdominalPain',
  irritability: 'irritability',
  'recurrent uti yeast': 'recurrentInfections',
  'recurrent uti/yeast': 'recurrentInfections',
  'recurrent urinary tract or yeast infections': 'recurrentInfections',
  'bed wetting': 'bedWetting',
  'fruity breath': 'fruityBreath',
  'deep rapid breathing': 'deepRapidBreathing',
  sweating: 'sweating',
  shaking: 'shaking',
  dizziness: 'dizziness',
}

export function getSymptomGuideKey(label) {
  return GUIDE_KEY_BY_LABEL[String(label || '').trim().toLowerCase()] || null
}
