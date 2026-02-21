import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
// IMPORTANT: Install this: npx expo install @react-native-community/datetimepicker
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    Activity,
    AlertCircle,
    Archive,
    ArrowLeft,
    BookOpen,
    Cake,
    Calendar,
    CalendarPlus,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clipboard,
    Clock,
    Copy,
    Download,
    Droplet,
    Eye, EyeOff,
    FilePlus,
    FileText,
    Filter,
    FlaskConical,
    HeartPulse,
    History,
    Home,
    Layers,
    LayoutGrid,
    List,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Menu,
    MessageCircle,
    MinusCircle,
    Moon,
    Package,
    Pencil,
    Phone,
    Pill,
    Plus,
    PlusCircle,
    Save,
    Search,
    Settings,
    Share2,
    Sparkles,
    Stethoscope,
    Sun,
    Syringe,
    Tag,
    TestTube,
    Thermometer,
    Trash2,
    User,
    UserPlus,
    Weight,
    X
} from 'lucide-react-native';

// --- THEME CONFIGURATION ---
const THEMES = {
  dark: {
    mode: 'dark',
    bg: '#0f172a', cardBg: '#1e293b', primary: '#2dd4bf', primaryDark: '#115e59', 
    text: '#f1f5f9', textDim: '#94a3b8', border: 'rgba(255,255,255,0.1)', inputBg: 'rgba(255,255,255,0.05)',
    blurTint: 'dark', navBg: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)',
    glowTop: 'rgba(45, 212, 191, 0.15)', glowBottom: 'rgba(16, 185, 129, 0.1)',
    success: '#10b981', warning: '#f59e0b', danger: '#ef4444'
  },
  light: {
    mode: 'light',
    bg: '#f0f4f8', cardBg: '#ffffff', primary: '#0d9488', primaryDark: '#115e59', 
    text: '#0f172a', textDim: '#64748b', border: '#e2e8f0', inputBg: '#f8fafc',     
    blurTint: 'light', navBg: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
    glowTop: 'rgba(13, 148, 136, 0.08)', glowBottom: 'rgba(16, 185, 129, 0.05)',
    success: '#10b981', warning: '#f59e0b', danger: '#ef4444'
  }
};

const { width, height } = Dimensions.get('window');

// --- CONSTANTS ---
const INITIAL_FORM_STATE = { 
    name: '', mobile: '', email: '', age: '', gender: 'M', address: '', 
    blood: 'O+', customBlood: '', 
    date: 'Today', time: '09:00 AM', notes: '',
    isFollowUp: false, followUpDate: 'Next Week',
    dateObj: new Date(), timeObj: new Date(), followUpObj: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    dob: '', dobObj: new Date()
};

const INITIAL_APPOINTMENTS = [
    { id: 101, name: "Sarah Jenkins", mobile: "9876543210", email: "sarah.j@example.com", time: "10:00 AM", date: "Feb 16", notes: "General Checkup", status: "upcoming", blood: "A+" },
    { id: 102, name: "Mike Ross", mobile: "9988776655", email: "mike.ross@law.com", time: "11:30 AM", date: "Feb 16", notes: "Dental Cleaning", status: "upcoming", blood: "O-" },
    { id: 103, name: "Harvey Specter", mobile: "9123456789", email: "harvey@specter.com", time: "02:00 PM", date: "Feb 17", notes: "Consultation", status: "pending", blood: "AB+" },
    { id: 104, name: "Jessica Pearson", mobile: "9123456000", email: "jessica@firm.com", time: "09:00 AM", date: "Feb 10", notes: "Annual Review", status: "lastWeek", blood: "A-" },
];

const INITIAL_PATIENTS = [
    { id: 101, name: "Sarah Jenkins", mobile: "9876543210", email: "sarah.j@example.com", age: "28", dob: "1996-01-10", gender: "F", blood: "A+", address: "New York, NY", registeredDate: "Jan 10, 2024", vitalsHistory: [] },
    { id: 102, name: "Mike Ross", mobile: "9988776655", email: "mike.ross@law.com", age: "35", dob: "1989-02-01", gender: "M", blood: "O-", address: "Brooklyn, NY", registeredDate: "Feb 01, 2024", vitalsHistory: [] },
    { id: 822, name: "Suhaim", mobile: "8891479505", email: "suhaim@example.com", age: "18", dob: "2006-05-15", gender: "M", blood: "O+", address: "Pathappiriyam", registeredDate: "Feb 19, 2026", vitalsHistory: [] },
];

const INITIAL_TEMPLATES = [
    { 
        id: 1, 
        name: "Viral Fever Protocol", 
        diagnosis: "Viral Pyrexia", 
        advice: "Drink plenty of fluids (3L/day). Complete bed rest.",
        medicines: [
            { id: 1, name: "Paracetamol", dosage: "500mg", freq: "1-1-1", duration: "3 Days", instruction: "After Food", type: "Tablet" },
            { id: 2, name: "Vitamin C", dosage: "500mg", freq: "1-0-0", duration: "5 Days", instruction: "After Food", type: "Tablet" }
        ] 
    },
    { 
        id: 2, 
        name: "General Pain", 
        diagnosis: "Myalgia / Body Pain", 
        advice: "Apply hot pack on affected area. Avoid heavy lifting.",
        medicines: [
            { id: 3, name: "Ibuprofen", dosage: "400mg", freq: "1-0-1", duration: "3 Days", instruction: "After Food", type: "Tablet" }
        ] 
    },
];

const MEDICINE_CATEGORIES = [
    { label: 'Tablet', value: 'Tablet', color: '#3b82f6', bg: '#eff6ff', icon: Pill },
    { label: 'Capsule', value: 'Capsule', color: '#8b5cf6', bg: '#f5f3ff', icon: Pill },
    { label: 'Syrup', value: 'Syrup', color: '#ec4899', bg: '#fdf2f8', icon: FlaskConical },
    { label: 'Injection', value: 'Injection', color: '#ef4444', bg: '#fef2f2', icon: Syringe },
    { label: 'Cream', value: 'Cream', color: '#f59e0b', bg: '#fffbeb', icon: Droplet },
    { label: 'Drops', value: 'Drops', color: '#06b6d4', bg: '#ecfeff', icon: Droplet },
    { label: 'Other', value: 'Other', color: '#64748b', bg: '#f1f5f9', icon: Package },
];

const INITIAL_MEDICINES = [
    { id: 1, name: "CEFGLOBE- S FORTE 1.5 G", type: "Injection", content: "Cefoperazone 1G + Sulbactam 0.5G" },
    { id: 2, name: "Paracetamol", type: "Tablet", content: "500mg" },
    { id: 3, name: "Amoxicillin", type: "Capsule", content: "250mg" },
    { id: 4, name: "Ibuprofen", type: "Syrup", content: "100mg/5ml" },
    { id: 5, name: "Insulin", type: "Injection", content: "100IU" },
];

const FEATURES = [
  { id: 1, title: "Dashboard", subtitle: "Overview & Stats", icon: Home, color: ['#3b82f6', '#2563eb'], action: 'dashboard' },
  { id: 2, title: "Book Appointment", subtitle: "Schedule visits", icon: Calendar, color: ['#f59e0b', '#d97706'], action: 'appointment' },
  { id: 3, title: "Medicine Inventory", subtitle: "Pharmacy & Stock", icon: Activity, color: ['#ef4444', '#dc2626'], action: 'medicines' },
  { id: 4, title: "Patients History", subtitle: "Medical Records", icon: Clock, color: ['#8b5cf6', '#7c3aed'], action: 'history' },
  { id: 5, title: "Templates", subtitle: "Prescription formats", icon: Copy, color: ['#10b981', '#059669'], action: 'templates' },
  { id: 6, title: "Patient List", subtitle: "Manage Patients", icon: List, color: ['#06b6d4', '#0891b2'], action: 'patients' },
  { id: 7, title: "Lab Reports", subtitle: "Test Results", icon: BookOpen, color: ['#ec4899', '#db2777'], action: 'reports' },
  { id: 8, title: "Procedures", subtitle: "Medical Procedures", icon: Settings, color: ['#6366f1', '#4f46e5'], action: 'procedures' },
];

const BLOOD_GROUPS = [
    { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
    { label: 'Custom / Other', value: 'Custom' },
];

const FREQUENCIES = ["1-0-1", "1-0-0", "0-0-1", "1-1-1", "0-1-0", "SOS", "Once a week"];
const DURATIONS = ["3 Days", "5 Days", "7 Days", "10 Days", "15 Days", "1 Month", "Continue"];
const INSTRUCTIONS = ["After Food", "Before Food", "With Food", "At Night", "Empty Stomach"];

const calculateAge = (date) => {
    const diff_ms = Date.now() - date.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970).toString();
};

