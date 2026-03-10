import React from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronRight, X } from 'lucide-react-native';

export function GenderSelector({ value, onChange, theme }) {
    const options = [
        { label: 'Male', val: 'M' },
        { label: 'Female', val: 'F' },
        { label: 'Other', val: 'O' }
    ];

    return (
        <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {options.map((opt) => {
                    const isActive = value === opt.val;
                    return (
                        <TouchableOpacity
                            key={opt.val}
                            onPress={() => onChange(opt.val)}
                            style={{
                                flex: 1,
                                backgroundColor: isActive ? theme.primary : theme.cardBg,
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: isActive ? theme.primary : theme.border
                            }}
                        >
                            <Text style={{ color: isActive ? 'white' : theme.text, fontWeight: 'bold' }}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export function CustomPicker({ visible, title, data, onSelect, onClose, theme, colored = false, maxHeight }) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight, paddingBottom: 30 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => (typeof item === 'string' ? item : item.value)}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => {
                            const label = typeof item === 'string' ? item : item.label;
                            const value = typeof item === 'string' ? item : item.value;
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect(value);
                                        onClose();
                                    }}
                                    style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                        {colored && item.icon && (
                                            <View style={{ backgroundColor: item.bg, width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                                <item.icon size={20} color={item.color} />
                                            </View>
                                        )}
                                        <Text style={{ fontSize: 16, color: colored ? item.color || theme.text : theme.text, fontWeight: colored ? 'bold' : 'normal' }}>{label}</Text>
                                    </View>
                                    <ChevronRight size={16} color={theme.textDim} />
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
}

export function InputGroup({ icon: Icon, label, value, onChange, theme, multiline, keyboardType, placeholder, styles }) {
    return (
        <View>
            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>{label}</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, height: multiline ? 100 : 55, alignItems: multiline ? 'flex-start' : 'center', paddingVertical: multiline ? 12 : 4 }]}>
                <Icon size={20} color={theme.textDim} style={{ marginTop: multiline ? 2 : 0 }} />
                <TextInput
                    style={[styles.textInput, { color: theme.text, textAlignVertical: multiline ? 'top' : 'center' }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder || label}
                    placeholderTextColor={theme.textDim}
                    multiline={multiline}
                    keyboardType={keyboardType || 'default'}
                    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
                />
            </View>
        </View>
    );
}
