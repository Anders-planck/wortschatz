import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function AppTabs() {
  return (
    <NativeTabs
      disableTransparentOnScrollEdge={true}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="(search)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "magnifyingglass", selected: "magnifyingglass" }}
        />
        <NativeTabs.Trigger.Label>Cerca</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(vocabulary)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "list.bullet", selected: "list.bullet" }}
        />
        <NativeTabs.Trigger.Label>Parole</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(review)">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "arrow.counterclockwise",
            selected: "arrow.counterclockwise",
          }}
        />
        <NativeTabs.Trigger.Label>Ripasso</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
        />
        <NativeTabs.Trigger.Label>Impostazioni</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
