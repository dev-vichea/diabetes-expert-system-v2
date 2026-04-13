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
          "acanthosisNigricans": "ស្នាមអុចខ្មៅលើស្បែក (Acanthosis Nigricans)"
        },
        "safetySymptoms": {
          "sweating": "បែកញើសខ្លាំង",
          "shaking": "ញ័រដៃជើង",
          "dizziness": "វិលមុខ",
          "vomiting": "ក្អួត",
          "abdominalPain": "ឈឺពោះ"
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
