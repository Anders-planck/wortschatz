import { Text, type TextProps } from "react-native";
import { textStyles } from "@/features/shared/theme/typography";

export function SectionTitle({ children, ...props }: TextProps) {
  return (
    <Text style={[textStyles.monoLabel, { marginBottom: 8 }]} {...props}>
      {children}
    </Text>
  );
}
