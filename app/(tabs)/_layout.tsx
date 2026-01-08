import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { brand } from '@/constants/Colors';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

/**
 * ImFine 탭 레이아웃
 * 
 * - 피드: 메인 SNS 피드
 * - 마이페이지: 프로필 및 설정
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brand.orange,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: brand.charcoal,
          borderTopColor: '#3D3D3D',
          borderTopWidth: 1,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: brand.charcoal,
          borderBottomColor: '#3D3D3D',
          borderBottomWidth: 1,
        },
        headerTintColor: brand.beige,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '피드',
          headerTitle: 'ImFine',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
