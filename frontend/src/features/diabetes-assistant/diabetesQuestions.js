export const ASSISTANT_COPY = {
  title: 'Diabetes Assistant',
  welcome: 'Hello! \u{1F44B}\nDo you have any questions about diabetes?',
  topicPrompt: 'What would you like to know?',
  followUp: 'Would you like to ask another question?',
  initialDecline: 'No problem! \u{1F60A} You can open the Diabetes Assistant anytime if you need help.',
  finished: 'Okay! \u{1F60A} I hope the information was helpful. You can open the Diabetes Assistant again anytime.',
}

export const DIABETES_QUESTIONS = [
  {
    id: 'what-is-diabetes',
    question: 'What is diabetes?',
    displayQuestion: 'What is diabetes?',
    answer:
      'Diabetes is a long-term condition that causes blood glucose, also called blood sugar, to become too high. It happens when the body does not make enough insulin, cannot use insulin effectively, or both. Over time, high blood glucose can affect the heart, kidneys, eyes, nerves, and other parts of the body.',
  },
  {
    id: 'symptoms',
    question: 'What symptoms should I watch for?',
    displayQuestion: 'Symptoms to watch for',
    answer:
      'Possible symptoms include increased thirst or hunger, frequent urination, unusual tiredness, blurry vision, unexplained weight loss, and cuts or wounds that heal slowly. Type 2 diabetes may develop with few or no noticeable symptoms, so testing is important if you have risk factors or concerns.',
  },
  {
    id: 'diabetes-types',
    question: 'What are the main types of diabetes?',
    displayQuestion: 'Types of diabetes',
    answer:
      'The three main types are Type 1, Type 2, and gestational diabetes. In Type 1 diabetes, the immune system damages the cells that make insulin. In Type 2 diabetes, the body does not use insulin well and may not make enough. Gestational diabetes develops during pregnancy and increases the parent\'s later risk of Type 2 diabetes.',
  },
  {
    id: 'diagnosis',
    question: 'How is diabetes diagnosed?',
    displayQuestion: 'How diabetes is diagnosed',
    answer:
      'A health professional diagnoses diabetes with blood tests. Common tests include A1C, which estimates average blood glucose over about three months; fasting plasma glucose; an oral glucose tolerance test; and, when symptoms are present, a random plasma glucose test. A second test is often used to confirm the result unless symptoms are clear.',
  },
  {
    id: 'prevention',
    question: 'Can Type 2 diabetes be prevented?',
    displayQuestion: 'Preventing Type 2 diabetes',
    answer:
      'Type 2 diabetes can often be prevented or delayed, especially in people with prediabetes. Helpful steps include regular physical activity, healthy eating, avoiding tobacco, and reaching or maintaining a healthy weight when advised by a health professional. Type 1 diabetes currently has no established routine prevention method.',
  },
  {
    id: 'healthy-eating',
    question: 'What should I eat if I have diabetes?',
    displayQuestion: 'Healthy eating with diabetes',
    answer:
      'There is no single diabetes diet. A useful plate method is to fill half your plate with non-starchy vegetables, one quarter with a high-fiber carbohydrate such as whole grains, beans, or fruit, and one quarter with a protein food. Choose water or drinks with little or no added sugar, and limit sugary drinks, saturated fat, and excess sodium. A dietitian or diabetes care team can personalize this plan for you.',
  },
  {
    id: 'daily-management',
    question: 'How can I manage diabetes day to day?',
    displayQuestion: 'Daily diabetes management',
    answer:
      'Follow the care plan you made with your health care team. Take medicines as prescribed, monitor blood glucose as recommended, eat regular balanced meals, stay physically active, get enough sleep, and avoid tobacco. Keep regular appointments to review blood glucose, blood pressure, cholesterol, kidney health, eye health, and foot care. Do not change medicines without medical advice.',
  },
  {
    id: 'urgent-help',
    question: 'When should I seek urgent medical help?',
    displayQuestion: 'When to seek urgent help',
    answer:
      'Get emergency help for severe low blood glucose causing fainting, a seizure, severe confusion, or inability to swallow. Also seek emergency care for high ketones, trouble breathing, fruity-smelling breath, repeated vomiting with an inability to keep fluids down, or blood glucose that stays at 300 mg/dL (16.7 mmol/L) or higher. These may be signs of a serious emergency such as diabetic ketoacidosis.',
  },
]
