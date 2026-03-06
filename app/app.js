import DateTimePicker from '@react-native-community/datetimepicker';
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

// --- IMPORTS FOR EXCEL EXPORT ---
import * as FileSystem from 'expo-file-system'; 
import * as Sharing from 'expo-sharing';

import {
    Activity,
    AlertCircle,
    Archive,
    ArrowLeft,
    Banknote,
    BellRing,
    BookOpen,
    Cake,
    Calendar,
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
    FileSpreadsheet,
    FileText,
    Filter,
    FlaskConical,
    HeartPulse,
    HelpCircle,
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
    Timer,
    Trash2,
    TrendingDown,
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

// --- 3D ANIMATED TOAST COMPONENT ---
const ToastNotification = ({ visible, title, message, type = 'success', onHide, theme }) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: insets.top + 10, useNativeDriver: true, damping: 15, stiffness: 120 }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
            ]).start();

            const timer = setTimeout(() => { hideToast(); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -150, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start(() => { if (onHide) onHide(); });
    };

    if (!visible) return null;

    const config = {
        success: { colors: ['#059669', '#34d399'], icon: CheckCircle2, shadow: '#059669' },
        error: { colors: ['#dc2626', '#f87171'], icon: AlertCircle, shadow: '#dc2626' },
        warning: { colors: ['#d97706', '#fbbf24'], icon: AlertCircle, shadow: '#d97706' },
        info: { colors: ['#2563eb', '#60a5fa'], icon: BellRing, shadow: '#2563eb' }
    }[type] || config.success;

    const Icon = config.icon;

    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }], opacity, shadowColor: config.shadow }]}>
            <LinearGradient colors={config.colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.toastGradient}>
                <View style={styles.toastIconBox}><Icon color="white" size={24} strokeWidth={3} /></View>
                <View style={{flex: 1}}>
                    <Text style={styles.toastTitle}>{title}</Text>
                    <Text style={styles.toastMessage}>{message}</Text>
                </View>
                <TouchableOpacity onPress={hideToast} style={{padding: 5}}><X color="rgba(255,255,255,0.8)" size={18} /></TouchableOpacity>
            </LinearGradient>
        </Animated.View>
    );
};

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
    { id: 101, name: "Sarah Jenkins", mobile: "9876543210", email: "sarah.j@example.com", age: "28", dob: "1996-01-10", gender: "F", blood: "A+", address: "New York, NY", registeredDate: "Jan 10, 2024", vitalsHistory: [ { id: 1, date: new Date().toISOString(), sys: '120', dia: '80', pulse: '72', weight: '65', temp: '36.6', tempUnit: 'C' } ], rxHistory: [] },
    { id: 102, name: "Mike Ross", mobile: "9988776655", email: "mike.ross@law.com", age: "35", dob: "1989-02-01", gender: "M", blood: "O-", address: "Brooklyn, NY", registeredDate: "Feb 01, 2024", vitalsHistory: [], rxHistory: [] },
    { id: 822, name: "Suhaim", mobile: "8891479505", email: "suhaim@example.com", age: "18", dob: "2006-05-15", gender: "M", blood: "O+", address: "Pathappiriyam", registeredDate: "Feb 19, 2026", vitalsHistory: [], rxHistory: [] },
];

const PROCEDURE_CATEGORIES = [
    { label: 'General', value: 'General', color: '#3b82f6', bg: '#eff6ff', icon: Stethoscope },
    { label: 'Dental', value: 'Dental', color: '#06b6d4', bg: '#ecfeff', icon: Sparkles },
    { label: 'Surgery', value: 'Surgery', color: '#ef4444', bg: '#fef2f2', icon: Activity },
    { label: 'Lab Test', value: 'Lab', color: '#8b5cf6', bg: '#f5f3ff', icon: TestTube },
    { label: 'Therapy', value: 'Therapy', color: '#10b981', bg: '#ecfdf5', icon: HeartPulse },
    { label: 'Other', value: 'Other', color: '#64748b', bg: '#f1f5f9', icon: Layers },
];

const INITIAL_PROCEDURES = [
    { id: 1, name: "General Consultation", cost: "500", duration: "15 min", category: "General", notes: "Standard physician checkup", date: new Date().toISOString() },
    { id: 2, name: "Root Canal Treatment", cost: "4500", duration: "60 min", category: "Dental", notes: "Requires anesthesia", date: new Date().toISOString() },
    { id: 3, name: "Blood Sugar (FBS/PP)", cost: "150", duration: "10 min", category: "Lab", notes: "Fasting required for FBS", date: new Date(Date.now() - 86400000).toISOString() }, 
    { id: 4, name: "E.C.G.", cost: "300", duration: "15 min", category: "Lab", notes: "Electrocardiogram", date: new Date(Date.now() - 172800000).toISOString() }, 
    { id: 5, name: "Wound Dressing", cost: "250", duration: "20 min", category: "General", notes: "Includes consumables", date: new Date().toISOString() },
];

