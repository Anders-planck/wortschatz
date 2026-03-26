import { Text, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

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
  const { textStyles } = useAppTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={textStyles.heading}>{getGreeting()}</Text>
      <Text
        style={[
          textStyles.mono,
          { fontSize: 10, fontVariant: ["tabular-nums"] },
        ]}
      >
        {streak > 0 ? `${streak}d streak  ·  ` : ""}
        {totalCount} parole salvate
      </Text>
    </View>
  );
}
