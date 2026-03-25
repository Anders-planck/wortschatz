import { Text, View } from "react-native";
import { colors } from "@/features/shared/theme/colors";
import { fonts } from "@/features/shared/theme/typography";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

interface DashboardGreetingProps {
  streak: number;
  totalCount: number;
}

export function DashboardGreeting({
  streak,
  totalCount,
}: DashboardGreetingProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          fontWeight: "600",
          color: colors.textPrimary,
          letterSpacing: -0.3,
        }}
      >
        {getGreeting()}
      </Text>
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          fontWeight: "500",
          color: colors.textHint,
          fontVariant: ["tabular-nums"],
        }}
      >
        {streak > 0 ? `${streak}d streak  ·  ` : ""}
        {totalCount} parole salvate
      </Text>
    </View>
  );
}