const FeatureCard = ({ item, index, theme, onAction, fullWidth = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const IconComponent = item.icon;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 50, useNativeDriver: true }).start(); }, []);
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.cardContainer, fullWidth ? { width: '100%' } : { width: '48%' }, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut} onPress={() => onAction(item.action)} style={[styles.cardInner, { backgroundColor: theme.cardBg, borderColor: theme.border, height: fullWidth ? 90 : 130, flexDirection: fullWidth ? 'row' : 'column', alignItems: fullWidth ? 'center' : 'flex-start', gap: fullWidth ? 15 : 0 }]}>
        <LinearGradient colors={item.color} style={styles.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <IconComponent color="#FFF" size={24} strokeWidth={2.5} />
        </LinearGradient>
        <View style={fullWidth ? { flex: 1 } : styles.cardTextContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textDim }]} numberOfLines={2}>{item.subtitle}</Text>
        </View>
        {fullWidth && <ChevronRight color={theme.textDim} size={20} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const CustomPicker = ({ visible, title, data, onSelect, onClose, theme, colored = false }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: height * 0.7, paddingBottom: 30 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color={theme.textDim} /></TouchableOpacity>
                    </View>
                    <FlatList 
                        data={data}
                        keyExtractor={(item) => typeof item === 'string' ? item : item.value}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => {
                            const label = typeof item === 'string' ? item : item.label;
                            const value = typeof item === 'string' ? item : item.value;
                            return (
                            <TouchableOpacity onPress={() => { onSelect(value); onClose(); }} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                    {colored && item.icon && (
                                        <View style={{ backgroundColor: item.bg, width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                    )}
                                    <Text style={{ fontSize: 16, color: colored ? (item.color || theme.text) : theme.text, fontWeight: colored ? 'bold' : 'normal' }}>{label}</Text>
                                </View>
                                <ChevronRight size={16} color={theme.textDim} />
                            </TouchableOpacity>
                        )}}
                    />
                </View>
            </View>
        </Modal>
    );
};

// --- NEW TEMPLATE SCREEN (REPLACEMENT) ---
// --- 3D COLORFUL RX PAD UI ---
const TemplateScreen = ({ theme, onBack, templates, setTemplates, medicines, setMedicines }) => {
    const insets = useSafeAreaInsets();
    const [view, setView] = useState('list'); // 'list', 'edit'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State
    const [editorForm, setEditorForm] = useState({ id: null, name: '', diagnosis: '', advice: '', medicines: [] });
    
    // Medicine Picker Modal State
    const [medModalVisible, setMedModalVisible] = useState(false);
    const [medSearch, setMedSearch] = useState('');
    const [newMedForm, setNewMedForm] = useState({ name: '', dosage: '', freq: '1-0-1', duration: '3 Days', instruction: 'After Food', type: 'Tablet' });
    const [activePicker, setActivePicker] = useState(null); 

    // Actions
    const handleEdit = (item) => {
        setEditorForm({ ...item, medicines: [...item.medicines] });
        setView('edit');
    };

    const handleCreate = () => {
        setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [] });
        setView('edit');
    };

    const handleSaveTemplate = () => {
        if (!editorForm.name) { Alert.alert("Required", "Please enter a Template Name."); return; }
        
        let updatedTemplates;
        if (editorForm.id) {
            updatedTemplates = templates.map(t => t.id === editorForm.id ? editorForm : t);
            Alert.alert("Success", "Template Updated!");
        } else {
            const newTemplate = { ...editorForm, id: Date.now() };
            updatedTemplates = [newTemplate, ...templates];
            Alert.alert("Success", "Template Created!");
        }
        setTemplates(updatedTemplates);
        setView('list');
    };

    const handleDeleteTemplate = (id) => {
        Alert.alert("Delete", "Remove this template?", [{text: "Cancel"}, {text: "Delete", style: 'destructive', onPress: () => {
            setTemplates(templates.filter(t => t.id !== id));
        }}]);
    };

    const removeMedFromTemplate = (index) => {
        const updated = [...editorForm.medicines];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, medicines: updated });
    };

    const openMedModal = () => {
        setNewMedForm({ name: '', dosage: '', freq: '1-0-1', duration: '3 Days', instruction: 'After Food', type: 'Tablet' });
        setMedSearch('');
        setMedModalVisible(true);
    };

    const addMedToTemplate = () => {
        if (!newMedForm.name) return;
        setEditorForm({ ...editorForm, medicines: [...editorForm.medicines, { ...newMedForm, id: Date.now() }] });
        setMedModalVisible(false);
    };

    const selectInventoryMed = (med) => {
        setNewMedForm({ ...newMedForm, name: med.name, type: med.type, dosage: med.content });
        setMedSearch(med.name); 
    };

    const addNewToInventory = () => {
        const newGlobalMed = { id: Date.now(), name: medSearch, type: newMedForm.type, content: newMedForm.dosage || 'N/A' };
        setMedicines([newGlobalMed, ...medicines]);
        setNewMedForm({ ...newMedForm, name: medSearch });
        Alert.alert("Added", "Medicine added to Global Inventory.");
    };

    const renderList = () => {
        const filtered = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return (
            <View style={{ flex: 1 }}>
                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 16, paddingHorizontal: 15, height: 55, shadowColor: "#000", shadowOffset: {width:0,height:4}, shadowOpacity:0.05, shadowRadius:10, elevation:3 }}>
                        <Search size={22} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }} placeholder="Search Templates..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={20} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity activeOpacity={0.9} onPress={() => handleEdit(item)} style={{ marginBottom: 20 }}>
                            {/* 3D Card Effect */}
                            <View style={{ 
                                backgroundColor: theme.cardBg, borderRadius: 20, 
                                shadowColor: theme.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 15, elevation: 6,
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
                            }}>
                                {/* Gradient Header of Card */}
                                <LinearGradient colors={index % 2 === 0 ? ['#2dd4bf', '#0f766e'] : ['#8b5cf6', '#6d28d9']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10 }}><FileText size={18} color="white" /></View>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteTemplate(item.id)} style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 10 }}>
                                        <Trash2 size={16} color="white" />
                                    </TouchableOpacity>
                                </LinearGradient>

                                {/* Body */}
                                <View style={{ padding: 15 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <Stethoscope size={16} color={theme.primary} />
                                        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.diagnosis}</Text>
                                    </View>
                                    
                                    <View style={{ gap: 8 }}>
                                        {item.medicines.slice(0, 3).map((med, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.inputBg, padding: 8, borderRadius: 8 }}>
                                                <Pill size={14} color={theme.textDim} />
                                                <Text style={{ color: theme.textDim, fontSize: 12, flex: 1, fontWeight: '500' }}>
                                                    {med.name} <Text style={{ fontSize: 10 }}>({med.dosage})</Text>
                                                </Text>
                                                <Text style={{ color: theme.primary, fontSize: 10, fontWeight: 'bold' }}>{med.freq}</Text>
                                            </View>
                                        ))}
                                        {item.medicines.length > 3 && (
                                            <Text style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold', textAlign: 'center', marginTop: 5 }}>
                                                + {item.medicines.length - 3} more medicines
                                            </Text>
                                        )}
                                    </View>

                                    <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'flex-end' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <Text style={{ color: theme.textDim, fontSize: 12 }}>Edit Template</Text>
                                            <ArrowLeft size={14} color={theme.textDim} style={{ transform: [{rotate: '180deg'}] }} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.6 }}>
                            <Sparkles size={60} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, marginTop: 15, fontSize: 16 }}>Create your first prescription template</Text>
                        </View>
                    }
                />
            </View>
        );
    };

    const renderEditor = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {/* RX PAD HEADER */}
            <View style={{ marginBottom: 25, backgroundColor: theme.cardBg, borderRadius: 20, padding: 5, shadowColor: theme.primary, shadowOffset: {width:0, height:4}, shadowOpacity:0.2, elevation:5 }}>
                <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ borderRadius: 16, padding: 15 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>RX PRESET</Text>
                        <FileText size={24} color="rgba(255,255,255,0.3)" />
                    </View>
                </LinearGradient>
                <View style={{ padding: 15, gap: 15 }}>
                    <InputGroup icon={FileText} label="Template Name *" value={editorForm.name} onChange={t => setEditorForm({...editorForm, name: t})} theme={theme} placeholder="e.g. Viral Fever" />
                    <InputGroup icon={Stethoscope} label="Diagnosis / Condition" value={editorForm.diagnosis} onChange={t => setEditorForm({...editorForm, diagnosis: t})} theme={theme} placeholder="e.g. Viral Pyrexia" />
                </View>
            </View>

            {/* MEDICINES LIST */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>MEDICINES</Text>
                <TouchableOpacity onPress={openMedModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Medicine</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {editorForm.medicines.map((med, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bae6fd' }}>
                            <Pill size={22} color="#0ea5e9" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{med.name} <Text style={{fontSize: 13, fontWeight: '500', color: theme.textDim}}>({med.dosage})</Text></Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                <View style={{ backgroundColor: '#fdf2f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fbcfe8' }}><Text style={{ fontSize: 11, color: '#db2777', fontWeight: 'bold' }}>{med.freq}</Text></View>
                                <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' }}><Text style={{ fontSize: 11, color: '#059669', fontWeight: 'bold' }}>{med.duration}</Text></View>
                                <Text style={{ fontSize: 11, color: theme.textDim, fontStyle: 'italic' }}>{med.instruction}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeMedFromTemplate(index)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}
                {editorForm.medicines.length === 0 && (
                    <View style={{ padding: 30, borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}>
                        <Text style={{ color: theme.textDim, fontWeight: '600' }}>No medicines added yet.</Text>
                        <TouchableOpacity onPress={openMedModal}><Text style={{ color: theme.primary, fontWeight: 'bold', marginTop: 5 }}>+ Add First Medicine</Text></TouchableOpacity>
                    </View>
                )}
            </View>

            <InputGroup icon={Clipboard} label="Advice / Notes" value={editorForm.advice} onChange={t => setEditorForm({...editorForm, advice: t})} theme={theme} multiline placeholder="Enter patient advice (e.g., Drink warm water)..." />
        </ScrollView>
    );

    const renderMedModal = () => {
        const inventoryMatches = medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()) && medSearch.length > 0);
        const isExactMatch = medicines.some(m => m.name.toLowerCase() === medSearch.toLowerCase());

        return (
            <Modal visible={medModalVisible} animationType="slide" transparent onRequestClose={() => setMedModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                         <TouchableOpacity style={{ flex: 1 }} onPress={() => setMedModalVisible(false)} />
                         <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '90%', shadowColor: "#000", shadowOffset: {width:0, height:-10}, shadowOpacity:0.3, elevation:20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Add Medicine</Text>
                                <TouchableOpacity onPress={() => setMedModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><X size={20} color={theme.textDim} /></TouchableOpacity>
                            </View>

                            {/* Search Section */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600', fontSize: 12, letterSpacing: 1 }}>SEARCH INVENTORY</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: theme.primary }}>
                                    <Search size={20} color={theme.primary} style={{ marginRight: 10 }} />
                                    <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Type medicine name..." placeholderTextColor={theme.textDim} value={medSearch} onChangeText={setMedSearch} />
                                    {medSearch.length > 0 && <TouchableOpacity onPress={() => setMedSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                                </View>
                                {medSearch.length > 0 && inventoryMatches.length > 0 && (
                                    <View style={{ maxHeight: 150, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' }}>
                                        <FlatList data={inventoryMatches} keyExtractor={item => item.id.toString()} nestedScrollEnabled renderItem={({item}) => (
                                                <TouchableOpacity onPress={() => selectInventoryMed(item)} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.cardBg }}>
                                                    <Text style={{ color: theme.text, fontWeight: '600' }}>{item.name}</Text>
                                                    <Text style={{ color: theme.textDim, fontSize: 12 }}>{item.content}</Text>
                                                </TouchableOpacity>
                                        )} />
                                    </View>
                                )}
                                {medSearch.length > 0 && !isExactMatch && (
                                    <TouchableOpacity onPress={addNewToInventory} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 10, backgroundColor: theme.inputBg, borderRadius: 12 }}>
                                        <PlusCircle size={16} color={theme.primary} />
                                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Add "{medSearch}" to Global Inventory</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 20 }}>
                                    <InputGroup icon={Pill} label="Drug Name" value={newMedForm.name} onChange={t => setNewMedForm({...newMedForm, name: t})} theme={theme} />
                                    <View style={{ flexDirection: 'row', gap: 15 }}>
                                        <View style={{ flex: 1 }}><InputGroup icon={Weight} label="Dosage" value={newMedForm.dosage} onChange={t => setNewMedForm({...newMedForm, dosage: t})} theme={theme} placeholder="500mg" /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Type</Text>
                                            <TouchableOpacity style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'center' }]}>
                                                <Text style={{ color: theme.text, fontWeight: '600' }}>{newMedForm.type}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Colorful Smart Pickers */}
                                    <View>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Frequency</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                            {FREQUENCIES.map(f => (
                                                <TouchableOpacity key={f} onPress={() => setNewMedForm({...newMedForm, freq: f})} style={{ backgroundColor: newMedForm.freq === f ? theme.primary : theme.cardBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: newMedForm.freq === f ? theme.primary : theme.border, shadowColor: newMedForm.freq === f ? theme.primary : "#000", shadowOpacity: 0.2, elevation: 3 }}>
                                                    <Text style={{ color: newMedForm.freq === f ? 'white' : theme.text, fontWeight: 'bold' }}>{f}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Duration</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                            {DURATIONS.map(d => (
                                                <TouchableOpacity key={d} onPress={() => setNewMedForm({...newMedForm, duration: d})} style={{ backgroundColor: newMedForm.duration === d ? '#8b5cf6' : theme.cardBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: newMedForm.duration === d ? '#8b5cf6' : theme.border, shadowColor: "#8b5cf6", shadowOpacity: newMedForm.duration === d ? 0.3 : 0, elevation: 3 }}>
                                                    <Text style={{ color: newMedForm.duration === d ? 'white' : theme.text, fontWeight: 'bold' }}>{d}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Instructions</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                            {INSTRUCTIONS.map(i => (
                                                <TouchableOpacity key={i} onPress={() => setNewMedForm({...newMedForm, instruction: i})} style={{ backgroundColor: newMedForm.instruction === i ? '#f59e0b' : theme.cardBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: newMedForm.instruction === i ? '#f59e0b' : theme.border, shadowColor: "#f59e0b", shadowOpacity: newMedForm.instruction === i ? 0.3 : 0, elevation: 3 }}>
                                                    <Text style={{ color: newMedForm.instruction === i ? 'white' : theme.text, fontWeight: 'bold' }}>{i}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={addMedToTemplate} style={{ marginTop: 25 }}>
                                <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 18, borderRadius: 18, alignItems: 'center', shadowColor: theme.primary, shadowOffset: {width:0,height:5}, shadowOpacity:0.4, elevation:8 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Add to Prescription</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                         </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                {view === 'list' ? (
                     <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setView('list')} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <X size={24} color={theme.text} />
                    </TouchableOpacity>
                )}
                
                <View style={{flex: 1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{view === 'list' ? 'Templates' : editorForm.id ? 'Edit Template' : 'New Template'}</Text>
                    {view === 'list' && <Text style={{ fontSize: 12, color: theme.textDim }}>Manage your prescription sets</Text>}
                </View>

                {view === 'list' ? (
                    <TouchableOpacity onPress={handleCreate} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleSaveTemplate} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                        <Save size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {view === 'list' ? renderList() : renderEditor()}
            </KeyboardAvoidingView>
            {renderMedModal()}
        </View>
    );
};
// --- END TEMPLATE SCREEN ---

// --- VITALS SCREEN ---
const VitalsScreen = ({ theme, onBack, patient, onSaveVitals }) => {
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState(patient?.vitalsHistory || []);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C'
    });

    const handleSave = () => {
        if (!form.sys && !form.weight && !form.temp) {
            Alert.alert("Empty Input", "Please enter at least one vital sign (BP, Weight, or Temp).");
            return;
        }

        const newEntry = {
            id: editingId || Date.now(),
            date: new Date().toISOString(),
            ...form
        };

        let updatedHistory;
        if (editingId) {
            updatedHistory = history.map(h => h.id === editingId ? newEntry : h);
            setEditingId(null);
            Alert.alert("Updated", "Vitals record updated successfully.");
        } else {
            updatedHistory = [newEntry, ...history];
            Alert.alert("Saved", "New vitals recorded.");
        }

        setHistory(updatedHistory);
        setForm({ sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C' });
        onSaveVitals(patient.id, updatedHistory);
        Keyboard.dismiss();
    };

    const handleEdit = (item) => {
        setForm({
            sys: item.sys, dia: item.dia, pulse: item.pulse, spo2: item.spo2, 
            weight: item.weight, temp: item.temp, tempUnit: item.tempUnit || 'C'
        });
        setEditingId(item.id);
    };

    const handleDelete = (id) => {
        Alert.alert("Delete Record", "Remove this vital sign record?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: 'destructive', onPress: () => {
                const updated = history.filter(h => h.id !== id);
                setHistory(updated);
                onSaveVitals(patient.id, updated);
            }}
        ]);
    };

    const MedicalInput = ({ icon: Icon, label, value, onChange, unit, placeholder, color, width = '48%' }) => (
        <View style={{ width: width, marginBottom: 15 }}>
            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, 
                borderRadius: 12, height: 52, 
                borderWidth: 1.5, borderColor: value ? color : theme.border, 
                paddingHorizontal: 12, 
                shadowColor: value ? color : "#000", shadowOffset: {width:0,height:2}, shadowOpacity: value ? 0.15 : 0.05, shadowRadius: 3, elevation: value ? 3 : 1 
            }}>
                <Icon size={18} color={value ? color : theme.textDim} strokeWidth={2.5} />
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
                <View style={{flex:1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Clinical Vitals</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '500' }}>Patient: {patient?.name}</Text>
                </View>
                <TouchableOpacity onPress={handleSave} style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 5 }}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>{editingId ? 'Update' : 'Save Record'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 30 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Clipboard size={18} color={theme.primary} />
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>New Reading</Text>
                        </View>
                        <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '600' }}>
                                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Text>
                        </View>
                    </View>

                    <View style={{ backgroundColor: theme.inputBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <MedicalInput icon={Activity} label="Systolic (High)" value={form.sys} onChange={t => setForm({...form, sys: t})} unit="mmHg" placeholder="120" color="#ef4444" />
                            <MedicalInput icon={Activity} label="Diastolic (Low)" value={form.dia} onChange={t => setForm({...form, dia: t})} unit="mmHg" placeholder="80" color="#ef4444" />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <MedicalInput icon={HeartPulse} label="Pulse Rate" value={form.pulse} onChange={t => setForm({...form, pulse: t})} unit="BPM" placeholder="72" color="#8b5cf6" />
                            <MedicalInput icon={Droplet} label="SpO2 Level" value={form.spo2} onChange={t => setForm({...form, spo2: t})} unit="%" placeholder="98" color="#0ea5e9" />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <MedicalInput icon={Weight} label="Weight" value={form.weight} onChange={t => setForm({...form, weight: t})} unit="kg" placeholder="65" color="#10b981" />
                            <View style={{ width: '48%', marginBottom: 15 }}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                                    <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '700', textTransform: 'uppercase' }}>Temp</Text>
                                    <TouchableOpacity onPress={() => setForm({...form, tempUnit: form.tempUnit === 'C' ? 'F' : 'C'})}>
                                        <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}>Scale: °{form.tempUnit}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ 
                                    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, 
                                    borderRadius: 12, height: 52, 
                                    borderWidth: 1.5, borderColor: form.temp ? '#f59e0b' : theme.border, 
                                    paddingHorizontal: 12,
                                    shadowColor: form.temp ? "#f59e0b" : "#000", shadowOpacity: form.temp ? 0.15 : 0.05, elevation: 2 
                                }}>
                                    <Thermometer size={18} color={form.temp ? '#f59e0b' : theme.textDim} strokeWidth={2.5} />
                                    <TextInput style={{ flex: 1, marginLeft: 10, color: theme.text, fontWeight: '700', fontSize: 18 }} value={form.temp} onChangeText={t => setForm({...form, temp: t})} placeholder="36.6" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                    <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: 'bold' }}>°{form.tempUnit}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                     <History size={20} color={theme.textDim} />
                     <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Past Records</Text>
                     <View style={{ height: 1, flex: 1, backgroundColor: theme.border }} />
                </View>

                <View style={{ paddingLeft: 10 }}>
                    {history.map((item, index) => {
                        const date = new Date(item.date);
                        const isLatest = index === 0;
                        return (
                            <View key={item.id} style={{ flexDirection: 'row', marginBottom: 25 }}>
                                <View style={{ alignItems: 'center', marginRight: 15 }}>
                                    <View style={{ 
                                        width: 14, height: 14, borderRadius: 7, 
                                        backgroundColor: isLatest ? theme.primary : theme.border,
                                        borderWidth: 2, borderColor: theme.bg 
                                    }} />
                                    {index !== history.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: theme.border, marginVertical: 4 }} />}
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '600', marginBottom: 8 }}>
                                        {date.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})} • {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                    
                                    <View style={{ 
                                        backgroundColor: theme.cardBg, borderRadius: 16, padding: 15, 
                                        borderWidth: 1, borderColor: isLatest ? theme.primary : theme.border,
                                        shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.05, elevation: 2
                                    }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                                            {(item.sys || item.dia) && (
                                                <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' }}>
                                                    <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 16 }}>{item.sys}/{item.dia}</Text>
                                                    <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>BP mmHg</Text>
                                                </View>
                                            )}
                                            {item.spo2 && (
                                                <View style={{ backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#bae6fd' }}>
                                                    <Text style={{ color: '#0ea5e9', fontWeight: '800', fontSize: 16 }}>{item.spo2}%</Text>
                                                    <Text style={{ color: '#0ea5e9', fontSize: 10, fontWeight: '600' }}>SpO2</Text>
                                                </View>
                                            )}
                                            {item.pulse && (
                                                <View style={{ backgroundColor: '#faf5ff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#e9d5ff' }}>
                                                    <Text style={{ color: '#a855f7', fontWeight: '800', fontSize: 16 }}>{item.pulse}</Text>
                                                    <Text style={{ color: '#a855f7', fontSize: 10, fontWeight: '600' }}>BPM</Text>
                                                </View>
                                            )}
                                            {item.weight && (
                                                <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
                                                    <Text style={{ color: '#22c55e', fontWeight: '800', fontSize: 16 }}>{item.weight}</Text>
                                                    <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '600' }}>kg</Text>
                                                </View>
                                            )}
                                            {item.temp && (
                                                <View style={{ backgroundColor: '#fffbeb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#fde68a' }}>
                                                    <Text style={{ color: '#d97706', fontWeight: '800', fontSize: 16 }}>{item.temp}°</Text>
                                                    <Text style={{ color: '#d97706', fontSize: 10, fontWeight: '600' }}>Temp {item.tempUnit || 'C'}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 15, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, marginTop: 5 }}>
                                            <TouchableOpacity onPress={() => handleEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <Pencil size={14} color={theme.textDim} />
                                                <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '600' }}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                <Trash2 size={14} color="#ef4444" />
                                                <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: '600' }}>Remove</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {history.length === 0 && (
                    <View style={{ alignItems: 'center', marginTop: 30, opacity: 0.5 }}>
                        <Activity size={40} color={theme.textDim} />
                        <Text style={{ color: theme.textDim, marginTop: 10 }}>No vitals history recorded yet.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// --- PATIENT MANAGEMENT SCREEN ---
const PatientScreen = ({ theme, onBack, patients, setPatients, appointments, setAppointments, selectedPatientId, onBookAppointment, onNavigate }) => {
    const insets = useSafeAreaInsets();
    const [view, setView] = useState('list'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [addVisible, setAddVisible] = useState(false);
    const [newPatient, setNewPatient] = useState({ name: '', mobile: '', email: '', age: '', dob: '', dobObj: new Date(), gender: 'M', blood: 'O+', address: '' });
    const [pickerVisible, setPickerVisible] = useState(false);
    const [showDobPicker, setShowDobPicker] = useState(false);

    useEffect(() => {
        if (selectedPatientId) {
            const patient = patients.find(p => p.id === selectedPatientId);
            if (patient) {
                setSelectedPatient(patient);
                setView('detail');
            }
        }
    }, [selectedPatientId, patients]);

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mobile.includes(searchQuery) || p.id.toString().includes(searchQuery));
    const totalPatients = patients.length;
    const phoneRegistered = patients.filter(p => p.mobile && p.mobile.length > 0).length;
    
    const handleDelete = (id) => {
        Alert.alert(
            "Delete Patient", "This will permanently remove the patient.",
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => {
                        const updated = patients.filter(p => p.id !== id);
                        setPatients(updated);
                        if(view !== 'list') setView('list');
                    }}]
        );
    };

    const handleSaveEdit = () => {
        if (!editForm.name || !editForm.mobile) { Alert.alert("Error", "Name and Mobile are required"); return; }
        const updated = patients.map(p => p.id === editForm.id ? editForm : p);
        setPatients(updated);
        Alert.alert("Success", "Patient details updated.");
        setView('list');
    };

    const handleDobChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDobPicker(false);
        if (selectedDate) {
            const age = calculateAge(selectedDate);
            const dateStr = selectedDate.toISOString().split('T')[0];
            if (addVisible) {
                setNewPatient({ ...newPatient, dobObj: selectedDate, dob: dateStr, age: age });
            } else {
                setEditForm({ ...editForm, dob: dateStr, age: age }); 
            }
        }
    };

    const handleAddNew = () => {
        if (!newPatient.name || !newPatient.mobile) { Alert.alert("Required", "Please enter Patient Name and Mobile Number."); return; }
        const createdPatient = {
            id: Date.now(),
            name: newPatient.name,
            mobile: newPatient.mobile,
            email: newPatient.email,
            age: newPatient.age,
            dob: newPatient.dob,
            gender: newPatient.gender,
            blood: newPatient.blood || 'O+',
            address: newPatient.address,
            registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            vitalsHistory: []
        };
        setPatients([createdPatient, ...patients]);
        setAddVisible(false);
        setNewPatient({ name: '', mobile: '', email: '', age: '', dob: '', dobObj: new Date(), gender: 'M', blood: 'O+', address: '' });
        Alert.alert("Success", "New Patient Added Successfully!");
    };

    const openPatientPopup = (patient) => {
        setViewingPatient(patient);
        setDetailModalVisible(true);
    };

    const openFullProfile = (patient) => {
        setSelectedPatient(patient);
        setView('detail');
    };

    const openEdit = (patient) => {
        setEditForm({ ...patient });
        setView('edit');
    };

    const handleQuickBook = (patient) => { onBookAppointment(patient); }

    const StatBadge = ({ label, value, icon: Icon, color }) => (
        <View style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 12, flex: 1, borderWidth: 1, borderColor: theme.border, alignItems: 'center', minWidth: 100 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Icon size={14} color={color} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{value}</Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.textDim, textAlign: 'center' }}>{label}</Text>
        </View>
    );

    const handleHeaderBack = () => {
        if (view === 'list') { onBack(); } 
        else {
            if (selectedPatientId) onBack(); 
            else setView('list');
        }
    };

    const renderList = () => (
        <View style={{ flex: 1 }}>
             <View style={{ paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', gap: 10 }}>
                <StatBadge label="Total Patients" value={totalPatients} icon={User} color={theme.primary} />
                <StatBadge label="Phone Reg." value={phoneRegistered} icon={Phone} color="#10b981" />
            </View>

             <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                    <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                    <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search Name / Mobile / ID..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <X size={18} color={theme.textDim} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filteredPatients}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => openFullProfile(item)} style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.name} <Text style={{fontSize: 12, color: theme.textDim}}>(#{item.id})</Text></Text>
                            <Text style={{ fontSize: 13, color: theme.textDim, marginTop: 4 }}>{item.mobile}</Text>
                            <View style={{ flexDirection: 'row', marginTop: 8, gap: 10, flexWrap: 'wrap' }}>
                                <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 11, color: theme.text }}>{item.blood || 'N/A'}</Text>
                                </View>
                                <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 11, color: theme.text }}>Age: {item.age || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                             <TouchableOpacity onPress={() => handleQuickBook(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                                <CalendarPlus size={18} color="#f59e0b" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openPatientPopup(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                <Eye size={18} color={theme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                <Pencil size={18} color={theme.textDim} />
                            </TouchableOpacity>
                             <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 50 }}><Text style={{ color: theme.textDim }}>No patients found.</Text></View>}
            />
        </View>
    );

    const PatientDetailPopup = () => {
        if (!viewingPatient || !detailModalVisible) return null;
        return (
            <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setDetailModalVisible(false)} />
                    <View style={{ backgroundColor: theme.cardBg, borderRadius: 30, overflow: 'hidden', width: '100%', shadowColor: "#000", shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
                        <LinearGradient colors={['#2dd4bf', '#0f766e']} style={{ padding: 20, paddingBottom: 40, position: 'relative' }}>
                            <View style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <View style={{ position: 'absolute', bottom: -10, right: 10, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', letterSpacing: 1, fontSize: 12 }}>MEDICAL RECORD</Text>
                                <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                                    <X size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <View style={{ alignItems: 'center', marginTop: -35 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                                <View style={{ width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{viewingPatient.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 10, textTransform: 'uppercase' }}>{viewingPatient.name}</Text>
                            <Text style={{ fontSize: 14, color: theme.textDim, marginBottom: 20 }}>{viewingPatient.age} Years • {viewingPatient.gender === 'M' ? 'Male' : 'Female'}</Text>
                        </View>

                        <View style={{ paddingHorizontal: 25, paddingBottom: 30 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                                <View style={{ width: '31%', backgroundColor: theme.mode === 'dark' ? theme.inputBg : '#eff6ff', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <Droplet size={18} color="#3b82f6" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{viewingPatient.blood || 'N/A'}</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>BLOOD</Text>
                                </View>
                                <View style={{ width: '31%', backgroundColor: theme.mode === 'dark' ? theme.inputBg : '#fdf2f8', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <User size={18} color="#ec4899" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{viewingPatient.gender}</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>GENDER</Text>
                                </View>
                                <View style={{ width: '31%', backgroundColor: theme.mode === 'dark' ? theme.inputBg : '#fefce8', paddingVertical: 12, borderRadius: 16, alignItems: 'center', gap: 4 }}>
                                    <Weight size={18} color="#eab308" />
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>65 kg</Text>
                                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: '600' }}>WEIGHT</Text>
                                </View>
                            </View>

                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textDim, marginBottom: 12, letterSpacing: 1 }}>CONTACT DETAILS</Text>
                            <View style={{ backgroundColor: theme.inputBg, borderRadius: 16, padding: 15, gap: 15 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color="#0f766e" /></View>
                                    <View>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Phone Number</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.mobile}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: theme.border }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color="#0f766e" /></View>
                                    <View>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Email Address</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.email || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: theme.border }} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><MapPin size={16} color="#0f766e" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: theme.textDim }}>Address</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{viewingPatient.address || 'Not Provided'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 5 }}>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>Patient ID: <Text style={{fontWeight:'bold', color: theme.text}}>#{viewingPatient.id}</Text></Text>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>Reg: <Text style={{fontWeight:'bold', color: theme.text}}>{viewingPatient.registeredDate || 'N/A'}</Text></Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderDetail = () => {
        if (!selectedPatient) return null;
        
        const ActionGridItem = ({ title, icon: Icon, onPress, colors }) => (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ width: '47%', marginBottom: 15 }}>
                <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{ padding: 15, borderRadius: 20, height: 100, justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: colors[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon color="white" size={20} strokeWidth={2.5} />
                    </View>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{title}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );

        const handleShare = async () => {
            const message = `Patient ID Card\n\nName: ${selectedPatient.name}\nID: ${selectedPatient.id}\nAge/Gender: ${selectedPatient.age} / ${selectedPatient.gender}\nPhone: ${selectedPatient.mobile}`;
            try { await Share.share({ message }); } catch (error) { Alert.alert("Error", "Could not share."); }
        };

        const handleDownload = () => { Alert.alert("Success", "ID Card Image saved to Gallery!"); };

        const ACTIONS = [
            { id: 1, title: 'Add Vitals', icon: HeartPulse, colors: ['#2dd4bf', '#0f766e'], action: () => onNavigate('vitals', selectedPatient) },
            { id: 2, title: 'Prescribe now', icon: FilePlus, colors: ['#a78bfa', '#8b5cf6'], action: () => Alert.alert("Coming Soon", "Prescription module") },
            { id: 5, title: 'Add Lab Report', icon: TestTube, colors: ['#60a5fa', '#3b82f6'], action: () => Alert.alert("Coming Soon", "Lab Reports") },
            { id: 6, title: 'Rx History', icon: Clock, colors: ['#fbbf24', '#f59e0b'], action: () => Alert.alert("Coming Soon", "History") },
        ];

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 150 }}>
                 <View style={{ backgroundColor: '#116A7B', borderRadius: 16, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}>
                    <View style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <View style={{ position: 'absolute', top: -10, left: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    
                    <View style={{ padding: 20 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 }}>ID CARD</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                <User size={40} color="black" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>PATIENT NAME:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.name}</Text></View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>ID NO:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: 000{selectedPatient.id}</Text></View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>AGE/GENDER:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.age} Yrs / {selectedPatient.gender === 'M' ? 'Male' : 'Female'}</Text></View>
                                <View style={{ flexDirection: 'row', marginBottom: 6 }}><Text style={{ color: '#A0D6D6', width: 110, fontSize: 12, fontWeight: 'bold' }}>PHONE:</Text><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>: {selectedPatient.mobile}</Text></View>
                            </View>
                        </View>
                        <View style={{ height: 2, backgroundColor: '#facc15', marginVertical: 15 }} />
                        <Text style={{ color: 'white', fontSize: 10, textAlign: 'center', marginBottom: 5 }}>CONSULTANT DOCTOR:</Text>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontStyle: 'italic' }}>Dr. Mansoor Ali V. P.</Text>
                        <Text style={{ color: '#facc15', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 5 }}>PATHAPPIRIYAM</Text>
                        <View style={{ marginTop: 20, backgroundColor: 'white', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
                            <Text style={{ color: '#116A7B', fontWeight: 'bold', fontSize: 12 }}>APPOINTMENT BOOKING: +91 8606344694</Text>
                        </View>
                    </View>
                 </View>

                 <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
                     <TouchableOpacity onPress={handleShare} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', padding: 12, borderRadius: 12, gap: 8 }}>
                         <Share2 size={18} color="white" />
                         <Text style={{ color: 'white', fontWeight: 'bold' }}>WhatsApp</Text>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={handleDownload} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, padding: 12, borderRadius: 12, gap: 8 }}>
                         <Download size={18} color="white" />
                         <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Card</Text>
                     </TouchableOpacity>
                 </View>

                 <Text style={{ marginVertical: 10, color: theme.textDim, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Actions</Text>
                 <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                     {ACTIONS.map(action => (
                         <ActionGridItem key={action.id} {...action} onPress={action.action} />
                     ))}
                 </View>
            </ScrollView>
        );
    };

    const renderEdit = () => (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={{ gap: 15 }}>
                <InputGroup icon={User} label="Patient Name *" value={editForm.name} onChange={t => setEditForm({...editForm, name: t})} theme={theme} />
                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={editForm.mobile} onChange={t => setEditForm({...editForm, mobile: t})} theme={theme} />
                <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={editForm.email} onChange={t => setEditForm({...editForm, email: t})} theme={theme} />
                
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Cake size={20} color={theme.textDim} />
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{editForm.dob || 'Select Date'}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={editForm.age} onChange={t => setEditForm({...editForm, age: t})} theme={theme} /></View>
                </View>
                <View style={{ marginTop: 10 }}>
                     <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Droplet size={20} color={theme.textDim} />
                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{editForm.blood}</Text>
                        </View>
                        <ChevronDown size={16} color={theme.textDim} />
                    </TouchableOpacity>
                </View>
                <InputGroup icon={MapPin} label="Address" value={editForm.address} onChange={t => setEditForm({...editForm, address: t})} theme={theme} />
                
                <TouchableOpacity onPress={handleSaveEdit} style={{ backgroundColor: theme.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Update Patient</Text>
                </TouchableOpacity>
            </View>
            <CustomPicker visible={pickerVisible} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerVisible(false)} onSelect={(val) => {
                setEditForm({...editForm, blood: val});
                setPickerVisible(false);
            }} theme={theme} />
            {showDobPicker && (
                <DateTimePicker value={new Date()} mode="date" display="default" maximumDate={new Date()} onChange={handleDobChange} />
            )}
        </ScrollView>
    );

    const renderAddModal = () => (
        <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setAddVisible(false)} />
                    <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '90%' }}>
                        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 }}>
                                    <UserPlus size={24} color="white" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Add New Patient</Text>
                                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Enter patient information</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setAddVisible(false)} style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 20 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView contentContainerStyle={{ padding: 25 }}>
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.textDim, marginBottom: 15, textTransform: 'uppercase' }}>Basic Information</Text>
                            <View style={{ gap: 15 }}>
                                <InputGroup icon={User} label="Patient Name *" value={newPatient.name} onChange={t => setNewPatient({...newPatient, name: t})} theme={theme} placeholder="Ex: John Doe" />
                                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={newPatient.mobile} onChange={t => setNewPatient({...newPatient, mobile: t})} theme={theme} placeholder="Ex: 9876543210" />
                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                                        <TouchableOpacity onPress={() => setShowDobPicker(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                             <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <Cake size={20} color={theme.textDim} />
                                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{newPatient.dob || 'Select Date'}</Text>
                                            </View>
                                            <ChevronDown size={16} color={theme.textDim} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 0.8 }}>
                                        <InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={newPatient.age} onChange={t => setNewPatient({...newPatient, age: t})} theme={theme} placeholder="Age" />
                                    </View>
                                </View>
                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                                    <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                         <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Droplet size={20} color={theme.textDim} />
                                            <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{newPatient.blood}</Text>
                                        </View>
                                        <ChevronDown size={16} color={theme.textDim} />
                                    </TouchableOpacity>
                                </View>
                                <InputGroup icon={MapPin} label="Address" value={newPatient.address} onChange={t => setNewPatient({...newPatient, address: t})} theme={theme} placeholder="City, Street..." />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 15, marginTop: 30 }}>
                                <TouchableOpacity onPress={() => setAddVisible(false)} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                                    <Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddNew} style={{ flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Patient</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
             <CustomPicker visible={pickerVisible} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerVisible(false)} onSelect={(val) => {
                if(addVisible) setNewPatient({...newPatient, blood: val});
                else setEditForm({...editForm, blood: val});
            }} theme={theme} />
             {showDobPicker && (
                <DateTimePicker value={newPatient.dobObj || new Date()} mode="date" display="default" maximumDate={new Date()} onChange={handleDobChange} />
            )}
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={handleHeaderBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    {view === 'list' ? <ArrowLeft size={24} color={theme.text} /> : <X size={24} color={theme.text} />}
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {view === 'list' ? 'Patient List' : view === 'detail' ? 'Patient Profile' : 'Edit Patient'}
                </Text>
                {view === 'list' ? (
                    <TouchableOpacity onPress={() => setAddVisible(true)} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : ( <View style={{ width: 44 }} /> )}
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {view === 'list' && renderList()}
                {view === 'detail' && renderDetail()}
                {view === 'edit' && renderEdit()}
            </KeyboardAvoidingView>
            {renderAddModal()}
            {PatientDetailPopup()}
        </View>
    );
};

const PlaceholderScreen = ({ title, icon: Icon, theme, onBack, color }) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.glowTop, { backgroundColor: color[0], opacity: 0.15 }]} />
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
                <View style={{ width: 44 }} /> 
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
                <View style={[styles.comingSoonIconContainer, { shadowColor: color[0] }]}>
                    <LinearGradient colors={color} style={styles.comingSoonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Icon size={60} color="white" />
                    </LinearGradient>
                </View>
                <Text style={[styles.comingSoonTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.comingSoonDesc, { color: theme.textDim }]}>Management for {title} will appear here.</Text>
            </View>
        </View>
    );
};

