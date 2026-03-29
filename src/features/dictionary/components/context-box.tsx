import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ContextBoxProps {
  text: string;
}

function parseInline(line: string, boldColor: string, fontFamily: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    parts.push(
      <Text
        key={match.index}
        style={{ fontFamily, fontWeight: "600", color: boldColor }}
      >
        {match[1]}
      </Text>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [line];
}

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.endsWith(":") &&
    !trimmed.startsWith("-") &&
    !trimmed.startsWith("*") &&
    trimmed.length < 40
  );
}

export function ContextBox({ text }: ContextBoxProps) {
  const { colors, textStyles } = useAppTheme();

  const lines = text.split("\n");

  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 10,
        borderCurve: "continuous",
        padding: 16,
        gap: 2,
        alignSelf: "stretch",
      }}
    >
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={i} style={{ height: 8 }} />;
        }

        const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
        const heading = isHeading(trimmed);
        const content = isBullet ? trimmed.slice(2) : trimmed;

        if (heading) {
          return (
            <Text
              key={i}
              style={[
                textStyles.heading,
                {
                  fontSize: 13,
                  color: colors.textPrimary,
                  marginTop: i > 0 ? 6 : 0,
                },
              ]}
            >
              {content}
            </Text>
          );
        }

        return (
          <Text
            key={i}
            selectable
            style={[
              textStyles.body,
              {
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "left",
                lineHeight: 20,
              },
              isBullet && { paddingLeft: 8 },
            ]}
          >
            {isBullet ? "•  " : ""}
            {parseInline(
              content,
              colors.textPrimary,
              textStyles.body.fontFamily,
            )}
          </Text>
        );
      })}
    </View>
  );
}
