import { Text, type TextProps } from "react-native";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

export function SectionTitle({ children, ...props }: TextProps) {
  const { textStyles } = useAppTheme();

  return (
    <Text style={[textStyles.monoLabel, { marginBottom: 8 }]} {...props}>
      {children}
    </Text>
  );
}
