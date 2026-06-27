import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";

const OLIVE_DARK = "#2D3820";
const GOLD = "#B8924A";
const OLIVE = "#6B7A4E";
const INK = "#2A2A2A";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const VENUE_IMG = require("../assets/images/interior-evening.png");

const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="28" y="108" width="140" height="58" rx="22" fill="none" stroke="#c8a84b" stroke-width="11" stroke-linejoin="round"/>
  <line x1="150" y1="38" x2="150" y2="108" stroke="#c8a84b" stroke-width="11" stroke-linecap="round"/>
</svg>`;

const SVG_NETWORK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
  <circle cx="110" cy="110" r="58" fill="#ece4d3" opacity="0.5"/>
  <circle cx="110" cy="110" r="58" fill="none" stroke="#3d4a2e" stroke-width="2" opacity="0.7"/>
  <circle cx="110" cy="24" r="16" fill="#3d4a2e"/>
  <circle cx="196" cy="110" r="16" fill="#3d4a2e"/>
  <circle cx="110" cy="196" r="16" fill="#3d4a2e"/>
  <circle cx="24" cy="110" r="16" fill="#3d4a2e"/>
  <circle cx="110" cy="110" r="6" fill="#c8a84b"/>
</svg>`;

const SVG_MATCHING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 240">
  <g stroke="#c8a84b" stroke-width="1.5" fill="none" opacity="0.5" stroke-dasharray="3 4">
    <line x1="60" y1="60" x2="140" y2="120"/>
    <line x1="220" y1="60" x2="140" y2="120"/>
    <line x1="60" y1="180" x2="140" y2="120"/>
    <line x1="220" y1="180" x2="140" y2="120"/>
  </g>
  <circle cx="140" cy="120" r="34" fill="#3d4a2e"/>
  <text x="140" y="135" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="30" fill="#c8a84b">ط</text>
  <circle cx="60" cy="60" r="24" fill="#e8d6a4"/>
  <circle cx="220" cy="60" r="24" fill="#bcd0a8"/>
  <circle cx="60" cy="180" r="24" fill="#d9c7b1"/>
  <circle cx="220" cy="180" r="24" fill="#c4b08a"/>
</svg>`;

const SVG_LOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <rect x="34" y="68" width="92" height="74" rx="14" fill="none" stroke="#c8a84b" stroke-width="4"/>
  <path d="M56 68L56 50a24 24 0 0 1 48 0L104 68" fill="none" stroke="#c8a84b" stroke-width="4" stroke-linecap="round"/>
  <circle cx="80" cy="100" r="7" fill="#c8a84b"/>
  <rect x="77" y="104" width="6" height="18" rx="3" fill="#c8a84b"/>
</svg>`;

const SVG_CUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M50 100L50 140Q50 165 75 165L115 165Q140 165 140 140L140 100Z" fill="#3d4a2e"/>
  <path d="M140 110Q168 110 168 130Q168 150 140 150" fill="none" stroke="#3d4a2e" stroke-width="9" stroke-linecap="round"/>
  <rect x="35" y="172" width="120" height="9" rx="4" fill="#3d4a2e"/>
  <path d="M95 80Q87 65 95 50Q103 35 95 22" fill="none" stroke="#c8a84b" stroke-width="6" stroke-linecap="round"/>
