import { Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, LayoutAnimation, Linking, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

// --- CONFIGURATION ---
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// Default Config
const DOCTOR_PHONE = '8606344694'; 
const DOCTOR_WHATSAPP_NO = '918606344694'; 
const DOCTOR_NAME = 'Dr. Mansoor Ali V. P.';
const CLINIC_ADDRESS = 'Pathappiriyam, Malappuram';
const EMERGENCY_CONTACT = '112';
const SUPPORT_EMAIL = 'support@clinicapp.com';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// --- COLORS ---
const Colors = {
  bg: '#F0F4F8', primary: '#009688', primaryDark: '#004D40', card: '#FFFFFF',
  text: '#263238', subText: '#78909C', action: '#5C6BC0', danger: '#EF5350',
  success: '#66BB6A', warning: '#FFA726', whatsapp: '#25D366', dash1: '#26A69A',
  dash2: '#5C6BC0', dash3: '#FFA726', dash4: '#EC407A', dash5: '#6D4C41', dash6: '#6A1B9A',
  tealCard: '#127A75', yellowAccent: '#FFC107',
  avatarBlue: '#2196F3'
};

// --- SCREENS DEFINITION ---
const Screens = {
  LOGIN: 'Login', DASHBOARD: 'Dashboard', PATIENT_LIST: 'PatientList',
  ADD_PATIENT: 'AddPatient', PATIENT_DETAILS: 'PatientDetails', INVENTORY: 'Inventory',
  LAB_LIST: 'LabList', ADD_LAB: 'AddLab', RX_HISTORY: 'RxHistory', ADD_RX: 'AddRx',
  TEMPLATE_MANAGER: 'TemplateManager', ADD_TEMPLATE: 'AddTemplate',
  PROCEDURES_HISTORY: 'ProceduresHistory', ADD_PROCEDURE: 'AddProcedure',
  ALL_RX_HISTORY: 'AllRxHistory', SUPPORT: 'Support',
};

// --- EMPTY INITIAL DATA ---
const INITIAL_PATIENTS = [];
const INITIAL_LABS = [];
const INITIAL_INVENTORY = [];
const INITIAL_APPOINTMENTS = [];
const INITIAL_PRESCRIPTIONS = [];
const INITIAL_TEMPLATES = [{ id: 'template-none', name: 'None', diagnosis: '', medicines: [] }];
const INITIAL_PROCEDURES = [];

const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
const FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'PRN', 'SOS'];
const DURATION_OPTIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '1 Month', 'As needed'];
const VITAL_KEYS = { SpO2: 'spo2', BP: 'bp', HR: 'hr', Temp: 'temp', Weight: 'weight' };

const LoadingOverlay = ({ visible }) => (
  <Modal transparent={true} animationType="fade" visible={visible}>
    <View style={styles.loaderOverlay}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Please Wait...</Text>
      </View>
    </View>
  </Modal>
);