// --- MEDICINE INVENTORY SCREEN ---
const MedicineScreen = ({ theme, onBack, medicines, setMedicines }) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All'); 
    
    // Modals & Sheets
    const [addEditVisible, setAddEditVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [filterPickerVisible, setFilterPickerVisible] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: 'Tablet', content: '' });

    const filteredMedicines = medicines.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All' || m.type === filterType;
        return matchesSearch && matchesType;
    });

    const totalMedicines = medicines.length;
    const distinctTypes = [...new Set(medicines.map(m => m.type))].length;
    
    const getCategoryDetails = (type) => {
        return MEDICINE_CATEGORIES.find(c => c.value === type) || MEDICINE_CATEGORIES[ MEDICINE_CATEGORIES.length - 1];
    };

    const FILTER_DATA = [
        { label: 'All Types', value: 'All', icon: Layers, color: theme.text, bg: theme.inputBg },
        ...MEDICINE_CATEGORIES
    ];

    const handleAdd = () => {
        setIsEditing(false);
        setFormData({ name: '', type: 'Tablet', content: '' });
        setAddEditVisible(true);
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setCurrentId(item.id);
        setFormData({ name: item.name, type: item.type, content: item.content });
        setAddEditVisible(true);
    };

    const handleView = (item) => {
        setSelectedMed(item);
        setDetailVisible(true);
    };

    const handleSave = () => {
        if (!formData.name) { Alert.alert("Required", "Medicine Name is required."); return; }
        
        if (isEditing) {
            const updated = medicines.map(m => m.id === currentId ? { ...m, ...formData } : m);
            setMedicines(updated);
        } else {
            const newMed = { id: Date.now(), ...formData };
            setMedicines([newMed, ...medicines]);
        }
        setAddEditVisible(false);
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Item", "Remove this medicine?",
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => setMedicines(medicines.filter(m => m.id !== id)) }]
        );
    };

    const StatCard = ({ title, value, icon: Icon, color, bg }) => (
        <View style={{ width: '48%', backgroundColor: bg, padding: 15, borderRadius: 16, marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: color }}>{value}</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }}>{title}</Text>
                </View>
                <View style={{ backgroundColor: color, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color="#FFF" />
                </View>
            </View>
        </View>
    );

    const DetailPopup = () => {
        if (!selectedMed || !detailVisible) return null;
        const catDetails = getCategoryDetails(selectedMed.type);
        const CatIcon = catDetails.icon;
        const scaleAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => { Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start(); }, []);

        return (
            <Modal visible={detailVisible} transparent animationType="none" onRequestClose={() => setDetailVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setDetailVisible(false)} />
                    <Animated.View style={{ 
                        width: '100%', maxWidth: 340, backgroundColor: theme.cardBg, borderRadius: 24, padding: 0,
                        shadowColor: "#000", shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
                        transform: [{ scale: scaleAnim }], overflow: 'hidden'
                    }}>
                        <View style={{ backgroundColor: catDetails.color, padding: 20, alignItems: 'center', position: 'relative' }}>
                            <TouchableOpacity onPress={() => setDetailVisible(false)} style={{ position: 'absolute', top: 15, right: 15, padding: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                                <CatIcon size={30} color="white" strokeWidth={2.5} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>Medicine Details</Text>
                        </View>
                        <View style={{ padding: 25, gap: 20 }}>
                            <View>
                                <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', marginBottom: 5 }}>Medicine Name</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{selectedMed.name}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 15 }}>
                                <View>
                                    <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', marginBottom: 5 }}>Dosage Form</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catDetails.color }} />
                                        <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>{selectedMed.type}</Text>
                                    </View>
                                </View>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: theme.textDim, textTransform: 'uppercase', marginBottom: 5 }}>Content / Strength</Text>
                                <Text style={{ fontSize: 16, color: theme.text }}>{selectedMed.content}</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        );
    };

    const AddEditPopup = () => {
        if (!addEditVisible) return null;
        const scaleAnim = useRef(new Animated.Value(0)).current;
        useEffect(() => { Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start(); }, []);
        return (
             <Modal visible={addEditVisible} transparent animationType="none" onRequestClose={() => setAddEditVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                         <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAddEditVisible(false)} />
                         <Animated.View style={{ 
                            width: '100%', maxWidth: 360, backgroundColor: theme.cardBg, borderRadius: 24, 
                            shadowColor: "#000", shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
                            transform: [{ scale: scaleAnim }], overflow: 'hidden'
                        }}>
                            <View style={{ backgroundColor: theme.primary, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{isEditing ? 'Edit Medicine' : 'Add New Medicine'}</Text>
                                <TouchableOpacity onPress={() => setAddEditVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15 }}>
                                    <X size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 25, gap: 15 }}>
                                <InputGroup icon={Pill} label="Medicine Name *" value={formData.name} onChange={t => setFormData({...formData, name: t})} theme={theme} placeholder="Enter medicine name" />
                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Dosage Form *</Text>
                                    <TouchableOpacity onPress={() => setCategoryPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                            {(() => {
                                                const cat = getCategoryDetails(formData.type);
                                                const CatIcon = cat.icon;
                                                return <CatIcon size={20} color={cat.color} />;
                                            })()}
                                            <Text style={{ color: theme.text, fontSize: 16 }}>{formData.type}</Text>
                                        </View>
                                        <ChevronDown size={16} color={theme.textDim} />
                                    </TouchableOpacity>
                                </View>
                                <InputGroup icon={Activity} label="Content/Strength" value={formData.content} onChange={t => setFormData({...formData, content: t})} theme={theme} placeholder="e.g. 500mg" />
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                    <TouchableOpacity onPress={() => setAddEditVisible(false)} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }}>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSave} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{isEditing ? 'Update' : 'Add'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
                <CustomPicker visible={categoryPickerVisible} title="Select Dosage Form" data={MEDICINE_CATEGORIES} onClose={() => setCategoryPickerVisible(false)} onSelect={(val) => setFormData({...formData, type: val})} theme={theme} colored={true} />
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingHorizontal: 15 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Medicine Inventory</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim }}>Manage your pharmacy stock efficiently</Text>
                </View>
                <TouchableOpacity onPress={handleAdd} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                    <Plus size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                    <StatCard title="Total Medicines" value={totalMedicines} icon={Package} color="#2563eb" bg={theme.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff'} />
                    <StatCard title="Medicine Types" value={distinctTypes} icon={Layers} color="#10b981" bg={theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'} />
                    <StatCard title="Stock Items" value="408" icon={LayoutGrid} color="#7c3aed" bg={theme.mode === 'dark' ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff'} />
                    <StatCard title="Categories" value={MEDICINE_CATEGORIES.length} icon={Tag} color="#f59e0b" bg={theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb'} />
                </View>

                <View style={{ paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', gap: 10 }}>
                     <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 15 }} placeholder="Search medicines..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                                <X size={18} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <TouchableOpacity onPress={() => setFilterPickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border, minWidth: 100, gap: 8 }}>
                            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{filterType === 'All' ? 'Filter' : filterType}</Text>
                            <Filter size={18} color={theme.textDim} />
                        </TouchableOpacity>
                        {filterType !== 'All' && (
                            <TouchableOpacity onPress={() => setFilterType('All')} style={{ backgroundColor: '#fee2e2', height: 50, width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                    {filteredMedicines.map((item) => {
                        const catDetails = getCategoryDetails(item.type);
                        const CatIcon = catDetails.icon;
                        return (
                            <View key={item.id} style={{ backgroundColor: theme.cardBg, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <View style={{ width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: catDetails.bg }}>
                                    <CatIcon size={24} color={catDetails.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.name}</Text>
                                    <Text style={{ fontSize: 13, color: theme.textDim, marginTop: 4 }}>{item.content}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                         <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catDetails.color, marginRight: 6 }} />
                                         <Text style={{ fontSize: 12, color: catDetails.color, fontWeight: '600' }}>{item.type}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity onPress={() => handleView(item)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 8 }}>
                                        <Eye size={18} color={theme.text} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleEdit(item)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 8 }}>
                                        <Pencil size={18} color={theme.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 }}>
                                        <Trash2 size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                    {filteredMedicines.length === 0 && (
                        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                            <Archive size={50} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, marginTop: 10 }}>
                                {filterType === 'All' ? "No medicines found." : `No ${filterType}s found.`}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
            <DetailPopup />
            <AddEditPopup />
            <CustomPicker visible={filterPickerVisible} title="Filter by Type" data={FILTER_DATA} onClose={() => setFilterPickerVisible(false)} onSelect={(val) => setFilterType(val)} theme={theme} colored={true} />
        </View>
    );
};

// --- 4. APPOINTMENT SCREEN ---
const AppointmentScreen = ({ theme, onBack, form, setForm, appointments, setAppointments, patients, setPatients, onSelectPatient, viewMode, setViewMode }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null); 
    const [pickerType, setPickerType] = useState(null); 
    const [pickerMode, setPickerMode] = useState(null); 
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [patientSearch, setPatientSearch] = useState('');
    
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
        if (!form.name || !form.mobile) { Alert.alert("Missing Info", "Patient Name and Mobile are required."); return; }
        
        const finalBlood = form.blood === 'Custom' ? form.customBlood : form.blood;
        const appointmentData = {
            name: form.name,
            mobile: form.mobile,
            email: form.email, 
            time: formatTime(form.timeObj),
            date: formatDate(form.dateObj),
            notes: form.notes || "Regular Visit",
            blood: finalBlood 
        };

        if (editingId) {
            const updated = appointments.map(a => a.id === editingId ? { ...a, ...appointmentData, status: 'upcoming' } : a);
            setAppointments(updated);
            Alert.alert("Success", "Appointment Updated!");
        } else {
            const newAppt = { id: Date.now(), ...appointmentData, status: 'upcoming' };
            let newAppointments = [newAppt, ...appointments];

            if (form.isFollowUp) {
                const followUpAppt = {
                    id: Date.now() + 1,
                    name: form.name,
                    mobile: form.mobile,
                    email: form.email,
                    time: "09:00 AM",
                    date: formatDate(form.followUpObj),
                    notes: "Follow-up Visit",
                    status: 'pending'
                };
                newAppointments = [...newAppointments, followUpAppt];
                Alert.alert("Success", "Appointment & Follow-up Created!");
            } else {
                Alert.alert("Success", "Appointment Booked!");
            }
            setAppointments(newAppointments);
            setActiveTab('upcoming');

            const patientExists = patients.find(p => p.mobile === form.mobile);
            if (!patientExists) {
                const newPatient = {
                    id: Date.now() + 50, 
                    name: form.name,
                    mobile: form.mobile,
                    email: form.email || "", 
                    age: form.age || "N/A",
                    dob: form.dob || "", 
                    gender: form.gender || "M",
                    blood: finalBlood,
                    address: form.address || "",
                    registeredDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    vitalsHistory: []
                };
                setPatients(prev => [newPatient, ...prev]);
            }
        }
        resetForm();
        setEditingId(null);
        setViewMode('list');
    };

    const handleCall = (mobile) => Linking.openURL(`tel:${mobile}`);
    const handleWhatsApp = (mobile) => Linking.openURL(`whatsapp://send?phone=${mobile}&text=Hello, this is regarding your appointment.`);
    const handleComplete = (id) => { Alert.alert("Completed", "Appointment marked as done."); const filtered = appointments.filter(a => a.id !== id); setAppointments(filtered); };
    const handlePending = (id) => { const updated = appointments.map(a => a.id === id ? { ...a, status: 'pending' } : a); setAppointments(updated); Alert.alert("Pending", "Moved to Pending."); };

    const openDatePicker = (mode, currentVal) => {
        setPickerMode(mode);
        const validDate = currentVal instanceof Date ? currentVal : new Date();
        setTempDate(validDate);
        setShowDatePicker(true);
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            setTempDate(selectedDate);
            if (Platform.OS === 'android') saveDateSelection(selectedDate);
        }
    };

    const saveDateSelection = (dateToSave) => {
        const date = dateToSave || tempDate;
        if (pickerMode === 'date') setForm(prev => ({ ...prev, dateObj: date, date: formatDate(date) }));
        else if (pickerMode === 'time') setForm(prev => ({ ...prev, timeObj: date, time: formatTime(date) }));
        else if (pickerMode === 'followup') setForm(prev => ({ ...prev, followUpObj: date, followUpDate: formatDate(date) }));
        else if (pickerMode === 'dob') {
            const age = calculateAge(date);
            setForm(prev => ({ ...prev, dobObj: date, dob: date.toISOString().split('T')[0], age: age }));
        }
        setShowDatePicker(false);
    };

    const handleDelete = (id) => {
        Alert.alert("Delete Appointment", "Remove this booking?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => { const filtered = appointments.filter(a => a.id !== id); setAppointments(filtered); }}]);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            name: item.name, mobile: item.mobile, email: item.email || '', age: '', gender: 'M', address: '', 
            blood: item.blood || 'O+', customBlood: '', date: item.date, time: item.time, notes: item.notes,
            isFollowUp: false, followUpDate: 'Next Week',
            dateObj: new Date(), timeObj: new Date(), followUpObj: new Date(), dob: '', dobObj: new Date()
        });
        setViewMode('new');
    };
    
    const getPatientMatches = () => {
        if(!patientSearch) return [];
        return patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.mobile.includes(patientSearch) || p.id.toString().includes(patientSearch));
    };
    
    const fillPatientData = (p) => {
        setForm(prev => ({
            ...prev,
            name: p.name,
            mobile: p.mobile,
            email: p.email || '',
            age: p.age,
            dob: p.dob || '',
            gender: p.gender,
            blood: p.blood,
            address: p.address || ''
        }));
        setPatientSearch('');
        Keyboard.dismiss();
    };

    const renderList = () => {
        let filteredData = appointments.filter(a => a.status === activeTab);
        if (searchQuery) filteredData = filteredData.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.mobile.includes(searchQuery));

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
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: isActive ? theme.primary : theme.inputBg, borderWidth: 1, borderColor: isActive ? theme.primary : theme.border, alignItems: 'center' }}>
                                <Text style={{ fontWeight: '700', color: isActive ? 'white' : theme.textDim, fontSize: 13 }}>{tab.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <TouchableOpacity activeOpacity={0.9} onPress={() => onSelectPatient(item)} key={item.id} style={{ backgroundColor: theme.cardBg, borderRadius: 18, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.05, shadowRadius: 5, elevation: 3 }}>
                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                    <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingVertical: 10, width: 65, height: 70 }}>
                                        <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>{item.time.split(' ')[0]}</Text>
                                        <Text style={{ fontSize: 11, color: theme.textDim, fontWeight: '600', textTransform: 'uppercase' }}>{item.time.split(' ')[1]}</Text>
                                    </View>
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16, marginBottom: 4 }}>{item.name} <Text style={{fontSize: 12, color: theme.textDim}}>(#{item.id})</Text></Text>
                                            <View style={{flexDirection: 'row', gap: 12 }}>
                                                <TouchableOpacity onPress={() => handleEdit(item)}><Pencil size={18} color={theme.textDim} /></TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                                                {(activeTab === 'upcoming') && <><TouchableOpacity onPress={() => handlePending(item.id)}><Clock size={18} color="#f59e0b" /></TouchableOpacity><TouchableOpacity onPress={() => handleComplete(item.id)}><CheckCircle2 size={18} color="#10b981" /></TouchableOpacity></>}
                                                {(activeTab === 'pending') && <TouchableOpacity onPress={() => handleComplete(item.id)}><CheckCircle2 size={18} color="#10b981" /></TouchableOpacity>}
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
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><AlertCircle size={40} color={theme.textDim} /></View>
                            <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>No Appointments</Text>
                            <Text style={{ color: theme.textDim, fontSize: 14 }}>Try searching or add new.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };

    const renderNewPatient = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {!editingId && (
                <View style={{marginBottom: 25}}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600', fontSize: 12 }}>EASY BOOK (AUTO-FILL)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                        <Search size={18} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput 
                            style={{ flex: 1, color: theme.text, fontSize: 15 }} 
                            placeholder="Search Name, Mobile or ID..." 
                            placeholderTextColor={theme.textDim}
                            value={patientSearch}
                            onChangeText={setPatientSearch}
                        />
                         {patientSearch.length > 0 && <TouchableOpacity onPress={() => setPatientSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                    </View>
                    {patientSearch.length > 0 && (
                        <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, marginTop: 5, borderRadius: 12, overflow: 'hidden' }}>
                            {getPatientMatches().map((p) => (
                                <TouchableOpacity key={p.id} onPress={() => fillPatientData(p)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{p.name} <Text style={{fontSize: 10, color: theme.textDim}}>(#{p.id})</Text></Text>
                                        <Text style={{ color: theme.textDim, fontSize: 12 }}>{p.mobile}</Text>
                                    </View>
                                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                        <Text style={{ fontSize: 10, color: theme.text }}>Select</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {getPatientMatches().length === 0 && <View style={{padding: 15}}><Text style={{color: theme.textDim, fontSize: 12}}>No existing patient found. Fill details below.</Text></View>}
                        </View>
                    )}
                </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 4, height: 20, backgroundColor: theme.primary, borderRadius: 2, marginRight: 10 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Enter patient information</Text>
            </View>
            
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, marginBottom: 15, textTransform: 'uppercase' }}>Basic Information</Text>

            <View style={{ gap: 15, marginBottom: 30 }}>
                <InputGroup icon={User} label="Patient Name *" value={form.name} onChange={t => setForm({...form, name: t})} theme={theme} />
                <InputGroup icon={Phone} label="Mobile Number *" keyboardType="phone-pad" value={form.mobile} onChange={t => setForm({...form, mobile: t})} theme={theme} />
                <InputGroup icon={Mail} label="Email Address" keyboardType="email-address" value={form.email} onChange={t => setForm({...form, email: t})} theme={theme} placeholder="patient@email.com" />

                <View style={{ flexDirection: 'row', gap: 15 }}>
                     <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Date of Birth</Text>
                        <TouchableOpacity onPress={() => openDatePicker('dob', form.dobObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Cake size={20} color={theme.textDim} />
                                <Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.dob || 'Select'}</Text>
                            </View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}><InputGroup icon={Calendar} label="Age" keyboardType="numeric" value={form.age} onChange={t => setForm({...form, age: t})} theme={theme} /></View>
                </View>
                 <View style={{ marginTop: 5 }}>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Blood Group</Text>
                    <TouchableOpacity onPress={() => setPickerType('blood')} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
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
                            <Droplet size={20} color={theme.primary} /><TextInput style={[styles.textInput, { color: theme.text }]} value={form.customBlood} onChangeText={t => setForm({...form, customBlood: t})} placeholder="Type blood group here..." placeholderTextColor={theme.textDim} />
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
                            <View style={{flexDirection: 'row', alignItems: 'center'}}><Calendar size={20} color={theme.textDim} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.date}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Time</Text>
                        <TouchableOpacity onPress={() => openDatePicker('time', form.timeObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}><Clock size={20} color={theme.textDim} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.time}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                </View>

                {!editingId && (
                    <View style={{ backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                        <View><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Follow Up Required?</Text><Text style={{ color: theme.textDim, fontSize: 12 }}>Auto-create next visit record</Text></View>
                        <Switch value={form.isFollowUp} onValueChange={v => setForm({...form, isFollowUp: v})} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor={'white'} />
                    </View>
                )}

                {form.isFollowUp && (
                     <View>
                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Next Visit Date</Text>
                        <TouchableOpacity onPress={() => openDatePicker('followup', form.followUpObj)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.primary, justifyContent: 'space-between', paddingRight: 15 }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}><Calendar size={20} color={theme.primary} /><Text style={{ color: theme.text, marginLeft: 10, fontSize: 16 }}>{form.followUpDate}</Text></View>
                            <ChevronDown size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>
                )}

                <View>
                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Booking Notes</Text>
                    <View style={{ backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 15, minHeight: 120 }}>
                         <TextInput style={{ color: theme.text, fontSize: 16, width: '100%', textAlignVertical: 'top', flex: 1 }} value={form.notes} onChangeText={t => setForm({...form, notes: t})} placeholder="Type complaints, visit reason, or doctor's notes here..." placeholderTextColor={theme.textDim} multiline />
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <CustomPicker visible={pickerType === 'blood'} title="Blood Group" data={BLOOD_GROUPS} onClose={() => setPickerType(null)} onSelect={(val) => setForm({...form, blood: val})} theme={theme} />
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
                    <TouchableOpacity onPress={() => { setViewMode('list'); setEditingId(null); }} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        {viewMode === 'new' ? <X size={24} color={theme.text} /> : <ArrowLeft size={24} color={theme.text} />}
                    </TouchableOpacity>
                )}
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {viewMode === 'list' ? 'Appointments' : editingId ? 'Edit Appointment' : 'New Booking'}
                </Text>
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
                {viewMode === 'new' && renderNewPatient()}
            </KeyboardAvoidingView>
        </View>
    );
};

const InputGroup = ({ icon: Icon, label, value, onChange, theme, multiline, keyboardType, placeholder }) => (
    <View>
        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>{label}</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, height: multiline ? 100 : 55, alignItems: multiline ? 'flex-start' : 'center', paddingVertical: multiline ? 12 : 4 }]}>
            <Icon size={20} color={theme.textDim} style={{ marginTop: multiline ? 2 : 0 }} />
            <TextInput style={[styles.textInput, { color: theme.text, textAlignVertical: multiline ? 'top' : 'center' }]} value={value} onChangeText={onChange} placeholder={placeholder || label} placeholderTextColor={theme.textDim} multiline={multiline} keyboardType={keyboardType || 'default'} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} />
        </View>
    </View>
);

