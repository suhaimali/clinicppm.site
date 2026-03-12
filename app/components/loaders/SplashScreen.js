import { Activity } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ theme, onFinish }) {
    const onFinishRef = useRef(onFinish);
    onFinishRef.current = onFinish;

    useEffect(() => {
        const timer = setTimeout(() => {
            if (typeof onFinishRef.current === 'function') {
                onFinishRef.current();
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, zIndex: 9999, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ alignItems: 'center', paddingHorizontal: 28 }}>
                <View style={{ width: 110, height: 110, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mode === 'dark' ? 'rgba(45,212,191,0.12)' : '#ccfbf1', borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(45,212,191,0.22)' : '#99f6e4' }}>
                    <Activity size={54} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 30, fontWeight: '800', color: theme.text, marginTop: 22 }}>Suhaim Soft</Text>
                <Text style={{ fontSize: 15, color: theme.textDim, marginTop: 10, textAlign: 'center' }}>Please wait, Suhaim Soft is loading.</Text>
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 28 }} />
            </View>
        </View>
    );
}