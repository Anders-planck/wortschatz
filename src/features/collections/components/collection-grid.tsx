import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInUp } from "react-native-reanimated";

import type { CollectionWithStats } from "../types";
import { CollectionCard } from "./collection-card";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface CollectionGridProps {
  collections: CollectionWithStats[];
  onCreateNew: () => void;
  onReview: (id: number) => void;
  onRename: (id: number) => void;
  onDelete: (id: number) => void;
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
      entering={FadeInUp.delay(index * 40).duration(300)}
      style={{ flex: 1 }}
    >
      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: colors.border,
          borderRadius: 16,
          borderCurve: "continuous",
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          gap: 8,
        }}
      >
        <Image
          source="sf:plus"
          style={{ width: 24, height: 24 }}
          tintColor={colors.textMuted}
        />
        <Text
          style={[
            textStyles.bodyLight,
            { fontSize: 13, color: colors.textMuted },
          ]}
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
  onReview,
  onRename,
  onDelete,
}: CollectionGridProps) {
  const [featured, ...rest] = collections;

  // Build rows of 2 from the remaining collections
  const rows: Array<[CollectionWithStats, CollectionWithStats | undefined]> =
    [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push([rest[i], rest[i + 1]]);
  }

  // Determine if we need the "+" button and where it goes
  const needsCreateButton = true;
  const lastRow = rows[rows.length - 1];
  const lastRowHasSpace = lastRow && lastRow[1] === undefined;

  return (
    <View style={{ gap: 8 }}>
      {/* Featured card (first collection, full width) */}
      {featured && (
        <CollectionCard
          collection={featured}
          featured
          index={0}
          onReview={onReview}
          onRename={onRename}
          onDelete={onDelete}
        />
      )}

      {/* Grid rows */}
      {rows.map((row, rowIndex) => {
        const isLastRow = rowIndex === rows.length - 1;
        const baseIndex = rowIndex * 2 + 1;

        return (
          <View key={row[0].id} style={{ flexDirection: "row", gap: 8 }}>
            <CollectionCard
              collection={row[0]}
              index={baseIndex}
              onReview={onReview}
              onRename={onRename}
              onDelete={onDelete}
            />
            {row[1] ? (
              <CollectionCard
                collection={row[1]}
                index={baseIndex + 1}
                onReview={onReview}
                onRename={onRename}
                onDelete={onDelete}
              />
            ) : needsCreateButton && isLastRow ? (
              <CreateNewButton onPress={onCreateNew} index={baseIndex + 1} />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        );
      })}

      {/* If last row is full or no rows at all, add "+" as its own row */}
      {needsCreateButton && !lastRowHasSpace && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <CreateNewButton onPress={onCreateNew} index={rest.length + 1} />
          <View style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
});