// --- 5. LOGIN SCREEN ---
const LoginScreen = ({ onLogin, theme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const handleLoginPress = () => {
        if(!email || !password) { Alert.alert("Missing Info", "Please enter both Email and Password."); return; }
        setLoading(true);
        setTimeout(() => { setLoading(false); onLogin(); }, 1500);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1, justifyContent: 'center', padding: 25 }}>
                        <View style={[styles.glowTop, { backgroundColor: theme.primary, opacity: 0.1 }]} />
                        <View style={[styles.glowBottom, { backgroundColor: '#10b981', opacity: 0.1 }]} />

                        <Animated.View style={{ alignItems: 'center', marginBottom: 50, opacity: fadeAnim }}>
                            <Animated.View style={{ 
                                width: 100, height: 100, borderRadius: 30, backgroundColor: theme.inputBg, 
                                alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                                transform: [{ scale: pulseAnim }], borderWidth: 1, borderColor: theme.border
                            }}>
                                <Activity size={50} color={theme.primary} />
                            </Animated.View>
                            <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.text }}>Suhaim Soft</Text>
                            <Text style={{ fontSize: 16, color: theme.textDim, marginTop: 5 }}>Doctor's Portal v2.0</Text>
                        </Animated.View>

                        <Animated.View style={{ gap: 20, width: '100%', opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({inputRange:[0,1], outputRange:[50,0]}) }] }}>
                            <View>
                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Email Address</Text>
                                <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                                    <Mail size={20} color={theme.textDim} />
                                    <TextInput style={[styles.textInput, { color: theme.text }]} placeholder="doctor@hospital.com" placeholderTextColor={theme.textDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                </View>
                            </View>

                            <View>
                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Password</Text>
                                <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                                    <Lock size={20} color={theme.textDim} />
                                    <TextInput style={[styles.textInput, { color: theme.text }]} placeholder="Enter your password" placeholderTextColor={theme.textDim} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color={theme.textDim} /> : <Eye size={20} color={theme.textDim} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={{ alignSelf: 'flex-end' }}><Text style={{ color: theme.primary, fontWeight: '600' }}>Forgot Password?</Text></TouchableOpacity>

                            <TouchableOpacity onPress={handleLoginPress} style={{ marginTop: 20 }} activeOpacity={0.8}>
                                <LinearGradient colors={theme.mode === 'dark' ? [theme.primary, theme.primaryDark] : ['#3b82f6', '#2563eb']} style={styles.loginBtn} start={{x:0, y:0}} end={{x:1, y:0}}>
                                    {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Login Securely</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                        <View style={{ marginTop: 50, alignItems: 'center' }}><Text style={{ color: theme.textDim, fontSize: 12 }}>Protected by Suhaim Soft Security</Text></View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
};

// 6. SIDE MENU
const SideMenu = ({ visible, onClose, insets, theme, onNavigate, onLogout }) => {
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  useEffect(() => { 
      if (visible) Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 5 }).start(); 
      else Animated.timing(slideAnim, { toValue: -width * 0.8, duration: 300, useNativeDriver: true }).start(); 
  }, [visible]);

  const handleLogoutPress = () => { Alert.alert("Logout", "Are you sure you want to end your session?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: 'destructive', onPress: () => { onClose(); onLogout(); } }]); };

  if (!visible) return null;
  return (
    <View style={[styles.menuOverlay, { zIndex: 999 }]}>
      <TouchableOpacity style={styles.menuBackdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.menuSidebar, { paddingTop: insets.top, backgroundColor: theme.cardBg, borderRightColor: theme.border, transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.menuHeader}>
            <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                <View style={{width:40, height:40, borderRadius:20, backgroundColor:theme.primary, alignItems:'center', justifyContent:'center'}}><User color="white" size={20} /></View>
                <View><Text style={{color:theme.text, fontWeight:'bold'}}>Dr. Mansoor Ali.VP</Text><Text style={{color:theme.textDim, fontSize:12}}>Cardiologist</Text></View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}><X size={20} color={theme.text} /></TouchableOpacity>
        </View>
        <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            <Text style={[styles.menuSectionTitle, { color: theme.textDim }]}>Management</Text>
            {FEATURES.map((item, index) => { 
                const Icon = item.icon; 
                return (
                    <TouchableOpacity key={index} style={[styles.menuFeatureItem, { borderBottomColor: theme.border }]} onPress={() => { onClose(); onNavigate(item.action); }}>
                        <View style={[styles.menuFeatureIconBox, { backgroundColor: theme.inputBg }]}><Icon size={20} color={theme.primary} /></View>
                        <View style={{ flex: 1 }}><Text style={[styles.menuItemText, { color: theme.text, fontWeight: '600' }]}>{item.title}</Text></View>
                        <ChevronRight size={16} color={theme.textDim} />
                    </TouchableOpacity>
                )
            })}
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleLogoutPress}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                    <View style={[styles.menuFeatureIconBox, { backgroundColor: '#fee2e2' }]}><LogOut size={20} color="#ef4444" /></View>
                    <Text style={[styles.menuItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Logout</Text>
                </View>
            </TouchableOpacity>
            <Text style={[styles.menuVersion, { color: theme.textDim }]}>Suhaim Soft v2.1.0</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// 7. SPLASH SCREEN
const SplashScreen = ({ theme, onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => { const timer = setTimeout(() => { Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onFinish()); }, 2000); return () => clearTimeout(timer); }, []);
    if(fadeAnim._value === 0) return null;
    return (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, zIndex: 9999, alignItems: 'center', justifyContent: 'center', opacity: fadeAnim }]}>
            <View style={{alignItems: 'center'}}>
                <Activity size={80} color={theme.primary} />
                <Text style={{fontSize: 32, fontWeight: 'bold', color: theme.text, marginTop: 20}}>Suhaim Soft</Text>
                <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 40}} />
            </View>
        </Animated.View>
    );
};