// --- HELPER: AVATAR COMPONENT ---
const Avatar = ({ name, image, size = 50 }) => {
  if (image) {
    return <Image source={{ uri: image }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.avatarBlue, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFF', fontSize: size * 0.45, fontWeight: 'bold' }}>
        {name && name.length > 0 ? name.charAt(0).toUpperCase() : '?'}
      </Text>
    </View>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(Screens.LOGIN);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [labs, setLabs] = useState(INITIAL_LABS);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [rxTemplates, setRxTemplates] = useState(INITIAL_TEMPLATES);
  const [procedures, setProcedures] = useState(INITIAL_PROCEDURES);
  
  const [selectedData, setSelectedData] = useState(null);

  const navigate = (screen, data = null) => { setIsLoading(true); setTimeout(() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setSelectedData(data); setCurrentScreen(screen); setDrawerOpen(false); setIsLoading(false); }, 400); };
  
  const handleLogin = (username, password) => { setIsLoading(true); setTimeout(() => { if (username === '1' && password === '1') { setIsLoading(false); navigate(Screens.DASHBOARD); } else { setIsLoading(false); Alert.alert("Login Failed", "Invalid Username or Password.\nTry: 1 / 1"); } }, 1500); };
  
  const handleAppointmentDone = (id) => { Alert.alert("Confirm Done", "Mark appointment as complete and remove from today's list?", [{ text: "Cancel" }, { text: "Done", style: 'destructive', onPress: () => { setIsLoading(true); setTimeout(() => { setAppointments(appointments.filter(a => a.id !== id)); setIsLoading(false); }, 500); } }]); };
  
  const handleSavePatient = (p, appointmentDetails) => { setIsLoading(true); setTimeout(() => { let savedPatient = p; if (p.id) { setPatients(patients.map(x => x.id === p.id ? p : x)); } else { const newPatientId = Date.now().toString(); savedPatient = { ...p, id: newPatientId, vitals: { weight: p.vitals.weight || '', ...p.vitals } }; setPatients(prev => [...prev, savedPatient]); } if (appointmentDetails && appointmentDetails.bookit) { const newAppt = { id: 'appt_' + Date.now(), time: appointmentDetails.time, patientName: savedPatient.name, type: appointmentDetails.type || 'Consultation', reason: appointmentDetails.reason, status: 'Pending' }; setAppointments(prev => [...prev, newAppt]); Alert.alert("Success", `Patient Saved & Appointment Booked for ${savedPatient.name} at ${newAppt.time}!`); } else { Alert.alert("Success", "Patient Saved Successfully"); } setIsLoading(false); navigate(Screens.PATIENT_LIST); }, 1000); };
  
  const handleDeletePatient = (id) => { Alert.alert("Confirm Delete", "Are you sure? This will delete all associated records.", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { setIsLoading(true); setTimeout(() => { setPatients(patients.filter(x => x.id !== id)); setPrescriptions(prescriptions.filter(rx => rx.patientId !== id)); setLabs(labs.filter(l => l.patientId !== id)); setProcedures(procedures.filter(p => p.patientId !== id)); const patientToDelete = patients.find(p => p.id === id); if (patientToDelete) { setAppointments(appointments.filter(a => a.patientName !== patientToDelete.name)); } setIsLoading(false); navigate(Screens.PATIENT_LIST); }, 800); } }]); };
  
  const handleSavePrescription = (rx) => { setIsLoading(true); setTimeout(() => { const p = patients.find(p => p.id === rx.patientId); const currentDate = new Date().toLocaleDateString('en-CA'); const newRx = { ...rx, id: rx.id || 'rx_' + Date.now() + Math.random(), patientName: p?.name || 'Unknown', date: currentDate }; if (rx.id) { setPrescriptions(prescriptions.map(x => x.id === rx.id ? newRx : x)); } else { setPrescriptions(prev => [newRx, ...prev]); } if (rx.proceduresPerformed && rx.proceduresPerformed.length > 0) { const newProceduresFromRx = rx.proceduresPerformed.map(proc => ({ id: proc.id || 'proc_' + Date.now() + Math.random(), patientId: p.id, patientName: p.name, procedureName: proc.name, date: currentDate, cost: proc.cost, notes: `Performed during consultation on ${currentDate}` })); const proceduresToAdd = newProceduresFromRx.filter(newProc => !procedures.some(existingProc => existingProc.id === newProc.id)); setProcedures(prev => [...proceduresToAdd, ...prev]); } const appointmentToRemove = appointments.find(a => a.patientName === p?.name && a.status === 'Pending'); if (appointmentToRemove) { setAppointments(appointments.filter(a => a.id !== appointmentToRemove.id)); Alert.alert("Success", `Prescription Saved & Appointment for ${p.name} marked as complete.`); } else { Alert.alert("Success", "Prescription Saved Successfully!"); } setIsLoading(false); navigate(Screens.RX_HISTORY, p); }, 1000); };
  const handleDeleteRx = (id) => { Alert.alert("Confirm Delete", "Delete this prescription?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { setIsLoading(true); setTimeout(() => { setPrescriptions(prescriptions.filter(x => x.id !== id)); setIsLoading(false); Alert.alert("Deleted", "Prescription removed."); }, 800); } }]); };
  const handleQuickBook = (patient, time, reason, type) => { setIsLoading(true); setTimeout(() => { const newAppt = { id: 'appt_' + Date.now(), time: time, patientName: patient.name, type: type, reason: reason, status: 'Pending' }; setAppointments(prev => [...prev, newAppt]); setIsLoading(false); Alert.alert("Success", `Appointment Booked for ${patient.name} at ${time}`); navigate(Screens.DASHBOARD); }, 800); };
  const handleSaveLab = (l) => { setIsLoading(true); setTimeout(() => { const pName = patients.find(p => p.id === l.patientId)?.name || 'Unknown'; const newLab = { ...l, patientName: pName }; if (l.id) setLabs(labs.map(x => x.id === l.id ? newLab : x)); else setLabs([...labs, { ...newLab, id: Date.now().toString() }]); setIsLoading(false); navigate(Screens.LAB_LIST); }, 1000); };
  const handleDeleteLab = (id) => { Alert.alert("Delete Report", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => setLabs(labs.filter(x => x.id !== id)) }]); };
  const updateInventoryStock = (id, amount) => { setInventory(inventory.map(item => { if (item.id === id) { const newStock = Math.max(0, item.stock + amount); let status = newStock === 0 ? 'Out' : newStock < 10 ? 'Critical' : newStock < 20 ? 'Low' : 'Good'; return { ...item, stock: newStock, status }; } return item; })); };
  const deleteInventoryItem = (id) => { Alert.alert("Remove Item", "Delete this medicine?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => setInventory(inventory.filter(i => i.id !== id)) }]); };
  const addNewMedicine = (name, dosage, strength) => { setIsLoading(true); setTimeout(() => { const newItem = { id: Date.now().toString(), name, dosage, strength, stock: 0, status: 'Out' }; setInventory([...inventory, newItem]); setIsLoading(false); }, 800); };
  const handleUpdateInventoryItem = (itemId, updatedData) => { setIsLoading(true); setTimeout(() => { setInventory(inventory.map(item => item.id === itemId ? { ...item, ...updatedData } : item)); setIsLoading(false); }, 500); };
  const handleSaveTemplate = (template) => { setIsLoading(true); setTimeout(() => { if (template.id) { setRxTemplates(rxTemplates.map(t => t.id === template.id ? template : t)); Alert.alert("Success", "Template updated!"); } else { const newTemplate = { ...template, id: 'template_' + Date.now() }; setRxTemplates([...rxTemplates, newTemplate]); Alert.alert("Success", "New template saved!"); } setIsLoading(false); navigate(Screens.TEMPLATE_MANAGER); }, 800); };
  const handleDeleteTemplate = (id) => { if (id === 'template-none') { Alert.alert("Cannot Delete", "The 'None' template cannot be removed."); return; } Alert.alert("Delete Template", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => { setRxTemplates(rxTemplates.filter(t => t.id !== id)); } }]); };
  const handleSaveProcedure = (proc) => { setIsLoading(true); setTimeout(() => { const patientName = patients.find(p => p.id === proc.patientId)?.name || 'Unknown'; const newProc = { ...proc, patientName }; if (proc.id) { setProcedures(procedures.map(p => p.id === proc.id ? newProc : p)); Alert.alert("Success", "Procedure record updated!"); } else { setProcedures(prev => [{ ...newProc, id: 'proc_' + Date.now() }, ...prev]); Alert.alert("Success", "New procedure recorded!"); } setIsLoading(false); navigate(Screens.PROCEDURES_HISTORY); }, 800); };
  const handleDeleteProcedure = (id) => { Alert.alert("Delete Procedure", "Are you sure you want to remove this record?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => { setProcedures(procedures.filter(p => p.id !== id)); } }]); };
  
  const renderContent = () => {
    switch (currentScreen) {
      case Screens.LOGIN: return <LoginScreen onLogin={handleLogin} />;
      case Screens.DASHBOARD: return <Dashboard patients={patients} appointments={appointments} inventory={inventory} templates={rxTemplates} procedures={procedures} prescriptions={prescriptions} navigate={navigate} openDrawer={() => setDrawerOpen(true)} onDeleteAppt={handleAppointmentDone} />;
      case Screens.PATIENT_LIST: return <PatientList patients={patients} navigate={navigate} onDelete={handleDeletePatient} onEdit={(p) => navigate(Screens.ADD_PATIENT, p)} onBook={handleQuickBook} />;
      case Screens.ADD_PATIENT: return <PatientForm initialData={selectedData} onSave={handleSavePatient} onCancel={() => navigate(Screens.PATIENT_LIST)} />;
      case Screens.PATIENT_DETAILS: return <PatientDetails patient={selectedData} labs={labs} navigate={navigate} />;
      case Screens.RX_HISTORY: return <PrescriptionHistoryScreen patient={selectedData} prescriptions={prescriptions.filter(r => r.patientId === selectedData?.id).sort((a, b) => new Date(b.date) - new Date(a.date))} navigate={navigate} onDeleteRx={(id) => handleDeleteRx(id)} onEditRx={(rx) => navigate(Screens.ADD_RX, { ...rx, isEdit: true, patient: selectedData })} />;
      case Screens.ALL_RX_HISTORY: return <AllPrescriptionHistoryScreen allPrescriptions={prescriptions.sort((a, b) => new Date(b.date) - new Date(a.date))} patients={patients} navigate={navigate} onDeleteRx={(id) => handleDeleteRx(id)} />;
      case Screens.ADD_RX: const isEdit = selectedData?.isEdit; const patientFromSelectedData = isEdit ? selectedData.patient : selectedData; return <NewPrescriptionForm patient={patientFromSelectedData} inventory={inventory} templates={rxTemplates} onSave={handleSavePrescription} onCancel={() => navigate(Screens.RX_HISTORY, patientFromSelectedData)} initialData={isEdit ? selectedData : null} />;
      case Screens.LAB_LIST: return <LabList labs={labs} navigate={navigate} onDelete={handleDeleteLab} onEdit={(l) => navigate(Screens.ADD_LAB, l)} />;
      case Screens.ADD_LAB: return <LabForm initialData={selectedData} patients={patients} onSave={handleSaveLab} onCancel={() => navigate(Screens.LAB_LIST)} />;
      case Screens.INVENTORY: return <InventoryScreen inventory={inventory} onUpdateStock={updateInventoryStock} onAddItem={addNewMedicine} onDeleteItem={deleteInventoryItem} onUpdateItem={handleUpdateInventoryItem} navigate={navigate} />;
      case Screens.TEMPLATE_MANAGER: return <TemplateManagerScreen templates={rxTemplates} navigate={navigate} onEdit={(t) => navigate(Screens.ADD_TEMPLATE, t)} onDelete={handleDeleteTemplate} />;
      case Screens.ADD_TEMPLATE: return <AddTemplateForm initialData={selectedData} inventory={inventory} onSave={handleSaveTemplate} onCancel={() => navigate(Screens.TEMPLATE_MANAGER)} />;
      case Screens.PROCEDURES_HISTORY: return <ProceduresHistoryScreen procedures={procedures} navigate={navigate} onDelete={handleDeleteProcedure} onEdit={(p) => navigate(Screens.ADD_PROCEDURE, p)} />;
      case Screens.ADD_PROCEDURE: return <AddProcedureForm patients={patients} initialData={selectedData} onSave={handleSaveProcedure} onCancel={() => navigate(Screens.PROCEDURES_HISTORY)} />;
      case Screens.SUPPORT: return <SupportScreen navigate={navigate} />;
      default: return <Dashboard />;
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <LoadingOverlay visible={isLoading} />
      {renderContent()}
      {drawerOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderContent}>
                <View style={styles.avatarLarge}><Text style={styles.avatarText}>DM</Text></View>
                <Text style={styles.drawerTitle}>{DOCTOR_NAME}</Text>
                <Text style={styles.drawerSub}>Medical Admin</Text>
                <View style={styles.drawerContactBox}>
                  <TouchableOpacity style={styles.drawerContactBtn} onPress={() => Linking.openURL(`tel:${DOCTOR_PHONE}`)}>
                    <FontAwesome5 name="phone-alt" size={14} color={Colors.primary} />
                    <Text style={styles.drawerContactText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.drawerContactBtn, { backgroundColor: Colors.whatsapp }]} onPress={() => Linking.openURL(`whatsapp://send?phone=${DOCTOR_WHATSAPP_NO}`)}>
                    <FontAwesome5 name="whatsapp" size={16} color="#FFF" />
                    <Text style={styles.drawerContactText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <ScrollView style={{ paddingTop: 10 }}>
              <DrawerItem icon="th-large" label="Dashboard" color={Colors.dash1} onPress={() => navigate(Screens.DASHBOARD)} />
              <DrawerItem icon="users" label="Patients" color={Colors.dash2} onPress={() => navigate(Screens.PATIENT_LIST)} />
              <DrawerItem icon="file-prescription" label="All Patient Rx History" color={Colors.primaryDark} onPress={() => navigate(Screens.ALL_RX_HISTORY)} />
              <DrawerItem icon="file-medical-alt" label="Lab Reports" color={Colors.dash3} onPress={() => navigate(Screens.LAB_LIST)} />
              <DrawerItem icon="band-aid" label="Procedures" color={Colors.dash6} onPress={() => navigate(Screens.PROCEDURES_HISTORY)} />
              <DrawerItem icon="capsules" label="Inventory" color={Colors.dash4} onPress={() => navigate(Screens.INVENTORY)} />
              <DrawerItem icon="file-signature" label="Manage Templates" color={Colors.dash5} onPress={() => navigate(Screens.TEMPLATE_MANAGER)} />
              <DrawerItem icon="headset" label="Support" color={Colors.warning} onPress={() => navigate(Screens.SUPPORT)} />
              <View style={styles.divider} />
              <DrawerItem icon="sign-out-alt" label="Logout" color={Colors.danger} onPress={() => setCurrentScreen(Screens.LOGIN)} />
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const SupportScreen = ({ navigate }) => {
  const handleContact = (method) => {
    switch (method) {
      case 'email': Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Clinic App Issue`); break;
      case 'phone': Linking.openURL(`tel:${DOCTOR_PHONE}`); break;
      case 'whatsapp': Linking.openURL(`whatsapp://send?phone=${DOCTOR_WHATSAPP_NO}`); break;
    }
  };
  return (
    <View style={styles.screenContainer}>
      <Header title="Support & Contact" onBack={() => navigate(Screens.DASHBOARD)} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View style={[styles.card, { backgroundColor: Colors.warning + '10', borderLeftWidth: 5, borderLeftColor: Colors.warning }]}>
          <Text style={[styles.sectionTitle, { color: Colors.warning }]}>Report an Issue</Text>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.warning, marginTop: 15 }]} onPress={() => handleContact('email')}>
            <Text style={styles.btnText}>Email Support</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: Colors.primary + '10', borderLeftWidth: 5, borderLeftColor: Colors.primary }]}>
          <Text style={[styles.sectionTitle, { color: Colors.primary }]}>Contact Us</Text>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.primary, marginTop: 15 }]} onPress={() => handleContact('phone')}>
            <Text style={styles.btnText}>Call {DOCTOR_PHONE}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.whatsapp, marginTop: 10 }]} onPress={() => handleContact('whatsapp')}>
            <Text style={styles.btnText}>Message on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const AllPrescriptionHistoryScreen = ({ allPrescriptions, patients, navigate, onDeleteRx }) => {
  const [viewRx, setViewRx] = useState(null);
  const [search, setSearch] = useState('');
  const filteredPrescriptions = allPrescriptions.filter(rx => rx.patientName.toLowerCase().includes(search.toLowerCase()) || rx.diagnosis.toLowerCase().includes(search.toLowerCase()));
  const RxTableItem = ({ item }) => {
    const patient = patients.find(p => p.id === item.patientId);
    return (<View key={item.id} style={styles.rxTableItem}>
      <View style={styles.rxTableCol}><Text style={styles.rxDate}>{item.date}</Text><Text style={styles.rxDiagnosis}>{item.diagnosis}</Text><Text style={{ fontSize: 12, color: Colors.text, fontWeight: 'bold' }}>{item.patientName}</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><TouchableOpacity onPress={() => setViewRx(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => navigate(Screens.ADD_RX, { ...item, isEdit: true, patient: patient })} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.primary + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => onDeleteRx(item.id)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View>
    </View>);
  };
  return (
    <View style={styles.screenContainer}>
      <Header title="All Patient Rx History" onBack={() => navigate(Screens.DASHBOARD)} />
      <View style={styles.searchContainer}><Ionicons name="search" size={20} color={Colors.subText} /><TextInput style={styles.searchInput} placeholder="Search Patient or Diagnosis..." value={search} onChangeText={setSearch} /></View>
      <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 0 }]}>Records (<Text>{filteredPrescriptions.length}</Text>)</Text>
      <View style={{ paddingHorizontal: 20, flex: 1 }}><View style={[styles.rxTable, { marginBottom: 20 }]}><View style={styles.rxTableHeader}><Text style={styles.rxHeaderCol}>Patient/Details</Text><Text style={{ width: 120, textAlign: 'right', fontWeight: 'bold', color: Colors.text }}>Actions</Text></View><FlatList data={filteredPrescriptions} keyExtractor={item => item.id} renderItem={({ item }) => <RxTableItem item={item} />} ListEmptyComponent={<View style={{ padding: 20, alignItems: 'center' }}><Text style={styles.emptyText}>No matching prescriptions found.</Text></View>} /></View></View><PrescriptionDetailModal rx={viewRx} onClose={() => setViewRx(null)} />
    </View>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState(''); const [pass, setPass] = useState('');
  return (<View style={styles.loginContainer}><View style={styles.loginCard}><View style={styles.logoBubble}><FontAwesome5 name="hospital-user" size={40} color="#FFF" /></View><Text style={styles.loginTitle}>Dr Login.</Text><Text style={styles.loginSub}>Clinic Management</Text><View style={styles.loginInputContainer}><FontAwesome5 name="user" size={16} color={Colors.subText} style={{ marginRight: 10 }} /><TextInput placeholder="Username" style={{ flex: 1 }} value={user} onChangeText={setUser} autoCapitalize="none" /></View><View style={styles.loginInputContainer}><FontAwesome5 name="lock" size={16} color={Colors.subText} style={{ marginRight: 10 }} /><TextInput placeholder="Password" style={{ flex: 1 }} value={pass} onChangeText={setPass} secureTextEntry={true} /></View><TouchableOpacity style={styles.loginBtn} onPress={() => onLogin(user, pass)}><Text style={styles.btnText}>LOGIN</Text></TouchableOpacity><Text style={{ marginTop: 15, color: Colors.subText, fontSize: 12 }}>Default: 1 / 1</Text></View></View>);
};