const INITIAL_TEMPLATES = [
    { 
        id: 1, 
        name: "Viral Fever Protocol", 
        diagnosis: "Viral Pyrexia", 
        advice: "Drink plenty of fluids (3L/day). Complete bed rest.",
        medicines: [
            { id: 1, name: "Paracetamol", dosage: "1 Tablet (500mg)", freq: "1-1-1", duration: "3 Days", instruction: "After Food", type: "Tablet" },
            { id: 2, name: "Vitamin C", dosage: "1 Tablet (500mg)", freq: "1-0-0", duration: "5 Days", instruction: "After Food", type: "Tablet" }
        ],
        procedures: [],
        nextVisitInvestigations: []
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

// --- DYNAMIC DATA INITIALIZERS ---
const FREQUENCIES_INIT = ["1-0-1", "1-0-0", "0-0-1", "1-1-1", "0-1-0", "SOS", "Once a week", "1-1-1-1"];
const DURATIONS_INIT = ["3 Days", "5 Days", "7 Days", "10 Days", "15 Days", "1 Month", "Continue", "2 Weeks"];
const INSTRUCTIONS_INIT = ["After Food", "Before Food", "With Food", "At Night", "Empty Stomach"];
const DOSAGES_INIT = ["1 Unit", "1/2 Unit", "2 Units", "1 Tablet", "1/2 Tablet", "5 ml", "10 ml", "15 ml", "1 Drop", "2 Drops", "1 Puff"];

const calculateAge = (date) => {
    const diff_ms = Date.now() - date.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970).toString();
};

// --- REUSABLE COMPONENTS ---
const GenderSelector = ({ value, onChange, theme }) => {
    const options = [ { label: 'Male', val: 'M' }, { label: 'Female', val: 'F' }, { label: 'Other', val: 'O' } ];
    return (
        <View style={{ marginBottom: 15 }}>
            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {options.map((opt) => {
                    const isActive = value === opt.val;
                    return (
                        <TouchableOpacity 
                            key={opt.val} onPress={() => onChange(opt.val)}
                            style={{ flex: 1, backgroundColor: isActive ? theme.primary : theme.cardBg, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: isActive ? theme.primary : theme.border }}
                        >
                            <Text style={{ color: isActive ? 'white' : theme.text, fontWeight: 'bold' }}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
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

const InputGroup = ({ icon: Icon, label, value, onChange, theme, multiline, keyboardType, placeholder }) => (
    <View>
        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>{label}</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, height: multiline ? 100 : 55, alignItems: multiline ? 'flex-start' : 'center', paddingVertical: multiline ? 12 : 4 }]}>
            <Icon size={20} color={theme.textDim} style={{ marginTop: multiline ? 2 : 0 }} />
            <TextInput style={[styles.textInput, { color: theme.text, textAlignVertical: multiline ? 'top' : 'center' }]} value={value} onChangeText={onChange} placeholder={placeholder || label} placeholderTextColor={theme.textDim} multiline={multiline} keyboardType={keyboardType || 'default'} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} />
        </View>
    </View>
);

// --- PROCEDURES MANAGEMENT SCREEN (ENHANCED UI/UX) ---
const ProceduresScreen = ({ theme, onBack, procedures, setProcedures, showToast }) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', cost: '', duration: '', category: 'General', notes: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Animation for stats
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Date Filter State
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // Start of current month
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Filtering Logic
    const filteredProcedures = procedures.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesDate = true;
        if (p.date) {
            const pDate = new Date(p.date);
            const start = new Date(startDate); start.setHours(0,0,0,0);
            const end = new Date(endDate); end.setHours(23,59,59,999);
            matchesDate = pDate >= start && pDate <= end;
        }
        return matchesSearch && matchesDate;
    });

    // Calculate Stats
    const totalAmount = filteredProcedures.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
    const getCategoryDetails = (catName) => PROCEDURE_CATEGORIES.find(c => c.value === catName) || PROCEDURE_CATEGORIES[0];

    // Actions
    const openAdd = () => {
        setFormData({ id: null, name: '', cost: '', duration: '', category: 'General', notes: '' });
        setIsEditing(false);
        setModalVisible(true);
    };

    const openEdit = (item) => {
        setFormData({ ...item });
        setIsEditing(true);
        setModalVisible(true);
    };

    const handleExport = async () => {
        try {
            let csvContent = "ID,Name,Category,Cost,Duration,Date,Notes\n";
            filteredProcedures.forEach(item => {
                const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
                const cleanName = item.name.replace(/,/g, ' ');
                const cleanNotes = item.notes ? item.notes.replace(/,/g, ' ') : '';
                csvContent += `${item.id},${cleanName},${item.category},${item.cost},${item.duration},${dateStr},${cleanNotes}\n`;
            });
            const fileName = `Procedures_Report_${new Date().getTime()}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Procedures Report', UTI: 'public.comma-separated-values-text' });
                showToast('Success', 'Export Dialog Opened', 'success');
            } else {
                Alert.alert("Error", "Sharing is not available on this device");
            }
        } catch (error) {
            console.error("Export Error:", error);
            Alert.alert("Export Failed", "Could not generate file.");
        }
    };

    const handleSave = () => {
        if (!formData.name || !formData.cost) {
            Alert.alert("Missing Information", "Procedure Name and Cost are required.");
            return;
        }
        if (isEditing) {
            const updated = procedures.map(p => p.id === formData.id ? formData : p);
            setProcedures(updated);
            showToast('Success', 'Procedure Updated Successfully', 'success');
        } else {
            const newItem = { ...formData, id: Date.now(), date: new Date().toISOString() };
            setProcedures([newItem, ...procedures]);
            showToast('Success', 'New Procedure Added', 'success');
        }
        setModalVisible(false);
    };

    const handleDelete = (id) => {
        Alert.alert("Delete", "Are you sure you want to remove this procedure?", [
            { text: "Cancel" },
            { text: "Delete", style: 'destructive', onPress: () => {
                setProcedures(procedures.filter(p => p.id !== id));
                showToast('Deleted', 'Procedure removed', 'error');
            }}
        ]);
    };

    // Date Picker Handlers
    const onStartDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowStartPicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };
    const onEndDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowEndPicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{flex: 1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Procedures & Services</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim }}>Manage pricing & revenue</Text>
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                    <TouchableOpacity onPress={handleExport} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <FileSpreadsheet size={22} color="#10b981" /> 
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openAdd} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2, marginBottom: 10 }}>
                    <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                    <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search procedure name or category..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                    {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{ flex: 1, backgroundColor: theme.inputBg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                         <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                             <Calendar size={16} color={theme.textDim} />
                             <View>
                                <Text style={{fontSize: 10, color: theme.textDim, fontWeight:'600', textTransform:'uppercase'}}>From</Text>
                                <Text style={{fontSize: 12, fontWeight:'bold', color: theme.text}}>{startDate.toLocaleDateString()}</Text>
                             </View>
                         </View>
                         <ChevronDown size={14} color={theme.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{ flex: 1, backgroundColor: theme.inputBg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                         <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                             <Calendar size={16} color={theme.textDim} />
                             <View>
                                <Text style={{fontSize: 10, color: theme.textDim, fontWeight:'600', textTransform:'uppercase'}}>To</Text>
                                <Text style={{fontSize: 12, fontWeight:'bold', color: theme.text}}>{endDate.toLocaleDateString()}</Text>
                             </View>
                         </View>
                         <ChevronDown size={14} color={theme.textDim} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                 <Animated.View style={{flexDirection: 'row', gap: 12, marginBottom: 20, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({inputRange:[0,1], outputRange:[20,0]}) }] }}>
                     <View style={{flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: "#3b82f6", shadowOffset: {width:0, height:5}, shadowOpacity: 0.2, elevation: 5}}>
                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={{ padding: 15, height: 100, justifyContent: 'space-between' }}>
                             <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems:'flex-start'}}>
                                <View style={{backgroundColor: 'rgba(255,255,255,0.2)', padding:6, borderRadius:8}}><Layers size={18} color="white" /></View>
                                <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold'}}>TOTAL COUNT</Text>
                             </View>
                             <Text style={{color: 'white', fontWeight: 'bold', fontSize: 26}}>{filteredProcedures.length}</Text>
                        </LinearGradient>
                     </View>
                     <View style={{flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: "#10b981", shadowOffset: {width:0, height:5}, shadowOpacity: 0.2, elevation: 5}}>
                        <LinearGradient colors={['#10b981', '#059669']} style={{ padding: 15, height: 100, justifyContent: 'space-between' }}>
                             <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems:'flex-start'}}>
                                <View style={{backgroundColor: 'rgba(255,255,255,0.2)', padding:6, borderRadius:8}}><Banknote size={18} color="white" /></View>
                                <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold'}}>TOTAL REVENUE</Text>
                             </View>
                             <Text style={{color: 'white', fontWeight: 'bold', fontSize: 26}}>₹{totalAmount.toLocaleString()}</Text>
                        </LinearGradient>
                     </View>
                 </Animated.View>

                 {filteredProcedures.map((item, index) => {
                     const cat = getCategoryDetails(item.category);
                     const CatIcon = cat.icon;
                     return (
                         <Animated.View key={item.id} style={{ 
                             backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, marginBottom: 12, 
                             borderWidth: 1, borderColor: theme.border, 
                             borderLeftWidth: 4, borderLeftColor: cat.color,
                             shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, elevation: 2 
                         }}>
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                 <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                                     <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center' }}>
                                         <CatIcon size={22} color={cat.color} />
                                     </View>
                                     <View style={{ flex: 1 }}>
                                         <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.name}</Text>
                                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                             <View style={{ backgroundColor: cat.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                 <Text style={{ fontSize: 10, color: cat.color, fontWeight: 'bold' }}>{item.category}</Text>
                                             </View>
                                         </View>
                                     </View>
                                 </View>
                                 <View style={{ alignItems: 'flex-end' }}>
                                     <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>₹{item.cost}</Text>
                                     <Text style={{ fontSize: 11, color: theme.textDim }}>per unit</Text>
                                 </View>
                             </View>
                             
                             {item.notes ? (
                                <View style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 8, marginBottom: 10 }}>
                                    <Text style={{ color: theme.textDim, fontSize: 12, fontStyle: 'italic' }} numberOfLines={2}>"{item.notes}"</Text>
                                </View>
                             ) : null}

                             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                     <Timer size={14} color={theme.textDim} />
                                     <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '500' }}>{item.duration || '15 min'}</Text>
                                     {item.date && (
                                         <Text style={{ color: theme.textDim, fontSize: 12, marginLeft: 5 }}>• {new Date(item.date).toLocaleDateString()}</Text>
                                     )}
                                 </View>
                                 <View style={{ flexDirection: 'row', gap: 10 }}>
                                     <TouchableOpacity onPress={() => openEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                         <Pencil size={12} color={theme.textDim} />
                                         <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textDim }}>Edit</Text>
                                     </TouchableOpacity>
                                     <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                                         <Trash2 size={12} color="#ef4444" />
                                         <Text style={{ fontSize: 11, fontWeight: '600', color: "#ef4444" }}>Delete</Text>
                                     </TouchableOpacity>
                                 </View>
                             </View>
                         </Animated.View>
                     );
                 })}

                 {filteredProcedures.length === 0 && (
                    <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.6 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                            <Settings size={40} color={theme.textDim} />
                        </View>
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>No procedures found</Text>
                        <Text style={{ color: theme.textDim, marginTop: 5 }}>Try adjusting your search or date range.</Text>
                    </View>
                 )}
            </ScrollView>

            {/* --- ADD/EDIT MODAL --- */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                         <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                         <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, shadowColor: "#000", shadowOpacity:0.3, elevation:20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{isEditing ? 'Edit Procedure' : 'New Procedure'}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><X size={20} color={theme.textDim} /></TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 15 }}>
                                    <InputGroup icon={FileText} label="Procedure Name *" value={formData.name} onChange={t => setFormData({...formData, name: t})} theme={theme} placeholder="e.g. Root Canal" />
                                    <View style={{ flexDirection: 'row', gap: 15 }}>
                                        <View style={{ flex: 1 }}><InputGroup icon={Banknote} label="Cost (₹) *" value={formData.cost} onChange={t => setFormData({...formData, cost: t})} theme={theme} placeholder="500" keyboardType="numeric" /></View>
                                        <View style={{ flex: 1 }}><InputGroup icon={Timer} label="Duration" value={formData.duration} onChange={t => setFormData({...formData, duration: t})} theme={theme} placeholder="e.g. 30 min" /></View>
                                    </View>
                                    <View>
                                        <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Category</Text>
                                        <TouchableOpacity onPress={() => setCategoryPickerVisible(true)} style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border, justifyContent: 'space-between', paddingRight: 15 }]}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                                {(() => {
                                                    const cat = getCategoryDetails(formData.category);
                                                    const CatIcon = cat.icon;
                                                    return <CatIcon size={20} color={cat.color} />;
                                                })()}
                                                <Text style={{ color: theme.text, fontSize: 16 }}>{formData.category}</Text>
                                            </View>
                                            <ChevronDown size={16} color={theme.textDim} />
                                        </TouchableOpacity>
                                    </View>
                                    <InputGroup icon={Clipboard} label="Notes / Description" value={formData.notes} onChange={t => setFormData({...formData, notes: t})} theme={theme} placeholder="Additional details..." multiline />
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={handleSave} style={{ marginTop: 25 }}>
                                <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 18, borderRadius: 18, alignItems: 'center', shadowColor: theme.primary, shadowOffset: {width:0,height:5}, shadowOpacity:0.4, elevation:8 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{isEditing ? 'Save Changes' : 'Add Procedure'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                         </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            
            <CustomPicker visible={categoryPickerVisible} title="Select Category" data={PROCEDURE_CATEGORIES} onClose={() => setCategoryPickerVisible(false)} onSelect={(val) => setFormData({...formData, category: val})} theme={theme} colored={true} />
            {showStartPicker && (
                <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartDateChange} />
            )}
            {showEndPicker && (
                <DateTimePicker value={endDate} mode="date" display="default" onChange={onEndDateChange} />
            )}
        </View>
    );
};

// --- SUPPORT SCREEN ---
const SupportScreen = ({ theme, onBack }) => {
    const insets = useSafeAreaInsets();
    const company = {
        name: "SuhaimSoft",
        email: "info@suhaimsoft.com",
        phone: "+91 8891479505",
        phoneClean: "918891479505"
    };
    const developer = {
        name: "Fouzan",
        phone: "+91 90720 70473",
        phoneClean: "919072070473",
        email: "muhammedfauzan7862@gmail.com"
    };
    const handleCall = (number) => Linking.openURL(`tel:${number}`).catch(() => Alert.alert("Error", "Cannot place call"));
    const handleEmail = (email) => Linking.openURL(`mailto:${email}`).catch(() => Alert.alert("Error", "Cannot open email app"));
    const handleWhatsApp = (number) => Linking.openURL(`whatsapp://send?phone=${number}`).catch(() => Alert.alert("Error", "WhatsApp not installed"));

    const ContactCard = ({ title, data, isDev = false }) => (
        <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.border, shadowColor: "#000", shadowOffset: {width:0, height:5}, shadowOpacity: 0.1, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDev ? '#eff6ff' : '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    {isDev ? <User size={22} color="#2563eb" /> : <Activity size={22} color="#10b981" />}
                </View>
                <View>
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18 }}>{data.name}</Text>
                    <Text style={{ color: theme.textDim, fontSize: 12 }}>{title}</Text>
                </View>
            </View>
            <View style={{ gap: 12 }}>
                <TouchableOpacity onPress={() => handleCall(data.phoneClean)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Phone size={18} color={theme.primary} style={{ marginRight: 12 }} />
                    <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>{data.phone}</Text>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>CALL</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleWhatsApp(data.phoneClean)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <MessageCircle size={18} color="#25D366" style={{ marginRight: 12 }} />
                    <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }}>WhatsApp Support</Text>
                    <Text style={{ color: '#25D366', fontSize: 12, fontWeight: 'bold' }}>CHAT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEmail(data.email)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Mail size={18} color="#f59e0b" style={{ marginRight: 12 }} />
                    <Text style={{ color: theme.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>{data.email}</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 'bold' }}>MAIL</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Support & Help</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.inputBg, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 1, borderColor: theme.border }}>
                        <HelpCircle size={40} color={theme.primary} />
                    </View>
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>How can we help you?</Text>
                    <Text style={{ color: theme.textDim, textAlign: 'center', marginTop: 5 }}>Contact our support team or developer directly for assistance.</Text>
                </View>
                <ContactCard title="Technical Support Team" data={company} />
                <ContactCard title="Lead Developer" data={developer} isDev={true} />
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: theme.textDim, fontSize: 12 }}>Suhaim Soft v2.0</Text>
                </View>
            </ScrollView>
        </View>
    );
};