// 8. MAIN APP ORCHESTRATOR
const MainApp = () => {
    const insets = useSafeAreaInsets();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentScreen, setCurrentScreen] = useState('home');
    const [menuVisible, setMenuVisible] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [appointmentScreenMode, setAppointmentScreenMode] = useState('list'); 

    // --- STATE PERSISTENCE ---
    const [appointmentForm, setAppointmentForm] = useState(INITIAL_FORM_STATE);
    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
    const [patients, setPatients] = useState(INITIAL_PATIENTS); 
    const [medicines, setMedicines] = useState(INITIAL_MEDICINES); 
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES);

    const theme = isDarkMode ? THEMES.dark : THEMES.light;
    const heroAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => { 
        if(isLoggedIn && currentScreen === 'home') {
             heroAnim.setValue(0);
             Animated.timing(heroAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.exp) }).start(); 
        }
    }, [isLoggedIn, currentScreen]);

    useEffect(() => { const timer = setInterval(() => setCurrentDate(new Date()), 60000); return () => clearInterval(timer); }, []);

    const getFormattedDate = () => currentDate.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const getFormattedTime = () => currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const handleLogin = () => { setIsLoggedIn(true); setCurrentScreen('home'); };
    const handleLogout = () => { setIsLoggedIn(false); setCurrentScreen('home'); };

    const handleBookFromProfile = (patient) => {
        setAppointmentForm({
            ...INITIAL_FORM_STATE,
            name: patient.name,
            mobile: patient.mobile,
            email: patient.email || '',
            age: patient.age,
            blood: patient.blood,
            gender: patient.gender,
            address: patient.address || ''
        });
        setAppointmentScreenMode('new');
        setCurrentScreen('appointment');
    };

    const handleSaveVitals = (patientId, newHistory) => {
        const updatedPatients = patients.map(p => p.id === patientId ? { ...p, vitalsHistory: newHistory } : p);
        setPatients(updatedPatients);
    };

    const handleSelectPatientFromAppt = (appt) => {
        const patient = patients.find(p => p.mobile === appt.mobile || p.name === appt.name);
        if (patient) {
            setSelectedPatientId(patient.id);
            setCurrentScreen('patients');
        } else {
            Alert.alert("Profile Not Found", "This patient is not fully registered yet.");
        }
    };

    const renderContent = () => {
        switch(currentScreen) {
            case 'dashboard':
            case 'home':
                const upcomingList = appointments.filter(a => a.status === 'upcoming');
                const nextAppt = upcomingList.length > 0 ? upcomingList[0] : null;

                return (
                    <View style={{ flex: 1 }}>
                        <View style={[styles.header, { marginTop: insets.top + 10, marginBottom: 10, paddingHorizontal: 20 }]}>
                          <View>
                              <Text style={[styles.greeting, { color: theme.text }]}>Welcome, Dr. Mansoor Ali.VP</Text>
                              <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 4, fontWeight: '500' }}>+91 9895353078</Text>
                              <View style={styles.dateContainer}>
                                  <Text style={[styles.dateText, { color: theme.textDim }]}>{getFormattedDate()}</Text>
                                  <View style={[styles.dot, { backgroundColor: theme.textDim }]} />
                                  <Text style={[styles.timeText, { color: theme.primary }]}>{getFormattedTime()}</Text>
                              </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setIsDarkMode(!isDarkMode)}>
                                  {isDarkMode ? <Sun size={22} color={theme.text} /> : <Moon size={22} color={theme.text} />}
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setMenuVisible(true)}>
                                  <Menu size={24} color={theme.text} />
                              </TouchableOpacity>
                          </View>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
                            <Animated.View style={[styles.heroContainer, { opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
                              <LinearGradient colors={isDarkMode ? [theme.primaryDark, '#1e3a8a'] : ['#3b82f6', '#2563eb']} style={[styles.heroGradient, { borderColor: theme.border }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <View style={styles.heroContent}>
                                    <View style={{ flex: 1, zIndex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>UPCOMING APPOINTMENT</Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => setCurrentScreen('appointment')} 
                                                style={{ paddingHorizontal: 8, paddingVertical: 4, zIndex: 10 }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>View All {'>'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <Text style={styles.surahName}>{nextAppt ? nextAppt.name : "No Appointments"}</Text>
                                        <Text style={styles.ayahInfo}>
                                            {nextAppt 
                                                ? `${nextAppt.time} • ${upcomingList.length - 1 > 0 ? `+${upcomingList.length - 1} others waiting` : '1 waiting'}` 
                                                : "You are all caught up!"}
                                        </Text>
                                    </View>
                                    <Activity size={90} color="rgba(255,255,255,0.15)" style={styles.heroBgIcon} />
                                </View>
                                <View style={styles.heroActions}>
                                    <TouchableOpacity style={styles.resumeBtn} onPress={() => setCurrentScreen('appointment')}>
                                        <Plus size={20} color={theme.primaryDark} />
                                        <Text style={[styles.resumeText, { color: theme.primaryDark }]}>New Appt</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.resumeBtn, {backgroundColor: 'rgba(255,255,255,0.2)'}]} onPress={() => setCurrentScreen('reports')}>
                                        <CheckCircle2 size={20} color="white" />
                                        <Text style={[styles.resumeText, { color: 'white' }]}>Approvals</Text>
                                    </TouchableOpacity>
                                </View>
                              </LinearGradient>
                            </Animated.View>
                
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
                            <View style={styles.grid}>
                                {FEATURES.map((item, index) => (
                                    <FeatureCard 
                                        key={item.id} item={item} index={index} theme={theme} 
                                        onAction={(action) => {
                                            if (action === 'patients') setSelectedPatientId(null);
                                            setCurrentScreen(action);
                                        }} 
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                );
            case 'appointment': 
                return <AppointmentScreen 
                    theme={theme} 
                    onBack={() => setCurrentScreen('home')} 
                    form={appointmentForm} 
                    setForm={setAppointmentForm}
                    appointments={appointments}
                    setAppointments={setAppointments}
                    patients={patients}
                    setPatients={setPatients}
                    onSelectPatient={handleSelectPatientFromAppt}
                    viewMode={appointmentScreenMode} 
                    setViewMode={setAppointmentScreenMode} 
                />;
            case 'patients': 
                return <PatientScreen 
                    theme={theme}
                    onBack={() => {
                        if (selectedPatientId) { setSelectedPatientId(null); setAppointmentScreenMode('list'); setCurrentScreen('appointment'); } 
                        else { setCurrentScreen('home'); }
                    }}
                    patients={patients}
                    setPatients={setPatients}
                    appointments={appointments}
                    setAppointments={setAppointments}
                    selectedPatientId={selectedPatientId}
                    onBookAppointment={handleBookFromProfile}
                    onNavigate={(screen, data) => {
                        if (screen === 'vitals') { setSelectedPatientId(data.id); setCurrentScreen('vitals'); } 
                        else { setCurrentScreen(screen); }
                    }}
                />;
            case 'vitals':
                const patientForVitals = patients.find(p => p.id === selectedPatientId);
                return <VitalsScreen theme={theme} onBack={() => setCurrentScreen('patients')} patient={patientForVitals} onSaveVitals={handleSaveVitals} />;
            case 'medicines': return <MedicineScreen theme={theme} onBack={() => setCurrentScreen('home')} medicines={medicines} setMedicines={setMedicines} />;
            case 'templates': 
                return <TemplateScreen 
                    theme={theme} 
                    onBack={() => setCurrentScreen('home')}
                    templates={templates}
                    setTemplates={setTemplates}
                    medicines={medicines}
                    setMedicines={setMedicines}
                />;
            case 'history': return <PlaceholderScreen title="Patients History" icon={Clock} color={['#8b5cf6', '#7c3aed']} theme={theme} onBack={() => setCurrentScreen('home')} />;
            case 'reports': return <PlaceholderScreen title="Lab Reports" icon={BookOpen} color={['#ec4899', '#db2777']} theme={theme} onBack={() => setCurrentScreen('home')} />;
            case 'procedures': return <PlaceholderScreen title="Procedures" icon={Settings} color={['#6366f1', '#4f46e5']} theme={theme} onBack={() => setCurrentScreen('home')} />;
            default: return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            {isLoading && <SplashScreen theme={theme} onFinish={() => setIsLoading(false)} />}
            {!isLoading && !isLoggedIn && <LoginScreen onLogin={handleLogin} theme={theme} />}
            {!isLoading && isLoggedIn && (
                <>
                    <View style={[styles.glowTop, { backgroundColor: theme.glowTop }]} />
                    <View style={[styles.glowBottom, { backgroundColor: theme.glowBottom }]} />
                    <SideMenu 
                        visible={menuVisible} onClose={() => setMenuVisible(false)} insets={insets} theme={theme} 
                        onNavigate={(screen) => { if (screen === 'patients') setSelectedPatientId(null); setCurrentScreen(screen); }} 
                        onLogout={handleLogout} 
                    />
                    {renderContent()}
                    <BlurView intensity={isDarkMode ? 30 : 80} tint={theme.blurTint} style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 15), borderTopColor: theme.border, backgroundColor: theme.navBg }]}>
                        <View style={[styles.bottomNavLine, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('home')}><Home size={24} color={currentScreen === 'home' ? theme.primary : theme.textDim} /><Text style={[styles.navText, { color: currentScreen === 'home' ? theme.primary : theme.textDim }]}>Home</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('appointment')}><Calendar size={24} color={currentScreen === 'appointment' ? theme.primary : theme.textDim} /><Text style={[styles.navText, { color: currentScreen === 'appointment' ? theme.primary : theme.textDim }]}>Appoint</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('medicines')}><Activity size={24} color={currentScreen === 'medicines' ? theme.primary : theme.textDim} /><Text style={[styles.navText, { color: currentScreen === 'medicines' ? theme.primary : theme.textDim }]}>Pharma</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem} onPress={() => setMenuVisible(true)}><Menu size={24} color={theme.textDim} /><Text style={[styles.navText, { color: theme.textDim }]}>Menu</Text></TouchableOpacity>
                    </BlurView>
                </>
            )}
        </View>
    );
};