const Dashboard = ({ patients, appointments, inventory, templates, procedures, prescriptions, navigate, openDrawer, onDeleteAppt }) => {
  const lowStock = inventory.filter(i => i.status !== 'Good');
  const EmergencyContactWidget = () => (
    <View style={styles.emergencyCard}>
      <FontAwesome5 name="first-aid" size={24} color={Colors.danger} />
      <View style={{ flex: 1, marginHorizontal: 15 }}><Text style={styles.emergencyTitle}>Emergency Contact</Text><Text style={styles.emergencyNumber}>{EMERGENCY_CONTACT}</Text></View>
      <TouchableOpacity style={styles.callNowBtn} onPress={() => Linking.openURL(`tel:${EMERGENCY_CONTACT}`)}><Text style={styles.callNowText}>CALL NOW</Text></TouchableOpacity>
    </View>
  );
  return (<View style={styles.screenContainer}><View style={[styles.header, { backgroundColor: Colors.dash1 }]}><TouchableOpacity onPress={openDrawer}><MaterialIcons name="sort" size={30} color="#FFF" /></TouchableOpacity><Text style={styles.headerTitle}>Dashboard</Text><View style={{ width: 30 }} /></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}><View style={[styles.welcomeBanner, { backgroundColor: Colors.dash2 }]}><View><Text style={styles.welcomeText}>Welcome Back,</Text><Text style={styles.docName}>{DOCTOR_NAME}</Text></View><FontAwesome5 name="user-md" size={35} color="#FFF" opacity={0.8} /></View><View style={styles.gridContainer}><DashboardCard title="Patients" count={patients.length} icon="users" color={Colors.dash1} onPress={() => navigate(Screens.PATIENT_LIST)} /><DashboardCard title="Reports" count="View" icon="flask" color={Colors.dash2} onPress={() => navigate(Screens.LAB_LIST)} /><DashboardCard title="Medicine" count={inventory.length} icon="capsules" color={Colors.dash3} onPress={() => navigate(Screens.INVENTORY)} /><DashboardCard title="Schedule" count={appointments.length} icon="calendar-alt" color={Colors.dash4} onPress={() => { }} /><DashboardCard title="Templates" count={templates.length - 1} icon="file-signature" color={Colors.dash5} onPress={() => navigate(Screens.TEMPLATE_MANAGER)} /><DashboardCard title="Procedures" count={procedures.length} icon="stethoscope" color={Colors.dash6} onPress={() => navigate(Screens.PROCEDURES_HISTORY)} /></View>
    <Text style={[styles.sectionTitle, { color: Colors.dash3 }]}>Today's Appointments</Text>{appointments.length === 0 ? (<Text style={{ color: Colors.subText, fontStyle: 'italic' }}>No appointments scheduled.</Text>) : (appointments.map(a => (<View key={a.id} style={[styles.apptCard, { borderLeftColor: Colors.dash4, borderLeftWidth: 4 }]}><View style={styles.timeBox}><Text style={styles.timeText}>{a.time}</Text></View><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.apptName}>{a.patientName}</Text><Text style={styles.apptType}>{a.type} - {a.reason}</Text></View><TouchableOpacity onPress={() => onDeleteAppt(a.id)} style={{ backgroundColor: Colors.success + '20', padding: 8, borderRadius: 10 }}><FontAwesome5 name="check" size={18} color={Colors.success} /></TouchableOpacity></View>)))}{lowStock.length > 0 ? (<View style={[styles.alertWidget, { marginTop: 20, borderLeftColor: Colors.danger, borderLeftWidth: 4 }]}><View style={styles.alertHeader}><MaterialIcons name="warning" size={24} color={Colors.danger} /><Text style={styles.alertTitle}>Stock Alert</Text></View>{lowStock.slice(0, 2).map(item => (<View key={item.id} style={styles.alertItem}><Text style={styles.alertName}>{item.name}</Text><Text style={[styles.alertStatus, { color: Colors.danger }]}>{item.stock} Left</Text></View>))}{lowStock.length > 2 ? <Text style={{ fontSize: 12, color: Colors.subText, textAlign: 'right' }}>...and {lowStock.length - 2} more</Text> : null}</View>) : null}<EmergencyContactWidget /></ScrollView></View>);
};

const PatientList = ({ patients, navigate, onDelete, onEdit, onBook }) => {
  const [search, setSearch] = useState(''); const [bookModal, setBookModal] = useState(null); const [apptTime, setApptTime] = useState('09:00 AM'); const [apptReason, setApptReason] = useState(''); const [isFollowUp, setIsFollowUp] = useState(false); const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (<View style={styles.screenContainer}><Header title="Patients" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PATIENT)} /><View style={styles.searchContainer}><Ionicons name="search" size={20} color={Colors.subText} /><TextInput style={styles.searchInput} placeholder="Search Patient..." value={search} onChangeText={setSearch} /></View><FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.card}><TouchableOpacity style={styles.row} onPress={() => navigate(Screens.PATIENT_DETAILS, item)}><Avatar name={item.name} image={item.image} size={50} /><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSub}>{item.gender}, {item.age} yrs</Text></View></TouchableOpacity><View style={styles.cardActions}><TouchableOpacity onPress={() => setBookModal(item)} style={styles.actionLabelBtn}><FontAwesome5 name="calendar-plus" size={14} color={Colors.primary} /><Text style={styles.actionLabelText}>Book</Text></TouchableOpacity><TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10 }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>)} ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No patients found.</Text></View>} /><Modal visible={!!bookModal} transparent={true} animationType="slide"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Book Appointment</Text><Text style={{ textAlign: 'center', color: Colors.primary, marginBottom: 15, fontWeight: 'bold' }}>{bookModal?.name}</Text><View style={styles.timeGrid}>{TIME_SLOTS.slice(0, 6).map(t => (<TouchableOpacity key={t} style={[styles.timeSlot, apptTime === t && styles.activeTimeSlot]} onPress={() => setApptTime(t)}><Text style={[styles.timeSlotText, apptTime === t && { color: '#FFF' }]}>{t}</Text></TouchableOpacity>))}</View><Input label="Reason" value={apptReason} onChange={setApptReason} /><TouchableOpacity style={[styles.row, { marginBottom: 20 }]} onPress={() => setIsFollowUp(!isFollowUp)}><FontAwesome5 name={isFollowUp ? "check-square" : "square"} size={20} color={Colors.primary} /><Text style={{ marginLeft: 10, color: Colors.text }}>Follow Up?</Text></TouchableOpacity><View style={styles.row}><TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: Colors.subText, marginRight: 10 }]} onPress={() => setBookModal(null)}><Text style={styles.btnText}>CANCEL</Text></TouchableOpacity><TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={() => { onBook(bookModal, apptTime, apptReason, isFollowUp ? 'Follow Up' : 'Consultation'); setBookModal(null); }}><Text style={styles.btnText}>CONFIRM</Text></TouchableOpacity></View></View></View></Modal></View>);
};

