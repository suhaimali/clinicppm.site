import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';

export default function SplashScreen({ theme, onFinish }) {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onFinish());
        }, 2000);

        return () => clearTimeout(timer);
    }, [fadeAnim, onFinish]);

    if (fadeAnim.__getValue() === 0) return null;

    return (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, zIndex: 9999, alignItems: 'center', justifyContent: 'center', opacity: fadeAnim }]}>
            <View style={{ alignItems: 'center' }}>
                <Activity size={80} color={theme.primary} />
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text, marginTop: 20 }}>Suhaim Soft</Text>
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            </View>
        </Animated.View>
    );
}