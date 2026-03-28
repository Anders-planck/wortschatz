import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import type { Scenario } from "../types";

interface ScenarioCardProps {
  scenario: Scenario;
  onPress: () => void;
  featured?: boolean;
}

export function ScenarioCard({
  scenario,
  onPress,
  featured = false,
}: ScenarioCardProps) {
  const { colors, textStyles } = useAppTheme();

  if (featured) {
    return (
      <Animated.View entering={FadeInUp.duration(400)}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 24,
            gap: 16,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Image
            source={`sf:${scenario.icon}`}
            style={{ width: 36, height: 36 }}
            tintColor="#FFFFFF"
          />
          <View style={{ gap: 6 }}>
            <Text
              style={[textStyles.heading, { fontSize: 20, color: "#FFFFFF" }]}
            >
              {scenario.title}
            </Text>
            <Text style={[textStyles.body, { color: "rgba(255,255,255,0.8)" }]}>
              {scenario.description}
            </Text>
          </View>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 12,
              borderCurve: "continuous",
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={[
                textStyles.mono,
                { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
              ]}
            >
              {scenario.level}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(80).duration(400)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: colors.card,
          borderRadius: 12,
          borderCurve: "continuous",
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          opacity: pressed ? 0.9 : 1,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: colors.accentLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={`sf:${scenario.icon}`}
            style={{ width: 22, height: 22 }}
            tintColor={colors.accent}
          />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={[textStyles.heading, { fontSize: 15, letterSpacing: 0 }]}
          >
            {scenario.title}
          </Text>
          <Text style={[textStyles.bodyLight]}>{scenario.description}</Text>
        </View>

        <View
          style={{
            backgroundColor: colors.accentLight,
            borderRadius: 10,
            borderCurve: "continuous",
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text
            style={[
              textStyles.mono,
              { color: colors.accent, fontSize: 10, fontWeight: "600" },
            ]}
          >
            {scenario.level}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
