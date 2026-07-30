import { View } from "react-native";
import { PrerequisiteState } from "@/features/shared/components/prerequisite-state";
import { useAppTheme } from "@/features/shared/theme/use-app-theme";

interface SessionEmptyProps {
  onBrowse: () => void;
}

export function SessionEmpty({ onBrowse }: SessionEmptyProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: colors.bg,
        paddingHorizontal: 24,
      }}
    >
      <PrerequisiteState
        icon="magnifyingglass"
        title="Nessuna parola da ripassare"
        description="Aggiungi qualche parola al vocabolario per iniziare una sessione di ripasso."
        primaryLabel="Cerca parole"
        onPrimaryPress={onBrowse}
      />
    </View>
  );
}