export default function App() { return <SafeAreaProvider><MainApp /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 4, height: 55 },
  textInput: { flex: 1, marginLeft: 10, fontSize: 16, height: '100%' },
  loginBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: {width:0, height:8}, shadowOpacity:0.3, shadowRadius:10, elevation:10 },
  glowTop: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, transform: [{ scaleX: 1.5 }] },
  glowBottom: { position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, borderRadius: 150 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  greeting: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 14 },
  timeText: { fontWeight: 'bold', fontSize: 14 },
  dot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heroContainer: { marginHorizontal: 20, height: 190, borderRadius: 24, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, marginBottom: 30 },
  heroGradient: { flex: 1, borderRadius: 24, padding: 20, justifyContent: 'space-between', borderWidth: 1 },
  heroContent: { position: 'relative', flexDirection: 'row', justifyContent: 'space-between' },
  heroBgIcon: { position: 'absolute', right: -10, top: -10, transform: [{ rotate: '-15deg' }] },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  surahName: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  ayahInfo: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  heroActions: { flexDirection: 'row', gap: 12 },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 6 },
  resumeText: { fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  cardContainer: { width: '48%', marginBottom: 15 },
  cardInner: { borderRadius: 20, padding: 16, height: 130, justifyContent: 'space-between', borderWidth: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  cardTextContent: { marginTop: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 11 },
  comingSoonIconContainer: { width: 120, height: 120, borderRadius: 60, elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, marginBottom: 40 },
  comingSoonGradient: { flex: 1, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  comingSoonTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  comingSoonDesc: { fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 40 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 15, borderTopWidth: 1 },
  bottomNavLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  navItem: { alignItems: 'center', gap: 4, padding: 10, minWidth: 50 },
  navText: { fontSize: 10, fontWeight: '500' },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuSidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', borderRightWidth: 1, paddingHorizontal: 20 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  closeBtn: { padding: 5, borderRadius: 8 },
  menuItems: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
  menuItemText: { fontSize: 16 },
  menuDivider: { height: 1, marginVertical: 20 },
  menuVersion: { fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 40 },
  menuSectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  menuFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderBottomWidth: 1 },
  menuFeatureIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
})