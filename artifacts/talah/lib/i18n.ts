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
  cancel_request_body: {
    ar: "هل أنت متأكد من إلغاء هذا الطلب؟",
    en: "Are you sure you want to cancel this request?",
  },
  cancelling: { ar: "جارِ الإلغاء…", en: "Cancelling…" },
  error_title: { ar: "خطأ", en: "Error" },
  error_generic: {
    ar: "حدث خطأ ما. حاول مجدداً.",
    en: "Something went wrong. Please try again.",
  },
  dismiss: { ar: "إخفاء", en: "Dismiss" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  onboarding_personality_label: { ar: "الشخصية", en: "Personality" },
  onboarding_personality_title: {
    ar: "ملف الشخصية",
    en: "Personality Profile",
  },
  onboarding_personality_banner: {
    ar: "أكملت الأساسيات! الآن لنتعمق أكثر لنجد أفضل توافق لك.",
    en: "You've completed the basics! Now let's go deeper to match you perfectly.",
  },
  onboarding_personality_desc: {
    ar: "هذه الأسئلة تساعدنا في إيجاد أشخاص يناسبون طاقتك الاجتماعية وأسلوب محادثتك.",
    en: "These questions help us find people who truly match your social style and energy.",
  },
  data_loading: { ar: "جارِ التحميل…", en: "Loading your data…" },
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
    ar: "أدخل بريدك الإلكتروني للمتابعة",
    en: "Enter your email to continue",
  },
  email_label: { ar: "البريد الإلكتروني", en: "Email address" },
  email_placeholder: { ar: "name@example.com", en: "name@example.com" },
  send_login_code: { ar: "إرسال رمز الدخول", en: "Send sign-in code" },
  login_code_label: { ar: "رمز الدخول", en: "Sign-in code" },
  login_code_hint: {
    ar: "سيصلك رمز الدخول على بريدك الإلكتروني",
    en: "Your sign-in code will be sent to your email",
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
  invalid_email: {
    ar: "أدخل بريدًا إلكترونيًا صحيحًا",
    en: "Enter a valid email address",
  },
  invalid_login_code: {
    ar: "رمز الدخول غير صحيح",
    en: "Invalid sign-in code",
  },
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

  // Step 0 — Nickname
  q_nickname: {
    ar: "وش نقدر نسميك؟ ✨",
    en: "What should we call you? ✨",
  },
  nickname_placeholder: { ar: "اكتب اسمك أو لقبك", en: "Your name or nickname" },

  // Step 1 — Tal'ah Type (gender)
  q_gender: {
    ar: "نوع الطلعة المناسبة لك",
    en: "Which Tal'ah experience fits you?",
  },
  gender_woman: { ar: "طلعات نساء", en: "Women-only Tal'ahs" },
  gender_man: { ar: "طلعات رجال", en: "Men-only Tal'ahs" },
  gender_note: {
    ar: "طلعة توفر حالياً لقاءات منفصلة للنساء والرجال",
    en: "Tal'ah currently offers separate gatherings for women and men",
  },

  // Step 2 — City
  q_city: { ar: "وين تسكن؟", en: "Where do you live?" },
  city_other: { ar: "مدينة أخرى", en: "Other city" },
  city_other_placeholder: { ar: "اكتب اسم مدينتك", en: "Type your city name" },

  // Step 3 — Life Stage
  q_life_stage: {
    ar: "أي مرحلة قريبة لك أكثر؟",
    en: "Which stage feels closest to you?",
  },
  life_stage_university: {
    ar: "جامعة أو بداية المشوار",
    en: "University or early journey",
  },
  life_stage_early_career: { ar: "بداية الحياة المهنية", en: "Early career" },
  life_stage_established: { ar: "مستقر مهنيًا", en: "Professionally established" },
  life_stage_family: { ar: "عندي عائلة أو أطفال", en: "Have family or kids" },
  life_stage_prefer_not: { ar: "أفضّل عدم التحديد", en: "Prefer not to say" },

  // Step 4 — Interests
  q_interests: { ar: "شو اهتماماتك؟", en: "What are your interests?" },
  q_interests_hint: { ar: "اختر بين ٣ و٥", en: "Pick 3 to 5" },

  // Interest category labels
  cat_food_coffee: { ar: "الأكل والكوفي", en: "Food & Coffee" },
  cat_wellness: { ar: "الصحة والرفاهية", en: "Wellness" },
  cat_creativity: { ar: "الإبداع والهوايات", en: "Creativity & Hobbies" },
  cat_life: { ar: "الحياة والتجارب", en: "Life & Experiences" },
  cat_entertainment: { ar: "الترفيه", en: "Entertainment" },
  cat_outdoor: { ar: "الأنشطة الخارجية", en: "Outdoor" },

  // Interest options
  int_coffee: { ar: "كوفي", en: "Coffee" },
  int_restaurants: { ar: "مطاعم وتجارب", en: "Restaurants" },
  int_cooking: { ar: "طبخ", en: "Cooking" },
  int_desserts: { ar: "حلويات ومخبوزات", en: "Desserts & baking" },
  int_fitness: { ar: "رياضة ولياقة", en: "Fitness" },
  int_walking: { ar: "مشي", en: "Walking" },
  int_wellness: { ar: "صحة وعافية", en: "Wellness" },
  int_yoga: { ar: "يوغا وتأمل", en: "Yoga & meditation" },
  int_photography: { ar: "تصوير", en: "Photography" },
  int_art: { ar: "فن وتصميم", en: "Art & design" },
  int_writing: { ar: "كتابة وقراءة", en: "Writing & reading" },
  int_music: { ar: "موسيقى", en: "Music" },
  int_travel: { ar: "سفر", en: "Travel" },
  int_social_convos: { ar: "جلسات وسوالف", en: "Social conversations" },
  int_self_development: { ar: "تطوير الذات", en: "Self-development" },
  int_business: { ar: "أعمال وريادة", en: "Business & entrepreneurship" },
  int_movies: { ar: "أفلام ومسلسلات", en: "Movies & series" },
  int_games: { ar: "ألعاب", en: "Games" },
  int_anime: { ar: "أنمي ومانجا", en: "Anime & manga" },
  int_hiking: { ar: "هايكنق", en: "Hiking" },
  int_sea_outdoor: { ar: "بحر وأنشطة خارجية", en: "Sea & outdoor" },
  int_camping: { ar: "كشتات وتخييم", en: "Camping" },

  // Legacy interest keys kept for backward compat
  int_books: { ar: "كتب", en: "Books" },
  int_food: { ar: "طعام", en: "Food" },
  int_outdoor: { ar: "هواء طلق", en: "Outdoor" },

  // Step 5 — Meetup Type
  q_meetup: { ar: "تفضّل إيش في الطلعة؟", en: "What's your preferred meetup?" },
  meet_coffee: { ar: "☕ قهوة", en: "☕ Coffee" },
  meet_dinner: { ar: "🍽 عشاء", en: "🍽 Dinner" },

  // ── Section 2 banner (steps 6-8)
  vibe_section_banner: {
    ar: "خلّنا نتعرف على جوّك أكثر ✨",
    en: "Let's get to know your vibe a little better ✨",
  },

  // Step 6 — Social Energy
  q_social_energy: {
    ar: "كيف تكون عادةً مع ناس جدد؟",
    en: "How are you usually with new people?",
  },
  se_very_social: { ar: "أندمج بسرعة 🔥", en: "I open up quickly 🔥" },
  se_friendly_balanced: { ar: "اجتماعي ومتوازن ✌️", en: "Social and balanced ✌️" },
  se_quiet_open_later: { ar: "أحتاج وقت بالبداية 🌱", en: "I need some time at first 🌱" },
  se_prefer_listening: { ar: "أفضّل أسمع أكثر 🎧", en: "I prefer listening more 🎧" },

  // Step 7 — Conversation Style
  q_conversation_style: {
    ar: "تحب الأحاديث تكون كيف؟",
    en: "What kind of conversations do you enjoy?",
  },
  cs_light_fun: { ar: "خفيفة ووناسة 😄", en: "Light and fun 😄" },
  cs_balanced: { ar: "بين كذا وكذا 🙂", en: "A bit of both 🙂" },
  cs_deep_meaningful: { ar: "عميقة شوي 🌊", en: "A bit deeper 🌊" },

  // Step 8 — Personality Traits
  q_personality_traits: {
    ar: "وش أكثر شيء يشبهك؟",
    en: "What describes you most?",
  },
  q_personality_traits_hint: { ar: "اختر ١ أو ٢", en: "Pick 1 or 2" },
  // Gender-adaptive labels are handled in the component; these are fallbacks
  pt_calm: { ar: "هادئ", en: "Calm" },
  pt_social: { ar: "اجتماعي", en: "Social" },
  pt_curious: { ar: "فضولي", en: "Curious" },
  pt_energetic: { ar: "نشيط", en: "Energetic" },
  pt_funny: { ar: "مرح", en: "Funny" },
  pt_creative: { ar: "مبدع", en: "Creative" },
  // Legacy trait keys kept for backward compat
  pt_thoughtful: { ar: "مفكّر/ة", en: "Thoughtful" },
  pt_organized: { ar: "منظّم/ة", en: "Organized" },

  // Completion screen
  onboarding_complete_title: { ar: "خلصنا ✨", en: "You're all set ✨" },
  onboarding_complete_sub: {
    ar: "الحين تقدر تطلب أول طلعة لك",
    en: "You can now request your first Tal'ah",
  },
  onboarding_complete_desc: {
    ar: "اختر نوع اللقاء والوقت المناسب، وخلّي طلعة ترتب لك المجموعة",
    en: "Choose the meetup type and time, and Tal'ah will arrange your group",
  },
  onboarding_complete_cta: { ar: "طلب أول طلعة", en: "Request first Tal'ah" },

  // Deprecated onboarding strings — kept for legacy screens
  q_age: { ar: "كم عمرك؟", en: "Your age range" },
  q_lifestyle: { ar: "أسلوب حياتك", en: "Lifestyle" },
  ls_employee: { ar: "موظف/ـة", en: "Employee" },
  ls_student: { ar: "طالب/ـة", en: "Student" },
  ls_parent: { ar: "والد/ـة", en: "Parent" },
  ls_entrepreneur: { ar: "ريادي/ـة", en: "Entrepreneur" },
  ls_other: { ar: "أخرى", en: "Other" },
  q_personality: { ar: "شخصيتك تميل إلى...", en: "Your personality" },
  pers_calm: { ar: "هادئ/ـة", en: "Calm" },
  pers_social: { ar: "اجتماعي/ـة", en: "Social" },
  pers_curious: { ar: "فضولي/ـة", en: "Curious" },
  pers_active: { ar: "نشيط/ـة", en: "Active" },
  pers_creative: { ar: "مبدع/ـة", en: "Creative" },
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
  q_openness_level: { ar: "مدى انفتاحك مع أشخاص جدد", en: "Openness with new people" },
  ol_open_quickly: { ar: "أنفتح بسرعة", en: "Open up quickly" },
  ol_open_gradually: { ar: "أنفتح تدريجياً", en: "Open up gradually" },
  ol_take_your_time: { ar: "أحتاج وقتاً قبل الانفتاح", en: "Prefer to take your time" },
  q_social_boundary: { ar: "حدودك الاجتماعية", en: "Social comfort boundary" },
  sb_very_relaxed: { ar: "مريح/ـة جداً ومنفتح/ـة", en: "Very relaxed and open" },
  sb_respectful_balanced: { ar: "محترم/ـة ومتوازن/ة", en: "Respectful and balanced" },
  sb_more_reserved: { ar: "أكثر تحفظاً وخصوصية", en: "More reserved and private" },

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
  mutual_connects: { ar: "تواصل متبادل", en: "Mutual connects" },
  mutual_connects_sub: {
    ar: "هؤلاء اخترن التواصل معكِ أيضًا 🎉",
    en: "These members also chose to connect with you 🎉",
  },
  no_mutual_connects: {
    ar: "لا يوجد تواصل متبادل في هذه الطلعة",
    en: "No mutual connects from this Tal'ah",
  },
  connections_tab: { ar: "تواصل", en: "Connects" },
  connections_title: { ar: "تواصلاتي", en: "My Connects" },
  connections_empty_title: { ar: "لا تواصلات بعد", en: "No connects yet" },
  connections_empty_sub: {
    ar: "بعد إتمام طلعتك وتقديم تقييمك، ستظهر هنا التواصلات المتبادلة",
    en: "After you complete a Tal'ah and submit feedback, your mutual connects will appear here",
  },
  connections_from: { ar: "من طلعة", en: "From a Tal'ah" },
  celebrate_title: { ar: "تهانينا! 🎉", en: "It's a match! 🎉" },
  celebrate_body: {
    ar: "تواصلتِ بشكل متبادل مع",
    en: "You mutually connected with",
  },
  celebrate_body_suffix: {
    ar: "يمكنكِ مراجعة التواصلات في أي وقت من تبويب «تواصل»",
    en: "You can review your connects anytime from the Connects tab",
  },
  celebrate_ok: { ar: "رائع!", en: "Awesome!" },
  new_connects_banner_one: {
    ar: "لديكِ تواصل متبادل جديد! اضغطي لرؤيته",
    en: "You have a new mutual connect! Tap to see",
  },
  new_connects_banner_many: {
    ar: "لديكِ {{n}} تواصلات متبادلة جديدة! اضغطي لرؤيتها",
    en: "You have {{n}} new mutual connects! Tap to see",
  },
  exchange_share_contact: { ar: "مشاركة طريقة التواصل", en: "Share contact" },
  exchange_share_back: { ar: "شاركي أيضًا!", en: "Share back!" },
  exchange_waiting: { ar: "في انتظار {{name}}…", en: "Waiting for {{name}}…" },
  exchange_they_shared: {
    ar: "{{name}} شاركت معكِ طريقة تواصلها",
    en: "{{name}} shared their contact with you",
  },
  exchange_contact_label: { ar: "طريقة التواصل", en: "Contact" },
  exchange_your_contact: { ar: "ما شاركتِه", en: "You shared" },
  exchange_placeholder: {
    ar: "واتساب: 05XXXXXXXX أو إنستغرام: @اسمك",
    en: "e.g. WhatsApp: +966 5X XXX or Instagram: @handle",
  },
  exchange_submit: { ar: "مشاركة", en: "Share" },
  exchange_cancel: { ar: "إلغاء", en: "Cancel" },
  exchange_copied: { ar: "تم النسخ!", en: "Copied!" },
  exchange_privacy_note: {
    ar: "ستُشارَك فقط مع هذا الشخص عند تأكيد التبادل المتبادل",
    en: "Only shared with this person once they share back",
  },
  report_member: { ar: "الإبلاغ عن عضو", en: "Report a member" },
  anonymous: { ar: "مجهول", en: "Anonymous" },

  // Feedback
  feedback_title: { ar: "كيف كانت تجربتك؟", en: "How was it?" },
  rate_experience: { ar: "قيّم التجربة", en: "Rate your experience" },
  would_meet_again: {
    ar: "هل تودّ مقابلتهم مجدداً؟",
    en: "Would you meet again?",
  },
  wma_yes: { ar: "نعم، بالتأكيد", en: "Yes, definitely" },
  wma_maybe: { ar: "ربما", en: "Maybe" },
  wma_no: { ar: "لا أعتقد", en: "Probably not" },
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
  block_also: {
    ar: "حظر هذا الشخص أيضًا (لن يظهر في طلعاتك القادمة)",
    en: "Also block this person (they won't appear in future Tal'ahs)",
  },

  // Profile / Settings
  profile_title: { ar: "ملفي", en: "Profile" },
  edit_interests: { ar: "تعديل الاهتمامات", en: "Edit interests" },
  edit_personality: {
    ar: "تعديل الشخصية والتوافق",
    en: "Edit personality & matching",
  },
  edit_profile: { ar: "تعديل الملف الشخصي", en: "Edit profile" },
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
  compat_interests: {
    ar: "الاهتمامات المشتركة",
    en: "Shared interests/topics",
  },
  compat_lifestyle: { ar: "أسلوب الحياة", en: "Lifestyle" },
  compat_energy: { ar: "الطاقة الاجتماعية", en: "Social energy" },
  compat_conversation: { ar: "أسلوب الحديث", en: "Conversation" },
  compat_intent_boundary: { ar: "النية والحدود", en: "Intent & boundary" },
  compat_common_days: { ar: "الأيام المشتركة", en: "Common days" },
  compat_common_times: { ar: "الأوقات المشتركة", en: "Common times" },
  compat_no_overlap: { ar: "لا تقاطع", en: "No overlap" },

  // Micro-survey
  micro_survey_title: { ar: "قبل أن نبدأ — سؤالان سريعان ✨", en: "Quick intro survey ✨" },
  micro_q1: { ar: "كيف سمعتِ عن طلعة؟", en: "How did you hear about Tal'ah?" },
  micro_q2: { ar: "ما الذي تتطلعين إليه أكثر؟", en: "What are you most looking forward to?" },
  micro_q3: { ar: "صفي طلعة بكلمة واحدة (اختياري)", en: "Describe Tal'ah in one word (optional)" },
  micro_q3_placeholder: { ar: "كلمة واحدة…", en: "One word…" },
  micro_submit: { ar: "إرسال", en: "Submit" },
  micro_success_toast: { ar: "شكرًا! ✨", en: "Thank you! ✨" },

  // Exit survey
  exit_survey_title: { ar: "نأسف لرحيلك", en: "Sorry to see you go" },
  exit_survey_subtitle: { ar: "ساعدينا في التحسين بإجابة سريعة", en: "Help us improve with a quick answer" },
  exit_q1: { ar: "ما سبب حذف حسابك؟", en: "Why are you deleting your account?" },
  exit_q2: { ar: "هل لديك أي ملاحظات؟ (اختياري)", en: "Any other feedback? (optional)" },
  exit_q2_placeholder: { ar: "ملاحظاتك…", en: "Your feedback…" },
  exit_submit: { ar: "إرسال وحذف الحساب", en: "Submit & delete account" },
  exit_skip: { ar: "تخطي وحذف الحساب مباشرةً", en: "Skip and delete account" },

  // Feedback prompt card
  feedback_prompt_title: { ar: "كيف كانت طلعتك؟ 🌟", en: "How was your meetup? 🌟" },
  feedback_prompt_body: { ar: "شاركينا تقييمك للمجموعة", en: "Share your rating for the group" },
  feedback_prompt_cta: { ar: "تقييم الآن", en: "Rate now" },

  // Contact info
  contact_info_title: { ar: "معلومات التواصل", en: "Contact Info" },
  contact_info_subtitle: {
    ar: "تُكشف فقط لمن تبادلتم الإعجاب المتبادل",
    en: "Only revealed to your mutual connects",
  },
  contact_edit_title: { ar: "تعديل معلومات التواصل", en: "Edit Contact Info" },
  contact_add_cta: {
    ar: "أضف معلومات تواصلك لتظهر لمعارفك",
    en: "Add your contact details to share with connects",
  },
  contact_privacy_notice: {
    ar: "هذه المعلومات خاصة تماماً — لا تظهر إلا للأشخاص الذين تبادلتم معهم اختيار «تواصل» في نفس المجموعة.",
    en: "This information is completely private — it only appears to people who mutually chose 'Connect' with you in the same group.",
  },
  contact_fields_optional_note: {
    ar: "جميع الحقول اختيارية. أضف ما تريد مشاركته فقط.",
    en: "All fields are optional. Only add what you're comfortable sharing.",
  },
  contact_phone_label: { ar: "رقم الجوال / واتساب", en: "Mobile / WhatsApp" },
  contact_phone_placeholder: { ar: "5XXXXXXXX", en: "e.g. 0501234567" },
  contact_instagram_label: { ar: "انستغرام", en: "Instagram" },
  contact_instagram_placeholder: { ar: "اسم المستخدم", en: "username" },
  contact_snapchat_label: { ar: "سناب شات", en: "Snapchat" },
  contact_snapchat_placeholder: { ar: "اسم المستخدم", en: "username" },
  contact_twitter_label: { ar: "تويتر / X", en: "Twitter / X" },
  contact_twitter_placeholder: { ar: "اسم المستخدم", en: "username" },
  contact_tiktok_label: { ar: "تيك توك", en: "TikTok" },
  contact_tiktok_placeholder: { ar: "اسم المستخدم", en: "username" },
  contact_not_added_yet: {
    ar: "لم تُضف {{name}} معلومات تواصل بعد",
    en: "{{name}} hasn't added contact info yet",
  },
  contact_add_yours: {
    ar: "أضف معلوماتك ليتمكن معارفك من التواصل معك",
    en: "Add your info so your connects can reach you",
  },

  // Edit Preferences screen
  edit_preferences: { ar: "تعديل التفضيلات", en: "Edit Preferences" },
  save_changes: { ar: "حفظ التغييرات", en: "Save Changes" },
  my_basics: { ar: "أساسياتي", en: "My Basics" },
  talah_type_label: { ar: "نوع الطلعة", en: "Tal'ah Type" },
  talah_type_women: { ar: "طلعات نساء", en: "Women-only Tal'ahs" },
  talah_type_men: { ar: "طلعات رجال", en: "Men-only Tal'ahs" },
  request_type_change: { ar: "طلب تغيير نوع الطلعة", en: "Request Tal'ah Type Change" },
  type_change_modal_title: { ar: "تغيير نوع الطلعة", en: "Change Tal'ah Type" },
  type_change_modal_body: {
    ar: "نوع الطلعة يؤثر على الأمان وطريقة ترتيب المجموعات. أي تغيير يحتاج مراجعة من الإدارة قبل تطبيقه على الطلعات القادمة.",
    en: "Tal'ah Type affects safety and group matching. Any change requires admin review before it applies to future Tal'ahs.",
  },
  type_change_pending_badge: { ar: "طلب التغيير قيد المراجعة", en: "Change request under review" },
  type_change_rejected_badge: { ar: "طلب التغيير مرفوض — تواصل معنا", en: "Change request rejected — contact us" },
  type_change_approved_badge: { ar: "تم تغيير نوع الطلعة ✓", en: "Tal'ah Type changed ✓" },
  type_change_reason_placeholder: { ar: "سبب الطلب (اختياري)", en: "Reason for request (optional)" },
  my_vibe_section: { ar: "انطباعاتي وطاقتي", en: "My Vibe" },
  meetup_pref_section: { ar: "تفضيل الطلعة", en: "Meetup Preference" },
  pref_saved: { ar: "تم حفظ التغييرات ✓", en: "Changes saved ✓" },
  type_change_submitted: { ar: "تم إرسال طلبك للمراجعة", en: "Your request has been submitted for review" },
  already_pending_request: { ar: "لديك طلب قيد المراجعة بالفعل", en: "You already have a pending request" },

  // Post-Tal'ah Feedback — structured questions
  feedback_already_submitted: {
    ar: "تم إرسال تقييمك لهذه الطلعة، شكراً لك ✨",
    en: "Your feedback for this Tal'ah has already been submitted. Thank you ✨",
  },
  checking_feedback_status: { ar: "جارٍ التحقق...", en: "Checking..." },
  comfort_rating_q: {
    ar: "كيف كان شعورك بالراحة أثناء الطلعة؟",
    en: "How comfortable did you feel during the Tal'ah?",
  },
  group_fit_q: {
    ar: "هل حسيت أن المجموعة مناسبة لك؟",
    en: "Did the group feel suitable for you?",
  },
  group_fit_very: { ar: "نعم، مناسبة جداً", en: "Yes, very suitable" },
  group_fit_somewhat: { ar: "إلى حد ما", en: "Somewhat" },
  group_fit_not: { ar: "لا، ما كانت مناسبة", en: "No, not suitable" },
  would_join_again_q: {
    ar: "هل تود تجربة طلعة ثانية؟",
    en: "Would you join another Tal'ah?",
  },
  venue_rating_q: {
    ar: "كيف كان المكان للطلعة؟",
    en: "How was the venue for the Tal'ah?",
  },
  venue_suitable_q: {
    ar: "هل المكان مناسب لطلعات مستقبلية؟",
    en: "Is this venue suitable for future Tal'ahs?",
  },
  venue_suitable_yes: { ar: "نعم", en: "Yes" },
  venue_suitable_maybe: { ar: "ربما", en: "Maybe" },
  venue_suitable_no: { ar: "لا", en: "No" },
  safety_concern_q: {
    ar: "هل واجهت أي موقف غير مريح أو يحتاج مراجعة؟",
    en: "Did anything uncomfortable happen that needs review?",
  },
  safety_concern_no: { ar: "لا، كل شيء كان بخير", en: "No, everything was fine" },
  safety_concern_yes: { ar: "نعم، حدث شيء", en: "Yes, something happened" },
  safety_concern_details_placeholder: {
    ar: "اشرح لنا باختصار",
    en: "Briefly explain what happened",
  },
  feedback_required_fields: {
    ar: "يرجى الإجابة على جميع الأسئلة المطلوبة",
    en: "Please answer all required questions",
  },

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