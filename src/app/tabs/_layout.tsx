import React from 'react';
import { Tabs } from 'expo-router';
import { CustomBottomTabBar, TabName } from '@/components/common/CustomBottomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={({ state, navigation }) => {
        const routeName = state.routeNames[state.index];
        const routeToTabMap: Record<string, TabName> = {
          index: 'home',
          category: 'category',
          stores: 'stores',
          'order-again': 'orderAgain',
        };

        const activeTab: TabName = routeToTabMap[routeName] || 'home';

        const handleTabPress = (tab: TabName) => {
          const tabToRouteMap: Record<TabName, string> = {
            home: 'index',
            category: 'category',
            stores: 'stores',
            orderAgain: 'order-again',
          };
          navigation.navigate(tabToRouteMap[tab]);
        };

        return (
          <CustomBottomTabBar
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        );
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="category" options={{ title: 'Category' }} />
      <Tabs.Screen name="stores" options={{ title: 'Stores' }} />
      <Tabs.Screen name="order-again" options={{ title: 'Order Again' }} />
    </Tabs>
  );
}
