import React from 'react';
import { Stack } from 'expo-router';
import AdminRouteGuard from '@/src/components/AdminRouteGuard';

export default function AdminLayout() {
  return (
    <AdminRouteGuard>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="adminDashboard"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="roleManagement"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </AdminRouteGuard>
  );
}
