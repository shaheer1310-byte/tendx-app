import { Tabs } from "expo-router";
import { Home, ListFilter, FileText, Settings } from "lucide-react-native";
import { colors } from "../../lib/theme";

/** Bottom tab bar (Build Spec section 6.9). */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal2,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tenders"
        options={{
          title: "Tenders",
          tabBarIcon: ({ color, size }) => (
            <ListFilter color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bids"
        options={{
          title: "Bids",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
