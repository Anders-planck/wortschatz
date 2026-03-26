import { useLocalSearchParams } from "expo-router";
import { ConjugationScreen } from "@/features/dictionary/components/conjugation-screen";

export default function ConjugationPage() {
  const { term } = useLocalSearchParams<{ term: string }>();
  return <ConjugationScreen term={term ?? ""} />;
}