// --- UPDATED PATIENT DETAILS WITH NEW ID CARD & AUTO DOWNLOAD ---
const PatientDetails = ({ patient, labs, navigate }) => {
  if (!patient) return null;
  
  // Ref for capturing the ID card view
  const viewShotRef = useRef();

  // 1. AUTO DOWNLOAD FUNCTION (Save to Gallery)
  // FIXED: Removed the automatic hook `usePermissions` that caused crashes.
  // We request permissions only when the button is pressed.
  const handleDownloadPng = async () => {
    try {
      // 2. Capture View
      const uri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1.0, // Best quality
      });

      // 3. Save to Gallery
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Alert.alert("Success", "ID Card has been downloaded to your Photos/Gallery!");

    } catch (error) {
       console.log(error);
       // Check if error is related to permission
       if (error.message.includes('permission')) {
           Alert.alert("Permission Required", "Please allow app to save photos in your settings.");
       } else {
           Alert.alert("Error", "Could not save image. " + error.message);
       }
    }
  };

  // 2. Share Function (Optional if they want to send via WhatsApp)
  const handleSharePng = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: "png",
        quality: 0.9,
      });
      await Sharing.shareAsync(uri, { dialogTitle: `Share ID: ${patient.name}` });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not share image.");
    }
  };

  const IdRow = ({ l, v }) => (
    <View style={{flexDirection:'row', marginBottom:5}}>
      <Text style={{color:'#B2DFDB', fontWeight:'700', width:110, fontSize:13}}>{l}</Text>
      <Text style={{color:'#FFF', fontWeight:'700', marginRight:5}}>:</Text>
      <Text style={{color:'#FFF', fontWeight:'700', flex:1, fontSize:14}}>{v}</Text>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <Header title="Patient Profile" onBack={() => navigate(Screens.PATIENT_LIST)} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* NEW ID CARD DESIGN WRAPPED IN VIEWSHOT FOR PNG CAPTURE */}
        
        <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={{backgroundColor: Colors.bg}}>
            <View style={styles.idCardContainer}>
            <View style={styles.idCardCurve} />
            <Text style={styles.idCardTitle}>ID CARD</Text>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:10}}>
                <View style={styles.idAvatarBox}>
                    <View style={styles.idAvatarCircle}>
                    {patient.image ? (
                        <Image source={{ uri: patient.image }} style={styles.idAvatarImg} />
                    ) : (
                        // LETTER AVATAR LOGIC INSIDE ID CARD
                        <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF'}}>
                           <Text style={{fontSize: 40, fontWeight: 'bold', color: Colors.primaryDark}}>
                               {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                           </Text>
                        </View>
                    )}
                    </View>
                </View>
                <View style={{flex:1, marginLeft:15}}>
                    <IdRow l="PATIENT NAME" v={patient.name} />
                    <IdRow l="ID NO" v={patient.id} />
                    <IdRow l="AGE/GENDER" v={`${patient.age} Yrs / ${patient.gender}`} />
                    <IdRow l="PHONE" v={patient.phone} />
                </View>
            </View>
            <View style={styles.idDivider} />
            <View style={{alignItems:'center', marginVertical:10}}>
                <Text style={{color:'#FFF', opacity:0.9, fontSize:12, letterSpacing:0.5}}>CONSULTANT DOCTOR:</Text>
                <Text style={{color:'#FFF', fontSize:24, fontWeight:'bold', fontStyle:'italic', marginVertical:2}}>{DOCTOR_NAME}</Text>
                <Text style={{color:Colors.yellowAccent, fontSize:18, fontWeight:'bold'}}>PATHAPPIRIYAM</Text>
            </View>
            <View style={styles.idFooterBtn}>
                <Text style={{color:Colors.primaryDark, fontWeight:'900', fontSize:15}}>APPOINTMENT BOOKING: +91 {DOCTOR_PHONE}</Text>
            </View>
            </View>
        </ViewShot>
           
        {/* BUTTONS ROW OUTSIDE CAPTURE VIEW */}
        <View style={styles.idActionRowOuter}>
            <TouchableOpacity style={styles.idActionBtnOuter} onPress={handleDownloadPng}>
                <FontAwesome5 name="download" size={14} color="#FFF" />
                <Text style={styles.idActionText}>Download PNG</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.idActionBtnOuter} onPress={handleSharePng}>
                <FontAwesome5 name="share-alt" size={14} color="#FFF" />
                <Text style={styles.idActionText}>Share PNG</Text>
            </TouchableOpacity>
        </View>
           
        {/* END ID CARD */}

        <Text style={styles.sectionTitle}>Vitals</Text>
        <View style={styles.vitalGrid}>
          <VitalBox label="HR" val={patient.vitals.hr} unit="bpm" icon="heartbeat" color={Colors.danger} />
          <VitalBox label="BP" val={patient.vitals.bp} unit="" icon="tint" color={Colors.action} />
          <VitalBox label="Temp" val={patient.vitals.temp} unit="F" icon="thermometer-half" color={Colors.warning} />
        </View>
        <View style={[styles.vitalGrid, { marginTop: 10 }]}>
          <VitalBox label="SpO2" val={patient.vitals.spo2} unit="%" icon="lungs" color={Colors.success} />
          <VitalBox label="Weight" val={patient.vitals.weight} unit="kg" icon="weight" color={Colors.primary} />
          <TouchableOpacity style={[styles.vitalCard, { borderTopColor: Colors.dash4, justifyContent: 'center' }]} onPress={() => navigate(Screens.RX_HISTORY, patient)}>
            <FontAwesome5 name="prescription-bottle-alt" size={20} color={Colors.dash4} />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.dash4, marginTop: 5 }}>Rx History</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Lab Reports</Text>
        <View style={{ backgroundColor: Colors.card, borderRadius: 15, padding: 15, elevation: 2 }}>
          {labs.filter(l => l.patientId === patient.id).length > 0 ? (labs.filter(l => l.patientId === patient.id).map(l => (<Text key={l.id} style={{ marginBottom: 5, color: Colors.text }}>{l.date} - {l.testName}</Text>))) : (<Text style={{ color: Colors.subText, fontStyle: 'italic' }}>No lab reports on file.</Text>)}
          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 15, padding: 10 }]} onPress={() => navigate(Screens.ADD_LAB, { patientId: patient.id, patientName: patient.name })}><Text style={[styles.btnText, { fontSize: 14 }]}>ADD NEW REPORT</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const PatientForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { name: '', age: '', gender: 'Male', phone: '', blood: '', image: null, vitals: { bp: '', hr: '', temp: '', spo2: '', weight: '' } }); const [bookAppt, setBookAppt] = useState(false); const [apptTime, setApptTime] = useState('09:00 AM'); const [apptReason, setApptReason] = useState(''); const [isFollowUp, setIsFollowUp] = useState(false); const [showTimeModal, setShowTimeModal] = useState(false); 
  
  // FIX: Safely access MediaTypeOptions or fallback to string 'Images'
  const pickImage = async () => { 
      let mediaType = ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : 'Images'; // Safety check
      
      let r = await ImagePicker.launchImageLibraryAsync({ 
          mediaTypes: mediaType, 
          quality: 0.5, 
          allowsEditing: true 
      }); 
      if (!r.canceled) setForm({ ...form, image: r.assets[0].uri }); 
  };
  
  return (<View style={styles.screenContainer}><Header title={initialData ? "Edit Patient" : "Add New Patient"} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}>
    
    {/* AVATAR UPLOAD LOGIC */}
    <TouchableOpacity style={styles.uploadCircle} onPress={pickImage}>
      {form.image ? (
        <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
      ) : (
        // IF NO IMAGE, CHECK IF NAME EXISTS TO SHOW LETTER
        form.name && form.name.length > 0 ? (
           <Text style={{fontSize: 40, fontWeight: 'bold', color: Colors.primary}}>{form.name.charAt(0).toUpperCase()}</Text>
        ) : (
           <FontAwesome5 name="camera" size={24} color={Colors.primary} />
        )
      )}
    </TouchableOpacity>
    
    <Input label="Full Name" value={form.name} onChange={t => setForm({ ...form, name: t })} /><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="Age" kbd="numeric" value={form.age} onChange={t => setForm({ ...form, age: t })} /><Input style={{ flex: 1 }} label="Blood Group" value={form.blood} onChange={t => setForm({ ...form, blood: t })} /></View><Input label="Phone" kbd="phone-pad" value={form.phone} onChange={t => setForm({ ...form, phone: t })} /><Text style={styles.sectionTitle}>Vital Signs</Text><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="SpO2 (%)" kbd="numeric" value={form.vitals.spo2} onChange={t => setForm({ ...form, vitals: { ...form.vitals, spo2: t } })} /><Input style={{ flex: 1 }} label="BP (mmHg)" value={form.vitals.bp} onChange={t => setForm({ ...form, vitals: { ...form.vitals, bp: t } })} /></View><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="Pulse (bpm)" kbd="numeric" value={form.vitals.hr} onChange={t => setForm({ ...form, vitals: { ...form.vitals, hr: t } })} /><Input style={{ flex: 1 }} label="Temperature (°F)" kbd="numeric" value={form.vitals.temp} onChange={t => setForm({ ...form, vitals: { ...form.vitals, temp: t } })} /></View><Input label="Weight (kg)" kbd="numeric" value={form.vitals.weight} onChange={t => setForm({ ...form, vitals: { ...form.vitals, weight: t } })} /><View style={styles.apptSection}><View style={styles.row}><Text style={styles.sectionTitleSmall}>Book Appointment?</Text><TouchableOpacity style={[styles.toggleBtn, { backgroundColor: bookAppt ? Colors.success : '#CCC' }]} onPress={() => setBookAppt(!bookAppt)}><FontAwesome5 name={bookAppt ? "check" : "times"} size={16} color="#FFF" /></TouchableOpacity></View>{bookAppt ? (<View style={{ marginTop: 10 }}><Text style={styles.label}>Select Time</Text><TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimeModal(true)}><Text style={styles.pickerText}>{apptTime}</Text><FontAwesome5 name="clock" size={16} color={Colors.primary} /></TouchableOpacity><Input label="Reason for Visit" value={apptReason} onChange={setApptReason} style={{ marginTop: 10 }} /><TouchableOpacity style={[styles.row, { marginTop: 10 }]} onPress={() => setIsFollowUp(!isFollowUp)}><MaterialCommunityIcons name={isFollowUp ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={Colors.primary} /><Text style={{ marginLeft: 10, color: Colors.text, fontWeight: '600' }}>Follow Up Appointment</Text></TouchableOpacity></View>) : null}</View><TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(form, bookAppt ? { bookit: true, time: apptTime, type: isFollowUp ? 'Follow Up' : 'Consultation', reason: apptReason } : { bookit: false })}><Text style={styles.btnText}>SAVE RECORD</Text></TouchableOpacity></ScrollView><Modal visible={showTimeModal} transparent={true} animationType="fade"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Select Appointment Time</Text><View style={styles.timeGrid}>{TIME_SLOTS.map(time => (<TouchableOpacity key={time} style={[styles.timeSlot, apptTime === time && styles.activeTimeSlot]} onPress={() => { setApptTime(time); setShowTimeModal(false); }}><Text style={[styles.timeSlotText, apptTime === time && { color: '#FFF' }]}>{time}</Text></TouchableOpacity>))}</View><TouchableOpacity style={styles.modalClose} onPress={() => setShowTimeModal(false)}><Text style={{ color: Colors.danger }}>Cancel</Text></TouchableOpacity></View></View></Modal></View>);
};

const LabList = ({ labs, navigate, onDelete, onEdit }) => {
  const [viewImage, setViewImage] = useState(null);
  return (<View style={styles.screenContainer}><Header title="Lab Reports" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_LAB)} /><FlatList data={labs} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.card}><View style={styles.row}><TouchableOpacity style={styles.labThumb} onPress={() => item.image && setViewImage(item.image)}>{item.image ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <FontAwesome5 name="file-medical" size={24} color={Colors.primary} />}</TouchableOpacity><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.cardTitle}>{item.testName}</Text><Text style={styles.cardSub}>{item.patientName}</Text><Text style={styles.cardSub}><FontAwesome5 name="clipboard-list" size={10} color={Colors.subText} /> <Text>{item.labNote}</Text></Text></View><TouchableOpacity onPress={() => item.image ? setViewImage(item.image) : Alert.alert("No Proof", "No image uploaded")} style={styles.iconBtn}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { marginLeft: 5 }]}><FontAwesome5 name="pen" size={14} color={Colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 5 }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>)} ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No reports found.</Text></View>} /><Modal visible={!!viewImage} transparent={true}><View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}><TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }} onPress={() => setViewImage(null)}><Ionicons name="close-circle" size={40} color="#FFF" /></TouchableOpacity>{viewImage && <Image source={{ uri: viewImage }} style={{ width: width, height: height * 0.8, resizeMode: 'contain' }} />}</View></Modal></View>);
};

const LabForm = ({ initialData, patients, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { patientId: patients[0]?.id, testName: '', date: new Date().toLocaleDateString(), image: null, labNote: '' }); 
  // FIX: Updated MediaTypeOptions with safety check
  const pickProof = async () => { 
      let mediaType = ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : 'Images'; 
      let r = await ImagePicker.launchImageLibraryAsync({ 
          mediaTypes: mediaType, 
          quality: 0.8 
      }); 
      if (!r.canceled) setForm({ ...form, image: r.assets[0].uri }); 
  };
  return (<View style={styles.screenContainer}><Header title={initialData ? "Edit Report" : "Upload Report"} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><Text style={styles.label}>Select Patient</Text><View style={styles.inputBox}><Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>{patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}</Picker></View><Input label="Test Name" placeholder="e.g. Blood Test, USG KUB" value={form.testName} onChange={t => setForm({ ...form, testName: t })} /><Input label="Lab Note / Result Detail" placeholder="e.g. 220 mg/dL" value={form.labNote} onChange={t => setForm({ ...form, labNote: t })} /><Text style={styles.label}>Upload Proof (Image)</Text><TouchableOpacity style={styles.imagePicker} onPress={pickProof}>{form.image ? <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <View style={{ alignItems: 'center' }}><FontAwesome5 name="cloud-upload-alt" size={30} color={Colors.subText} /><Text style={{ color: Colors.subText, marginTop: 5 }}>Click to Upload</Text></View>}</TouchableOpacity><TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(form)}><Text style={styles.btnText}>SAVE REPORT</Text></TouchableOpacity></ScrollView></View>);
};

