import React from "react";
import { Pressable, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { CollectionWithStats } from "../types";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface CollectionCardProps {
  collection: CollectionWithStats;
  featured?: boolean;
  index?: number;
  onReview: (id: number) => void;
  onRename: (id: number) => void;
  onDelete: (id: number) => void;
}

export const CollectionCard = React.memo(function CollectionCard({
  collection,
  featured = false,
  index = 0,
  onReview,
  onRename,
  onDelete,
}: CollectionCardProps) {
  const { colors, textStyles } = useAppTheme();

  const iconSize = featured ? 36 : 28;
  const iconContainerSize = featured ? 56 : 44;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40).duration(300)}
      style={{ flex: featured ? undefined : 1 }}
    >
      <Link href={`/collection/${collection.id}` as Href} asChild>
        <Link.Trigger>
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 16,
              flexDirection: featured ? "row" : "column",
              alignItems: featured ? "center" : "flex-start",
              gap: 12,
            }}
          >
            <View
              style={{
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
                backgroundColor: collection.color + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={`sf:${collection.icon}`}
                style={{ width: iconSize, height: iconSize }}
                tintColor={collection.color}
              />
            </View>

            <View style={{ flex: featured ? 1 : undefined, gap: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={[textStyles.heading, { fontSize: featured ? 16 : 14 }]}
                  numberOfLines={1}
                >
                  {collection.name}
                </Text>
                {collection.isAiGenerated && (
                  <View
                    style={{
                      backgroundColor: colors.accentLight,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderCurve: "continuous",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: colors.accent,
                      }}
                    >
                      AI
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  textStyles.bodyLight,
                  { fontSize: 12, color: colors.textHint },
                ]}
              >
                {collection.wordCount}{" "}
                {collection.wordCount === 1 ? "parola" : "parole"}
              </Text>

              {/* Progress bar */}
              <View
                style={{
                  height: 4,
                  backgroundColor: colors.borderLight,
                  borderRadius: 2,
                  marginTop: 4,
                  width: featured ? "60%" : "100%",
                }}
              >
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.accent,
                    width: `${collection.masteryPercent}%`,
                  }}
                />
              </View>
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
