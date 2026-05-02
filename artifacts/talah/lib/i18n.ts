import { useApp } from "@/contexts/AppContext";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const STRINGS: Dict = {
  // Brand
  app_name_ar: { ar: "طلعة", en: "طلعة" },
  app_name_en: { ar: "Tal'ah", en: "Tal'ah" },
  tagline: {
    ar: "طلعة تجمعك بناس يشبهونك",
    en: "Meet the right people, in the right setting",
  },
  privacy_first: {
    ar: "خصوصيتك أولاً. لا تصفّح. لا انتقاء.",
    en: "Privacy-first. No swiping. No random browsing.",
  },
  curated: {
    ar: "لقاءات نسائية ورجالية فقط، منسّقة بعناية",
    en: "Women-only and men-only curated gatherings",
  },

  // Common
  continue: { ar: "متابعة", en: "Continue" },
  back: { ar: "رجوع", en: "Back" },
  next: { ar: "التالي", en: "Next" },
  skip: { ar: "تخطي", en: "Skip" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  confirm: { ar: "تأكيد", en: "Confirm" },
  cancel_request: { ar: "إلغاء الطلب", en: "Cancel Request" },
  cancel_request_confirm: { ar: "إلغاء الطلب", en: "Cancel Request" },
  cancel_request_body: { ar: "هل أنت متأكد من إلغاء هذا الطلب؟", en: "Are you sure you want to cancel this request?" },
  cancelling: { ar: "جارِ الإلغاء…", en: "Cancelling…" },
  save: { ar: "حفظ", en: "Save" },
  submit: { ar: "إرسال", en: "Submit" },
  done: { ar: "تم", en: "Done" },
  loading: { ar: "جارِ التحميل...", en: "Loading..." },
  yes: { ar: "نعم", en: "Yes" },
  no: { ar: "لا", en: "No" },
  optional: { ar: "اختياري", en: "Optional" },

  // Welcome
  welcome_get_started: { ar: "ابدأ الآن", en: "Get started" },
  welcome_signin: { ar: "لدي حساب", en: "I have an account" },
  welcome_terms_note: {
    ar: "بالاستمرار، فإنك توافق على الشروط وسياسة الخصوصية",
    en: "By continuing, you agree to our Terms and Privacy",
  },
  language: { ar: "اللغة", en: "Language" },

  // Auth
  signin_title: { ar: "تسجيل الدخول", en: "Sign in" },
  signin_subtitle: {
    ar: "أدخل رقم جوالك للمتابعة",
    en: "Enter your mobile number to continue",
  },
  phone_label: { ar: "رقم الجوال", en: "Mobile number" },
  phone_placeholder: { ar: "5XXXXXXXX", en: "5XXXXXXXX" },
  send_otp: { ar: "إرسال رمز التحقق", en: "Send code" },
  otp_label: { ar: "رمز التحقق", en: "Verification code" },
  otp_hint: {
    ar: "للعرض التجريبي: استخدم 0000",
    en: "Demo: use 0000",
  },
  verify: { ar: "تحقق", en: "Verify" },
  invalid_phone: {
    ar: "أدخل رقم جوال صحيح",
    en: "Enter a valid mobile number",
  },
  invalid_otp: {
    ar: "رمز التحقق غير صحيح",
    en: "Invalid verification code",
  },

  // Onboarding
  onboarding_intro: {
    ar: "أخبرنا قليلاً عنك حتى نرتّب لك طلعة مناسبة",
    en: "Tell us a bit about you so we can plan the right Tal'ah",
  },
  step_of: { ar: "من", en: "of" },

  q_nickname: { ar: "ما اسمك أو اسمك المستعار؟", en: "What's your name or nickname?" },
  nickname_placeholder: { ar: "اكتب اسمك", en: "Type your name" },

  q_gender: { ar: "إلى أي مجموعة تنتمي؟", en: "Which group do you belong to?" },
  gender_woman: { ar: "نساء فقط", en: "Women-only" },
  gender_man: { ar: "رجال فقط", en: "Men-only" },
  gender_note: {
    ar: "تختلط النساء بنساء فقط، والرجال برجال فقط.",
    en: "Women meet women, and men meet men.",
  },

  q_city: { ar: "ما مدينتك؟", en: "What's your city?" },

  q_age: { ar: "كم عمرك؟", en: "Your age range" },

  q_lifestyle: { ar: "أسلوب حياتك", en: "Lifestyle" },
  ls_employee: { ar: "موظف/ـة", en: "Employee" },
  ls_student: { ar: "طالب/ـة", en: "Student" },
  ls_parent: { ar: "والد/ـة", en: "Parent" },
  ls_entrepreneur: { ar: "ريادي/ـة", en: "Entrepreneur" },
  ls_other: { ar: "أخرى", en: "Other" },

  q_interests: { ar: "اهتماماتك", en: "Your interests" },
  q_interests_hint: { ar: "اختر ٣ على الأقل", en: "Pick at least 3" },
  int_coffee: { ar: "قهوة", en: "Coffee" },
  int_books: { ar: "كتب", en: "Books" },
  int_fitness: { ar: "رياضة", en: "Fitness" },
  int_wellness: { ar: "صحة وعافية", en: "Wellness" },
  int_art: { ar: "فنون", en: "Art" },
  int_business: { ar: "أعمال", en: "Business" },
  int_food: { ar: "طعام", en: "Food" },
  int_outdoor: { ar: "هواء طلق", en: "Outdoor" },
  int_self_development: { ar: "تطوير الذات", en: "Self-development" },

  q_personality: { ar: "شخصيتك تميل إلى...", en: "Your personality" },
  pers_calm: { ar: "هادئ/ـة", en: "Calm" },
  pers_social: { ar: "اجتماعي/ـة", en: "Social" },
  pers_curious: { ar: "فضولي/ـة", en: "Curious" },
  pers_active: { ar: "نشيط/ـة", en: "Active" },
  pers_creative: { ar: "مبدع/ـة", en: "Creative" },

  q_meetup: { ar: "نوع اللقاء المفضّل", en: "Preferred meetup" },
  meet_coffee: { ar: "قهوة", en: "Coffee" },
  meet_dinner: { ar: "عشاء", en: "Dinner" },

  q_days: { ar: "الأيام المناسبة", en: "Days that work for you" },
  q_times: { ar: "الأوقات المفضّلة", en: "Preferred times" },
  day_sat: { ar: "السبت", en: "Sat" },
  day_sun: { ar: "الأحد", en: "Sun" },
  day_mon: { ar: "الإثنين", en: "Mon" },
  day_tue: { ar: "الثلاثاء", en: "Tue" },
  day_wed: { ar: "الأربعاء", en: "Wed" },
  day_thu: { ar: "الخميس", en: "Thu" },
  day_fri: { ar: "الجمعة", en: "Fri" },
  time_morning: { ar: "صباحًا", en: "Morning" },
  time_afternoon: { ar: "بعد الظهر", en: "Afternoon" },
  time_evening: { ar: "مساءً", en: "Evening" },

  q_funfact: { ar: "حقيقة طريفة عنك", en: "A fun fact about you" },
  funfact_placeholder: {
    ar: "مثال: أحب التحميص اليدوي للقهوة",
    en: "e.g. I roast my own coffee at home",
  },

  // ── NEW: Personality & Compatibility Questions ──────────────────────
  q_social_energy: { ar: "مستوى طاقتك الاجتماعية", en: "Your social energy level" },
  se_very_social: { ar: "اجتماعي/ـة جداً ومحب/ـة للحديث", en: "Very social and talkative" },
  se_friendly_balanced: { ar: "ودود/ة ومتوازن/ة", en: "Friendly and balanced" },
  se_quiet_open_later: { ar: "هادئ/ـة في البداية، أنفتح لاحقاً", en: "Quiet at first, open later" },
  se_prefer_listening: { ar: "أفضّل الاستماع أكثر من الكلام", en: "Prefer listening more than talking" },

  q_conversation_style: { ar: "أسلوب حديثك المفضّل", en: "Preferred conversation style" },
  cs_light_fun: { ar: "خفيف وممتع", en: "Light and fun" },
  cs_balanced: { ar: "متوازن", en: "Balanced" },
  cs_deep_meaningful: { ar: "عميق وذو معنى", en: "Deep and meaningful" },

  q_enjoyed_topics: { ar: "المواضيع التي تستمتع بها", en: "Topics you enjoy" },
  q_enjoyed_topics_hint: { ar: "اختر واحداً أو أكثر", en: "Select one or more" },
  et_daily_life: { ar: "الحياة اليومية", en: "Daily life" },
  et_work_ambition: { ar: "العمل والطموح", en: "Work & ambition" },
  et_family_relationships: { ar: "الأسرة والعلاقات", en: "Family & relationships" },
  et_travel: { ar: "السفر", en: "Travel" },
  et_wellness_growth: { ar: "الصحة والتطوير الذاتي", en: "Wellness & self-growth" },
  et_hobbies_activities: { ar: "الهوايات والأنشطة", en: "Hobbies & activities" },

  q_social_intent: { ar: "ما الذي تبحث عنه؟", en: "What are you looking for?" },
  si_new_friends: { ar: "صداقات جديدة", en: "New friends" },
  si_expand_circle: { ar: "توسيع دائرتي الاجتماعية", en: "Expanding my social circle" },
  si_casual_conversations: { ar: "محادثات غير رسمية", en: "Casual conversations" },
  si_long_term_connections: { ar: "علاقات اجتماعية طويلة الأمد", en: "Long-term meaningful connections" },

  q_planning_preference: { ar: "كيف تفضّل التخطيط؟", en: "Planning preference" },
  pp_structured: { ar: "منظّم ومحدد", en: "Structured" },
  pp_flexible: { ar: "مرن", en: "Flexible" },
  pp_spontaneous: { ar: "عفوي وتلقائي", en: "Spontaneous" },

  q_meetup_atmosphere: { ar: "أجواء اللقاء المفضّلة", en: "Preferred meetup atmosphere" },
  ma_calm_relaxed: { ar: "هادئة ومريحة", en: "Calm and relaxed" },
  ma_moderate_energy: { ar: "نشاط معتدل", en: "Moderate energy" },
  ma_lively_energetic: { ar: "حيوية ونابضة بالحياة", en: "Lively and energetic" },

  q_interaction_preference: { ar: "كيف تفضّل التفاعل؟", en: "Interaction preference" },
  ip_mostly_conversation: { ar: "محادثة في الغالب", en: "Mostly conversation" },
  ip_mix_conversation_activity: { ar: "مزيج من المحادثة والنشاط الخفيف", en: "A mix of conversation and light activity" },
  ip_activity_based: { ar: "نشاط بالدرجة الأولى", en: "Activity-based interaction" },

  q_personality_traits: { ar: "أبرز سماتك الشخصية", en: "Your personality traits" },
  q_personality_traits_hint: { ar: "اختر ٣ كحد أقصى", en: "Pick up to 3" },
  pt_calm: { ar: "هادئ/ـة", en: "Calm" },
  pt_social: { ar: "اجتماعي/ـة", en: "Social" },
  pt_curious: { ar: "فضولي/ـة", en: "Curious" },
  pt_thoughtful: { ar: "مفكّر/ة", en: "Thoughtful" },
  pt_energetic: { ar: "نشيط/ـة", en: "Energetic" },
  pt_funny: { ar: "مرح/ـة", en: "Funny" },
  pt_organized: { ar: "منظّم/ة", en: "Organized" },
  pt_creative: { ar: "مبدع/ـة", en: "Creative" },

  q_openness_level: { ar: "مدى انفتاحك مع أشخاص جدد", en: "Openness with new people" },
  ol_open_quickly: { ar: "أنفتح بسرعة", en: "Open up quickly" },
  ol_open_gradually: { ar: "أنفتح تدريجياً", en: "Open up gradually" },
  ol_take_your_time: { ar: "أحتاج وقتاً قبل الانفتاح", en: "Prefer to take your time" },

  q_social_boundary: { ar: "حدودك الاجتماعية", en: "Social comfort boundary" },
  sb_very_relaxed: { ar: "مريح/ـة جداً ومنفتح/ـة", en: "Very relaxed and open" },
  sb_respectful_balanced: { ar: "محترم/ـة ومتوازن/ة", en: "Respectful and balanced" },
  sb_more_reserved: { ar: "أكثر تحفظاً وخصوصية", en: "More reserved and private" },
  // ────────────────────────────────────────────────────────────────────

  finish_onboarding: { ar: "إنهاء", en: "Finish" },

  // Home
  home_greeting: { ar: "أهلاً", en: "Welcome" },
  home_request_cta: { ar: "اطلب طلعتك", en: "Request a Tal'ah" },
  home_request_sub: {
    ar: "نختار لك مجموعة تشبهك",
    en: "We'll match you with people who fit you",
  },
  home_upcoming: { ar: "طلعتك القادمة", en: "Upcoming Tal'ah" },
  home_no_upcoming: {
    ar: "لا توجد طلعة مجدولة بعد",
    en: "No Tal'ah scheduled yet",
  },
  profile_completion: { ar: "اكتمال ملفك", en: "Profile completion" },
  complete_profile: { ar: "أكمل ملفك", en: "Complete your profile" },
  view_all: { ar: "عرض الكل", en: "View all" },

  // Request
  request_title: { ar: "اطلب طلعة", en: "Request a Tal'ah" },
  request_meet: { ar: "اختر نوع اللقاء", en: "Choose meetup type" },
  request_date: { ar: "اختر التاريخ المفضّل", en: "Preferred date" },
  request_time: { ar: "اختر الوقت", en: "Preferred time" },
  request_area: { ar: "المنطقة المفضّلة", en: "Preferred area" },
  area_placeholder: { ar: "مثال: العليا", en: "e.g. Al Olaya" },
  submit_request: { ar: "إرسال الطلب", en: "Submit request" },
  request_submitted: {
    ar: "استلمنا طلبك. سنوافيك بمجموعتك قريبًا.",
    en: "We received your request. You'll hear back soon.",
  },

  // Upcoming
  upcoming_title: { ar: "طلعاتك", en: "Your Tal'ahs" },
  status_pending: { ar: "قيد المطابقة", en: "Pending match" },
  status_matched: { ar: "تمت المطابقة", en: "Matched" },
  status_revealed: { ar: "تم الكشف", en: "Revealed" },
  status_completed: { ar: "اكتملت", en: "Completed" },
  status_cancelled: { ar: "ملغية", en: "Cancelled" },
  reveal_hint: {
    ar: "نكشف عن المجموعة قبل اللقاء بـ ٦-١٢ ساعة",
    en: "Group reveal happens 6–12 hours before meetup",
  },
  privacy_note: {
    ar: "نشارك فقط الاسم المستعار وثلاث صفات وحقيقة طريفة. لا صور. لا ملفات شخصية.",
    en: "We share only nicknames, 3 traits, and a fun fact. No photos. No profiles.",
  },
  view_group: { ar: "اعرض المجموعة", en: "View group" },
  give_feedback: { ar: "شاركنا تجربتك", en: "Share feedback" },
  empty_upcoming: {
    ar: "لا توجد طلعات بعد. اطلب طلعتك الأولى.",
    en: "No Tal'ahs yet. Request your first one.",
  },

  // Reveal
  reveal_title: { ar: "تعرّف على مجموعتك", en: "Meet your group" },
  reveal_meetup_at: { ar: "موعد اللقاء", en: "Meetup time" },
  reveal_venue: { ar: "المكان", en: "Venue" },
  members_count: { ar: "أعضاء", en: "members" },
  fun_fact: { ar: "حقيقة طريفة", en: "Fun fact" },
  traits: { ar: "صفات", en: "Traits" },
  reveal_locked: {
    ar: "سيتم الكشف عن المجموعة قبل اللقاء بقليل",
    en: "Your group will be revealed shortly before the meetup",
  },

  // Feedback
  feedback_title: { ar: "كيف كانت تجربتك؟", en: "How was it?" },
  rate_experience: { ar: "قيّم التجربة", en: "Rate your experience" },
  connect_or_pass: {
    ar: "هل تودّ التواصل لاحقًا؟",
    en: "Would you like to stay in touch?",
  },
  connect: { ar: "تواصل", en: "Connect" },
  pass: { ar: "تجاوز", en: "Pass" },
  optional_comment: { ar: "تعليق (اختياري)", en: "Comment (optional)" },
  comment_placeholder: {
    ar: "ما الذي أعجبك؟ ما الذي يمكن تحسينه؟",
    en: "What did you enjoy? What could be better?",
  },
  report_block: { ar: "إبلاغ / حظر", en: "Report / Block" },
  feedback_thanks: { ar: "شكراً لمشاركتك", en: "Thanks for sharing" },

  // Report
  report_title: { ar: "إبلاغ", en: "Report" },
  report_reason: { ar: "سبب البلاغ", en: "Reason" },
  report_placeholder: {
    ar: "اكتب التفاصيل بكل خصوصية",
    en: "Tell us privately what happened",
  },
  report_submit: { ar: "إرسال البلاغ", en: "Submit report" },
  report_submitted: {
    ar: "تم إرسال البلاغ. شكراً لجعل المجتمع آمناً.",
    en: "Report sent. Thank you for keeping the community safe.",
  },

  // Profile / Settings
  profile_title: { ar: "ملفي", en: "Profile" },
  edit_interests: { ar: "تعديل الاهتمامات", en: "Edit interests" },
  privacy_settings: { ar: "إعدادات الخصوصية", en: "Privacy settings" },
  id_verification: { ar: "توثيق الهوية", en: "ID verification" },
  id_verification_sub: {
    ar: "متاح قريبًا لطبقة أمان إضافية",
    en: "Coming soon for an extra layer of safety",
  },
  delete_account: { ar: "حذف الحساب", en: "Delete account" },
  delete_account_confirm: {
    ar: "حذف الحساب نهائيًا؟",
    en: "Delete your account permanently?",
  },
  logout: { ar: "تسجيل الخروج", en: "Sign out" },
  legal: { ar: "قانوني", en: "Legal" },
  code_of_conduct: { ar: "قواعد المجتمع", en: "Code of conduct" },
  privacy_policy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  terms: { ar: "الشروط والأحكام", en: "Terms" },
  admin_panel: { ar: "لوحة التحكم", en: "Admin panel" },
  verified_badge: { ar: "موثّق", en: "Verified" },
  unverified_badge: { ar: "غير موثّق", en: "Unverified" },

  // Admin
  admin_title: { ar: "لوحة الإدارة", en: "Admin dashboard" },
  admin_pin_title: { ar: "أدخل رمز الإدارة", en: "Enter admin PIN" },
  admin_pin_hint: { ar: "للعرض التجريبي: 1234", en: "Demo: 1234" },
  admin_users: { ar: "المستخدمون", en: "Users" },
  admin_requests: { ar: "الطلبات", en: "Requests" },
  admin_groups: { ar: "المجموعات", en: "Groups" },
  admin_feedback: { ar: "التقييمات", en: "Feedback" },
  admin_reports: { ar: "البلاغات", en: "Reports" },
  admin_compatibility: { ar: "التوافق", en: "Compatibility" },
  admin_create_group: { ar: "إنشاء مجموعة", en: "Create group" },
  admin_assign: { ar: "تعيين", en: "Assign" },
  admin_set_status: { ar: "تغيير الحالة", en: "Change status" },
  admin_set_venue: { ar: "تحديد المكان والوقت", en: "Set venue & time" },
  admin_flag: { ar: "تحذير", en: "Flag" },
  admin_unflag: { ar: "إلغاء التحذير", en: "Unflag" },
  admin_remove: { ar: "إزالة", en: "Remove" },
  flagged_label: { ar: "محذّر", en: "Flagged" },
  admin_matching_notes: { ar: "ملاحظات المطابقة", en: "Matching notes" },
  admin_scores: { ar: "النتائج", en: "Scores" },
  admin_compatibility_tab: { ar: "حساب التوافق", en: "Check compatibility" },
  admin_select_users: { ar: "اختر ٣-٥ مستخدمين", en: "Select 3–5 users" },
  admin_calculate: { ar: "احسب التوافق", en: "Calculate compatibility" },
  compat_excellent: { ar: "توافق ممتاز", en: "Excellent fit" },
  compat_good: { ar: "توافق جيد", en: "Good fit" },
  compat_moderate: { ar: "توافق متوسط", en: "Moderate fit" },
  compat_weak: { ar: "توافق ضعيف", en: "Weak fit" },
  compat_hard_filters: { ar: "المرشّحات الأساسية", en: "Hard filters" },
  compat_interests: { ar: "الاهتمامات المشتركة", en: "Shared interests/topics" },
  compat_lifestyle: { ar: "أسلوب الحياة", en: "Lifestyle" },
  compat_energy: { ar: "الطاقة الاجتماعية", en: "Social energy" },
  compat_conversation: { ar: "أسلوب الحديث", en: "Conversation" },
  compat_intent_boundary: { ar: "النية والحدود", en: "Intent & boundary" },
  compat_common_days: { ar: "الأيام المشتركة", en: "Common days" },
  compat_common_times: { ar: "الأوقات المشتركة", en: "Common times" },
  compat_no_overlap: { ar: "لا تقاطع", en: "No overlap" },

  // Misc / placeholders
  no_data: { ar: "لا يوجد بيانات بعد", en: "Nothing here yet" },
};

export function useT() {
  const { language } = useApp();
  return (key: string): string => {
    const entry = STRINGS[key];
    if (!entry) return key;
    return entry[language];
  };
}

export function isArabic(language: Lang): boolean {
  return language === "ar";
}
