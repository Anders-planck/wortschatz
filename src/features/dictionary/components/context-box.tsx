import { View, Text } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface ContextBoxProps {
  text: string;
}

function parseInline(
  line: string,
  colors: { textPrimary: string },
  fontFamily: string,
) {
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
        style={{ fontFamily, fontWeight: "600", color: colors.textPrimary }}
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

export function ContextBox({ text }: ContextBoxProps) {
  const { colors, textStyles } = useAppTheme();

  const lines = text.split("\n");

  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: 6,
        borderCurve: "continuous",
        padding: 14,
        gap: 4,
      }}
    >
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
        const content = isBullet ? trimmed.slice(2) : trimmed;

        return (
          <Text
            key={i}
            selectable
            style={[textStyles.bodyLight, isBullet && { paddingLeft: 8 }]}
          >
            {isBullet ? "  •  " : ""}
            {parseInline(content, colors, textStyles.body.fontFamily)}
          </Text>
        );
      })}
    </View>
  );
}