const InventoryScreen = ({ inventory, onUpdateStock, onAddItem, onDeleteItem, onUpdateItem, navigate }) => {
  const [medName, setMedName] = useState(''); const [dosageForm, setDosageForm] = useState('Tablet'); const [strength, setStrength] = useState(''); const [isAdding, setIsAdding] = useState(false); const [editingItem, setEditingItem] = useState(null);
  const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Piece'];
  const handleAdd = () => { if (medName && strength) { onAddItem(medName, dosageForm, strength); setMedName(''); setStrength(''); setIsAdding(false); } else { Alert.alert("Missing Fields", "Please enter Medicine Name and Strength"); } };
  const EditInventoryModal = () => {
    const [form, setForm] = useState(editingItem);
    useEffect(() => { setForm(editingItem); }, [editingItem]);
    if (!form) return null;
    const handleSave = () => { onUpdateItem(form.id, { name: form.name, strength: form.strength, dosage: form.dosage }); setEditingItem(null); }
    return (<Modal visible={!!editingItem} transparent={true} animationType="slide"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Edit Medicine</Text><Input label="Medicine Name" value={form.name} onChange={t => setForm({ ...form, name: t })} /><Input label="Strength" value={form.strength} onChange={t => setForm({ ...form, strength: t })} /><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={form.dosage} onValueChange={v => setForm({ ...form, dosage: v })} >{DOSAGE_FORMS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View><View style={[styles.row, { marginTop: 20 }]}><TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: Colors.subText, marginRight: 10 }]} onPress={() => setEditingItem(null)}><Text style={styles.btnText}>CANCEL</Text></TouchableOpacity><TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleSave}><Text style={styles.btnText}>SAVE</Text></TouchableOpacity></View></View></View></Modal>);
  };
  return (<View style={styles.screenContainer}><Header title="Inventory" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => setIsAdding(!isAdding)} /><EditInventoryModal />{isAdding ? (<View style={styles.addItemBox}><Text style={styles.subHeader}>Add New Medicine</Text><Input label="Medicine Name" value={medName} onChange={setMedName} style={{ marginBottom: 10 }} /><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={dosageForm} onValueChange={setDosageForm} style={{ height: 50 }}>{DOSAGE_FORMS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View><Input style={{ flex: 1 }} label="Strength" value={strength} onChange={setStrength} /></View><TouchableOpacity style={styles.btnSmall} onPress={handleAdd}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD MEDICINE</Text></TouchableOpacity></View>) : null}<FlatList data={inventory} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.invCard}><View style={styles.invIconBox}><FontAwesome5 name="pills" size={20} color={Colors.primary} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.invName}>{item.name} <Text style={styles.invStrength}>{item.strength}</Text></Text><Text style={styles.invUnit}>{item.dosage}</Text><Text style={[styles.stockStatus, { color: item.stock < 10 ? Colors.danger : Colors.success }]}>{item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`}</Text></View><View style={styles.counterContainer}><TouchableOpacity style={styles.counterBtn} onPress={() => onUpdateStock(item.id, -1)}><Entypo name="minus" size={24} color={Colors.danger} /></TouchableOpacity><TouchableOpacity style={styles.counterBtn} onPress={() => onUpdateStock(item.id, 1)}><Entypo name="plus" size={24} color={Colors.success} /></TouchableOpacity><TouchableOpacity style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.action + '20' }]} onPress={() => setEditingItem(item)}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]} onPress={() => onDeleteItem(item.id)}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View></View>)} ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No items in inventory.</Text></View>} /></View>);
};

const PrescriptionHistoryScreen = ({ patient, prescriptions, navigate, onDeleteRx, onEditRx }) => {
  const [viewRx, setViewRx] = useState(null); const [startDate, setStartDate] = useState(new Date('2023-01-01')); const [endDate, setEndDate] = useState(new Date()); const [showDatePicker, setShowDatePicker] = useState(null); const [filterMode, setFilterMode] = useState('recent');
  if (!patient) return null;
  const formattedStartDate = startDate.toLocaleDateString('en-CA');
  const formattedEndDate = endDate.toLocaleDateString('en-CA');
  const filteredPrescriptions = prescriptions.filter(item => item.date >= formattedStartDate && item.date <= formattedEndDate);
  const displayPrescriptions = filterMode === 'recent' ? filteredPrescriptions.slice(0, 10) : filteredPrescriptions;
  const handleExportPdf = async () => {
    if (filteredPrescriptions.length === 0) { Alert.alert("No Data", "No prescriptions in the selected date range to export."); return; }
    const today = new Date().toLocaleDateString('en-GB');
    const vitalsToHtml = (vitals) => { if (!vitals || Object.keys(vitals).length === 0) return ''; const vitalPills = Object.entries(vitals).map(([key, value]) => { if (!value) return ''; const label = Object.keys(VITAL_KEYS).find(k => VITAL_KEYS[k] === key); return label ? `<div class="vital-pill"><strong>${label}:</strong> ${value}</div>` : ''; }).join(''); return `<h4 class="vitals-header">Vitals Recorded</h4><div class="vitals-container">${vitalPills}</div>`; };
    const proceduresToHtml = (procedures) => { if (!procedures || procedures.length === 0) return ''; const procedureRows = procedures.map(p => `<tr><td>${p.name}</td><td>₹${p.cost}</td></tr>`).join(''); return `<h4 class="medicines-header">Procedures Performed</h4><table><thead><tr><th>Procedure</th><th>Cost (₹)</th></tr></thead><tbody>${procedureRows}</tbody></table>`; };
    const prescriptionsHtml = filteredPrescriptions.map(rx => `
        <div class="rx-item">
          <div class="rx-header"><h3>Date: ${new Date(rx.date).toLocaleDateString('en-GB')}</h3><p><strong>Diagnosis:</strong> ${rx.diagnosis}</p></div>
          <div class="rx-body">
            ${vitalsToHtml(rx.vitals)}
            <h4 class="medicines-header">Medicines</h4>
            <table><thead><tr><th>Medicine</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${rx.medicines.map(med => `<tr><td>${med.name} ${med.strength} (${med.dosage})</td><td>${med.frequency}</td><td>${med.duration}</td><td>${med.instructions || '-'}</td></tr>`).join('')}</tbody></table>
            ${proceduresToHtml(rx.proceduresPerformed)}
            ${rx.notes ? `<div class="notes-section"><p><strong>Notes:</strong> ${rx.notes}</p></div>` : ''}
          </div>
        </div>`).join('');
    const htmlContent = `<html><head><style> @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'); body { font-family: 'Roboto', Arial, sans-serif; color: #333; margin: 25px; font-size: 12px; } .letterhead { text-align: center; border-bottom: 2px solid ${Colors.primary}; padding-bottom: 10px; margin-bottom: 20px; } .letterhead h1 { color: ${Colors.primaryDark}; margin: 0; } .letterhead p { margin: 2px 0; font-size: 11px; color: ${Colors.subText}; } .patient-info { background-color: ${Colors.bg}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0; } .patient-info p { margin: 4px 0; } .rx-item { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; } .rx-header { background-color: ${Colors.primary}1A; color: ${Colors.primaryDark}; padding: 10px 15px; border-bottom: 1px solid #ddd; } .rx-header h3, .rx-header p { margin: 0; } .rx-body { padding: 15px; } .vitals-header, .medicines-header { color: ${Colors.primary}; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; } .vitals-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; } .vital-pill { background-color: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 11px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #e0e0e0; padding: 8px; text-align: left; } th { background-color: #f5f5f5; font-weight: bold; } tbody tr:nth-child(even) { background-color: #f9f9f9; } .notes-section { margin-top: 15px; padding: 10px; background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; font-style: italic; } .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; } </style></head><body> <div class="letterhead"><h1>${DOCTOR_NAME}</h1><p>${CLINIC_ADDRESS} | Phone: ${DOCTOR_PHONE}</p></div> <h2>Prescription History</h2> <div class="patient-info"><p><strong>Patient:</strong> ${patient.name}</p><p><strong>Age:</strong> ${patient.age}</p><p><strong>Gender:</strong> ${patient.gender}</p><p><strong>Report Period:</strong> ${formattedStartDate} to ${formattedEndDate}</p></div> ${prescriptionsHtml} <div class="footer"><p>This is a computer-generated report. | Generated on: ${today}</p><p><strong>${DOCTOR_NAME}</strong></p></div> </body></html>`;
    try { const { uri } = await Print.printToFileAsync({ html: htmlContent }); await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription History' }); } catch (error) { Alert.alert("Error", "Could not generate or share PDF."); }
  };
  const onDateChange = (event, selectedDate) => { setShowDatePicker(null); if (event.type === 'set' && selectedDate) { if (showDatePicker === 'start') setStartDate(selectedDate); else if (showDatePicker === 'end') setEndDate(selectedDate); } };
  const RxTableItem = ({ item }) => (<View key={item.id} style={styles.rxTableItem}><View style={styles.rxTableCol}><Text style={styles.rxDate}>{item.date}</Text><Text style={styles.rxDiagnosis}>{item.diagnosis}</Text><Text style={{ fontSize: 12, color: Colors.subText }}>{item.medicines.length} Medicine(s) {item.templateName ? <Text>({item.templateName})</Text> : null}</Text></View><View style={{ flexDirection: 'row', alignItems: 'center' }}><TouchableOpacity onPress={() => setViewRx(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onEditRx(item)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.primary + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => onDeleteRx(item.id)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>);
  return (<View style={styles.screenContainer}><Header title={`Rx History: ${patient.name}`} onBack={() => navigate(Screens.PATIENT_DETAILS, patient)} onAdd={() => navigate(Screens.ADD_RX, patient)} /><ScrollView contentContainerStyle={{ padding: 20 }}><Text style={styles.sectionTitleSmall}>Filter by Date</Text><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Start Date</Text><TouchableOpacity onPress={() => setShowDatePicker('start')} style={styles.pickerBtnSmall}><Text style={styles.pickerTextSmall}>{formattedStartDate}</Text></TouchableOpacity></View><View style={{ flex: 1 }}><Text style={styles.label}>End Date</Text><TouchableOpacity onPress={() => setShowDatePicker('end')} style={styles.pickerBtnSmall}><Text style={styles.pickerTextSmall}>{formattedEndDate}</Text></TouchableOpacity></View></View><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} onPress={handleExportPdf}><FontAwesome5 name="file-pdf" size={14} color="#FFF" style={{ marginRight: 10 }} /><Text style={{ color: '#FFF', fontWeight: 'bold' }}>EXPORT PDF</Text></TouchableOpacity>{showDatePicker ? <DateTimePicker value={showDatePicker === 'start' ? startDate : endDate} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} /> : null}
    <View style={styles.filterContainer}>
      <TouchableOpacity style={[styles.filterButton, filterMode === 'recent' && styles.filterButtonActive]} onPress={() => setFilterMode('recent')}><Text style={[styles.filterButtonText, filterMode === 'recent' && styles.filterButtonTextActive]}>Recent (10)</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]} onPress={() => setFilterMode('all')}><Text style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>All (<Text>{filteredPrescriptions.length}</Text>)</Text></TouchableOpacity>
    </View>
    <Text style={styles.sectionTitle}>Prescription History (<Text>{displayPrescriptions.length}</Text>)</Text>
    {displayPrescriptions.length === 0 ? (<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No prescriptions found.</Text></View>) : (<View style={styles.rxTable}><View style={styles.rxTableHeader}><Text style={styles.rxHeaderCol}>Date/Diagnosis</Text><Text style={{ width: 120, textAlign: 'right', fontWeight: 'bold', color: Colors.text }}>Actions</Text></View>{displayPrescriptions.map(item => <RxTableItem key={item.id} item={item} />)}</View>)}</ScrollView><PrescriptionDetailModal rx={viewRx} onClose={() => setViewRx(null)} /></View>);
};

