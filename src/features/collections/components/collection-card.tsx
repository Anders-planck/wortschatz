import React from "react";
import { Pressable, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { CollectionWithStats } from "../types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface CollectionCardProps {
  collection: CollectionWithStats;
  index?: number;
  onReview: (id: number) => void;
  onRename: (id: number) => void;
  onDelete: (id: number) => void;
}

export const CollectionCard = React.memo(function CollectionCard({
  collection,
  index = 0,
  onReview,
  onRename,
  onDelete,
}: CollectionCardProps) {
  const { colors, textStyles } = useAppTheme();
  const isDark = colors.bg === "#1A1816";

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(350)}>
      <Link href={`/collection/${collection.id}` as Href} asChild>
        <Link.Trigger>
          <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
          >
            {/* Folder tab */}
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: collection.color,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                paddingHorizontal: 14,
                paddingTop: 5,
                paddingBottom: 3,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#1A1816",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
                numberOfLines={1}
              >
                {collection.name}
              </Text>
              {collection.isAiGenerated && (
                <SymbolView
                  name="sparkles"
                  size={10}
                  tintColor="#1A1816"
                  resizeMode="scaleAspectFit"
                />
              )}
            </View>

            {/* Folder body */}
            <View
              style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 14,
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                borderCurve: "continuous",
                borderTopWidth: 3,
                borderTopColor: collection.color,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                boxShadow: isDark
                  ? "0 1px 4px rgba(0,0,0,0.3)"
                  : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  borderCurve: "continuous",
                  backgroundColor: collection.color + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SymbolView
                  name={collection.icon as SFSymbol}
                  size={24}
                  tintColor={collection.color}
                  resizeMode="scaleAspectFit"
                />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                {/* Word count */}
                <Text
                  style={{
                    fontFamily: textStyles.mono.fontFamily,
                    fontSize: 11,
                    color: colors.textHint,
                  }}
                >
                  {collection.wordCount}{" "}
                  {collection.wordCount === 1 ? "parola" : "parole"}
                </Text>

                {/* Progress bar */}
                <View
                  style={{
                    height: 3,
                    backgroundColor: colors.borderLight,
                    borderRadius: 1.5,
                    width: "60%",
                  }}
                >
                  <View
                    style={{
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: collection.color,
                      width: `${Math.max(collection.masteryPercent, 2)}%`,
                    }}
                  />
                </View>
              </View>

              {/* Mastery % */}
              {collection.masteryPercent > 0 && (
                <Text
                  style={{
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: 20,
                    fontWeight: "700",
                    color: collection.color,
                  }}
                >
                  {collection.masteryPercent}%
                </Text>
              )}
            </View>
          </Pressable>
        </Link.Trigger>

        <Link.Preview />

        <Link.Menu>
          <Link.MenuAction
            title="Ripassa"
            icon="play.fill"
            onPress={() => onReview(collection.id)}
          />
          <Link.MenuAction
            title="Rinomina"
            icon="pencil"
            onPress={() => onRename(collection.id)}
          />
          <Link.MenuAction
            title="Elimina"
            icon="trash"
            destructive
            onPress={() => onDelete(collection.id)}
          />
        </Link.Menu>
      </Link>
    </Animated.View>
  );
});
