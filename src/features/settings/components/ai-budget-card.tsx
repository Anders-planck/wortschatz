import { Pressable, Text, TextInput, View } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";
import { formatCost } from "../utils/format-usage";

interface AiBudgetCardProps {
  monthCost: number;
  budget: number;
  editing: boolean;
  budgetInput: string;
  onToggleEdit: () => void;
  onInputChange: (text: string) => void;
  onSave: () => void;
}

export function AiBudgetCard({
  monthCost,
  budget,
  editing,
  budgetInput,
  onToggleEdit,
  onInputChange,
  onSave,
}: AiBudgetCardProps) {
  const { colors, textStyles } = useAppTheme();

  const isOverBudget = monthCost > budget;
  const budgetPercent = Math.min((monthCost / budget) * 100, 100);
  const remaining = budget - monthCost;
  const monthName = new Date().toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderCurve: "continuous",
        padding: 18,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={[textStyles.monoLabel, { color: colors.textGhost }]}>
          Budget mensile
        </Text>
        <Pressable onPress={onToggleEdit}>
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 13,
              color: colors.accent,
              fontWeight: "600",
            }}
          >
            {editing ? "Annulla" : "Modifica"}
          </Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput
            value={budgetInput}
            onChangeText={onInputChange}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              backgroundColor: colors.cream,
              borderRadius: 10,
              borderCurve: "continuous",
              padding: 12,
              fontFamily: textStyles.mono.fontFamily,
              fontSize: 18,
              color: colors.textPrimary,
            }}
            placeholder="5.00"
            placeholderTextColor={colors.textGhost}
          />
          <Pressable
            onPress={onSave}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 10,
              borderCurve: "continuous",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontFamily: textStyles.heading.fontFamily,
                fontSize: 14,
                fontWeight: "600",
                color: colors.onAccent,
              }}
            >
              Salva
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View
            style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}
          >
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 28,
                fontWeight: "600",
                color: isOverBudget ? colors.danger : colors.textPrimary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {formatCost(monthCost)}
            </Text>
            <Text
              style={{
                fontFamily: textStyles.mono.fontFamily,
                fontSize: 14,
                color: colors.textMuted,
                fontVariant: ["tabular-nums"],
              }}
            >
              / ${budget.toFixed(2)}
            </Text>
          </View>

          <View
            style={{
              height: 6,
              backgroundColor: colors.accentLight,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${budgetPercent}%`,
                borderRadius: 3,
                backgroundColor: isOverBudget ? colors.danger : colors.accent,
              }}
            />
          </View>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={[
                textStyles.mono,
                { fontSize: 10, color: colors.textGhost },
              ]}
            >
              {monthName}
            </Text>
            <Text
              style={[
                textStyles.mono,
                {
                  fontSize: 10,
                  color: isOverBudget ? colors.danger : colors.success,
                },
              ]}
            >
              {isOverBudget
                ? `-${formatCost(Math.abs(remaining))} oltre`
                : `${formatCost(remaining)} rimanenti`}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