const NewPrescriptionForm = ({ patient, inventory, templates, onSave, onCancel, initialData }) => {
  const isEdit = !!initialData;
  const medicineNames = [...new Set(inventory.map(i => i.name))];
  const dosageForms = [...new Set(inventory.map(i => i.dosage))];
  const [rxData, setRxData] = useState(initialData ? { ...initialData, vitals: initialData.vitals || patient.vitals || {}, templateId: initialData.templateId || 'template-none', proceduresPerformed: initialData.proceduresPerformed || [] } : { patientId: patient.id, diagnosis: '', notes: '', isTapering: false, vitals: patient?.vitals || {}, medicines: [], proceduresPerformed: [], templateId: 'template-none', });
  const [currentMed, setCurrentMed] = useState({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  const [currentProc, setCurrentProc] = useState({ name: '', cost: '' });
  useEffect(() => { if (isEdit) return; const selectedTemplate = templates.find(t => t.id === rxData.templateId); if (selectedTemplate && selectedTemplate.id !== 'template-none') { setRxData(prev => ({ ...prev, diagnosis: selectedTemplate.diagnosis, medicines: selectedTemplate.medicines.map(m => ({ ...m, id: 'med_' + Date.now() + Math.random() })) })); } else if (selectedTemplate && selectedTemplate.id === 'template-none') { setRxData(prev => ({ ...prev, diagnosis: '', medicines: [] })); } }, [rxData.templateId, templates, isEdit]);
  const VitalInputRx = ({ label, unit, kbd = 'default', style }) => {
    const key = VITAL_KEYS[label];
    const value = rxData.vitals[key] || '';
    const handleChange = (t) => { const cleanedText = key === 'bp' ? t.replace(/[^0-9\/]/g, '') : t.replace(/[^0-9\.]/g, ''); setRxData(prev => ({ ...prev, vitals: { ...prev.vitals, [key]: cleanedText } })); };
    return (
      <View style={[{ marginBottom: 15, flex: 1 }, style]}>
        <Text style={styles.label}>{label} {unit ? <Text>({unit})</Text> : null}</Text>
        <View style={styles.inputBoxRx}>
          <TextInput style={{ flex: 1, padding: 0, fontSize: 16 }} value={value} onChangeText={handleChange} keyboardType={kbd} />
          {unit ? <Text style={{ color: Colors.subText, marginLeft: 5 }}>{unit}</Text> : null}
        </View>
      </View>
    );
  };
  const handleAddMedicine = () => {
    if (!currentMed.name || !currentMed.strength) { Alert.alert("Missing Fields", "Please enter Medicine Name and Strength."); return; }
    const newMed = { ...currentMed, id: 'med_' + Date.now() + Math.random() };
    setRxData(prev => ({ ...prev, medicines: [...prev.medicines, newMed] }));
    setCurrentMed({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  };
  const handleRemoveMedicine = (id) => { setRxData(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== id) })); };
  const handleAddProcedure = () => {
    if (!currentProc.name || !currentProc.cost) { Alert.alert("Missing Fields", "Please enter Procedure Name and Cost."); return; }
    setRxData(prev => ({ ...prev, proceduresPerformed: [...prev.proceduresPerformed, { ...currentProc, id: 'proc_' + Date.now() + Math.random() }] }));
    setCurrentProc({ name: '', cost: '' });
  };
  const handleRemoveProcedure = (id) => { setRxData(prev => ({ ...prev, proceduresPerformed: prev.proceduresPerformed.filter(p => p.id !== id) })); };
  const handleFinalSave = () => { if (!rxData.diagnosis || rxData.medicines.length === 0) { Alert.alert("Incomplete Data", "Please enter a diagnosis and at least one medicine."); return; } const selectedTemplate = templates.find(t => t.id === rxData.templateId); onSave({ ...rxData, templateName: selectedTemplate?.name || 'Custom' }); };
  return (<View style={styles.screenContainer}><Header title={`${isEdit ? 'Edit' : 'New'} Rx: ${patient.name}`} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><View style={[styles.card, { marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.primary }]}><Text style={styles.sectionTitle}>Vitals (Latest)</Text><View style={styles.row}><VitalInputRx label="SpO2" unit="%" kbd="numeric" style={{ marginRight: 10 }} /><VitalInputRx label="BP" unit="mmHg" /></View><View style={styles.row}><VitalInputRx label="HR" unit="bpm" kbd="numeric" style={{ marginRight: 10 }} /><VitalInputRx label="Temp" unit="°F" kbd="numeric" /></View><VitalInputRx label="Weight" unit="kg" kbd="numeric" /></View><View style={[styles.card, { marginBottom: 20, borderLeftWidth: 4, borderLeftColor: Colors.action }]}><Text style={styles.sectionTitle}>Template & Notes</Text><Text style={styles.label}>Select Template</Text><View style={styles.pickerContainer}><Picker selectedValue={rxData.templateId} onValueChange={(v) => setRxData({ ...rxData, templateId: v })}>{templates.map(t => <Picker.Item key={t.id} label={t.name} value={t.id} />)}</Picker></View><Input label="Diagnosis" placeholder="e.g., UROLITHIASIS" value={rxData.diagnosis} onChange={(t) => setRxData({ ...rxData, diagnosis: t })} /><Input label="Doctor's Notes/Additional Instructions" value={rxData.notes} onChange={(t) => setRxData({ ...rxData, notes: t })} multiline={true} style={{ marginBottom: 20 }} /></View>
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: Colors.success, marginBottom: 20 }]}>
      <Text style={styles.sectionTitle}>Prescribed Medicines (<Text>{rxData.medicines.length}</Text>)</Text>{rxData.medicines.map((med) => (<View key={med.id} style={styles.medCard}><View style={{ flex: 1 }}><Text style={styles.medName}>{med.name} - {med.strength}</Text><Text style={styles.medDetails}>{med.dosage} | {med.frequency} for {med.duration}</Text><Text style={styles.medInstructions}><FontAwesome5 name="clipboard" size={10} color={Colors.subText} /> <Text>{med.instructions}</Text></Text></View><TouchableOpacity onPress={() => handleRemoveMedicine(med.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View>))}<View style={styles.addItemBox}><Text style={styles.subHeader}>Add New Medicine</Text><Text style={styles.label}>Medicine Name</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.name} onValueChange={(v) => setCurrentMed({ ...currentMed, name: v })}>{medicineNames.map(name => <Picker.Item key={name} label={name} value={name} />)}</Picker></View><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="Strength" placeholder="e.g., 500mg" value={currentMed.strength} onChange={(t) => setCurrentMed({ ...currentMed, strength: t })} /><View style={{ flex: 1 }}><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.dosage} onValueChange={(v) => setCurrentMed({ ...currentMed, dosage: v })} style={{ height: 40 }}>{dosageForms.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View></View><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Frequency</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.frequency} onValueChange={(v) => setCurrentMed({ ...currentMed, frequency: v })} style={{ height: 40 }}>{FREQUENCY_OPTIONS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View><View style={{ flex: 1 }}><Text style={styles.label}>Duration</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.duration} onValueChange={(v) => setCurrentMed({ ...currentMed, duration: v })} style={{ height: 40 }}>{DURATION_OPTIONS.map(d => <Picker.Item key={d} label={d} value={d} />)}</Picker></View></View></View><Input label="Specific Instructions" placeholder="e.g., After food" value={currentMed.instructions} onChange={(t) => setCurrentMed({ ...currentMed, instructions: t })} /><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action }]} onPress={handleAddMedicine}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD TO PRESCRIPTION</Text></TouchableOpacity></View>
    </View>
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: Colors.dash6 }]}>
      <Text style={styles.sectionTitle}>Procedures Performed (<Text>{rxData.proceduresPerformed.length}</Text>)</Text>{rxData.proceduresPerformed.map((proc) => (<View key={proc.id} style={[styles.medCard, { borderLeftColor: Colors.dash6 }]}><View style={{ flex: 1 }}><Text style={styles.medName}>{proc.name}</Text><Text style={styles.medDetails}>Cost: <Text>₹{proc.cost}</Text></Text></View><TouchableOpacity onPress={() => handleRemoveProcedure(proc.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View>))}<View style={styles.addItemBox}><Text style={styles.subHeader}>Add Procedure</Text><View style={styles.row}><Input style={{ flex: 2, marginRight: 10 }} label="Procedure Name" placeholder="e.g., Dressing" value={currentProc.name} onChange={t => setCurrentProc({ ...currentProc, name: t })} /><Input style={{ flex: 1 }} label="Cost (₹)" kbd="numeric" value={currentProc.cost} onChange={t => setCurrentProc({ ...currentProc, cost: t })} /></View><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.dash6 }]} onPress={handleAddProcedure}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD PROCEDURE</Text></TouchableOpacity></View>
    </View>
    <TouchableOpacity style={styles.btnPrimary} onPress={handleFinalSave}><Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} PRESCRIPTION</Text></TouchableOpacity></ScrollView></View>);
};

const TemplateManagerScreen = ({ templates, navigate, onEdit, onDelete }) => {
  return (<View style={styles.screenContainer}><Header title="Manage Rx Templates" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_TEMPLATE)} /><FlatList data={templates.filter(t => t.id !== 'template-none')} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.card}><View style={styles.row}><View style={[styles.invIconBox, { backgroundColor: Colors.dash5 + '20' }]}><FontAwesome5 name="file-signature" size={20} color={Colors.dash5} /></View><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.invName}>{item.name}</Text><Text style={styles.cardSub}>{item.medicines.length} medicine(s)</Text></View><View style={styles.row}><TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View></View>)} ListEmptyComponent={<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No custom templates found. Tap '+' to add one.</Text></View>} /></View>);
};

const AddTemplateForm = ({ initialData, inventory, onSave, onCancel }) => {
  const isEdit = !!initialData; const medicineNames = [...new Set(inventory.map(i => i.name))]; const dosageForms = [...new Set(inventory.map(i => i.dosage))]; const [templateData, setTemplateData] = useState(initialData || { name: '', diagnosis: '', medicines: [] }); const [currentMed, setCurrentMed] = useState({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  const handleAddMedicine = () => {
    if (!currentMed.name || !currentMed.strength) { Alert.alert("Missing Fields", "Please enter Medicine Name and Strength."); return; }
    const newMed = { ...currentMed, id: 'temp_med_' + Date.now() + Math.random() };
    setTemplateData(prev => ({ ...prev, medicines: [...prev.medicines, newMed] }));
    setCurrentMed({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  };
  const handleRemoveMedicine = (id) => { setTemplateData(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== id) })); };
  const handleFinalSave = () => { if (!templateData.name || !templateData.diagnosis) { Alert.alert("Incomplete Data", "Please enter a Template Name and a default Diagnosis."); return; } onSave(templateData); };
  return (<View style={styles.screenContainer}><Header title={isEdit ? "Edit Template" : "Add New Template"} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><Input label="Template Name" placeholder="e.g., Fever, Allergy" value={templateData.name} onChange={(t) => setTemplateData({ ...templateData, name: t })} /><Input label="Default Diagnosis" placeholder="e.g., Viral Fever" value={templateData.diagnosis} onChange={(t) => setTemplateData({ ...templateData, diagnosis: t })} /><Text style={styles.sectionTitle}>Medicines in Template (<Text>{templateData.medicines.length}</Text>)</Text>{templateData.medicines.map((med) => (<View key={med.id} style={styles.medCard}><View style={{ flex: 1 }}><Text style={styles.medName}>{med.name} - {med.strength}</Text><Text style={styles.medDetails}>{med.dosage} | {med.frequency} for {med.duration}</Text><Text style={styles.medInstructions}><FontAwesome5 name="clipboard" size={10} color={Colors.subText} /> <Text>{med.instructions}</Text></Text></View><TouchableOpacity onPress={() => handleRemoveMedicine(med.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View>))}<View style={[styles.addItemBox, { marginTop: 10 }]}><Text style={styles.subHeader}>Add Medicine to Template</Text><Text style={styles.label}>Medicine Name</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.name} onValueChange={(v) => setCurrentMed({ ...currentMed, name: v })}>{medicineNames.map(name => <Picker.Item key={name} label={name} value={name} />)}</Picker></View><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="Strength" value={currentMed.strength} onChange={(t) => setCurrentMed({ ...currentMed, strength: t })} /><View style={{ flex: 1 }}><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.dosage} onValueChange={(v) => setCurrentMed({ ...currentMed, dosage: v })} style={{ height: 40 }}>{dosageForms.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View></View><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Frequency</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.frequency} onValueChange={(v) => setCurrentMed({ ...currentMed, frequency: v })} style={{ height: 40 }}>{FREQUENCY_OPTIONS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View><View style={{ flex: 1 }}><Text style={styles.label}>Duration</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.duration} onValueChange={(v) => setCurrentMed({ ...currentMed, duration: v })} style={{ height: 40 }}>{DURATION_OPTIONS.map(d => <Picker.Item key={d} label={d} value={d} />)}</Picker></View></View></View><Input label="Instructions" value={currentMed.instructions} onChange={(t) => setCurrentMed({ ...currentMed, instructions: t })} /><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action }]} onPress={handleAddMedicine}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD TO TEMPLATE</Text></TouchableOpacity></View><TouchableOpacity style={styles.btnPrimary} onPress={handleFinalSave}><Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} TEMPLATE</Text></TouchableOpacity></ScrollView></View>);
};

