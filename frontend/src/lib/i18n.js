export const DEFAULT_LANGUAGE = 'km'
export const LANGUAGE_STORAGE_KEY = 'app-language'
export const SUPPORTED_LANGUAGES = ['en', 'km']

export const messages = {
  "en": {
    "common": {
      "english": "English",
      "khmer": "Khmer",
      "language": "Language",
      "notAvailable": "N/A",
      "user": "User",
      "unknownUser": "Unknown User",
      "noEmail": "No email",
      "role": "Role",
      "open": "Open",
      "seeAll": "See all",
      "closeSidebar": "Close sidebar",
      "closeMenu": "Close menu",
      "settings": "Settings",
      "getHelp": "Get Help",
      "back": "Back",
      "continue": "Continue",
      "selected": "selected",
      "yes": "Yes",
      "noSelection": "Not selected",
      "logout": "Logout"
    },
    "roles": {
      "user": "User",
      "patient": "Patient",
      "doctor": "Doctor",
      "admin": "Admin",
      "super_admin": "Super Admin"
    },
    "nav": {
      "dashboard": "Dashboard",
      "assessment": "Assessment",
      "patients": "Patients",
      "knowledgeBase": "Knowledge Base",
      "patientReview": "Patient Review",
      "myResults": "My Results",
      "users": "Users",
      "roles": "Roles",
      "workspace": "Workspace",
      "system": "System",
      "documents": "Documents",
      "tools": "Tools"
    },
    "page": {
      "unauthorized": {
        "title": "Unauthorized",
        "subtitle": "You do not have access to this resource"
      },
      "notFound": {
        "title": "Not Found",
        "subtitle": "The requested page could not be found"
      },
      "assessmentResult": {
        "title": "Assessment Result",
        "subtitle": "Readable clinical summary from your assessment output"
      },
      "assessmentWorkspace": {
        "title": "Assessment Workspace",
        "subtitle": "Collect patient facts and run expert inference"
      },
      "patientManagement": {
        "title": "Patient Management",
        "subtitle": "Profiles, symptoms, labs, and diagnosis timelines"
      },
      "knowledgeBase": {
        "title": "Knowledge Base",
        "subtitle": "Rule authoring, history, and governance"
      },
      "clinicalReview": {
        "title": "Clinical Review",
        "subtitle": "Annotate and triage diagnosis outcomes"
      },
      "myDiagnosisResults": {
        "title": "My Diagnosis Results",
        "subtitle": "Track your diagnosis history and feedback"
      },
      "users": {
        "title": "Users",
        "subtitle": "Manage user access, roles, and account status"
      },
      "rolesPermissions": {
        "title": "Roles & Permissions",
        "subtitle": "Create role profiles and choose granted permissions"
      },
      "dashboard": {
        "title": "Dashboard",
        "subtitle": "Operational overview by role"
      }
    },
    "breadcrumbs": {
      "dashboard": "Dashboard",
      "patientHistory": "Patient History",
      "ruleDetails": "Rule Details",
      "reviewDetails": "Review Details",
      "details": "Details"
    },
    "topbar": {
      "expandSidebar": "Expand sidebar",
      "collapseSidebar": "Collapse sidebar",
      "openMenu": "Open menu",
      "breadcrumb": "Breadcrumb",
      "newAssessment": "New Assessment",
      "switchToLightTheme": "Switch to light theme",
      "switchToDarkTheme": "Switch to dark theme",
      "notifications": "Notifications",
      "languageSwitcher": "Switch language",
      "profileSettings": "Settings",
      "logOut": "Log out"
    },
    "patientDashboard": {
      "errors": {
        "loadFailed": "Failed to load your dashboard data"
      },
      "hero": {
        "eyebrow": "Patient Dashboard",
        "welcomeBack": "Welcome back, {{name}}",
        "fallbackName": "Patient",
        "description": "Review your latest result, understand what to do next, and keep your diabetes care history easy to follow.",
        "startAssessment": "Start New Assessment",
        "viewHistory": "View Full History",
        "assessments": "Assessments",
        "assessmentsHint": "Stored in your result history",
        "latestConfidence": "Latest Confidence",
        "latestConfidenceHintFallback": "No diagnosis available yet",
        "urgentFollowUp": "Urgent Follow-Up",
        "latestSnapshot": "Latest Snapshot",
        "noDiagnosisYet": "No diagnosis result yet",
        "snapshotFallback": "Complete an assessment to generate a diagnosis result and next-step guidance.",
        "openFullResult": "Open full result"
      },
      "recentAssessments": {
        "title": "Recent Assessments",
        "description": "Your latest diagnosis outcomes and recommendation summaries.",
        "loading": "Loading your assessments...",
        "emptyTitle": "No assessments yet",
        "emptyDescription": "Submit your first assessment to unlock a personal diagnosis history and follow-up guidance.",
        "unknownDiagnosis": "Unknown diagnosis",
        "confidence": "Confidence",
        "urgent": "Urgent",
        "routine": "Routine",
        "noRecommendation": "No recommendation provided."
      },
      "carePlan": {
        "title": "Care Plan",
        "description": "What matters most after your latest assessment.",
        "emptyTitle": "No latest summary yet",
        "emptyDescription": "Once you complete an assessment, your most recent diagnosis and follow-up plan will appear here.",
        "currentPriority": "Current priority",
        "urgentPriorityText": "Your latest result includes an urgent flag. Follow the recommendation promptly and contact a clinician if symptoms are getting worse.",
        "routinePriorityText": "Your latest result does not show an urgent flag. Continue with the recommended follow-up and monitor any symptom changes.",
        "latestSummary": "Latest Summary",
        "noDiagnosisAvailable": "No diagnosis available",
        "confidence": "Confidence",
        "reviewNote": "Review Note",
        "noDoctorNote": "No doctor note yet."
      },
      "nextSteps": {
        "title": "Next Steps",
        "description": "Simple actions to keep your care on track.",
        "reviewHistoryTitle": "Review your diagnosis history",
        "reviewHistoryText": "Track changes in diagnosis, urgency, and confidence across older and newer results.",
        "openHistory": "Open history",
        "newAssessmentTitle": "Start a new assessment when information changes",
        "newAssessmentText": "Run another assessment when symptoms change, new lab values become available, or your doctor asks for an update.",
        "startAssessment": "Start assessment"
      },
      "status": {
        "noResultYet": "No result yet",
        "needsAttention": "Needs attention",
        "stable": "Stable"
      },
      "checklist": {
        "firstAssessment1": "Complete your first assessment to generate a diagnosis summary.",
        "firstAssessment2": "Keep recent lab values nearby before you start the questionnaire.",
        "firstAssessment3": "Return to the dashboard to track future result changes.",
        "urgentRecommendation": "Follow the urgent advice from your latest result as soon as possible.",
        "routineRecommendation": "Follow the latest recommendation from your most recent result.",
        "compareHistory": "Use your result history to compare changes in confidence and diagnosis over time.",
        "prepareLabs": "Prepare missing lab tests before your next assessment to improve certainty.",
        "startWhenChanged": "Start a new assessment whenever symptoms, labs, or medication status changes."
      }
    },
    "assessment": {
      "healthAssessment": "Health Assessment",
      "draftAutosaved": "Draft autosaved",
      "complete": "Complete",
      "demoFill": "Demo Fill:",
      "step": "Step",
      "answered": "answered",
      "closeBmiCalc": "Close calculator",
      "openBmiCalc": "I don't know my exact BMI",
      "weightKg": "Weight (kg)",
      "heightCm": "Height (cm)",
      "labHaveResults": "Do you have lab results?",
      "labHaveResultsSub": "Lab values improve accuracy — but you can skip this",
      "exactValueMgDl": "Exact value (mg/dL)",
      "exactValuePercent": "Exact value (%)",
      "additionalLabTests": "Additional lab tests (optional)",
      "testName": "Test name",
      "value": "Value",
      "add": "Add",
      "remove": "Remove",
      "reviewSummary": "Review Summary",
      "reviewSummarySub": "Double-check before submitting",
      "footerHintContinue": "Complete each section, then continue",
      "footerHintSubmitted": "Assessment submitted",
      "footerHintReady": "Ready to submit",
      "criticalHigh": "Critical High",
      "diabetesRange": "Diabetes Range",
      "preDiabetes": "Pre-diabetes",
      "normalRange": "Normal Range",
      "valueMgDl": "Value (mg/dL)",
      "extraPlaceholderText": "e.g. tingling feet, dry mouth, frequent infections...",
      "steps": {
        "profile": {
          "title": "Profile",
          "description": "Basic patient information"
        },
        "symptoms": {
          "title": "Symptoms",
          "description": "Symptoms you are feeling"
        },
        "labs": {
          "title": "Lab Values",
          "description": "Glucose and lab values"
        },
        "risks": {
          "title": "Risk Factors",
          "description": "Lifestyle and medical risks"
        },
        "review": {
          "title": "Review & Submit",
          "description": "Check details and run diagnosis"
        }
      },
      "options": {
        "age": {
          "under18": "Under 18",
          "age18to30": "18-30",
          "age31to45": "31-45",
          "age46to60": "46-60",
          "over60": "60 +"
        },
        "bmi": {
          "underweight": "Underweight",
          "normal": "Normal",
          "overweight": "Overweight",
          "obese": "Obese"
        },
        "waist": {
          "low": "Low risk",
          "medium": "Medium risk",
          "high": "High risk"
        },
        "ogtt": {
          "normal": "Normal",
          "prediabetes": "Pre-diabetes",
          "diabetes": "Diabetes"
        }
      },
      "fields": {
        "symptoms": {
          "frequentUrination": "Frequent urination",
          "excessiveThirst": "Excessive thirst",
          "fatigue": "Constant tiredness",
          "blurredVision": "Blurred vision",
          "weightLoss": "Unexplained weight loss",
          "slowHealing": "Slow wound healing",
          "nausea": "Nausea",
          "tinglingHandsFeet": "Tingling hands / feet",
          "frequentInfections": "Frequent infections",
          "acanthosisNigricans": "Dark skin patches"
        },
        "safetySymptoms": {
          "sweating": "Sweating episodes",
          "shaking": "Shaking / tremor",
          "dizziness": "Dizziness",
          "vomiting": "Vomiting",
          "abdominalPain": "Stomach pain"
        },
        "hypoglycemia": {
          "confusion": "Confusion or trouble focusing",
          "palpitations": "Palpitations/rapid heartbeat",
          "improvesWithSugar": "Symptoms improve after sugar intake"
        },
        "urgent": {
          "nausea": "Nausea",
          "rapidBreathing": "Rapid or deep breathing",
          "unableToKeepFluids": "Unable to keep fluids down",
          "crisis": "Looks severely ill or in crisis"
        },
        "riskFactors": {
          "familyHistory": "Family history",
          "obesity": "Obesity / overweight",
          "hypertension": "High blood pressure",
          "sedentaryLifestyle": "Inactive / sedentary",
          "gestationalHistory": "Gestational diabetes history",
          "smoking": "Current smoker",
          "highCholesterol": "High cholesterol",
          "pcosHistory": "PCOS History",
          "ethnicityHighRisk": "High-risk ethnicity"
        },
        "labs": {
          "fasting": {
            "normal": "Normal",
            "prediabetes": "Pre-diabetes",
            "diabetes": "Diabetes range",
            "critical": "Critical"
          },
          "hba1c": {
            "normal": "Normal",
            "prediabetes": "Pre-diabetes",
            "diabetes": "Diabetes",
            "critical": "Severe"
          }
        }
      },
      "status": {
        "flow": "Assessment Flow",
        "complete": "{{percent}}% Complete",
        "stepCounter": "Step {{step}}/{{total}}",
        "analyzing": "Analyzing...",
        "runAssessment": "🔬 Run Assessment",
        "runAgain": "Run Again",
        "newAssessment": "New Assessment"
      },
      "patient": {
        "title": "Who is being assessed?",
        "loading": "Loading patients...",
        "selectPlaceholder": "Select patient",
        "noPatients": "No patients available",
        "noSelection": "Not selected"
      },
      "profile": {
        "ageTitle": "How old are you?",
        "ageHelper": "Tap the range that fits best, or type your exact age",
        "exactAge": "Or enter exact age",
        "bmiTitle": "Body Mass Index (BMI)",
        "exactBmi": "Select your range or enter your BMI number",
        "waistTitle": "Waist Circumference (optional)",
        "exactWaist": "Waist in cm",
        "waistHelper": "Helps detect central obesity - a key diabetes risk factor"
      },
      "symptoms": {
        "commonTitle": "Common symptoms",
        "commonHelper": "Tap any symptoms you're currently experiencing",
        "safetyTitle": "Warning signs",
        "safetyHelper": "These help detect low blood sugar or emergencies",
        "hypoglycemiaTitle": "Hypoglycemia follow-up",
        "hypoglycemiaHelper": "Shown because sweating, shaking, or dizziness was selected.",
        "urgentTitle": "Urgent / DKA follow-up",
        "urgentHelper": "Shown because vomiting, abdominal pain, or high glucose pattern was detected.",
        "extraTitle": "Anything else?",
        "extraHelper": "Describe any additional symptoms (optional)",
        "extraPlaceholder": "e.g. dry_mouth, tingling_feet"
      },
      "labs": {
        "availabilityTitle": "Lab availability",
        "noLabs": "I do not have lab results right now (continue in screening mode).",
        "currentMode": "Current mode:",
        "fastingTitle": "Fasting Blood Glucose",
        "rangeHelper": "Optional: select range, then optionally override exact value.",
        "exactFasting": "Exact fasting glucose",
        "hba1cTitle": "HbA1c (Glycated Hemoglobin)",
        "exactHba1c": "Exact HbA1c",
        "randomTitle": "Random glucose (optional)",
        "randomLabel": "Random plasma glucose (mg/dL)",
        "additionalTitle": "Additional lab values",
        "labNamePlaceholder": "Lab name",
        "valuePlaceholder": "Value",
        "add": "Add",
        "remove": "Remove",
        "noAdditionalLabs": "No additional labs added.",
        "title": "Do you have lab results?",
        "helper": "Lab values improve accuracy — but you can skip this",
        "noLabsAvailable": "I don't have lab results right now",
        "mode": "Mode",
        "diagnosticMode": "🔬 Diagnostic",
        "screeningMode": "📋 Screening",
        "fastingHelper": "mg/dL — after 8+ hours of fasting",
        "hba1cHelper": "Percentage — reflects 2–3 month average blood sugar",
        "ogttTitle": "2-Hour OGTT (optional)",
        "ogttHelper": "mg/dL — measured 2 hours after 75g glucose load",
        "rpgTitle": "Random Blood Glucose (optional)",
        "rpgHelper": "mg/dL — any time, no fasting needed"
      },
      "riskFactors": {
        "title": "Risk factors checklist",
        "helper": "Check all risk factors present."
      },
      "review": {
        "title": "Quick review before analysis",
        "helper": "Please check this summary before you run diagnosis.",
        "summaryTitle": "Patient Info Summary",
        "patient": "Patient",
        "notSelected": "Not selected",
        "currentUser": "Current user",
        "mode": "Mode",
        "bodyMetrics": "Age / Body Mass / Waist",
        "glucoseTests": "Glucose tests (Fasting / HbA1c / Random)",
        "counts": "Symptoms / Risk Factors",
        "adaptiveFlags": "Adaptive branch flags",
        "hypoglycemia": "Hypoglycemia",
        "urgent": "Urgent/DKA",
        "on": "On",
        "off": "Off",
        "resultGenerated": "Result generated successfully. Open the dedicated report page for full clinical explanation.",
        "openReport": "Open Result Report",
        "submitHint": "Submit this assessment to generate diagnosis output.",
        "overview": "Assessment Overview",
        "profile": "Age / BMI / Waist",
        "glucose": "Glucose Tests",
        "symptoms": "Symptoms",
        "risks": "Risk Factors",
        "flags": "Flags"
      },
      "footer": {
        "continueHint": "Answer each section, then continue.",
        "resultReadyHint": "Diagnosis result is ready. You can adjust inputs and run again.",
        "reviewHint": "Check your summary, then run diagnosis.",
        "back": "Back",
        "next": "Next",
        "running": "Running...",
        "runAgain": "Run Again",
        "runExpertSystem": "Run Expert System",
        "newAssessment": "New Assessment"
      },
      "confirm": {
        "title": "Start New Assessment?",
        "description": "This will clear the current draft and result from this device. Continue only if you want to restart.",
        "cancel": "Cancel",
        "confirm": "Start New"
      },
      "modeLabels": {
        "diagnostic": "Diagnostic",
        "screening": "Screening"
      },
      "errors": {
        "loadPatients": "Failed to load patients for assessment",
        "enterLabName": "Enter a lab test name before adding.",
        "enterLabValue": "Enter a valid numeric lab value before adding.",
        "selectPatient": "Select a patient before continuing.",
        "ageRange": "Age must be between 0 and 120.",
        "bmiRange": "BMI must be between 10 and 80.",
        "waistRange": "Waist circumference must be between 30 and 250 cm.",
        "fastingRange": "Fasting glucose must be between 40 and 600.",
        "hba1cRange": "HbA1c must be between 3 and 20.",
        "randomRange": "Random glucose must be between 30 and 1000.",
        "submitFailed": "Assessment failed"
      },
      "risks": {
        "title": "Risk factors",
        "helper": "Do any of these apply to you?"
      }
    },
    "auth": {
      "loginTitle": "Welcome Back",
      "loginSub": "Sign in to your diabetes expert account",
      "emailLabel": "Email Address",
      "passwordLabel": "Password",
      "signInBtn": "Sign In",
      "noAccount": "Don't have an account?",
      "signUp": "Sign Up",
      "loginPageTitle": "Login",
      "loginPageSub": "Sign in to continue to your dashboard.",
      "emailPlaceholder": "Email address",
      "passwordPlaceholder": "Password",
      "rememberMe": "Remember me",
      "signingIn": "Signing in...",
      "login": "Login",
      "accentEyebrow": "Diabetes Expert System",
      "accentTitle": "Hello, Welcome!",
      "accentCopy": "Don't have an account yet? Create one to access diagnosis tools, patient history, and smarter follow-up care.",
      "register": "Register",
      "registerTitle": "Register",
      "registerSub": "Create your account and get started right away.",
      "firstName": "First Name",
      "lastName": "Last Name",
      "firstNamePlaceholder": "First name",
      "lastNamePlaceholder": "Last name",
      "confirmPassword": "Confirm Password",
      "confirmPasswordPlaceholder": "Confirm password",
      "agreeTerms": "I agree to the",
      "termsAndConditions": "Terms and Conditions",
      "creatingAccount": "Creating account...",
      "createAccount": "Create Account",
      "alreadyHaveAccount": "Already have an account?",
      "signIn": "Sign in",
      "secureAccess": "Secure Access",
      "welcomeBack": "Welcome Back!",
      "registerAccentCopy": "Already registered? Head back to the login screen and continue managing assessments, rules, and patient care.",
      "errorEmailPasswordRequired": "Email and password are required.",
      "errorLoginFailed": "Login failed",
      "errorAgreeTerms": "Please agree to the terms and conditions.",
      "errorPasswordMismatch": "Password and confirm password must match.",
      "errorRegistrationFailed": "Registration failed"
    },
    "publicPages": {
      "notFound": {
        "eyebrow": "Navigation",
        "title": "Page Not Found",
        "description": "The page you are looking for does not exist or has moved.",
        "backDashboard": "Back to Dashboard",
        "goLogin": "Go to Login"
      },
      "unauthorized": {
        "eyebrow": "Access Control",
        "title": "Unauthorized",
        "description": "You do not have permission to access this page.",
        "backDashboard": "Back to Dashboard",
        "goLogin": "Go to Login"
      }
    },
    "adminStats": {
      "totalUsers": "Total Users",
      "totalUsersDesc": "All registered accounts",
      "patients": "Patients",
      "patientsDesc": "Linked patient profiles",
      "diagnosisTotal": "Diagnosis Total",
      "diagnosisDesc": "Recorded diagnostic outcomes",
      "urgentCases": "Urgent Cases",
      "urgentCasesDesc": "Cases flagged for review"
    },
    "myResults": {
      "title": "My Results",
      "description": "Review diagnosis outcomes, certainty scores, and doctor annotations.",
      "columns": {
        "diagnosis": "Diagnosis",
        "certainty": "Certainty",
        "urgent": "Urgent",
        "reviewNote": "Review Note",
        "recommendation": "Recommendation",
        "time": "Time"
      },
      "loading": "Loading diagnosis history...",
      "emptyTitle": "No diagnosis submissions yet.",
      "latestExplanation": "Latest Explanation",
      "noExplanationTitle": "No explanation yet",
      "noExplanationDesc": "Explanation trace will appear after your first assessment.",
      "topConclusion": "Top Conclusion",
      "loadError": "Failed to load your diagnosis history"
    },
    "diagnosisResult": {
      "loading": "Loading diagnosis result...",
      "noResultTitle": "No assessment result found",
      "noResultDesc": "Run an assessment first, then the result report will appear here.",
      "backToAssessment": "Back to Assessment",
      "pageTitle": "Medical Assessment Report",
      "patient": "Patient",
      "generatedOn": "Generated on",
      "printPdf": "Print PDF",
      "restartConfirmTitle": "Restart Assessment?",
      "restartConfirmDesc": "This will clear the current assessment result and take you back to start a new assessment. Are you sure?",
      "restart": "Restart",
      "cancel": "Cancel",
      "diagnosticOutput": "Diagnostic Output",
      "probabilityBase": "Based on comprehensive clinical data, the inference engine calculates a ",
      "probabilityOf": " of this diagnosis.",
      "probability": {
        "veryHigh": "very high probability",
        "high": "high probability",
        "moderate": "moderate probability",
        "low": "low probability"
      },
      "overallScore": "Overall Score",
      "clinicalEvidence": "Clinical Evidence",
      "keyDiagnosticIndicators": "Key Diagnostic Indicators",
      "hba1cIndicator": "HbA1c Level Indicator",
      "hba1cSubtitle": "A key marker of long-term glucose control.",
      "fastingIndicator": "Fasting Glucose Indicator",
      "fastingSubtitle": "Indicates glucose level after an 8-hour fast.",
      "evidenceCompleteness": "Evidence Completeness",
      "availableLabs": "available labs:",
      "missing": "missing:",
      "none": "none",
      "relevantHistory": "Relevant History & Symptoms",
      "knownSymptoms": "Known symptoms includes:",
      "symptomAlign": "The patient's reported symptoms align with the matched diabetes pattern shown by the inference engine.",
      "noSymptom": "No prominent symptom pattern was selected.",
      "riskFactors": "Risk Factors",
      "knownHistory": "Known history includes:",
      "noRisk": "No risk factors were flagged in this submission.",
      "reasoningKeyRules": "Reasoning & Key Rules",
      "matchedRule": "Matched Rule",
      "ruleConditionMatched": "Rule condition matched.",
      "contribution": "Contribution",
      "noDetailedRule": "No detailed rule reasoning is available for this run.",
      "diagnosticReasoning": "Diagnostic Reasoning",
      "diagnosticReasoningP1": "The system compares this assessment against structured diabetes rules from symptom, laboratory, and risk-factor evidence.",
      "diagnosticReasoningP2": "Confidence is calculated from the strength and priority of matched rules, then adjusted by evidence completeness.",
      "diagnosticReasoningP3": "This output is a decision-support summary and should be reviewed with a qualified healthcare professional.",
      "actionableRecommendations": "Actionable Recommendations",
      "priority": "Priority",
      "rule": "Rule:",
      "noSpecificRecommendations": "No specific recommendations were generated. Please consult with a physician.",
      "factPreparation": "Fact Preparation",
      "factKey": "Fact Key",
      "source": "Source",
      "processedValue": "Processed Value",
      "savedResultActive": "Saved result snapshot is active for this account. Start a new assessment to replace it.",
      "viewAssessmentResults": "View your assessment results and recommendations above.",
      "back": "Back",
      "restartAssessment": "Restart Assessment",
      "currentPatient": "Current patient",
      "assessmentComplete": "Assessment complete! Your results have been saved.",
      "viewReport": "View Report →",
      "reviewBeforeSubmit": "Review your answers above, then click \"Run Assessment\" to get your results.",
      "labStatusHigh": "High",
      "labStatusElevated": "Elevated",
      "labStatusNormal": "Normal",
      "labStatusUnknown": "Unknown"
    },

    "sidebar": {
      "dashboard": "Dashboard",
      "assessment": "Health Assessment",
      "patients": "Patients",
      "knowledgeBase": "Knowledge Base",
      "ruleManagement": "Rule Management",
      "adminConsole": "Admin Console"
    }
  },
  "km": {
    "common": {
      "english": "អង់គ្លេស",
      "khmer": "ខ្មែរ",
      "language": "ភាសា",
      "notAvailable": "មិនមាន",
      "user": "អ្នកប្រើប្រាស់",
      "unknownUser": "មិនស្គាល់អ្នកប្រើប្រាស់",
      "noEmail": "គ្មានអ៊ីមែល",
      "role": "តួនាទី",
      "open": "បើក",
      "seeAll": "មើលទាំងអស់",
      "closeSidebar": "បិទរបារចំហៀង",
      "closeMenu": "បិទម៉ឺនុយ",
      "settings": "ការកំណត់",
      "getHelp": "ជំនួយ",
      "back": "ត្រឡប់ក្រោយ",
      "continue": "បន្តទៅមុខ",
      "selected": "បានជ្រើសរើស",
      "yes": "បាទ/ចាស",
      "noSelection": "មិនបានជ្រើសរើស",
      "logout": "ចាកចេញ"
    },
    "roles": {
      "user": "អ្នកប្រើប្រាស់",
      "patient": "អ្នកជំងឺ",
      "doctor": "វេជ្ជបណ្ឌិត",
      "admin": "អ្នកគ្រប់គ្រង",
      "super_admin": "អ្នកគ្រប់គ្រងជាន់ខ្ពស់"
    },
    "nav": {
      "dashboard": "ផ្ទាំងគ្រប់គ្រង",
      "assessment": "ការវាយតម្លៃ",
      "patients": "អ្នកជំងឺ",
      "knowledgeBase": "មូលដ្ឋានចំណេះដឹង",
      "patientReview": "ការពិនិត្យអ្នកជំងឺ",
      "myResults": "លទ្ធផលរបស់ខ្ញុំ",
      "users": "អ្នកប្រើប្រាស់",
      "roles": "តួនាទី",
      "workspace": "កន្លែងការងារ",
      "system": "ប្រព័ន្ធ",
      "documents": "ឯកសារ",
      "tools": "ឧបករណ៍"
    },
    "page": {
      "unauthorized": {
        "title": "គ្មានសិទ្ធិចូលប្រើ",
        "subtitle": "អ្នកមិនមានសិទ្ធិចូលប្រើធនធាននេះទេ"
      },
      "notFound": {
        "title": "រកមិនឃើញ",
        "subtitle": "រកមិនឃើញទំព័រដែលអ្នកស្នើសុំទេ"
      },
      "assessmentResult": {
        "title": "លទ្ធផលការវាយតម្លៃ",
        "subtitle": "សេចក្តីសង្ខេបគ្លីនិកដែលអាចអានបានពីលទ្ធផលវាយតម្លៃ"
      },
      "assessmentWorkspace": {
        "title": "កន្លែងវាយតម្លៃ",
        "subtitle": "ប្រមូលព័ត៌មានអ្នកជំងឺ និងដំណើរការវិភាគដោយប្រព័ន្ធជំនាញ"
      },
      "patientManagement": {
        "title": "ការគ្រប់គ្រងអ្នកជំងឺ",
        "subtitle": "ប្រវត្តិរូប រោគសញ្ញា លទ្ធផលបន្ទប់ពិសោធន៍ និងប្រវត្តិវិនិច្ឆ័យ"
      },
      "knowledgeBase": {
        "title": "មូលដ្ឋានចំណេះដឹង",
        "subtitle": "ការសរសេរក្បួន ប្រវត្តិ និងការគ្រប់គ្រង"
      },
      "clinicalReview": {
        "title": "ការពិនិត្យគ្លីនិក",
        "subtitle": "បន្ថែមកំណត់ចំណាំ និងចាត់អាទិភាពលទ្ធផលវិនិច្ឆ័យ"
      },
      "myDiagnosisResults": {
        "title": "លទ្ធផលវិនិច្ឆ័យរបស់ខ្ញុំ",
        "subtitle": "តាមដានប្រវត្តិវិនិច្ឆ័យ និងមតិយោបល់របស់អ្នក"
      },
      "users": {
        "title": "អ្នកប្រើប្រាស់",
        "subtitle": "គ្រប់គ្រងសិទ្ធិ តួនាទី និងស្ថានភាពគណនី"
      },
      "rolesPermissions": {
        "title": "តួនាទី និងសិទ្ធិ",
        "subtitle": "បង្កើតតួនាទី និងជ្រើសសិទ្ធិដែលត្រូវផ្តល់"
      },
      "dashboard": {
        "title": "ផ្ទាំងគ្រប់គ្រង",
        "subtitle": "ទិដ្ឋភាពសរុបតាមតួនាទី"
      }
    },
    "breadcrumbs": {
      "dashboard": "ផ្ទាំងគ្រប់គ្រង",
      "patientHistory": "ប្រវត្តិអ្នកជំងឺ",
      "ruleDetails": "ព័ត៌មានលម្អិតក្បួន",
      "reviewDetails": "ព័ត៌មានលម្អិតការពិនិត្យ",
      "details": "ព័ត៌មានលម្អិត"
    },
    "topbar": {
      "expandSidebar": "ពង្រីករបារចំហៀង",
      "collapseSidebar": "បង្រួមរបារចំហៀង",
      "openMenu": "បើកម៉ឺនុយ",
      "breadcrumb": "ផ្លូវរុករក",
      "newAssessment": "ចាប់ផ្តើមការវាយតម្លៃថ្មី",
      "switchToLightTheme": "ប្តូរទៅរចនាប័ទ្មភ្លឺ",
      "switchToDarkTheme": "ប្តូរទៅរចនាប័ទ្មងងឹត",
      "notifications": "ការជូនដំណឹង",
      "languageSwitcher": "ប្តូរភាសា",
      "profileSettings": "ការកំណត់",
      "logOut": "ចាកចេញ"
    },
    "patientDashboard": {
      "errors": {
        "loadFailed": "មិនអាចផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រងរបស់អ្នកបានទេ"
      },
      "hero": {
        "eyebrow": "ផ្ទាំងអ្នកជំងឺ",
        "welcomeBack": "សូមស្វាគមន៍ត្រឡប់មកវិញ {{name}}",
        "fallbackName": "អ្នកជំងឺ",
        "description": "ពិនិត្យលទ្ធផលចុងក្រោយ យល់ថាត្រូវធ្វើអ្វីបន្ទាប់ ហើយតាមដានប្រវត្តិថែទាំជំងឺទឹកនោមផ្អែមរបស់អ្នកឱ្យងាយស្រួល។",
        "startAssessment": "ចាប់ផ្តើមការវាយតម្លៃថ្មី",
        "viewHistory": "មើលប្រវត្តិទាំងមូល",
        "assessments": "ការវាយតម្លៃ",
        "assessmentsHint": "រក្សាទុកនៅក្នុងប្រវត្តិលទ្ធផលរបស់អ្នក",
        "latestConfidence": "កម្រិតទុកចិត្តចុងក្រោយ",
        "latestConfidenceHintFallback": "មិនទាន់មានការវិនិច្ឆ័យនៅឡើយ",
        "urgentFollowUp": "តាមដានបន្ទាន់",
        "latestSnapshot": "សេចក្តីសង្ខេបចុងក្រោយ",
        "noDiagnosisYet": "មិនទាន់មានលទ្ធផលវិនិច្ឆ័យនៅឡើយ",
        "snapshotFallback": "បំពេញការវាយតម្លៃមួយ ដើម្បីបង្កើតលទ្ធផលវិនិច្ឆ័យ និងការណែនាំជំហានបន្ទាប់។",
        "openFullResult": "បើកលទ្ធផលពេញលេញ"
      },
      "recentAssessments": {
        "title": "ការវាយតម្លៃថ្មីៗ",
        "description": "លទ្ធផលវិនិច្ឆ័យចុងក្រោយ និងសេចក្តីសង្ខេបអនុសាសន៍របស់អ្នក។",
        "loading": "កំពុងផ្ទុកការវាយតម្លៃរបស់អ្នក...",
        "emptyTitle": "មិនទាន់មានការវាយតម្លៃ",
        "emptyDescription": "សូមដាក់ស្នើការវាយតម្លៃលើកដំបូង ដើម្បីទទួលបានប្រវត្តិវិនិច្ឆ័យផ្ទាល់ខ្លួន និងការណែនាំតាមដាន។",
        "unknownDiagnosis": "មិនស្គាល់ការវិនិច្ឆ័យ",
        "confidence": "កម្រិតទុកចិត្ត",
        "urgent": "បន្ទាន់",
        "routine": "ធម្មតា",
        "noRecommendation": "មិនមានអនុសាសន៍ទេ។"
      },
      "carePlan": {
        "title": "ផែនការថែទាំ",
        "description": "អ្វីដែលសំខាន់បំផុតបន្ទាប់ពីការវាយតម្លៃចុងក្រោយរបស់អ្នក។",
        "emptyTitle": "មិនទាន់មានសេចក្តីសង្ខេបចុងក្រោយ",
        "emptyDescription": "នៅពេលអ្នកបញ្ចប់ការវាយតម្លៃ លទ្ធផលវិនិច្ឆ័យ និងផែនការតាមដានថ្មីបំផុតរបស់អ្នកនឹងបង្ហាញនៅទីនេះ។",
        "currentPriority": "អាទិភាពបច្ចុប្បន្ន",
        "urgentPriorityText": "លទ្ធផលចុងក្រោយរបស់អ្នកមានសញ្ញាបន្ទាន់។ សូមអនុវត្តអនុសាសន៍ឱ្យបានឆាប់ និងទាក់ទងវេជ្ជបណ្ឌិត ប្រសិនបើរោគសញ្ញាកាន់តែធ្ងន់។",
        "routinePriorityText": "លទ្ធផលចុងក្រោយរបស់អ្នកមិនមានសញ្ញាបន្ទាន់ទេ។ សូមបន្តតាមដាន និងអនុវត្តអនុសាសន៍ដែលបានផ្តល់។",
        "latestSummary": "សេចក្តីសង្ខេបចុងក្រោយ",
        "noDiagnosisAvailable": "មិនមានការវិនិច្ឆ័យទេ",
        "confidence": "កម្រិតទុកចិត្ត",
        "reviewNote": "កំណត់ចំណាំពិនិត្យ",
        "noDoctorNote": "មិនទាន់មានកំណត់ចំណាំពីវេជ្ជបណ្ឌិតទេ។"
      },
      "nextSteps": {
        "title": "ជំហានបន្ទាប់",
        "description": "សកម្មភាពសាមញ្ញៗ ដើម្បីឱ្យការថែទាំរបស់អ្នកនៅតាមផ្លូវត្រឹមត្រូវ។",
        "reviewHistoryTitle": "ពិនិត្យប្រវត្តិវិនិច្ឆ័យរបស់អ្នក",
        "reviewHistoryText": "តាមដានការផ្លាស់ប្តូរក្នុងការវិនិច្ឆ័យ កម្រិតបន្ទាន់ និងកម្រិតទុកចិត្ត រវាងលទ្ធផលចាស់ និងថ្មី។",
        "openHistory": "បើកប្រវត្តិ",
        "newAssessmentTitle": "ចាប់ផ្តើមការវាយតម្លៃថ្មី នៅពេលព័ត៌មានផ្លាស់ប្តូរ",
        "newAssessmentText": "ធ្វើការវាយតម្លៃម្តងទៀត នៅពេលរោគសញ្ញាផ្លាស់ប្តូរ មានលទ្ធផលបន្ទប់ពិសោធន៍ថ្មី ឬវេជ្ជបណ្ឌិតស្នើឱ្យធ្វើបច្ចុប្បន្នភាព។",
        "startAssessment": "ចាប់ផ្តើមការវាយតម្លៃ"
      },
      "status": {
        "noResultYet": "មិនទាន់មានលទ្ធផល",
        "needsAttention": "ត្រូវការការយកចិត្តទុកដាក់",
        "stable": "មានស្ថេរភាព"
      },
      "checklist": {
        "firstAssessment1": "បំពេញការវាយតម្លៃលើកដំបូង ដើម្បីបង្កើតសេចក្តីសង្ខេបវិនិច្ឆ័យ។",
        "firstAssessment2": "ត្រៀមលទ្ធផលបន្ទប់ពិសោធន៍ថ្មីៗឱ្យនៅជិតខ្លួន មុនចាប់ផ្តើមសំណួរ។",
        "firstAssessment3": "ត្រឡប់មកផ្ទាំងគ្រប់គ្រងវិញ ដើម្បីតាមដានការផ្លាស់ប្តូរលទ្ធផលនៅពេលក្រោយ។",
        "urgentRecommendation": "សូមអនុវត្តអនុសាសន៍បន្ទាន់ពីលទ្ធផលចុងក្រោយរបស់អ្នកឱ្យបានឆាប់តាមដែលអាចធ្វើទៅបាន។",
        "routineRecommendation": "សូមអនុវត្តអនុសាសន៍ចុងក្រោយពីលទ្ធផលថ្មីបំផុតរបស់អ្នក។",
        "compareHistory": "ប្រើប្រវត្តិលទ្ធផលរបស់អ្នក ដើម្បីប្រៀបធៀបការផ្លាស់ប្តូរក្នុងកម្រិតទុកចិត្ត និងការវិនិច្ឆ័យតាមពេលវេលា។",
        "prepareLabs": "ត្រៀមតេស្តបន្ទប់ពិសោធន៍ដែលខ្វះ មុនការវាយតម្លៃលើកក្រោយ ដើម្បីបង្កើនភាពជាក់លាក់។",
        "startWhenChanged": "ចាប់ផ្តើមការវាយតម្លៃថ្មី នៅពេលរោគសញ្ញា លទ្ធផលបន្ទប់ពិសោធន៍ ឬស្ថានភាពថ្នាំផ្លាស់ប្តូរ។"
      }
    },
    "assessment": {
      "healthAssessment": "ការវាយតម្លៃសុខភាព",
      "draftAutosaved": "សេចក្តីព្រាងត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ",
      "complete": "បានបញ្ចប់",
      "demoFill": "បំពេញសាកល្បង៖",
      "step": "ជំហាន",
      "answered": "បានឆ្លើយ",
      "closeBmiCalc": "បិទម៉ាស៊ីនគិតលេខ",
      "openBmiCalc": "ខ្ញុំមិនដឹង BMI ពិតប្រាកដរបស់ខ្ញុំទេ",
      "weightKg": "ទម្ងន់ (គីឡូក្រាម)",
      "heightCm": "កម្ពស់ (សង់ទីម៉ែត្រ)",
      "labHaveResults": "តើអ្នកមានលទ្ធផលពិសោធន៍ទេ?",
      "labHaveResultsSub": "តម្លៃមន្ទីរពិសោធន៍ជួយឱ្យការវិនិច្ឆ័យកាន់តែច្បាស់ — ប៉ុន្តែអ្នកអាចរំលងបាន",
      "exactValueMgDl": "តម្លៃពិតប្រាកដ (mg/dL)",
      "exactValuePercent": "តម្លៃពិតប្រាកដ (%)",
      "additionalLabTests": "តេស្តមន្ទីរពិសោធន៍បន្ថែម (ជម្រើស)",
      "testName": "ឈ្មោះតេស្ត",
      "value": "តម្លៃ",
      "add": "បន្ថែម",
      "remove": "ដកចេញ",
      "reviewSummary": "សេចក្តីសង្ខេបពិនិត្យ",
      "reviewSummarySub": "ពិនិត្យម្តងទៀតមុនដាក់ស្នើ",
      "footerHintContinue": "↓ បំពេញគ្រប់ផ្នែក រួចបន្តទៅមុខ",
      "footerHintSubmitted": "✅ ការវាយតម្លៃត្រូវបានដាក់ស្នើ",
      "footerHintReady": "🚀 រួចរាល់ក្នុងការដាក់ស្នើ",
      "criticalHigh": "គ្រោះថ្នាក់ខ្ពស់",
      "diabetesRange": "ក្នុងកម្រិតទឹកនោមផ្អែម",
      "preDiabetes": "មុនទឹកនោមផ្អែម",
      "normalRange": "កម្រិតធម្មតា",
      "valueMgDl": "តម្លៃ (mg/dL)",
      "extraPlaceholderText": "ឧ. រមួលជើង មាត់ស្ងួត ការឆ្លងរោគញឹកញាប់...",
      "steps": {
        "profile": {
          "title": "ប្រវត្តិរូប",
          "description": "ព័ត៌មានមូលដ្ឋានរបស់អ្នកជំងឺ"
        },
        "symptoms": {
          "title": "រោគសញ្ញា",
          "description": "រោគសញ្ញាដែលអ្នកកំពុងជួបប្រទះ"
        },
        "labs": {
          "title": "លទ្ធផលពិសោធន៍",
          "description": "កម្រិតស្ករ និងតម្លៃមន្ទីរពិសោធន៍"
        },
        "risks": {
          "title": "កត្តាហានិភ័យ",
          "description": "ហានិភ័យផ្នែករបៀបរស់នៅ និងវេជ្ជសាស្ត្រ"
        },
        "review": {
          "title": "ពិនិត្យ និងដាក់ស្នើ",
          "description": "ពិនិត្យព័ត៌មាន និងដំណើរការវិនិច្ឆ័យ"
        }
      },
      "options": {
        "age": {
          "under18": "ក្រោម 18 ឆ្នាំ",
          "age18to30": "18-30",
          "age31to45": "31-45",
          "age46to60": "46-60",
          "over60": "60 +"
        },
        "bmi": {
          "underweight": "ទម្ងន់ទាប",
          "normal": "ធម្មតា",
          "overweight": "លើសទម្ងន់",
          "obese": "ធាត់"
        },
        "waist": {
          "low": "ហានិភ័យទាប",
          "medium": "ហានិភ័យមធ្យម",
          "high": "ហានិភ័យខ្ពស់"
        },
        "ogtt": {
          "normal": "ធម្មតា",
          "prediabetes": "មុនទឹកនោមផ្អែម",
          "diabetes": "ទឹកនោមផ្អែម"
        }
      },
      "fields": {
        "symptoms": {
          "frequentUrination": "នោមញឹកញាប់",
          "excessiveThirst": "ស្រេកទឹកខ្លាំង",
          "fatigue": "អស់កម្លាំង",
          "blurredVision": "មើលមិនច្បាស់",
          "weightLoss": "ស្រកទម្ងន់ដោយមិនដឹងខ្លួន",
          "slowHealing": "របួសជាសះស្បើយយឺត",
          "nausea": "ចង់ក្អួត",
          "tinglingHandsFeet": "រមួលដៃជើង",
          "frequentInfections": "ការឆ្លងរោគញឹកញាប់",
          "acanthosisNigricans": "ស្នាមអុចខ្មៅលើស្បែក"
        },
        "safetySymptoms": {
          "sweating": "ចេញញើសខ្លាំង",
          "shaking": "ញ័ររន្ធត់",
          "dizziness": "វិលមុខ",
          "vomiting": "ក្អួត",
          "abdominalPain": "ឈឺពោះ"
        },
        "hypoglycemia": {
          "confusion": "ស្រពិចស្រពិល ឬពិបាកផ្តោតអារម្មណ៍",
          "palpitations": "បេះដូងលោតញាប់",
          "improvesWithSugar": "រោគសញ្ញាធូរស្រាលបន្ទាប់ពីទទួលស្ករ"
        },
        "urgent": {
          "nausea": "អាអួរ",
          "rapidBreathing": "ដកដង្ហើមលឿន ឬជ្រៅ",
          "unableToKeepFluids": "មិនអាចផឹកទឹក ឬរក្សារសារធាតុរាវបាន",
          "crisis": "មើលទៅឈឺធ្ងន់ ឬស្ថិតក្នុងវិបត្តិ"
        },
        "riskFactors": {
          "familyHistory": "ប្រវត្តិគ្រួសារ",
          "obesity": "ភាពធាត់ / លើសទម្ងន់",
          "hypertension": "សម្ពាធឈាមខ្ពស់",
          "sedentaryLifestyle": "មិនសូវមានសកម្មភាព",
          "gestationalHistory": "ប្រវត្តិទឹកនោមផ្អែមពេលមានផ្ទៃពោះ",
          "smoking": "អ្នកជក់បារី",
          "highCholesterol": "កូលេស្តេរ៉ុលខ្ពស់",
          "pcosHistory": "ប្រវត្តិជំងឺ PCOS",
          "ethnicityHighRisk": "ជាតិសាសន៍ហានិភ័យខ្ពស់"
        },
        "labs": {
          "fasting": {
            "normal": "ធម្មតា",
            "prediabetes": "មុនទឹកនោមផ្អែម",
            "diabetes": "ក្នុងកម្រិតទឹកនោមផ្អែម",
            "critical": "កម្រិតគ្រោះថ្នាក់"
          },
          "hba1c": {
            "normal": "ធម្មតា",
            "prediabetes": "មុនទឹកនោមផ្អែម",
            "diabetes": "ទឹកនោមផ្អែម",
            "critical": "ធ្ងន់ធ្ងរ"
          }
        }
      },
      "status": {
        "flow": "ដំណើរការវាយតម្លៃ",
        "complete": "បានបញ្ចប់ {{percent}}%",
        "stepCounter": "ជំហាន {{step}}/{{total}}",
        "analyzing": "កំពុងវិភាគ...",
        "runAssessment": "🔬 ដំណើរការវាយតម្លៃ",
        "runAgain": "ដំណើរការម្តងទៀត",
        "newAssessment": "វាយតម្លៃថ្មី"
      },
      "patient": {
        "title": "កំពុងវាយតម្លៃអ្នកណា?",
        "loading": "កំពុងផ្ទុកបញ្ជីអ្នកជំងឺ...",
        "selectPlaceholder": "ជ្រើសអ្នកជំងឺ",
        "noPatients": "មិនមានអ្នកជំងឺទេ",
        "noSelection": "មិនបានជ្រើសរើស"
      },
      "profile": {
        "ageTitle": "តើអ្នកមានអាយុប៉ុន្មាន?",
        "ageHelper": "ជ្រើសរើសចន្លោះអាយុ ឬបញ្ចូលអាយុពិតប្រាកដ",
        "exactAge": "ឬបញ្ចូលអាយុពិត",
        "bmiTitle": "សន្ទស្សន៍ម៉ាសរាងកាយ (BMI)",
        "exactBmi": "ជ្រើសរើសចន្លោះរបស់អ្នក ឬបញ្ចូលលេខ BMI",
        "waistTitle": "រង្វង់ចង្កេះ (ជម្រើស)",
        "exactWaist": "រង្វង់ចង្កេះជា សង់ទីម៉ែត្រ",
        "waistHelper": "ជួយរកឃើញភាពធាត់នៅជុំវិញពោះ ដែលជាកត្តាហានិភ័យសំខាន់នៃជំងឺទឹកនោមផ្អែម"
      },
      "symptoms": {
        "commonTitle": "រោគសញ្ញាទូទៅ",
        "commonHelper": "ជ្រើសរើសរោគសញ្ញាដែលអ្នកកំពុងមាន",
        "safetyTitle": "សញ្ញាព្រមាន",
        "safetyHelper": "ទាំងនេះជួយស្វែងរកជាតិស្ករទាប ឬករណីបន្ទាន់",
        "hypoglycemiaTitle": "សំណួរបន្ថែមអំពីជាតិស្ករទាប",
        "hypoglycemiaHelper": "បង្ហាញព្រោះបានជ្រើសញើសចេញខ្លាំង ញ័រ ឬវិលមុខ។",
        "urgentTitle": "សំណួរបន្ទាន់ / DKA",
        "urgentHelper": "បង្ហាញព្រោះបានរកឃើញក្អួត ឈឺពោះ ឬលំនាំជាតិស្ករខ្ពស់។",
        "extraTitle": "តើមានអ្វីផ្សេងទៀតទេ?",
        "extraHelper": "រៀបរាប់ពីរោគសញ្ញាបន្ថែម (ជម្រើស)",
        "extraPlaceholder": "ឧ. dry_mouth, tingling_feet"
      },
      "labs": {
        "availabilityTitle": "ភាពមានលទ្ធផលមន្ទីរពិសោធន៍",
        "noLabs": "ខ្ញុំមិនមានលទ្ធផលមន្ទីរពិសោធន៍ឥឡូវនេះទេ (បន្តក្នុងរបៀបស្គ្រីនីង)។",
        "currentMode": "របៀបបច្ចុប្បន្ន៖",
        "fastingTitle": "ជាតិស្ករពេលពោះទទេ",
        "rangeHelper": "អាចជ្រើសជួរជាមុន ហើយបញ្ចូលតម្លៃពិតជំនួសបន្ថែមបាន។",
        "exactFasting": "កម្រិតស្ករពេលអត់បាយពិត",
        "hba1cTitle": "HbA1c (កម្រិតមធ្យម ៣ ខែ)",
        "exactHba1c": "តម្លៃ HbA1c ពិត",
        "randomTitle": "ស្ករចៃដន្យ (ជាជម្រើស)",
        "randomLabel": "កម្រិតស្ករចៃដន្យក្នុងឈាម (mg/dL)",
        "additionalTitle": "តម្លៃមន្ទីរពិសោធន៍បន្ថែម",
        "labNamePlaceholder": "ឈ្មោះតេស្ត",
        "valuePlaceholder": "តម្លៃ",
        "add": "បន្ថែម",
        "remove": "ដកចេញ",
        "noAdditionalLabs": "មិនទាន់បានបន្ថែមតម្លៃមន្ទីរពិសោធន៍ទេ។",
        "title": "តើអ្នកមានលទ្ធផលពិសោធន៍ទេ?",
        "helper": "តម្លៃមន្ទីរពិសោធន៍ជួយឱ្យការវិនិច្ឆ័យកាន់តែច្បាស់",
        "noLabsAvailable": "ខ្ញុំមិនមានលទ្ធផលពិសោធន៍នៅពេលនេះទេ",
        "mode": "របៀប",
        "diagnosticMode": "🔬 ការធ្វើរោគវិនិច្ឆ័យ",
        "screeningMode": "📋 ការត្រួតពិនិត្យ",
        "fastingHelper": "mg/dL — ក្រោយពេលអត់អាហារ ៨ ម៉ោងឡើងទៅ",
        "hba1cHelper": "ភាគរយ — បញ្ជាក់ពីកម្រិតស្ករមធ្យម ២-៣ ខែចុងក្រោយ",
        "ogttTitle": "តេស្ត OGTT ២-ម៉ោង (ជម្រើស)",
        "ogttHelper": "mg/dL — វាស់ ២ ម៉ោងបន្ទាប់ពីទទួលស្ករ ៧៥ក្រាម",
        "rpgTitle": "ជាតិស្ករចៃដន្យ (ជម្រើស)",
        "rpgHelper": "mg/dL — នៅពេលណាក៏បាន មិនចាំបាច់អត់អាហារ"
      },
      "riskFactors": {
        "title": "បញ្ជីកត្តាហានិភ័យ",
        "helper": "ជ្រើសរាល់កត្តាហានិភ័យដែលមាន។"
      },
      "review": {
        "title": "ពិនិត្យរហ័សមុនវិភាគ",
        "helper": "សូមពិនិត្យសេចក្តីសង្ខេបនេះ មុនដំណើរការវិនិច្ឆ័យ។",
        "summaryTitle": "សេចក្តីសង្ខេបព័ត៌មានអ្នកជំងឺ",
        "patient": "អ្នកជំងឺ",
        "notSelected": "មិនទាន់ជ្រើស",
        "currentUser": "អ្នកប្រើប្រាស់បច្ចុប្បន្ន",
        "mode": "របៀប",
        "bodyMetrics": "អាយុ / ទម្ងន់រាងកាយ / រង្វង់ចង្កេះ",
        "glucoseTests": "តេស្តជាតិស្ករ (អត់បាយ / HbA1c / ចៃដន្យ)",
        "counts": "រោគសញ្ញា / កត្តាហានិភ័យ",
        "adaptiveFlags": "សញ្ញាបំបែកសំណួរឆ្លាតវៃ",
        "hypoglycemia": "ជាតិស្ករទាប",
        "urgent": "បន្ទាន់/DKA",
        "on": "បើក",
        "off": "បិទ",
        "resultGenerated": "បានបង្កើតលទ្ធផលដោយជោគជ័យ។ សូមបើកទំព័ររបាយការណ៍ ដើម្បីមើលសេចក្តីពន្យល់គ្លីនិកពេញលេញ។",
        "openReport": "បើករបាយការណ៍លទ្ធផល",
        "submitHint": "ដាក់ស្នើការវាយតម្លៃនេះ ដើម្បីបង្កើតលទ្ធផលវិនិច្ឆ័យ។",
        "overview": "ទិដ្ឋភាពទូទៅនៃការវាយតម្លៃ",
        "profile": "អាយុ / BMI / ចង្កេះ",
        "glucose": "តេស្តជាតិស្ករ",
        "symptoms": "រោគសញ្ញា",
        "risks": "កត្តាហានិភ័យ",
        "flags": "សញ្ញាសម្គាល់"
      },
      "footer": {
        "continueHint": "ឆ្លើយគ្រប់ផ្នែក ហើយបន្តទៅជំហានបន្ទាប់។",
        "resultReadyHint": "លទ្ធផលវិនិច្ឆ័យរួចរាល់ហើយ។ អ្នកអាចកែប្រែព័ត៌មាន ហើយដំណើរការម្តងទៀតបាន។",
        "reviewHint": "ពិនិត្យសេចក្តីសង្ខេបរបស់អ្នក រួចដំណើរការវិនិច្ឆ័យ។",
        "back": "ត្រឡប់ក្រោយ",
        "next": "បន្ទាប់",
        "running": "កំពុងដំណើរការ...",
        "runAgain": "ដំណើរការម្តងទៀត",
        "runExpertSystem": "ដំណើរការប្រព័ន្ធជំនាញ",
        "newAssessment": "ការវាយតម្លៃថ្មី"
      },
      "confirm": {
        "title": "ចាប់ផ្តើមការវាយតម្លៃថ្មី?",
        "description": "វានឹងលុបសេចក្តីព្រាង និងលទ្ធផលបច្ចុប្បន្នចេញពីឧបករណ៍នេះ។ បន្តតែបើអ្នកចង់ចាប់ផ្តើមសារជាថ្មីប៉ុណ្ណោះ។",
        "cancel": "បោះបង់",
        "confirm": "ចាប់ផ្តើមថ្មី"
      },
      "modeLabels": {
        "diagnostic": "វិនិច្ឆ័យ",
        "screening": "ស្គ្រីនីង"
      },
      "errors": {
        "loadPatients": "មិនអាចផ្ទុកបញ្ជីអ្នកជំងឺសម្រាប់ការវាយតម្លៃបានទេ",
        "enterLabName": "សូមបញ្ចូលឈ្មោះតេស្តមន្ទីរពិសោធន៍ មុនពេលបន្ថែម។",
        "enterLabValue": "សូមបញ្ចូលតម្លៃលេខត្រឹមត្រូវ មុនពេលបន្ថែម។",
        "selectPatient": "សូមជ្រើសអ្នកជំងឺ មុនបន្ត។",
        "ageRange": "អាយុត្រូវតែស្ថិតនៅចន្លោះ 0 ដល់ 120។",
        "bmiRange": "BMI ត្រូវតែស្ថិតនៅចន្លោះ 10 ដល់ 80។",
        "waistRange": "រង្វង់ចង្កេះត្រូវតែស្ថិតនៅចន្លោះ 30 ដល់ 250 សម។",
        "fastingRange": "កម្រិតស្ករពេលអត់បាយត្រូវតែស្ថិតនៅចន្លោះ 40 ដល់ 600។",
        "hba1cRange": "HbA1c ត្រូវតែស្ថិតនៅចន្លោះ 3 ដល់ 20។",
        "randomRange": "កម្រិតស្ករចៃដន្យត្រូវតែស្ថិតនៅចន្លោះ 30 ដល់ 1000។",
        "submitFailed": "ការវាយតម្លៃបរាជ័យ"
      },
      "risks": {
        "title": "កត្តាហានិភ័យ",
        "helper": "តើចំណុចទាំងនេះមានអនុវត្តចំពោះអ្នកដែរឬទេ?"
      },
      "extraPlaceholderText": "ឧ. រមួលជើង មាត់ស្ងួត ការឆ្លងរោគញឹកញាប់..."
    },
    "auth": {
      "loginTitle": "សូមស្វាគមន៍មកវិញ",
      "loginSub": "ចូលទៅក្នុងគណនីអ្នកជំនាញទឹកនោមផ្អែមរបស់អ្នក",
      "emailLabel": "អាសយដ្ឋានអ៊ីមែល",
      "passwordLabel": "ពាក្យសម្ងាត់",
      "signInBtn": "ចូលប្រើប្រាស់",
      "noAccount": "មិនទាន់មានគណនីមែនទេ?",
      "signUp": "ចុះឈ្មោះ",
      "loginPageTitle": "ចូលប្រើប្រាស់",
      "loginPageSub": "ចូលគណនីដើម្បីបន្តទៅផ្ទាំងគ្រប់គ្រងរបស់អ្នក។",
      "emailPlaceholder": "អាសយដ្ឋានអ៊ីមែល",
      "passwordPlaceholder": "ពាក្យសម្ងាត់",
      "rememberMe": "ចងចាំខ្ញុំ",
      "signingIn": "កំពុងចូល...",
      "login": "ចូលប្រើប្រាស់",
      "accentEyebrow": "ប្រព័ន្ធជំនាញទឹកនោមផ្អែម",
      "accentTitle": "សួស្តី សូមស្វាគមន៍!",
      "accentCopy": "មិនទាន់មានគណនីទេ? បង្កើតគណនីមួយ ដើម្បីទទួលបានសិទ្ធិប្រើឧបករណ៍វិនិច្ឆ័យ ប្រវត្តិអ្នកជំងឺ និងការថែទាំតាមដានដ៏ឆ្លាតវៃ។",
      "register": "ចុះឈ្មោះ",
      "registerTitle": "ចុះឈ្មោះ",
      "registerSub": "បង្កើតគណនីរបស់អ្នក ហើយចាប់ផ្តើមភ្លាម។",
      "firstName": "នាមខ្លួន",
      "lastName": "នាមត្រកូល",
      "firstNamePlaceholder": "នាមខ្លួន",
      "lastNamePlaceholder": "នាមត្រកូល",
      "confirmPassword": "បញ្ជាក់ពាក្យសម្ងាត់",
      "confirmPasswordPlaceholder": "បញ្ជាក់ពាក្យសម្ងាត់",
      "agreeTerms": "ខ្ញុំយល់ព្រមតាម",
      "termsAndConditions": "លក្ខខណ្ឌនៃការប្រើប្រាស់",
      "creatingAccount": "កំពុងបង្កើតគណនី...",
      "createAccount": "បង្កើតគណនី",
      "alreadyHaveAccount": "មានគណនីរួចហើយ?",
      "signIn": "ចូលប្រើប្រាស់",
      "secureAccess": "សិទ្ធិចូលប្រកបដោយសុវត្ថិភាព",
      "welcomeBack": "សូមស្វាគមន៍មកវិញ!",
      "registerAccentCopy": "បានចុះឈ្មោះរួចហើយ? ត្រឡប់ទៅទំព័រចូលប្រើប្រាស់ ហើយបន្តគ្រប់គ្រងការវាយតម្លៃ វិធាន និងការថែទាំអ្នកជំងឺ។",
      "errorEmailPasswordRequired": "ត្រូវការអ៊ីមែល និងពាក្យសម្ងាត់។",
      "errorLoginFailed": "ការចូលប្រើបរាជ័យ",
      "errorAgreeTerms": "សូមយល់ព្រមតាមលក្ខខណ្ឌនៃការប្រើប្រាស់។",
      "errorPasswordMismatch": "ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់ត្រូវតែត្រូវគ្នា។",
      "errorRegistrationFailed": "ការចុះឈ្មោះបរាជ័យ"
    },
    "publicPages": {
      "notFound": {
        "eyebrow": "ការរុករក",
        "title": "រកមិនឃើញទំព័រ",
        "description": "ទំព័រដែលអ្នកកំពុងរកមិនមាន ឬត្រូវបានផ្លាស់ប្តូរទីតាំង។",
        "backDashboard": "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង",
        "goLogin": "ទៅទំព័រចូលប្រើ"
      },
      "unauthorized": {
        "eyebrow": "ការគ្រប់គ្រងសិទ្ធិ",
        "title": "គ្មានសិទ្ធិចូលប្រើ",
        "description": "អ្នកមិនមានសិទ្ធិចូលមើលទំព័រនេះទេ។",
        "backDashboard": "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង",
        "goLogin": "ទៅទំព័រចូលប្រើ"
      }
    },
    "adminStats": {
      "totalUsers": "អ្នកប្រើប្រាស់សរុប",
      "totalUsersDesc": "គណនីដែលបានចុះឈ្មោះទាំងអស់",
      "patients": "អ្នកជំងឺ",
      "patientsDesc": "ប្រវត្តិរូបអ្នកជំងឺដែលបានភ្ជាប់",
      "diagnosisTotal": "ការវិនិច្ឆ័យសរុប",
      "diagnosisDesc": "លទ្ធផលវិនិច្ឆ័យដែលបានកត់ត្រា",
      "urgentCases": "ករណីបន្ទាន់",
      "urgentCasesDesc": "ករណីដែលទាមទារការត្រួតពិនិត្យ"
    },
    "myResults": {
      "title": "លទ្ធផលរបស់ខ្ញុំ",
      "description": "ពិនិត្យលទ្ធផលវិនិច្ឆ័យ ពិន្ទុកម្រិតទុកចិត្ត និងកំណត់ចំណាំពីវេជ្ជបណ្ឌិត។",
      "columns": {
        "diagnosis": "ការវិនិច្ឆ័យ",
        "certainty": "កម្រិតទុកចិត្ត",
        "urgent": "បន្ទាន់",
        "reviewNote": "កំណត់ចំណាំពិនិត្យ",
        "recommendation": "អនុសាសន៍",
        "time": "ពេលវេលា"
      },
      "loading": "កំពុងផ្ទុកប្រវត្តិវិនិច្ឆ័យ...",
      "emptyTitle": "មិនទាន់មានការវាយតម្លៃនៅឡើយទេ។",
      "latestExplanation": "ការពន្យល់ចុងក្រោយ",
      "noExplanationTitle": "មិនទាន់មានការពន្យល់នៅឡើយទេ",
      "noExplanationDesc": "ការពន្យល់លម្អិតនឹងបង្ហាញបន្ទាប់ពីអ្នកធ្វើការវាយតម្លៃលើកដំបូងរបស់អ្នក។",
      "topConclusion": "ការសន្និដ្ឋានចម្បង",
      "loadError": "មិនអាចផ្ទុកប្រវត្តិវិនិច្ឆ័យរបស់អ្នកបានទេ"
    },
    "diagnosisResult": {
      "loading": "កំពុងផ្ទុកលទ្ធផលវិនិច្ឆ័យ...",
      "noResultTitle": "រកមិនឃើញលទ្ធផលវាយតម្លៃទេ",
      "noResultDesc": "ធ្វើការវាយតម្លៃសិន រួចរបាយការណ៍លទ្ធផលនឹងបង្ហាញនៅទីនេះ។",
      "backToAssessment": "ត្រឡប់ទៅការវាយតម្លៃវិញ",
      "pageTitle": "របាយការណ៍វាយតម្លៃសុខភាព",
      "patient": "អ្នកជំងឺ",
      "generatedOn": "បង្កើតនៅថ្ងៃទី",
      "printPdf": "បោះពុម្ព PDF",
      "restartConfirmTitle": "ចាប់ផ្តើមការវាយតម្លៃឡើងវិញ?",
      "restartConfirmDesc": "វានឹងលុបលទ្ធផលវាយតម្លៃបច្ចុប្បន្ន ហើយនាំអ្នកត្រឡប់ទៅចាប់ផ្តើមការវាយតម្លៃថ្មី។ តើអ្នកប្រាកដទេ?",
      "restart": "ចាប់ផ្តើមឡើងវិញ",
      "cancel": "បោះបង់",
      "diagnosticOutput": "លទ្ធផលនៃការធ្វើរោគវិនិច្ឆ័យ",
      "probabilityBase": "ផ្អែកលើទិន្នន័យគ្លីនិកទាំងអស់ ប្រព័ន្ធវិភាគបានគណនាថាមាន ",
      "probabilityOf": " នៃការវិនិច្ឆ័យនេះ។",
      "probability": {
        "veryHigh": "ប្រូបាប៊ីលីតេខ្ពស់ខ្លាំង (very high probability)",
        "high": "ប្រូបាប៊ីលីតេខ្ពស់ (high probability)",
        "moderate": "ប្រូបាប៊ីលីតេមធ្យម (moderate probability)",
        "low": "ប្រូបាប៊ីលីតេទាប (low probability)"
      },
      "overallScore": "ពិន្ទុសរុប",
      "clinicalEvidence": "ភស្តុតាងគ្លីនិក",
      "keyDiagnosticIndicators": "សូចនាករវិនិច្ឆ័យសំខាន់ៗ",
      "hba1cIndicator": "សូចនាករ HbA1c",
      "hba1cSubtitle": "សូចនាករសំខាន់នៃការគ្រប់គ្រងជាតិស្កររយៈពេលវែង។",
      "fastingIndicator": "សូចនាករជាតិស្ករពេលអត់បាយ",
      "fastingSubtitle": "បង្ហាញកម្រិតជាតិស្ករបន្ទាប់ពីអត់អាហារ ៨ ម៉ោង។",
      "evidenceCompleteness": "កម្រិតភាពពេញលេញនៃភស្តុតាង",
      "availableLabs": "លទ្ធផលពិសោធន៍ដែលមាន៖",
      "missing": "ដែលខ្វះ៖",
      "none": "គ្មាន",
      "relevantHistory": "ប្រវត្តិ និងរោគសញ្ញាដែលពាក់ព័ន្ធ",
      "knownSymptoms": "រោគសញ្ញាដែលស្គាល់រួមមាន៖",
      "symptomAlign": "រោគសញ្ញាដែលអ្នកជំងឺបានរាយការណ៍ស្របនឹងលំនាំជំងឺទឹកនោមផ្អែមដែលបង្ហាញដោយប្រព័ន្ធវិភាគ។",
      "noSymptom": "មិនមានលំនាំរោគសញ្ញាលេចធ្លោត្រូវបានជ្រើសរើសទេ។",
      "riskFactors": "កត្តាហានិភ័យ",
      "knownHistory": "ប្រវត្តិដែលស្គាល់រួមមាន៖",
      "noRisk": "មិនមានកត្តាហានិភ័យត្រូវបានកត់សម្គាល់ក្នុងការដាក់ស្នើនេះទេ។",
      "reasoningKeyRules": "ការវិភាគ និងវិធានសំខាន់ៗ",
      "matchedRule": "វិធានដែលត្រូវគ្នា",
      "ruleConditionMatched": "លក្ខខណ្ឌវិធានត្រូវគ្នា។",
      "contribution": "ការរួមចំណែក",
      "noDetailedRule": "មិនមានការវិភាគវិធានលម្អិតសម្រាប់ការដំណើរការនេះទេ។",
      "diagnosticReasoning": "ការវិភាគរោគវិនិច្ឆ័យ",
      "diagnosticReasoningP1": "ប្រព័ន្ធប្រៀបធៀបការវាយតម្លៃនេះជាមួយវិធានជំងឺទឹកនោមផ្អែមដែលមានរចនាសម្ព័ន្ធ ពីភស្តុតាងរោគសញ្ញា មន្ទីរពិសោធន៍ និងកត្តាហានិភ័យ។",
      "diagnosticReasoningP2": "កម្រិតទុកចិត្តត្រូវបានគណនាពីកម្លាំង និងអាទិភាពនៃវិធានដែលត្រូវគ្នា រួចកែតម្រូវដោយភាពពេញលេញនៃភស្តុតាង។",
      "diagnosticReasoningP3": "លទ្ធផលនេះគឺជាសេចក្តីសង្ខេបជំនួយការសម្រេចចិត្ត ហើយគួរត្រូវបានពិនិត្យជាមួយអ្នកជំនាញសុខភាពមានសមត្ថភាព។",
      "actionableRecommendations": "អនុសាសន៍ដែលអាចអនុវត្តបាន",
      "priority": "អាទិភាព",
      "rule": "វិធាន៖",
      "noSpecificRecommendations": "មិនមានអនុសាសន៍ជាក់លាក់ត្រូវបានបង្កើតទេ។ សូមពិគ្រោះជាមួយគ្រូពេទ្យ។",
      "factPreparation": "ការរៀបចំទិន្នន័យ",
      "factKey": "គន្លឹះទិន្នន័យ",
      "source": "ប្រភព",
      "processedValue": "តម្លៃដែលបានដំណើរការ",
      "savedResultActive": "លទ្ធផលដែលបានរក្សាទុកកំពុងសកម្មសម្រាប់គណនីនេះ។ ចាប់ផ្តើមការវាយតម្លៃថ្មីដើម្បីជំនួសវា។",
      "viewAssessmentResults": "មើលលទ្ធផលនៃការវាយតម្លៃ និងអនុសាសន៍របស់អ្នកនៅខាងលើ។",
      "back": "ត្រឡប់ក្រោយ",
      "restartAssessment": "ចាប់ផ្តើមការវាយតម្លៃឡើងវិញ",
      "currentPatient": "អ្នកជំងឺបច្ចុប្បន្ន",
      "assessmentComplete": "ការវាយតម្លៃបានបញ្ចប់! លទ្ធផលរបស់អ្នកត្រូវបានរក្សាទុក។",
      "viewReport": "មើលរបាយការណ៍ →",
      "reviewBeforeSubmit": "ពិនិត្យចម្លើយរបស់អ្នកខាងលើ រួចចុច \"ដំណើរការវាយតម្លៃ\" ដើម្បីទទួលបានលទ្ធផល។",
      "labStatusHigh": "ខ្ពស់",
      "labStatusElevated": "ខ្ពស់ជាងធម្មតា",
      "labStatusNormal": "ធម្មតា",
      "labStatusUnknown": "មិនស្គាល់"
    },

    "sidebar": {
      "dashboard": "ផ្ទាំងគ្រប់គ្រង",
      "assessment": "ការវាយតម្លៃសុខភាព",
      "patients": "អ្នកជំងឺ",
      "knowledgeBase": "មូលដ្ឋានចំណេះដឹង",
      "ruleManagement": "គ្រប់គ្រងវិធាន",
      "adminConsole": "ផ្ទាំងបញ្ជា Admin"
    }
  }
}

function getNestedValue(object, path) {
  return path.split('.').reduce((value, segment) => (value == null ? undefined : value[segment]), object)
}

function interpolate(template, values) {
  if (!values || typeof values !== 'object') return template

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = rawKey.trim()
    return values[key] == null ? '' : String(values[key])
  })
}

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE
}

export function getLocaleForLanguage(language) {
  return normalizeLanguage(language) === 'km' ? 'km-KH' : 'en-US'
}

export function translate(language, key, valuesOrFallback, maybeValues) {
  const normalized = normalizeLanguage(language)
  const values = typeof valuesOrFallback === 'string' ? maybeValues : valuesOrFallback
  const fallback = typeof valuesOrFallback === 'string' ? valuesOrFallback : undefined
  const defaultMessage = getNestedValue(messages[DEFAULT_LANGUAGE], key)
  const localizedMessage = getNestedValue(messages[normalized], key)
  const resolved = localizedMessage ?? defaultMessage ?? fallback

  if (typeof resolved === 'string') {
    return interpolate(resolved, values)
  }

  return resolved ?? fallback ?? key
}