// --- UPDATED TEMPLATE SCREEN ---
const TemplateScreen = ({ theme, onBack, templates, setTemplates, medicines, setMedicines, procedures, setProcedures, showToast, isPrescription = false, patient, onSavePrescription }) => {
    const insets = useSafeAreaInsets();
    const [view, setView] = useState('list'); 
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State - Added 'nextVisitInvestigations'
    const [editorForm, setEditorForm] = useState({ 
        id: null, name: '', diagnosis: '', advice: '', 
        medicines: [], procedures: [], nextVisitInvestigations: [] 
    });
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    
    // View Modal State
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Medicine Picker Modal State
    const [medModalVisible, setMedModalVisible] = useState(false);
    const [medSearch, setMedSearch] = useState('');

    // --- PROCEDURE / INVESTIGATION STATES ---
    const [procModalVisible, setProcModalVisible] = useState(false);
    const [procModalType, setProcModalType] = useState('procedure'); // 'procedure' or 'investigation'
    const [procSearch, setProcSearch] = useState('');
    const [procViewMode, setProcViewMode] = useState('list'); // 'list' | 'add_master' | 'edit_master'
    const [showCustomInput, setShowCustomInput] = useState(false);
    
    // Form for Adding/Editing Master Procedure
    const [masterProcForm, setMasterProcForm] = useState({ id: null, name: '', cost: '', category: 'General' });
    
    // Form for Custom (One-off)
    const [customProcForm, setCustomProcForm] = useState({ name: '', cost: '' });

    // Template Selection Modal for Rx Writer
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templatePickerSearch, setTemplatePickerSearch] = useState('');
    
    // Dynamic Arrays
    const [freqOptions, setFreqOptions] = useState(FREQUENCIES_INIT);
    const [durOptions, setDurOptions] = useState(DURATIONS_INIT);
    const [instrOptions, setInstrOptions] = useState(INSTRUCTIONS_INIT);
    const [doseOptions, setDoseOptions] = useState(DOSAGES_INIT);

    // Input Modal State
    const [inputVisible, setInputVisible] = useState(false);
    const [inputCategory, setInputCategory] = useState(null);
    const [inputText, setInputText] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newMedForm, setNewMedForm] = useState({ 
        inventoryId: null, name: '', content: '', type: 'Tablet', 
        doseQty: '', freq: '', duration: '', instruction: '', isTapering: false
    });
    const [editingMedIndex, setEditingMedIndex] = useState(null);

    useEffect(() => {
        if (isPrescription) {
            setView('edit');
            setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [] });
        }
    }, [isPrescription]);

    const applyTemplate = (template) => {
        setEditorForm(prev => ({
            ...prev,
            diagnosis: template.diagnosis || prev.diagnosis,
            advice: template.advice || prev.advice,
            medicines: [...prev.medicines, ...template.medicines],
            procedures: [...prev.procedures, ...(template.procedures || [])],
            // Assuming templates might have investigations in future, for now empty or spread if added to template structure
            nextVisitInvestigations: [...prev.nextVisitInvestigations, ...(template.nextVisitInvestigations || [])]
        }));
        setShowTemplatePicker(false);
        showToast('Applied', `${template.name} loaded successfully`, 'info');
    };

    const handleEdit = (item) => {
        setEditorForm({ 
            ...item, 
            medicines: [...item.medicines], 
            procedures: [...(item.procedures || [])],
            nextVisitInvestigations: [...(item.nextVisitInvestigations || [])]
        });
        setView('edit');
    };

    const handleCreate = () => {
        setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [] });
        setView('edit');
    };

    const handleSaveTemplate = () => {
        if (!isPrescription && !editorForm.name) { Alert.alert("Required", "Please enter a Template Name."); return; }
        
        if (isPrescription) {
            if (editorForm.medicines.length === 0 && !editorForm.advice && editorForm.procedures.length === 0 && editorForm.nextVisitInvestigations.length === 0) {
                Alert.alert("Empty", "Please add medicines, procedures, investigations or advice."); return;
            }
            onSavePrescription({
                ...editorForm,
                patientId: patient.id,
                date: new Date().toISOString()
            });

            if (saveAsTemplate && editorForm.name) {
                 const newTemplate = { ...editorForm, id: Date.now() };
                 setTemplates([newTemplate, ...templates]);
                 showToast('Saved', 'Prescription & New Template Saved!', 'success');
            }
            return;
        }

        let updatedTemplates;
        if (editorForm.id) {
            updatedTemplates = templates.map(t => t.id === editorForm.id ? editorForm : t);
            showToast('Success', 'Template Updated Successfully!', 'success');
        } else {
            const newTemplate = { ...editorForm, id: Date.now() };
            updatedTemplates = [newTemplate, ...templates];
            showToast('Success', 'New Template Created!', 'success');
        }
        setTemplates(updatedTemplates);
        setView('list');
    };

    const handleDeleteTemplate = (id) => {
        Alert.alert("Delete", "Remove this template?", [{text: "Cancel"}, {text: "Delete", style: 'destructive', onPress: () => {
            setTemplates(templates.filter(t => t.id !== id));
            showToast('Deleted', 'Template removed.', 'error');
        }}]);
    };

    const openTemplateDetails = (t) => {
        setSelectedTemplate(t);
        setViewModalVisible(true);
    };

    // --- PROCEDURE / INVESTIGATION LOGIC ---
    
    // Add item to form (Handles both Procedures and Investigations)
    const addProcedureToForm = (proc) => {
        const targetList = procModalType === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const newItem = { ...proc, id: Date.now() }; // New ID for the instance in Rx

        setEditorForm(prev => ({
             ...prev,
             [targetList]: [...prev[targetList], newItem]
        }));
        
        setProcModalVisible(false);
        showToast('Added', `${procModalType === 'investigation' ? 'Investigation' : 'Procedure'} added`, 'success');
    };

    // Save New/Edited Master Procedure (Inventory)
    const handleSaveMasterProcedure = () => {
        if(!masterProcForm.name) {
            Alert.alert("Missing Info", "Name is required.");
            return;
        }
        
        if (masterProcForm.id) {
            const updated = procedures.map(p => p.id === masterProcForm.id ? masterProcForm : p);
            setProcedures(updated);
            showToast('Updated', 'Master list updated', 'success');
        } else {
            const newProc = { ...masterProcForm, id: Date.now(), category: masterProcForm.category || 'General' };
            setProcedures([newProc, ...procedures]);
            showToast('Created', 'New item added to master list', 'success');
        }
        setProcViewMode('list');
    };

    const handleDeleteMasterProcedure = (id) => {
        Alert.alert("Delete", "Permanently remove from master list?", [
            { text: "Cancel" },
            { text: "Delete", style: 'destructive', onPress: () => {
                setProcedures(procedures.filter(p => p.id !== id));
                showToast('Deleted', 'Item removed', 'error');
            }}
        ]);
    };

    // Add One-Off Custom Item
    const addCustomToRx = () => {
        if (!customProcForm.name) {
            Alert.alert("Missing Info", "Name is required");
            return;
        }
        const customProc = {
            id: Date.now(),
            name: customProcForm.name,
            cost: customProcForm.cost || '0',
            category: 'Custom'
        };
        addProcedureToForm(customProc);
        setCustomProcForm({ name: '', cost: '' });
        setShowCustomInput(false);
    };

    // Generic remover
    const removeItemFromForm = (index, type) => {
        const targetList = type === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const updated = [...editorForm[targetList]];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, [targetList]: updated });
    };

    const calculateTotalCost = () => {
        return editorForm.procedures.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
    };

    const openAddMasterProc = () => {
        setMasterProcForm({ id: null, name: '', cost: '', category: 'General' });
        setProcViewMode('add_master');
    };

    const openEditMasterProc = (item) => {
        setMasterProcForm({ ...item });
        setProcViewMode('edit_master');
    };

    // Open Modal Helpers
    const openProcedureModal = () => {
        setProcModalType('procedure');
        setProcViewMode('list');
        setProcSearch('');
        setShowCustomInput(false);
        setProcModalVisible(true);
    };

    const openInvestigationModal = () => {
        setProcModalType('investigation');
        setProcViewMode('list');
        setProcSearch('');
        setShowCustomInput(false);
        setProcModalVisible(true);
    };
    // --- END PROCEDURE LOGIC ---

    const removeMedFromTemplate = (index) => {
        const updated = [...editorForm.medicines];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, medicines: updated });
    };

    const handleEditMedInTemplate = (index) => {
        const med = editorForm.medicines[index];
        setNewMedForm({
            inventoryId: med.inventoryId || null,
            name: med.name, content: med.content, type: med.type,
            doseQty: med.doseQty || '', freq: med.freq, duration: med.duration,
            instruction: med.instruction, isTapering: med.isTapering || false
        });
        setEditingMedIndex(index);
        setMedModalVisible(true);
    };

    const openMedModal = () => {
        setEditingMedIndex(null);
        setNewMedForm({ 
            inventoryId: null, name: '', content: '', type: 'Tablet', 
            doseQty: '', freq: '', duration: '', instruction: '', isTapering: false
        });
        setMedSearch('');
        setMedModalVisible(true);
    };

    const addMedToTemplate = () => {
        if (!newMedForm.name) return;
        let finalDosage = '';
        if (newMedForm.isTapering) {
            finalDosage = "Tapering Dose";
        } else {
            if(!newMedForm.doseQty) { Alert.alert("Select Dosage", "Please select a Dose Amount."); return; }
            finalDosage = `${newMedForm.doseQty} (${newMedForm.content})`;
        }
        if(!newMedForm.freq || !newMedForm.duration) { Alert.alert("Missing Details", "Please select Frequency and Duration."); return; }

        const medObject = { 
            ...newMedForm, 
            dosage: finalDosage, 
            id: editingMedIndex !== null ? editorForm.medicines[editingMedIndex].id : Date.now() 
        };

        if (editingMedIndex !== null) {
            const updatedMeds = [...editorForm.medicines];
            updatedMeds[editingMedIndex] = medObject;
            setEditorForm({ ...editorForm, medicines: updatedMeds });
        } else {
            setEditorForm({ ...editorForm, medicines: [...editorForm.medicines, medObject] });
        }
        setMedModalVisible(false);
    };

    const selectInventoryMed = (med) => {
        setNewMedForm({ 
            ...newMedForm, inventoryId: med.id, name: med.name, type: med.type, content: med.content,
            doseQty: '', isTapering: false
        });
        setMedSearch('');
    };

    const clearSelection = () => {
        setNewMedForm({
            ...newMedForm, inventoryId: null, name: '', content: '', type: 'Tablet', isTapering: false
        });
    };

    const openAddInput = (category, isEdit = false, value = '') => {
        setInputCategory(category);
        setInputText(value);
        setEditingItem(isEdit ? value : null);
        setInputVisible(true);
    };

    const handleAddItem = () => {
        if (!inputText.trim()) { setInputVisible(false); return; }
        const updateList = (list, setList) => {
            if (editingItem) { setList(list.map(i => i === editingItem ? inputText : i)); } 
            else { setList([...list, inputText]); }
        };
        if (inputCategory === 'freq') updateList(freqOptions, setFreqOptions);
        else if (inputCategory === 'dur') updateList(durOptions, setDurOptions);
        else if (inputCategory === 'instr') updateList(instrOptions, setInstrOptions);
        else if (inputCategory === 'dose') updateList(doseOptions, setDoseOptions);
        setInputVisible(false);
    };

    const handleDeleteItem = (category, item) => {
        if (category === 'freq') setFreqOptions(freqOptions.filter(i => i !== item));
        else if (category === 'dur') setDurOptions(durOptions.filter(i => i !== item));
        else if (category === 'instr') setInstrOptions(instrOptions.filter(i => i !== item));
        else if (category === 'dose') setDoseOptions(doseOptions.filter(i => i !== item));
    };

    const handleLongPressItem = (category, item) => {
        Alert.alert("Manage Item", `Choose action for "${item}"`, [
            { text: "Cancel", style: "cancel" },
            { text: "Edit", onPress: () => openAddInput(category, true, item) },
            { text: "Delete", style: "destructive", onPress: () => handleDeleteItem(category, item) }
        ]);
    };

    const renderList = () => {
        const filtered = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));
        return (
            <View style={{ flex: 1 }}>
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
                        <TouchableOpacity activeOpacity={0.9} onPress={() => openTemplateDetails(item)} style={{ marginBottom: 20 }}>
                            <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, shadowColor: theme.primary, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 15, elevation: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                                <LinearGradient colors={index % 2 === 0 ? ['#2dd4bf', '#0f766e'] : ['#8b5cf6', '#6d28d9']} start={{x:0, y:0}} end={{x:1, y:0}} style={{ padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10 }}><FileText size={18} color="white" /></View>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                                    </View>
                                </LinearGradient>
                                <View style={{ padding: 15 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <Stethoscope size={16} color={theme.primary} />
                                        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>{item.diagnosis}</Text>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        {item.medicines.slice(0, 2).map((med, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.inputBg, padding: 8, borderRadius: 8 }}>
                                                <Pencil size={14} color={theme.textDim} />
                                                <Text style={{ color: theme.textDim, fontSize: 12, flex: 1, fontWeight: '500' }}>
                                                    {med.name} <Text style={{ fontSize: 10 }}>({med.dosage})</Text>
                                                </Text>
                                            </View>
                                        ))}
                                        {item.medicines.length > 2 && <Text style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold', marginLeft: 5 }}>+ {item.medicines.length - 2} more medicines</Text>}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: theme.border }}>
                                        <TouchableOpacity onPress={() => openTemplateDetails(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe', padding: 10, borderRadius: 10, gap: 5 }}><Eye size={16} color="#0284c7" /><Text style={{ color: '#0284c7', fontWeight: 'bold', fontSize: 13 }}>View</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleEdit(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffedd5', padding: 10, borderRadius: 10, gap: 5 }}><Pencil size={16} color="#ea580c" /><Text style={{ color: "#ea580c", fontWeight: 'bold', fontSize: 13 }}>Edit</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteTemplate(item.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 10, borderRadius: 10 }}><Trash2 size={16} color="#dc2626" /></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 50, opacity: 0.6 }}><Sparkles size={60} color={theme.textDim} /><Text style={{ color: theme.textDim, marginTop: 15, fontSize: 16 }}>Create your first prescription template</Text></View>}
                />
            </View>
        );
    };

    const renderVitalsSummary = () => {
        const latestVitals = patient?.vitalsHistory && patient.vitalsHistory.length > 0 ? patient.vitalsHistory[0] : null;
        if (!latestVitals) return (
            <View style={{marginBottom: 20, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, flexDirection:'row', alignItems:'center', gap: 10, borderStyle:'dashed', borderWidth:1, borderColor: theme.border}}>
                <Activity size={20} color={theme.textDim} />
                <Text style={{color: theme.textDim, fontSize: 13}}>No vitals recorded for this patient.</Text>
            </View>
        );
        const VitalItem = ({ label, value, unit, icon: Icon, color }) => (
            <View style={{backgroundColor: theme.cardBg, borderRadius: 10, padding: 8, flex: 1, alignItems:'center', borderWidth: 1, borderColor: theme.border, minWidth: 70}}>
                <View style={{flexDirection:'row', alignItems:'center', gap: 4, marginBottom: 4}}>
                    <Icon size={12} color={color} />
                    <Text style={{fontSize: 10, color: theme.textDim, fontWeight:'bold', textTransform:'uppercase'}}>{label}</Text>
                </View>
                <Text style={{fontSize: 14, fontWeight:'bold', color: theme.text}}>{value || '--'} <Text style={{fontSize: 10, fontWeight:'normal'}}>{unit}</Text></Text>
            </View>
        );
        return (
            <View style={{ marginBottom: 20 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>VITALS (AUTO-FILLED)</Text>
                    <Text style={{ fontSize: 10, color: theme.textDim }}>{new Date(latestVitals.date).toLocaleDateString()}</Text>
                 </View>
                 <View style={{ flexDirection:'row', gap: 8, flexWrap:'wrap' }}>
                     {latestVitals.sys && <VitalItem label="BP" value={`${latestVitals.sys}/${latestVitals.dia}`} unit="mmHg" icon={Activity} color="#ef4444" />}
                     {latestVitals.pulse && <VitalItem label="Pulse" value={latestVitals.pulse} unit="bpm" icon={HeartPulse} color="#8b5cf6" />}
                     {latestVitals.temp && <VitalItem label="Temp" value={latestVitals.temp} unit={`°${latestVitals.tempUnit||'C'}`} icon={Thermometer} color="#f59e0b" />}
                     {latestVitals.weight && <VitalItem label="Weight" value={latestVitals.weight} unit="kg" icon={Weight} color="#10b981" />}
                     {latestVitals.spo2 && <VitalItem label="SpO2" value={latestVitals.spo2} unit="%" icon={Droplet} color="#0ea5e9" />}
                 </View>
            </View>
        );
    };

    const renderEditor = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {isPrescription && (
                <View style={{ marginBottom: 20 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <View>
                             <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>{patient.name}</Text>
                             <Text style={{ color: theme.textDim }}>{patient.age} Yrs • {patient.gender === 'M' ? 'Male' : 'Female'} • ID: #{patient.id}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                             <Text style={{ fontSize: 12, color: theme.textDim }}>Date</Text>
                             <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{new Date().toLocaleDateString()}</Text>
                        </View>
                     </View>
                     <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 15 }} />
                     {renderVitalsSummary()}
                     
                     <TouchableOpacity 
                        onPress={() => setShowTemplatePicker(true)}
                        style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.primary, marginBottom: 20 }}
                     >
                         <Copy size={18} color={theme.primary} />
                         <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Load from Template</Text>
                     </TouchableOpacity>
                </View>
            )}

            {!isPrescription && (
                 <View style={{ marginBottom: 25, backgroundColor: theme.cardBg, borderRadius: 20, padding: 5, shadowColor: theme.primary, shadowOffset: {width:0, height:4}, shadowOpacity:0.2, elevation:5 }}>
                    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ borderRadius: 16, padding: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>RX TEMPLATE</Text>
                            <FileText size={24} color="rgba(255,255,255,0.3)" />
                        </View>
                    </LinearGradient>
                     <View style={{ padding: 15 }}>
                        <InputGroup icon={FileText} label="Template Name *" value={editorForm.name} onChange={t => setEditorForm({...editorForm, name: t})} theme={theme} placeholder="e.g. Viral Fever" />
                     </View>
                 </View>
            )}

            <View style={{ marginBottom: 20 }}>
                <InputGroup icon={Stethoscope} label="Diagnosis / Clinical Notes" value={editorForm.diagnosis} onChange={t => setEditorForm({...editorForm, diagnosis: t})} theme={theme} placeholder="e.g. Viral Pyrexia, URTI" />
            </View>

            {/* --- MEDICINES SECTION --- */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pill size={16} color={theme.textDim} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>MEDICINES (Rx)</Text>
                </View>
                <TouchableOpacity onPress={openMedModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Medicine</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {editorForm.medicines.map((med, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bae6fd' }}><Text style={{fontWeight:'bold', color:'#0ea5e9'}}>{index + 1}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{med.name} <Text style={{fontSize: 13, fontWeight: '500', color: theme.textDim}}>{med.dosage ? `(${med.dosage})` : ''}</Text></Text>
                            {med.isTapering ? (
                                <View style={{ marginTop: 6, backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2}}><TrendingDown size={12} color="#c2410c" /><Text style={{ fontSize: 11, fontWeight: 'bold', color: '#c2410c' }}>Tapering Schedule</Text></View>
                                    <Text style={{ fontSize: 12, color: '#9a3412', fontStyle: 'italic' }}>{med.freq} for {med.duration}</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: '#fdf2f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fbcfe8' }}><Text style={{ fontSize: 11, color: '#db2777', fontWeight: 'bold' }}>{med.freq}</Text></View>
                                    <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' }}><Text style={{ fontSize: 11, color: '#059669', fontWeight: 'bold' }}>{med.duration}</Text></View>
                                    <Text style={{ fontSize: 11, color: theme.textDim, fontStyle: 'italic' }}>{med.instruction}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => handleEditMedInTemplate(index)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 10, marginRight: 5 }}><Pencil size={18} color={theme.textDim} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMedFromTemplate(index)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                ))}
                {editorForm.medicines.length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No medicines added yet.</Text></View>}
            </View>

            {/* --- PROCEDURES SECTION --- */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Settings size={16} color={theme.textDim} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>PROCEDURES / SERVICES</Text>
                </View>
                <TouchableOpacity onPress={openProcedureModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Procedure</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {(editorForm.procedures || []).map((proc, index) => (
                     <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{proc.name}</Text>
                            <Text style={{ fontSize: 13, color: theme.textDim }}>Category: {proc.category}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                             <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>₹{proc.cost}</Text>
                             <TouchableOpacity onPress={() => removeItemFromForm(index, 'procedure')} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                        </View>
                    </View>
                ))}
                {(editorForm.procedures || []).length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No procedures added.</Text></View>}
                {(editorForm.procedures || []).length > 0 && (
                    <View style={{ alignItems: 'flex-end', marginTop: 5 }}>
                        <Text style={{ color: theme.textDim, fontSize: 12 }}>Total Estimated Cost: <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>₹{calculateTotalCost()}</Text></Text>
                    </View>
                )}
            </View>

            {/* --- INVESTIGATIONS ON NEXT VISIT SECTION (NEW) --- */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TestTube size={16} color={theme.textDim} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>INVESTIGATION ON NEXT VISIT</Text>
                </View>
                <TouchableOpacity onPress={openInvestigationModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.inputBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.border }}>
                    <PlusCircle size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Add Investigation</Text>
                </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginBottom: 25 }}>
                {(editorForm.nextVisitInvestigations || []).map((item, index) => (
                     <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity:0.05, elevation:2 }}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                            <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0f9ff', alignItems:'center', justifyContent:'center'}}>
                                <TestTube size={16} color="#0284c7" />
                            </View>
                            <View>
                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{item.name}</Text>
                                <Text style={{ fontSize: 12, color: theme.textDim }}>Next Visit</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeItemFromForm(index, 'investigation')} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                    </View>
                ))}
                {(editorForm.nextVisitInvestigations || []).length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No investigations added.</Text></View>}
            </View>

            <InputGroup icon={Clipboard} label="Advice / Notes" value={editorForm.advice} onChange={t => setEditorForm({...editorForm, advice: t})} theme={theme} multiline placeholder="Enter patient advice (e.g., Drink warm water)..." />
            
            {isPrescription && (
                <View style={{ marginTop: 20, backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                    <View style={{flex: 1}}>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Save as New Template</Text>
                        <Text style={{ color: theme.textDim, fontSize: 12 }}>Use this combination later</Text>
                        {saveAsTemplate && (
                             <TextInput 
                                style={{ marginTop: 8, padding: 8, backgroundColor: theme.inputBg, borderRadius: 8, color: theme.text, borderWidth:1, borderColor: theme.border }}
                                placeholder="Enter Template Name..."
                                placeholderTextColor={theme.textDim}
                                value={editorForm.name}
                                onChangeText={(t) => setEditorForm({...editorForm, name: t})}
                             />
                        )}
                    </View>
                    <Switch value={saveAsTemplate} onValueChange={setSaveAsTemplate} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor={'white'} />
                </View>
            )}

            {isPrescription && (
                <View style={{ marginTop: 40, alignItems: 'flex-end', opacity: 0.7 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>Dr. Mansoor Ali V. P.</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim }}>Cardiologist</Text>
                </View>
            )}
        </ScrollView>
    );

    const ManageableOptionList = ({ data, selectedValue, onSelect, onAdd, onLongPress, color }) => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 10 }}>
            <TouchableOpacity 
                onPress={onAdd}
                style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}
            >
                <Plus size={18} color={theme.textDim} />
            </TouchableOpacity>
            {data.map((item, index) => {
                const isSelected = selectedValue === item;
                const activeColor = color || theme.primary;
                return (
                    <TouchableOpacity 
                        key={index} onPress={() => onSelect(item)} onLongPress={() => onLongPress(item)} delayLongPress={500}
                        style={{ backgroundColor: isSelected ? activeColor : theme.cardBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: isSelected ? activeColor : theme.border, shadowColor: isSelected ? activeColor : "#000", shadowOpacity: isSelected ? 0.3 : 0, elevation: 3 }}
                    >
                        <Text style={{ color: isSelected ? 'white' : theme.text, fontWeight: 'bold' }}>{item}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    const renderMedModal = () => {
        const inventoryMatches = medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()) && medSearch.length > 0);
        const isLocked = newMedForm.inventoryId !== null;

        return (
            <Modal visible={medModalVisible} animationType="slide" transparent onRequestClose={() => setMedModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                         <TouchableOpacity style={{ flex: 1 }} onPress={() => setMedModalVisible(false)} />
                         <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '90%', shadowColor: "#000", shadowOffset: {width:0, height:-10}, shadowOpacity:0.3, elevation:20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{editingMedIndex !== null ? 'Update Medicine' : 'Add Medicine'}</Text>
                                <TouchableOpacity onPress={() => setMedModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><X size={20} color={theme.textDim} /></TouchableOpacity>
                            </View>

                            {!isLocked && (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600', fontSize: 12, letterSpacing: 1 }}>SEARCH INVENTORY</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: theme.primary }}>
                                        <Search size={20} color={theme.primary} style={{ marginRight: 10 }} />
                                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Type medicine name..." placeholderTextColor={theme.textDim} value={medSearch} onChangeText={setMedSearch} />
                                        {medSearch.length > 0 && <TouchableOpacity onPress={() => setMedSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                                    </View>
                                    {medSearch.length > 0 && inventoryMatches.length > 0 && (
                                        <View style={{ maxHeight: 200, borderWidth: 1, borderColor: theme.border, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden', backgroundColor: theme.cardBg, elevation: 5 }}>
                                            <FlatList data={inventoryMatches} keyExtractor={item => item.id.toString()} nestedScrollEnabled renderItem={({item}) => (
                                                    <TouchableOpacity onPress={() => selectInventoryMed(item)} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <View>
                                                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                                            <Text style={{ color: theme.textDim, fontSize: 12 }}>{item.content} • {item.type}</Text>
                                                        </View>
                                                        <PlusCircle size={20} color={theme.primary} />
                                                    </TouchableOpacity>
                                            )} />
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 20 }}>
                                    {isLocked && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.primary }}>
                                            <View>
                                                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>SELECTED MEDICINE</Text>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 18 }}>{newMedForm.name}</Text>
                                            </View>
                                            <TouchableOpacity onPress={clearSelection} style={{ backgroundColor: theme.cardBg, padding: 8, borderRadius: 10 }}><X size={18} color="#ef4444" /></TouchableOpacity>
                                        </View>
                                    )}
                                    
                                    <View style={{ flexDirection: 'row', gap: 15 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Content/Strength</Text>
                                            <View style={{ height: 50, backgroundColor: theme.inputBg, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: theme.border, opacity: 0.7 }}>
                                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{newMedForm.content || 'N/A'}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Type</Text>
                                            <View style={{ height: 50, backgroundColor: theme.inputBg, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: theme.border, opacity: 0.7 }}>
                                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{newMedForm.type || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                                        <View>
                                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Tapering / Complex Dose?</Text>
                                            <Text style={{ color: theme.textDim, fontSize: 12 }}>Enable complex dosage schedule</Text>
                                        </View>
                                        <Switch value={newMedForm.isTapering} onValueChange={v => setNewMedForm({...newMedForm, isTapering: v})} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor={'white'} />
                                    </View>

                                    {newMedForm.isTapering ? (
                                        <View style={{ gap: 20, backgroundColor: 'rgba(234, 88, 12, 0.05)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.2)' }}>
                                            <Text style={{ color: '#ea580c', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', marginBottom: 5 }}>TAPERING SCHEDULE</Text>
                                            <View>
                                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Frequency Pattern</Text>
                                                <ManageableOptionList data={freqOptions} selectedValue={newMedForm.freq} onSelect={(val) => setNewMedForm({...newMedForm, freq: val})} onAdd={() => openAddInput('freq')} onLongPress={(val) => handleLongPressItem('freq', val)} color="#ea580c" />
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>For Duration</Text>
                                                <ManageableOptionList data={durOptions} selectedValue={newMedForm.duration} onSelect={(val) => setNewMedForm({...newMedForm, duration: val})} onAdd={() => openAddInput('dur')} onLongPress={(val) => handleLongPressItem('dur', val)} color="#f97316" />
                                            </View>
                                        </View>
                                    ) : (
                                        <>
                                            <View>
                                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Dose Amount</Text>
                                                <ManageableOptionList data={doseOptions} selectedValue={newMedForm.doseQty} onSelect={(val) => setNewMedForm({...newMedForm, doseQty: val})} onAdd={() => openAddInput('dose')} onLongPress={(val) => handleLongPressItem('dose', val)} color="#06b6d4" />
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Frequency</Text>
                                                <ManageableOptionList data={freqOptions} selectedValue={newMedForm.freq} onSelect={(val) => setNewMedForm({...newMedForm, freq: val})} onAdd={() => openAddInput('freq')} onLongPress={(val) => handleLongPressItem('freq', val)} />
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Duration</Text>
                                                <ManageableOptionList data={durOptions} selectedValue={newMedForm.duration} onSelect={(val) => setNewMedForm({...newMedForm, duration: val})} onAdd={() => openAddInput('dur')} onLongPress={(val) => handleLongPressItem('dur', val)} color="#8b5cf6" />
                                            </View>
                                            <View>
                                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Instructions</Text>
                                                <ManageableOptionList data={instrOptions} selectedValue={newMedForm.instruction} onSelect={(val) => setNewMedForm({...newMedForm, instruction: val})} onAdd={() => openAddInput('instr')} onLongPress={(val) => handleLongPressItem('instr', val)} color="#f59e0b" />
                                            </View>
                                        </>
                                    )}
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={addMedToTemplate} style={{ marginTop: 25 }}>
                                <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 18, borderRadius: 18, alignItems: 'center', shadowColor: theme.primary, shadowOffset: {width:0,height:5}, shadowOpacity:0.4, elevation:8 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{editingMedIndex !== null ? 'Update Prescription' : 'Add to Prescription'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                         </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    // --- REFACTORED PROCEDURE PICKER MODAL ---
    const renderProcedureModal = () => {
        // Filter Logic
        const procMatches = (procedures || []).filter(p => p.name.toLowerCase().includes(procSearch.toLowerCase()) && procSearch.length > 0);
        
        // Helper to get category details
        const getCatInfo = (catName) => PROCEDURE_CATEGORIES.find(c => c.value === catName) || PROCEDURE_CATEGORIES[0];
        
        // Dynamic Title based on Type
        const modalTitle = procModalType === 'investigation' ? 'Add Investigation' : 'Add Procedure';
        const customBtnLabel = procModalType === 'investigation' ? 'Add Custom Investigation' : 'Add Custom Procedure';

        // Content to render based on view mode
        const renderModalContent = () => {
            if (procViewMode === 'list') {
                return (
                    <View style={{flex: 1}}>
                         {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setProcModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><X size={20} color={theme.textDim} /></TouchableOpacity>
                        </View>

                         {/* Add New Master Button (Top Right Action) */}
                        <View style={{position: 'absolute', top: 0, right: 50}}>
                             <TouchableOpacity onPress={openAddMasterProc} style={{flexDirection:'row', alignItems:'center', gap:5, backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20}}>
                                 <PlusCircle size={16} color={theme.primary} />
                                 <Text style={{color: theme.primary, fontSize: 12, fontWeight: 'bold'}}>New</Text>
                             </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                                <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                                <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder="Search name..." placeholderTextColor={theme.textDim} value={procSearch} onChangeText={setProcSearch} />
                                {procSearch.length > 0 && <TouchableOpacity onPress={() => setProcSearch('')}><X size={18} color={theme.textDim} /></TouchableOpacity>}
                            </View>
                        </View>

                         {/* Custom Investigation Toggle */}
                         <TouchableOpacity onPress={() => setShowCustomInput(!showCustomInput)} style={{flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', backgroundColor: showCustomInput ? theme.inputBg : theme.cardBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15}}>
                             <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                 <View style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center'}}>
                                     <FlaskConical size={18} color="#8b5cf6" />
                                 </View>
                                 <Text style={{fontWeight: 'bold', color: theme.text}}>{customBtnLabel}</Text>
                             </View>
                             <ChevronDown size={20} color={theme.textDim} style={{transform: [{rotate: showCustomInput ? '180deg' : '0deg'}]}} />
                         </TouchableOpacity>

                         {/* Custom Input Fields (Visible only if toggled) */}
                         {showCustomInput && (
                             <View style={{backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, marginBottom: 15, gap: 10}}>
                                 <InputGroup icon={FileText} label="Name" value={customProcForm.name} onChange={t => setCustomProcForm({...customProcForm, name: t})} theme={theme} placeholder="e.g. X-Ray Chest" />
                                 <View style={{flexDirection:'row', gap: 10, alignItems: 'flex-end'}}>
                                     {procModalType === 'procedure' && (
                                         <View style={{flex: 1}}>
                                             <InputGroup icon={Banknote} label="Price" value={customProcForm.cost} onChange={t => setCustomProcForm({...customProcForm, cost: t})} theme={theme} placeholder="0" keyboardType="numeric" />
                                         </View>
                                     )}
                                     <TouchableOpacity onPress={addCustomToRx} style={{backgroundColor: theme.primary, height: 55, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4, flex: procModalType === 'investigation' ? 1 : 0}}>
                                         <Text style={{color: 'white', fontWeight: 'bold'}}>Add</Text>
                                     </TouchableOpacity>
                                 </View>
                             </View>
                         )}

                         {/* Procedures List */}
                         <FlatList 
                            data={procSearch.length > 0 ? procMatches : procedures}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={{paddingBottom: 20}}
                            showsVerticalScrollIndicator={false}
                            renderItem={({item}) => {
                                const catInfo = getCatInfo(item.category);
                                return (
                                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                                            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: catInfo.bg, alignItems: 'center', justifyContent: 'center' }}>
                                                <catInfo.icon size={20} color={catInfo.color} />
                                            </View>
                                            <View style={{flex: 1}}>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                                    {procModalType === 'procedure' && <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 13 }}>₹{item.cost}</Text>}
                                                    <Text style={{ color: theme.textDim, fontSize: 12 }}>• {item.category}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <TouchableOpacity onPress={() => addProcedureToForm(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                                <PlusCircle size={20} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openEditMasterProc(item)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 8 }}>
                                                <Pencil size={18} color={theme.textDim} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteMasterProcedure(item.id)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}>
                                                <Trash2 size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            }}
                         />
                    </View>
                );
            } else {
                // ADD / EDIT MASTER MODE
                return (
                    <View style={{flex: 1}}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{procViewMode === 'edit_master' ? 'Edit Item' : 'Add New Item'}</Text>
                            <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}><ArrowLeft size={20} color={theme.textDim} /></TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ gap: 15 }}>
                                <InputGroup icon={Settings} label="Name *" value={masterProcForm.name} onChange={t => setMasterProcForm({...masterProcForm, name: t})} theme={theme} placeholder="Enter name" />
                                <InputGroup icon={Banknote} label="Price (₹)" value={masterProcForm.cost} onChange={t => setMasterProcForm({...masterProcForm, cost: t})} theme={theme} placeholder="Enter price" keyboardType="numeric" />
                                {/* Simple Category Selector for speed - could use CustomPicker if needed */}
                                <View>
                                    <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Category</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10}}>
                                        {PROCEDURE_CATEGORIES.map((cat) => (
                                            <TouchableOpacity 
                                                key={cat.value} 
                                                onPress={() => setMasterProcForm({...masterProcForm, category: cat.value})}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
                                                    backgroundColor: masterProcForm.category === cat.value ? cat.color : theme.inputBg,
                                                    borderWidth: 1, borderColor: masterProcForm.category === cat.value ? cat.color : theme.border
                                                }}
                                            >
                                                <cat.icon size={14} color={masterProcForm.category === cat.value ? 'white' : cat.color} />
                                                <Text style={{color: masterProcForm.category === cat.value ? 'white' : theme.text, fontWeight: '600', fontSize: 12}}>{cat.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                            <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.inputBg }}>
                                <Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveMasterProcedure} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }
        };

        return (
            <Modal visible={procModalVisible} animationType="slide" transparent onRequestClose={() => setProcModalVisible(false)}>
                 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                         <TouchableOpacity style={{ flex: 1 }} onPress={() => setProcModalVisible(false)} />
                         <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '85%', shadowColor: "#000", shadowOffset: {width:0, height:-10}, shadowOpacity:0.3, elevation:20 }}>
                             {renderModalContent()}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const TemplateDetailPopup = () => {
        if (!selectedTemplate || !viewModalVisible) return null;
        return (
            <Modal visible={viewModalVisible} transparent animationType="fade" onRequestClose={() => setViewModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
                     <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setViewModalVisible(false)} />
                     <View style={{ backgroundColor: theme.cardBg, borderRadius: 24, overflow: 'hidden', shadowColor: "#000", shadowOpacity:0.3, elevation:10, maxHeight: '80%' }}>
                        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <FileText size={24} color="white" />
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Template Details</Text>
                            </View>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15 }}>
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </LinearGradient>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 5 }}>{selectedTemplate.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                                <Stethoscope size={16} color={theme.textDim} />
                                <Text style={{ fontSize: 14, color: theme.textDim, fontWeight: '600' }}>Diagnosis: {selectedTemplate.diagnosis}</Text>
                            </View>
                            <Text style={{ fontSize: 14, color: theme.textDim, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>Medicines List</Text>
                            <View style={{ gap: 10, marginBottom: 20 }}>
                                {selectedTemplate.medicines.map((med, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: theme.inputBg, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.primary }}>
                                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.cardBg, alignItems: 'center', justifyContent: 'center' }}><Pill size={16} color={theme.primary} /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{med.name} <Text style={{fontSize: 12, color: theme.textDim}}>({med.dosage})</Text></Text>
                                            {med.isTapering ? (
                                                <Text style={{ fontSize: 12, color: '#c2410c', marginTop: 2, fontStyle:'italic' }}>Tapering: {med.freq} for {med.duration}</Text>
                                            ) : (
                                                <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>{med.freq} • {med.duration} • {med.instruction}</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <Clipboard size={16} color="#c2410c" />
                                    <Text style={{ fontWeight: 'bold', color: '#c2410c' }}>Advice / Notes</Text>
                                </View>
                                <Text style={{ color: '#9a3412', fontStyle: 'italic' }}>{selectedTemplate.advice || "No specific advice."}</Text>
                            </View>
                        </ScrollView>
                     </View>
                </View>
            </Modal>
        );
    };

    const TemplatePickerModal = () => (
        <Modal visible={showTemplatePicker} transparent animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: height * 0.7, paddingBottom: 30 }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Select a Template</Text>
                        <TouchableOpacity onPress={() => setShowTemplatePicker(false)}><X size={24} color={theme.textDim} /></TouchableOpacity>
                    </View>
                    
                    {/* NEW: Template Search Bar */}
                    <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: theme.border }}>
                            <Search size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                            <TextInput 
                                style={{ flex: 1, color: theme.text }}
                                placeholder="Search templates..."
                                placeholderTextColor={theme.textDim}
                                value={templatePickerSearch}
                                onChangeText={setTemplatePickerSearch}
                            />
                             {templatePickerSearch.length > 0 && <TouchableOpacity onPress={() => setTemplatePickerSearch('')}><X size={16} color={theme.textDim} /></TouchableOpacity>}
                        </View>
                    </View>

                    <FlatList 
                        data={templates.filter(t => t.name.toLowerCase().includes(templatePickerSearch.toLowerCase()))}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => applyTemplate(item)} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                    <View style={{ backgroundColor: theme.inputBg, width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={20} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, color: theme.text, fontWeight: 'bold' }}>{item.name}</Text>
                                        <Text style={{ fontSize: 12, color: theme.textDim }}>{item.medicines.length} Medicines • {item.diagnosis}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={16} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={{textAlign: 'center', padding: 20, color: theme.textDim}}>No templates available.</Text>}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { marginTop: insets.top + 10 }]}>
                {view === 'list' && !isPrescription ? (
                     <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => isPrescription ? onBack() : setView('list')} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                )}
                
                <View style={{flex: 1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {isPrescription ? 'New Prescription' : view === 'list' ? 'Templates' : editorForm.id ? 'Edit Template' : 'New Template'}
                    </Text>
                    {isPrescription ? <Text style={{ fontSize: 12, color: theme.textDim }}>Write Rx for {patient?.name}</Text> : view === 'list' && <Text style={{ fontSize: 12, color: theme.textDim }}>Manage your prescription sets</Text>}
                </View>

                {view === 'list' && !isPrescription ? (
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
                {view === 'list' && !isPrescription ? renderList() : renderEditor()}
            </KeyboardAvoidingView>
            {renderMedModal()}
            {renderProcedureModal()} 
            {TemplateDetailPopup()}
            {TemplatePickerModal()}
            
            {/* Simple Input Modal for Items */}
            <Modal visible={inputVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ width: '100%', maxWidth: 300, backgroundColor: theme.cardBg, borderRadius: 20, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 15 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.primary }]}>
                            <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} value={inputText} onChangeText={setInputText} autoFocus placeholder="Type custom value..." placeholderTextColor={theme.textDim} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setInputVisible(false)} style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleAddItem} style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: theme.primary }}><Text style={{ color: 'white', fontWeight: 'bold' }}>{editingItem ? 'Update' : 'Add'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
// --- END TEMPLATE SCREEN ---

// --- VITALS SCREEN (REFACTORED - CLEAN & EDITABLE ONLY) ---
const VitalsScreen = ({ theme, onBack, patient, onSaveVitals, showToast }) => {
    const insets = useSafeAreaInsets();
    
    // Initial state based on the LATEST history record if available
    const [form, setForm] = useState({
        sys: '', dia: '', pulse: '', spo2: '', weight: '', temp: '', tempUnit: 'C'
    });

    // On Load: Populate with latest vitals
    useEffect(() => {
        if (patient?.vitalsHistory && patient.vitalsHistory.length > 0) {
            const latest = patient.vitalsHistory[0]; // Assuming index 0 is latest
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
            Alert.alert("Empty Input", "Please enter at least one vital sign.");
            return;
        }

        // Logic: Create a new record timestamped NOW, but effectively "updating" current status
        const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...form
        };

        // Add to TOP of history (Latest)
        const updatedHistory = [newEntry, ...(patient.vitalsHistory || [])];
        
        onSaveVitals(patient.id, updatedHistory);
        showToast('Success', 'Current Vitals Updated', 'success');
        // Keyboard.dismiss(); // Optional: Dismiss if you want, or keep open for multiple edits
    };

    const MedicalInput = ({ icon: Icon, label, value, onChange, unit, placeholder, color, width = '48%' }) => (
        <View style={{ width: width, marginBottom: 15 }}>
            <Text style={{ fontSize: 11, color: theme.textDim, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
            <View style={{ 
                flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, 
                borderRadius: 12, height: 55, 
                borderWidth: 1.5, borderColor: value ? color : theme.border, 
                paddingHorizontal: 12, 
                shadowColor: value ? color : "#000", shadowOffset: {width:0,height:2}, shadowOpacity: value ? 0.15 : 0.05, shadowRadius: 3, elevation: value ? 3 : 1 
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
                <View style={{flex:1, paddingHorizontal: 15}}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Patient Vitals</Text>
                    <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '500' }}>Patient: {patient?.name}</Text>
                </View>
                <TouchableOpacity onPress={handleSave} style={{ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 5 }}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Save Update</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* NOTICE BOX */}
                <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5', marginBottom: 25, flexDirection: 'row', gap: 10 }}>
                    <AlertCircle size={20} color="#c2410c" />
                    <Text style={{ color: '#9a3412', fontSize: 13, flex: 1, lineHeight: 20 }}>
                        <Text style={{fontWeight: 'bold'}}>Note:</Text> Updating vitals here will update the patient's current record.
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Activity size={20} color={theme.primary} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Current Readings</Text>
                    </View>
                    <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: '600' }}>
                            {new Date().toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* INPUT GRID - CLEAN LAYOUT */}
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
                                borderRadius: 12, height: 55, 
                                borderWidth: 1.5, borderColor: form.temp ? '#f59e0b' : theme.border, 
                                paddingHorizontal: 12, 
                                shadowColor: form.temp ? "#f59e0b" : "#000", shadowOpacity: form.temp ? 0.15 : 0.05, elevation: 2 
                            }}>
                                <Thermometer size={20} color={form.temp ? '#f59e0b' : theme.textDim} strokeWidth={2.5} />
                                <TextInput style={{ flex: 1, marginLeft: 10, color: theme.text, fontWeight: '700', fontSize: 18 }} value={form.temp} onChangeText={t => setForm({...form, temp: t})} placeholder="36.6" placeholderTextColor={theme.textDim} keyboardType="numeric" />
                                <Text style={{ color: theme.textDim, fontSize: 11, fontWeight: 'bold' }}>°{form.tempUnit}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                
                {/* DECORATIVE FILLER FOR EMPTY SPACE SINCE HISTORY IS GONE */}
                <View style={{ marginTop: 40, alignItems: 'center', opacity: 0.3 }}>
                    <Activity size={80} color={theme.textDim} />
                    <Text style={{ marginTop: 15, color: theme.textDim, fontSize: 14 }}>Enter latest clinical data above</Text>
                </View>
            </ScrollView>
        </View>
    );
};

