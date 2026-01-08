import { Stack } from 'expo-router';
import { brand } from '@/constants/Colors';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: brand.charcoal },
            }}
        >
            <Stack.Screen name="login" />
        </Stack>
    );
}
