import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, ArrowLeft, Cake, Calendar, Check, CheckCircle2, ChevronDown, Clock, Droplet, MessageCircle, Pencil, Phone, Plus, Search, Trash2, User, X, Mail } from 'lucide-react-native';
import { BLOOD_GROUPS, INITIAL_FORM_STATE } from '../../constants/medical';
import { CustomPicker, GenderSelector, InputGroup } from '../../components/commons/FormControls';
import { calculateAge } from '../../utils/patient.js';

export default function AppointmentScreen({ theme, onBack, form, setForm, appointments, setAppointments, patients, setPatients, onSelectPatient, onEditAppointment, viewMode, setViewMode, showToast, styles }) {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [pickerType, setPickerType] = useState(null);
    const [pickerMode, setPickerMode] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [patientSearch, setPatientSearch] = useState('');
    const isEditorView = viewMode === 'new';

    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'pending', label: 'Pending' },
        { id: 'lastWeek', label: 'Last Week' }
    ];

    const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const resetForm = () => {
        setForm(INITIAL_FORM_STATE);
        setPatientSearch('');
    };

    const handleQuickSave = () => {
        if (!form.name || !form.mobile) {
            Alert.alert('Missing Info', 'Patient Name and Mobile are required.');
            return;
        }

        const finalBlood = form.blood === 'Custom' ? form.customBlood : form.blood;
        const appointmentData = {
            name: form.name,
            mobile: form.mobile,
            email: form.email,
            time: formatTime(form.timeObj),
            date: formatDate(form.dateObj),
            notes: form.notes || 'Regular Visit',
            blood: finalBlood
        };

        const newAppt = { id: Date.now(), ...appointmentData, status: 'upcoming' };
        let newAppointments = [newAppt, ...appointments];

        if (form.isFollowUp) {
            const followUpAppt = {
                id: Date.now() + 1,
                name: form.name,
                mobile: form.mobile,
                email: form.email,
                time: '09:00 AM',
                date: formatDate(form.followUpObj),
                notes: 'Follow-up Visit',
                status: 'pending'
            };
            newAppointments = [...newAppointments, followUpAppt];
            showToast('Success', 'Appointment & Follow-up Created!', 'success');
        } else {
            showToast('Success', 'Appointment Booked Successfully!', 'success');
        }
        setAppointments(newAppointments);
        setActiveTab('upcoming');

        const patientExists = patients.find((item) => item.mobile === form.mobile);
        if (!patientExists) {
            const newPatient = {
                id: Date.now() + 50,
                name: form.name,
                mobile: form.mobile,
                email: form.email || '',
                age: form.age || 'N/A',
                dob: form.dob || '',
                gender: form.gender || 'M',
                blood: finalBlood,
                address: form.address || '',
                registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                vitalsHistory: [],
                rxHistory: []
            };
            setPatients((prev) => [newPatient, ...prev]);
        }

        resetForm();
        setViewMode('list');
    };

    const handleCall = (mobile) => Linking.openURL(`tel:${mobile}`);
    const handleWhatsApp = (mobile) => Linking.openURL(`whatsapp://send?phone=${mobile}&text=Hello, this is regarding your appointment.`);
    const handleComplete = (id) => {
        showToast('Completed', 'Appointment marked as done.', 'success');
        setAppointments(appointments.filter((item) => item.id !== id));
    };
    const handlePending = (id) => {
        const updated = appointments.map((item) => (item.id === id ? { ...item, status: 'pending' } : item));
        setAppointments(updated);
        showToast('Moved', 'Appointment moved to Pending.', 'info');
    };

    const openDatePicker = (mode, currentVal) => {
        setPickerMode(mode);
        const validDate = currentVal instanceof Date ? currentVal : new Date();
        setTempDate(validDate);
        setShowDatePicker(true);
    };

    const onDateChange = (_event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setTempDate(selectedDate);
            if (Platform.OS === 'android') saveDateSelection(selectedDate);
        }
    };

    const saveDateSelection = (dateToSave) => {
        const date = dateToSave || tempDate;
        if (pickerMode === 'date') setForm((prev) => ({ ...prev, dateObj: date, date: formatDate(date) }));
        else if (pickerMode === 'time') setForm((prev) => ({ ...prev, timeObj: date, time: formatTime(date) }));
        else if (pickerMode === 'followup') setForm((prev) => ({ ...prev, followUpObj: date, followUpDate: formatDate(date) }));
        else if (pickerMode === 'dob') {
            const age = calculateAge(date);
            setForm((prev) => ({ ...prev, dobObj: date, dob: date.toISOString().split('T')[0], age }));
        }
        setShowDatePicker(false);
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Appointment', 'Remove this booking?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setAppointments(appointments.filter((item) => item.id !== id));
                    showToast('Deleted', 'Appointment removed.', 'error');
                }
            }
        ]);
    };

    const handleEdit = (item) => {
        if (onEditAppointment) {
            onEditAppointment(item);
        }
    };

    const getPatientMatches = () => {
        if (!patientSearch) return [];
        return patients.filter((item) => item.name.toLowerCase().includes(patientSearch.toLowerCase()) || item.mobile.includes(patientSearch) || item.id.toString().includes(patientSearch));
    };

    const fillPatientData = (patient) => {
        setForm((prev) => ({
            ...prev,
            name: patient.name,
            mobile: patient.mobile,
            email: patient.email || '',
            age: patient.age,
            dob: patient.dob || '',
            gender: patient.gender,
            blood: patient.blood,
            address: patient.address || ''
        }));
        setPatientSearch('');
        Keyboard.dismiss();
    };

    const renderList = () => {
        let filteredData = appointments.filter((item) => item.status === activeTab);
        if (searchQuery) {
            filteredData = filteredData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.mobile.includes(searchQuery));
        }

        return (
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search Name / Mobile..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                </View>
                <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 }}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: isActive ? theme.primary : theme.inputBg, borderWidth: 1, borderColor: isActive ? theme.primary : theme.border, alignItems: 'center' }}>
                                <Text style={{ fontWeight: '700', color: isActive ? 'white' : theme.textDim, fontSize: 13 }}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {filteredData.length > 0 ? filteredData.map((item) => (
                        <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectPatient(item)} key={item.id} style={{ backgroundColor: theme.cardBg, borderRadius: 18, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.05, shadowRadius: 5, elevation: 3 }}>
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingVertical: 10, width: 65, height: 70 }}>
                                    <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>{item.time.split(' ')[0]}</Text>
                                    <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '600', textTransform: 'uppercase' }}>{item.time.split(' ')[1]}</Text>
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16, marginBottom: 4 }}>{item.name} <Text style={{ fontSize: 12, color: theme.textDim }}>(#{item.id})</Text></Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity onPress={() => handleEdit(item)}><Pencil size={18} color={theme.textDim} /></TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                                            {activeTab === 'upcoming' && <><TouchableOpacity onPress={() => handlePending(item.id)}><Clock size={18} color="#f59e0b" /></TouchableOpacity><TouchableOpacity onPress={() => handleComplete(item.id)}><CheckCircle2 size={18} color="#10b981" /></TouchableOpacity></>}
                                            {activeTab === 'pending' && <TouchableOpacity onPress={() => handleComplete(item.id)}><CheckCircle2 size={18} color="#10b981" /></TouchableOpacity>}
                                        </View>
                                    </View>
                                    <Text style={{ color: theme.textDim, fontSize: 13 }} numberOfLines={1}>{item.notes}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                                        <Calendar size={12} color={theme.textDim} />
                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>{item.date}</Text>
                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>• {item.mobile}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={() => handleCall(item.mobile)} style={{ flex: 1, backgroundColor: theme.inputBg, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}><Phone size={14} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Call</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleWhatsApp(item.mobile)} style={{ flex: 1, backgroundColor: theme.inputBg, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}><MessageCircle size={14} color={theme.text} /><Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>WhatsApp</Text></TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><AlertCircle size={40} color={theme.textDim} /></View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textDim }}>No Appointments</Text>
                            <Text style={{ color: theme.textDim, fontSize: 14 }}>Try searching or add new.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderNewPatient = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            <>
                <View style={{ marginBottom: 25 }}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600', fontSize: 12 }}>EASY BOOK (AUTO-FILL)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={18} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 15 }} placeholder="Search Name, Mobile or ID..." placeholderTextColor={theme.textDim} value={patientSearch} onChangeText={setPatientSearch} />
                        {patientSearch.length > 0 && <TouchableOpacity onPress={() => setPatientSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                    {patientSearch.length > 0 && (
                        <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginTop: 5, borderRadius: 12, overflow: 'hidden' }}>
                            {getPatientMatches().map((patient) => (
                                <TouchableOpacity key={patient.id} onPress={() => fillPatientData(patient)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{patient.name} <Text style={{ fontSize: 10, color: theme.textDim }}>(#{patient.id})</Text></Text>
                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>{patient.mobile}</Text>
                                    </View>
                                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, color: theme.text }}>Select</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {getPatientMatches().length === 0 && <View style={{ padding: 15 }}><Text style={{ color: theme.textDim, fontSize: 12 }}>No existing patient found. Fill details below.</Text></View>}
                        </View>
                    )}
                </View>
            </>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 4, height: 20, backgroundColor: theme.primary, borderRadius: 2, marginRight: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Enter patient information</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, marginBottom: 15, textTransform: 'uppercase' }}>Basic Information</Text>

            <View style={{ gap: 15, marginBottom: 30 }}>
                <InputGroup icon={User} label="Patient Name *" value={form.name} onChange={(t) => setForm({ ...form, name: t })} theme={theme} styles={styles} />
                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={form.mobile} onChange={(t) => setForm({ ...form, mobile: t })} theme={theme} styles={styles} />
                <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={form.email} onChange={(t) => setForm({ ...form, email: t })} theme={theme} placeholder="patient@email.com" styles={styles} />

                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => openDatePicker('dob', form.dobObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Cake size={20} color={theme.textDim} />
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.dob || 'Select'}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={form.age} onChange={(t) => setForm({ ...form, age: t })} theme={theme} styles={styles} /></View>
                </View>

                <GenderSelector value={form.gender} onChange={(val) => setForm({ ...form, gender: val })} theme={theme} />

                <View style={{ marginTop: 5 }}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                    <TouchableOpacity onPress={() => setPickerType('blood')} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Droplet size={20} color={theme.textDim} />
                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.blood}</Text>
                        </View>
                        <ChevronDown size={16} color={theme.textDim} />
                    </TouchableOpacity>
                </View>
                {form.blood === 'Custom' && (
                    <View>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Enter Blood Group</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                            <Droplet size={20} color={theme.primary} />
                            <TextInput style={[styles.textInput, { color: theme.text }]} value={form.customBlood} onChangeText={(t) => setForm({ ...form, customBlood: t })} placeholder="Type blood group here..." placeholderTextColor={theme.textDim} />
                        </View>
                    </View>
                )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 4, height: 20, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Appointment Details</Text>
            </View>

            <View style={{ gap: 15, marginBottom: 40 }}>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date</Text>
                        <TouchableOpacity onPress={() => openDatePicker('date', form.dateObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}><Calendar size={20} color={theme.textDim} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.date}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Time</Text>
                        <TouchableOpacity onPress={() => openDatePicker('time', form.timeObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}><Clock size={20} color={theme.textDim} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.time}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                </View>

                {(
                    <View style={{ backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                        <View><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Follow Up Required?</Text><Text style={{ color: theme.textDim, fontSize: 12 }}>Auto-create next visit record</Text></View>
                        <Switch value={form.isFollowUp} onValueChange={(v) => setForm({ ...form, isFollowUp: v })} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor="white" />
                    </View>
                )}

                {form.isFollowUp && (
                    <View>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Next Visit Date</Text>
                        <TouchableOpacity onPress={() => openDatePicker('followup', form.followUpObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.primary, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}><Calendar size={20} color={theme.primary} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.followUpDate}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                )}

                <View>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Booking Notes</Text>
                    <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 15, minHeight: 120 }}>
                        <TextInput style={{ color: theme.text, fontSize: 16, width: '100%', textAlignVertical: 'top', flex: 1 }} value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} placeholder="Type complaints, visit reason, or doctor's notes here..." placeholderTextColor={theme.textDim} multiline />
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <CustomPicker visible={pickerType === 'blood'} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerType(null)} onSelect={(val) => setForm({ ...form, blood: val })} theme={theme} />
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide" visible={showDatePicker}>
                        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                            <View style={{ backgroundColor: theme.cardBg, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={{ color: theme.textDim, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Select {pickerMode === 'time' ? 'Time' : pickerMode === 'dob' ? 'DOB' : 'Date'}</Text>
                                    <TouchableOpacity onPress={() => saveDateSelection(tempDate)}><Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>Confirm</Text></TouchableOpacity>
                                </View>
                                <DateTimePicker testID="dateTimePicker" value={tempDate} mode={pickerMode === 'time' ? 'time' : 'date'} is24Hour={false} display="spinner" onChange={onDateChange} themeVariant={theme.mode} textColor={theme.text} />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker testID="dateTimePicker" value={tempDate} mode={pickerMode === 'time' ? 'time' : 'date'} is24Hour={false} display="default" onChange={onDateChange} themeVariant={theme.mode} />
                )
            )}
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                {viewMode === 'list' ? (
                    <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <X size={24} color={theme.text} />
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: theme.text }]}>{viewMode === 'list' ? 'Appointments' : 'New Booking'}</Text>
                {viewMode === 'list' ? (
                    <TouchableOpacity onPress={() => setViewMode('new')} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleQuickSave} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                        <Check size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {viewMode === 'list' && renderList()}
                {isEditorView && renderNewPatient()}
            </KeyboardAvoidingView>
        </View>
    );
}
