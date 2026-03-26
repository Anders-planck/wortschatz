import { useLocalSearchParams } from "expo-router";
import { DeclensionScreen } from "@/features/dictionary/components/declension-screen";

export default function DeclensionPage() {
  const { term } = useLocalSearchParams<{ term: string }>();
  return <DeclensionScreen term={term ?? ""} />;
}
