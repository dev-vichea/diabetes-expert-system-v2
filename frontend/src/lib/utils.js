import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function cleanRuleName(name) {
  if (!name) return ''
  return String(name)
    // English prefixes (e.g., "V2 Diagnosis: ", "V2 Recommendation: ", "V2 Type 2 Pattern: ", "Classification: ", "Diagnosis: ")
    .replace(/^V\d+\s+(Diagnosis|Recommendation|Pattern|Classification|Triage|Type\s+\d+\s+Pattern|Gestational\s+Pattern|Risk)[\s:：៖\-–—\u17D6]+/i, '')
    .replace(/^V\d+[\s:：៖\-–—\u17D6]+/i, '')
    .replace(/^(Diagnosis|Recommendation|Classification|Triage|Pattern|Risk)[\s:：៖\-–—\u17D6]+/i, '')
    // Khmer prefixes (e.g., "V2 ការវិភាគរោគ៖ ", "V2 ការណែនាំ៖ ", "V2 ទម្រង់ប្រភេទទី ២៖ ", "ការវិភាគរោគ៖ ")
    .replace(/^V\d+\s+(ការវិភាគរោគ|ការណែនាំ|ការសង្គ្រោះបឋម|ទម្រង់\s*Gestational|ទម្រង់ប្រភេទទី\s*\d+|ទម្រង់ប្រភេទ\s*\d+|ទម្រង់|ការចាត់ថ្នាក់|ការត្រួតពិនិត្យបន្ទាន់)[\s:：\-–—\u17D6]+/i, '')
    .replace(/^V\d+[\s:：\-–—\u17D6]+/i, '')
    .replace(/^(ការវិភាគរោគ|ការណែនាំ|ការសង្គ្រោះបឋម|ទម្រង់\s*Gestational|ទម្រង់ប្រភេទទី\s*\d+|ទម្រង់ប្រភេទ\s*\d+|ទម្រង់|ការចាត់ថ្នាក់)[\s:：\-–—\u17D6]+/i, '')
    .trim()
}
