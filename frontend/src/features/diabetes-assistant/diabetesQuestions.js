export const ASSISTANT_COPY = {
  title: 'Diabetes Assistant',
  welcome: {
    en: 'Hello! 👋\nDo you have any questions about diabetes?',
    km: 'សួស្តី! 👋\nតើអ្នកមានសំណួរអ្វីខ្លះទាក់ទងនឹងជំងឺទឹកនោមផ្អែម?',
  },
  topicPrompt: {
    en: 'What would you like to know? Choose a topic below:',
    km: 'តើអ្នកចង់ដឹងអំពីអ្វីខ្លះ? សូមជ្រើសរើសប្រធានបទខាងក្រោម៖',
  },
  followUp: {
    en: 'Would you like to ask another question?',
    km: 'តើអ្នកចង់សួរសំណួរផ្សេងទៀតដែរឬទេ?',
  },
  initialDecline: {
    en: 'No problem! 😊 You can open the Diabetes Assistant anytime if you need help or guidance.',
    km: 'មិនអីទេ! 😊 អ្នកអាចបើកជំនួយការជំងឺទឹកនោមផ្អែមបានគ្រប់ពេល ប្រសិនបើអ្នកត្រូវការជំនួយ។',
  },
  finished: {
    en: 'Okay! 😊 I hope this information was helpful. You can reopen the Diabetes Assistant anytime.',
    km: 'យល់ព្រម! 😊 សង្ឃឹមថាព័ត៌មាននេះមានប្រយោជន៍សម្រាប់អ្នក។ អ្នកអាចបើកជំនួយការនេះម្តងទៀតបានគ្រប់ពេល។',
  },
}