// --- PATIENT MANAGEMENT SCREEN ---
const PatientScreen = ({ theme, onBack, patients, setPatients, appointments, setAppointments, selectedPatientId, onBookAppointment, onNavigate, showToast }) => {
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
                        showToast('Deleted', 'Patient removed successfully.', 'error');
                    }}]
        );
    };

    const handleSaveEdit = () => {
        if (!editForm.name || !editForm.mobile) { Alert.alert("Error", "Name and Mobile are required"); return; }
        const updated = patients.map(p => p.id === editForm.id ? editForm : p);
        setPatients(updated);
        showToast('Success', 'Patient Details Updated!', 'success');
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
            vitalsHistory: [],
            rxHistory: []
        };
        setPatients([createdPatient, ...patients]);
        setAddVisible(false);
        setNewPatient({ name: '', mobile: '', email: '', age: '', dob: '', dobObj: new Date(), gender: 'M', blood: 'O+', address: '' });
        showToast('Success', 'New Patient Added Successfully!', 'success');
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

        const handleDownload = () => { showToast('Success', 'ID Card Image Saved', 'success'); };

        const ACTIONS = [
            { id: 1, title: 'Add Vitals', icon: HeartPulse, colors: ['#2dd4bf', '#0f766e'], action: () => onNavigate('vitals', selectedPatient) },
            { id: 2, title: 'Prescribe now', icon: FilePlus, colors: ['#a78bfa', '#8b5cf6'], action: () => onNavigate('prescription', selectedPatient) },
            // ADDED Rx History BACK
            { id: 3, title: 'Rx History', icon: Clipboard, colors: ['#f97316', '#c2410c'], action: () => Alert.alert("Rx History", `View history for ${selectedPatient.name}`) }, 
            { id: 5, title: 'Add Lab Report', icon: TestTube, colors: ['#60a5fa', '#3b82f6'], action: () => Alert.alert("Coming Soon", "Lab Reports") },
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
                
                {/* Gender Selector in Edit Mode */}
                <GenderSelector value={editForm.gender} onChange={(val) => setEditForm({...editForm, gender: val})} theme={theme} />

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

                                {/* Gender Selector in Add Modal */}
                                <GenderSelector value={newPatient.gender} onChange={(val) => setNewPatient({...newPatient, gender: val})} theme={theme} />

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
                
                {/* Header Actions Logic */}
                {view === 'list' ? (
                    <TouchableOpacity onPress={() => setAddVisible(true)} style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                ) : view === 'edit' ? (
                    // Small "Update" Button in Header
                    <TouchableOpacity onPress={handleSaveEdit} style={[styles.iconBtn, { backgroundColor: '#10b981', borderColor: '#10b981' }]}>
                        <Check size={24} color="white" />
                    </TouchableOpacity>
                ) : ( 
                    <View style={{ width: 44 }} /> 
                )}
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
const MedicineScreen = ({ theme, onBack, medicines, setMedicines, showToast }) => {
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
            showToast('Success', 'Medicine Updated', 'success');
        } else {
            const newMed = { id: Date.now(), ...formData };
            setMedicines([newMed, ...medicines]);
            showToast('Success', 'New Medicine Added', 'success');
        }
        setAddEditVisible(false);
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Delete Item", "Remove this medicine?",
            [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => {
                setMedicines(medicines.filter(m => m.id !== id));
                showToast('Deleted', 'Medicine removed.', 'error');
            }}]
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
const AppointmentScreen = ({ theme, onBack, form, setForm, appointments, setAppointments, patients, setPatients, onSelectPatient, viewMode, setViewMode, showToast }) => {
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
            showToast('Success', 'Appointment Updated', 'success');
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
                showToast('Success', 'Appointment & Follow-up Created!', 'success');
            } else {
                showToast('Success', 'Appointment Booked Successfully!', 'success');
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
                    vitalsHistory: [],
                    rxHistory: []
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
    const handleComplete = (id) => { showToast('Completed', 'Appointment marked as done.', 'success'); const filtered = appointments.filter(a => a.id !== id); setAppointments(filtered); };
    const handlePending = (id) => { const updated = appointments.map(a => a.id === id ? { ...a, status: 'pending' } : a); setAppointments(updated); showToast('Moved', 'Appointment moved to Pending.', 'info'); };

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
        Alert.alert("Delete Appointment", "Remove this booking?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: 'destructive', onPress: () => { 
            const filtered = appointments.filter(a => a.id !== id); 
            setAppointments(filtered);
            showToast('Deleted', 'Appointment removed.', 'error');
        }}]);
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
                            <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', color: theme.textDim }}>No Appointments</Text>
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

                {/* Gender Selector in New Appointment */}
                <GenderSelector value={form.gender} onChange={(val) => setForm({...form, gender: val})} theme={theme} />

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