const ProceduresHistoryScreen = ({ procedures, navigate, onEdit, onDelete }) => {
  const totalRevenue = procedures.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0); const formattedRevenue = `₹ ${totalRevenue.toLocaleString('en-IN')}`;
  return (
    <View style={styles.screenContainer}>
      <Header title="Procedures History" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PROCEDURE)} />
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View style={[styles.revenueCard, { backgroundColor: Colors.dash6 }]}>
          <View>
            <Text style={styles.revenueLabel}>Total Revenue from Procedures</Text>
            <Text style={styles.revenueValue}>{formattedRevenue}</Text>
          </View>
          <FontAwesome5 name="rupee-sign" size={30} color="#FFF" opacity={0.8} />
        </View>
      </View>
      <FlatList
        data={procedures}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.invIconBox, { backgroundColor: Colors.dash6 + '20' }]}>
                <FontAwesome5 name="band-aid" size={20} color={Colors.dash6} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.invName}>{item.procedureName}</Text>
                <Text style={styles.cardSub}>{item.patientName}</Text>
                <Text style={styles.cardSub}>{item.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.procedureCost}>₹{item.cost}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <View style={{ flex: 1 }}>
                {item.notes ? <Text style={styles.notesText}><FontAwesome5 name="sticky-note" /> <Text>{item.notes}</Text></Text> : null}
              </View>
              <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No procedures recorded yet.</Text></View>}
      />
    </View>
  );
};

const AddProcedureForm = ({ initialData, patients, onSave, onCancel }) => {
  const isEdit = !!initialData; const [form, setForm] = useState(initialData || { patientId: patients[0]?.id, procedureName: '', date: new Date().toLocaleDateString('en-CA'), cost: '', notes: '' }); const [date, setDate] = useState(new Date(form.date)); const [showDatePicker, setShowDatePicker] = useState(false);
  const onDateChange = (event, selectedDate) => { setShowDatePicker(false); if (event.type === 'set' && selectedDate) { setDate(selectedDate); setForm({ ...form, date: selectedDate.toLocaleDateString('en-CA') }); } };
  const handleSave = () => { if (!form.patientId || !form.procedureName || !form.cost) { Alert.alert("Missing Fields", "Please fill in Patient, Procedure Name, and Cost."); return; } onSave(form); };
  return (<View style={styles.screenContainer}><Header title={isEdit ? "Edit Procedure" : "Add Procedure"} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><Text style={styles.label}>Select Patient</Text><View style={styles.pickerContainer}><Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>{patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}</Picker></View><Input label="Procedure Name" placeholder="e.g., Suture, Dressing" value={form.procedureName} onChange={t => setForm({ ...form, procedureName: t })} /><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Date</Text><TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerBtn}><Text style={styles.pickerText}>{form.date}</Text><FontAwesome5 name="calendar-alt" size={16} color={Colors.primary} /></TouchableOpacity></View><Input style={{ flex: 1 }} label="Cost (₹)" kbd="numeric" value={form.cost} onChange={t => setForm({ ...form, cost: t })} /></View>{showDatePicker ? <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} /> : null}<Input label="Notes (Optional)" placeholder="Any relevant notes..." value={form.notes} onChange={t => setForm({ ...form, notes: t })} multiline={true} style={{ height: 100 }} /><TouchableOpacity style={styles.btnPrimary} onPress={handleSave}><Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} PROCEDURE</Text></TouchableOpacity></ScrollView></View>);
};

