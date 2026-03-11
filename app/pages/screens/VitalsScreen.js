import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, AlertCircle, ArrowLeft, Droplet, HeartPulse, Thermometer, Weight } from 'lucide-react-native';

export default function VitalsScreen({ theme, onBack, patient, onSaveVitals, showToast, styles }) {
    const insets = useSafeAreaInsets();
    const [form, setForm] = useState({
        sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C'
    });

    useEffect(() => {
        if (patient?.vitalsHistory && patient.vitalsHistory.length > 0) {
            const latest = patient.vitalsHistory[0];
            setForm({
                sys: latest.sys || '',
                dia: latest.dia || '',
                pulse: latest.pulse || '',
                spo2: latest.spo2 || '',
                weight: latest.weight || '',
                temp: latest.temp || '',
                tempUnit: latest.tempUnit || 'C'
            });
        }
    }, [patient]);

    const handleSave = () => {
        if (!form.sys && !form.weight && !form.temp) {
            Alert.alert('Empty Input', 'Please enter at least one vital sign.');
            return;
        }

        if (!patient?.id) {
            Alert.alert('Patient Missing', 'The selected patient record is unavailable. Please reopen vitals from the patient list.');
            return;
        }

        const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...form
        };

        const updatedHistory = [newEntry, ...(patient.vitalsHistory || [])];
        onSaveVitals(patient.id, updatedHistory);
        showToast('Success', 'Current Vitals Updated', 'success');
    };

    const MedicalInput = ({ icon: Icon, label, value, onChange, unit, placeholder, color, width = '48%' }) => (
        <View style={{ width, marginBottom: 15 }}>
            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg,
                borderRadius: 12, height: 55,
                borderWidth: 1.5, borderColor: value ? color : theme.border,
                paddingHorizontal: 12,
                shadowColor: value ? color : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: value ? 0.15 : 0.05, shadowRadius: 3, elevation: value ? 3 : 1
            }}>
                <Icon size={20} color={value ? color : theme.textDim} strokeWidth={2.5} />
                <TextInput
                    style={{ flex: 1, marginLeft: 10, color: theme.text, fontWeight: '700', fontSize: 18 }}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textDim}
                    keyboardType="numeric"
                />
                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: 'bold' }}>{unit}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingHorizontal: 15 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Patient Vitals</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '500' }}>Patient: {patient?.name}</Text>
                </View>
                <TouchableOpacity onPress={handleSave} style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 5 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Update</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {!patient && (
                    <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5', marginBottom: 25, flexDirection: 'row', gap: 10 }}>
                        <AlertCircle size={20} color="#c2410c" />
                        <Text style={{ color: '#9a3412', fontSize: 13, flex: 1, lineHeight: 20 }}>
                            The selected patient record is unavailable. Go back to the patient list and reopen vitals.
                        </Text>
                    </View>
                )}
                <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5', marginBottom: 25, flexDirection: 'row', gap: 10 }}>
                    <AlertCircle size={20} color="#c2410c" />
                    <Text style={{ color: '#9a3412', fontSize: 13, flex: 1, lineHeight: 20 }}>
                        <Text style={{ fontWeight: 'bold' }}>Note:</Text> Updating vitals here will update the patient&apos;s current record.
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Activity size={20} color={theme.primary} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Current Readings</Text>
                    </View>
                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '600' }}>{new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                <View style={{ backgroundColor: theme.inputBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <MedicalInput icon={Activity} label="Systolic (High)" value={form.sys} onChange={(t) => setForm({ ...form, sys: t })} unit="mmHg" placeholder="120" color="#ef4444" />
                        <MedicalInput icon={Activity} label="Diastolic (Low)" value={form.dia} onChange={(t) => setForm({ ...form, dia: t })} unit="mmHg" placeholder="80" color="#ef4444" />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <MedicalInput icon={HeartPulse} label="Pulse Rate" value={form.pulse} onChange={(t) => setForm({ ...form, pulse: t })} unit="BPM" placeholder="72" color="#8b5cf6" />
                        <MedicalInput icon={Droplet} label="SpO2 Level" value={form.spo2} onChange={(t) => setForm({ ...form, spo2: t })} unit="%" placeholder="98" color="#0ea5e9" />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <MedicalInput icon={Weight} label="Weight" value={form.weight} onChange={(t) => setForm({ ...form, weight: t })} unit="kg" placeholder="65" color="#10b981" />
                        <View style={{ width: '48%', marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '700', textTransform: 'uppercase' }}>Temp</Text>
                                <TouchableOpacity onPress={() => setForm({ ...form, tempUnit: form.tempUnit === 'C' ? 'F' : 'C' })}>
                                    <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}>Scale: °{form.tempUnit}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg,
                                borderRadius: 12, height: 55,
                                borderWidth: 1.5, borderColor: form.temp ? '#f59e0b' : theme.border,
                                paddingHorizontal: 12,
                                shadowColor: form.temp ? '#f59e0b' : '#000', shadowOpacity: form.temp ? 0.15 : 0.05, elevation: 2
                            }}>
                                <Thermometer size={20} color={form.temp ? '#f59e0b' : theme.textDim} strokeWidth={2.5} />
                                <TextInput style={{ flex: 1, marginLeft: 10, color: theme.text, fontWeight: '700', fontSize: 18 }} value={form.temp} onChangeText={(t) => setForm({ ...form, temp: t })} placeholder="36.6" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: 'bold' }}>°{form.tempUnit}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ marginTop: 40, alignItems: 'center', opacity: 0.3 }}>
                    <Activity size={80} color={theme.textDim} />
                    <Text style={{ marginTop: 15, color: theme.textDim, fontSize: 14 }}>Enter latest clinical data above</Text>
                </View>
            </ScrollView>
        </View>
    );
}
