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

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  const { colors, textStyles } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={{
        alignItems: "center",
        paddingTop: 48,
        paddingBottom: 40,
        gap: 16,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.accentLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source="sf:folder.fill"
          style={{ width: 28, height: 28 }}
          tintColor={colors.accent}
        />
      </View>
      <View style={{ alignItems: "center", gap: 4 }}>
        <Text style={[textStyles.heading, { fontSize: 17 }]}>
          Nessuna collezione
        </Text>
        <Text
          style={[
            textStyles.body,
            {
              fontSize: 13,
              color: colors.textMuted,
              textAlign: "center",
              paddingHorizontal: 40,
            },
          ]}
        >
          Crea liste tematiche per organizzare il tuo vocabolario
        </Text>
      </View>
      <Pressable
        onPress={onCreateNew}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.accent,
          borderRadius: 12,
          borderCurve: "continuous",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Image
          source="sf:plus"
          style={{ width: 16, height: 16 }}
          tintColor={colors.bg}
        />
        <Text
          style={{
            fontFamily: textStyles.heading.fontFamily,
            fontSize: 15,
            fontWeight: "600",
            color: colors.bg,
          }}
        >
          Crea la prima lista
        </Text>
      </Pressable>
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
  const { colors } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40).duration(300)}
      style={{ flex: 1 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: pressed ? colors.accent : colors.border,
          borderRadius: 16,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 100,
          gap: 6,
        })}
      >
        <Image
          source="sf:plus"
          style={{ width: 20, height: 20 }}
          tintColor={colors.textMuted}
        />
        <Text
          style={{
            fontFamily: "Ubuntu Sans Mono",
            fontSize: 10,
            color: colors.textMuted,
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
  onReview,
  onRename,
  onDelete,
}: CollectionGridProps) {
  if (collections.length === 0) {
    return <EmptyState onCreateNew={onCreateNew} />;
  }

  const [featured, ...rest] = collections;

  const rows: Array<[CollectionWithStats, CollectionWithStats | undefined]> =
    [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push([rest[i], rest[i + 1]]);
  }

  const lastRow = rows[rows.length - 1];
  const lastRowHasSpace = lastRow && lastRow[1] === undefined;

  return (
    <View style={{ gap: 8 }}>
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
            ) : isLastRow ? (
              <CreateNewButton onPress={onCreateNew} index={baseIndex + 1} />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        );
      })}

      {!lastRowHasSpace && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <CreateNewButton onPress={onCreateNew} index={rest.length + 1} />
          <View style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
});