const PrescriptionDetailModal = ({ rx, onClose }) => {
  if (!rx) return null; const getVitalValue = (key, unit = '') => { const val = rx.vitals?.[key]; if (val === null || val === undefined || val === '') return 'N/A'; const displayUnit = key === 'bp' ? '' : unit; return `${val}${displayUnit}`; };
  return (<Modal visible={!!rx} transparent={true} animationType="fade"><View style={styles.modalOverlay}><View style={[styles.modalContent, { width: '90%' }]}><Text style={styles.modalTitle}>Prescription Details</Text><Text style={{ textAlign: 'center', color: Colors.subText, marginBottom: 15 }}>{rx.patientName} - {rx.date}</Text><ScrollView style={{ maxHeight: height * 0.7 }}><Text style={styles.sectionTitleSmall}>Diagnosis</Text><Text style={styles.detailText}>{rx.diagnosis}</Text><Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Vitals</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}><DetailPill label="BP" value={getVitalValue('bp')} unit="mmHg" color={Colors.action} /><DetailPill label="HR" value={getVitalValue('hr')} unit="bpm" color={Colors.danger} /><DetailPill label="Temp" value={getVitalValue('temp')} unit="°F" color={Colors.warning} /><DetailPill label="SpO2" value={getVitalValue('spo2')} unit="%" color={Colors.success} /><DetailPill label="Weight" value={getVitalValue('weight')} unit="kg" color={Colors.primary} /></View><Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Medicines</Text>{rx.medicines.length === 0 ? <Text style={styles.emptyText}>No medicines prescribed.</Text> : rx.medicines.map((med, index) => (
    <View key={med.id || index} style={styles.medDetailItem}><Text style={styles.medNameDetail}>{index + 1}. {med.name} {med.strength}</Text><Text style={styles.medDetailsDetail}>{med.dosage} | {med.frequency} for {med.duration}</Text><Text style={styles.medInstructionsDetail}>* {med.instructions}</Text></View>
  ))}{rx.proceduresPerformed && rx.proceduresPerformed.length > 0 ? (<><Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Procedures</Text>{rx.proceduresPerformed.map((proc, index) => (
    <View key={proc.id || index} style={styles.medDetailItem}><Text style={styles.medNameDetail}>{proc.name} (Cost: ₹{proc.cost})</Text></View>
  ))}</>) : null}{rx.notes ? (<><Text style={[styles.sectionTitleSmall, { marginTop: 10 }]}>Doctor's Notes</Text><Text style={styles.detailText}>{rx.notes}</Text></>) : null}</ScrollView><TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.subText, padding: 10, marginTop: 15 }]} onPress={onClose}><Text style={[styles.btnText, { fontSize: 14 }]}>CLOSE</Text></TouchableOpacity></View></View></Modal>);
};

const DetailPill = ({ label, value, unit, color }) => (<View style={{ flexDirection: 'row', backgroundColor: color + '15', padding: 8, borderRadius: 10, margin: 3, flexBasis: '47%', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, color: color, fontWeight: 'bold' }}>{label}: </Text><Text style={{ fontSize: 14, color: Colors.text }}>{value} <Text style={{ fontSize: 10, color: Colors.subText }}>{value !== 'N/A' ? unit : ''}</Text></Text></View>);
const Header = ({ title, onBack, onAdd }) => (<View style={styles.header}>{onBack ? <TouchableOpacity onPress={onBack}><MaterialIcons name="arrow-back-ios" size={24} color="#FFF" /></TouchableOpacity> : null}<Text style={styles.headerTitle}>{title}</Text>{onAdd ? <TouchableOpacity onPress={onAdd}><MaterialIcons name="add" size={32} color="#FFF" /></TouchableOpacity> : <View style={{ width: 32 }} />}</View>);
const DashboardCard = ({ title, count, icon, color, onPress }) => (<TouchableOpacity style={[styles.gridCard, { borderLeftWidth: 4, borderLeftColor: color }]} onPress={onPress}><View style={[styles.iconCircle, { backgroundColor: color + '20' }]}><FontAwesome5 name={icon} size={24} color={color} /></View><Text style={[styles.gridCount, { color }]}>{String(count)}</Text><Text style={styles.gridTitle}>{title}</Text></TouchableOpacity>);
const VitalBox = ({ label, val, unit, icon, color }) => (<View style={[styles.vitalCard, { borderTopColor: color }]}><FontAwesome5 name={icon} size={20} color={color} /><Text style={styles.vitalVal}>{val || 'N/A'} <Text style={{ fontSize: 12, color: Colors.subText }}>{val ? unit : ''}</Text></Text><Text style={styles.vitalLabel}>{label}</Text></View>);
const Input = ({ label, value, onChange, style, kbd, placeholder, multiline }) => (<View style={[{ marginBottom: 15 }, style]}><Text style={styles.label}>{label}</Text><TextInput style={[styles.inputBox, multiline && { height: style?.height || 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} keyboardType={kbd || 'default'} placeholder={placeholder} multiline={multiline} /></View>);
const DrawerItem = ({ icon, label, color, onPress }) => (<TouchableOpacity style={styles.drawerItem} onPress={onPress}><FontAwesome5 name={icon} size={20} color={color} style={{ width: 40 }} /><Text style={[styles.drawerLabel, { color }]}>{label}</Text></TouchableOpacity>);

const styles = StyleSheet.create({
  // --- LAYOUT & BASICS ---
  container: { 
    flex: 1, 
    backgroundColor: Colors.bg 
  },
  screenContainer: { 
    flex: 1, 
    backgroundColor: Colors.bg 
  },
  
  // --- HEADER ---
  header: { 
    height: 80, 
    backgroundColor: Colors.primary, 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 25, 
    borderBottomRightRadius: 25, 
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold', 
    flex: 1, 
    textAlign: 'center' 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: Colors.text, 
    marginTop: 15, 
    marginBottom: 10 
  },
  
  // --- LOADER ---
  loaderOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loaderBox: { 
    backgroundColor: '#FFF', 
    padding: 25, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 10 
  },
  loaderText: { 
    marginTop: 10, 
    color: Colors.text, 
    fontWeight: 'bold' 
  },
  
  // --- DASHBOARD ---
  welcomeBanner: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: Colors.primaryDark, 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20,
    elevation: 5
  },
  welcomeText: { 
    color: '#FFF', 
    fontSize: 14, 
    opacity: 0.8 
  },
  docName: { 
    color: '#FFF', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  gridCard: { 
    width: CARD_WIDTH, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  iconCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  gridCount: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  gridTitle: { 
    fontSize: 14, 
    color: Colors.subText 
  },
  
  // --- APPOINTMENTS ---
  apptCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 10, 
    alignItems: 'center', 
    elevation: 2 
  },
  timeBox: { 
    backgroundColor: '#E0F2F1', 
    padding: 8, 
    borderRadius: 8 
  },
  timeText: { 
    color: Colors.primary, 
    fontWeight: 'bold' 
  },
  apptName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  apptType: { 
    fontSize: 12, 
    color: Colors.subText 
  },
  apptSection: { 
    backgroundColor: '#E0F7FA', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: Colors.primary 
  },
  sectionTitleSmall: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.primaryDark, 
    flex: 1 
  },
  
  // --- FORMS & INPUTS ---
  toggleBtn: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  pickerBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderWidth: 1, 
    borderColor: '#B2DFDB' 
  },
  pickerText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  label: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: Colors.subText, 
    marginBottom: 5, 
    marginTop: 5 
  },
  inputBox: { 
    backgroundColor: '#FFF', 
    borderRadius: 10, 
    padding: Platform.OS === 'ios' ? 15 : 12, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#CFD8DC' 
  },
  btnPrimary: { 
    backgroundColor: Colors.primary, 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10, 
    elevation: 5 
  },
  btnText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  pickerContainer: { 
    borderWidth: 1, 
    borderColor: '#CFD8DC', 
    borderRadius: 10, 
    backgroundColor: '#FFF', 
    overflow: 'hidden', 
    justifyContent: 'center' 
  },
  pickerBtnSmall: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 8, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderWidth: 1, 
    borderColor: '#B2DFDB' 
  },
  pickerTextSmall: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  
  // --- MODALS ---
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '85%', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  timeGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center' 
  },
  timeSlot: { 
    padding: 10, 
    margin: 5, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#EEE', 
    backgroundColor: '#FAFAFA' 
  },
  activeTimeSlot: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  timeSlotText: { 
    color: Colors.text 
  },
  modalClose: { 
    marginTop: 15, 
    alignItems: 'center', 
    padding: 10 
  },
  
  // --- LISTS & CARDS ---
  card: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 12, 
    elevation: 3 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  cardSub: { 
    fontSize: 13, 
    color: Colors.subText 
  },
  listAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#EEE' 
  },
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#EEE', 
    paddingTop: 10, 
    alignItems: 'center' 
  },
  actionLabelBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E0F2F1', 
    paddingVertical: 5, 
    paddingHorizontal: 10, 
    borderRadius: 5, 
    marginRight: 10 
  },
  actionLabelText: { 
    color: Colors.primary, 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginLeft: 5 
  },
  iconBtn: { 
    padding: 8, 
    backgroundColor: '#F5F7FA', 
    borderRadius: 8 
  },
  searchContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    margin: 20, 
    marginBottom: 10, 
    borderRadius: 10, 
    padding: 10, 
    alignItems: 'center', 
    elevation: 2 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16 
  },
  emptyState: { 
    alignItems: 'center', 
    padding: 40, 
    backgroundColor: Colors.card, 
    borderRadius: 15, 
    marginTop: 20 
  },
  emptyText: { 
    color: Colors.subText, 
    marginTop: 15, 
    fontSize: 16, 
    fontStyle: 'italic', 
    textAlign: 'center' 
  },
  
  // --- ID CARD STYLES (TEAL) ---
  idCardContainer: { 
    backgroundColor: Colors.tealCard, 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 6, 
    position: 'relative', 
    overflow: 'hidden' 
  },
  idCardCurve: { 
    position: 'absolute', 
    top: -50, 
    left: -50, 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  idCardTitle: { 
    textAlign: 'center', 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold', 
    letterSpacing: 3, 
    marginBottom: 15 
  },
  idAvatarBox: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  idAvatarCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },
  idAvatarImg: { 
    width: 90, 
    height: 90 
  },
  idDivider: { 
    height: 3, 
    backgroundColor: Colors.yellowAccent, 
    width: '100%', 
    marginVertical: 15 
  },
  idFooterBtn: { 
    backgroundColor: '#FFF', 
    borderRadius: 10, 
    paddingVertical: 12, 
    alignItems: 'center', 
    marginTop: 10 
  },
  
  // --- ID CARD BUTTONS (OUTSIDE CAPTURE VIEW) ---
  idActionRowOuter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  idActionBtnOuter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 10, 
    backgroundColor: Colors.primary, 
    flex: 0.48, 
    justifyContent: 'center' 
  },
  idActionText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    marginLeft: 8, 
    fontSize: 13 
  },

  // --- VITALS ---
  vitalGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  vitalCard: { 
    width: '30%', 
    backgroundColor: '#FFF', 
    padding: 10, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderTopWidth: 4, 
    elevation: 3, 
    justifyContent: 'space-between' 
  },
  vitalVal: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 5 
  },
  vitalLabel: { 
    fontSize: 12, 
    color: Colors.subText 
  },
  
  // --- UPLOADS & IMAGES ---
  uploadCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#E0F2F1', 
    alignSelf: 'center', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    overflow: 'hidden' 
  },
  labThumb: { 
    width: 50, 
    height: 50, 
    borderRadius: 10, 
    backgroundColor: '#E0F2F1', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imagePicker: { 
    height: 150, 
    backgroundColor: '#F5F7FA', 
    borderRadius: 15, 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: '#CFD8DC', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  
  // --- PRESCRIPTION & TABLES ---
  inputBoxRx: { 
    backgroundColor: '#FFF', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#CFD8DC', 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  rxTable: { 
    backgroundColor: Colors.card, 
    borderRadius: 15, 
    elevation: 2, 
    overflow: 'hidden' 
  },
  rxTableHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    backgroundColor: Colors.bg, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE' 
  },
  rxHeaderCol: { 
    flex: 1, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  rxTableItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE', 
    alignItems: 'center' 
  },
  rxTableCol: { 
    flex: 1, 
    paddingRight: 10 
  },
  rxDate: { 
    fontSize: 12, 
    color: Colors.subText 
  },
  rxDiagnosis: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: Colors.text, 
    marginTop: 2 
  },
  medCard: { 
    flexDirection: 'row', 
    backgroundColor: '#F5F7FA', 
    padding: 10, 
    borderRadius: 10, 
    marginBottom: 8, 
    alignItems: 'center', 
    borderLeftWidth: 4, 
    borderLeftColor: Colors.primary 
  },
  medName: { 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  medDetails: { 
    fontSize: 12, 
    color: Colors.subText, 
    fontStyle: 'italic' 
  },
  medInstructions: { 
    fontSize: 12, 
    color: Colors.action, 
    marginTop: 5 
  },
  detailText: { 
    padding: 10, 
    backgroundColor: Colors.bg, 
    borderRadius: 8, 
    marginBottom: 10, 
    color: Colors.text 
  },
  medDetailItem: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE', 
    paddingVertical: 10, 
    marginBottom: 5 
  },
  medNameDetail: { 
    fontWeight: 'bold', 
    color: Colors.primaryDark, 
    fontSize: 15 
  },
  medDetailsDetail: { 
    fontSize: 12, 
    color: Colors.subText, 
    marginTop: 2 
  },
  medInstructionsDetail: { 
    fontSize: 13, 
    color: Colors.text, 
    marginTop: 5 
  },
  
  // --- DRAWER ---
  drawerOverlay: { 
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    zIndex: 100, 
    flexDirection: 'row' 
  },
  drawer: { 
    width: width * 0.75, 
    backgroundColor: '#FFF', 
    height: '100%' 
  },
  drawerHeader: { 
    justifyContent: 'flex-end', 
    padding: 20, 
    backgroundColor: Colors.bg 
  },
  drawerHeaderContent: {},
  drawerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.text, 
    marginTop: 10 
  },
  drawerSub: { 
    color: Colors.subText 
  },
  drawerItem: { 
    flexDirection: 'row', 
    padding: 15, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#FAFAFA' 
  },
  drawerLabel: { 
    marginLeft: 20, 
    fontSize: 16, 
    fontWeight: '500' 
  },
  avatarLarge: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: '#FFF', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#EEE', 
    marginVertical: 10 
  },
  drawerContactBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 15, 
    width: '100%' 
  },
  drawerContactBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.primary + '20', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 20, 
  },
  drawerContactText: { 
    marginLeft: 8, 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  
  // --- LOGIN ---
  loginContainer: { 
    flex: 1, 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loginCard: { 
    width: '85%', 
    backgroundColor: '#FFF', 
    padding: 40, 
    borderRadius: 30, 
    alignItems: 'center', 
    elevation: 15 
  },
  logoBubble: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    elevation: 5 
  },
  loginTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: Colors.primaryDark 
  },
  loginSub: { 
    color: Colors.subText, 
    marginBottom: 30 
  },
  loginBtn: { 
    width: '100%', 
    backgroundColor: Colors.action, 
    padding: 15, 
    borderRadius: 25, 
    alignItems: 'center', 
    elevation: 5, 
    marginTop: 20 
  },
  loginInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE', 
    marginBottom: 20, 
    paddingBottom: 5 
  },
  
  // --- INVENTORY ---
  addItemBox: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 15, 
    elevation: 3 
  },
  subHeader: { 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: Colors.primary 
  },
  btnSmall: { 
    backgroundColor: Colors.primary, 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10 
  },
  invCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    elevation: 2, 
    alignItems: 'center' 
  },
  invIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#E0F2F1', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  invName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.text 
  },
  invStrength: { 
    fontSize: 14, 
    fontWeight: 'normal', 
    color: Colors.subText 
  },
  invUnit: { 
    fontSize: 12, 
    color: Colors.primary, 
    marginTop: 2, 
    fontStyle: 'italic' 
  },
  stockStatus: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginTop: 4 
  },
  counterContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  counterBtn: { 
    padding: 8 
  },
  
  // --- ALERTS ---
  alertWidget: { 
    backgroundColor: '#FFEBEE', 
    padding: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#FFCDD2' 
  },
  alertHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  alertTitle: { 
    color: Colors.danger, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  alertItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  alertName: { 
    fontWeight: '600', 
    color: Colors.text 
  },
  alertStatus: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  
  // --- PROCEDURES / REVENUE ---
  revenueCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: Colors.dash6, 
    padding: 20, 
    borderRadius: 20, 
    elevation: 5, 
    marginBottom: 10 
  },
  revenueLabel: { 
    color: '#FFF', 
    fontSize: 14, 
    opacity: 0.8 
  },
  revenueValue: { 
    color: '#FFF', 
    fontSize: 26, 
    fontWeight: 'bold' 
  },
  procedureCost: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  notesText: { 
    fontSize: 12, 
    color: Colors.subText, 
    fontStyle: 'italic', 
    flexShrink: 1 
  },
  
  // --- EMERGENCY ---
  emergencyCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.danger + '20', 
    padding: 15, 
    borderRadius: 15, 
    marginTop: 20 
  },
  emergencyTitle: { 
    fontWeight: 'bold', 
    color: Colors.danger 
  },
  emergencyNumber: { 
    fontSize: 18, 
    color: Colors.text, 
    fontWeight: 'bold' 
  },
  callNowBtn: { 
    backgroundColor: Colors.danger, 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 10 
  },
  callNowText: { 
    color: '#FFF', 
    fontWeight: 'bold' 
  },
  
  // --- FILTERS ---
  filterContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginVertical: 15, 
    backgroundColor: Colors.primary + '20', 
    borderRadius: 10, 
    padding: 4 
  },
  filterButton: { 
    flex: 1, 
    paddingVertical: 8, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  filterButtonActive: { 
    backgroundColor: Colors.primary 
  },
  filterButtonText: { 
    fontWeight: 'bold', 
    color: Colors.primary 
  },
  filterButtonTextActive: { 
    color: '#FFF' 
  },
});  