</svg>`;

type SlideId = "welcome" | "why" | "step1" | "step2" | "step3" | "privacy" | "reserve";

interface Slide {
  id: SlideId;
  dark: boolean;
}

const SLIDES: Slide[] = [
  { id: "welcome", dark: true },
  { id: "why", dark: false },
  { id: "step1", dark: false },
  { id: "step2", dark: false },
  { id: "step3", dark: false },
  { id: "privacy", dark: true },
  { id: "reserve", dark: false },
];

const TOTAL = SLIDES.length;

async function markSeen() {
  await AsyncStorage.setItem("talah:intro_seen", "1");
}

function Kick({ text, dark }: { text: string; dark: boolean }) {
  return (
    <AppText
      style={{
        fontFamily: "Inter_600SemiBold",
        fontSize: 11,
        letterSpacing: 2.5,
        textTransform: "uppercase",
        color: dark ? GOLD : GOLD,
        marginBottom: 8,
        textAlign: "right",
      }}
    >
      {text}
    </AppText>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <View
      style={{
        width: active ? 20 : 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: active ? OLIVE : "#C8B99A",
        marginHorizontal: 3,
      }}
    />
  );
}

function ChipsIllustration() {
  const chipStyle = (selected: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: selected ? OLIVE : "#EDE5D7",
  });
  const chipText = (selected: boolean) => ({
    fontSize: 13,
    fontFamily: "Inter_500Medium" as const,
    color: selected ? GOLD : OLIVE,
  });
  return (
    <View
      style={{
        width: 260,
        maxWidth: "90%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#28300A",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
        {["قهوة هادئة", "كتب", "فن"].map((l) => (
          <View key={l} style={chipStyle(false)}>
            <AppText style={chipText(false)}>{l}</AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
        {["مشي", "حوار عميق"].map((l) => (
          <View key={l} style={chipStyle(true)}>
            <AppText style={chipText(true)}>{l}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function VenueIllustration() {
  return (
    <View
      style={{
        width: 280,
        maxWidth: "92%",
        backgroundColor: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        shadowColor: "#2D3820",
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <View style={{ height: 150, position: "relative" }}>
        <Image
          source={VENUE_IMG}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: GOLD,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 99,
          }}
        >
          <AppText style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: OLIVE_DARK, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Curated
          </AppText>
        </View>
      </View>
      <View style={{ padding: 14, gap: 8 }}>
        <AppText style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: INK, textAlign: "right" }}>
          طاولة مخصّصة لك
        </AppText>
        <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
          {["عشاء", "خاص"].map((l) => (
            <View
              key={l}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: "#EDE5D7" }}
            >
              <AppText style={{ fontSize: 12, color: OLIVE }}>{l}</AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

interface SlideContentProps {
  slide: Slide;
  width: number;
  onNext: () => void;
  onSkip: () => void;
  onLogin: () => void;
  onFinish: () => void;
  currentIndex: number;
  onBack: () => void;
}

function SlideContent({ slide, width, onNext, onSkip, onLogin, onFinish, currentIndex, onBack }: SlideContentProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id, dark } = slide;
  const bg = dark ? OLIVE_DARK : colors.background;
  const fg = dark ? "#FAF9F8" : colors.foreground;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === TOTAL - 1;

  const BAR_ICON_COLOR = dark ? "#FAF9F8" : INK;

  return (
    <View style={{ width, flex: 1, backgroundColor: bg }}>
      {dark && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
          pointerEvents="none"
        >
          {[240, 180, 120].map((r) => (
            <View
              key={r}
              style={{
                position: "absolute",
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                borderWidth: 0.5,
                borderColor: GOLD,
                opacity: 0.1,
                top: id === "welcome" ? 60 - r : 40 - r,
              }}
            />
          ))}
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: insets.top + 14, paddingBottom: 8 }}>
        {!isFirst ? (
          <Pressable onPress={onBack} hitSlop={12} style={{ padding: 4 }}>
            <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
              <SvgXml
                xml={`<svg viewBox="0 0 24 24" fill="none" stroke="${BAR_ICON_COLOR}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="9 6 15 12 9 18"/></svg>`}
                width={22}
                height={22}
              />
            </View>
          </Pressable>
        ) : (
          <View style={{ width: 30 }} />
        )}
        {!isLast ? (
          <Pressable onPress={onSkip} hitSlop={12}>
            <AppText style={{ fontSize: 14, color: dark ? "rgba(250,249,248,0.65)" : "#888", fontFamily: "Inter_500Medium" }}>
              تخطّي
            </AppText>
          </Pressable>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center" }}>
        {id === "welcome" && (
          <View style={{ alignItems: "center", gap: 0 }}>
            <SvgXml xml={SVG_LOGO} width={100} height={100} />
            <AppText style={{ fontSize: 52, fontFamily: "Inter_700Bold", color: "#FAF9F8", lineHeight: 60, marginTop: 16 }}>طلعة</AppText>
            <AppText style={{ fontSize: 12, color: GOLD, letterSpacing: 4, textTransform: "uppercase", marginTop: 8, fontFamily: "Inter_600SemiBold" }}>Tal'ah</AppText>
            <AppText style={{ fontSize: 20, color: "rgba(250,249,248,0.85)", textAlign: "center", marginTop: 28, lineHeight: 32, fontFamily: "Inter_400Regular" }}>
              لقاءات حقيقية، مع ناس تشبهك.
            </AppText>
          </View>
        )}

        {id === "why" && (
          <View style={{ gap: 20 }}>
            <Kick text="01 / Why Tal'ah" dark={dark} />
            <View style={{ alignItems: "center" }}>
              <SvgXml xml={SVG_NETWORK} width={180} height={180} />
            </View>
            <View style={{ gap: 10 }}>
              <AppText style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: INK, textAlign: "right", lineHeight: 36 }}>
                الصداقة ما تجي صدفة.
              </AppText>
              <AppText style={{ fontSize: 16, color: "#5a5a5a", textAlign: "right", lineHeight: 26, fontFamily: "Inter_400Regular" }}>
                مع الوقت تصير اللقاءات الجديدة أصعب. طلعة تختار لك الناس اللي يناسبونك، وتتكفّل بالباقي.
              </AppText>
            </View>
          </View>
        )}

        {id === "step1" && (
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <Kick text="الخطوة ١ من ٣" dark={dark} />
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ color: GOLD, fontFamily: "Inter_700Bold", fontSize: 15 }}>1</AppText>
              </View>
            </View>
            <View style={{ alignItems: "center" }}>
              <ChipsIllustration />
            </View>
            <View style={{ gap: 8 }}>
              <AppText style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: INK, textAlign: "right", lineHeight: 36 }}>
                عرّفنا على نفسك.
              </AppText>
              <AppText style={{ fontSize: 16, color: "#5a5a5a", textAlign: "right", lineHeight: 26, fontFamily: "Inter_400Regular" }}>
                أسئلة قصيرة عن شخصيتك واهتماماتك.
              </AppText>
            </View>
          </View>
        )}

        {id === "step2" && (
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <Kick text="الخطوة ٢ من ٣" dark={dark} />
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ color: GOLD, fontFamily: "Inter_700Bold", fontSize: 15 }}>2</AppText>
              </View>
            </View>
            <View style={{ alignItems: "center" }}>
              <SvgXml xml={SVG_MATCHING} width={220} height={180} />
            </View>
            <View style={{ gap: 8 }}>
              <AppText style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: INK, textAlign: "right", lineHeight: 36 }}>
                نجمعك مع{" "}
                <AppText style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: OLIVE }}>٣ إلى ٥</AppText>
                {" "}أشخاص.
              </AppText>
              <AppText style={{ fontSize: 16, color: "#5a5a5a", textAlign: "right", lineHeight: 26, fontFamily: "Inter_400Regular" }}>
                مجموعة صغيرة تشبهك في الاهتمامات. مجموعات رجال أو نساء فقط — بدون أسماء ولا صور، إلى أن تلتقون.
              </AppText>
            </View>
          </View>
        )}

        {id === "step3" && (
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <Kick text="الخطوة ٣ من ٣" dark={dark} />
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ color: GOLD, fontFamily: "Inter_700Bold", fontSize: 15 }}>3</AppText>
              </View>
            </View>
            <View style={{ alignItems: "center" }}>
              <VenueIllustration />
            </View>
            <View style={{ gap: 8 }}>
              <AppText style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: INK, textAlign: "right", lineHeight: 34 }}>
                نحجز الطاولة، وما عليك إلا الحضور.
              </AppText>
              <AppText style={{ fontSize: 16, color: "#5a5a5a", textAlign: "right", lineHeight: 26, fontFamily: "Inter_400Regular" }}>
                مكان منتقى، ووقت مناسب لك — بدون تنسيق من قبلك.
              </AppText>
            </View>
          </View>
        )}

        {id === "privacy" && (
          <View style={{ gap: 20 }}>
            <Kick text="Privacy by design" dark={dark} />
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <SvgXml xml={SVG_LOCK} width={120} height={120} />
            </View>
            <View style={{ gap: 8 }}>
              <AppText style={{ fontSize: 28, fontFamily: "Inter_700Bold", color: "#FAF9F8", textAlign: "right", lineHeight: 38 }}>
                خصوصيتك أول شي.
              </AppText>
              <View style={{ gap: 12, marginTop: 6 }}>
                {[
                  "لا بروفايل عام — أبداً.",
                  "بدون اسم ظاهر، وبدون صور علنية.",
                  "مجموعات رجال أو نساء فقط.",
                  "تفاصيل اللقاء تظهر قبل ٢٤ ساعة فقط.",
                ].map((b) => (
                  <View key={b} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, justifyContent: "flex-end" }}>
                    <AppText style={{ fontSize: 15, color: "rgba(250,249,248,0.85)", textAlign: "right", lineHeight: 22, fontFamily: "Inter_400Regular", flex: 1 }}>
                      {b}
                    </AppText>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginTop: 8 }} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {id === "reserve" && (
          <View style={{ gap: 20 }}>
            <Kick text="Almost there" dark={dark} />
            <View style={{ alignItems: "center" }}>
              <SvgXml xml={SVG_CUP} width={160} height={160} />
            </View>
            <View style={{ gap: 8 }}>
              <AppText style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: INK, textAlign: "right", lineHeight: 36 }}>
                احجز مكانك، والباقي علينا.
              </AppText>
              <AppText style={{ fontSize: 16, color: "#5a5a5a", textAlign: "right", lineHeight: 26, fontFamily: "Inter_400Regular" }}>
                سجّل حسابك في قائمة الانتظار، وكون معنا في مرحلة الانطلاق.
              </AppText>
            </View>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 14, alignItems: "center" }}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === currentIndex ? (dark ? GOLD : colors.primary) : (dark ? "rgba(200,168,75,0.3)" : colors.border),
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>

        {id === "welcome" && (
          <>
            <Pressable
              onPress={onNext}
              style={{
                width: "100%",
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <AppText style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: OLIVE_DARK }}>يلا نبدأ</AppText>
            </Pressable>
            <Pressable onPress={onLogin}>
              <AppText style={{ fontSize: 14, color: "rgba(250,249,248,0.6)", fontFamily: "Inter_400Regular" }}>
                عندك حساب؟{" "}
                <AppText style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "rgba(250,249,248,0.9)" }}>
                  تسجيل الدخول
                </AppText>
              </AppText>
            </Pressable>
          </>
        )}

        {id === "why" && (
          <Pressable
            onPress={onNext}
            style={{ width: "100%", backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          >
            <AppText style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: "#FAF9F8" }}>كيف نعمل؟</AppText>
          </Pressable>
        )}

        {(id === "step1" || id === "step2" || id === "step3") && (
          <Pressable
            onPress={onNext}
            style={{ width: "100%", backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          >
            <AppText style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: "#FAF9F8" }}>التالي</AppText>
          </Pressable>
        )}

        {id === "privacy" && (
          <Pressable
            onPress={onNext}
            style={{ width: "100%", backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          >
            <AppText style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: OLIVE_DARK }}>التالي</AppText>
          </Pressable>
        )}

        {id === "reserve" && (
          <>
            <Pressable
              onPress={onFinish}
              style={{ width: "100%", backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
            >
              <AppText style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: "#FAF9F8" }}>احجز مكانك</AppText>
            </Pressable>
            <AppText style={{ fontSize: 12, color: "#aaa", textAlign: "center", fontFamily: "Inter_400Regular" }}>
              بمتابعتك فإنك توافق على الشروط والأحكام
            </AppText>
          </>
        )}
      </View>
    </View>
  );
}

export default function AppIntroScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const goTo = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNext = () => {
    if (currentIndex < TOTAL - 1) goTo(currentIndex + 1);
  };

  const handleBack = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const handleSkip = async () => {
    await markSeen();
    router.replace("/");
  };

  const handleLogin = async () => {
    await markSeen();
    router.replace("/");
  };

  const handleFinish = async () => {
    await markSeen();
    router.replace("/");
  };

  return (
    <FlatList
      ref={listRef}
      data={SLIDES}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      viewabilityConfig={viewabilityConfig.current}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <SlideContent
          slide={item}
          width={width}
          currentIndex={currentIndex}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          onLogin={handleLogin}
          onFinish={handleFinish}
        />
      )}
      style={{ flex: 1 }}
    />
  );
}
