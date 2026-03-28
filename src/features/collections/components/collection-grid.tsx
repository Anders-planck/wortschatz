import React from "react";
import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { CollectionWithStats } from "../types";
import { CollectionCard } from "./collection-card";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface CollectionGridProps {
  collections: CollectionWithStats[];
  onCreateNew: () => void;
  onOrganizeAI: () => void;
  onReview: (id: number) => void;
  onRename: (id: number) => void;
  onDelete: (id: number) => void;
}

function EmptyState({
  onCreateNew,
  onOrganizeAI,
}: {
  onCreateNew: () => void;
  onOrganizeAI: () => void;
}) {
  const { colors, textStyles } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(350)}
      style={{
        alignItems: "center",
        paddingTop: 56,
        paddingBottom: 40,
        gap: 20,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          borderCurve: "continuous",
          backgroundColor: colors.accentLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SymbolView
          name="folder.fill"
          size={32}
          tintColor={colors.accent}
          resizeMode="scaleAspectFit"
        />
      </View>

      <View style={{ alignItems: "center", gap: 6 }}>
        <Text style={[textStyles.heading, { fontSize: 18 }]}>
          Nessuna lista
        </Text>
        <Text
          style={[
            textStyles.bodyLight,
            {
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              paddingHorizontal: 48,
              lineHeight: 20,
            },
          ]}
        >
          Organizza il vocabolario in liste tematiche per un ripasso mirato
        </Text>
      </View>

      <View style={{ gap: 10, alignItems: "center" }}>
        <Pressable
          onPress={onCreateNew}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.accent,
            borderRadius: 12,
            borderCurve: "continuous",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <SymbolView
            name="plus"
            size={14}
            tintColor="#FFFFFF"
            resizeMode="scaleAspectFit"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 15,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            Crea la prima lista
          </Text>
        </Pressable>

        <Pressable
          onPress={onOrganizeAI}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderCurve: "continuous",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <SymbolView
            name="sparkles"
            size={14}
            tintColor={colors.accent}
            resizeMode="scaleAspectFit"
          />
          <Text
            style={{
              fontFamily: textStyles.heading.fontFamily,
              fontSize: 15,
              fontWeight: "600",
              color: colors.accent,
            }}
          >
            Organizza con AI
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function CreateNewButton({
  onPress,
  index,
}: {
  onPress: () => void;
  index: number;
}) {
  const { colors, textStyles } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(350)}
      style={{ flex: 1 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: pressed ? colors.accent : colors.border,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 18,
          minHeight: 90,
          gap: 5,
        })}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            borderCurve: "continuous",
            backgroundColor: colors.borderLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolView
            name="plus"
            size={14}
            tintColor={colors.textMuted}
            resizeMode="scaleAspectFit"
          />
        </View>
        <Text
          style={{
            fontFamily: textStyles.mono.fontFamily,
            fontSize: 10,
            color: colors.textGhost,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Nuova
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export const CollectionGrid = React.memo(function CollectionGrid({
  collections,
  onCreateNew,
  onOrganizeAI,
  onReview,
  onRename,
  onDelete,
}: CollectionGridProps) {
  if (collections.length === 0) {
    return <EmptyState onCreateNew={onCreateNew} onOrganizeAI={onOrganizeAI} />;
  }

  return (
    <View style={{ gap: 14 }}>
      {collections.map((collection, i) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          index={i}
          onReview={onReview}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
      <CreateNewButton onPress={onCreateNew} index={collections.length} />
    </View>
  );
});