// --- 5. LOGIN SCREEN ---
const LoginScreen = ({ onLogin, theme, showToast }) => {
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
        setTimeout(() => { 
            setLoading(false); 
            onLogin(); 
            showToast('Welcome Back', 'Logged in successfully', 'success');
        }, 1500);
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

// 6. SIDE MENU (IMPROVED 3D UI/UX)
const SideMenu = ({ visible, onClose, insets, theme, onNavigate, onLogout }) => {
  // Animation Value: 0 = Closed, 1 = Open
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
      Animated.spring(animValue, {
          toValue: visible ? 1 : 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
          mass: 0.8,
          overshootClamping: false
      }).start();
  }, [visible]);

  const handleLogoutPress = () => { Alert.alert("Logout", "Are you sure you want to end your session?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: 'destructive', onPress: () => { onClose(); onLogout(); } }]); };

  // 3D Interpolations
  const translateX = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-width * 0.8, 0] // Slide in from left
  });
  
  const rotateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['-90deg', '0deg'] // Swing open like a door
  });

  const opacity = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1]
  });

  const backdropOpacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5]
  });

  if (!visible && animValue._value === 0) return null;

  return (
    <View style={[styles.menuOverlay, { zIndex: 999, pointerEvents: visible ? 'auto' : 'none' }]}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]}>
         <TouchableOpacity style={{flex: 1}} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* 3D Sidebar Container */}
      <Animated.View style={[
          styles.menuSidebar, 
          { 
              paddingTop: insets.top, 
              backgroundColor: theme.cardBg, 
              borderRightColor: theme.border,
              transform: [
                  { perspective: 1000 }, // Key to 3D effect
                  { translateX },
                  { rotateY },
              ],
              opacity,
              shadowColor: "#000",
              shadowOffset: { width: 10, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 20
          }
      ]}>
        {/* Gradient Background for Glass Effect */}
        <LinearGradient 
            colors={theme.mode === 'dark' ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} 
            style={StyleSheet.absoluteFill} 
            start={{x:0, y:0}} end={{x:1, y:0}}
        />

        <View style={styles.menuHeader}>
            <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                <LinearGradient colors={theme.mode === 'dark' ? [theme.primary, theme.primaryDark] : [theme.primary, theme.primaryDark]} style={{width:45, height:45, borderRadius:22.5, alignItems:'center', justifyContent:'center'}}>
                    <User color="white" size={22} />
                </LinearGradient>
                <View>
                    <Text style={{color:theme.text, fontWeight:'bold', fontSize: 16}}>Dr. Mansoor Ali.VP</Text>
                    <Text style={{color:theme.textDim, fontSize:12, fontWeight: '600'}}>Cardiologist</Text>
                </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg, borderRadius: 20 }]}>
                <X size={20} color={theme.text} />
            </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
            <Text style={[styles.menuSectionTitle, { color: theme.textDim, paddingLeft: 10 }]}>Management</Text>
            {FEATURES.map((item, index) => { 
                const Icon = item.icon; 
                // Staggered animation for list items
                const itemTranslateX = animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50 * (index + 1), 0]
                });
                
                return (
                    <Animated.View key={index} style={{ transform: [{ translateX: itemTranslateX }] }}>
                        <TouchableOpacity 
                            style={[styles.menuFeatureItem, { 
                                borderBottomColor: 'transparent', 
                                backgroundColor: 'transparent',
                                marginVertical: 2,
                                borderRadius: 12,
                                paddingHorizontal: 10
                            }]} 
                            onPress={() => { onClose(); onNavigate(item.action); }}
                        >
                            <LinearGradient colors={item.color} style={{width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15}} start={{x:0,y:0}} end={{x:1,y:1}}>
                                <Icon size={18} color="white" />
                            </LinearGradient>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.menuItemText, { color: theme.text, fontWeight: '700', fontSize: 15 }]}>{item.title}</Text>
                                <Text style={{ color: theme.textDim, fontSize: 11 }}>{item.subtitle}</Text>
                            </View>
                            <ChevronRight size={16} color={theme.textDim} />
                        </TouchableOpacity>
                    </Animated.View>
                )
            })}
            
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            
             {/* NEW SUPPORT SECTION */}
             <TouchableOpacity 
                style={[styles.menuItem, { borderBottomColor: 'transparent', paddingHorizontal: 10, marginBottom: 10 }]} 
                onPress={() => { onClose(); onNavigate('support'); }}
            >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                    <View style={[styles.menuFeatureIconBox, { backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.border }]}>
                        <HelpCircle size={20} color={theme.primary} />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.text, fontWeight: '600' }]}>Support & Help</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: 'transparent', paddingHorizontal: 10 }]} onPress={handleLogoutPress}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
                    <View style={[styles.menuFeatureIconBox, { backgroundColor: '#fee2e2', borderRadius: 12 }]}>
                        <LogOut size={20} color="#ef4444" />
                    </View>
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
    
    // --- TOAST STATE ---
    const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'success' });
    const showToast = (title, message, type = 'success') => {
        setToast({ visible: true, title, message, type });
    };

    // --- STATE PERSISTENCE ---
    const [appointmentForm, setAppointmentForm] = useState(INITIAL_FORM_STATE);
    const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
    const [patients, setPatients] = useState(INITIAL_PATIENTS); 
    const [medicines, setMedicines] = useState(INITIAL_MEDICINES); 
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
    const [procedures, setProcedures] = useState(INITIAL_PROCEDURES);

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

    const handleSavePrescription = (prescription) => {
        const patientId = prescription.patientId;
        const newRecord = {
            id: Date.now(),
            date: new Date().toISOString(),
            diagnosis: prescription.diagnosis,
            medicines: prescription.medicines,
            procedures: prescription.procedures, // NEW: Include procedures
            advice: prescription.advice
        };

        const updatedPatients = patients.map(p => {
            if (p.id === patientId) {
                const currentHistory = p.rxHistory || [];
                return { ...p, rxHistory: [newRecord, ...currentHistory] };
            }
            return p;
        });

        setPatients(updatedPatients);
        showToast('Prescribed', 'Prescription saved to patient history.', 'success');
        setCurrentScreen('patients');
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
                          {/* MENU BUTTON REMOVED FROM HERE, ONLY DARK MODE TOGGLE REMAINS */}
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setIsDarkMode(!isDarkMode)}>
                                  {isDarkMode ? <Sun size={22} color={theme.text} /> : <Moon size={22} color={theme.text} />}
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
                    showToast={showToast}
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
                        else if (screen === 'prescription') { setSelectedPatientId(data.id); setCurrentScreen('prescription'); }
                        else { setCurrentScreen(screen); }
                    }}
                    showToast={showToast}
                />;
            case 'vitals':
                const patientForVitals = patients.find(p => p.id === selectedPatientId);
                return <VitalsScreen theme={theme} onBack={() => setCurrentScreen('patients')} patient={patientForVitals} onSaveVitals={handleSaveVitals} showToast={showToast} />;
            case 'prescription':
                const patientForRx = patients.find(p => p.id === selectedPatientId);
                return <TemplateScreen 
                    theme={theme} 
                    onBack={() => setCurrentScreen('patients')}
                    templates={templates}
                    setTemplates={setTemplates}
                    medicines={medicines}
                    setMedicines={setMedicines}
                    procedures={procedures} // NEW PROP PASSED
                    setProcedures={setProcedures} // NEW: Pass setter
                    showToast={showToast}
                    isPrescription={true}
                    patient={patientForRx}
                    onSavePrescription={handleSavePrescription}
                />;
            case 'medicines': return <MedicineScreen theme={theme} onBack={() => setCurrentScreen('home')} medicines={medicines} setMedicines={setMedicines} showToast={showToast} />;
            case 'templates': 
                return <TemplateScreen 
                    theme={theme} 
                    onBack={() => setCurrentScreen('home')}
                    templates={templates}
                    setTemplates={setTemplates}
                    medicines={medicines}
                    setMedicines={setMedicines}
                    procedures={procedures} // NEW PROP PASSED
                    setProcedures={setProcedures} // NEW: Pass setter
                    showToast={showToast}
                />;
            case 'procedures': 
                return <ProceduresScreen 
                    theme={theme} 
                    onBack={() => setCurrentScreen('home')} 
                    procedures={procedures}
                    setProcedures={setProcedures}
                    showToast={showToast}
                />;
            case 'support': return <SupportScreen theme={theme} onBack={() => setCurrentScreen('home')} />;
            case 'history': return <PlaceholderScreen title="Patients History" icon={Clock} color={['#8b5cf6', '#7c3aed']} theme={theme} onBack={() => setCurrentScreen('home')} />;
            case 'reports': return <PlaceholderScreen title="Lab Reports" icon={BookOpen} color={['#ec4899', '#db2777']} theme={theme} onBack={() => setCurrentScreen('home')} />;
            default: return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            {/* TOAST NOTIFICATION RENDERED AT ROOT LEVEL */}
            <ToastNotification 
                visible={toast.visible} 
                title={toast.title} 
                message={toast.message} 
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
                theme={theme}
            />

            {isLoading && <SplashScreen theme={theme} onFinish={() => setIsLoading(false)} />}
            {!isLoading && !isLoggedIn && <LoginScreen onLogin={handleLogin} theme={theme} showToast={showToast} />}
            {!isLoading && isLoggedIn && (
                <>
                    <View style={[styles.glowTop, { backgroundColor: theme.glowTop }]} />
                    <View style={[styles.glowBottom, { backgroundColor: theme.glowBottom }]} />
                    
                    {/* MENU OVERLAY */}
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
  // --- LAYOUT & BASICS ---
  container: { 
    flex: 1 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 16, 
    paddingHorizontal: 15, 
    paddingVertical: 4, 
    height: 55 
  },
  textInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    height: '100%' 
  },
  
  // --- LOGIN SCREEN ---
  loginBtn: { 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#2563eb', 
    shadowOffset: {width:0, height:8}, 
    shadowOpacity:0.3, 
    shadowRadius:10, 
    elevation:10 
  },
  glowTop: { 
    position: 'absolute', 
    top: -100, 
    left: -50, 
    width: 300, 
    height: 300, 
    borderRadius: 150, 
    transform: [{ scaleX: 1.5 }] 
  },
  glowBottom: { 
    position: 'absolute', 
    bottom: -100, 
    right: -50, 
    width: 300, 
    height: 300, 
    borderRadius: 150 
  },

  // --- HEADERS ---
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 25 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  greeting: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  dateContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  dateText: { 
    fontSize: 14 
  },
  timeText: { 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  dot: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    marginHorizontal: 8 
  },
  iconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1 
  },

  // --- HERO / DASHBOARD CARD ---
  heroContainer: { 
    marginHorizontal: 20, 
    height: 190, 
    borderRadius: 24, 
    shadowColor: '#3b82f6', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 10, 
    marginBottom: 30 
  },
  heroGradient: { 
    flex: 1, 
    borderRadius: 24, 
    padding: 20, 
    justifyContent: 'space-between', 
    borderWidth: 1 
  },
  heroContent: { 
    position: 'relative', 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  heroBgIcon: { 
    position: 'absolute', 
    right: -10, 
    top: -10, 
    transform: [{ rotate: '-15deg' }] 
  },
  badge: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12, 
    alignSelf: 'flex-start' 
  },
  badgeText: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: 'bold', 
    textTransform: 'uppercase' 
  },
  surahName: { 
    color: 'white', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  ayahInfo: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14 
  },
  heroActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  resumeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 6 
  },
  resumeText: { 
    fontWeight: 'bold', 
    fontSize: 14 
  },

  // --- GRID & FEATURES ---
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 20, 
    marginBottom: 15 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 15, 
    justifyContent: 'space-between' 
  },
  cardContainer: { 
    width: '48%', 
    marginBottom: 15 
  },
  cardInner: { 
    borderRadius: 20, 
    padding: 16, 
    height: 130, 
    justifyContent: 'space-between', 
    borderWidth: 1 
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 8 
  },
  cardTextContent: { 
    marginTop: 10 
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  cardSubtitle: { 
    fontSize: 11 
  },

  // --- PLACEHOLDER SCREENS ---
  comingSoonIconContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    elevation: 20, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 20, 
    marginBottom: 40 
  },
  comingSoonGradient: { 
    flex: 1, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  comingSoonTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  comingSoonDesc: { 
    fontSize: 15, 
    textAlign: 'center', 
    lineHeight: 24, 
    paddingHorizontal: 40 
  },

  // --- BOTTOM NAVIGATION ---
  bottomNav: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingTop: 15, 
    borderTopWidth: 1 
  },
  bottomNavLine: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 1 
  },
  navItem: { 
    alignItems: 'center', 
    gap: 4, 
    padding: 10, 
    minWidth: 50 
  },
  navText: { 
    fontSize: 10, 
    fontWeight: '500' 
  },

  // --- SIDE MENU (3D) ---
  menuOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  menuBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  menuSidebar: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    bottom: 0, 
    width: '80%', 
    borderRightWidth: 1, 
    paddingHorizontal: 20 
  },
  menuHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30, 
    marginTop: 20 
  },
  closeBtn: { 
    padding: 5, 
    borderRadius: 8 
  },
  menuItems: { 
    flex: 1 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    borderBottomWidth: 1 
  },
  menuItemText: { 
    fontSize: 16 
  },
  menuDivider: { 
    height: 1, 
    marginVertical: 20 
  },
  menuVersion: { 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 20, 
    marginBottom: 40 
  },
  menuSectionTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    marginTop: 10 
  },
  menuFeatureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  menuFeatureIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // --- TOAST NOTIFICATIONS ---
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  toastIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15
  },
  toastTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13
  }
});