export const DIABETES_QUESTIONS = [
  {
    id: 'what-is-diabetes',
    question: 'What is diabetes?',
    displayQuestion: 'What is diabetes?',
    questionKm: 'តើអ្វីជាជំងឺទឹកនោមផ្អែម?',
    displayQuestionKm: 'អ្វីជាជំងឺទឹកនោមផ្អែម?',
    answer:
      '**Diabetes** is a chronic metabolic condition where your **blood glucose (blood sugar)** levels stay consistently too high.\n\nIt happens when:\n• The pancreas **does not produce enough insulin**\n• The body cells **cannot use insulin effectively** (insulin resistance)\n\nOver time, elevated glucose can affect key organs including the **heart**, **kidneys**, **eyes**, and **nerves**.',
    answerKm:
      '**ជំងឺទឹកនោមផ្អែម** គឺជាស្ថានភាពរ៉ាំរ៉ៃដែលកម្រិត **ជាតិស្ករក្នុងឈាម (គ្លុយកូស)** ឡើងខ្ពស់ខ្លាំងជាប់ជាប្រចាំ។\n\nវាកើតឡើងនៅពេល៖\n• លំពែង **មិនផលិតអាំងស៊ុយលីនគ្រប់គ្រាន់**\n• កោសិកាក្នុងរាងកាយ **មិនអាចប្រើប្រាស់អាំងស៊ុយលីនប្រកបដោយប្រសិទ្ធភាព** (ភាពស៊ាំនឹងអាំងស៊ុយលីន)\n\nយូរៗទៅ កម្រិតជាតិស្ករក្នុងឈាមឡើងខ្ពស់អាចប៉ះពាល់ដល់សរីរាង្គសំខាន់ៗ រួមមាន **បេះដូង**, **តម្រងនោម**, **ភ្នែក**, និង **ប្រព័ន្ធប្រសាទ**។',
  },
  {
    id: 'symptoms',
    question: 'What symptoms should I watch for?',
    displayQuestion: 'Symptoms to watch for',
    questionKm: 'តើមានរោគសញ្ញាអ្វីខ្លះដែលគួរតាមដាន?',
    displayQuestionKm: 'រោគសញ្ញាដែលគួរតាមដាន',
    answer:
      'Common warning signs of high blood sugar include:\n• **Excessive thirst** and frequent urination\n• **Unusual fatigue** and constant hunger\n• **Blurred vision** and dry mouth\n• **Unexplained weight loss**\n• **Slow-healing cuts** or recurring skin infections\n\n*Note:* Type 2 diabetes often develops gradually with subtle symptoms. Routine screening is vital if you have risk factors.',
    answerKm:
      'សញ្ញាព្រមានទូទៅនៃកម្រិតជាតិស្ករក្នុងឈាមខ្ពស់រួមមាន៖\n• **ស្រេកទឹកខ្លាំង** និងនោមញឹកញាប់\n• **អស់កម្លាំងខុសធម្មតា** និងឃ្លានអាហារញឹកញាប់\n• **ស្រវាំងភ្នែក** និងស្ងួតមាត់\n• **ស្រកទម្ងន់ដោយគ្មានមូលហេតុ**\n• **របួសក្រសះស្បើយ** ឬងាយឆ្លងមេរោគលើស្បែក\n\n*ចំណាំ:* ជំងឺទឹកនោមផ្អែមប្រភេទទី ២ ច្រើនតែវិវត្តន៍យឺតៗដោយពុំមានរោគសញ្ញាច្បាស់លាស់នៅដំណាក់កាលដំបូងឡើយ។ ការពិនិត្យឈាមជាប្រចាំមានសារៈសំខាន់ណាស់ ប្រសិនបើអ្នកមានកត្តាប្រឈម។',
  },
  {
    id: 'diabetes-types',
    question: 'What are the main types of diabetes?',
    displayQuestion: 'Types of diabetes',
    questionKm: 'តើជំងឺទឹកនោមផ្អែមមានប៉ុន្មានប្រភេទចម្បង?',
    displayQuestionKm: 'ប្រភេទជំងឺទឹកនោមផ្អែម',
    answer:
      'The three primary forms of diabetes are:\n\n• **Type 1 Diabetes:** An autoimmune condition where the immune system destroys insulin-producing beta cells. Requires daily insulin therapy.\n• **Type 2 Diabetes:** The most common form (~90-95% of cases), where the body becomes resistant to insulin and production decreases.\n• **Gestational Diabetes:** Develops during pregnancy due to hormonal changes. It usually resolves after childbirth but raises future Type 2 risk.',
    answerKm:
      'ជំងឺទឹកនោមផ្អែមមាន ៣ ប្រភេទចម្បង៖\n\n• **ប្រភេទទី ១ (Type 1):** ជាជំងឺអូតូអុីមុយន ដែលប្រព័ន្ធភាពស៊ាំបំផ្លាញកោសិកាផលិតអាំងស៊ុយលីន។ ទាមទារការចាក់អាំងស៊ុយលីនជារៀងរាល់ថ្ងៃ។\n• **ប្រភេទទី ២ (Type 2):** ជាប្រភេទដែលជួបញឹកញាប់បំផុត (ប្រហែល ៩០-៩៥% នៃករណីទាំងអស់) ដែលរាងកាយស៊ាំនឹងអាំងស៊ុយលីន ហើយការផលិតអាំងស៊ុយលីនថយចុះ។\n• **ទឹកនោមផ្អែមពេលមានផ្ទៃពោះ:** កើតឡើងអំឡុងពេលមានគភ៌ដោយសារការប្រែប្រួលអ័រម៉ូន។ ជាទូទៅវាបាត់ទៅវិញក្រោយសម្រាល ប៉ុន្តែបង្កើនហានិភ័យកើតជំងឺប្រភេទទី ២ នៅពេលក្រោយ។',
  },
  {
    id: 'diagnosis',
    question: 'How is diabetes diagnosed?',
    displayQuestion: 'How diabetes is diagnosed',
    questionKm: 'តើគេធ្វើរោគវិនិច្ឆ័យជំងឺទឹកនោមផ្អែមដោយរបៀបណា?',
    displayQuestionKm: 'ការធ្វើរោគវិនិច្ឆ័យជំងឺ',
    answer:
      'Clinicians diagnose diabetes using standardized laboratory blood tests:\n\n• **Hemoglobin A1C (≥ 6.5%):** Estimates average blood glucose over the past 2 to 3 months.\n• **Fasting Plasma Glucose (≥ 126 mg/dL):** Measured after an overnight fast of at least 8 hours.\n• **Oral Glucose Tolerance Test (OGTT ≥ 200 mg/dL):** Measured 2 hours after consuming a standardized sweet glucose drink.\n• **Random Plasma Glucose (≥ 200 mg/dL):** Measured anytime when classic hyperglycemia symptoms are present.',
    answerKm:
      'វេជ្ជបណ្ឌិតធ្វើរោគវិនិច្ឆ័យជំងឺទឹកនោមផ្អែមតាមរយៈការពិនិត្យឈាមតាមស្តង់ដារ៖\n\n• **កម្រិតអេម៉ូក្លូប៊ីន A1C (≥ ៦.៥%):** បង្ហាញពីកម្រិតជាតិស្ករជាមធ្យមក្នុងរយៈពេល ២ ទៅ ៣ ខែកន្លងមក។\n• **កម្រិតជាតិស្ករពេលអត់អាហារ (≥ ១២៦ mg/dL):** វាស់ក្រោយអត់អាហារយ៉ាងតិច ៨ ម៉ោង។\n• **ការធ្វើតេស្តទ្រាំទ្រជាតិស្ករ (OGTT ≥ ២០០ mg/dL):** វាស់កម្រិតជាតិស្ករ ២ ម៉ោងក្រោយពិសាភេសជ្ជៈជាតិស្ករ។\n• **កម្រិតជាតិស្ករចៃដន្យ (≥ ២០០ mg/dL):** វាស់នៅពេលណាក៏បាន នៅពេលមានរោគសញ្ញាជំងឺទឹកនោមផ្អែមច្បាស់លាស់។',
  },
  {
    id: 'prevention',
    question: 'Can Type 2 diabetes be prevented?',
    displayQuestion: 'Preventing Type 2 diabetes',
    questionKm: 'តើអាចការពារជំងឺទឹកនោមផ្អែមប្រភេទទី ២ បានទេ?',
    displayQuestionKm: 'ការការពារជំងឺទឹកនោមផ្អែមប្រភេទ ២',
    answer:
      '**Type 2 diabetes can often be prevented or delayed** by taking proactive lifestyle steps:\n\n• **Regular exercise:** Strive for at least 150 minutes of moderate activity (e.g. brisk walking) per week.\n• **Nutrient-rich eating:** Emphasize high-fiber whole grains, vegetables, and lean proteins while minimizing sugary beverages.\n• **Weight management:** Losing 5% to 7% of body weight can reduce diabetes risk by more than 50% in prediabetic individuals.\n• **Avoid tobacco:** Smoking accelerates vascular damage and insulin resistance.\n\n*Note:* Type 1 diabetes is autoimmune and cannot currently be prevented through lifestyle.',
    answerKm:
      '**ជំងឺទឹកនោមផ្អែមប្រភេទទី ២ អាចការពារ ឬពន្យារពេលបាន** តាមរយៈការផ្លាស់ប្តូររបៀបរស់នៅប្រកបដោយសុខភាព៖\n\n• **ហាត់ប្រាណឱ្យបានទៀងទាត់:** យ៉ាងតិច ១៥០ នាទីក្នុងមួយសប្តាហ៍ (ដូចជាការដើរញាប់)។\n• **ទទួលទានអាហារមានជីវជាតិ:** ផ្តោតលើគ្រាប់ធញ្ញជាតិសម្បូរជាតិសរសៃ បន្លែ និងសាច់គ្មានខ្លាញ់ កាត់បន្ថយភេសជ្ជៈផ្អែម។\n• **គ្រប់គ្រងទម្ងន់ឱ្យបានសមស្រប:** ការស្រកទម្ងន់ត្រឹមតែ ៥% ទៅ ៧% អាចកាត់បន្ថយហានិភ័យបានជាង ៥០% សម្រាប់អ្នកមានកម្រិតជាតិស្ករមុនជំងឺទឹកនោមផ្អែម។\n• **ចៀសវាងការជក់បារី:** ការជក់បារីធ្វើឱ្យសរសៃឈាមខូចខាត និងបង្កើនភាពស៊ាំនឹងអាំងស៊ុយលីន។\n\n*ចំណាំ:* ជំងឺប្រភេទទី ១ មិនអាចការពារបានដោយរបៀបរស់នៅឡើយ។',
  },
  {
    id: 'healthy-eating',
    question: 'What should I eat if I have diabetes?',
    displayQuestion: 'Healthy eating with diabetes',
    questionKm: 'តើខ្ញុំគួរទទួលទានអ្វីខ្លះប្រសិនបើមានជំងឺទឹកនោមផ្អែម?',
    displayQuestionKm: 'របបអាហារសុខភាព',
    answer:
      'There is no one-size-fits-all diet, but the **Diabetes Plate Method** is a practical guide:\n\n• **1/2 of your plate:** Non-starchy vegetables (spinach, broccoli, greens, cucumbers)\n• **1/4 of your plate:** Lean protein sources (fish, chicken, eggs, tofu, beans)\n• **1/4 of your plate:** High-fiber carbohydrates (brown rice, oats, sweet potatoes, whole fruit)\n\n• **Hydration:** Opt for water or unsweetened tea. Limit sugary drinks, saturated fats, and excess sodium.\n\nA dietitian or diabetes care team can personalize target carb allowances for you.',
    answerKm:
      'មិនមានរបបអាហារជាក់លាក់តែមួយសម្រាប់ជំងឺទឹកនោមផ្អែមទេ ប៉ុន្តែ **វិធីសាស្ត្រចានចំណីអាហារ (Plate Method)** ងាយស្រួលអនុវត្ត៖\n\n• **១/២ នៃចានរបស់អ្នក:** បន្លែគ្មានជាតិម្សៅ (ត្រកួន, ខាត់ណាខៀវ, សាឡាត់, ត្រសក់)\n• **១/៤ នៃចានរបស់អ្នក:** ប្រភពប្រូតេអ៊ីនគ្មានខ្លាញ់ (ត្រី, មាន់, ស៊ុត, តៅហ៊ូ, សណ្តែក)\n• **១/៤ នៃចានរបស់អ្នក:** ជាតិកាបូអ៊ីដ្រាតសម្បូរជាតិសរសៃ (អង្ករសម្រូប, ស្រូវអូត, ដំឡូងជ្វា, ផ្លែឈើស្រស់)\n\n• **ការទទួលទានទឹក:** ជ្រើសរើសទឹកបរិសុទ្ធ ឬតែគ្មានជាតិស្ករ។ កាត់បន្ថយភេសជ្ជៈផ្អែម ខ្លាញ់ឆ្អែត និងអំបិលច្រើន។',
  },
  {
    id: 'daily-management',
    question: 'How can I manage diabetes day to day?',
    displayQuestion: 'Daily diabetes management',
    questionKm: 'តើខ្ញុំអាចគ្រប់គ្រងជំងឺទឹកនោមផ្អែមប្រចាំថ្ងៃយ៉ាងដូចម្តេច?',
    displayQuestionKm: 'ការគ្រប់គ្រងជំងឺប្រចាំថ្ងៃ',
    answer:
      'Successful everyday diabetes care centers on consistency:\n\n• **Take prescribed medicines:** Follow dosage and timing instructions carefully.\n• **Monitor blood glucose:** Check levels as recommended to learn how food and activity affect your readings.\n• **Stay active & rested:** Regular movement and 7-8 hours of sleep support healthy insulin function.\n• **Routine preventive care:** Schedule regular checks for **A1C (every 3-6 months)**, blood pressure, cholesterol, kidney function, and annual dilated eye/foot exams.\n\nNever adjust prescriptions without consulting your physician.',
    answerKm:
      'ការគ្រប់គ្រងជំងឺទឹកនោមផ្អែមប្រចាំថ្ងៃប្រកបដោយជោគជ័យ ទាមទារភាពខ្ជាប់ខ្ជួន៖\n\n• **លេបថ្នាំតាមវេជ្ជបញ្ជា:** អនុវត្តតាមកម្រិត និងពេលវេលាដែលវេជ្ជបណ្ឌិតណែនាំ។\n• **តាមដានកម្រិតជាតិស្ករ:** វាស់ជាតិស្ករតាមការណែនាំ ដើម្បីយល់ពីឥទ្ធិពលនៃអាហារ និងសកម្មភាពប្រចាំថ្ងៃ។\n• **ធ្វើសកម្មភាពរាងកាយ និងគេងឱ្យបានគ្រប់គ្រាន់:** ការធ្វើចលនាញឹកញាប់ និងគេង ៧-៨ ម៉ោងជួយឱ្យអាំងស៊ុយលីនដំណើរការល្អ។\n• **ការពិនិត្យសុខភាពជាប្រចាំ:** កំណត់ពេលពិនិត្យកម្រិត **A1C (រៀងរាល់ ៣-៦ ខែ)**, សម្ពាធឈាម, មុខងារតម្រងនោម, ភ្នែក និងបាតជើង។',
  },
  {
    id: 'urgent-help',
    question: 'When should I seek urgent medical help?',
    displayQuestion: 'When to seek urgent help',
    questionKm: 'តើពេលណាដែលខ្ញុំគួរស្វែងរកជំនួយសង្គ្រោះបន្ទាន់?',
    displayQuestionKm: 'ពេលណាត្រូវស្វែងរកជំនួយបន្ទាន់',
    answer:
      '⚠️ **Seek emergency medical evaluation immediately** if you observe:\n\n• **Severe Low Blood Sugar (Hypoglycemia):** Fainting, seizure, extreme confusion, or inability to swallow.\n• **Diabetic Ketoacidosis (DKA) signs:** Deep rapid breathing, fruity-smelling breath, repeated vomiting, or inability to hold fluids down.\n• **Persistent Hyperglycemia:** Blood glucose remaining at or above **300 mg/dL (16.7 mmol/L)** despite correction.\n\nNever delay emergency care if symptoms are severe or deteriorating rapidly.',
    answerKm:
      '⚠️ **ស្វែងរកជំនួយសង្គ្រោះបន្ទាន់ជាបន្ទាន់** ប្រសិនបើអ្នក ឬអ្នកជំងឺជួបប្រទះ៖\n\n• **កម្រិតជាតិស្ករចុះទាបធ្ងន់ធ្ងរ (Hypoglycemia):** សន្លប់, ប្រកាច់, វង្វេងស្មារតីខ្លាំង, ឬមិនអាចលេបអាហារបាន។\n• **សញ្ញានៃការឡើងជាតិអាស៊ីតកេតូន (DKA):** ដកដង្ហើមញាប់ខ្លាំង, ខ្យល់ដង្ហើមមានក្លិនផ្លែឈើ, ចង្អោរខ្លាំង ក្អួតញឹកញាប់ ឬមិនអាចទទួលទានទឹកបាន។\n• **ជាតិស្ករឡើងខ្ពស់ខ្លាំងជាប់ជាប្រចាំ:** ជាតិស្ករនៅតែលើស **៣០០ mg/dL (១៦.៧ mmol/L)** ទោះបីបានព្យាបាលកែតម្រូវក៏ដោយ។',
  },
]
