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
      "logout": "Logout",
      "male": "Male",
      "female": "Female",
      "other": "Other",
      "unknown": "Unknown",
      "all": "All",
      "active": "Active",
      "inactive": "Inactive",
      "suspended": "Suspended",
      "showing": "Showing {{from}}-{{to}} of {{total}} results",
      "rows": "Rows",
      "previous": "Previous",
      "next": "Next",
      "confirm": "Confirm",
      "cancel": "Cancel",
      "confirmStatusChange": "Confirm account status change.",
      "disableAccount": "Disable user account?",
      "enableAccount": "Enable user account?",
      "disableDesc": "{{name}} will be marked inactive and will lose access until re-enabled.",
      "enableDesc": "{{name}} will be restored and allowed to sign in again.",
      "disableUser": "Disable User",
      "enableUser": "Enable User"
    },
    "auth": {
      "errorEmailPasswordRequired": "Email and password are required.",
      "errorLoginFailed": "Login failed",
      "accentEyebrow": "Diabetes Expert System",
      "accentTitle": "Hello, Welcome!",
      "accentCopy": "Don't have an account yet? Create one to access diagnosis tools, patient history, and smarter follow-up care.",
      "register": "Register",
      "loginPageTitle": "Login",
      "loginPageSub": "Sign in to continue to your dashboard.",
      "emailPlaceholder": "doctor@example.com",
      "fullNameLabel": "Full Name",
      "namePlaceholder": "Dr. John Doe",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Password",
      "confirmPasswordLabel": "Confirm Password",
      "rememberMe": "Remember me",
      "signingIn": "Signing in...",
      "login": "Login",
      "noAccount": "Don't have an account?",
      "signUp": "Sign Up",
      "regSubTitle": "Create your medical professional account.",
      "registerTitle": "Register",
      "registerSub": "Create your account and get started right away.",
      "firstName": "First Name",
      "firstNamePlaceholder": "First name",
      "lastName": "Last Name",
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
      "errorAgreeTerms": "Please agree to the terms and conditions.",
      "errorPasswordMismatch": "Password and confirm password must match.",
      "errorRegistrationFailed": "Registration failed"
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
      "carePlan": "Care Plan",
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
      "carePlan": {
        "title": "My Care Plan",
        "subtitle": "Your follow-up plan, doctor's notes, and progress in one place"
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
    "usersPage": {
      "hero": {
        "eyebrow": "User Management",
        "title": "Users",
        "description": "Manage team members, roles, and account access from one control surface.",
        "addUser": "Add User"
      },
      "insights": {
        "rolesTitle": "Users by Role",
        "rolesDesc": "Distribution across assigned roles.",
        "rulesTitle": "Rules by Status",
        "rulesDesc": "Current active versus archived rules.",
        "actionsTitle": "Top Actions (7d)",
        "actionsDesc": "Most common admin and auth events.",
        "noRoleData": "No role data",
        "noRoleDataDesc": "Role distribution appears when user stats are available.",
        "noRuleData": "No rule data",
        "noRuleDataDesc": "Rule status chart appears once rule stats are loaded.",
        "noActionData": "No action data",
        "noActionDataDesc": "Activity actions will be charted once events are available.",
        "usersCount": "Users",
        "eventsCount": "Events"
      },
      "table": {
        "searchPlaceholder": "Search users...",
        "columns": "Columns",
        "export": "Export",
        "visibleColumns": "Visible columns",
        "suspendedNotice": "Suspended accounts are not modeled separately in the current backend. Use Inactive to disable access.",
        "headers": {
          "name": "Name",
          "role": "Role",
          "access": "Access",
          "status": "Status",
          "lastActive": "Last Active",
          "actions": "Actions"
        },
        "states": {
          "loading": "Loading users...",
          "noneFound": "No users found",
          "noneFoundDesc": "Try another search or switch account status.",
          "permissions": "{{count}} permission",
          "permissions_plural": "{{count}} permissions"
        }
      },
      "editor": {
        "newAccount": "New Account",
        "editAccount": "Edit Account",
        "addUser": "Add User",
        "updateUser": "Update User",
        "createDesc": "Create a new system account and assign the initial role.",
        "editDesc": "Update account identity, role assignment, and access state.",
        "fields": {
          "fullName": "Full Name",
          "email": "Email",
          "password": "Password",
          "role": "Role",
          "status": "Account Status"
        },
        "actions": {
          "cancel": "Cancel",
          "saving": "Saving...",
          "createUser": "Create User",
          "saveChanges": "Save Changes"
        }
      },
      "notifications": {
        "creating": "Creating user...",
        "updating": "Saving user changes...",
        "createSuccess": "User created successfully.",
        "updateSuccess": "User updated successfully.",
        "disabling": "Disabling user...",
        "enabling": "Enabling user...",
        "statusSuccess": "User status updated successfully.",
        "exportSuccess": "User export downloaded.",
        "loadError": "Failed to load users",
        "updateError": "Failed to update user",
        "createError": "Failed to create user"
      }
    },
    "rolesPage": {
      "hero": {
        "title": "Roles & Permissions",
        "description": "Create custom roles and configure the permissions each role can access.",
        "newRole": "New Role"
      },
      "list": {
        "title": "Roles",
        "description": "Select a role to review its permissions or start a new custom role.",
        "loading": "Loading roles...",
        "emptyTitle": "No roles found",
        "emptyDescription": "Roles will appear here once they are available.",
        "userCount": "{{count}} user",
        "userCount_plural": "{{count}} users",
        "builtIn": "Built-in",
        "custom": "Custom",
        "newRole": "New Role"
      },
      "form": {
        "detailsTitle": "Role Details",
        "newRoleTitle": "New Role",
        "builtInNotice": "Built-in roles are read-only. Review permissions here, but create a new role to customize access.",
        "newRoleDesc": "Set the role name and choose the permissions that role should grant.",
        "roleName": "Role Name",
        "roleNamePlaceholder": "Enter role name",
        "permissions": "Permissions",
        "saving": "Saving...",
        "saveRole": "Save Role",
        "createRole": "Create Role",
        "noPermissionsTitle": "No permissions found",
        "noPermissionsDesc": "Permission options will appear here once they are available."
      },
      "groups": {
        "user": "Users",
        "permission": "Roles & Permissions",
        "patient": "Patients",
        "symptom": "Symptoms",
        "lab": "Lab Results",
        "rule": "Rules",
        "diagnosis": "Diagnosis"
      },
      "notifications": {
        "nameRequired": "Role name is required.",
        "permissionRequired": "Select at least one permission.",
        "saving": "Saving role...",
        "creating": "Creating role...",
        "saveSuccess": "Role updated successfully.",
        "createSuccess": "Role created successfully.",
        "loadError": "Failed to load roles and permissions",
        "saveError": "Failed to update role",
        "createError": "Failed to create role"
      }
    },
    "permissions": {
      "user": {
        "manage": "Manage users",
        "view": "View users"
      },
      "diagnosis": {
        "review_any": "Review all diagnosis results",
        "run": "Run diagnosis",
        "view_own": "View own diagnosis results"
      },
      "patient": {
        "manage": "Create and update patient records",
        "view_own": "View own patient record",
        "view": "View patient records"
      },
      "rule": {
        "manage": "Create and manage rules",
        "view": "View rules"
      },
      "lab": {
        "manage": "Create lab records",
        "view": "View lab history"
      },
      "permission": {
        "manage": "Create and update roles",
        "view": "View roles and permissions"
      },
      "symptom": {
        "manage": "Create symptom records",
        "view": "View symptom history"
      }
    },
    "userSidebar": {
      "userFallback": "User",
      "contact": "Contact",
      "noEmail": "No email",
      "accountId": "Account ID",
      "na": "N/A",
      "timeline": "Timeline",
      "created": "Created:",
      "updated": "Updated:",
      "effectivePermissions": "Effective Permissions",
      "noPermissions": "No permissions available for this role."
    },
    "time": {
      "noActivity": "No activity yet",
      "justNow": "Just now",
      "minAgo": "{{count}} min ago",
      "hourAgo": "{{count}} hour ago",
      "hoursAgo": "{{count}} hours ago",
      "dayAgo": "{{count}} day ago",
      "daysAgo": "{{count}} days ago"
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
      "profile": "Profile",
      "logOut": "Log out"
    },
    "profileSetup": {
      "stepProgress": "Step {{current}} of {{total}}",
      "stepLabel": "Step {{current}}/{{total}}",
      "welcome": "Hi {{name}} — let’s set up your health profile.",
      "footnote": "These answers replace the profile questions inside every assessment — less typing, more accuracy.",
      "step1": {
        "title": "About you",
        "description": "Two quick details so your assessments start pre-filled."
      },
      "step2": {
        "title": "Your body",
        "description": "Used to calculate your BMI automatically — no need to type it later."
      },
      "step3": {
        "title": "Health background",
        "description": "Optional — these feed the risk analysis only if they apply to you."
      },
      "genderLabel": "Gender",
      "genderMale": "Male",
      "genderFemale": "Female",
      "genderOther": "Other",
      "dobLabel": "Date of birth",
      "agePreview": "{{age}} years old",
      "heightLabel": "Height (cm)",
      "weightLabel": "Weight (kg)",
      "waistLabel": "Waist (cm)",
      "optional": "optional",
      "bmiPreview": "Your BMI: {{value}} — calculated automatically in every assessment.",
      "riskFamily": "Family history of diabetes",
      "riskHypertension": "High blood pressure",
      "riskCholesterol": "High cholesterol",
      "riskSmoking": "I smoke",
      "riskSedentary": "Mostly sedentary lifestyle",
      "privacyNote": "Only you and your care team can see this. You can change it anytime in your profile.",
      "back": "Back",
      "continue": "Continue",
      "finish": "Finish setup",
      "saving": "Saving...",
      "errors": {
        "gender": "Please choose a gender option.",
        "dob": "Please enter your date of birth.",
        "dobRange": "Please enter a valid date of birth.",
        "height": "Please enter a height between 80 and 250 cm.",
        "weight": "Please enter a weight between 20 and 400 kg.",
        "waist": "Please enter a waist between 40 and 200 cm.",
        "save": "Could not save your profile. Please try again."
      }
    },
    "profilePage": {
      "title": "Your profile",
      "subtitle": "Account details and the health profile your assessments pre-fill from.",
      "accountTitle": "Account",
      "healthTitle": "Health profile",
      "healthSubtitle": "Keep this up to date — every new assessment starts pre-filled from here.",
      "save": "Save changes",
      "saved": "Saved",
      "staffNote": "You are signed in as staff — the health profile section is only shown for patient accounts.",
      "loadFailed": "Could not load your health profile."
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
        "openFullResult": "Open full result",
        "greetingMorning": "Good morning, {{name}}!",
        "greetingAfternoon": "Good afternoon, {{name}}!",
        "greetingEvening": "Good evening, {{name}}!",
        "lastCheck": "Last check",
        "lastCheckToday": "Today",
        "lastCheckYesterday": "Yesterday",
        "lastCheckDaysAgo": "{{count}} days ago",
        "lastCheckNever": "No checks yet"
      },
      "situation": {
        "title": "Your situation",
        "newAssessment": "New assessment",
        "viewResults": "View my results",
        "stable": "Your latest assessment looks stable — keep up routine monitoring.",
        "urgent": "Your latest assessment was flagged for urgent follow-up.",
        "urgentReason": "Reason: {{reason}}",
        "noResult": "You haven't completed an assessment yet. Start your first one to see your situation here.",
        "ageLabel": "Age"
      },
      "health": {
        "title": "Health snapshot",
        "description": "Key body metrics from your latest assessment.",
        "latestFrom": "From your assessment on {{date}}",
        "bmi": "Body Mass Index (BMI)",
        "fastingGlucose": "Fasting blood glucose",
        "hba1c": "HbA1c",
        "catUnderweight": "Underweight",
        "catNormal": "Normal",
        "catOverweight": "Overweight",
        "catObese": "Obese",
        "catPrediabetes": "Prediabetes range",
        "catDiabetes": "Diabetes range",
        "notProvided": "Not provided",
        "bmiRangeHint": "Healthy: 18.5 – 24.9",
        "glucoseRangeHint": "Healthy (fasting): below 100 mg/dL",
        "a1cRangeHint": "Healthy: below 5.7%",
        "mgdlUnit": "mg/dL",
        "emptyTitle": "No health metrics yet",
        "emptyDescription": "Complete an assessment with your height, weight and lab values to see your BMI, glucose and HbA1c here.",
        "disclaimer": "Screening reference only — always confirm results with your clinician."
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
        "noDoctorNote": "No doctor note yet.",
        "reportedSymptoms": "Symptoms you reported",
        "noSymptoms": "No symptoms reported in your latest assessment.",
        "openFull": "Open care plan",
        "moreSymptoms": "+{{count}} more"
      },
      "report": {
        "title": "Health report",
        "description": "What your assessments show over time.",
        "activityTitle": "Assessment activity",
        "activityHint": "Assessments completed per month — last 6 months",
        "trendTitle": "Confidence trend",
        "trendHint": "Expert-system confidence for each assessment",
        "totalAssessments": "Total assessments",
        "urgentFlags": "Urgent flags",
        "lastCheck": "Last check",
        "latestConfidence": "Latest confidence",
        "emptyTitle": "Your report is waiting for data",
        "emptyDescription": "Complete assessments and this report fills itself in — activity, confidence trends, and key numbers over time.",
        "emptyCta": "Start my first assessment",
        "noTrendData": "Confidence appears once an assessment produces a diagnosis.",
        "confidenceUnit": "%"
      },
      "recommendations": {
        "title": "Recommended for you",
        "description": "Generated automatically from your latest assessment data.",
        "basisPrefix": "Based on: {{reason}}",
        "priorityNow": "Act now",
        "prioritySoon": "This week",
        "priorityHabit": "Daily habit",
        "basisUrgentFlag": "urgent flag on your latest result",
        "basisSymptoms": "your symptoms: {{symptoms}}",
        "basisGlucose": "glucose {{value}} mg/dL",
        "basisHba1c": "HbA1c {{value}}%",
        "basisBmi": "BMI {{value}}",
        "basisNoLabs": "no lab values on file",
        "basisSmoking": "smoking",
        "basisLastCheck": "last check {{days}} days ago",
        "basisHypertension": "hypertension flag",
        "basisRiskFactor": "your risk factors",
        "basisAssessmentCount": "{{count}} assessments so far",
        "urgentFollowUpTitle": "Contact a clinician promptly",
        "urgentFollowUpText": "Your latest assessment was flagged urgent. Don't wait — follow the recommendation and speak to a clinician as soon as you can.",
        "crisisSignsTitle": "Seek emergency care now",
        "crisisSignsText": "You reported warning signs ({{symptoms}}). These can indicate a dangerous glucose crisis — get urgent medical help immediately.",
        "hypoSignsTitle": "Know how to treat low blood sugar",
        "hypoSignsText": "Shakiness, sweating or dizziness can mean low blood sugar. If it happens, take fast-acting sugar (juice, glucose tablets) and tell your clinician.",
        "veryHighGlucoseTitle": "Your glucose is very high",
        "veryHighGlucoseText": "A reading of {{value}} mg/dL needs medical attention soon. Contact your clinician, drink water, and avoid sugary drinks for now.",
        "missingLabsTitle": "Add lab tests to unlock better insight",
        "missingLabsText": "Your assessments have no lab values yet. A fasting glucose and HbA1c test would make your reports and these recommendations far more accurate.",
        "diabetesRangeGlucoseTitle": "Discuss your glucose with a clinician",
        "diabetesRangeGlucoseText": "Your fasting glucose of {{value}} mg/dL is in the diabetes range. Book an appointment to confirm the result and plan next steps.",
        "prediabetesGlucoseTitle": "Reverse prediabetes with lifestyle",
        "prediabetesGlucoseText": "Your glucose of {{value}} mg/dL is in the warning range. Diet changes and regular movement now can bring it back to normal.",
        "a1cElevatedTitle": "Recheck your HbA1c every 3 months",
        "a1cElevatedText": "Your HbA1c of {{value}}% is above target. A check every 3 months shows whether your plan is actually working.",
        "weightManagementTitle": "Aim for gradual weight loss",
        "weightManagementText": "A BMI of {{value}} responds well to small changes: balanced portions and a daily walk. Even a 5% weight loss measurably improves glucose.",
        "underweightTitle": "Get nutrition support",
        "underweightText": "A BMI of {{value}} is below the healthy range. Focus on nutrient-rich meals and ask a professional about a safe plan to gain weight.",
        "symptomDiaryTitle": "Keep a symptom diary",
        "symptomDiaryText": "You reported {{count}} symptoms ({{symptoms}}). Note when they appear and how strong they feel — it helps your clinician spot patterns.",
        "quitSmokingTitle": "Quit smoking to protect your vessels",
        "quitSmokingText": "Smoking sharply raises the risk of diabetes complications. Ask your clinician about cessation support — it's one of the highest-impact changes you can make.",
        "reassessSoonTitle": "Time for a fresh assessment",
        "reassessSoonText": "Your last check was {{days}} days ago. Re-run the assessment to keep your report and trends up to date.",
        "bpMonitorTitle": "Check your blood pressure at home",
        "bpMonitorText": "You flagged hypertension. Measure twice a week at rest and bring the readings to your appointments.",
        "yearlyScreeningTitle": "Get screened every year",
        "yearlyScreeningText": "Your risk factors make yearly glucose checks important — even when you feel completely fine.",
        "buildHistoryTitle": "Build your health history",
        "buildHistoryText": "You've completed {{count}} assessment(s). Repeating the assessment monthly reveals trends and makes every report smarter.",
        "stayActiveTitle": "Move 150 minutes a week",
        "stayActiveText": "Brisk walking, cycling or swimming lowers glucose and improves insulin sensitivity. Start with 10-minute walks after meals.",
        "balancedDietTitle": "Keep your plate balanced",
        "balancedDietText": "Half vegetables, a quarter protein, a quarter whole grains — and water instead of sweet drinks. Simple habits, big effect on glucose."
      },
      "carePlanPage": {
        "loading": "Loading your care plan...",
        "loadFailed": "Failed to load your care plan",
        "hero": {
          "eyebrow": "Your care plan",
          "lastCheck": "Last check",
          "confidence": "Confidence",
          "assessments": "Assessments"
        },
        "onboarding": {
          "title": "Let's build your care plan",
          "description": "Three quick steps and everything below fills in with your own results.",
          "step1": "Complete a health assessment",
          "step1Text": "Answer questions about symptoms, lifestyle and lab values — it only takes a few minutes.",
          "step2": "Get your instant result",
          "step2Text": "The expert system analyses your answers and produces a readable diagnosis summary.",
          "step3": "Follow your personal plan",
          "step3Text": "Your checklist, doctor's notes and progress tracking appear here automatically.",
          "cta": "Start my first assessment"
        },
        "checklist": {
          "title": "Action checklist",
          "description": "Practical next steps based on your latest assessment.",
          "progress": "{{done}} of {{total}} completed",
          "completedTitle": "All done for now!",
          "completedText": "You've completed every step. Check back after your next assessment.",
          "reset": "Reset",
          "empty": "Complete an assessment to get your personal checklist."
        },
        "doctorNote": {
          "title": "Doctor's note",
          "empty": "No note from your doctor yet — notes appear here after a clinician reviews your result."
        },
        "watch": {
          "title": "Numbers to watch",
          "description": "Latest values from your assessments with healthy targets."
        },
        "safety": {
          "title": "Seek care urgently if",
          "item1": "You develop confusion, drowsiness or fainting",
          "item2": "You have rapid breathing with fruity-smelling breath",
          "item3": "Vomiting or diarrhoea stops you keeping fluids down",
          "item4": "A wound is red, swollen, or not healing",
          "item5": "Your symptoms suddenly get much worse",
          "footnote": "This list doesn't replace medical advice. In an emergency, call your local emergency number."
        },
        "history": {
          "title": "Assessment history",
          "description": "Every assessment you've completed, newest first.",
          "viewReport": "View report",
          "reviewed": "Doctor reviewed"
        },
        "symptoms": {
          "title": "Symptoms from your latest assessment"
        }
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
        "interview": {
          "title": "Evidence Interview",
          "description": "One question at a time — adapts to your answers"
        },
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
      "interview": {
        "finishNow": "Enough — see my result",
        "patientTitle": "Who is this assessment for?",
        "patientHelper": "Select the patient — answers we already know will be pre-filled.",
        "ageTitle": "How old are you?",
        "ageHelper": "Age changes the thresholds we screen with.",
        "agePlaceholder": "e.g. 42",
        "sexTitle": "What is your sex?",
        "sexHelper": "Biological sex — it decides which questions and thresholds apply.",
        "sexMale": "Male",
        "sexFemale": "Female",
        "sexOther": "Other",
        "pregnantTitle": "Are you currently pregnant?",
        "pregnantHelper": "Pregnancy uses stricter blood-sugar thresholds — I will adjust if so.",
        "stageTitle": "How far along are you?",
        "stageHelper": "Gestational diabetes is usually screened between weeks 24–28.",
        "stageFirst": "1st trimester (0–13 weeks)",
        "stageSecond": "2nd trimester (14–27 weeks)",
        "stageThird": "3rd trimester (28+ weeks)",
        "stageUnsure": "Not sure",
        "gdmPrevTitle": "Have you had gestational diabetes in a previous pregnancy?",
        "gdmPrevHelper": "A previous episode raises lifetime risk and means earlier testing this time.",
        "onsetTitle": "Did these symptoms come on suddenly?",
        "onsetHelper": "Sudden onset (days to weeks) points to type 1 diabetes; a slow build-up over months or years points to type 2.",
        "coreSymptomsTitle": "Which of these have you noticed recently?",
        "coreSymptomsHelper": "Select all that apply — or tap \"None of these\" if you feel fine.",
        "otherSymptomsTitle": "Any of these as well?",
        "otherSymptomsHelper": "Select all that apply — or tap \"None of these\".",
        "warningTitle": "Any of these warning signs right now?",
        "warningHelper": "These help detect low blood sugar or emergencies.",
        "riskTitle": "Do any of these apply to you?",
        "riskHelper": "Answers already known from your health profile are pre-ticked — you can change them.",
        "bodyTitle": "Height & weight",
        "bodyHelper": "I will calculate BMI automatically — or enter it directly if you know it.",
        "bmiIs": "Your BMI:",
        "orExactBmi": "Or enter BMI directly",
        "hasLabsTitle": "Do you have recent lab results?",
        "hasLabsHelper": "Lab values sharpen accuracy a lot — but the interview works without them.",
        "labsTitle": "Enter the lab values you have",
        "labsHelper": "Any one of these helps — everything is optional, and ranges work too.",
        "extraTitle": "Anything else to tell the clinician?",
        "extraHelper": "Something the questions did not cover — optional.",
        "noneOfThese": "None of these",
        "selectedCount": "selected",
        "answerYes": "Yes",
        "answerNo": "No",
        "skip": "Skip",
        "doneEditing": "Done",
        "insightPregnantTitle": "Pregnancy noted — adjusting what I check",
        "insightPregnantText": "Gestational diabetes is screened with stricter thresholds. A couple of pregnancy questions follow, and your labs will be read against pregnancy ranges.",
        "insightT1dTitle": "This pattern gets my attention",
        "insightT1dText": "Weight loss together with intense thirst and frequent urination can point to type 1 diabetes, which can develop quickly. This will be flagged for clinician review.",
        "insightTriadTitle": "The classic diabetes pattern",
        "insightTriadText": "Intense thirst, frequent urination and constant hunger together are the classic trio (polydipsia, polyuria, polyphagia) — high blood sugar pulls water out of your body. The next questions help me tell which type fits.",
        "insightT2Title": "Slow build-up — type 2 pattern",
        "insightT2Text": "Symptoms that build up over months usually point to type 2 diabetes, where the body still makes insulin but resists it. Signs like dark skin patches, tingling and slow healing matter most here.",
        "insightChildTitle": "In children this pattern is urgent",
        "insightChildText": "Sudden thirst and urination in a child — especially with new bed-wetting — is a strong type 1 signal. A finger-prick glucose check today is the fastest way to know.",
        "insightDkaTitle": "Possible emergency — please read",
        "insightKetosisTitle": "Ketone warning signs",
        "insightKetosisText": "Fruity breath or deep, rapid breathing can mean ketones are building up — a sign of insulin shortage. Combined with feeling unwell, this needs urgent medical attention.",
        "insightDkaText": "Vomiting or stomach pain with high blood sugar can signal diabetic ketoacidosis (DKA) — a medical emergency. If you feel very unwell right now, seek urgent care first; this assessment can wait.",
        "insightHypoTitle": "Possible low blood sugar signs",
        "insightHypoText": "Shakiness, sweating or dizziness can mean low blood sugar. If you have a glucose meter, a reading taken now would be valuable evidence.",
        "childProbeTitle": "Any new bed-wetting at night?",
        "childProbeHelper": "In children, new bed-wetting with extra thirst or urination is the strongest type 1 signal.",
        "t2ProbeTitle": "Any of these insulin-resistance signs?",
        "t2ProbeHelper": "With a slow build-up, these signs strongly point to the type 2 pattern.",
        "insightShortcutTitle": "Skipping the lab questions — here is why",
        "insightShortcutText": "With the signs you reported, the next step is the same no matter what a lab would say: get checked by a doctor today. I skipped the lab questions to save you time — finish the rest so your report is complete for the clinician.",
        "answeredLabel": "Answered:",
        "questionN": "Question",
        "allAnsweredTitle": "All questions answered",
        "allAnsweredText": "Review your evidence, then run the assessment.",
        "goReview": "Review & Run",
        "editAnswers": "Edit interview answers",
        "pregnantShort": "Pregnant",
        "notPregnant": "Not pregnant"
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
          "acanthosisNigricans": "Dark skin patches",
          "excessiveHunger": "Feeling very hungry",
          "irritability": "Irritability / mood changes",
          "recurrentUtiYeast": "Recurring UTIs / yeast infections",
          "bedWetting": "New bed-wetting (children)"
        },
        "safetySymptoms": {
          "sweating": "Sweating episodes",
          "shaking": "Shaking / tremor",
          "dizziness": "Dizziness",
          "vomiting": "Vomiting",
          "abdominalPain": "Stomach pain",
          "fruityBreath": "Fruity / acetone breath",
          "deepRapidBreathing": "Deep, rapid breathing"
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
        "sexPregnancy": "Sex / Pregnancy",
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
      "diagnosticOutput": "Assessment result",
      "suspectedType": "Suspected type",
      "type": {
        "type1": "Type 1 pattern",
        "type2": "Type 2 pattern",
        "gestational": "Gestational pattern",
        "mixed": "Mixed features",
        "undetermined": "Undetermined"
      },
      "probabilityBase": "Based on comprehensive clinical data, the inference engine calculates a ",
      "probabilityOf": " of this diagnosis.",
      "probability": {
        "veryHigh": "very high probability",
        "high": "high probability",
        "moderate": "moderate probability",
        "low": "low probability"
      },
      "overallScore": "Screening Confidence",
      "clinicalEvidence": "The evidence behind this result",
      "keyDiagnosticIndicators": "Your lab results",
      "hba1cIndicator": "HbA1c — 3-month average",
      "hba1cSubtitle": "A key marker of long-term glucose control.",
      "fastingIndicator": "Fasting glucose — after an 8-hour fast",
      "fastingSubtitle": "Indicates glucose level after an 8-hour fast.",
      "evidenceCompleteness": "How complete is this information?",
      "availableLabs": "Provided:",
      "missing": "Not provided:",
      "none": "none",
      "relevantHistory": "Your symptoms",
      "knownSymptoms": "You reported:",
      "symptomAlign": "The patient's reported symptoms align with the matched diabetes pattern shown by the inference engine.",
      "noSymptom": "No prominent symptom pattern was selected.",
      "riskFactors": "Your risk factors",
      "knownHistory": "Your history:",
      "noRisk": "No risk factors were flagged in this submission.",
      "reasoningKeyRules": "Matched rules — technical",
      "matchedRule": "Matched Rule",
      "ruleConditionMatched": "Rule condition matched.",
      "contribution": "Contribution",
      "noDetailedRule": "No detailed rule reasoning is available for this run.",
      "diagnosticReasoning": "Diagnostic Reasoning",
      "diagnosticReasoningP1": "The system compares this assessment against structured diabetes rules from symptom, laboratory, and risk-factor evidence.",
      "diagnosticReasoningP2": "Confidence is calculated from the strength and priority of matched rules, then adjusted by evidence completeness.",
      "diagnosticReasoningP3": "This output is a decision-support summary and should be reviewed with a qualified healthcare professional.",
      "actionableRecommendations": "What you should do next",
      "urgentTag": "Urgent",
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
      "couldFit": "Could fit:",
      "plainSummary": {
        "title": "In short",
        "whatThisIs": "This report compares your answers with common patterns of diabetes. It is a screening — not a final diagnosis. A doctor and a simple test can confirm.",
        "matchedMany": "Your answers matched {{count}} common sign(s) associated with high blood sugar.",
        "matchedFew": "This run included little direct evidence — the result leans on general risk patterns.",
        "typeFit": "The pattern fits {{type}}.",
        "couldFitTwo": "The signs could fit {{first}} ({{firstPercent}}%) or {{second}} ({{secondPercent}}%) — the first steps are the same either way.",
        "noType": "No single diabetes type pattern stood out yet.",
        "nextStep": "Next step:"
      },
      "symptomGuide": {
        "items": {
          "excessiveThirst": { "term": "Polydipsia", "meaning": "Can occur when blood glucose is high — the body pulls water to dilute the sugar." },
          "frequentUrination": { "term": "Polyuria", "meaning": "Often accompanies high blood glucose — the kidneys flush out the extra sugar." },
          "excessiveHunger": { "term": "Polyphagia", "meaning": "Can occur when glucose cannot effectively enter cells." },
          "weightLoss": { "term": "Catabolic weight loss", "meaning": "The body burns fat and muscle for energy when glucose can't enter cells." },
          "fatigue": { "term": "Asthenia", "meaning": "Cells don't get enough glucose for energy." },
          "blurredVision": { "term": "Lens swelling", "meaning": "High glucose draws water into the eye's lens, blurring focus." },
          "slowHealing": { "term": "Impaired wound healing", "meaning": "High glucose slows blood flow and weakens immune repair." },
          "tingling": { "term": "Peripheral neuropathy", "meaning": "High glucose can irritate small nerve fibres over time." },
          "frequentInfections": { "term": "Recurrent infections", "meaning": "High glucose weakens the immune system's defences." },
          "acanthosisNigricans": { "term": "Acanthosis nigricans", "meaning": "Dark, velvety skin patches — commonly linked with insulin resistance." },
          "irritability": { "term": "Mood changes", "meaning": "Blood sugar swings can affect mood and concentration." },
          "recurrentInfections": { "term": "Recurrent UTI / yeast infections", "meaning": "Glucose in urine feeds bacteria and yeast." },
          "bedWetting": { "term": "Nocturnal enuresis", "meaning": "Extra glucose pulls more water — a classic Type 1 sign in children." },
          "fruityBreath": { "term": "Ketone breath", "meaning": "Possible diabetic ketoacidosis (DKA) — seek care urgently." },
          "deepRapidBreathing": { "term": "Kussmaul breathing", "meaning": "The body tries to release ketone acids — seek care urgently." },
          "nausea": { "term": "Nausea", "meaning": "Can occur when blood glucose or ketones are very high." },
          "vomiting": { "term": "Vomiting", "meaning": "With very high glucose this can signal DKA — seek care urgently." },
          "abdominalPain": { "term": "Abdominal pain", "meaning": "With very high glucose this can signal DKA — seek care urgently." },
          "sweating": { "term": "Diaphoresis", "meaning": "Can be a warning sign of low blood sugar (hypoglycemia)." },
          "shaking": { "term": "Tremor", "meaning": "Common warning sign of low blood sugar (hypoglycemia)." },
          "dizziness": { "term": "Dizziness", "meaning": "Can come from low — or very high — blood sugar." }
        }
      },
      "whyResult": {
        "title": "Why this result?",
        "toldUs": "What you told us",
        "measured": "Lab values you provided",
        "missingTitle": "Checks that would help most",
        "noSymptoms": "No symptoms or risk factors were reported in this assessment.",
        "noLabs": "No lab values were provided — the result is based on your reported answers only.",
        "allProvided": "All recommended checks were provided.",
        "summaryPrefix": "The system matched",
        "summarySuffix": "piece(s) of information from your assessment.",
        "limitedNote": "This result is based on limited information — the missing checks above would make it noticeably more reliable."
      },
      "technical": {
        "title": "Technical details — clinician view",
        "subtitle": "Raw rule-matching trace used by the inference engine. Patients can safely ignore this section."
      },
      "labStatusHigh": "High",
      "labStatusElevated": "Elevated",
      "labStatusNormal": "Normal",
      "labStatusUnknown": "Unknown",
      "education": {
        "titlePrefix": "Understanding",
        "whatTitle": "What is it?",
        "symptomsTitle": "Common symptoms",
        "careTitle": "Treatment & care",
        "learnMore": "Full guide on MedlinePlus",
        "disclaimer": "Educational background only — always follow your healthcare provider's advice.",
        "conditions": {
          "general": {
            "name": "diabetes",
            "tagline": "Blood sugar stays too high when the body can't make or use insulin well.",
            "what": [
              "Insulin moves glucose (sugar) from your blood into your cells for energy.",
              "With diabetes, the body makes little or no insulin, can't use it well, or both — so glucose builds up in the blood.",
              "Over time, high blood glucose can harm the heart, kidneys, eyes, and nerves.",
              "It can be managed — early treatment lowers the risk of complications."
            ],
            "symptoms": [
              "Feeling very thirsty or very hungry",
              "Urinating more often, including at night",
              "Tired all the time; blurry vision",
              "Tingling or numb feet; sores that heal slowly"
            ],
            "care": [
              "Confirm with lab tests: A1C, fasting glucose, or an oral glucose tolerance test.",
              "Eat well, stay physically active, and keep a healthy weight.",
              "Take prescribed medicines and monitor blood sugar as directed.",
              "Get regular checkups for eyes, kidneys, nerves, and feet."
            ]
          },
          "type1": {
            "name": "Type 1 diabetes",
            "tagline": "An autoimmune condition — the body makes little or no insulin.",
            "what": [
              "The immune system mistakenly attacks the pancreas cells that make insulin.",
              "Without insulin, glucose builds up in the blood instead of feeding your cells.",
              "It often starts in children, teens, or young adults — but can appear at any age.",
              "It is not caused by lifestyle, and it cannot be prevented."
            ],
            "symptoms": [
              "Very thirsty, very hungry, urinating often (including at night)",
              "Losing weight without trying; tired all the time",
              "Blurry vision; tingling in feet or hands",
              "Emergency signs: deep rapid breathing, fruity breath, vomiting, stomach pain — seek care immediately"
            ],
            "care": [
              "Daily insulin for life, by injection or an insulin pump.",
              "Check blood glucose regularly (fingerstick or a wearable sensor).",
              "Match insulin to food (carbohydrate counting) and activity.",
              "Regular clinic visits to adjust doses and screen for complications."
            ]
          },
          "type2": {
            "name": "Type 2 diabetes",
            "tagline": "The most common type — the body resists insulin.",
            "what": [
              "Cells don't respond to insulin normally (insulin resistance), so glucose stays in the blood.",
              "It develops slowly over years — many people feel fine at first.",
              "Risk rises with excess weight, low activity, age over 35–45, and family history.",
              "Healthy habits can control it — and sometimes prevent or delay it."
            ],
            "symptoms": [
              "Often no early symptoms — screening matters.",
              "Increased thirst, urination, and hunger",
              "Feeling tired; blurred vision",
              "Numb or tingling hands and feet; sores that heal slowly"
            ],
            "care": [
              "Healthy eating, regular activity, and weight management come first.",
              "Medicines such as metformin are common; insulin can be added later.",
              "Monitor blood glucose and A1C as your provider advises.",
              "Yearly checks of eyes, kidneys, nerves, feet, and heart."
            ]
          },
          "gestational": {
            "name": "gestational diabetes",
            "tagline": "High blood sugar that develops during pregnancy.",
            "what": [
              "Pregnancy hormones can block insulin, so blood sugar rises.",
              "It usually appears midway through pregnancy and is found by screening at 24–28 weeks.",
              "Most women feel no symptoms — that is why testing matters.",
              "It often goes away after delivery, but it raises the chance of type 2 diabetes later."
            ],
            "symptoms": [
              "Usually none — detected by routine prenatal testing",
              "Mild increased thirst or shakiness",
              "Sometimes fatigue, blurred vision, or frequent infections"
            ],
            "care": [
              "A healthy meal plan and regular gentle activity.",
              "Check blood sugar at home as your provider directs.",
              "Insulin or safe medicines if diet alone isn't enough.",
              "Extra monitoring of the baby, and a glucose test after delivery."
            ]
          },
          "prediabetes": {
            "name": "prediabetes",
            "tagline": "Blood sugar is above normal — but not diabetes yet.",
            "what": [
              "Glucose is higher than normal (A1C 5.7–6.4% or fasting 100–125 mg/dL).",
              "Usually there are no clear symptoms — it is found through testing.",
              "Without changes, it often progresses to type 2 diabetes.",
              "Acting now can delay or even prevent type 2 diabetes."
            ],
            "symptoms": [
              "Most people feel completely normal",
              "Some notice darkened, velvety skin patches on the neck or under the arms"
            ],
            "care": [
              "Losing 5–7% of body weight greatly lowers the risk.",
              "Aim for about 150 minutes of brisk activity each week.",
              "Choose more vegetables, whole grains, and lean protein.",
              "Recheck blood sugar at least once a year."
            ]
          }
        }
      }
    },

    "sidebar": {
      "dashboard": "Dashboard",
      "assessment": "Health Assessment",
      "patients": "Patients",
      "knowledgeBase": "Knowledge Base",
      "ruleManagement": "Rule Management",
      "adminConsole": "Admin Console"
    },
    "rules": {
      "tabs": {
        "overview": "Overview",
        "editor": "Rule Editor",
        "visual": "Visual Graph",
        "sandbox": "Sandbox"
      },
      "dashboard": {
        "visualLogicGraph": "Visual Logic Graph",
        "visualizingRule": "Visualizing rule:",
        "unnamedRule": "Unnamed Rule",
        "saveRule": "Save Rule",
        "saving": "Saving...",
        "knowledgeBaseRules": "Knowledge Base Rules",
        "filterSelectReview": "Filter and select a rule to review versions and edit conditions.",
        "searchPlaceholder": "Search rules by name, category, or conclusion...",
        "allCategories": "All categories",
        "allStatuses": "All statuses",
        "includeArchived": "Include archived",
        "reset": "Reset",
        "columns": {
          "name": "Name",
          "category": "Category",
          "status": "Status",
          "priority": "Priority",
          "version": "Version"
        },
        "loadingRules": "Loading rules...",
        "noRulesSearch": "No rules match your search.",
        "noRulesFound": "No rules found."
      },
      "editor": {
        "editRule": "Edit Rule",
        "createRule": "Create Rule",
        "subtitle": "Write simple clinical logic for doctors. Example: if fasting glucose is 126 or higher, set diabetes possible.",
        "newRule": "New Rule",
        "unarchive": "Unarchive",
        "restoring": "Restoring...",
        "archive": "Archive",
        "ruleName": "Rule Name",
        "category": "Category",
        "conclusion": "Conclusion",
        "conditions": "Conditions",
        "addCondition": "+ Add Condition",
        "expectedValue": "Expected value",
        "remove": "Remove",
        "certaintyFactor": "Certainty Factor",
        "priority": "Priority",
        "status": "Status",
        "explanation": "Explanation",
        "recommendation": "Recommendation",
        "notes": "Notes",
        "updateRule": "Update Rule"
      },
      "history": {
        "ruleVersions": "Rule Versions",
        "selectRuleToViewVersions": "Select a rule to view versions.",
        "columns": {
          "version": "Version",
          "change": "Change",
          "by": "By",
          "time": "Time"
        },
        "noVersionHistory": "No version history found.",
        "auditTrail": "Audit Trail",
        "selectRuleToViewAudit": "Select a rule to view audit logs.",
        "auditColumns": {
          "action": "Action",
          "by": "By",
          "time": "Time"
        }
      },
      "dropdowns": {
        "active": "Active",
        "inactive": "Inactive",
        "archived": "Archived",
        "low": "Low",
        "medium": "Medium",
        "high": "High"
      }
    },
    "kbDashboard": {
      "ranges": {
        "last7Days": "Last 7 Days",
        "last30Days": "Last 30 Days",
        "last90Days": "Last 90 Days",
        "thisYear": "This Year",
        "allTime": "All Time"
      },
      "refresh": "Refresh",
      "loading": "Loading analytics...",
      "cards": {
        "engineExecutions": {
          "title": "Engine Executions",
          "trend": "+12% from previous"
        },
        "avgRules": {
          "title": "Avg. Rules Triggered",
          "desc": "Per assessment",
          "trend": "Stable"
        },
        "activeRules": {
          "title": "Active Rules",
          "desc": "System-wide logic",
          "trend": "+2 this month"
        },
        "accuracy": {
          "title": "System Accuracy",
          "desc": "Estimated match rate",
          "trend": "+0.5% optimization"
        }
      },
      "ruleDistribution": "Rule Distribution",
      "topTriggeredRules": "Top Triggered Rules",
      "columns": {
        "rank": "Rank",
        "ruleName": "Rule Name",
        "category": "Category",
        "hits": "Hits"
      },
      "recentCases": {
        "title": "Recent Cases",
        "desc": "Latest {{count}} diagnoses evaluated by the system.",
        "viewAll": "View All",
        "columns": {
          "patient": "Patient",
          "diagnosis": "Diagnosis",
          "assessedBy": "Assessed By",
          "time": "Time",
          "status": "Status"
        },
        "system": "System",
        "reviewed": "Reviewed",
        "pending": "Pending",
        "noCases": "No recent cases found in the selected timeframe."
      }
    },
    "dashboard": {
      "hero": {
        "dashboardTitle": "{{role}} dashboard",
        "title": "Build Better Diabetes Care Pathways",
        "desc": "Monitor screening trends, review rule-driven outcomes, and coordinate medical follow-ups from one unified clinical dashboard.",
        "startAssessment": "Start Assessment",
        "openPatients": "Open Patients"
      },
      "toolbar": {
        "dateRange": "Date Range",
        "refresh": "Refresh"
      },
      "kpi": {
        "clickToView": "Click to view details →",
        "assessments": "Assessments",
        "activePatients": "Active Patients",
        "totalRegistered": "Total registered",
        "urgentCases": "Urgent Cases",
        "awaitingReview": "Awaiting review",
        "treatmentPlans": "Treatment Plans",
        "allTime": "All Time"
      },
      "recent": {
        "title": "Recent Cases",
        "desc": "Latest {{count}} diagnoses awaiting review or recently completed.",
        "viewAll": "View All",
        "columns": {
          "patient": "Patient",
          "diagnosis": "Diagnosis",
          "assessedBy": "Assessed By",
          "status": "Status",
          "date": "Date"
        },
        "noDiagnoses": "No diagnoses found for this period.",
        "urgent": "Urgent",
        "reviewed": "Reviewed",
        "pending": "Pending"
      },
      "charts": {
        "volume": "Diagnosis Volume vs Pending",
        "volumeDesc": "Monthly clinical throughput (live data).",
        "noTrendData": "No trend data available yet. Create some assessments to see trends.",
        "risk": "Risk Classification",
        "riskDesc": "Click a slice to filter patients by risk level."
      }
    },
    "sandbox": {
      "title": "Rule Simulation Sandbox",
      "subtitle": "Test patient scenarios against active rules without saving records",
      "matched": "matched",
      "rulesLabel": "rules",
      "testPatientData": "Test Patient Data",
      "clear": "Clear",
      "simulationResults": "Simulation Results",
      "enterTestData": "Enter test data to simulate",
      "usePresets": "Use presets above for quick scenarios",
      "triggeredSummary": "{{matched}} of {{total}} active rules triggered",
      "hide": "Hide",
      "details": "Details",
      "presets": {
        "healthy": "Healthy Adult",
        "prediabetes": "Pre-Diabetes",
        "t2dm": "Type 2 Diabetes",
        "dka": "DKA Crisis"
      },
      "groups": {
        "demographics": "Demographics",
        "labValues": "Lab Values",
        "symptoms": "Symptoms",
        "riskFactors": "Risk Factors"
      },
      "fields": {
        "age": "Age",
        "bmi": "BMI",
        "fastingGlucose": "Fasting Glucose",
        "fastingPlasmaGlucose": "Fasting Plasma Glucose",
        "hba1c": "HbA1c",
        "ogtt": "2h OGTT",
        "randomPlasmaGlucose": "Random Plasma Glucose",
        "bloodGlucose": "Blood Glucose",
        "frequentUrination": "Frequent Urination",
        "excessiveThirst": "Excessive Thirst",
        "fatigue": "Fatigue",
        "blurredVision": "Blurred Vision",
        "weightLoss": "Weight Loss",
        "nausea": "Nausea",
        "vomiting": "Vomiting",
        "abdominalPain": "Abdominal Pain",
        "tinglingHandsFeet": "Tingling Hands/Feet",
        "frequentInfections": "Frequent Infections",
        "acanthosisNigricans": "Dark Skin Patches (Acanthosis Nigricans)",
        "familyHistory": "Family History",
        "lowPhysicalActivity": "Low Physical Activity",
        "sedentaryLifestyle": "Sedentary Lifestyle",
        "highCholesterol": "High Cholesterol",
        "pcosHistory": "PCOS History",
        "highRiskEthnicity": "High Risk Ethnicity"
      }
    },
    "patientsPage": {
      "records": {
        "title": "Patient Records",
        "desc": "Search, filter, edit profiles, and open assessment workflows."
      },
      "filters": {
        "search": "Search by name or phone",
        "allGenders": "All genders",
        "anyDiagnosis": "Any diagnosis status",
        "hasDiagnosis": "Has diagnosis",
        "noDiagnosis": "No diagnosis yet",
        "apply": "Apply",
        "reset": "Reset"
      },
      "table": {
        "name": "Name",
        "gender": "Gender",
        "phone": "Phone",
        "diagnoses": "Diagnoses",
        "actions": "Actions",
        "loading": "Loading patients...",
        "empty": "No patients found for current filters.",
        "history": "History",
        "latestResult": "Latest Result",
        "assess": "Assess"
      },
      "form": {
        "editTitle": "Edit Patient",
        "createTitle": "Register Patient",
        "editDesc": "Update profile details before reviewing history or running a new assessment.",
        "createDesc": "Add a profile before recording symptoms and labs.",
        "cancelEdit": "Cancel Edit",
        "fullName": "Full name",
        "fullNamePlaceholder": "Patient full name",
        "gender": "Gender",
        "dateOfBirth": "Date of birth",
        "phone": "Phone",
        "phonePlaceholder": "Phone number",
        "notes": "Notes",
        "notesPlaceholder": "Background notes",
        "saving": "Saving...",
        "updatePatient": "Update Patient",
        "createPatient": "Create Patient"
      }
    },
    "historyPage": {
      "profile": {
        "title": "Patient Profile",
        "desc": "Manage demographics and monitor case history over time.",
        "back": "Back to List",
        "assess": "Run Assessment",
        "updateProfile": "Update Profile",
        "saving": "Saving..."
      },
      "sections": {
        "symptoms": "Symptoms",
        "labResults": "Lab Results",
        "diagnosisHistory": "Diagnosis History",
        "recorded": "Recorded",
        "recorded_at": "When"
      },
      "symptomForm": {
        "title": "Add Symptom",
        "code": "Symptom code (e.g. fatigue)",
        "name": "Symptom name",
        "severity": "Severity 1-10",
        "present": "Present now",
        "notes": "Notes",
        "add": "Add Symptom",
        "noHistory": "No symptom history."
      },
      "labForm": {
        "title": "Add Lab Result",
        "testName": "Test name",
        "testValue": "Test value",
        "unit": "Unit",
        "range": "Reference range",
        "notes": "Notes",
        "add": "Add Lab Result",
        "noHistory": "No lab history."
      },
      "diagnosisTable": {
        "diagnosis": "Diagnosis",
        "certainty": "Certainty",
        "by": "By",
        "when": "When",
        "noHistory": "No diagnosis history yet."
      }
    },
    "reviewPage": {
      "queue": {
        "title": "Patient Review Queue",
        "pendingCount": "{{count}} pending reviews",
        "autoUpdating": "Auto-updating",
        "searchPlaceholder": "Search patients..."
      },
      "states": {
        "loading": "Loading queue...",
        "empty": "Queue is entirely empty. Great job!",
        "noMatch": "No patients match your search.",
        "urgent": "URGENT",
        "standard": "Standard",
        "score": "Score",
        "unknownPatient": "Unknown Patient"
      },
      "details": {
        "noPatientSelected": "No Patient Selected",
        "noPatientSelectedDesc": "Select a diagnosis from the queue on the left to review clinical output and append your notes.",
        "assessmentRecord": "Assessment Record",
        "generated": "Generated",
        "reviewed": "Reviewed",
        "pendingReview": "Pending Doctor Review",
        "aiOutput": "AI Diagnostic Output",
        "confidenceScore": "Confidence Score",
        "criticalWarning": "Critical Warning",
        "defaultCriticalMsg": "This case requires immediate attention."
      },
      "evidence": {
        "title": "Clinical Evidence",
        "recommendations": "Recommendations",
        "noRecommendations": "No specific recommendations provided by the engine.",
        "triggeredRules": "Triggered Rules"
      },
      "doctorReview": {
        "title": "Doctor's Review",
        "notesLabel": "Clinical Notes & Addendum",
        "notesPlaceholder": "Add your own assessment notes, treatment plan adjustments, or patient follow-up instructions here...",
        "urgentFlag": "Flag as Urgent Case",
        "urgentReasonPlaceholder": "Why is this urgent? (Required)",
        "urgentReasonRequired": "Urgent reason is required when urgent flag is enabled.",
        "submit": "Sign & Submit Review",
        "saving": "Saving Review...",
        "submitNotice": "Submitting this form will mark the assessment as Reviewed."
      }
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
      "logout": "ចាកចេញ",
      "male": "បុរស",
      "female": "ស្ត្រី",
      "other": "ផ្សេងៗ",
      "unknown": "មិនស្គាល់",
      "all": "ទាំងអស់",
      "active": "សកម្ម",
      "inactive": "អសកម្ម",
      "suspended": "បានផ្អាក",
      "showing": "បង្ហាញ {{from}}-{{to}} នៃ {{total}} លទ្ធផល",
      "rows": "ជួរ",
      "previous": "មុន",
      "next": "បន្ទាប់",
      "confirm": "បញ្ជាក់",
      "cancel": "បោះបង់",
      "confirmStatusChange": "បញ្ជាក់ពីការផ្លាស់ប្តូរស្ថានភាពគណនី។",
      "disableAccount": "បិទគណនីអ្នកប្រើប្រាស់?",
      "enableAccount": "បើកគណនីអ្នកប្រើប្រាស់?",
      "disableDesc": "{{name}} នឹងត្រូវបានកំណត់ជាអសកម្ម ហើយនឹងបាត់បង់សិទ្ធិចូលប្រើរហូតដល់ត្រូវបានបើកឡើងវិញ។",
      "enableDesc": "{{name}} នឹងត្រូវបានផ្តល់សិទ្ធិឡើងវិញ និងអនុញ្ញាតឱ្យចូលប្រើម្តងទៀត។",
      "disableUser": "បិទអ្នកប្រើប្រាស់",
      "enableUser": "បើកអ្នកប្រើប្រាស់"
    },
    "auth": {
      "errorEmailPasswordRequired": "តម្រូវឲ្យមានអ៊ីមែល និងពាក្យសម្ងាត់។",
      "errorLoginFailed": "ការចូលប្រើប្រាស់បរាជ័យ",
      "accentTitle": "សួស្តី សូមស្វាគមន៍!",
      "greetingTitleSplit": "សួស្តី|សូមស្វាគមន៍!",
      "accentCopy": "មិនទាន់មានគណនីទេ? បង្កើតគណនីមួយ ដើម្បីទទួលបានឧបករណ៍វិភាគ ប្រវត្តិអ្នកជំងឺ និងការថែទាំតាមដានដ៏ឆ្លាតវៃ។",
      "register": "ចុះឈ្មោះ",
      "loginPageTitle": "ចូលប្រើប្រាស់",
      "loginPageSub": "ចូលគណនីដើម្បីបន្តទៅកាន់ផ្ទាំងគ្រប់គ្រងរបស់អ្នក។",
      "emailLabel": "អាសយដ្ឋានអ៊ីមែល",
      "emailPlaceholder": "អាសយដ្ឋានអ៊ីមែល",
      "fullNameLabel": "ឈ្មោះពេញ",
      "namePlaceholder": "វេជ្ជបណ្ឌិត ចន ដូ",
      "passwordLabel": "ពាក្យសម្ងាត់",
      "passwordPlaceholder": "ពាក្យសម្ងាត់",
      "rememberMe": "ចងចាំខ្ញុំ",
      "signingIn": "កំពុងចូល...",
      "login": "ចូលប្រើប្រាស់",
      "noAccount": "មិនទាន់មានគណនីមែនទេ?",
      "signUp": "ចុះឈ្មោះ",
      "regSubTitle": "បង្កើតគណនីវិជ្ជាជីវៈវេជ្ជសាស្ត្ររបស់អ្នក។",
      "registerTitle": "ចុះឈ្មោះ",
      "registerSub": "បង្កើតគណនីរបស់អ្នក ហើយចាប់ផ្តើមភ្លាមៗ។",
      "firstName": "នាមខ្លួន",
      "firstNamePlaceholder": "នាមខ្លួន",
      "lastName": "នាមត្រកូល",
      "lastNamePlaceholder": "នាមត្រកូល",
      "confirmPassword": "បញ្ជាក់ពាក្យសម្ងាត់",
      "confirmPasswordLabel": "បញ្ជាក់ពាក្យសម្ងាត់",
      "confirmPasswordPlaceholder": "បញ្ជាក់ពាក្យសម្ងាត់",
      "agreeTerms": "ខ្ញុំយល់ព្រមតាម",
      "termsAndConditions": "លក្ខខណ្ឌប្រើប្រាស់",
      "creatingAccount": "កំពុងបង្កើតគណនី...",
      "createAccount": "បង្កើតគណនី",
      "alreadyHaveAccount": "មានគណនីរួចហើយមែនទេ?",
      "signIn": "ចូលប្រើប្រាស់",
      "secureAccess": "ចូលប្រើប្រាស់ដោយសុវត្ថិភាព",
      "welcomeBack": "ស្វាគមន៍ការត្រឡប់មកវិញ!",
      "welcomeBackSplit": "ស្វាគមន៍|ការត្រឡប់មកវិញ!",
      "registerAccentCopy": "បានចុះឈ្មោះរួចហើយមែនទេ? ត្រឡប់ទៅកាន់ផ្ទាំងចូលប្រើប្រាស់វិញ ដើម្បីបន្តគ្រប់គ្រងការវាយតម្លៃ និងការថែទាំអ្នកជំងឺ។",
      "errorAgreeTerms": "សូមយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់។",
      "errorPasswordMismatch": "ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់ត្រូវតែដូចគ្នា។",
      "errorRegistrationFailed": "ការចុះឈ្មោះបរាជ័យ"
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
      "carePlan": "ផែនការថែទាំ",
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
      "carePlan": {
        "title": "ផែនការថែទាំរបស់ខ្ញុំ",
        "subtitle": "ផែនការតាមដាន កំណត់ចំណាំពីវេជ្ជបណ្ឌិត និងវឌ្ឍនភាពរបស់អ្នកនៅកន្លែងតែមួយ"
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
    "usersPage": {
      "hero": {
        "eyebrow": "ការគ្រប់គ្រងអ្នកប្រើប្រាស់",
        "title": "អ្នកប្រើប្រាស់",
        "description": "គ្រប់គ្រងសមាជិកក្រុម តួនាទី និងការចូលប្រើប្រាស់គណនីពីកន្លែងគ្រប់គ្រងតែមួយ។",
        "addUser": "បន្ថែមអ្នកប្រើប្រាស់"
      },
      "insights": {
        "rolesTitle": "អ្នកប្រើប្រាស់តាមតួនាទី",
        "rolesDesc": "ការបែងចែកតាមតួនាទីដែលបានចាត់តាំង។",
        "rulesTitle": "ក្បួនតាមស្ថានភាព",
        "rulesDesc": "ក្បួនកំពុងដំណើរការធៀបនឹងក្បួនដែលបានទុកក្នុងប័ណ្ណសារ។",
        "actionsTitle": "សកម្មភាពកំពូល (7ថ្ងៃ)",
        "actionsDesc": "ព្រឹត្តិការណ៍រដ្ឋបាល និងការផ្ទៀងផ្ទាត់ទូទៅបំផុត។",
        "noRoleData": "គ្មានទិន្នន័យតួនាទី",
        "noRoleDataDesc": "ការបែងចែកតួនាទីនឹងបង្ហាញនៅពេលមានស្ថិតិអ្នកប្រើប្រាស់។",
        "noRuleData": "គ្មានទិន្នន័យក្បួន",
        "noRuleDataDesc": "តារាងស្ថានភាពក្បួននឹងបង្ហាញនៅពេលស្ថិតិក្បួនត្រូវបានផ្ទុក។",
        "noActionData": "គ្មានទិន្នន័យសកម្មភាព",
        "noActionDataDesc": "សកម្មភាពនឹងត្រូវបានបង្ហាញនៅពេលមានព្រឹត្តិការណ៍។",
        "usersCount": "អ្នកប្រើប្រាស់",
        "eventsCount": "ព្រឹត្តិការណ៍"
      },
      "table": {
        "searchPlaceholder": "ស្វែងរកអ្នកប្រើប្រាស់...",
        "columns": "ជួរឈរ",
        "export": "ទាញយកទិន្នន័យ",
        "visibleColumns": "បង្ហាញជួរឈរ",
        "suspendedNotice": "គណនីដែលត្រូវបានផ្អាកមិនត្រូវបានកំណត់ដោយឡែកនៅក្នុង backend បច្ចុប្បន្នទេ។ សូមប្រើ 'អសកម្ម' ដើម្បីបិទការចូលប្រើ។",
        "headers": {
          "name": "ឈ្មោះ",
          "role": "តួនាទី",
          "access": "ការចូលប្រើ",
          "status": "ស្ថានភាព",
          "lastActive": "សកម្មភាពចុងក្រោយ",
          "actions": "សកម្មភាព"
        },
        "states": {
          "loading": "កំពុងផ្ទុកអ្នកប្រើប្រាស់...",
          "noneFound": "រកមិនឃើញអ្នកប្រើប្រាស់",
          "noneFoundDesc": "ព្យាយាមស្វែងរកផ្សេងទៀត ឬប្តូរស្ថានភាពគណនី។",
          "permissions": "{{count}} សិទ្ធិ",
          "permissions_plural": "{{count}} សិទ្ធិ"
        }
      },
      "editor": {
        "newAccount": "គណនីថ្មី",
        "editAccount": "កែសម្រួលគណនី",
        "addUser": "បន្ថែមអ្នកប្រើប្រាស់",
        "updateUser": "ធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់",
        "createDesc": "បង្កើតគណនីប្រព័ន្ធថ្មី និងចាត់តាំងតួនាទីដំបូង។",
        "editDesc": "ធ្វើបច្ចុប្បន្នភាពអត្តសញ្ញាណគណនី ការចាត់តាំងតួនាទី និងស្ថានភាពចូលប្រើ។",
        "fields": {
          "fullName": "ឈ្មោះពេញ",
          "email": "អ៊ីមែល",
          "password": "លេខសម្ងាត់",
          "role": "តួនាទី",
          "status": "ស្ថានភាពគណនី"
        },
        "actions": {
          "cancel": "បោះបង់",
          "saving": "កំពុងរក្សាទុក...",
          "createUser": "បង្កើតអ្នកប្រើប្រាស់",
          "saveChanges": "រក្សាទុកការផ្លាស់ប្តូរ"
        }
      },
      "notifications": {
        "creating": "កំពុងបង្កើតអ្នកប្រើប្រាស់...",
        "updating": "កំពុងរក្សាទុកការផ្លាស់ប្តូរ...",
        "createSuccess": "បានបង្កើតអ្នកប្រើប្រាស់ដោយជោគជ័យ។",
        "updateSuccess": "បានធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់ដោយជោគជ័យ។",
        "disabling": "កំពុងបិទអ្នកប្រើប្រាស់...",
        "enabling": "កំពុងបើកអ្នកប្រើប្រាស់...",
        "statusSuccess": "បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពគណនីដោយជោគជ័យ។",
        "exportSuccess": "បានទាញយកទិន្នន័យអ្នកប្រើប្រាស់។",
        "loadError": "មិនអាចផ្ទុកអ្នកប្រើប្រាស់បានទេ",
        "updateError": "មិនអាចធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់បានទេ",
        "createError": "មិនអាចបង្កើតអ្នកប្រើប្រាស់បានទេ"
      }
    },
    "rolesPage": {
      "hero": {
        "title": "តួនាទី និងសិទ្ធិ",
        "description": "បង្កើតតួនាទីផ្ទាល់ខ្លួន និងកំណត់សិទ្ធិដែលតួនាទីនីមួយៗអាចចូលប្រើបាន។",
        "newRole": "តួនាទីថ្មី"
      },
      "list": {
        "title": "តួនាទី",
        "description": "ជ្រើសរើសតួនាទីដើម្បីពិនិត្យមើលសិទ្ធិរបស់វា ឬចាប់ផ្តើមតួនាទីផ្ទាល់ខ្លួនថ្មី។",
        "loading": "កំពុងផ្ទុកតួនាទី...",
        "emptyTitle": "រកមិនឃើញតួនាទី",
        "emptyDescription": "តួនាទីនឹងបង្ហាញនៅទីនេះនៅពេលពួកវាមាន។",
        "userCount": "{{count}} អ្នកប្រើប្រាស់",
        "userCount_plural": "{{count}} អ្នកប្រើប្រាស់",
        "builtIn": "មកជាមួយប្រព័ន្ធ",
        "custom": "បង្កើតថ្មី",
        "newRole": "តួនាទីថ្មី"
      },
      "form": {
        "detailsTitle": "ព័ត៌មានលម្អិតតួនាទី",
        "newRoleTitle": "តួនាទីថ្មី",
        "builtInNotice": "តួនាទីដែលមកជាមួយប្រព័ន្ធគឺសម្រាប់តែមើលប៉ុណ្ណោះ។ ពិនិត្យមើលសិទ្ធិនៅទីនេះ ប៉ុន្តែបង្កើតតួនាទីថ្មីដើម្បីកំណត់ការចូលប្រើតាមចិត្ត។",
        "newRoleDesc": "កំណត់ឈ្មោះតួនាទី និងជ្រើសរើសសិទ្ធិដែលតួនាទីនោះគួរផ្តល់ឱ្យ។",
        "roleName": "ឈ្មោះតួនាទី",
        "roleNamePlaceholder": "បញ្ចូលឈ្មោះតួនាទី",
        "permissions": "សិទ្ធិ",
        "saving": "កំពុងរក្សាទុក...",
        "saveRole": "រក្សាទុកតួនាទី",
        "createRole": "បង្កើតតួនាទី",
        "noPermissionsTitle": "រកមិនឃើញសិទ្ធិ",
        "noPermissionsDesc": "ជម្រើសសិទ្ធិនឹងបង្ហាញនៅទីនេះនៅពេលពួកវាមាន។"
      },
      "groups": {
        "user": "អ្នកប្រើប្រាស់",
        "permission": "តួនាទី និងសិទ្ធិ",
        "patient": "អ្នកជំងឺ",
        "symptom": "រោគសញ្ញា",
        "lab": "លទ្ធផលមន្ទីរពិសោធន៍",
        "rule": "ក្បួន",
        "diagnosis": "ការវិនិច្ឆ័យ"
      },
      "notifications": {
        "nameRequired": "ឈ្មោះតួនាទីគឺចាំបាច់។",
        "permissionRequired": "ជ្រើសរើសយ៉ាងហោចណាស់សិទ្ធិមួយ។",
        "saving": "កំពុងរក្សាទុកតួនាទី...",
        "creating": "កំពុងបង្កើតតួនាទី...",
        "saveSuccess": "បានរក្សាទុកតួនាទីដោយជោគជ័យ។",
        "createSuccess": "បានបង្កើតតួនាទីដោយជោគជ័យ។",
        "loadError": "មិនអាចផ្ទុកតួនាទី និងសិទ្ធិបានទេ",
        "saveError": "មិនអាចរក្សាទុកតួនាទីបានទេ",
        "createError": "មិនអាចបង្កើតតួនាទីបានទេ"
      }
    },
    "permissions": {
      "user": {
        "manage": "គ្រប់គ្រងអ្នកប្រើប្រាស់",
        "view": "មើលអ្នកប្រើប្រាស់"
      },
      "diagnosis": {
        "review_any": "ពិនិត្យលទ្ធផលវិនិច្ឆ័យទាំងអស់",
        "run": "ដំណើរការការវិនិច្ឆ័យ",
        "view_own": "មើលលទ្ធផលវិនិច្ឆ័យផ្ទាល់ខ្លួន"
      },
      "patient": {
        "manage": "បង្កើត និងធ្វើបច្ចុប្បន្នភាពកំណត់ត្រាអ្នកជំងឺ",
        "view_own": "មើលកំណត់ត្រាអ្នកជំងឺផ្ទាល់ខ្លួន",
        "view": "មើលកំណត់ត្រាអ្នកជំងឺ"
      },
      "rule": {
        "manage": "បង្កើត និងគ្រប់គ្រងក្បួន",
        "view": "មើលក្បួន"
      },
      "lab": {
        "manage": "បង្កើតកំណត់ត្រាមន្ទីរពិសោធន៍",
        "view": "មើលប្រវត្តិមន្ទីរពិសោធន៍"
      },
      "permission": {
        "manage": "បង្កើត និងធ្វើបច្ចុប្បន្នភាពតួនាទី",
        "view": "មើលតួនាទី និងសិទ្ធិ"
      },
      "symptom": {
        "manage": "បង្កើតកំណត់ត្រារោគសញ្ញា",
        "view": "មើលប្រវត្តិរោគសញ្ញា"
      }
    },
    "userSidebar": {
      "userFallback": "អ្នកប្រើប្រាស់",
      "contact": "ទំនាក់ទំនង",
      "noEmail": "គ្មានអ៊ីមែល",
      "accountId": "លេខសម្គាល់គណនី",
      "na": "មិនមាន",
      "timeline": "កាលប្បវត្តិ",
      "created": "បានបង្កើត៖",
      "updated": "បានធ្វើបច្ចុប្បន្នភាព៖",
      "effectivePermissions": "សិទ្ធិដែលមានប្រសិទ្ធភាព",
      "noPermissions": "គ្មានសិទ្ធិសម្រាប់តួនាទីនេះទេ។"
    },
    "time": {
      "noActivity": "មិនទាន់មានសកម្មភាព",
      "justNow": "អម្បាញ់មិញ",
      "minAgo": "{{count}} នាទីមុន",
      "hourAgo": "{{count}} ម៉ោងមុន",
      "hoursAgo": "{{count}} ម៉ោងមុន",
      "dayAgo": "{{count}} ថ្ងៃមុន",
      "daysAgo": "{{count}} ថ្ងៃមុន"
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
      "profile": "ប្រវត្តិរូប",
      "logOut": "ចាកចេញ"
    },
    "profileSetup": {
      "stepProgress": "ជំហានទី {{current}} ក្នុងចំណោម {{total}}",
      "stepLabel": "ជំហានទី {{current}}/{{total}}",
      "welcome": "សួស្តី {{name}} — តោះបង្កើតប្រវត្តិរូបសុខភាពរបស់អ្នក។",
      "footnote": "ចម្លើយទាំងនេះជំនួសសំណួរប្រវត្តិរូបក្នុងការវាយតម្លៃនីមួយៗ — បញ្ចូលតិច ជាក់លាក់ជាង។",
      "step1": {
        "title": "អំពីអ្នក",
        "description": "ព័ត៌មានលម្អិតពីរបាយ ដើម្បីឱ្យការវាយតម្លៃរបស់អ្នកបំពេញដោយស្វ័យប្រវត្តិ។"
      },
      "step2": {
        "title": "រាងកាយរបស់អ្នក",
        "description": "ប្រើសម្រាប់គណនា BMI ដោយស្វ័យប្រវត្តិ — មិនចាំបាច់បញ្ចូលពេលក្រោយទេ។"
      },
      "step3": {
        "title": "ប្រវត្តិសុខភាព",
        "description": "ស្រេចចិត្ត — ទាំងនេះចូលរួមក្នុងការវិភាគហានិភ័យ ប៉ុណ្ណោះបើពាក់ព័ន្ធនឹងអ្នក។"
      },
      "genderLabel": "ភេទ",
      "genderMale": "ប្រុស",
      "genderFemale": "ស្រី",
      "genderOther": "ផ្សេងៗ",
      "dobLabel": "ថ្ងៃខែឆ្នាំកំណើត",
      "agePreview": "អាយុ {{age}} ឆ្នាំ",
      "heightLabel": "កម្ពស់ (សម)",
      "weightLabel": "ទម្ងន់ (ក្រាំម)",
      "waistLabel": "រង្វង់ចង្វេ주 (សម)",
      "optional": "ស្រេចចិត្ត",
      "bmiPreview": "BMI របស់អ្នក៖ {{value}} — គណនាដោយស្វ័យប្រវត្តិក្នុងការវាយតម្លៃនីមួយៗ។",
      "riskFamily": "គ្រូបង្គាញជិតមានជំងឺទឹកនោមផ្អែម",
      "riskHypertension": "ឈាមទុំ",
      "riskCholesterol": "ជាតិខ្លាញ់ក្នុងឈាមខ្ពស់",
      "riskSmoking": "ខ្ញុំជក់បារី",
      "riskSedentary": "រស់នៅច្រំតែមិនសូវចលនា",
      "privacyNote": "តែអ្នក និងក្រុមថែទាំរបស់អ្នកប៉ុណ្ណោះដែលអាចមើលឃើញ។ អ្នកអាចផ្លាស់ប្តូរពេលណាក៏បាន។",
      "back": "ត្រឡប់",
      "continue": "បន្ត",
      "finish": "បញ្ចប់ការរៀបចំ",
      "saving": "កំពុងរក្សាទុក...",
      "errors": {
        "gender": "សូមជ្រើសរើសភេទ។",
        "dob": "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតរបស់អ្នក។",
        "dobRange": "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។",
        "height": "សូមបញ្ចូលកម្ពស់ចាប់ពី 80 ដល់ 250 សម។",
        "weight": "សូមបញ្ចូលទម្ងន់ចាប់ពី 20 ដល់ 400 ក្រាំម។",
        "waist": "សូមបញ្ចូលរង្វង់ចង្វេ주ចាប់ពី 40 ដល់ 200 សម។",
        "save": "មិនអាចរក្សាទុកប្រវត្តិរូបរបស់អ្នកបានទេ។ សូមព្យាយាមម្តងទៀត។"
      }
    },
    "profilePage": {
      "title": "ប្រវត្តិរូបរបស់អ្នក",
      "subtitle": "ព័ត៌មានគណនី និងប្រវត្តិសុខភាពដែលការវាយតម្លៃរបស់អ្នកបំពេញស្វ័យប្រវត្តិពី។",
      "accountTitle": "គណនី",
      "healthTitle": "ប្រវត្តិសុខភាព",
      "healthSubtitle": "រក្សាព័ត៌មានទាន់ពេល — ការវាយតម្លៃថ្មីនីមួយៗនឹងបំពេញដោយស្វ័យប្រវត្តិពីទីនេះ។",
      "save": "រក្សាទុកការផ្លាស់ប្ដូរ",
      "saved": "បានរក្សាទុក",
      "staffNote": "អ្នកបានចូលជាបុគ្គលិក — ផ្នែកប្រវត្តិសុខភាពបង្ហាញសម្រាប់គណនីអ្នកជំងឺតែប៉ុណ្ណោះ។",
      "loadFailed": "មិនអាចផ្ទុកប្រវត្តិសុខភាពរបស់អ្នកបានទេ។"
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
        "openFullResult": "បើកលទ្ធផលពេញលេញ",
        "greetingMorning": "អរុណសួស្តី, {{name}}!",
        "greetingAfternoon": "ទិវាសួស្តី, {{name}}!",
        "greetingEvening": "សាយណ្ហសួស្តី, {{name}}!",
        "lastCheck": "ការពិនិត្យចុងក្រោយ",
        "lastCheckToday": "ថ្ងៃនេះ",
        "lastCheckYesterday": "ម្សិលមិញ",
        "lastCheckDaysAgo": "កាលពី {{count}} ថ្ងៃមុន",
        "lastCheckNever": "មិនទាន់មានការពិនិត្យ"
      },
      "situation": {
        "title": "ស្ថានភាពរបស់អ្នក",
        "newAssessment": "ការវាយតម្លៃថ្មី",
        "viewResults": "មើលលទ្ធផលរបស់ខ្ញុំ",
        "stable": "ការវាយតម្លៃចុងក្រោយរបស់អ្នកល្អ — សូមបន្តតាមដានជាប្រចាំ។",
        "urgent": "ការវាយតម្លៃចុងក្រោយរបស់អ្នកត្រូវបានសម្គាល់ថាត្រូវការតាមដានបន្ទាន់។",
        "urgentReason": "មូលហេតុ៖ {{reason}}",
        "noResult": "អ្នកមិនទាន់បានបំពេញការវាយតម្លៃនៅឡើយទេ។ សូមចាប់ផ្តើមការវាយតម្លៃដំបូងរបស់អ្នកដើម្បីមើលស្ថានភាពរបស់អ្នកនៅទីនេះ។",
        "ageLabel": "អាយុ"
      },
      "health": {
        "title": "ស្ថានភាពសុខភាព",
        "description": "តម្លៃសំខាន់ៗពីការវាយតម្លៃចុងក្រោយរបស់អ្នក។",
        "latestFrom": "ពីការវាយតម្លៃថ្ងៃ {{date}}",
        "bmi": "សន្ទស្សន៍ដុំសាច់ (BMI)",
        "fastingGlucose": "ជាតិស្ករក្នុងឈាម (អត់ធ្មត់)",
        "hba1c": "HbA1c",
        "catUnderweight": "ទម្ងន់តិចជាងកម្រិត",
        "catNormal": "ធម្មតា",
        "catOverweight": "លើសទម្ងន់",
        "catObese": "ធាត់",
        "catPrediabetes": "កម្រិតមុនទឹកនោមផ្អែម",
        "catDiabetes": "កម្រិតទឹកនោមផ្អែម",
        "notProvided": "មិនបានផ្តល់",
        "bmiRangeHint": "ល្អ៖ 18.5 – 24.9",
        "glucoseRangeHint": "ល្អ (អត់ធ្មត់)៖ ក្រោម 100 mg/dL",
        "a1cRangeHint": "ល្អ៖ ក្រោម 5.7%",
        "mgdlUnit": "mg/dL",
        "emptyTitle": "មិនទាន់មានតម្លៃសុខភាព",
        "emptyDescription": "បំពេញការវាយតម្លៃជាមួយកម្ពស់ ទម្ងន់ និងតម្លៃមន្ទីរពិសោធន៍ ដើម្បីមើល BMI ជាតិស្ករ និង HbA1c របស់អ្នកនៅទីនេះ។",
        "disclaimer": "សម្រាប់យោងប៉ុណ្ណោះ — សូមបញ្ជាក់ជាមួយវេជ្ជបណ្ឌិតជានិច្ច។"
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
        "noDoctorNote": "មិនទាន់មានកំណត់ចំណាំពីវេជ្ជបណ្ឌិតទេ។",
        "reportedSymptoms": "អាការៈដែលអ្នកបានរាយការណ៍",
        "noSymptoms": "មិនមានអាការៈរាយការណ៍នៅក្នុងការវាយតម្លៃចុងក្រោយរបស់អ្នកទេ។",
        "openFull": "បើកផែនការថែទាំ",
        "moreSymptoms": "+{{count}} ទៀត"
      },
      "report": {
        "title": "របាយការណ៍សុខភាព",
        "description": "អ្វីដែលការវាយតម្លៃរបស់អ្នកបង្ហាញតាមពេលវេលា។",
        "activityTitle": "សកម្មភាពវាយតម្លៃ",
        "activityHint": "ការវាយតម្លៃបានបញ្ចប់ក្នុងមួយខែ — ៦ ខែចុងក្រោយ",
        "trendTitle": "និន្នាការកម្រិតទុកចិត្ត",
        "trendHint": "កម្រិតទុកចិត្តរបស់ប្រព័ន្ធជំនាញសម្រាប់ការវាយតម្លៃនីមួយៗ",
        "totalAssessments": "ការវាយតម្លៃសរុប",
        "urgentFlags": "សញ្ញាបន្ទាន់",
        "lastCheck": "ការពិនិត្យចុងក្រោយ",
        "latestConfidence": "កម្រិតទុកចិត្តចុងក្រោយ",
        "emptyTitle": "របាយការណ៍របស់អ្នកកំពុងរង់ចាំទិន្នន័យ",
        "emptyDescription": "បំពេញការវាយតម្លៃ ហើយរបាយការណ៍នេះនឹងបំពេញដោយខ្លួនឯង — សកម្មភាព និន្នាការកម្រិតទុកចិត្ត និងតម្លៃសំខាន់ៗតាមពេលវេលា។",
        "emptyCta": "ចាប់ផ្តើមការវាយតម្លៃដំបូងរបស់ខ្ញុំ",
        "noTrendData": "កម្រិតទុកចិត្តនឹងបង្ហាញនៅពេលការវាយតម្លៃបង្កើតការវិនិច្ឆ័យ។",
        "confidenceUnit": "%"
      },
      "recommendations": {
        "title": "អនុសាសន៍សម្រាប់អ្នក",
        "description": "បង្កើតដោយស្វ័យប្រវត្តិពីទិន្នន័យការវាយតម្លៃចុងក្រោយរបស់អ្នក។",
        "basisPrefix": "ផ្អែកលើ៖ {{reason}}",
        "priorityNow": "ធ្វើភ្លាមៗ",
        "prioritySoon": "សប្តាហ៍នេះ",
        "priorityHabit": "ទម្លាប់ប្រចាំថ្ងៃ",
        "basisUrgentFlag": "សញ្ញាបន្ទាន់លើលទ្ធផលចុងក្រោយរបស់អ្នក",
        "basisSymptoms": "អាការៈរបស់អ្នក៖ {{symptoms}}",
        "basisGlucose": "ជាតិស្ករ {{value}} mg/dL",
        "basisHba1c": "HbA1c {{value}}%",
        "basisBmi": "BMI {{value}}",
        "basisNoLabs": "មិនទាន់មានតម្លៃបន្ទប់ពិសោធន៍",
        "basisSmoking": "ការជក់បារី",
        "basisLastCheck": "ការពិនិត្យចុងក្រោយ {{days}} ថ្ងៃមុន",
        "basisHypertension": "សញ្ញាឈាមទុំ",
        "basisRiskFactor": "កត្តាប្រឈមរបស់អ្នក",
        "basisAssessmentCount": "មានការវាយតម្លៃ {{count}} ដងរួចហើយ",
        "urgentFollowUpTitle": "ទាក់ទងវេជ្ជបណ្ឌិតឱ្យបានឆាប់",
        "urgentFollowUpText": "ការវាយតម្លៃចុងក្រោយរបស់អ្នកត្រូវបានសម្គាល់ថាបន្ទាន់។ កុំរង់ចាំ — អនុវត្តតាមអនុសាសន៍ និងនិយាយជាមួយវេជ្ជបណ្ឌិតឱ្យបានលឿនតាមដែលអាចធ្វើបាន។",
        "crisisSignsTitle": "ស្វែងរកការព្យាបាលបន្ទាន់ឥឡូវនេះ",
        "crisisSignsText": "អ្នកបានរាយការណ៍សញ្ញាព្រមាន ({{symptoms}})។ ទាំងនេះអាចបង្ហាញពីវិបត្តិជាតិស្ករធ្ងន់ធ្ងរ — សូមរកជំនួយវេជ្ជសាស្ត្រភ្លាមៗ។",
        "hypoSignsTitle": "ដឹងវិធីព្យាបាលជាតិស្ករទាប",
        "hypoSignsText": "រ័រ ញើស ឬមុខងងឹតអាចមានន័យថាជាតិស្ករក្នុងឈាមទាប។ បើវាកើតឡើង សូមទទួលទានជាតិស្កររហ័សស្រូប (ទឹកផ្លែឈើ ថ្នាំគ្រាប់គ្លុយកូស) និងប្រាប់វេជ្ជបណ្ឌិតរបស់អ្នក។",
        "veryHighGlucoseTitle": "ជាតិស្កររបស់អ្នកខ្ពស់ខ្លាំង",
        "veryHighGlucoseText": "តម្លៃ {{value}} mg/dL ត្រូវការការយកចិត្តទុកដាក់វេជ្ជសាស្ត្រក្នុងពេលឆាប់ៗ។ ទាក់ទងវេជ្ជបណ្ឌិត ផឹកទឹក និងៀរភេសជ្ជៈផ្អែមជាពេលបច្ចុប្បន្ន។",
        "missingLabsTitle": "បន្ថែមការធ្វើតេស្តបន្ទប់ពិសោធន៍",
        "missingLabsText": "ការវាយតម្លៃរបស់អ្នកមិនទាន់មានតម្លៃបន្ទប់ពិសោធន៍ទេ។ ការធ្វើតេស្តជាតិស្ករអត់ធ្មត់ និង HbA1c នឹងធ្វើឱ្យរបាយការណ៍ និងអនុសាសន៍ទាំងនេះជាក់លាក់ជាងមុន។",
        "diabetesRangeGlucoseTitle": "ពិភាក្សាជាតិស្ករជាមួយវេជ្ជបណ្ឌិត",
        "diabetesRangeGlucoseText": "ជាតិស្ករអត់ធ្មត់របស់អ្នក {{value}} mg/dL ស្ថិតក្នុងកម្រិតទឹកនោមផ្អែម។ កំណត់ពេលជួបវេជ្ជបណ្ឌិតដើម្បីបញ្ជាក់លទ្ធផល និងរៀបចំផែនការបន្ទាប់។",
        "prediabetesGlucoseTitle": "កាត់បន្ថយភាពជាមុនទឹកនោមផ្អែមដោយរបៀបរស់នៅ",
        "prediabetesGlucoseText": "ជាតិស្កររបស់អ្នក {{value}} mg/dL ស្ថិតក្នុងកម្រិតព្រមាន។ ការផ្លាស់ប្តូរអាហារូបត្ថម្ភ និងការចលនាជាប្រចាំឥឡូវនេះអាចនាំវាត្រឡប់មកធម្មតាវិញ។",
        "a1cElevatedTitle": "ពិនិត្យ HbA1c រាល់ ៣ ខែ",
        "a1cElevatedText": "HbA1c របស់អ្នក {{value}}% លើសពីគោលដៅ។ ការពិនិត្យរាល់ ៣ ខែបង្ហាញថាតើផែនការរបស់អ្នកដំណើរការពិតប្រាកដឬទេ។",
        "weightManagementTitle": "គោលដៅបន្ថយទម្ងន់បណ្តើរៗ",
        "weightManagementText": "BMI {{value}} ឆ្លើយតបល្យនឹងការផ្លាស់ប្តូរតូចៗ៖ អាហារមានតុល្យភាព និងដើមលេងប្រចាំថ្ងៃ។ ថែមទីឹងទម្ងន់ ៥% ក៏ធ្វើឱ្យជាតិស្ករប្រសើរដែរ។",
        "underweightTitle": "សុំការគាំទ្រអាហារូបត្ថម្ភ",
        "underweightText": "BMI {{value}} ទាបជាងកម្រិតសុខភាព។ ផ្តោតលើអាហារមានសារធាតុចិញ្ចឹម និងសួរអ្នកជំនាញអំពីផែនការឡើងទម្ងន់សុវត្ថិភាព។",
        "symptomDiaryTitle": "កត់ត្រាអាការៈប្រចាំថ្ងៃ",
        "symptomDiaryText": "អ្នកបានរាយការណ៍អាការៈ {{count}} ប្រភេទ ({{symptoms}})។ កត់ត្រាពេលវេលាដែលវាកើតឡើង — វាជួយវេជ្ជបណ្ឌិតរកឃើញទម្រង់។",
        "quitSmokingTitle": "ឈប់ជក់បារីដើម្បីការពារសរសៃឈាម",
        "quitSmokingText": "ការជក់បារីបង្កើនហានិភ័យជំងឺទឹកនោមផ្អែមខ្លាំង។ សួរវេជ្ជបណ្ឌិតអំពីជំនួយបោះបង់ — វាជាការផ្លាស់ប្តូរដែលមានប្រសិទ្ធភាពបំផុត។",
        "reassessSoonTitle": "ពេលវេលាត្រូវវាយតម្លៃឡើងវិញ",
        "reassessSoonText": "ការពិនិត្យចុងក្រោយរបស់អ្នកកាលពី {{days}} ថ្ងៃមុន។ ធ្វើការវាយតម្លៃឡើងវិញដើម្បីធ្វើឱ្យរបាយការណ៍ និងនិន្នាការរបស់អ្នកទាន់សម័យ។",
        "bpMonitorTitle": "ពិនិត្យឈាមនៅផ្ទះ",
        "bpMonitorText": "អ្នកបានសម្គាល់ថាមានឈាមទុំ។ វាស់រាល់ពីរដងក្នុងមួយសប្តាហ៍ពេលស្ងប់ និងយកលទ្ធផលទៅជួបវេជ្ជបណ្ឌិត។",
        "yearlyScreeningTitle": "ពិនិត្យរាល់ឆ្នាំ",
        "yearlyScreeningText": "កត្តាប្រឈមរបស់អ្នកធ្វើឱ្យការពិនិត្យជាតិស្កររាល់ឆ្នាំសំខាន់ — ទោះបីអ្នកមិនមានអាការៈក៏ដោយ។",
        "buildHistoryTitle": "បង្កើតប្រវត្តិសុខភាពរបស់អ្នក",
        "buildHistoryText": "អ្នកបានបញ្ចប់ការវាយតម្លៃ {{count}} ដង។ ធ្វើឡើងវិញរាល់ខែនឹងបង្ហាញនិន្នាការ និងធ្វើឱ្យរបាយការណ៍នីមួយៗឈ្លាសវៃជាងមុន។",
        "stayActiveTitle": "ចលនា ១៥០ នាទីក្នុងមួយសប្តាហ៍",
        "stayActiveText": "ដើមលឿន ជិះកង់ ឬហែលទឹកបន្ថយជាតិស្ករ និងបង្កើនភាពរស់រវើកនៃឥនសុលីន។ ចាប់ផ្តើមដើម ១០ នាទីបន្ទាប់ពីអាហារ។",
        "balancedDietTitle": "រក្សាចានអាហារមានតុល្យភាព",
        "balancedDietText": "ពាក់កណ្តាលបន្លែ ពាក់កណ្តាលប្រហុកស៊ីប៉ូវ ពាក់កណ្តាលគ្រាប់ធញ្ញជាតិ — និងទឹកជំនួសភេសជ្ជៈផ្អែម។ ទម្លាប់សាមញ្ញ ផលប៉ះពាល់ធំលើជាតិស្ករ។"
      },
      "carePlanPage": {
        "loading": "កំពុងផ្ទុកផែនការថែទាំរបស់អ្នក...",
        "loadFailed": "មិនអាចផ្ទុកផែនការថែទាំរបស់អ្នកបានទេ",
        "hero": {
          "eyebrow": "ផែនការថែទាំរបស់អ្នក",
          "lastCheck": "ការពិនិត្យចុងក្រោយ",
          "confidence": "កម្រិតទុកចិត្ត",
          "assessments": "ការវាយតម្លៃ"
        },
        "onboarding": {
          "title": "តោះបង្កើតផែនការថែទាំរបស់អ្នក",
          "description": "ជំហានសាមញ្ញ ៣ ដំណាក់ ហើយអ្វីៗខាងក្រោមនឹងបំពេញដោយលទ្ធផលរបស់អ្នក។",
          "step1": "បំពេញការវាយតម្លៃសុខភាព",
          "step1Text": "ឆ្លើយសំណួរអំពីរោគសញ្ញា របៀបរស់នៅ និងតម្លៃបន្ទប់ពិសោធន៍ — ចំណាយពេលប៉ុន្មាននាទីប៉ុណ្ណោះ។",
          "step2": "ទទួលបានលទ្ធផលភ្លាមៗ",
          "step2Text": "ប្រព័ន្ធជំនាញវិភាគចម្លើយរបស់អ្នក ហើយបង្កើតសេចក្តីសង្ខេបវិនិច្ឆ័យដែលអាចអានបាន។",
          "step3": "អនុវត្តផែនការផ្ទាល់ខ្លួនរបស់អ្នក",
          "step3Text": "បញ្ជីជំហាន កំណត់ចំណាំពីវេជ្ជបណ្ឌិត និងការតាមដានវឌ្ឍនភាពនឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ។",
          "cta": "ចាប់ផ្តើមការវាយតម្លៃដំបូងរបស់ខ្ញុំ"
        },
        "checklist": {
          "title": "បញ្ជីជំហានត្រូវធ្វើ",
          "description": "ជំហានបន្ទាប់ជាក់ស្តែងផ្អែកលើការវាយតម្លៃចុងក្រោយរបស់អ្នក។",
          "progress": "បានបញ្ចប់ {{done}} ក្នុងចំណោម {{total}}",
          "completedTitle": "ធ្វើរួចរាល់ហើយ!",
          "completedText": "អ្នកបានបញ្ចប់គ្រប់ជំហានហើយ។ ត្រឡប់មកមើលវិញបន្ទាប់ពីការវាយតម្លៃបន្ទាប់របស់អ្នក។",
          "reset": "កំណត់ឡើងវិញ",
          "empty": "បំពេញការវាយតម្លៃដើម្បីទទួលបានបញ្ជីជំហានផ្ទាល់ខ្លួនរបស់អ្នក។"
        },
        "doctorNote": {
          "title": "កំណត់ចំណាំពីវេជ្ជបណ្ឌិត",
          "empty": "មិនទាន់មានកំណត់ចំណាំពីវេជ្ជបណ្ឌិតទេ — កំណត់ចំណាំនឹងបង្ហាញនៅទីនេះបន្ទាប់ពីគ្លីនិកពិនិត្យលទ្ធផលរបស់អ្នក។"
        },
        "watch": {
          "title": "តម្លៃដែលគួរតាមដាន",
          "description": "តម្លៃចុងក្រោយពីការវាយតម្លៃរបស់អ្នក ជាមួយគោលដៅសុខភាព។"
        },
        "safety": {
          "title": "សូមស្វែងរកការថែទាំបន្ទាន់ ប្រសិនបើ",
          "item1": "អ្នកមានអាការៈច្រឡំ ងងឹតមុខ ឬស្គមស្គាយ",
          "item2": "ដង្ហើមរហ័ស មានក្លិនស្ករជូរពីមាត់",
          "item3": "ក្អួត ឬរាគធ្វើឱ្យអ្នកមិនអាចផឹកទឹកបាន",
          "item4": "មានរបួមានភាពក្រហម ហើម ឬមិនជាសះស្បើយ",
          "item5": "រោគសញ្ញារបស់អ្នកកាន់តែធ្ងន់ធ្ងរភ្លាមៗ",
          "footnote": "បញ្ជីនេះមិនជំនួសការណែនាំវេជ្ជសាស្ត្រទេ។ ក្នុងករណីភាពបន្ទាន់ សូមទូរស័ព្ទទៅលេខភាពបន្ទាន់ក្នុងស្រុករបស់អ្នក។"
        },
        "history": {
          "title": "ប្រវត្តិការវាយតម្លៃ",
          "description": "ការវាយតម្លៃទាំងអស់ដែលអ្នកបានបញ្ចប់ ថ្មីបំផុតមុនគេ។",
          "viewReport": "មើលរបាយការណ៍",
          "reviewed": "វេជ្ជបណ្ឌិតបានពិនិត្យ"
        },
        "symptoms": {
          "title": "អាការៈពីការវាយតម្លៃចុងក្រោយរបស់អ្នក"
        }
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
      "healthAssessment": "ការវាយតម្លៃសុខភាព (Health Assessment)",
      "draftAutosaved": "សេចក្តីព្រាងត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ",
      "complete": "បានបញ្ចប់",
      "demoFill": "បំពេញសាកល្បង៖",
      "step": "ជំហាន",
      "answered": "បានឆ្លើយ",
      "closeBmiCalc": "បិទម៉ាស៊ីនគិតលេខ",
      "openBmiCalc": "ខ្ញុំមិនដឹង BMI ពិតប្រាកដរបស់ខ្ញុំទេ",
      "weightKg": "ទម្ងន់ (kg)",
      "heightCm": "កម្ពស់ (cm)",
      "labHaveResults": "តើអ្នកមានលទ្ធផល Lab ទេ?",
      "labHaveResultsSub": "តម្លៃ Lab ជួយឱ្យការវិភាគកាន់តែច្បាស់ — ប៉ុន្តែអ្នកអាចរំលងវាបាន",
      "exactValueMgDl": "តម្លៃពិតប្រាកដ (mg/dL)",
      "exactValuePercent": "តម្លៃពិតប្រាកដ (%)",
      "additionalLabTests": "តេស្ត Lab បន្ថែម (ជម្រើស)",
      "testName": "ឈ្មោះតេស្ត",
      "value": "តម្លៃ",
      "add": "បន្ថែម",
      "remove": "លុបចេញ",
      "reviewSummary": "ពិនិត្យសេចក្តីសង្ខេប",
      "reviewSummarySub": "ពិនិត្យម្តងទៀតមុនពេលបញ្ចូល",
      "footerHintContinue": "↓ បំពេញគ្រប់ផ្នែក រួចបន្តទៅមុខ",
      "footerHintSubmitted": "✅ ការវាយតម្លៃត្រូវបានបញ្ជូន",
      "footerHintReady": "🚀 រួចរាល់ក្នុងការបញ្ជូន",
      "criticalHigh": "Critical High",
      "diabetesRange": "Diabetes Range",
      "preDiabetes": "Pre-diabetes",
      "normalRange": "Normal Range",
      "valueMgDl": "តម្លៃ (mg/dL)",
      "extraPlaceholderText": "ឧ. រមួលជើង មាត់ស្ងួត ការឆ្លងរោគញឹកញាប់...",
      "steps": {
        "interview": {
          "title": "ការសម្ភាសន៍ប្រមូលហេតុផល",
          "description": "សំណួរម្តងមួយ — ប្រែប្រួលតាមចម្លើយរបស់អ្នក"
        },
        "profile": {
          "title": "ប្រវត្តិរូប",
          "description": "ព័ត៌មានមូលដ្ឋានរបស់អ្នកជំងឺ"
        },
        "symptoms": {
          "title": "រោគសញ្ញា",
          "description": "រោគសញ្ញាដែលអ្នកកំពុងជួបប្រទះ"
        },
        "labs": {
          "title": "លទ្ធផល Lab",
          "description": "កម្រិត Glucose និងតម្លៃ Lab"
        },
        "risks": {
          "title": "កត្តាហានិភ័យ",
          "description": "ហានិភ័យផ្នែករបៀបរស់នៅ និងវេជ្ជសាស្ត្រ"
        },
        "review": {
          "title": "ពិនិត្យ និងបញ្ជូន",
          "description": "ពិនិត្យព័ត៌មាន និងដំណើរការវិភាគ"
        }
      },
      "interview": {
        "finishNow": "គ្រប់គ្រាន់ហើយ — មើលលទ្ធផល",
        "patientTitle": "ការវាយតម្លៃនេះសម្រាប់អ្នកណា?",
        "patientHelper": "ជ្រើសរើសអ្នកជំងឺ — ចម្លើយដែលយើងដឹងរួចហើយនឹងបំពេញដោយស្វ័យប្រវត្តិ។",
        "ageTitle": "តើអ្នកអាយុប៉ុន្មាន?",
        "ageHelper": "អាយុផ្លាស់ប្តូរកម្រិតនៃការត្រួតពិនិត្យ។",
        "agePlaceholder": "ឧ. 42",
        "sexTitle": "តើអ្នកជាប្រុស ឬស្រី?",
        "sexHelper": "ភេទកំណត់សំណួរ និងកម្រិតដែលអនុវត្តចំពោះអ្នក។",
        "sexMale": "ប្រុស",
        "sexFemale": "ស្រី",
        "sexOther": "ផ្សេងៗ",
        "pregnantTitle": "តើអ្នកមានផ្ទៃពោះបច្ចុប្បន្នឬ?",
        "pregnantHelper": "ពេលមានផ្ទៃពោះ កម្រិតស្ករត្រូវបានធ្វើឱ្យច្បាស់ជាង — ខ្ញុំនឹងកែតម្រូវប្រសិនបើមាន។",
        "stageTitle": "តើអ្នកមានផ្ទៃពោះប៉ុន្មានសប្តាហ៍ហើយ?",
        "stageHelper": "ជាទូទៅ ការពិនិត្យជាតិស្ករពេលមានផ្ទៃពោះធ្វើនៅសប្តាហ៍ 24–28។",
        "stageFirst": "ត្រីមាសទី 1 (0–13 សប្តាហ៍)",
        "stageSecond": "ត្រីមាសទី 2 (14–27 សប្តាហ៍)",
        "stageThird": "ត្រីមាសទី 3 (28+ សប្តាហ៍)",
        "stageUnsure": "មិនប្រាកដ",
        "gdmPrevTitle": "តើអ្នកធ្លាប់មានជាតិស្ករខ្ពស់ពេលមានផ្ទៃពោះពីមុនឬ?",
        "gdmPrevHelper": "ករណីពីមុនធ្វើឱ្យហានិភ័យកើនឡើង ហើយត្រូវពិនិត្យទាន់ពេលជាង។",
        "onsetTitle": "តើរោគសញ្ញាបានលេចឡើងយ៉ាងលឿនឬ?",
        "onsetHelper": "លេចឡើងលឿន (ចាប់ពីមួយថ្ងៃដល់មួយសប្តាហ៍) ចង្អុលបង្ហាញទឹកនោមផ្អែមប្រភេទទី 1; បើបណ្តើរៗច្បាស់ជាងនេះទៅទៀត ជាប្រភេទទី 2។",
        "coreSymptomsTitle": "តើអ្នកសម្គាល់ឃើញអ្វីខ្លះថ្មីៗនេះ?",
        "coreSymptomsHelper": "ជ្រើសរើសទាំងអស់ដែលមាន — ឬចុច \"មិនមានទាំងអស់\" ប្រសិនបើអ្នកស្រួលល្អ។",
        "otherSymptomsTitle": "តើមានទាំងនេះដែរឬ?",
        "otherSymptomsHelper": "ជ្រើសរើសទាំងអស់ដែលមាន — ឬចុច \"មិនមានទាំងអស់\"។",
        "warningTitle": "តើមានសញ្ញាព្រមានទាំងនេះឥឡូវនេះឬ?",
        "warningHelper": "ទាំងនេះជួយរកឃើញស្ករទាប ឬអាសន្ន។",
        "riskTitle": "តើទាំងនេះអនុវត្តចំពោះអ្នកឬ?",
        "riskHelper": "ចម្លើយដែលដឹងរួចពីប្រវត្តិសុខភាពរបស់អ្នកត្រូវដាក់ជាមុន — អ្នកអាចផ្លាស់ប្តូរបាន។",
        "bodyTitle": "កម្ពស់ និងទម្ងន់",
        "bodyHelper": "ខ្ញុំនឹងគណនា BMI ដោយស្វ័យប្រវត្តិ — ឬបញ្ចូលផ្ទាល់ប្រសិនបើអ្នកដឹង។",
        "bmiIs": "BMI របស់អ្នក:",
        "orExactBmi": "ឬបញ្ចូល BMI ផ្ទាល់",
        "hasLabsTitle": "តើអ្នកមានលទ្ធផល Lab ថ្មីៗឬ?",
        "hasLabsHelper": "តម្លៃ Lab ធ្វើឱ្យលទ្ធផលត្រឹមត្រូវជាង — ប៉ុន្តែគ្មានវាក៏ដំណើរការដែរ។",
        "labsTitle": "បញ្ចូលតម្លៃ Lab ដែលអ្នកមាន",
        "labsHelper": "មួយក្នុងចំណោមទាំងនេះជួយបាន — អ្វីៗទាំងអស់ស្រេចចិត្ត។",
        "extraTitle": "មានអ្វីទៀតដែលត្រូវប្រាប់វេជ្ជបណ្ឌិត?",
        "extraHelper": "អ្វីដែលសំណួរមិនបានគ្របដណ្តប់ — ស្រេចចិត្ត។",
        "noneOfThese": "មិនមានទាំងអស់",
        "selectedCount": "ត្រូវបានជ្រើសរើស",
        "answerYes": "មាន",
        "answerNo": "គ្មាន",
        "skip": "រំលង",
        "doneEditing": "រួចរាល់",
        "insightPregnantTitle": "កត្តសម្គាល់ការមានផ្ទៃពោះ — កែតម្រូវអ្វីដែលត្រូវពិនិត្យ",
        "insightPregnantText": "ជាតិស្ករពេលមានផ្ទៃពោះប្រើកម្រិតច្បាស់ជាង។ សំណួរពាក់ព័ន្ធនឹងតាមមក ហើយ Lab របស់អ្នកនឹងត្រូវបកស្រាយតាមកម្រិតពេលមានផ្ទៃពោះ។",
        "insightT1dTitle": "លំនាំនេះទាមទារការយកចិត្តទុកដាក់",
        "insightT1dText": "ការស្រកទម្ងន់ជាមួយស្រេកទឹកខ្លាំង និងឡើងទឹកញឹកញាប់ អាចបង្ហាញជំងឺទ្រិយើស្ករប្រភេទទី 1 ដែលវិវត្តលឿន។ នេះនឹងត្រូវដាក់សញ្ញាសម្រាប់វេជ្ជបណ្ឌិតពិនិត្យ។",
        "insightTriadTitle": "លំនាំសំខាន់នៃទឹកនោមផ្អែម",
        "insightTriadText": "ស្រេកទឹកខ្លាំង ឡើងទឹកញឹកញាប់ និងឃ្លានខ្លាំងរួមគ្នា គឺជាក្រុមសំខាន់ (Polydipsia, Polyuria, Polyphagia) — ជាតិស្ករខ្ពស់ទាញទឹកចេញពីរាងកាយអ្នក។ សំណួរបន្ទាប់ជួយប្រាប់ថាប្រភេទណាស្របនឹងអ្នក។",
        "insightT2Title": "កើតឡើងយឺតៗ — លំនាំប្រភេទទី 2",
        "insightT2Text": "រោគសញ្ញាដែលកើតឡើងតាមរយៈពេលខ្ពស់ជាង 1 ខែ ច្រើនតែចង្អុលទៅប្រភេទទី 2 ដែលរាងកាយនៅតែផលិតអ៊ីនស៊ុលីន ប៉ុន្តែធន់នឹងវា។ សញ្ញាដូចជាស្បែកខ្មៅជ្រួញៗ ស្ពឹកចុងដៃចុងជើង និងរបួសជាយឺត សំខាន់បំផុតនៅទីនេះ។",
        "insightChildTitle": "ក្នុងកុមារ លំនាំនេះមានលក្ខណៈបន្ទាន់",
        "insightChildText": "ស្រេកទឹកខ្លាំង និងឡើងទឹកច្រើនភ្លាមៗក្នុងកុមារ — ជាពិសេសជាមួយការលូតកន្ទក់ថ្មី — គឺជាសញ្ញាខ្លាំងនៃប្រភេទទី 1។ ការវាស់ស្ករដោយចុបម្រាមដៃថ្ងៃនេះ លឿនបំផុតដើម្បីដឹង។",
        "insightDkaTitle": "អាចជាអាសន្ន — សូមអាន",
        "insightKetosisTitle": "សញ្ញាព្រមានគីតូន",
        "insightKetosisText": "ដង្ហើមមានក្លិនផ្លែឈើ ឬដកដង្ហើមជ្រៅលឿន អាចមានន័យថាគីតូនកំពុងកើនឡើង — សញ្ញានៃការខ្វះអ៊ីនស៊ុលីន។ បើរួមជាមួយអារម្មណ៍មិនស្រួល ត្រូវទៅពេទ្យបន្ទាន់។",
        "insightDkaText": "ក្អួត ឬឈឺក្បុនជាមួយស្ករខ្ពស់ អាចជាសញ្ញា DKA — អាសន្នវេជ្ជសាស្ត្រ។ ប្រសិនបើអ្នកមិនស្រួលខ្លាំងឥឡូវនេះ សូមទៅព្យាបាលបន្ទាន់ជាមុន; ការវាយតម្លៃនេះអាចរង់ចាំបាន។",
        "insightHypoTitle": "សញ្ញាអាចជាស្ករទាប",
        "insightHypoText": "រញ្ជួយ ញើស ឬវិលមុខ អាចមានន័យថាស្ករក្នុងឈាមទាប។ ប្រសិនបើអ្នកមានម៉ាស៊ីនវាស់ស្ករ ការវាស់ឥឡូវនេះនឹងមានតម្លៃខ្ពស់។",
        "childProbeTitle": "មានលូតកន្ទក់ថ្មីពេលយប់ដែរឬទេ?",
        "childProbeHelper": "ក្នុងកុមារ ការលូតកន្ទក់ថ្មីជាមួយការស្រេកទឹកខ្លាំង ឬឡើងទឹកច្រើន គឺជាសញ្ញាខ្លាំងបំផុតនៃប្រភេទទី 1។",
        "t2ProbeTitle": "មានសញ្ញាប្រឆាំងអ៊ីនស៊ុលីនទាំងនេះដែរឬទេ?",
        "t2ProbeHelper": "នៅពេលអាការៈកើតឡើងបណ្តើរៗ សញ្ញាទាំងនេះចង្អុលខ្លាំងទៅលំនាំប្រភេទទី 2។",
        "insightShortcutTitle": "រំលងសំណួរពិសោធន៍ឈាម — នេះជាមូលហេតុ",
        "insightShortcutText": "ជាមួយសញ្ញាដែលអ្នកបានរាយការណ៍ ជំហានបន្ទាប់ដូចគ្នាមិនថាលទ្ធផលពិសោធន៍ដូចម្តេចទេ៖ ទៅពិនិត្យជាមួយពេទ្យថ្ងៃនេះ។ ខ្ញុំរំលងសំណួរពិសោធន៍ឈាមដើម្បីសន្សំពេលអ្នក — បញ្ចប់សំណួរដែលនៅសល់ ដើម្បីឲ្យរបាយការណ៍របស់អ្នកពេញលេញសម្រាប់វេជ្ជបណ្ឌិត។",
        "answeredLabel": "បានឆ្លើយ:",
        "questionN": "សំណួរ",
        "allAnsweredTitle": "សំណួរទាំងអស់ត្រូវបានឆ្លើយ",
        "allAnsweredText": "ពិនិត្យហេតុផលរបស់អ្នក បន្ទាប់មកដំណើរការការវាយតម្លៃ។",
        "goReview": "ពិនិត្យ និងដំណើរការ",
        "editAnswers": "កែសម្រួលចម្លើយសម្ភាសន៍",
        "pregnantShort": "មានផ្ទៃពោះ",
        "notPregnant": "មិនមានផ្ទៃពោះ"
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
          "underweight": "ក្រោមទម្ងន់ស្តង់ដារ",
          "normal": "ធម្មតា",
          "overweight": "លើសទម្ងន់",
          "obese": "ធាត់កម្រិតថ្នាក់ (Obese)"
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
          "fatigue": "អស់កម្លាំងប្រចាំ",
          "blurredVision": "មើលមិនច្បាស់",
          "weightLoss": "ស្រកទម្ងន់ដោយមិនដឹងមូលហេតុ",
          "slowHealing": "របួសជាសះស្បើយយឺត",
          "nausea": "ចង់ក្អួត (Nausea)",
          "tinglingHandsFeet": "រមួលដៃឬជើង",
          "frequentInfections": "ឆ្លងរោគញឹកញាប់",
          "acanthosisNigricans": "ស្នាមអុចខ្មៅលើស្បែក (Acanthosis Nigricans)",
          "excessiveHunger": "ហៀរស្រេកអាហារខ្លាំង",
          "irritability": "អាក់អន់ចិត្ត / ប្រែប្រួលអារម្មណ៍",
          "recurrentUtiYeast": "ឆ្លងទឹកនោម / ផ្សិតញឹកញាប់",
          "bedWetting": "ក្រពៅលើគ្រែថ្មី (កុមារ)"
        },
        "safetySymptoms": {
          "sweating": "បែកញើសខ្លាំង",
          "shaking": "ញ័រដៃជើង",
          "dizziness": "វិលមុខ",
          "vomiting": "ក្អួត",
          "abdominalPain": "ឈឺពោះ",
          "fruityBreath": "ដង្ហើមមានក្លិនផ្លែឈើ",
          "deepRapidBreathing": "ដកដង្ហើមជ្រៅ លឿន"
        },
        "hypoglycemia": {
          "confusion": "ស្រពិចស្រពិល ឬពិបាកផ្តោតអារម្មណ៍",
          "palpitations": "បេះដូងលោតញាប់ (Palpitations)",
          "improvesWithSugar": "រោគសញ្ញាថយចុះក្រោយពេលញ៉ាំស្ករ"
        },
        "urgent": {
          "nausea": "ចង់ក្អួត (Nausea)",
          "rapidBreathing": "ដកដង្ហើមលឿនៗ ឬជ្រៅ",
          "unableToKeepFluids": "មិនអាចផឹកទឹក ឬរក្សាសារធាតុរាវបាន",
          "crisis": "មើលទៅឈឺធ្ងន់ ឬស្ថិតក្នុងស្ថានភាពសង្គ្រោះបន្ទាន់"
        },
        "riskFactors": {
          "familyHistory": "ប្រវត្តិគ្រួសារ",
          "obesity": "ភាពធាត់ / លើសទម្ងន់ (Obesity)",
          "hypertension": "សម្ពាធឈាមខ្ពស់ (Hypertension)",
          "sedentaryLifestyle": "មិនសូវមានសកម្មភាពរាងកាយ",
          "gestationalHistory": "ប្រវត្តិទឹកនោមផ្អែមពេលមានផ្ទៃពោះ (Gestational Diabetes)",
          "smoking": "អ្នកកំពុងជក់បារី",
          "highCholesterol": "Cholesterol ខ្ពស់",
          "pcosHistory": "ប្រវត្តិជំងឺ PCOS",
          "ethnicityHighRisk": "ជាតិសាសន៍ដែលមានហានិភ័យខ្ពស់"
        },
        "labs": {
          "fasting": {
            "normal": "ធម្មតា",
            "prediabetes": "មុនទឹកនោមផ្អែម",
            "diabetes": "កម្រិតទឹកនោមផ្អែម",
            "critical": "ធ្ងន់ធ្ងរ"
          },
          "hba1c": {
            "normal": "ធម្មតា",
            "prediabetes": "មុនទឹកនោមផ្អែម",
            "diabetes": "កម្រិតទឹកនោមផ្អែម",
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
        "newAssessment": "ការវាយតម្លៃថ្មី"
      },
      "patient": {
        "title": "តើអ្នកណាកំពុងត្រូវបានវាយតម្លៃ?",
        "loading": "កំពុងទាញយកទិន្នន័យអ្នកជំងឺ...",
        "selectPlaceholder": "ជ្រើសរើសអ្នកជំងឺ",
        "noPatients": "មិនមានអ្នកជំងឺទេ",
        "noSelection": "មិនបានជ្រើសរើស"
      },
      "profile": {
        "ageTitle": "តើអ្នកអាយុប៉ុន្មាន?",
        "ageHelper": "ជ្រើសរើសចន្លោះអាយុ ឬបញ្ចូលអាយុពិតប្រាកដរបស់អ្នក",
        "exactAge": "ឬបញ្ចូលអាយុពិតប្រាកដ",
        "bmiTitle": "Body Mass Index (BMI)",
        "exactBmi": "ជ្រើសរើសចន្លោះតម្លៃ ឬបញ្ចូលលេខ BMI របស់អ្នក",
        "waistTitle": "រង្វង់ចង្កេះ (Waist Circumference) (ជម្រើស)",
        "exactWaist": "រង្វង់ចង្កេះគិតជា cm",
        "waistHelper": "ជួយរកឃើញការធាត់ដុះក្បាលពោះ ដែលជាកត្តាហានិភ័យដ៏សំខាន់នៃជំងឺទឹកនោមផ្អែម"
      },
      "symptoms": {
        "commonTitle": "រោគសញ្ញាទូទៅ",
        "commonHelper": "ជ្រើសរើសរោគសញ្ញាណាមួយដែលអ្នកកំពុងជួបប្រទះ",
        "safetyTitle": "សញ្ញាព្រមាន",
        "safetyHelper": "ទាំងនេះជួយរកមើលកម្រិតជាតិស្ករក្នុងឈាមទាប ឬករណីបន្ទាន់",
        "hypoglycemiaTitle": "សំណួរបន្ថែមអំពី Hypoglycemia",
        "hypoglycemiaHelper": "បង្ហាញដោយសារតែអ្នកបានជ្រើសរើសការបែកញើស ញ័រ ឬវិលមុខ។",
        "urgentTitle": "សំណួរបន្ទាន់ / តាមដាន DKA",
        "urgentHelper": "បង្ហាញដោយសារអ្នកមានអាការៈក្អួត ឈឺពោះ ឬលំនាំកម្រិតស្ករខ្ពស់។",
        "extraTitle": "តើមានអ្វីផ្សេងទៀតទេ?",
        "extraHelper": "សូមពិពណ៌នាពីរោគសញ្ញាបន្ថែម (ជម្រើស)",
        "extraPlaceholder": "ឧ. មាត់ស្ងួត, រមួលជើង"
      },
      "labs": {
        "availabilityTitle": "ភាពមានត្រៀមលក្ខណៈនៃលទ្ធផល Lab",
        "noLabs": "ខ្ញុំមិនមានលទ្ធផល Lab នៅពេលនេះទេ (បន្តក្នុងរបៀប Screening)។",
        "currentMode": "របៀបបច្ចុប្បន្ន៖",
        "fastingTitle": "Fasting Blood Glucose",
        "rangeHelper": "ជម្រើស៖ អាចជ្រើសរើសកម្រិតតម្លៃជាមុន បន្ទាប់មកបញ្ចូលតម្លៃពិតប្រាកដក៏បាន។",
        "exactFasting": "តម្លៃ Fasting Glucose ពិតប្រាកដ",
        "hba1cTitle": "HbA1c (Glycated Hemoglobin)",
        "exactHba1c": "តម្លៃ HbA1c ពិតប្រាកដ",
        "randomTitle": "Random Glucose (ជម្រើស)",
        "randomLabel": "Random Plasma Glucose (mg/dL)",
        "additionalTitle": "តម្លៃ Lab បន្ថែម",
        "labNamePlaceholder": "ឈ្មោះតេស្ត",
        "valuePlaceholder": "តម្លៃ",
        "add": "បន្ថែម",
        "remove": "លុបចេញ",
        "noAdditionalLabs": "មិនទាន់បានបន្ថែមតម្លៃ Lab ទេ។",
        "title": "តើអ្នកមានលទ្ធផល Lab ទេ?",
        "helper": "តម្លៃ Lab ជួយឱ្យការវិភាគកាន់តែច្បាស់ — ប៉ុន្តែអ្នកអាចរំលងវាបាន",
        "noLabsAvailable": "ខ្ញុំមិនមានលទ្ធផល Lab នៅពេលនេះទេ",
        "mode": "Mode",
        "diagnosticMode": "🔬 Diagnostic Mode",
        "screeningMode": "📋 Screening Mode",
        "fastingHelper": "mg/dL — បន្ទាប់ពីអត់អាហារ ៨ ម៉ោងឡើងទៅ",
        "hba1cHelper": "ភាគរយ (%) — បង្ហាញពីកម្រិតស្ករមធ្យម ក្នុងរយៈពេល ២-៣ ខែចុងក្រោយ",
        "ogttTitle": "2-Hour OGTT (ជម្រើស)",
        "ogttHelper": "mg/dL — វាស់ ២ ម៉ោងបន្ទាប់ពីទទួលទានស្ករ ៧៥g",
        "rpgTitle": "Random Blood Glucose (ជម្រើស)",
        "rpgHelper": "mg/dL — តេស្តនៅពេលណាក៏បាន មិនចាំបាច់អត់អាហារ"
      },
      "riskFactors": {
        "title": "បញ្ជីត្រួតពិនិត្យកត្តាហានិភ័យ",
        "helper": "ជ្រើសរើសកត្តាហានិភ័យទាំងអស់ដែលមាន។"
      },
      "review": {
        "title": "ការពិនិត្យរហ័សមុនពេលវិភាគ",
        "helper": "សូមពិនិត្យមើលសេចក្តីសង្ខេបនេះ មុនពេលអ្នកដំណើរការវិភាគ (Diagnosis)។",
        "summaryTitle": "សេចក្តីសង្ខេបព័ត៌មានអ្នកជំងឺ",
        "patient": "អ្នកជំងឺ",
        "notSelected": "មិនទាន់ជ្រើសរើស",
        "currentUser": "អ្នកប្រើប្រាស់បច្ចុប្បន្ន",
        "mode": "Mode",
        "sexPregnancy": "ភេទ / ការមានផ្ទៃពោះ",
        "bodyMetrics": "អាយុ / ទម្ងន់រាងកាយ / រង្វង់ចង្កេះ",
        "glucoseTests": "ការធ្វើតេស្ត Glucose (Fasting / HbA1c / Random)",
        "counts": "រោគសញ្ញា / កត្តាហានិភ័យ",
        "adaptiveFlags": "Adaptive Branch Flags",
        "hypoglycemia": "Hypoglycemia",
        "urgent": "Urgent/DKA",
        "on": "បើក (On)",
        "off": "បិទ (Off)",
        "resultGenerated": "លទ្ធផលត្រូវបានបង្កើតដោយជោគជ័យ។ សូមបើកទំព័ររបាយការណ៍ ដើម្បីមើលការពន្យល់គ្លីនិកពេញលេញ។",
        "openReport": "បើកទំព័ររបាយការណ៍លទ្ធផល",
        "submitHint": "បញ្ជូនការវាយតម្លៃនេះ ដើម្បីបង្កើតលទ្ធផល Diagnosis។",
        "overview": "ទិដ្ឋភាពទូទៅនៃការវាយតម្លៃ",
        "profile": "អាយុ / BMI / ជុំចង្កេះ",
        "glucose": "ការធ្វើតេស្ត Glucose",
        "symptoms": "រោគសញ្ញា",
        "risks": "កត្តាហានិភ័យ",
        "flags": "សញ្ញាសម្គាល់ (Flags)"
      },
      "footer": {
        "continueHint": "ឆ្លើយគ្រប់ផ្នែក ហើយបន្តទៅជំហានបន្ទាប់។",
        "resultReadyHint": "លទ្ធផល Diagnosis រួចរាល់ហើយ។ អ្នកអាចកែប្រែព័ត៌មាន ហើយដំណើរការម្តងទៀតបាន។",
        "reviewHint": "ពិនិត្យសេចក្តីសង្ខេបរបស់អ្នក រួចដំណើរការការវិភាគ។",
        "back": "ត្រឡប់ក្រោយ",
        "next": "បន្ទាប់",
        "running": "កំពុងដំណើរការ...",
        "runAgain": "ដំណើរការម្តងទៀត",
        "runExpertSystem": "ដំណើរការ Expert System",
        "newAssessment": "ការវាយតម្លៃថ្មី"
      },
      "confirm": {
        "title": "ចាប់ផ្តើមការវាយតម្លៃថ្មី?",
        "description": "វានឹងលុបសេចក្តីព្រាង និងលទ្ធផលបច្ចុប្បន្នចេញពីឧបករណ៍នេះ។ បន្តតែបើអ្នកពិតជាចង់ចាប់ផ្តើមសារជាថ្មីប៉ុណ្ណោះ។",
        "cancel": "បោះបង់",
        "confirm": "ចាប់ផ្តើមថ្មី"
      },
      "modeLabels": {
        "diagnostic": "Diagnostic",
        "screening": "Screening"
      },
      "errors": {
        "loadPatients": "មិនអាចទាញយកបញ្ជីអ្នកជំងឺសម្រាប់ការវាយតម្លៃបានទេ",
        "enterLabName": "សូមបញ្ចូលឈ្មោះតេស្ត Lab ជាមុន មុនពេលបន្ថែមវា។",
        "enterLabValue": "សូមបញ្ចូលតម្លៃលេខឱ្យបានត្រឹមត្រូវជាមុន មុនពេលបន្ថែមវា។",
        "selectPatient": "សូមជ្រើសរើសអ្នកជំងឺសិន មុនបន្ត។",
        "ageRange": "អាយុត្រូវតែស្ថិតនៅចន្លោះ 0 ដល់ 120។",
        "bmiRange": "BMI ត្រូវតែស្ថិតនៅចន្លោះ 10 ដល់ 80។",
        "waistRange": "រង្វង់ចង្កេះត្រូវតែស្ថិតនៅចន្លោះ 30 ដល់ 250 cm។",
        "fastingRange": "Fasting Glucose ត្រូវតែស្ថិតនៅចន្លោះ 40 ដល់ 600។",
        "hba1cRange": "HbA1c ត្រូវតែស្ថិតនៅចន្លោះ 3 ដល់ 20។",
        "randomRange": "Random Glucose ត្រូវតែស្ថិតនៅចន្លោះ 30 ដល់ 1000។",
        "submitFailed": "ការបញ្ជូនការវាយតម្លៃត្រូវបានបរាជ័យ"
      },
      "risks": {
        "title": "កត្តាហានិភ័យ",
        "helper": "តើកត្តាហានិភ័យណាមួយដែលទាក់ទងនឹងអ្នក?"
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
      "diagnosticOutput": "លទ្ធផលនៃការវាយតម្លៃ",
      "suspectedType": "ប្រភេទដែលសង្ស័យ",
      "type": {
        "type1": "លំនាំប្រភេទទី 1",
        "type2": "លំនាំប្រភេទទី 2",
        "gestational": "លំនាំពេលមានផ្ទៃពោះ",
        "mixed": "លក្ខណៈលាយចម្រុះ",
        "undetermined": "មិនអាចកំណត់បាន"
      },
      "probabilityBase": "ផ្អែកលើទិន្នន័យគ្លីនិកទាំងអស់ ប្រព័ន្ធវិភាគបានគណនាថាមាន ",
      "probabilityOf": " នៃការវិនិច្ឆ័យនេះ។",
      "probability": {
        "veryHigh": "ប្រូបាប៊ីលីតេខ្ពស់ខ្លាំង (very high probability)",
        "high": "ប្រូបាប៊ីលីតេខ្ពស់ (high probability)",
        "moderate": "ប្រូបាប៊ីលីតេមធ្យម (moderate probability)",
        "low": "ប្រូបាប៊ីលីតេទាប (low probability)"
      },
      "overallScore": "ទំនុកចិត្តនៃការស្កេន",
      "clinicalEvidence": "ភស្តុតាងនៅខាងក្រោមលទ្ធផលនេះ",
      "keyDiagnosticIndicators": "លទ្ធផលពិសោធន៍របស់អ្នក",
      "hba1cIndicator": "HbA1c — មធ្យមភាគជាតិស្ករ 3 ខែ",
      "hba1cSubtitle": "សូចនាករសំខាន់នៃការគ្រប់គ្រងជាតិស្កររយៈពេលវែង។",
      "fastingIndicator": "ជាតិស្ករអត់ភោជន៍ — អត់អាហារ 8 ម៉ោង",
      "fastingSubtitle": "បង្ហាញកម្រិតជាតិស្ករបន្ទាប់ពីអត់អាហារ ៨ ម៉ោង។",
      "evidenceCompleteness": "តើព័ត៌មានពេញលេញប៉ុណ្ណា?",
      "availableLabs": "បានផ្ដល់៖",
      "missing": "មិនបានផ្ដល់៖",
      "none": "គ្មាន",
      "relevantHistory": "រោគសញ្ញារបស់អ្នក",
      "knownSymptoms": "អ្នកបានជម្រាប៖",
      "symptomAlign": "រោគសញ្ញាដែលអ្នកជំងឺបានរាយការណ៍ស្របនឹងលំនាំជំងឺទឹកនោមផ្អែមដែលបង្ហាញដោយប្រព័ន្ធវិភាគ។",
      "noSymptom": "មិនមានលំនាំរោគសញ្ញាលេចធ្លោត្រូវបានជ្រើសរើសទេ។",
      "riskFactors": "ហានិភ័យរបស់អ្នក",
      "knownHistory": "ប្រវត្តិរបស់អ្នក៖",
      "noRisk": "មិនមានកត្តាហានិភ័យត្រូវបានកត់សម្គាល់ក្នុងការដាក់ស្នើនេះទេ។",
      "reasoningKeyRules": "វិធានដែលផ្គូផ្គង (បច្ចេកទេស)",
      "matchedRule": "វិធានដែលត្រូវគ្នា",
      "ruleConditionMatched": "លក្ខខណ្ឌវិធានត្រូវគ្នា។",
      "contribution": "ការរួមចំណែក",
      "noDetailedRule": "មិនមានការវិភាគវិធានលម្អិតសម្រាប់ការដំណើរការនេះទេ។",
      "diagnosticReasoning": "ការវិភាគរោគវិនិច្ឆ័យ",
      "diagnosticReasoningP1": "ប្រព័ន្ធប្រៀបធៀបការវាយតម្លៃនេះជាមួយវិធានជំងឺទឹកនោមផ្អែមដែលមានរចនាសម្ព័ន្ធ ពីភស្តុតាងរោគសញ្ញា មន្ទីរពិសោធន៍ និងកត្តាហានិភ័យ។",
      "diagnosticReasoningP2": "កម្រិតទុកចិត្តត្រូវបានគណនាពីកម្លាំង និងអាទិភាពនៃវិធានដែលត្រូវគ្នា រួចកែតម្រូវដោយភាពពេញលេញនៃភស្តុតាង។",
      "diagnosticReasoningP3": "លទ្ធផលនេះគឺជាសេចក្តីសង្ខេបជំនួយការសម្រេចចិត្ត ហើយគួរត្រូវបានពិនិត្យជាមួយអ្នកជំនាញសុខភាពមានសមត្ថភាព។",
      "actionableRecommendations": "អ្វីដែលអ្នកគួរធ្វើបន្ទាប់",
      "urgentTag": "បន្ទាន់",
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
      "couldFit": "អាចស្របនឹង៖",
      "plainSummary": {
        "title": "សង្ខេប",
        "whatThisIs": "របាយការណ៍នេះប្រៀបធៀបចម្លើយរបស់អ្នកជាមួយលំនាំទឹកនោមផ្អែមទូទៅ។ វាជាការត្រួតពិនិត្យ — មិនមែនជាការវិនិច្ឆ័យចប់ទេ។ គ្រូពេទ្យនិងតេស្តសាមញ្ញអាចបញ្ជាក់បាន។",
        "matchedMany": "ចម្លើយរបស់អ្នកផ្គូផ្គងសញ្ញា {{count}} ចំណុចដែលទាក់ទងនឹងជាតិស្ករខ្ពស់។",
        "matchedFew": "ការវាយតម្លៃនេះមានទិន្នន័យផ្ទាល់តិចតួច — លទ្ធផលផ្អែកលើលំនាំហានិភ័យទូទៅ។",
        "typeFit": "លំនាំនេះស្របនឹង{{type}}។",
        "couldFitTwo": "សញ្ញាអាចស្របនឹង{{first}} ({{firstPercent}}%) ឬ{{second}} ({{secondPercent}}%) — ជំហានដំបូងដូចគ្នាដែរ។",
        "noType": "មិនទាន់មានលំនាំប្រភេទណាមួយលេចធ្លោទេ។",
        "nextStep": "ជំហានបន្ទាប់៖"
      },
      "symptomGuide": {
        "items": {
          "excessiveThirst": { "term": "Polydipsia", "meaning": "អាចកើតឡើងពេលជាតិស្ករក្នុងឈាមខ្ពស់ — រាងកាយទាញទឹកដើម្បីបន្ថយប្រភេទស្ករ។" },
          "frequentUrination": { "term": "Polyuria", "meaning": "ភាគច្រើនមកជាមួយជាតិស្ករខ្ពស់ — តណ្ហាប្រឹងប្រែងបញ្ចេញស្ករលើសទៅក្រៅ។" },
          "excessiveHunger": { "term": "Polyphagia", "meaning": "អាចកើតឡើងពេលជាតិស្ករចូលទៅក្នុងក្រឡាក្រូបសាចមិនបាន។" },
          "weightLoss": { "term": "ការស្គាត់ចុះ (catabolic)", "meaning": "រាងកាយដុតខ្លាញ់និងសាច់ដុំជំនួសថាមពល ពេលជាតិស្ករចូលក្រឡាក្រូបមិនបាន។" },
          "fatigue": { "term": "អស់កម្លាំង", "meaning": "ក្រឡាក្រូបសាចមិនទទួលបានជាតិស្ករគ្រប់គ្រាន់ដើម្បីបង្កើតថាមពល។" },
          "blurredVision": { "term": "ភ្នែកមុង", "meaning": "ជាតិស្ករខ្ពស់ទាញទឹកចូលត្រឡប់ភ្នែក ធ្វើឱ្យមើលមិនច្បាស់។" },
          "slowHealing": { "term": "របួសយូរជាសះ", "meaning": "ជាតិស្ករខ្ពស់បន្ថយដំណើរឈាមវិញភាគ និងចុះខ្សោយភាពការពាររាងកាយ។" },
          "tingling": { "term": "Neuropathy", "meaning": "ជាតិស្ករខ្ពស់អាចបំផ្លាញសរសៃប្រសាទតូចៗយូរៗទៅ។" },
          "frequentInfections": { "term": "ងាយឆ្លង", "meaning": "ជាតិស្ករខ្ពស់ចុះខ្សោយប្រព័ន្ធភាពការពាររាងកាយ។" },
          "acanthosisNigricans": { "term": "Acanthosis nigricans", "meaning": "ស្បែកខ្មៅជ្រួញៗ — ភាគច្រើនទាក់ទងនឹង insulin resistance។" },
          "irritability": { "term": "អារម្មណ៍ប្រែប្រួល", "meaning": "ជាតិស្ករឡើងចុះអាចប៉ះពាល់អារម្មណ៍និងការផ្ចង់អារម្មណ៍។" },
          "recurrentInfections": { "term": "ឆ្លងម្តងហើយម្តងទៀត", "meaning": "ជាតិស្ករក្នុងនោមធ្វើឱ្យបាកតេរី និងផ្សិតលូតលាស់។" },
          "bedWetting": { "term": "នោមពេលយប់", "meaning": "ជាតិស្ករលើសទាញទឹកច្រើន — សញ្ញាសំខាន់នៃប្រភេទទី 1 ក្នុងកុមារ។" },
          "fruityBreath": { "term": "ក្លិនផ្លែឈើខូច", "meaning": "អាចជា DKA (ketone ខ្ពស់) — ត្រូវទៅពេទ្យបន្ទាន់។" },
          "deepRapidBreathing": { "term": "ដង្ហើម Kussmaul", "meaning": "រាងកាយប្រឹងប្រែងបញ្ចេញអាស៊ីត ketone — ត្រូវទៅពេទ្យបន្ទាន់។" },
          "nausea": { "term": "ក្អួតចង្អោរ", "meaning": "អាចកើតពេលជាតិស្ករឬ ketone ខ្ពស់ខ្លាំង។" },
          "vomiting": { "term": "ក្អួត", "meaning": "ពេលជាតិស្ករខ្ពស់ខ្លាំងអាចជាសញ្ញា DKA — ទៅពេទ្យបន្ទាន់។" },
          "abdominalPain": { "term": "ចុកពោះ", "meaning": "ពេលជាតិស្ករខ្ពស់ខ្លាំងអាចជាសញ្ញា DKA — ទៅពេទ្យបន្ទាន់។" },
          "sweating": { "term": "ញើសច្រើន", "meaning": "អាចជាសញ្ញាជាតិស្ករទាប (hypoglycemia)។" },
          "shaking": { "term": "ញ័រ", "meaning": "សញ្ញាទូទៅនៃជាតិស្ករទាប (hypoglycemia)។" },
          "dizziness": { "term": "វិលមុខ", "meaning": "អាចមកពីជាតិស្ករទាប — ឬខ្ពស់ខ្លាំង។" }
        }
      },
      "whyResult": {
        "title": "ហេតុអ្វីទិន្នន័យដូចនេះ?",
        "toldUs": "អ្វីដែលអ្នកបានជម្រាប",
        "measured": "តម្លៃមន្ទីរពិសោធន៍ដែលអ្នកបានផ្ដល់",
        "missingTitle": "ការពិនិត្យដែលនឹងជួយបានច្រើនបំផុត",
        "noSymptoms": "ក្នុងការវាយតម្លៃនេះ មិនមានរោគសញ្ញាឬហានិភ័យត្រូវបានជម្រាបទេ។",
        "noLabs": "មិនមានតម្លៃមន្ទីរពិសោធន៍ទេ — លទ្ធផលផ្អែកលើចម្លើយរបស់អ្នកតែប៉ុណ្ណោះ។",
        "allProvided": "ការពិនិត្យដែលបានណែនាំទាំងអស់ត្រូវបានផ្ដល់រួចហើយ។",
        "summaryPrefix": "ប្រព័ន្ធបានផ្គូផ្គងព័ត៌មាន",
        "summarySuffix": "ចំណុចពីការវាយតម្លៃរបស់អ្នក។",
        "limitedNote": "លទ្ធផលនេះផ្អែកលើព័ត៌មានមិនពេញលេញ — ការពិនិត្យដែលខ្វះខាតខាងលើនឹងធ្វើឱ្យលទ្ធផលជឿជាក់ជាងមុន។"
      },
      "technical": {
        "title": "ព័ត៌មានបច្ចេកទេស — សម្រាប់គ្រូពេទ្យ",
        "subtitle": "ដានវិធានដែលប្រព័ន្ធប្រើដើម្បីសម្រេចលទ្ធផល។ អ្នកជំងឺអាចមិនត្រូវការផ្នែកនេះទេ។"
      },
      "labStatusHigh": "ខ្ពស់",
      "labStatusElevated": "ខ្ពស់ជាងធម្មតា",
      "labStatusNormal": "ធម្មតា",
      "labStatusUnknown": "មិនស្គាល់",
      "education": {
        "titlePrefix": "ស្វែងយល់អំពី",
        "whatTitle": "តើវាជាអ្វី?",
        "symptomsTitle": "រោគសញ្ញាទូទៅ",
        "careTitle": "ការព្យាបាល និងការថែរក្សា",
        "learnMore": "អានព័ត៌មានពេញលេញនៅ MedlinePlus",
        "disclaimer": "ព័ត៌មានសម្រាប់បញ្ជាក់បន្ថែមតែប៉ុណ្ណោះ — សូមអនុវត្តតាមដំបូន្មានរបស់គ្រូពេទ្យជានិច្ច។",
        "conditions": {
          "general": {
            "name": "ជំងឺទឹកនោមផ្អែម",
            "tagline": "ជាតិស្ករក្នុងឈាមនៅខ្ពស់ ព្រោះរាងកាយបង្កើត ឬប្រើអ៊ីនស៊ុលីនមិនបានល្អ។",
            "what": [
              "អ៊ីនស៊ុលីនជួយបញ្ជូនជាតិស្ករពីឈាមទៅក្នុងក្រឡាក្រូបសាច ដើម្បីប្រើជាថាមពល។",
              "នៅពេលមានទឹកនោមផ្អែម រាងកាយបង្កើតអ៊ីនស៊ុលីនបានតិចតួច ឬប្រើវាមិនបានល្អ ធ្វើឱ្យជាតិស្ករកករក្នុងឈាម។",
              "ជាតិស្ករខ្ពស់យូរអង្វែងអាចបំផ្លាញបេះដូង ខ្នែង ភ្នែក និងសរសៃប្រសាទ។",
              "ជំងឺនេះអាចគ្រប់គ្រងបាន — ការព្យាបាលទាន់ពេលកាត់បន្ថយហានិភ័យផលប៉ះពាល់។"
            ],
            "symptoms": [
              "ស្រេកទឹកខ្លាំង ឬស្រេកចង្ហាន់ខ្លាំង",
              "នោមញឹកញាប់ រួមទាំងពេលយប់",
              "អស់កម្លាំងជានិច្ច; ភ្នែកមុង",
              "ម្រាមជើងស្ពឹកញ័រ; របួសយូរជាសះ"
            ],
            "care": [
              "បញ្ជាក់ដោយតេស្តមន្ទីរពិសោធន៍៖ A1C ជាតិស្ករអត់ភោជន៍ ឬតេស្តទ្រទ្រង់ជាតិស្ករ (OGTT)។",
              "ញ៉ាំអាហារមានប្រយោជន៍ ធ្វើកាយសម្ព័ន្ធជាប្រចាំ និងរក្សាទម្ងន់សមស្រប។",
              "ប្រើថ្នាំតាមបញ្ជាគ្រូពេទ្យ និងវាស់ជាតិស្ករតាមការណែនាំ។",
              "ពិនិត្យសុខភាពភ្នែក ខ្នែង សរសៃប្រសាទ និងជើងជាប្រចាំ។"
            ]
          },
          "type1": {
            "name": "ទឹកនោមផ្អែមប្រភេទទី 1",
            "tagline": "ជំងឺអូតូអ៊ីមមូន — រាងកាយបង្កើតអ៊ីនស៊ុលីនបានតិចតួច ឬមិនបានទាល់តែសោះ។",
            "what": [
              "ប្រព័ន្ធភាពការពាររាងកាយច្រឡំ ចូលវាយប្រហារក្រឡាក្រូបក្នុងក្រពេញប៉ាន់ក្រីយ៉ាស (pancreas) ដែលបង្កើតអ៊ីនស៊ុលីន។",
              "ដោយគ្មានអ៊ីនស៊ុលីនគ្រប់គ្រាន់ ជាតិស្ករកករក្នុងឈាមជំនួសឱ្យចូលផ្តល់ថាមពលដល់ក្រឡាក្រូបសាច។",
              "ជាទូទៅចាប់ផ្តើមក្នុងកុមារ មនុស្សវ័យជំទង់ ឬវ័យក្មេង — ប៉ុន្តែអាចកើតក្នុងវ័យណាក៏បាន។",
              "ជំងឺនេះមិនកើតចេញពីរបៀបរស់នៅទេ ហើយមិនអាចការពារបានទេ។"
            ],
            "symptoms": [
              "ស្រេកទឹកខ្លាំង ស្រេកចង្ហាន់ខ្លាំង និងនោមញឹកញាប់ (រួមទាំងពេលយប់)",
              "ស្គាត់ដោយមិនដឹងខ្លួន; អស់កម្លាំងជានិច្ច",
              "ភ្នែកមុង; ម្រាមជើងឬដៃស្ពឹកញ័រ",
              "សញ្ញាអាសន្ន៖ ដកដង្ហើមរហ័សធំ មានក្លិនផ្លែឈើខូច ក្អួត ចុកពោះ — ត្រូវទៅពេទ្យបន្ទាន់"
            ],
            "care": [
              "ត្រូវប្រើអ៊ីនស៊ុលីនពេញមួយជីវិត ដោយការចាក់ ឬម៉ាស៊ីនជ្រុតអ៊ីនស៊ុលីន (insulin pump)។",
              "វាស់ជាតិស្ករជាប្រចាំ (ចាក់ម្រាមដៃ ឬឧបករណ៍វាស់ជាប់រហូត)។",
              "គណនាកម្រិតអ៊ីនស៊ុលីនតាមចំនួនស្ករក្នុងអាហារ និងសកម្មភាពកាយសម្ព័ន្ធ។",
              "ជួបគ្រូពេទ្យជាប្រចាំ ដើម្បីកែកំរិតថ្នាំ និងពិនិត្យផលប៉ះពាល់។"
            ]
          },
          "type2": {
            "name": "ទឹកនោមផ្អែមប្រភេទទី 2",
            "tagline": "ប្រភេទរកឃើញច្រើនជាងគេ — រាងកាយធន់នឹងអ៊ីនស៊ុលីន។",
            "what": [
              "ក្រឡាក្រូបសាចមិនឆ្លើយតបនឹងអ៊ីនស៊ុលីនល្អ (insulin resistance) ធ្វើឱ្យជាតិស្ករនៅគង់ក្នុងឈាម។",
              "វិវឌ្ឍន៍យឺតៗក្នុងរយៈពេលច្រើនឆ្នាំ — មនុស្សជាច្រើនមិនដឹងខ្លួននៅដំបូង។",
              "ហានិភ័យកើនឡើងនៅពេលធាត់ គ្មានសកម្មភាព អាយុលើ 35–45 ឆ្នាំ និងមានប្រវត្តិក្នុងគ្រួសារ។",
              "ទម្លាប់សុខភាពល្អអាចគ្រប់គ្រងជំងឺនេះ ហើយនៅអាចការពារឬពន្យារវាបានទៀត។"
            ],
            "symptoms": [
              "ភាគច្រើនគ្មានរោគសញ្ញាដំបូង — ការពិនិត្យជាប្រចាំសំខាន់ណាស់។",
              "ស្រេកទឹក នោម និងស្រេកចង្ហាន់ច្រើនឡើង",
              "អស់កម្លាំង; ភ្នែកមុង",
              "ដៃជើងស្ពឹកញ័រ; របួសយូរជាសះ"
            ],
            "care": [
              "អាហារសុខភាព សកម្មភាពកាយសម្ព័ន្ធជាប្រចាំ និងគ្រប់គ្រងទម្ងន់ គឺមកដំបូង។",
              "ថ្នាំដូចជា Metformin ត្រូវប្រើច្រើន; អាចបន្ថែមអ៊ីនស៊ុលីននៅពេលក្រោយ។",
              "វាស់ជាតិស្ករ និង A1C តាមការណែនាំរបស់គ្រូពេទ្យ។",
              "ពិនិត្យភ្នែក ខ្នែង សរសៃប្រសាទ ជើង និងបេះដូងរាល់ឆ្នាំ។"
            ]
          },
          "gestational": {
            "name": "ទឹកនោមផ្អែមពេលមានផ្ទៃពោះ",
            "tagline": "ជាតិស្ករខ្ពស់ដែលកើតឡើងក្នុងអំឡុងពេលមានផ្ទៃពោះ។",
            "what": [
              "អ័រម៉ូនពេលមានផ្ទៃពោះអាចទប់ស្កាត់ការធ្វើការរបស់អ៊ីនស៊ុលីន ធ្វើឱ្យជាតិស្ករឡើងខ្ពស់។",
              "ភាគច្រើនបង្ហាញនៅកណ្តាលអំឡុងពោះ ហើយរកឃើញដោយការពិនិត្យចន្លោះសប្តាហ៍ទី 24–28។",
              "ស្ត្រីភាគច្រើនគ្មានរោគសញ្ញាទេ — ដូច្នេះការត្រួតពិនិត្យមានសារៈសំខាន់។",
              "ភាគច្រើនបាត់វិញក្រោយសម្រាល ប៉ុន្តែបង្កើនហានិភ័យទឹកនោមផ្អែមប្រភេទទី 2 នៅពេលក្រោយ។"
            ],
            "symptoms": [
              "ភាគច្រើនគ្មាន — រកឃើញតាមការពិនិត្យពោះជាប្រចាំ",
              "ស្រេកទឹកបន្តិចបន្តួច ឬមានអារម្មណ៍ញ័រ",
              "ខ្លះមានអស់កម្លាំង ភ្នែកមុង ឬងាយឆ្លងញឹកញាប់"
            ],
            "care": [
              "ផែនការអាហារសុខភាព និងសកម្មភាពស្រាលៗជាប្រចាំ។",
              "វាស់ជាតិស្ករនៅផ្ទះតាមការណែនាំគ្រូពេទ្យ។",
              "ប្រើអ៊ីនស៊ុលីនឬថ្នាំដែលមានសុវត្ថិភាព ប្រសិនបើអាហារតែមួយមិនគ្រប់គ្រងបាន។",
              "តាមដានទារកបន្ថែម និងពិនិត្យជាតិស្ករម្តងទៀតក្រោយសម្រាល។"
            ]
          },
          "prediabetes": {
            "name": "មុនទឹកនោមផ្អែម",
            "tagline": "ជាតិស្ករខ្ពស់ជាងធម្មតា — ប៉ុន្តែមិនទាន់ជាទឹកនោមផ្អែមនៅឡើយទេ។",
            "what": [
              "ជាតិស្ករខ្ពស់ជាងធម្មតា (A1C 5.7–6.4% ឬអត់ភោជន៍ 100–125 mg/dL)។",
              "ភាគច្រើនគ្មានរោគសញ្ញាច្បាស់លាស់ — រកឃើញតាមការធ្វើតេស្ត។",
              "បើគ្មានការផ្លាស់ប្តូរ ភាគច្រើនវិវឌ្ឍទៅជាទឹកនោមផ្អែមប្រភេទទី 2។",
              "ដំណើរការឥឡូវនេះអាចពន្យារ ឬការពារទឹកនោមផ្អែមប្រភេទទី 2 បាន។"
            ],
            "symptoms": [
              "មនុស្សភាគច្រើនមិនមានអារម្មណ៍អ្វីប្លែកទេ",
              "ខ្លះឃើញស្បែកខ្មៅជ្រួញៗនៅក ឬក្រោមក្រាវដៃ"
            ],
            "care": [
              "បន្ថយទម្ងន់ 5–7% កាត់បន្ថយហានិភ័យយ៉ាងខ្លាំង។",
              "ខិតខំសកម្មភាពប្រមាណ 150 នាទីក្នុងមួយសប្តាហ៍។",
              "ជ្រើសបន្លែ គ្រាប់ធញ្ញជាតិ និងប្រូតេអ៊ីនស្ដើងឱ្យបានច្រើន។",
              "ពិនិត្យជាតិស្ករម្តងក្នុងមួយឆ្នាំ។"
            ]
          }
        }
      }
    },

    "sidebar": {
      "dashboard": "ផ្ទាំងគ្រប់គ្រង",
      "assessment": "ការវាយតម្លៃសុខភាព",
      "patients": "អ្នកជំងឺ",
      "knowledgeBase": "មូលដ្ឋានចំណេះដឹង",
      "ruleManagement": "គ្រប់គ្រងវិធាន",
      "adminConsole": "ផ្ទាំងបញ្ជា Admin"
    },
    "rules": {
      "tabs": {
        "overview": "ទិដ្ឋភាពទូទៅ",
        "editor": "ឧបករណ៍កែសម្រួលវិធាន",
        "visual": "ក្រាហ្វិកអន្តរាគមន៍",
        "sandbox": "Sandbox"
      },
      "dashboard": {
        "visualLogicGraph": "ក្រាហ្វិកអតីតកាល",
        "visualizingRule": "កំពុងបង្ហាញវិធាន៖",
        "unnamedRule": "វិធានគ្មានឈ្មោះ",
        "saveRule": "រក្សាទុកវិធាន",
        "saving": "កំពុងរក្សាទុក...",
        "knowledgeBaseRules": "វិធានមូលដ្ឋានចំណេះដឹង",
        "filterSelectReview": "ចម្រាញ់និងជ្រើសរើសវិធានដើម្បីពិនិត្យ",
        "searchPlaceholder": "ស្វែងរកវិធានតាមឈ្មោះ, ប្រភេទ, ឬការសន្និដ្ឋាន...",
        "allCategories": "ប្រភេទទាំងអស់",
        "allStatuses": "ស្ថានភាពទាំងអស់",
        "includeArchived": "រាប់បញ្ចូលទាំងដែលបានលុបចេញ",
        "reset": "កំណត់ឡើងវិញ",
        "columns": {
          "name": "ឈ្មោះ",
          "category": "ប្រភេទ",
          "status": "ស្ថានភាព",
          "priority": "អាទិភាព",
          "version": "ជំនាន់"
        },
        "loadingRules": "កំពុងទាញយកវិធាន...",
        "noRulesSearch": "គ្មានវិធានផ្គូផ្គងនឹងការស្វែងរករបស់អ្នកទេ។",
        "noRulesFound": "រកមិនឃើញវិធានទេ។"
      },
      "editor": {
        "editRule": "កែសម្រួលវិធាន",
        "createRule": "បង្កើតវិធាន",
        "subtitle": "សរសេរតក្កវិទ្យាគ្លីនិកសាមញ្ញសម្រាប់គ្រូពេទ្យ។ ឧទាហរណ៍៖ ប្រសិនបើជាតិស្ករតមអាហារគឺ 126 ឫខ្ពស់ជាងនេះ...",
        "newRule": "វិធានថ្មី",
        "unarchive": "ឈប់លុបចេញ",
        "restoring": "កំពុងស្តារឡើងវិញ...",
        "archive": "ទុកជារបស់ចាស់ / លុប",
        "ruleName": "ឈ្មោះវិធាន",
        "category": "ប្រភេទ",
        "conclusion": "ការសន្និដ្ឋាន",
        "conditions": "លក្ខខណ្ឌ",
        "addCondition": "+ បន្ថែមលក្ខខណ្ឌ",
        "expectedValue": "តម្លៃរំពឹងទុក",
        "remove": "លុបយចេញ",
        "certaintyFactor": "កត្តាទុកចិត្ត",
        "priority": "អាទិភាព",
        "status": "ស្ថានភាព",
        "explanation": "ការពន្យល់",
        "recommendation": "ការណែនាំ",
        "notes": "កំណត់សម្គាល់",
        "updateRule": "ធ្វើបច្ចុប្បន្នភាពវិធាន"
      },
      "history": {
        "ruleVersions": "ជំនាន់វិធាន",
        "selectRuleToViewVersions": "ជ្រើសរើសវិធានដើម្បីមើលជំនាន់។",
        "columns": {
          "version": "ជំនាន់",
          "change": "ការប្រែប្រួល",
          "by": "អ្នកធ្វើ",
          "time": "ពេលវេលា"
        },
        "noVersionHistory": "រកមិនឃើញប្រវត្តិជំនាន់ទេ។",
        "auditTrail": "ប្រវត្តិការកែប្រែ",
        "selectRuleToViewAudit": "ជ្រើសរើសវិធានដើម្បីមើលប្រវត្តិ។",
        "auditColumns": {
          "action": "សកម្មភាព",
          "by": "អ្នកធ្វើ",
          "time": "ពេលវេលា"
        }
      },
      "dropdowns": {
        "active": "សកម្ម",
        "inactive": "អសកម្ម",
        "archived": "បានរក្សាទុក",
        "low": "ទាប",
        "medium": "មធ្យម",
        "high": "ខ្ពស់"
      }
    },
    "kbDashboard": {
      "ranges": {
        "last7Days": "៧ ថ្ងៃចុងក្រោយ",
        "last30Days": "៣០ ថ្ងៃចុងក្រោយ",
        "last90Days": "៩០ ថ្ងៃចុងក្រោយ",
        "thisYear": "ឆ្នាំនេះ",
        "allTime": "គ្រប់ពេលវេលា"
      },
      "refresh": "ផ្ទុកឡើងវិញ",
      "loading": "កំពុងដំណើរការទិន្នន័យ...",
      "cards": {
        "engineExecutions": {
          "title": "ចំនួនប្រតិបត្តិការ",
          "trend": "+១២% ធៀបនឹងមុន"
        },
        "avgRules": {
          "title": "វិធានមធ្យមដែលត្រូវបានប្រើ",
          "desc": "ក្នុងមួយការវាយតម្លៃ",
          "trend": "ថេរ"
        },
        "activeRules": {
          "title": "វិធានសកម្ម",
          "desc": "តក្កវិទ្យាប្រព័ន្ធ",
          "trend": "+២ ក្នុងខែនេះ"
        },
        "accuracy": {
          "title": "ភាពសុក្រឹតប្រព័ន្ធ",
          "desc": "អត្រាត្រូវគ្នា",
          "trend": "+០.៥% ភាពប្រសើរ"
        }
      },
      "ruleDistribution": "ការបែងចែកវិធាន",
      "topTriggeredRules": "វិធានដែលប្រើច្រើនជាងគេ",
      "columns": {
        "rank": "ចំណាត់ថ្នាក់",
        "ruleName": "ឈ្មោះវិធាន",
        "category": "ប្រភេទ",
        "hits": "ចំនួនប្រើ"
      },
      "recentCases": {
        "title": "ករណីថ្មីៗ",
        "desc": "ការវិភាគចុងក្រោយចំនួន {{count}} ដោយប្រព័ន្ធ។",
        "viewAll": "មើលទាំងអស់",
        "columns": {
          "patient": "អ្នកជំងឺ",
          "diagnosis": "ការវិភាគ",
          "assessedBy": "វាយតម្លៃដោយ",
          "time": "ពេលវេលា",
          "status": "ស្ថានភាព"
        },
        "system": "ប្រព័ន្ធ",
        "reviewed": "បានពិនិត្យ",
        "pending": "រង់ចាំ",
        "noCases": "រកមិនឃើញករណីថ្មីៗក្នុងចន្លោះពេលនេះទេ។"
      }
    },
    "dashboard": {
      "hero": {
        "dashboardTitle": "ផ្ទាំងគ្រប់គ្រង {{role}}",
        "title": "កសាងមធ្យោបាយថែទាំជំងឺទឹកនោមផ្អែមឱ្យកាន់តែប្រសើរ",
        "desc": "តាមដាននិន្នាការពិនិត្យ មើលលទ្ធផលផ្អែកលើវិធានផ្តល់ និងសម្របសម្រួលការតាមដានវេជ្ជសាស្ត្រពីផ្ទាំងគ្រប់គ្រងគ្លីនិកតែមួយ។",
        "startAssessment": "ចាប់ផ្តើមការវាយតម្លៃ",
        "openPatients": "បញ្ជីអ្នកជំងឺ"
      },
      "toolbar": {
        "dateRange": "ចន្លោះពេលវេលា",
        "refresh": "ផ្ទុកឡើងវិញ"
      },
      "kpi": {
        "clickToView": "ចុចដើម្បីមើលព័ត៌មានលម្អិត →",
        "assessments": "ការវាយតម្លៃ",
        "activePatients": "អ្នកជំងឺសកម្ម",
        "totalRegistered": "បានចុះឈ្មោះសរុប",
        "urgentCases": "ករណីបន្ទាន់",
        "awaitingReview": "រង់ចាំការពិនិត្យ",
        "treatmentPlans": "ផែនការព្យាបាល",
        "allTime": "គ្រប់ពេលវេលា"
      },
      "recent": {
        "title": "ករណីថ្មីៗ",
        "desc": "រោគវិនិច្ឆ័យចុងក្រោយចំនួន {{count}} ដែលរង់ចាំការពិនិត្យ ឬទើបតែបានបញ្ចប់។",
        "viewAll": "មើលទាំងអស់",
        "columns": {
          "patient": "អ្នកជំងឺ",
          "diagnosis": "ការវិភាគ",
          "assessedBy": "វាយតម្លៃដោយ",
          "status": "ស្ថានភាព",
          "date": "កាលបរិច្ឆេទ"
        },
        "noDiagnoses": "ស្វែងរកមិនឃើញការវិភាគសម្រាប់ចន្លោះពេលនេះទេ។",
        "urgent": "បន្ទាន់",
        "reviewed": "បានពិនិត្យ",
        "pending": "រង់ចាំ"
      },
      "charts": {
        "volume": "ទំហំវិភាគ និង រង់ចាំ",
        "volumeDesc": "រំហូរគ្លីនិកប្រចាំខែ (ទិន្នន័យផ្ទាល់)។",
        "noTrendData": "មិនទាន់មានទិន្នន័យនិន្នាការទេ។ បង្កើតការវាយតម្លៃខ្លះដើម្បីមើលនិន្នាការ។",
        "risk": "ចំណាត់ថ្នាក់ហានិភ័យ",
        "riskDesc": "ចុចចំណែកណាមួយដើម្បីចម្រោះអ្នកជំងឺតាមកម្រិតហានិភ័យ។"
      }
    },
    "sandbox": {
      "title": "កន្លែងសាកល្បងវិធាន",
      "subtitle": "សាកល្បងសេណារីយ៉ូអ្នកជំងឺប្រឆាំងនឹងវិធានសកម្មដោយមិនរក្សាទុករបាយការណ៍",
      "matched": "ផ្គូផ្គង",
      "rulesLabel": "វិធាន",
      "testPatientData": "ទិន្នន័យអ្នកជំងឺសាកល្បង",
      "clear": "សម្អាត",
      "simulationResults": "លទ្ធផលការសាកល្បង",
      "enterTestData": "បញ្ចូលទិន្នន័យសាកល្បងដើម្បីចាប់ផ្ដើម",
      "usePresets": "ប្រើទម្រង់រួចរាល់ខាងលើសម្រាប់សេណារីយ៉ូរហ័ស",
      "triggeredSummary": "{{matched}} ក្នុងចំណោម {{total}} វិធានសកម្មត្រូវបានដំណើរការ",
      "hide": "បិទ",
      "details": "លម្អិត",
      "presets": {
        "healthy": "មនុស្សពេញវ័យដែលមានសុខភាពល្អ",
        "prediabetes": "Pre-Diabetes",
        "t2dm": "Type 2 Diabetes",
        "dka": "DKA Crisis"
      },
      "groups": {
        "demographics": "ប្រជាសាស្ត្រ",
        "labValues": "លទ្ធផល Lab",
        "symptoms": "រោគសញ្ញា",
        "riskFactors": "កត្តាហានិភ័យ"
      },
      "fields": {
        "age": "អាយុ",
        "bmi": "BMI",
        "fastingGlucose": "ជាតិស្ករពេលតមអាហារ (Fasting Glucose)",
        "fastingPlasmaGlucose": "Fasting Plasma Glucose",
        "hba1c": "HbA1c",
        "ogtt": "2h OGTT",
        "randomPlasmaGlucose": "Random Plasma Glucose",
        "bloodGlucose": "ជាតិស្ករក្នុងឈាម (Blood Glucose)",
        "frequentUrination": "នោមញឹកញាប់",
        "excessiveThirst": "ស្រេកទឹកខ្លាំង",
        "fatigue": "អស់កម្លាំង",
        "blurredVision": "ស្រវាំងភ្នែក",
        "weightLoss": "ស្រកទម្ងន់",
        "nausea": "ចង្អោរ",
        "vomiting": "ក្អួត",
        "abdominalPain": "ឈឺពោះ",
        "tinglingHandsFeet": "ស្ពឹកដៃជើង",
        "frequentInfections": "ឆ្លងរោគញឹកញាប់",
        "acanthosisNigricans": "ស្នាមស្បែកខ្មៅ (Acanthosis Nigricans)",
        "familyHistory": "ប្រវត្តិគ្រួសារ",
        "lowPhysicalActivity": "សកម្មភាពរាងកាយទាប",
        "sedentaryLifestyle": "ជីវិតអង្គុយមួយកន្លែង",
        "highCholesterol": "កូឡេស្តេរ៉ុលខ្ពស់",
        "pcosHistory": "ប្រវត្តិ PCOS",
        "highRiskEthnicity": "ក្រុមជនជាតិដែលមានហានិភ័យខ្ពស់"
      }
    },
    "patientsPage": {
      "records": {
        "title": "កំណត់ត្រាអ្នកជំងឺ",
        "desc": "ស្វែងរក ចម្រាញ់ កែសម្រួលប្រវត្តិរូប និងបើកដំណើរការការវាយតម្លៃ។"
      },
      "filters": {
        "search": "ស្វែងរកតាមឈ្មោះ ឬលេខទូរស័ព្ទ",
        "allGenders": "គ្រប់ភេទ",
        "anyDiagnosis": "គ្រប់ស្ថានភាពរោគវិនិច្ឆ័យ",
        "hasDiagnosis": "មានរោគវិនិច្ឆ័យ",
        "noDiagnosis": "មិនទាន់មានរោគវិនិច្ឆ័យ",
        "apply": "អនុវត្ត",
        "reset": "កំណត់ឡើងវិញ"
      },
      "table": {
        "name": "ឈ្មោះ",
        "gender": "ភេទ",
        "phone": "ទូរស័ព្ទ",
        "diagnoses": "រោគវិនិច្ឆ័យ",
        "actions": "សកម្មភាព",
        "loading": "កំពុងផ្ទុកអ្នកជំងឺ...",
        "empty": "រកមិនឃើញអ្នកជំងឺសម្រាប់លក្ខខណ្ឌនេះទេ។",
        "history": "ប្រវត្តិ",
        "latestResult": "លទ្ធផលចុងក្រោយ",
        "assess": "វាយតម្លៃ"
      },
      "form": {
        "editTitle": "កែសម្រួលអ្នកជំងឺ",
        "createTitle": "ចុះឈ្មោះអ្នកជំងឺ",
        "editDesc": "ធ្វើបច្ចុប្បន្នភាពព័ត៌មានលម្អិតមុនពេលមើលប្រវត្តិឡើងវិញ ឬដំណើរការការវាយតម្លៃថ្មី។",
        "createDesc": "បន្ថែមប្រវត្តិរូបមុនពេលកត់ត្រារោគសញ្ញា និងលទ្ធផលមន្ទីរពិសោធន៍។",
        "cancelEdit": "បោះបង់ការកែសម្រួល",
        "fullName": "ឈ្មោះពេញ",
        "fullNamePlaceholder": "ឈ្មោះពេញរបស់អ្នកជំងឺ",
        "gender": "ភេទ",
        "dateOfBirth": "ថ្ងៃខែឆ្នាំកំណើត",
        "phone": "ទូរស័ព្ទ",
        "phonePlaceholder": "លេខទូរស័ព្ទ",
        "notes": "កំណត់ចំណាំ",
        "notesPlaceholder": "កំណត់ចំណាំប្រវត្តិរូប",
        "saving": "កំពុងរក្សាទុក...",
        "updatePatient": "ធ្វើបច្ចុប្បន្នភាពអ្នកជំងឺ",
        "createPatient": "បង្កើតអ្នកជំងឺ"
      }
    },
    "historyPage": {
      "profile": {
        "title": "ប្រវត្តិរូបអ្នកជំងឺ",
        "desc": "គ្រប់គ្រងប្រជាសាស្ត្រ និងតាមដានប្រវត្តិករណីតាមពេលវេលា។",
        "back": "ត្រឡប់ទៅបញ្ជី",
        "assess": "ដំណើរការការវាយតម្លៃ",
        "updateProfile": "ធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូប",
        "saving": "កំពុងរក្សាទុក..."
      },
      "sections": {
        "symptoms": "រោគសញ្ញា",
        "labResults": "លទ្ធផលមន្ទីរពិសោធន៍",
        "diagnosisHistory": "ប្រវត្តិវិនិច្ឆ័យ",
        "recorded": "បានកត់ត្រា",
        "recorded_at": "ពេលវេលា"
      },
      "symptomForm": {
        "title": "បន្ថែមកំណត់ត្រារោគសញ្ញា",
        "code": "កូដរោគសញ្ញា (ឧទាហរណ៍: fatigue)",
        "name": "ឈ្មោះរោគសញ្ញា",
        "severity": "កម្រិតធ្ងន់ធ្ងរ 1-10",
        "present": "កំពុងមានរោគសញ្ញា",
        "notes": "កំណត់ចំណាំ",
        "add": "បន្ថែមកំណត់ត្រា",
        "noHistory": "មិនមានប្រវត្តិរោគសញ្ញាទេ។"
      },
      "labForm": {
        "title": "បន្ថែមកំណត់ត្រាលទ្ធផលមន្ទីរពិសោធន៍",
        "testName": "ឈ្មោះការធ្វើតេស្ត",
        "testValue": "តម្លៃលទ្ធផល",
        "unit": "ឯកតា",
        "range": "កម្រិតយោង",
        "notes": "កំណត់ចំណាំ",
        "add": "បន្ថែមកំណត់ត្រា",
        "noHistory": "មិនមានប្រវត្តិមន្ទីរពិសោធន៍ទេ។"
      },
      "diagnosisTable": {
        "diagnosis": "ការវិនិច្ឆ័យ",
        "certainty": "កម្រិតជឿជាក់",
        "by": "ដោយ",
        "when": "ពេលវេលា",
        "noHistory": "មិនទាន់មានប្រវត្តិវិនិច្ឆ័យនៅឡើយទេ។"
      }
    },
    "reviewPage": {
      "queue": {
        "title": "ជួរពិនិត្យអ្នកជំងឺ",
        "pendingCount": "មាន {{count}} ករណីកំពុងរង់ចាំ",
        "autoUpdating": "បច្ចុប្បន្នភាពស្វ័យប្រវត្តិ",
        "searchPlaceholder": "ស្វែងរកអ្នកជំងឺ..."
      },
      "states": {
        "loading": "កំពុងផ្ទុកជួរ...",
        "empty": "ជួរគឺទទេទាំងស្រុង។ ការងារល្អណាស់!",
        "noMatch": "មិនមានអ្នកជំងឺដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។",
        "urgent": "បន្ទាន់",
        "standard": "ទូទៅ",
        "score": "ពិន្ទុ",
        "unknownPatient": "មិនស្គាល់អត្តសញ្ញាណ"
      },
      "details": {
        "noPatientSelected": "មិនបានជ្រើសរើសអ្នកជំងឺ",
        "noPatientSelectedDesc": "ជ្រើសរើសការវិនិច្ឆ័យពីជួរនៅខាងឆ្វេង ដើម្បីពិនិត្យលទ្ធផលគ្លីនិក និងបន្ថែមកំណត់ចំណាំរបស់អ្នក។",
        "assessmentRecord": "កំណត់ត្រាវាយតម្លៃ",
        "generated": "បង្កើតនៅ",
        "reviewed": "បានពិនិត្យរួចរាល់",
        "pendingReview": "កំពុងរង់ចាំវេជ្ជបណ្ឌិតពិនិត្យ",
        "aiOutput": "លទ្ធផលវិនិច្ឆ័យ AI",
        "confidenceScore": "ពិន្ទុទំនុកចិត្ត",
        "criticalWarning": "ការព្រមានកម្រិតធ្ងន់",
        "defaultCriticalMsg": "ករណីនេះត្រូវការការយកចិត្តទុកដាក់ជាបន្ទាន់។"
      },
      "evidence": {
        "title": "ភស្តុតាងគ្លីនិក",
        "recommendations": "ការណែនាំ",
        "noRecommendations": "មិនមានការណែនាំជាក់លាក់ពីប្រព័ន្ធទេ។",
        "triggeredRules": "ក្បួនដែលត្រូវបានកេះ"
      },
      "doctorReview": {
        "title": "ការពិនិត្យរបស់វេជ្ជបណ្ឌិត",
        "notesLabel": "កំណត់ចំណាំគ្លីនិក និងការបន្ថែម",
        "notesPlaceholder": "បន្ថែមកំណត់ចំណាំការវាយតម្លៃផ្ទាល់ខ្លួន ការកែសម្រួលផែនការព្យាបាល ឬការណែនាំអំពីការតាមដានអ្នកជំងឺនៅទីនេះ...",
        "urgentFlag": "សម្គាល់ជាករណីបន្ទាន់",
        "urgentReasonPlaceholder": "ហេតុអ្វីបានជាករណីនេះបន្ទាន់? (តម្រូវឱ្យបំពេញ)",
        "urgentReasonRequired": "មូលហេតុបន្ទាន់ត្រូវបានតម្រូវឱ្យបំពេញ នៅពេលមុខងារបន្ទាន់ត្រូវបានបើក។",
        "submit": "ចុះហត្ថលេខា និងដាក់បញ្ជូន",
        "saving": "កំពុងរក្សាទុក...",
        "submitNotice": "ការដាក់បញ្ជូនទម្រង់នេះនឹងសម្គាល់ការវាយតម្លៃថា បានពិនិត្យរួចរាល់។"
      }
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

export const exactTextMap = {
  // Headlines
  'Possible Signs of Diabetes': 'មានសញ្ញានៃជំងឺទឹកនោមផ្អែម',
  'Possible Early Signs of Diabetes': 'មានសញ្ញាដំបូងនៃជំងឺទឹកនោមផ្អែម',
  'Suspected Diabetes (Classic Symptoms)': 'សង្ស័យទឹកនោមផ្អែម (រោគសញ្ញាសំខាន់ៗ)',
  'Possible Nerve Signs (Diabetic Neuropathy)': 'សញ្ញាសរសៃប្រសាទ (Neuropathy)',
  'Metabolic Syndrome Pattern — Heart Check Advised': 'លំនាំ Metabolic Syndrome — គួរពិនិត្យសុខភាពបេះដូង',
  'Possible Diabetes in Pregnancy (Gestational Pattern)': 'ទឹកនោមផ្អែមពេលមានផ្ទៃពោះ (Gestational)',
  'Prediabetes — Act Early to Prevent Type 2': 'មុនទឹកនោមផ្អែម — ដោះស្រាយតាមដើម្បីការពារប្រភេទទី 2',
  // Suspected-type notes
  'Pattern match from your answers — not a final diagnosis. A simple blood test can confirm the type, and the first steps are the same either way.': 'លំនាំពីចម្លើយរបស់អ្នក — មិនមែនជាការវិនិច្ឆ័យចប់ទេ។ តេស្តឈាមសាមញ្ញអាចបញ្ជាក់ប្រភេទបាន ហើយជំហានដំបូងដូចគ្នាដែរ។',
  'Your signs could fit more than one type. The first steps are the same either way — see a doctor soon; simple tests can tell the types apart.': 'សញ្ញារបស់អ្នកអាចស្របនឹងប្រភេទច្រើនជាងមួយ។ ជំហានដំបូងដូចគ្នាដែរ — គួរជួបគ្រូពេទ្យឆាប់ៗ គ្រូពេទ្យអាចបែងចែកប្រភេទដោយតេស្តសាមញ្ញ។',
  "Diabetes signs are present, but they don't clearly point to one type yet. Type 1 and Type 2 share the same first steps — a doctor can tell them apart with simple tests.": 'សញ្ញាទឹកនោមផ្អែមមាន ប៉ុន្តែមិនច្បាស់ជាប្រភេទណានៅឡើយទេ។ ប្រភេទទី 1 និងទី 2 មានជំហានដំបូងដូចគ្នា — គ្រូពេទ្យអាចបែងចែកដោយតេស្តសាមញ្ញ។',
  'ELEVATED TYPE 2 DIABETES RISK — PREVENTIVE ACTION RECOMMENDED': 'ហានិភ័យកើនឡើងនៃជំងឺទឹកនោមផ្អែមប្រភេទទី 2 — ការណែនាំគឺអោយមានវិធានការការពារ',
  'TYPE 2 DIABETES HIGHLY LIKELY — MEDICAL CONFIRMATION REQUIRED': 'ប្រហែលជាមានជំងឺទឹកនោមផ្អែមប្រភេទទី 2 ខ្លាំង — តម្រូវអោយមានការបញ្ជាក់ពីគ្រូពេទ្យ',
  'TYPE 2 DIABETES UNLIKELY — NORMAL PARAMETERS': 'ប្រហែលជាគ្មានជំងឺទឹកនោមផ្អែមប្រភេទទី 2 ទេ — លទ្ធផលធម្មតា',
  'CRITICAL CONDITION — IMMEDIATE MEDICAL ATTENTION REQUIRED': 'ស្ថានភាពធ្ងន់ធ្ងរ — តម្រូវអោយមានការព្យាបាលបន្ទាន់',
  'HIGH RISK OF PREDIABETES — EARLY INTERVENTION ADVISED': 'ហានិភ័យខ្ពស់នៃជំងឺមុនទឹកនោមផ្អែម — ការណែនាំគឺអោយមានការអន្តរាគមន៍ពីដំបូង',
  'PREDIABETES (IMPAIRED GLUCOSE REGULATION)': 'មុនទឹកនោមផ្អែម (ការចុះខ្សោយនៃបទបញ្ជាជាតិស្ករ)',
  'ROUTINE DIABETES SCREENING RECOMMENDED': 'ការណែនាំឱ្យពិនិត្យជាតិស្ករជាប្រចាំ',
  'DIABETES LIKELY': 'ប្រហែលជាជំងឺទឹកនោមផ្អែម',
  'PREDIABETES PATTERN': 'ទម្រង់នៃជំងឺមុនទឹកនោមផ្អែម',
  'LOW DIABETES INDICATION': 'ការបង្ហាញពីរោគសញ្ញាជំងឺទឹកនោមផ្អែមទាប',
  'ASSESSMENT COMPLETED': 'ការវាយតម្លៃត្រូវបានបញ្ចប់',

  // Confidence  
  'Very high confidence': 'កម្រិតជឿជាក់ខ្ពស់បំផុត',
  'The pattern strongly matches diabetes indicators.': 'ទិន្នន័យនេះស៊ីគ្នាយ៉ាងខ្លាំងនឹងការចង្អុលបង្ហាញនៃជំងឺទឹកនោមផ្អែម។',
  'High confidence': 'កម្រិតជឿជាក់ខ្ពស់',
  'Many indicators point in the same direction.': 'ការចង្អុលបង្ហាញជាច្រើនតម្រង់ទៅទិសដៅតែមួយ។',
  'Moderate confidence': 'កម្រិតជឿជាក់មធ្យម',
  'Some indicators match, but more checks may be needed.': 'ការចង្អុលបង្ហាញខ្លះដូរ ប៉ុន្តែការពិនិត្យបន្ថែមអាចនឹងត្រូវការ។',
  'Low confidence': 'កម្រិតជឿជាក់ទាប',
  'Current data shows weak diabetes indication.': 'ទិន្នន័យបច្ចុប្បន្នបង្ហាញពីការចង្អុលបង្ហាញជំងឺទឹកនោមផ្អែមដែលខ្សោយ។',

  // Categories & Priorities
  'Routine': 'ធម្មតា',
  'Urgent': 'បន្ទាន់',
  'High': 'ខ្ពស់',
  'COMPLETENESS': 'ភាពពេញលេញ (Completeness)',
  'INFERENCE': 'ការទាញសន្និដ្ឋាន (Inference)',
  'CLASSIFICATION': 'ការចាត់ថ្នាក់ (Classification)',
  'TRIAGE': 'ការសង្គ្រោះបឋម (Triage)',
  'DIAGNOSIS': 'ការវិភាគរោគ (Diagnosis)',
  'RECOMMENDATION': 'ការណែនាំ (Recommendation)',

  // Symptoms
  'Excessive Thirst': 'ការស្រេកទឹកខ្លាំង',
  'Weight Loss': 'ស្រកទម្ងន់',
  'Slow Healing': 'របួសដែលជាសះស្បើយយឺត',
  'Sweating': 'ការបែកញើស',
  'Shaking': 'ការញ័ររន្ធត់',
  'Vomiting': 'ការក្អួតចង្អោរ',
  'Abdominal Pain': 'ការឈឺពោះ',
  'Nausea': 'ការចង្អោរ',
  'Frequent Urination': 'ការនោមញឹកញាប់',
  'Fatigue': 'ការអស់កម្លាំងខ្លាំង',
  'Blurred Vision': 'ការស្រវាំងភ្នែក',
  'Tingling Hands Feet': 'ការស្ពឹកដៃជើង',
  'Frequent Infections': 'ការឆ្លងរោគញឹកញាប់',
  'Acanthosis Nigricans': 'ស្នាមខ្មៅនៅលើស្បែក',
  'Crisis': 'បញ្ហាសង្គ្រោះបន្ទាន់',

  // Risks
  'Family History': 'មានប្រវត្តិគ្រួសារមានជំងឺនេះ',
  'Obesity': 'ភាពធាត់',
  'Hypertension': 'សម្ពាធឈាមខ្ពស់',
  'Sedentary Lifestyle': 'ការរស់នៅមិនសូវមានសកម្មភាព',
  'Gestational History': 'ប្រវត្តិមានជំងឺទឹកនោមផ្អែមពេលពពោះ',
  'Smoking': 'ការជក់បារី',
  'High Cholesterol': 'កម្រិតកូឡេស្តេរ៉ុលខ្ពស់',
  'Pcos History': 'ប្រវត្តិមានរោគសញ្ញា PCOS',
  'Ethnicity High Risk': 'ក្រុមជនជាតិដែលមានហានិភ័យខ្ពស់',

  // Recommendations
  'Assessment confidence is limited because laboratory data is incomplete. Complete fasting glucose and HbA1c testing.': 'កម្រិតជឿជាក់លើការវាយតម្លៃមានកំណត់ ដោយសារទិន្នន័យមន្ទីរពិសោធន៍ (Lab) មិនពេញលេញ។ សូមស្នើអោយអ្នកធ្វើតេស្តជាតិស្ករ (Fasting Glucose) និងតេស្ត HbA1c ដើម្បីបញ្ជាក់លទ្ធផលអោយបានច្បាស់។',
  'Assessment lacks laboratory data. A definitive diabetes diagnosis requires at least one of: (1) Fasting plasma glucose (≥8h fast). (2) HbA1c (NGSP-certified lab). (3) 75-g oral glucose tolerance test (2-hour value). Complete these tests to improve assessment reliability.': 'ការវាយតម្លៃអវត្តមានទិន្នន័យមន្ទីរពិសោធន៍ (Lab)។ ការធ្វើរោគវិនិច្ឆ័យជំងឺទឹកនោមផ្អែមអោយបានច្បាស់លាស់តម្រូវអោយមានយ៉ាងហោចណាស់មួយក្នុងចំណោមយុទ្ធសាស្រ្តទាំងនេះ៖ (1) ជាតិស្ករពេលតមអាហារ (តមអាហារ ≥8h)។ (2) តេស្ត HbA1c (មន្ទីរពិសោធន៍ដែលបានបញ្ជាក់ដោយ NGSP)។ (3) តេស្តជាតិស្ករក្នុងឈាម 75-g OGTT (រយៈពេល 2 ម៉ោង)។ សូមចូលរួមការធ្វើតេស្តទាំងនេះ ដើម្បីបង្កើននូវកម្រិតជឿជាក់លើការវាយតម្លៃរុក្ខវិនិច្ឆ័យ។',
  'Patient has a history of Gestational Diabetes. ADA mandates lifelong screening for Type 2 Diabetes at least every 3 years, regardless of other risk factors.': 'អ្នកជំងឺមានប្រវត្តិមានជំងឺទឹកនោមផ្អែមប្រភេទពពោះ។ ការណែនាំរបស់ ADA តម្រូវអោយមានការពិនិត្យលើជំងឺទឹកនោមផ្អែមប្រភេទទី 2 ដែលមានជាប្រចាំរៀងរាល់ 3 ឆ្នាំម្ដង ទោះបីជាមានកត្តាហានិភ័យផ្សេងៗមិនត្រូវអោយមើលជុំវិញ។',

  // ── Patient-friendly recommendations (rewritten at the service boundary —
  // see backend patient_messaging.py; every canonical string needs Khmer) ──
  'A great time to prevent: keep BMI under 25, move 150–300 minutes a week, limit sugary and ultra-processed food, and check sugars yearly.': 'ពេលវេលាល្អដើម្បីការពារ៖ រក្សា BMI ក្រោម 25 ហាត់ប្រាណ 150–300 នាទី/សប្តាហ៍ កាត់បន្ថយចំណីស្ករ និងម្ហូបកែច្នៃខ្លាំង ហើយពិនិត្យស្ករជាប្រចាំរៀងរាល់ឆ្នាំ។',
  'A lean body with rapid weight loss is unusual for type 2. Ask about GAD-antibody and C-peptide tests — they separate type 1/LADA from type 2.': 'រាងកាយស្គាំងជាមួយការស្រកទម្ងន់លឿន មិនសូវស្របនឹងប្រភេទទី 2 ទេ។ សូមសួរពីតេស្ត GAD-antibody និង C-peptide — វាបែងចែកប្រភេទទី 1/LADA ពីប្រភេទទី 2 បាន។',
  'All three lab criteria confirm diabetes. Book a clinic visit within 1–2 weeks to start treatment and complication screening.': 'លក្ខខណ្ឌ Lab ទាំងបីបញ្ជាក់ថាមានទឹកនោមផ្អែម។ កោះចូលគ្លីនិកក្នុងរយៈពេល 1–2 សប្តាហ៍ ដើម្បីចាប់ផ្តើមព្យាបាល និងពិនិត្យផលប៉ះពាល់។',
  'Both blood tests are normal — no diabetes detected today. Keep your healthy habits and re-screen as your doctor advises.': 'តេស្តឈាមទាំងពីរធម្មតា — ថ្ងៃនេះរកមិនឃើញទឹកនោមផ្អែមទេ។ រក្សាទម្លាប់ល្អរបស់អ្នក ហើយពិនិត្យស្ករតាមដែលគ្រូពេទ្យណែនាំ។',
  'Dangerously high blood sugar. Seek emergency medical care now — watch for confusion, severe dehydration or fainting.': 'ស្ករក្នុងឈាមខ្ពស់គាប់ជាងកម្រិតអន្តរាយ។ សូមទៅព្យាបាលបន្ទាន់ឥឡូវនេះ — ប្រយ័ត្នអាការៈវង្វេងស្មារតី រាងកាយស្ងួតខ្លាំង ឬស្គាំងស្ពឹត។',
  'Diabetes confirmed. Your care plan: sugar targets, metformin first (usually), eye and foot checks, blood pressure and cholesterol care, and diabetes education — start within 1–2 weeks.': 'បញ្ជាក់ថាមានទឹកនោមផ្អែម។ ផែនការថែទាំ៖ គោលដៅស្ករ ថ្នាំ Metformin ជាដំបូង (ភាគច្រើន) ពិនិត្យភ្នែក និងជើង ថែសម្ពាធឈាម និងខ្លាញ់ ហើយរៀនគ្រប់គ្រងទឹកនោមផ្អែម — ចាប់ផ្តើមក្នុង 1–2 សប្តាហ៍។',
  'Diabetes is confirmed by two matching tests. Book your doctor within 1–2 weeks: sugar targets, metformin first (usually), plus eye and foot checks.': 'តេស្តពីរដូចគ្នាបញ្ជាក់ថាមានទឹកនោមផ្អែម។ កោះជួបគ្រូពេទ្យក្នុង 1–2 សប្តាហ៍៖ កំណត់គោលដៅស្ករ ថ្នាំ Metformin ជាដំបូង (ភាគច្រើន) ហើយពិនិត្យភ្នែក និងជើងផង។',
  'EMERGENCY: severe low blood sugar. Call emergency services now. If unconscious, never give food or drink by mouth.': 'អាសន្ន៖ ស្ករក្នុងឈាមទាបធ្ងន់ធ្ងរ។ ហៅសង្គ្រោះបន្ទាន់ឥឡូវនេះ។ បើដកហ៊ុតស្មារតី កុំបង្ខំអោយទទួលទានអាហារ ឬទឹកតាមមាត់ដាច់ខាត។',
  'Good news — no signs of diabetes today. Keep your habits, re-screen routinely, and come back if new symptoms appear.': 'ដំណឹងល្អ — ថ្ងៃនេះគ្មានសញ្ញាទឹកនោមផ្អែមទេ។ រក្សាទម្លាប់របស់អ្នក ពិនិត្យជាប្រចាំ ហើយត្រឡប់មកពិនិត្យវិញបើមានសញ្ញាថ្មី។',
  'High risk of progressing to type 2 diabetes. Losing about 7% of body weight, 150 minutes of activity a week, and a prevention talk with your doctor dramatically cut the risk.': 'ហានិភ័យខ្ពស់ក្នុងការវិវត្តទៅជាទឹកនោមផ្អែមប្រភេទទី 2។ បន្ថយទម្ងន់ប្រហែល 7% ហាត់ប្រាណ 150 នាទី/សប្តាហ៍ ហើយពិភាក្សាការការពារជាមួយគ្រូពេទ្យ កាត់បន្ថយហានិភ័យខ្លាំងណាស់។',
  'High sugar feeds infections. Treating the infection and lowering sugar work together — discuss both with your care team.': 'ស្ករខ្ពស់ចំណីមេរោគ។ ការព្យាបាលមេរោគ និងបន្ថយស្ករទៅតាមគ្នា — សូមពិភាក្សាទាំងពីរជាមួយក្រុមថែទាំសុខភាព។',
  'Ketone signs with high blood sugar can mean DKA. Seek emergency care now — do not wait for lab confirmation.': 'សញ្ញាគីតូនជាមួយស្ករខ្ពស់ អាចមានន័យថា DKA។ ទៅព្យាបាលបន្ទាន់ឥឡូវនេះ — កុំរង់ចាំលទ្ធផល Lab ដាច់ខាត។',
  'Low blood sugar right now. Take 15–20 g of fast sugar (glucose tablets or juice), then recheck in 15 minutes — repeat if still under 70.': 'ស្ករក្នុងឈាមទាបឥឡូវនេះ។ ទទួលទានស្ករលឿន 15–20 ក្រាម (គ្រាប់ Glucose ឬទឹកផ្លែឈើ) ហើយវាស់ម្តងទៀតក្នុង 15 នាទី — ធ្វើម្តងទៀតបើនៅតែក្រោម 70។',
  'Nerve signs with confirmed high sugar mean early diabetic neuropathy. You need a foot exam and steadier sugar control — see your doctor within 2 weeks.': 'សញ្ញាសរសៃប្រសាទជាមួយស្ករខ្ពស់ច្បាស់ មានន័យថាសរសៃប្រសាទពិការដំបូង។ អ្នកត្រូវពិនិត្យជើង និងគ្រប់គ្រងស្ករអោយនឹងជើង — ជួបគ្រូពេទ្យក្នុង 2 សប្តាហ៍។',
  'Nerve tingling plus repeated infections suggests long-standing high sugar. Do an HbA1c and fasting glucose test within 1 week.': 'ស្ពឹកចុងដៃចុងជើង រួមជាមួយមេរោគច្រើនដង បង្ហាញថាស្ករខ្ពស់យូរមកហើយ។ ធ្វើតេស្ត HbA1c និងស្ករពេលតមអាហារក្នុង 1 សប្តាហ៍។',
  'New bed-wetting with extra urination in a child is a red flag for type 1 diabetes. Get a finger-prick glucose check today.': 'ការលូតកន្ទក់ថ្មីជាមួយការឡើងទឹកច្រើនក្នុងកុមារ គឺជាសញ្ញាព្រមាននៃទឹកនោមផ្អែមប្រភេទទី 1។ សូមវាស់ស្ករដោយចុបម្រាមដៃថ្ងៃនេះ។',
  'No blood test yet — that is OK for a screening. Your answers already give a useful signal; a simple fasting glucose or HbA1c test anytime will sharpen it.': 'មិនទាន់មានតេស្តឈាមទេ — មិនអីទេសម្រាប់ការរុករក។ ចម្លើយរបស់អ្នកផ្តល់សញ្ញាមានប្រយោជន៍រួចហើយ។ តេស្តស្ករពេលតមអាហារ ឬ HbA1c សាមញ្ញនៅពេលណាមួយនឹងធ្វើអោយលទ្ធផលច្បាស់ជាង។',
  'No blood test yet — that is fine for a first screening. A simple fasting glucose or HbA1c test at any lab will make the result far more certain.': 'មិនទាន់មានតេស្តឈាមទេ — មិនអីទេសម្រាប់ការរុករកដំបូង។ តេស្តស្ករពេលតមអាហារ ឬ HbA1c សាមញ្ញនៅ Lab ណាមួយ នឹងធ្វើអោយលទ្ធផលច្បាស់លាស់ជាងខ្លាំង។',
  'No strong diabetes signs in this assessment. Keep healthy routines and re-check if anything changes.': 'ក្នុងការវាយតម្លៃនេះ គ្មានសញ្ញាទឹកនោមផ្អែមខ្លាំងទេ។ រក្សាទម្លាប់សុខភាពល្អ ហើយពិនិត្យម្តងទៀតបើមានអ្វីផ្លាស់ប្តូរ។',
  'PCOS with prediabetes speeds up diabetes risk. Metformin helps both; recheck HbA1c every 6 months and ask for a PCOS care plan.': 'PCOS រួមជាមួយមុនទឹកនោមផ្អែម ធ្វើអោយហានិភ័យលឿនជាង។ ថ្នាំ Metformin ជួយទាំងពីរ។ ពិនិត្យ HbA1c រៀងរាល់ 6 ខែ ហើយសុំផែនការថែទាំ PCOS។',
  'Past gestational diabetes raises type 2 risk for life. A quick glucose or HbA1c check every 1–3 years keeps you ahead of it.': 'ទឹកនោមផ្អែមពេលមានផ្ទៃពោះកន្លងមក បង្កើនហានិភ័យប្រភេទទី 2 ពេញជីវិត។ វាស់ស្ករ ឬ HbA1c រៀងរាល់ 1–3 ឆ្នាំ ជួយអ្នកនៅមុនគេ។',
  'Prediabetes plus symptoms means faster progression risk. Re-test in 1–3 months instead of 6, and start lifestyle changes now.': 'មុនទឹកនោមផ្អែមរួមជាមួយរោគសញ្ញា មានន័យថាហានិភ័យវិវត្តលឿន។ តេស្តម្តងទៀតក្នុង 1–3 ខែ (មិនមែន 6 ខែ) ហើយចាប់ផ្តើមផ្លាស់ប្តូរទម្លាប់ជីវិតឥឡូវនេះ។',
  'Prediabetes with extra risk factors — act now: structured lifestyle change, ask your doctor about metformin, and re-check every 6 months.': 'មុនទឹកនោមផ្អែមជាមួយកត្តាហានិភ័យបន្ថែម — ដំណើរការឥឡូវនេះ៖ ផ្លាស់ប្តូរទម្លាប់ជីវិតជាប្រព័ន្ធ សួរគ្រូពេទ្យអំពីថ្នាំ Metformin ហើយពិនិត្យរៀងរាល់ 6 ខែ។',
  'Prediabetes — a warning stage you can reverse. Lose about 7% of body weight, move 150 minutes a week, cut sugary drinks, and re-test in 3–6 months.': 'មុនទឹកនោមផ្អែម — ដំណាក់កាលព្រមានដែលអ្នកអាចត្រឡប់វិញបាន។ បន្ថយទម្ងន់ប្រហែល 7% ហាត់ប្រាណ 150 នាទី/សប្តាហ៍ កាត់បន្ថយភេសជ្ជៈមានស្ករ ហើយតេស្តម្តងទៀតក្នុង 3–6 ខែ។',
  'Pregnancy detected. Gestational diabetes screening with a 75 g OGTT is advised — ideally between weeks 24–28, earlier if you have risk factors.': 'រកឃើញថាមានផ្ទៃពោះ។ គួរធ្វើតេស្តរុករកទឹកនោមផ្អែមពេលមានផ្ទៃពោះដោយ OGTT 75 ក្រាម — ល្អបំផុតចន្លោះសប្តាហ៍ 24–28 ឬមុននោះបើមានកត្តាហានិភ័យ។',
  'Prior gestational diabetes in this pregnancy: glucose testing at the first prenatal visit (not only weeks 24–28) — recurrence risk is high.': 'ធ្លាប់មានទឹកនោមផ្អែមពេលមានផ្ទៃពោះ ក្នុងការមានផ្ទៃពោះលើកនេះ៖ តេស្តស្ករតាំងពីការពិនិត្យផ្ទៃពោះលើកដំបូង (មិនមែនត្រឹមសប្តាហ៍ 24–28 ទេ) — ហានិភ័យកើតឡើងវិញខ្ពស់។',
  'Prior gestational diabetes with overweight is a high-risk combination. Annual sugar checks, about 7% weight loss and regular movement strongly cut the risk.': 'ទឹកនោមផ្អែមពេលមានផ្ទៃពោះកន្លងមក រួមជាមួយលើសទម្ងន់ គឺជាការរួមបញ្ចូលហានិភ័យខ្ពស់។ ពិនិត្យស្កររៀងរាល់ឆ្នាំ បន្ថយទម្ងន់ប្រហែល 7% ហើយហាត់ប្រាណជាប្រចាំ កាត់បន្ថយហានិភ័យខ្លាំង។',
  'Routine check: one fasting glucose or HbA1c test now — repeat every 3 years if normal.': 'ពិនិត្យជាប្រចាំ៖ តេស្តស្ករពេលតមអាហារ ឬ HbA1c ម្តងឥឡូវនេះ — ធ្វើម្តងទៀតរៀងរាល់ 3 ឆ្នាំ បើធម្មតា។',
  'Seek urgent in-person medical care now. If symptoms are severe or getting worse, go straight to emergency care.': 'សូមទៅជួបគ្រូពេទ្យបន្ទាន់ឥឡូវនេះ។ បើរោគសញ្ញាធ្ងន់ធ្ងរ ឬកាន់តែអាក្រក់ ទៅត្រង់ជំពូកសង្គ្រោះបន្ទាន់។',
  'Signs of diabetic ketoacidosis (DKA) — a medical emergency. Go to emergency care now; do not wait for test results.': 'សញ្ញានៃ DKA (គីតូអាស៊ីត) — អាសន្នវេជ្ជសាស្ត្រ។ ទៅជំពូកសង្គ្រោះបន្ទាន់ឥឡូវនេះ។ កុំរង់ចាំលទ្ធផលតេស្ត។',
  "Smoking, weight and family history multiply each other's risk. Quitting smoking is the single biggest step — then weight, movement and yearly checks.": 'បំពក់បារី ទម្ងន់ និងប្រវត្តិគ្រួសារ ធ្វើអោយហានិភ័យខ្ពស់ដូចគុណគ្នា។ ការឈប់បំពក់បារីគឺជាជំហានធំបំផុត — បន្ទាប់មកទម្ងន់ ការហាត់ប្រាណ និងការពិនិត្យជាប្រចាំ។',
  'Some results suggest possible diabetes. A fasting glucose or HbA1c test within 2–4 weeks will settle it.': 'លទ្ធផលខ្លះបង្ហាញថាអាចមានទឹកនោមផ្អែម។ តេស្តស្ករពេលតមអាហារ ឬ HbA1c ក្នុងរយៈពេល 2–4 សប្តាហ៍ នឹងសំរេចបាន។',
  'Sudden symptoms with weight loss fit the type 1 pattern — it can worsen within days. Get a medical review this week; do not wait for a routine appointment.': 'រោគសញ្ញាឡើងលឿនជាមួយការស្រកទម្ងន់ ស្របនឹងលំនាំប្រភេទទី 1 — អាចកាន់តែអាក្រក់ក្នុងរយៈពេលប៉ុន្មានថ្ងៃ។ សូមអោយគ្រូពេទ្យពិនិត្យក្នុងសប្តាហ៍នេះ។ កុំរង់ចាំការកោះជួបធម្មតា។',
  'The glucose test plus classic symptoms strongly indicates diabetes. Book a full diabetes evaluation within 1–2 weeks — treatment should not wait.': 'តេស្តស្កររួមជាមួយរោគសញ្ញាសំខាន់ៗ ចង្អុលខ្លាំងទៅទឹកនោមផ្អែម។ កោះធ្វើការវាយតម្លៃពេញលេញក្នុង 1–2 សប្តាហ៍ — ការព្យាបាលកុំរង់ចាំ។',
  'Tingling in hands or feet can mean nerves are irritated by years of high sugar. Tell your doctor, and check your feet daily for numbness or sores.': 'ស្ពឹកចុងដៃ ឬចុងជើង អាចមានន័យថាសរសៃប្រសាទរំខានដោយស្ករខ្ពស់រាប់ឆ្នាំ។ ប្រាប់គ្រូពេទ្យរបស់អ្នក ហើយពិនិត្យជើងរបស់អ្នករៀងរាល់ថ្ងៃថាមានអារម្មណ៍ស្ពឹក ឬរបួសអត់។',
  'Tingling, infections and fatigue together can hide long-standing high sugar. Get HbA1c, fasting glucose and a basic check-up soon.': 'ស្ពឹកចុងដៃ មេរោគ និងអស់កម្លាំងរួមគ្នា អាចបិទបាំងស្ករខ្ពស់យូរឆ្នាំ។ សូមធ្វើ HbA1c ស្ករពេលតមអាហារ និងត្រួតពិនិត្យសុខភាពទូទៅឆាប់ៗ។',
  'Very low blood sugar. Take fast-acting sugar immediately. If swallowing is not safe, that is an emergency — call for medical help.': 'ស្ករក្នុងឈាមទាបខ្លាំង។ ទទួលទានស្ករលឿនភ្លាម។ បើលេបមិនបានសុវត្ថិភាព នោះជាអាសន្ន — ហៅជំនួយវេជ្ជសាស្ត្រ។',
  'Weight is the biggest lever you control — a 5–10% loss lowers sugar, blood pressure and cholesterol together. A dietitian can help you build the plan.': 'ទម្ងន់គឺជាកត្តាធំបំផុតដែលអ្នកគ្រប់គ្រងបាន — បន្ថយ 5–10% ធ្វើអោយស្ករ សម្ពាធឈាម និងខ្លាញ់ទាបទៅដូចគ្នា។ អ្នកជំនាញអាហារូបត្ថម្ភជួយបង្កើតផែនការអោយអ្នកបាន។',
  'With PCOS and overweight, aim for 5–10% weight loss and yearly glucose checks — an OGTT is often preferred with PCOS.': 'នឹង PCOS និងលើសទម្ងន់ គោលដៅបន្ថយទម្ងន់ 5–10% ហើយពិនិត្យស្កររៀងរាល់ឆ្នាំ — គេនិយមប្រើតេស្ត OGTT សម្រាប់អ្នកមាន PCOS។',
  'You carry type 2 risk factors. Keep a healthy weight, move 150 minutes a week, eat more whole foods, and screen every 1–3 years.': 'អ្នកមានកត្តាហានិភ័យប្រភេទទី 2។ រក្សាទម្ងន់សុខភាពល្អ ហាត់ប្រាណ 150 នាទី/សប្តាហ៍ ទទួលទានម្ហូបធម្មជាតិច្រើន ហើយពិនិត្យរៀងរាល់ 1–3 ឆ្នាំ។',
  'You had a low blood sugar episode. Use the 15/15 rule: 15 g of fast sugar, wait 15 minutes, recheck. Ask your doctor if any medication doses need adjusting.': 'អ្នកមានភាពស្ករទាបម្តង។ ប្រើច្បាប់ 15/15៖ ស្ករលឿន 15 ក្រាម រង់ចាំ 15 នាទី វាស់ម្តងទៀត។ សួរគ្រូពេទ្យថាតើត្រូវកែកម្រិតថ្នាំអត់។',
  'Young with overweight plus risk factors still deserves a check. A fasting glucose or HbA1c test now sets your baseline.': 'វ័យក្មេងលើសទម្ងន់ រួមជាមួយកត្តាហានិភ័យ ក៏គួរពិនិត្យដែរ។ តេស្តស្ករពេលតមអាហារ ឬ HbA1c ឥឡូវនេះ កំណត់ចំណុចចាប់ផ្តើមរបស់អ្នក។',
  'Your OGTT crosses the pregnancy threshold for gestational diabetes. See your obstetric team within 1 week to confirm and plan.': 'លទ្ធផល OGTT របស់អ្នកកន្លងកម្រិតទឹកនោមផ្អែមពេលមានផ្ទៃពោះ។ ជួបពេទ្យស្ត្រីរបស់អ្នកក្នុង 1 សប្តាហ៍ ដើម្បីបញ្ជាក់ និងធ្វើផែនការ។',
  'Your answers match common diabetes signs. A simple blood test (fasting glucose or HbA1c) will confirm — any lab, results usually the same day.': 'ចម្លើយរបស់អ្នកដូចនឹងសញ្ញាទឹកនោមផ្អែមទូទៅ។ តេស្តឈាមសាមញ្ញ (ស្ករពេលតមអាហារ ឬ HbA1c) នឹងបញ្ជាក់ — Lab ណាមួយក៏បាន លទ្ធផលច្រើនតែមានថ្ងៃដូចគ្នា។',
  'Your average blood sugar (HbA1c) is severely elevated. See a doctor urgently — treatment and a safety plan should start now.': 'ស្ករមធ្យមក្នុងឈាម (HbA1c) របស់អ្នកខ្ពស់ខ្លាំង។ ជួបគ្រូពេទ្យបន្ទាន់ — ការព្យាបាល និងផែនការសុវត្ថិភាពគួរចាប់ផ្តើមឥឡូវនេះ។',
  'Your blood pressure, weight and cholesterol pattern raise heart and diabetes risk. Move more, eat plainer, and treat blood pressure and cholesterol with your doctor.': 'សម្ពាធឈាម ទម្ងន់ និងខ្លាញ់របស់អ្នក បង្កើនហានិភ័យបេះដូង និងទឹកនោមផ្អែម។ ហាត់ប្រាណច្រើនជាង ទទួលទានម្ហូបសាមញ្ញ ហើយព្យាបាលសម្ពាធឈាម និងខ្លាញ់តាមគ្រូពេទ្យ។',
  'Your blood tests look normal today, but your symptoms are still classic diabetes signs — symptoms can appear before blood sugar rises. Keep watching them and re-test in 1–3 months.': 'តេស្តឈាមរបស់អ្នកថ្ងៃនេះធម្មតា ប៉ុន្តែរោគសញ្ញារបស់អ្នកនៅតែជាសញ្ញាទឹកនោមផ្អែមសំខាន់ៗ — រោគសញ្ញាអាចបង្ហាញមុនពេលជាតិស្ករកើន។ តាមដានវាបន្តទៀត ហើយតេស្តម្តងទៀតក្នុង 1–3 ខែ។',
  'Your fasting glucose crosses the stricter pregnancy threshold. See your obstetric team within 1 week — diet and glucose monitoring come first, insulin only if needed.': 'ស្ករពេលតមអាហាររបស់អ្នកកន្លងកម្រិតច្បាស់ពេលមានផ្ទៃពោះ។ ជួបពេទ្យស្ត្រីក្នុង 1 សប្តាហ៍ — ចាប់អាហារូបត្ថម្ភ និងតាមដានស្ករមុនគេ ប្រើអ៊ីនស៊ុលីនតែបើចាំបាច់។',
  'Your fasting glucose is in the upper-normal range (95–99) — close to the prediabetes line. A lower-sugar diet, regular movement, and a re-test in 6–12 months will track the trend.': 'ស្ករពេលតមអាហាររបស់អ្នកនៅកម្រិតធម្មតាផ្នែកខ្ពស់ (95–99) — ជិតបន្ទាត់មុនទឹកនោមផ្អែម។ អាហារតិចស្ករ ហាត់ប្រាណជាប្រចាំ ហើយតេស្តម្តងទៀតក្នុង 6–12 ខែ ដើម្បីតាមដានទិសដៅ។',
  'Your fasting glucose is normal. Keep your lifestyle, and if you carry risk factors an HbA1c test adds a fuller picture.': 'ស្ករពេលតមអាហាររបស់អ្នកធម្មតា។ រក្សាទម្លាប់ជីវិត ហើយបើអ្នកមានកត្តាហានិភ័យ តេស្ត HbA1c នឹងបង្ហាញរូបភាពពេញលេញជាង។',
  'Your results fit diabetes. A quick confirmatory test plus a doctor visit within 1–2 weeks settles it and starts treatment.': 'លទ្ធផលរបស់អ្នកស្របនឹងទឹកនោមផ្អែម។ តេស្តបញ្ជាក់រហ័សម្តង រួមជាមួយការជួបគ្រូពេទ្យក្នុង 1–2 សប្តាហ៍ នឹងសំរេច និងចាប់ផ្តើមព្យាបាល។',
  'Your results meet the diabetes criteria. Book a clinic visit within 1–2 weeks to confirm, set targets and start treatment.': 'លទ្ធផលរបស់អ្នកបំពេញលក្ខខណ្ឌទឹកនោមផ្អែម។ កោះចូលគ្លីនិកក្នុង 1–2 សប្តាហ៍ ដើម្បីបញ្ជាក់ កំណត់គោលដៅ និងចាប់ផ្តើមព្យាបាល។',
  'Your signs mix type 1 and type 2 features. Ask about GAD-antibody and C-peptide testing — overlapping patterns are treated differently.': 'សញ្ញារបស់អ្នកលាយលំនាំប្រភេទទី 1 និងទី 2។ សូមសួរអំពីតេស្ត GAD-antibody និង C-peptide — លំនាំដែលដូចគ្នាត្រូវព្យាបាលខុសគ្នា។',
  'Your symptoms are the classic diabetes signs, but a blood test is still needed to confirm. Book one this week — it takes minutes.': 'រោគសញ្ញារបស់អ្នកគឺជាសញ្ញាទឹកនោមផ្អែមសំខាន់ៗ ប៉ុន្តែនៅតែត្រូវការតេស្តឈាមដើម្បីបញ្ជាក់។ កោះធ្វើក្នុងសប្តាហ៍នេះ — ចំណាយពេលប៉ុន្មាននាទីប៉ុណ្ណោះ។',
  'Completed with symptoms and risk factors only — that already gives a useful screening signal. A simple blood test (fasting glucose or HbA1c) anytime will make the result more certain.': 'បានបញ្ចប់ដោយប្រើតែរោគសញ្ញា និងកត្តាហានិភ័យ — នេះផ្តល់សញ្ញារុករកមានប្រយោជន៍រួចហើយ។ តេស្តឈាមសាមញ្ញ (ស្ករពេលតមអាហារ ឬ HbA1c) នៅពេលណាមួយនឹងធ្វើអោយលទ្ធផលច្បាស់ជាង។',

  // Rules - Knowledge Base Rule Names (Medical terms kept in English)
  'Triage: Hypoglycemia Threshold': 'ការសង្គ្រោះបឋម: កម្រិត Hypoglycemia',
  'Triage: Severe Hypoglycemia (<54 mg/dL)': 'ការសង្គ្រោះបឋម: ស្ថានភាព Hypoglycemia ធ្ងន់ធ្ងរ (<54 mg/dL)',
  'Triage: Symptomatic Hypoglycemia (Sweating)': 'ការសង្គ្រោះបឋម: រោគសញ្ញា Hypoglycemia (ការបែកញើស)',
  'Triage: Symptomatic Hypoglycemia (Shaking)': 'ការសង្គ្រោះបឋម: រោគសញ្ញា Hypoglycemia (ការញ័ររន្ធត់)',
  'Triage: Symptomatic Hypoglycemia (Dizziness)': 'ការសង្គ្រោះបឋម: រោគសញ្ញា Hypoglycemia (ការវិលមុខ)',
  'Triage: Possible DKA Symptom Cluster': 'ការសង្គ្រោះបឋម: ក្រុមរោគសញ្ញាដែលអាចជា DKA',
  'Triage: Possible DKA (Nausea + Fatigue + Hyperglycemia)': 'ការសង្គ្រោះបឋម: អាចជា DKA (ចង្អោរ + អស់កម្លាំង + Hyperglycemia)',
  'Triage: Critical Hyperglycemia (>300 mg/dL)': 'ការសង្គ្រោះបឋម: ស្ថានភាព Hyperglycemia ធ្ងន់ធ្ងរ (>300 mg/dL)',
  'Triage: Classic Hyperglycemia Symptom Cluster': 'ការសង្គ្រោះបឋម: ក្រុមរោគសញ្ញាសំខាន់ៗនៃ Hyperglycemia',
  'Triage: Polyuria + Polydipsia + Fatigue': 'ការសង្គ្រោះបឋម: ការនោមញឹក (Polyuria) + ស្រេកទឹកខ្លាំង (Polydipsia) + អស់កម្លាំង',
  'Triage: Blurred Vision + Excessive Thirst': 'ការសង្គ្រោះបឋម: ស្រវាំងភ្នែក + ការស្រេកទឹកខ្លាំង',
  'Triage: Slow Wound Healing + Fatigue': 'ការសង្គ្រោះបឋម: របួសជាសះស្បើយយឺត + ការអស់កម្លាំង',
  'Triage: Insulin Resistance Signs (Acanthosis / PCOS)': 'ការសង្គ្រោះបឋម: សញ្ញានៃ Insulin Resistance (Acanthosis / PCOS)',
  'Triage: Potential Neuropathy (Tingling Extremities)': 'ការសង្គ្រោះបឋម: សញ្ញានៃ Neuropathy (ស្ពឹកចុងដៃចុងជើង)',
  'Triage: Level 3 Hypoglycemia (Requires Assistance)': 'ការសង្គ្រោះបឋម: Hypoglycemia កម្រិតទី 3 (តម្រូវការជំនួយ)',
  'Diagnosis: Fasting Plasma Glucose ≥126 mg/dL': 'ការវិភាគរោគ: Fasting Plasma Glucose ≥126 mg/dL',
  'Diagnosis: HbA1c ≥6.5%': 'ការវិភាគរោគ: HbA1c ≥6.5%',
  'Diagnosis: 2-Hour OGTT ≥200 mg/dL': 'ការវិភាគរោគ: 2-Hour OGTT ≥200 mg/dL',
  'Diagnosis: Random Glucose ≥200 + Classic Symptoms': 'ការវិភាគរោគ: Random Glucose ≥200 + រោគសញ្ញាសំខាន់ៗ',
  'Diagnosis: Dual Criterion (FPG ≥126 + HbA1c ≥6.5%)': 'ការវិភាគរោគ: លក្ខខណ្ឌពីរ (FPG ≥126 + HbA1c ≥6.5%)',
  'Diagnosis: Very High HbA1c ≥10%': 'ការវិភាគរោគ: HbA1c ខ្ពស់ខ្លាំង ≥10%',
  'Diagnosis: Prediabetes FPG Range (100–125 mg/dL)': 'ការវិភាគរោគ: កម្រិត Prediabetes FPG (100–125 mg/dL)',
  'Diagnosis: Prediabetes HbA1c Range (5.7–6.4%)': 'ការវិភាគរោគ: កម្រិត Prediabetes HbA1c (5.7–6.4%)',
  'Diagnosis: Prediabetes OGTT Range (140–199 mg/dL)': 'ការវិភាគរោគ: កម្រិត Prediabetes OGTT (140–199 mg/dL)',
  'Diagnosis: Prediabetes Dual Criteria (FPG + HbA1c)': 'ការវិភាគរោគ: លក្ខខណ្ឌកម្រិត Prediabetes ពីរ (FPG + HbA1c)',
  'Diagnosis: Normal Fasting Glucose (<100 mg/dL)': 'ការវិភាគរោគ: Fasting Glucose ធម្មតា (<100 mg/dL)',
  'Diagnosis: Normal HbA1c (<5.7%)': 'ការវិភាគរោគ: HbA1c ធម្មតា (<5.7%)',
  'Diagnosis: Symptom-Only Screening (No Labs)': 'ការវិភាគរោគ: ពិនិត្យតែរោគសញ្ញាប៉ុណ្ណោះ (គ្មាន Lab)',
  'Diagnosis: Multiple Symptoms Without Labs': 'ការវិភាគរោគ: រោគសញ្ញាច្រើន (គ្មាន Lab)',
  'Diagnosis: Neuropathy + Diabetic Lab Values': 'ការវិភាគរោគ: Neuropathy + លទ្ធផល Lab Diabetic',
  'Classification: Type 2 Risk (BMI ≥25 + Family History)': 'ការចាត់ថ្នាក់: ហានិភ័យ Type 2 (BMI ≥25 + ប្រវត្តិគ្រួសារ)',
  'Classification: Type 2 Risk (BMI ≥25 + Sedentary Lifestyle)': 'ការចាត់ថ្នាក់: ហានិភ័យ Type 2 (BMI ≥25 + ការរស់នៅមិនសូវមានសកម្មភាព)',
  'Classification: Obesity Class I (BMI 30–34.9)': 'ការចាត់ថ្នាក់: ជំងឺធាត់កម្រិត I (BMI 30–34.9)',
  'Classification: Severe Obesity (BMI ≥35)': 'ការចាត់ថ្នាក់: ជំងឺធាត់ធ្ងន់ធ្ងរ (BMI ≥35)',
  'Classification: Age-Related Risk (≥45 Years)': 'ការចាត់ថ្នាក់: ហានិភ័យទាក់ទងនឹងអាយុ (≥45 ឆ្នាំ)',
  'Classification: Central Obesity by Waist Circumference': 'ការចាត់ថ្នាក់: ធាត់កណ្តាលដោយទំហំចង្កេះ',
  'Classification: Prediabetes + Risk Pattern = High Progression Risk': 'ការចាត់ថ្នាក់: Prediabetes + ទម្រង់ហានិភ័យ = ហានិភ័យនៃការវិវឌ្ឍន៍ខ្ពស់',
  'Classification: Metabolic Syndrome Criteria Met': 'ការចាត់ថ្នាក់: បំពេញលក្ខខណ្ឌ Metabolic Syndrome',
  'Classification: Prior Gestational Diabetes': 'ការចាត់ថ្នាក់: ប្រវត្តិ Gestational Diabetes',
  'Classification: Core Demographic Risk Factor': 'ការចាត់ថ្នាក់: ប្រជាសាស្ត្រហានិភ័យស្នូល',
  'Classification: Young At-Risk (<35 with Risk Factors)': 'ការចាត់ថ្នាក់: ហានិភ័យពីក្មេង (<35 ដោយមានហានិភ័យ)',
  'Classification: Post-GDM + Obesity = Very High Risk': 'ការចាត់ថ្នាក់: ក្រោយ GDM + ការធាត់ = ហានិភ័យខ្ពស់ខ្លាំង',
  'Recommendation: Emergency DKA Referral': 'ការណែនាំ: ការបញ្ជូន DKA ជាបន្ទាន់',
  'Recommendation: Hypoglycemia Follow-Up': 'ការណែនាំ: ការតាមដាន Hypoglycemia',
  'Recommendation: Prediabetes Lifestyle Intervention': 'ការណែនាំ: អន្តរាគមន៍ការរស់នៅសម្រាប់ Prediabetes',
  'Recommendation: Diabetes Clinical Evaluation Referral': 'ការណែនាំ: ការបញ្ជូនការវាយតម្លៃវេជ្ជសាស្ត្រចំពោះ Diabetes',
  'Recommendation: Complete Laboratory Testing': 'ការណែនាំ: បំពេញការធ្វើតេស្តមន្ទីរពិសោធន៍',
  'Recommendation: Type 2 Diabetes Screening Schedule': 'ការណែនាំ: កាលវិភាគពិនិត្យ Type 2 Diabetes',
  'Recommendation: Obesity Weight Management': 'ការណែនាំ: ការគ្រប់គ្រងទម្ងន់ចំពោះអ្នកធាត់',
  'Recommendation: Comprehensive Diabetes Management': 'ការណែនាំ: ការគ្រប់គ្រង Diabetes ពេញលេញ'
}

export function translateExact(language, exactEnglishText) {
  if (!exactEnglishText) return exactEnglishText;
  const rawText = String(exactEnglishText).trim()
  const normalized = normalizeLanguage(language)

  if (normalized === 'km' && exactTextMap[rawText]) {
    return exactTextMap[rawText]
  }

  // Soft match trick: if there are no hits, sometimes it's capitalization.
  // e.g. "DIABETES LIKELY" vs "Diabetes likely"
  if (normalized === 'km') {
    for (const [key, value] of Object.entries(exactTextMap)) {
      if (key.toLowerCase() === rawText.toLowerCase()) {
        return value;
      }
    }
  }

  return rawText
}
