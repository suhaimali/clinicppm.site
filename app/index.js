import { Entypo, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList, Image,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

// --- CONFIGURATION ---
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const DOCTOR_PHONE = '9895353078';
const DOCTOR_WHATSAPP_NO = '919895353078';
const DOCTOR_NAME = 'Dr. Mansoor';
const CLINIC_ADDRESS = 'Dr.MANSOOR ALI.V.P, MD (PHYSICIAN)\nGeneral Practitioner | Reg No: 35083 | +91 9895353078 | Pathappiriyam\nBOOKING NO: +918606344694';
const EMERGENCY_CONTACT = '112';

// Enable LayoutAnimation
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
  info: '#29B6F6', lightGray: '#ECEFF1', blueHeader: '#448AFF'
};

// --- SCREENS DEFINITION ---
const Screens = {
  LOGIN: 'Login', DASHBOARD: 'Dashboard', PATIENT_LIST: 'PatientList',
  ADD_PATIENT: 'AddPatient', PATIENT_DETAILS: 'PatientDetails', INVENTORY: 'Inventory',
  LAB_LIST: 'LabList', ADD_LAB: 'AddLab', RX_HISTORY: 'RxHistory', ADD_RX: 'AddRx',
  TEMPLATE_MANAGER: 'TemplateManager', ADD_TEMPLATE: 'AddTemplate',
  PROCEDURES_HISTORY: 'ProceduresHistory', ADD_PROCEDURE: 'AddProcedure',
  ALL_RX_HISTORY: 'AllRxHistory',
};

// --- DUMMY DATA ---
const INITIAL_PATIENTS = [
  { id: '1', name: 'Alice Johnson', age: '29', gender: 'Female', phone: '9876543210', blood: 'O+', image: 'https://randomuser.me/api/portraits/women/44.jpg', vitals: { bp: '118/75', hr: '70', temp: '98.4', spo2: '99', weight: '65' } },
  { id: '2', name: 'Robert Smith', age: '54', gender: 'Male', phone: '9123456789', blood: 'A-', image: 'https://randomuser.me/api/portraits/men/32.jpg', vitals: { bp: '140/90', hr: '80', temp: '99.1', spo2: '97', weight: '85' } },
  { id: '3', name: 'Charlie Brown', age: '35', gender: 'Male', phone: '9998887770', blood: 'B+', image: 'https://randomuser.me/api/portraits/men/1.jpg', vitals: { bp: '120/80', hr: '75', temp: '98.6', spo2: '98', weight: '70' } },
];
const INITIAL_LABS = [
  { id: 'L1', patientId: '1', patientName: 'Alice Johnson', testName: 'Complete Blood Count', date: '2023-11-15', image: null, labNote: 'Hb: 14.5 g/dL (Normal)', result: 'Normal' },
];
const INITIAL_INVENTORY = [
  { id: '101', name: 'Paracetamol', strength: '500mg', dosage: 'Tablet', stock: 120, status: 'Good' },
  { id: '102', name: 'Amoxicillin', strength: '250mg/5ml', dosage: 'Syrup', stock: 4, status: 'Critical' },
  { id: '103', name: 'N95 Masks', strength: 'N/A', dosage: 'Piece', stock: 45, status: 'Good' },
  { id: '104', name: 'Cetirizine', strength: '10mg', dosage: 'Tablet', stock: 50, status: 'Good' },
];
const INITIAL_APPOINTMENTS = [
  { id: 'a1', time: 'Mon Dec 15 2025 | 09:00 AM', patientName: 'Alice Johnson', type: 'Routine Checkup', reason: 'Headache', status: 'Pending' },
  { id: 'a2', time: 'Mon Dec 15 2025 | 10:30 AM', patientName: 'Charlie Brown', type: 'Follow Up', reason: 'Review blood work', status: 'Pending' },
];
const INITIAL_PRESCRIPTIONS = [
  { id: 'rx1', patientId: '1', patientName: 'Alice Johnson', date: '2023-11-18', diagnosis: 'Mild Fever & Headache', notes: 'Rest and Hydrate.', isTapering: false, vitals: { bp: '118/75', hr: '70', temp: '98.4', spo2: '99', weight: '65' }, medicines: [{ id: 'm1', name: 'Paracetamol', strength: '500mg', dosage: 'Tablet', frequency: 'TDS', duration: '3 Days', instructions: 'After food' }], proceduresPerformed: [{ id: 'p01', name: 'Dressing', cost: '150' }], templateName: 'Fever' },
  { id: 'rx2', patientId: '1', patientName: 'Alice Johnson', date: '2023-10-01', diagnosis: 'Common Cold', notes: 'OTC remedies.', isTapering: false, vitals: { bp: '120/80', hr: '72', temp: '99.0', spo2: '98', weight: '65' }, medicines: [{ id: 'm3', name: 'Cetirizine', strength: '10mg', dosage: 'Tablet', frequency: 'OD', duration: '5 Days', instructions: 'Before bed' }], proceduresPerformed: [], templateName: 'Cold' },
  { id: 'rx3', patientId: '2', patientName: 'Robert Smith', date: '2023-11-05', diagnosis: 'Hypertension Check', notes: 'Maintain current medication.', isTapering: false, vitals: { bp: '138/88', hr: '78', temp: '98.6', spo2: '98', weight: '85' }, medicines: [{ id: 'm4', name: 'Lisinopril', strength: '10mg', dosage: 'Tablet', frequency: 'OD', duration: '1 Month', instructions: 'Before breakfast' }], proceduresPerformed: [], templateName: 'Custom' },
];
const INITIAL_TEMPLATES = [
  { id: 'template-none', name: 'None', diagnosis: '', medicines: [] },
  { id: 'template-cold', name: 'Cold', diagnosis: 'Common Cold / Allergic Rhinitis', medicines: [{ id: 'tm1', name: 'Cetirizine', strength: '10mg', dosage: 'Tablet', frequency: 'OD', duration: '5 Days', instructions: 'At night' }, { id: 'tm2', name: 'Paracetamol', strength: '500mg', dosage: 'Tablet', frequency: 'PRN', duration: 'As needed', instructions: 'For fever/body ache' }] },
  { id: 'template-fever', name: 'Fever', diagnosis: 'Viral Fever', medicines: [{ id: 'tm3', name: 'Paracetamol', strength: '650mg', dosage: 'Tablet', frequency: 'TDS', duration: '3 Days', instructions: 'After food' }] }
];
const INITIAL_PROCEDURES = [
  { id: 'p1', patientId: '1', patientName: 'Alice Johnson', procedureName: 'Wound Dressing', date: '2023-11-20', cost: '500', notes: 'Minor scrape on the left knee.' },
  { id: 'p2', patientId: '2', patientName: 'Robert Smith', procedureName: 'Suture Removal', date: '2023-11-18', cost: '300', notes: 'Post-op follow-up.' },
  { id: 'p3', patientId: '1', patientName: 'Alice Johnson', procedureName: 'IV Fluid Administration', date: '2023-10-05', cost: '800', notes: 'Dehydration.' },
];
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

  const navigate = (screen, data = null) => { 
    setIsLoading(true); 
    setTimeout(() => { 
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
      setSelectedData(data); 
      setCurrentScreen(screen); 
      setDrawerOpen(false); 
      setIsLoading(false); 
    }, 400); 
  };

  const handleLogin = (username, password) => { 
    setIsLoading(true); 
    setTimeout(() => { 
      if (username === '1' && password === '1') { 
        setIsLoading(false); 
        navigate(Screens.DASHBOARD);
        Toast.show({ type: 'success', text1: 'Welcome Back!', text2: `Logged in as ${DOCTOR_NAME}` });
      } else { 
        setIsLoading(false); 
        Toast.show({ type: 'error', text1: 'Login Failed', text2: 'Invalid Username or Password. Try: 1 / 1' });
      } 
    }, 1500); 
  };
  
  const handleDeleteAppointment = (id) => { 
    Alert.alert("Confirm Delete", "Remove this appointment?", [
      { text: "Cancel" }, 
      { text: "Delete", style: 'destructive', onPress: () => { 
          setIsLoading(true); 
          setTimeout(() => { 
            setAppointments(appointments.filter(a => a.id !== id)); 
            setIsLoading(false); 
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Appointment removed successfully.' });
          }, 500); 
        } 
      }
    ]); 
  };
  
  const handleUpdateAppointment = (id, newTime, newNotes) => {
    setIsLoading(true);
    setTimeout(() => {
      setAppointments(appointments.map(a => a.id === id ? { ...a, time: newTime, reason: newNotes } : a));
      setIsLoading(false);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Appointment Updated Successfully' });
    }, 500);
  };

  const handleSavePatient = (p, appointmentDetails) => { 
    setIsLoading(true); 
    setTimeout(() => { 
      let savedPatient = p; 
      if (p.id) { 
        setPatients(patients.map(x => x.id === p.id ? p : x)); 
      } else { 
        const newPatientId = Date.now().toString(); 
        savedPatient = { ...p, id: newPatientId, vitals: { weight: p.vitals.weight || '', ...p.vitals } }; 
        setPatients(prev => [...prev, savedPatient]); 
      } 
      if (appointmentDetails && appointmentDetails.bookit) { 
        const newAppt = { 
          id: 'appt_' + Date.now(), 
          time: appointmentDetails.time, 
          patientName: savedPatient.name, 
          type: appointmentDetails.type || 'Consultation', 
          reason: appointmentDetails.reason, 
          status: 'Pending' 
        }; 
        setAppointments(prev => [...prev, newAppt]); 
        Toast.show({ type: 'success', text1: 'Patient Saved & Booked', text2: `Appointment for ${savedPatient.name} at ${newAppt.time}` });
      } else { 
        Toast.show({ type: 'success', text1: 'Success', text2: 'Patient Record Saved Successfully' });
      } 
      setIsLoading(false); 
      navigate(Screens.PATIENT_LIST); 
    }, 1000); 
  };

  const handleDeletePatient = (id) => { 
    Alert.alert("Confirm Delete", "Are you sure? This will delete all associated records.", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { 
      setIsLoading(true); 
      setTimeout(() => { 
        setPatients(patients.filter(x => x.id !== id)); 
        setPrescriptions(prescriptions.filter(rx => rx.patientId !== id)); 
        setLabs(labs.filter(l => l.patientId !== id)); 
        setProcedures(procedures.filter(p => p.patientId !== id)); 
        const patientToDelete = patients.find(p => p.id === id); 
        if (patientToDelete) { setAppointments(appointments.filter(a => a.patientName !== patientToDelete.name)); } 
        setIsLoading(false); 
        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Patient and records removed.' });
        navigate(Screens.PATIENT_LIST); 
      }, 800); 
    } }]); 
  };

  const handleSavePrescription = (rx) => {
    setIsLoading(true);
    setTimeout(() => {
      const p = patients.find(p => p.id === rx.patientId);
      const currentDate = new Date().toLocaleDateString('en-CA');
      const newRx = { ...rx, id: rx.id || 'rx_' + Date.now() + Math.random(), patientName: p?.name || 'Unknown', date: currentDate };
      if (rx.id) { setPrescriptions(prescriptions.map(x => x.id === rx.id ? newRx : x)); }
      else { setPrescriptions(prev => [newRx, ...prev]); }
      if (rx.proceduresPerformed && rx.proceduresPerformed.length > 0) {
        const newProceduresFromRx = rx.proceduresPerformed.map(proc => ({
          id: proc.id || 'proc_' + Date.now() + Math.random(),
          patientId: p.id,
          patientName: p.name,
          procedureName: proc.name,
          date: currentDate,
          cost: proc.cost,
          notes: `Performed during consultation on ${currentDate}`
        }));
        const proceduresToAdd = newProceduresFromRx.filter(newProc => !procedures.some(existingProc => existingProc.id === newProc.id));
        setProcedures(prev => [...proceduresToAdd, ...prev]);
      }
      const appointmentToRemove = appointments.find(a => a.patientName === p?.name && a.status === 'Pending');
      if (appointmentToRemove) { 
        setAppointments(appointments.filter(a => a.id !== appointmentToRemove.id)); 
        Toast.show({ type: 'success', text1: 'Prescription Saved', text2: `Appointment for ${p.name} completed.` });
      } else { 
        Toast.show({ type: 'success', text1: 'Success', text2: 'Prescription Saved Successfully!' });
      }
      setIsLoading(false);
      navigate(Screens.RX_HISTORY, p);
    }, 1000);
  };

  const handleDeleteRx = (id) => { Alert.alert("Confirm Delete", "Delete this prescription?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { setIsLoading(true); setTimeout(() => { setPrescriptions(prescriptions.filter(x => x.id !== id)); setIsLoading(false); Toast.show({ type: 'info', text1: 'Deleted', text2: 'Prescription removed.' }); }, 800); } }]); };
  const handleQuickBook = (patient, time, reason, type) => { setIsLoading(true); setTimeout(() => { const newAppt = { id: 'appt_' + Date.now(), time: time, patientName: patient.name, type: type, reason: reason, status: 'Pending' }; setAppointments(prev => [...prev, newAppt]); setIsLoading(false); Toast.show({ type: 'success', text1: 'Booked!', text2: `Appointment for ${patient.name} at ${time}` }); navigate(Screens.DASHBOARD); }, 800); };
  const handleSaveLab = (l) => { setIsLoading(true); setTimeout(() => { const pName = patients.find(p => p.id === l.patientId)?.name || 'Unknown'; const newLab = { ...l, patientName: pName }; if (l.id) setLabs(labs.map(x => x.id === l.id ? newLab : x)); else setLabs([...labs, { ...newLab, id: Date.now().toString() }]); setIsLoading(false); Toast.show({ type: 'success', text1: 'Success', text2: 'Lab Report Saved' }); navigate(Screens.LAB_LIST); }, 1000); };
  const handleDeleteLab = (id) => { Alert.alert("Delete Report", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { setLabs(labs.filter(x => x.id !== id)); Toast.show({ type: 'success', text1: 'Deleted', text2: 'Report removed' }); } }]); };
  const updateInventoryStock = (id, amount) => { setInventory(inventory.map(item => { if (item.id === id) { const newStock = Math.max(0, item.stock + amount); let status = newStock === 0 ? 'Out' : newStock < 10 ? 'Critical' : newStock < 20 ? 'Low' : 'Good'; return { ...item, stock: newStock, status }; } return item; })); };
  const deleteInventoryItem = (id) => { Alert.alert("Remove Item", "Delete this medicine?", [{ text: "Cancel" }, { text: "Delete", style: 'destructive', onPress: () => { setInventory(inventory.filter(i => i.id !== id)); Toast.show({ type: 'info', text1: 'Deleted', text2: 'Item removed from inventory.' }); } }]); };
  const addNewMedicine = (name, dosage, strength) => { setIsLoading(true); setTimeout(() => { const newItem = { id: Date.now().toString(), name, dosage, strength, stock: 0, status: 'Out' }; setInventory([...inventory, newItem]); setIsLoading(false); Toast.show({ type: 'success', text1: 'Added', text2: `${name} added to inventory` }); }, 800); };
  const handleUpdateInventoryItem = (itemId, updatedData) => { setIsLoading(true); setTimeout(() => { setInventory(inventory.map(item => item.id === itemId ? { ...item, ...updatedData } : item)); setIsLoading(false); Toast.show({ type: 'success', text1: 'Updated', text2: 'Medicine details updated' }); }, 500); };
  const handleSaveTemplate = (template) => { setIsLoading(true); setTimeout(() => { if (template.id) { setRxTemplates(rxTemplates.map(t => t.id === template.id ? template : t)); Toast.show({ type: 'success', text1: 'Success', text2: 'Template updated!' }); } else { const newTemplate = { ...template, id: 'template_' + Date.now() }; setRxTemplates([...rxTemplates, newTemplate]); Toast.show({ type: 'success', text1: 'Success', text2: 'New template saved!' }); } setIsLoading(false); navigate(Screens.TEMPLATE_MANAGER); }, 800); };
  const handleDeleteTemplate = (id) => { if (id === 'template-none') { Toast.show({ type: 'error', text1: 'Cannot Delete', text2: "The 'None' template cannot be removed." }); return; } Alert.alert("Delete Template", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => { setRxTemplates(rxTemplates.filter(t => t.id !== id)); Toast.show({ type: 'success', text1: 'Deleted', text2: 'Template removed.' }); } }]); };
  const handleSaveProcedure = (proc) => { setIsLoading(true); setTimeout(() => { const patientName = patients.find(p => p.id === proc.patientId)?.name || 'Unknown'; const newProc = { ...proc, patientName }; if (proc.id) { setProcedures(procedures.map(p => p.id === proc.id ? newProc : p)); Toast.show({ type: 'success', text1: 'Success', text2: 'Procedure record updated!' }); } else { setProcedures(prev => [{ ...newProc, id: 'proc_' + Date.now() }, ...prev]); Toast.show({ type: 'success', text1: 'Success', text2: 'New procedure recorded!' }); } setIsLoading(false); navigate(Screens.PROCEDURES_HISTORY); }, 800); };
  const handleDeleteProcedure = (id) => { Alert.alert("Delete Procedure", "Are you sure you want to remove this record?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => { setProcedures(procedures.filter(p => p.id !== id)); Toast.show({ type: 'info', text1: 'Deleted', text2: 'Procedure record removed.' }); } }]); };

  const renderContent = () => {
    switch (currentScreen) {
      case Screens.LOGIN: return <LoginScreen onLogin={handleLogin} />;
      case Screens.DASHBOARD: return <Dashboard patients={patients} setPatients={setPatients} appointments={appointments} inventory={inventory} templates={rxTemplates} procedures={procedures} prescriptions={prescriptions} navigate={navigate} openDrawer={() => setDrawerOpen(true)} onDeleteAppt={handleDeleteAppointment} onUpdateAppt={handleUpdateAppointment} />;
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
              <View style={styles.divider} />
              <DrawerItem icon="sign-out-alt" label="Logout" color={Colors.danger} onPress={() => setCurrentScreen(Screens.LOGIN)} />
            </ScrollView>
          </View>
        </View>
      )}
      <Toast />
    </SafeAreaView>
  );
}

// --- DASHBOARD COMPONENT ---
const Dashboard = ({ patients, appointments, inventory, templates, procedures, prescriptions, navigate, openDrawer, onDeleteAppt, onUpdateAppt, setPatients }) => {
  const [apptSearch, setApptSearch] = useState('');
  const [editAppt, setEditAppt] = useState(null); 
  const [viewAppt, setViewAppt] = useState(null);
  const lowStock = inventory.filter(i => i.status !== 'Good');
  const filteredAppointments = appointments.filter(a => a.patientName.toLowerCase().includes(apptSearch.toLowerCase()));

  const EditApptModal = () => {
    const patientData = patients.find(p => p.name === editAppt?.patientName);
    const [timeString, setTimeString] = useState(editAppt?.time || '');
    const [notes, setNotes] = useState(editAppt?.reason || '');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [mode, setMode] = useState('date');
    const [vitals, setVitals] = useState({ spo2: patientData?.vitals?.spo2 || '', bp: patientData?.vitals?.bp || '', hr: patientData?.vitals?.hr || '', temp: patientData?.vitals?.temp || '', weight: patientData?.vitals?.weight || '' });

    useEffect(() => {
      if (editAppt) {
        setTimeString(editAppt.time);
        setNotes(editAppt.reason);
        if(patientData) { setVitals(patientData.vitals); }
      }
    }, [editAppt]);

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
        if(mode === 'date') {
            setMode('time');
            setTimeout(() => setShowDatePicker(true), 100); 
        } else {
            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
            const timeOpt = { hour: '2-digit', minute: '2-digit' };
            const datePart = currentDate.toLocaleDateString('en-US', options).replace(/,/g, '');
            const timePart = currentDate.toLocaleTimeString('en-US', timeOpt);
            setTimeString(`${datePart} | ${timePart}`);
            setMode('date'); 
        }
    };

    if(!editAppt) return null;

    const handleSaveChanges = () => {
      onUpdateAppt(editAppt.id, timeString, notes);
      if (patientData) {
        const updatedPatient = { ...patientData, vitals: vitals };
         setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      }
      setEditAppt(null);
    };

    return (
      <Modal visible={!!editAppt} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBg}><FontAwesome5 name="edit" size={20} color={Colors.action} /></View>
              <View style={{flex:1, marginLeft:10}}><Text style={styles.modalTitleLeft}>Edit Booking</Text><Text style={styles.modalSubTitle}>Update details for {editAppt.patientName}</Text></View>
              <TouchableOpacity onPress={() => setEditAppt(null)}><Ionicons name="close" size={24} color={Colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={{flex:1}}><Text style={styles.infoLabel}>PATIENT NAME</Text><Text style={styles.infoValue}>{editAppt.patientName}</Text></View>
                  <View style={{flex:1}}><Text style={styles.infoLabel}>DOCTOR</Text><Text style={styles.infoValue}>Dr. MANSOOR ALI.V.P</Text></View>
                </View>
                <View style={[styles.infoRow, {marginTop:15}]}>
                  <View style={{flex:1}}><Text style={styles.infoLabel}>APPOINTMENT TIME</Text><TouchableOpacity onPress={() => setShowDatePicker(true)}><Text style={[styles.infoValue, {color: Colors.action, textDecorationLine:'underline'}]}>{timeString || "Select Time"}</Text></TouchableOpacity></View>
                  <View style={{flex:1}}><Text style={styles.infoLabel}>BOOKING ID</Text><Text style={styles.infoValue}>{editAppt.id.toUpperCase().slice(0,8)}</Text></View>
                </View>
              </View>
              <View style={styles.sectionHeaderLine}><View style={styles.blueBar} /><Text style={styles.sectionHeaderTitle}>Patient Vitals</Text></View>
              <View style={styles.vitalsRow}>
                <View style={styles.vitalInputContainer}><Text style={styles.label}>SpO2 (%)</Text><TextInput style={styles.inputBox} value={vitals.spo2} onChangeText={t=>setVitals({...vitals, spo2:t})} keyboardType="numeric" placeholder="98" /></View>
                <View style={styles.vitalInputContainer}><Text style={styles.label}>BP (mmHg)</Text><TextInput style={styles.inputBox} value={vitals.bp} onChangeText={t=>setVitals({...vitals, bp:t})} placeholder="120/80" /></View>
                <View style={styles.vitalInputContainer}><Text style={styles.label}>Pulse (bpm)</Text><TextInput style={styles.inputBox} value={vitals.hr} onChangeText={t=>setVitals({...vitals, hr:t})} keyboardType="numeric" placeholder="72" /></View>
              </View>
              <View style={styles.vitalsRow}>
                <View style={styles.vitalInputContainer}><Text style={styles.label}>Temp</Text><TextInput style={styles.inputBox} value={vitals.temp} onChangeText={t=>setVitals({...vitals, temp:t})} placeholder="98.6F" /></View>
                <View style={styles.vitalInputContainer}><Text style={styles.label}>Weight (kg)</Text><TextInput style={styles.inputBox} value={vitals.weight} onChangeText={t=>setVitals({...vitals, weight:t})} keyboardType="numeric" placeholder="70" /></View>
              </View>
              <View style={styles.warningBox}><Text style={styles.warningText}>Note: Updating vitals here will update the patient's current record.</Text></View>
              <View style={[styles.sectionHeaderLine, {marginTop:15}]}><View style={[styles.blueBar, {backgroundColor: Colors.dash6}]} /><Text style={styles.sectionHeaderTitle}>Booking Notes</Text></View>
              <TextInput style={[styles.inputBox, {height: 100, textAlignVertical: 'top'}]} multiline={true} value={notes} onChangeText={setNotes} placeholder="Add booking notes..." />
              <View style={{height: 20}} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.btnOutline} onPress={() => setEditAppt(null)}><Text style={styles.btnOutlineText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnBlue} onPress={handleSaveChanges}><FontAwesome5 name="save" size={14} color="#FFF" style={{marginRight:8}} /><Text style={styles.btnBlueText}>Save Changes</Text></TouchableOpacity>
            </View>
            {showDatePicker && <DateTimePicker value={date} mode={mode} is24Hour={false} display="default" onChange={handleDateChange} />}
          </View>
        </View>
      </Modal>
    )
  };

  const ViewApptModal = () => {
    if(!viewAppt) return null;
    return (
       <Modal visible={!!viewAppt} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{alignItems:'center', marginBottom:15}}><View style={[styles.iconCircle, {backgroundColor: Colors.info + '20'}]}><FontAwesome5 name="calendar-check" size={30} color={Colors.info} /></View><Text style={styles.modalTitle}>Appointment Details</Text></View>
            <View style={{backgroundColor: Colors.bg, padding:15, borderRadius:10}}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Patient:</Text><Text style={styles.detailValue}>{viewAppt.patientName}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Time:</Text><Text style={styles.detailValue}>{viewAppt.time}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Type:</Text><Text style={styles.detailValue}>{viewAppt.type}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Notes:</Text><Text style={styles.detailValue}>{viewAppt.reason}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text><Text style={[styles.detailValue, {color: Colors.warning}]}>{viewAppt.status}</Text></View>
            </View>
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 20 }]} onPress={() => setViewAppt(null)}><Text style={styles.btnText}>CLOSE</Text></TouchableOpacity>
          </View>
        </View>
       </Modal>
    );
  }

  const EmergencyContactWidget = () => (
    <View style={styles.emergencyCard}>
      <FontAwesome5 name="first-aid" size={24} color={Colors.danger} />
      <View style={{ flex: 1, marginHorizontal: 15 }}><Text style={styles.emergencyTitle}>Emergency Contact</Text><Text style={styles.emergencyNumber}>{EMERGENCY_CONTACT}</Text></View>
      <TouchableOpacity style={styles.callNowBtn} onPress={() => Linking.openURL(`tel:${EMERGENCY_CONTACT}`)}><Text style={styles.callNowText}>CALL NOW</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <EditApptModal />
      <ViewApptModal />
      <View style={styles.header}><TouchableOpacity onPress={openDrawer}><MaterialIcons name="sort" size={30} color="#FFF" /></TouchableOpacity><Text style={styles.headerTitle}>Dashboard</Text><View style={{ width: 30 }} /></View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View style={styles.welcomeBanner}><View><Text style={styles.welcomeText}>Welcome Back,</Text><Text style={styles.docName}>{DOCTOR_NAME}</Text></View><FontAwesome5 name="user-md" size={35} color="#FFF" opacity={0.8} /></View>
        <View style={styles.gridContainer}>
          <DashboardCard title="Patients" count={patients.length} icon="users" color={Colors.dash1} onPress={() => navigate(Screens.PATIENT_LIST)} />
          <DashboardCard title="Reports" count="View" icon="flask" color={Colors.dash2} onPress={() => navigate(Screens.LAB_LIST)} />
          <DashboardCard title="Medicine" count={inventory.length} icon="capsules" color={Colors.dash3} onPress={() => navigate(Screens.INVENTORY)} />
          <DashboardCard title="Schedule" count={appointments.length} icon="calendar-alt" color={Colors.dash4} onPress={() => { }} />
          <DashboardCard title="Templates" count={templates.length - 1} icon="file-signature" color={Colors.dash5} onPress={() => navigate(Screens.TEMPLATE_MANAGER)} />
          <DashboardCard title="Procedures" count={procedures.length} icon="stethoscope" color={Colors.dash6} onPress={() => navigate(Screens.PROCEDURES_HISTORY)} />
        </View>
        <Text style={styles.sectionTitle}>Today's Appointments</Text>
        <View style={styles.searchContainer}><Ionicons name="search" size={20} color={Colors.subText} /><TextInput style={styles.searchInput} placeholder="Search Appointments..." value={apptSearch} onChangeText={setApptSearch} /></View>
        {filteredAppointments.length === 0 ? (
          <Text style={{ color: Colors.subText, fontStyle: 'italic', textAlign:'center', marginTop:10 }}>{appointments.length === 0 ? "No appointments today." : "No matching appointments."}</Text>
        ) : (
          filteredAppointments.map((a, index) => (
            <View key={a.id} style={[styles.apptCardNew, { borderLeftColor: index % 2 === 0 ? Colors.dash1 : Colors.dash4 }]}>
              <View style={styles.apptTimeBox}>
                 <Text style={styles.apptTimeTextBig}>{a.time.includes('|') ? a.time.split('|')[1].trim().split(' ')[0] : a.time.split(' ')[0]}</Text>
                 <Text style={styles.apptTimeTextSmall}>{a.time.includes('|') ? a.time.split('|')[1].trim().split(' ')[1] : a.time.split(' ')[1]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 15, justifyContent:'center' }}><Text style={styles.apptName}>{a.patientName}</Text><Text style={styles.apptType}>{a.type}</Text><Text style={styles.apptReason} numberOfLines={1}>{a.reason}</Text></View>
              <View style={styles.apptActionRow}>
                <TouchableOpacity onPress={() => setViewAppt(a)} style={[styles.iconBtnNew, { backgroundColor: Colors.info }]}><FontAwesome5 name="eye" size={14} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setEditAppt(a)} style={[styles.iconBtnNew, { backgroundColor: Colors.warning, marginHorizontal:8 }]}><FontAwesome5 name="pen" size={14} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteAppt(a.id)} style={[styles.iconBtnNew, { backgroundColor: Colors.danger }]}><FontAwesome5 name="trash" size={14} color="#FFF" /></TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {lowStock.length > 0 ? (
          <View style={[styles.alertWidget, { marginTop: 20 }]}>
            <View style={styles.alertHeader}><MaterialIcons name="warning" size={24} color={Colors.danger} /><Text style={styles.alertTitle}>Stock Alert</Text></View>
            {lowStock.slice(0, 2).map(item => (<View key={item.id} style={styles.alertItem}><Text style={styles.alertName}>{item.name}</Text><Text style={[styles.alertStatus, { color: Colors.danger }]}>{item.stock} Left</Text></View>))}
            {lowStock.length > 2 ? <Text style={{ fontSize: 12, color: Colors.subText, textAlign: 'right' }}>...and {lowStock.length - 2} more</Text> : null}
          </View>
        ) : null}
        <EmergencyContactWidget />
      </ScrollView>
    </View>
  );
};

// --- PRESCRIPTION DETAIL MODAL ---
const PrescriptionDetailModal = ({ rx, onClose }) => {
  if (!rx) return null; 
  const getVitalValue = (key, unit = '') => { const val = rx.vitals?.[key]; if (val === null || val === undefined || val === '') return 'N/A'; const displayUnit = key === 'bp' ? '' : unit; return `${val}${displayUnit}`; };
  const RxDetailItem = ({ label, value, color }) => (<View style={[styles.rxDetailItem, {borderColor: color}]}><Text style={[styles.rxDetailLabel, {color: color}]}>{label}</Text><Text style={styles.rxDetailValue}>{value}</Text></View>);
  return (
    <Modal visible={!!rx} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContentLarge}>
          <View style={styles.colorfulHeader}><View><Text style={styles.headerPatientName}>{rx.patientName}</Text><Text style={styles.headerDate}>{rx.date}</Text></View><TouchableOpacity onPress={onClose} style={styles.closeBtnHeader}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity></View>
          <ScrollView style={{padding: 20}}>
            <View style={styles.diagnosisCard}><Text style={styles.diagnosisLabel}>DIAGNOSIS</Text><Text style={styles.diagnosisText}>{rx.diagnosis}</Text></View>
            <Text style={styles.sectionHeaderTitle}>Patient Vitals</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                <RxDetailItem label="BP" value={getVitalValue('bp')} color={Colors.action} />
                <RxDetailItem label="HR" value={getVitalValue('hr', ' bpm')} color={Colors.danger} />
                <RxDetailItem label="Temp" value={getVitalValue('temp', '°F')} color={Colors.warning} />
                <RxDetailItem label="SpO2" value={getVitalValue('spo2', '%')} color={Colors.success} />
                <RxDetailItem label="Weight" value={getVitalValue('weight', ' kg')} color={Colors.primary} />
            </ScrollView>
            <Text style={styles.sectionHeaderTitle}>Medicines Prescribed</Text>
            {rx.medicines.length === 0 ? <Text style={styles.emptyText}>No medicines.</Text> : rx.medicines.map((med, index) => (
                <View key={index} style={styles.medicineRow}><View style={styles.medIconBox}><FontAwesome5 name="pills" size={16} color={Colors.primary} /></View><View style={{flex:1, marginLeft: 15}}><Text style={styles.medNameDetail}>{med.name} <Text style={{fontWeight:'normal', fontSize:12, color:Colors.subText}}>{med.strength}</Text></Text><Text style={styles.medInstructionsDetail}>{med.dosage} | {med.frequency} | {med.duration}</Text>{med.instructions ? <Text style={styles.medNote}>Note: {med.instructions}</Text> : null}</View></View>
            ))}
            {rx.proceduresPerformed && rx.proceduresPerformed.length > 0 && (<View style={{marginTop: 15}}><Text style={styles.sectionHeaderTitle}>Procedures</Text>{rx.proceduresPerformed.map((proc, index) => (<View key={index} style={styles.procedureRow}><FontAwesome5 name="notes-medical" size={14} color={Colors.dash6} /><Text style={{marginLeft:10, fontWeight:'bold', color: Colors.text}}>{proc.name}</Text></View>))}</View>)}
            {rx.notes ? (<View style={styles.noteBox}><Text style={styles.noteTitle}>Doctor's Notes</Text><Text style={styles.noteContent}>{rx.notes}</Text></View>) : null}
            <View style={{height: 30}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState(''); const [pass, setPass] = useState('');
  return (<View style={styles.loginContainer}><View style={styles.loginCard}><View style={styles.logoBubble}><FontAwesome5 name="hospital-user" size={40} color="#FFF" /></View><Text style={styles.loginTitle}>Dr Login.</Text><Text style={styles.loginSub}>Clinic Management</Text><View style={styles.loginInputContainer}><FontAwesome5 name="user" size={16} color={Colors.subText} style={{ marginRight: 10 }} /><TextInput placeholder="Username" style={{ flex: 1 }} value={user} onChangeText={setUser} autoCapitalize="none" /></View><View style={styles.loginInputContainer}><FontAwesome5 name="lock" size={16} color={Colors.subText} style={{ marginRight: 10 }} /><TextInput placeholder="Password" style={{ flex: 1 }} value={pass} onChangeText={setPass} secureTextEntry={true} /></View><TouchableOpacity style={styles.loginBtn} onPress={() => onLogin(user, pass)}><Text style={styles.btnText}>LOGIN</Text></TouchableOpacity><Text style={{ marginTop: 15, color: Colors.subText, fontSize: 12 }}>Default: 1 / 1</Text></View></View>);
};

const PatientList = ({ patients, navigate, onDelete, onEdit, onBook }) => {
  const [search, setSearch] = useState(''); const [bookModal, setBookModal] = useState(null); const [apptTime, setApptTime] = useState('09:00 AM'); const [apptReason, setApptReason] = useState(''); const [isFollowUp, setIsFollowUp] = useState(false); const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (<View style={styles.screenContainer}><Header title="Patients" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PATIENT)} /><View style={styles.searchContainer}><Ionicons name="search" size={20} color={Colors.subText} /><TextInput style={styles.searchInput} placeholder="Search Patient..." value={search} onChangeText={setSearch} /></View><FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.card}><TouchableOpacity style={styles.row} onPress={() => navigate(Screens.PATIENT_DETAILS, item)}><Image source={{ uri: item.image || 'https://via.placeholder.com/50' }} style={styles.listAvatar} /><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSub}>{item.gender}, {item.age} yrs</Text></View></TouchableOpacity><View style={styles.cardActions}><TouchableOpacity onPress={() => setBookModal(item)} style={styles.actionLabelBtn}><FontAwesome5 name="calendar-plus" size={14} color={Colors.primary} /><Text style={styles.actionLabelText}>Book</Text></TouchableOpacity><TouchableOpacity onPress={() => onEdit(item)} style={styles.iconBtn}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10 }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>)} /><Modal visible={!!bookModal} transparent={true} animationType="slide"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Book Appointment</Text><Text style={{ textAlign: 'center', color: Colors.primary, marginBottom: 15, fontWeight: 'bold' }}>{bookModal?.name}</Text><Input label="Reason" value={apptReason} onChange={setApptReason} /><TouchableOpacity style={[styles.row, { marginBottom: 20 }]} onPress={() => setIsFollowUp(!isFollowUp)}><FontAwesome5 name={isFollowUp ? "check-square" : "square"} size={20} color={Colors.primary} /><Text style={{ marginLeft: 10, color: Colors.text }}>Follow Up?</Text></TouchableOpacity><View style={styles.row}><TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: Colors.subText, marginRight: 10 }]} onPress={() => setBookModal(null)}><Text style={styles.btnText}>CANCEL</Text></TouchableOpacity><TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={() => { onBook(bookModal, apptTime, apptReason, isFollowUp ? 'Follow Up' : 'Consultation'); setBookModal(null); }}><Text style={styles.btnText}>CONFIRM</Text></TouchableOpacity></View></View></View></Modal></View>);
};

const PatientDetails = ({ patient, labs, navigate }) => {
  if (!patient) return null;

  const handleShareID = async () => {
    try {
      await Share.share({
        message: `*MEDICAL ID CARD*\nName: ${patient.name}\nID: ${patient.id}\nDoctor: Dr. Mansoor Ali V. P.`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Share Error', text2: error.message });
    }
  };

  // Helper for the ID Card Rows
  const IdRow = ({ label, value }) => (
    <View style={styles.idRowContainer}>
      <Text style={styles.idLabel}>{label}:</Text>
      <Text style={styles.idValue}> : {value}</Text>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <Header title="Patient Profile" onBack={() => navigate(Screens.PATIENT_LIST)} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* --- NEW ID CARD DESIGN START --- */}
        <View style={styles.idCard}>
          {/* Header */}
          <View style={styles.idHeaderContainer}>
            <Text style={styles.idCardTitle}>ID CARD</Text>
            {/* Share Icon overlaid absolutely or just in header */}
            <TouchableOpacity onPress={handleShareID} style={{ position: 'absolute', right: 0 }}>
              <FontAwesome5 name="share-alt" size={18} color="#FFFFFF" opacity={0.8} />
            </TouchableOpacity>
          </View>

          {/* Content Row */}
          <View style={styles.idContentRow}>
            {/* Left: Avatar */}
            <View style={styles.idAvatarContainer}>
              <Image
                source={{ uri: patient.image || 'https://via.placeholder.com/100' }}
                style={styles.idAvatarImage} />
            </View>

            {/* Right: Info */}
            <View style={styles.idInfoColumn}>
              <IdRow label="PATIENT NAME" value={patient.name.toUpperCase()} />
              <IdRow label="ID NO" value={patient.id} />
              <IdRow label="AGE/GENDER" value={`${patient.age} Yrs / ${patient.gender}`} />
              <IdRow label="PHONE" value={patient.phone} />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.idDivider} />

          {/* Footer */}
          <View style={styles.idFooterContainer}>
            <Text style={styles.idConsultantLabel}>CONSULTANT DOCTOR:</Text>
            <Text style={styles.idDoctorName}>Dr. Mansoor Ali V. P.</Text>
            <Text style={styles.idLocationText}>PATHAPPIRIYAM</Text>

            <View style={styles.idBookingButton}>
              <Text style={styles.idBookingText}>
                APPOINTMENT BOOKING: +91 8606344694
              </Text>
            </View>
          </View>
        </View>
        {/* --- NEW ID CARD DESIGN END --- */}

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
          {labs.filter(l => l.patientId === patient.id).length > 0 ? (
            labs.filter(l => l.patientId === patient.id).map(l => (
              <Text key={l.id} style={{ marginBottom: 5, color: Colors.text }}>{l.date} - {l.testName}</Text>
            ))
          ) : (
            <Text style={{ color: Colors.subText, fontStyle: 'italic' }}>No lab reports on file.</Text>
          )}
          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 15, padding: 10 }]} onPress={() => navigate(Screens.ADD_LAB, { patientId: patient.id, patientName: patient.name })}>
            <Text style={[styles.btnText, { fontSize: 14 }]}>ADD NEW REPORT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

};

function PatientForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(initialData || { name: '', age: '', gender: 'Male', phone: '', blood: '', image: null, vitals: { bp: '', hr: '', temp: '', spo2: '', weight: '' } });
  const [bookAppt, setBookAppt] = useState(false);
  const [apptDateObj, setApptDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState('date');
  const [apptReason, setApptReason] = useState('');
  const [isFollowUp, setIsFollowUp] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setForm({ ...form, image: result.assets[0].uri });
  };

  const onDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      setApptDateObj(selectedDate);
      if (mode === 'date') {
        setMode('time');
        setTimeout(() => setShowDatePicker(true), 100);
      } else {
        setShowDatePicker(false);
        setMode('date');
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const getFormattedTimeString = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const timeOpt = { hour: '2-digit', minute: '2-digit' };
    return `${date.toLocaleDateString('en-US', options).replace(/,/g, '')} | ${date.toLocaleTimeString('en-US', timeOpt)}`;
  };

  return (
    <View style={styles.screenContainer}>
      <Header title={initialData ? "Edit Patient" : "Add New Patient"} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity style={styles.uploadCircle} onPress={pickImage}>
          {form.image ? <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%', borderRadius: 50 }} /> : <FontAwesome5 name="camera" size={24} color={Colors.primary} />}
        </TouchableOpacity>
        <Input label="Full Name" value={form.name} onChange={t => setForm({ ...form, name: t })} />
        <View style={styles.row}>
          <Input style={{ flex: 1, marginRight: 10 }} label="Age" kbd="numeric" value={form.age} onChange={t => setForm({ ...form, age: t })} />
          <Input style={{ flex: 1 }} label="Blood Group" value={form.blood} onChange={t => setForm({ ...form, blood: t })} />
        </View>
        <Input label="Phone" kbd="phone-pad" value={form.phone} onChange={t => setForm({ ...form, phone: t })} />
        <Text style={styles.sectionTitle}>Vital Signs</Text>
        <View style={styles.row}>
          <Input style={{ flex: 1, marginRight: 10 }} label="SpO2 (%)" kbd="numeric" value={form.vitals.spo2} onChange={t => setForm({ ...form, vitals: { ...form.vitals, spo2: t } })} />
          <Input style={{ flex: 1 }} label="BP (mmHg)" value={form.vitals.bp} onChange={t => setForm({ ...form, vitals: { ...form.vitals, bp: t } })} />
        </View>
        <View style={styles.row}>
          <Input style={{ flex: 1, marginRight: 10 }} label="Pulse (bpm)" kbd="numeric" value={form.vitals.hr} onChange={t => setForm({ ...form, vitals: { ...form.vitals, hr: t } })} />
          <Input style={{ flex: 1 }} label="Temperature (°F)" kbd="numeric" value={form.vitals.temp} onChange={t => setForm({ ...form, vitals: { ...form.vitals, temp: t } })} />
        </View>
        <Input label="Weight (kg)" kbd="numeric" value={form.vitals.weight} onChange={t => setForm({ ...form, vitals: { ...form.vitals, weight: t } })} />
        <View style={styles.apptSection}>
          <View style={styles.row}>
            <Text style={styles.sectionTitleSmall}>Book Appointment?</Text>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: bookAppt ? Colors.success : '#CCC' }]} onPress={() => setBookAppt(!bookAppt)}>
              <FontAwesome5 name={bookAppt ? "check" : "times"} size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          {bookAppt ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Appointment Time</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerBtn}>
                <Text style={styles.pickerText}>{getFormattedTimeString(apptDateObj)}</Text>
                <FontAwesome5 name="calendar-alt" size={16} color={Colors.primary} />
              </TouchableOpacity>
              {showDatePicker && (<DateTimePicker value={apptDateObj} mode={mode} is24Hour={false} display="default" onChange={onDateChange} />)}
              <Text style={[styles.label, { marginTop: 10 }]}>Booking Notes</Text>
              <Input label="" value={apptReason} onChange={setApptReason} placeholder="Booking Notes" style={{ marginTop: 0 }} />
              <TouchableOpacity style={[styles.row, { marginTop: 10 }]} onPress={() => setIsFollowUp(!isFollowUp)}>
                <MaterialCommunityIcons name={isFollowUp ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={Colors.primary} />
                <Text style={{ marginLeft: 10, color: Colors.text, fontWeight: '600' }}>Follow Up Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(form, bookAppt ? { bookit: true, time: getFormattedTimeString(apptDateObj), type: isFollowUp ? 'Follow Up' : 'Consultation', reason: apptReason } : { bookit: false })}>
          <Text style={styles.btnText}>SAVE RECORD</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const LabList = ({ labs, navigate, onDelete, onEdit }) => {
  const [viewImage, setViewImage] = useState(null);
  return (
    <View style={styles.screenContainer}>
      <Header title="Lab Reports" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_LAB)} />
      <FlatList data={labs} keyExtractor={i => i.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.labThumb} onPress={() => item.image && setViewImage(item.image)}>
              {item.image ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <FontAwesome5 name="file-medical" size={24} color={Colors.primary} />}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>{item.testName}</Text>
              <Text style={styles.cardSub}>{item.patientName}</Text>
              <Text style={styles.cardSub}><FontAwesome5 name="clipboard-list" size={10} color={Colors.subText} /> <Text>{item.labNote}</Text></Text>
            </View>
            <TouchableOpacity onPress={() => item.image ? setViewImage(item.image) : Toast.show({ type: 'info', text1: 'No Proof', text2: "No image uploaded." })} style={styles.iconBtn}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity>
            <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { marginLeft: 5 }]}><FontAwesome5 name="pen" size={14} color={Colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 5 }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity>
          </View>
        </View>
      )} />
      <Modal visible={!!viewImage} transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }} onPress={() => setViewImage(null)}><Ionicons name="close-circle" size={40} color="#FFF" /></TouchableOpacity>
          {viewImage && <Image source={{ uri: viewImage }} style={{ width: width, height: height * 0.8, resizeMode: 'contain' }} />}
        </View>
      </Modal>
    </View>
  );
};

const LabForm = ({ initialData, patients, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || { patientId: patients[0]?.id, testName: '', date: new Date().toLocaleDateString(), image: null, labNote: '' });
  const pickProof = async () => { let r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 }); if (!r.canceled) setForm({ ...form, image: r.assets[0].uri }); };
  return (
    <View style={styles.screenContainer}>
      <Header title={initialData ? "Edit Report" : "Upload Report"} onBack={onCancel} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>Select Patient</Text>
        <View style={styles.inputBox}>
          <Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>{patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}</Picker>
        </View>
        <Input label="Test Name" placeholder="e.g. Blood Test, USG KUB" value={form.testName} onChange={t => setForm({ ...form, testName: t })} />
        <Input label="Lab Note / Result Detail" placeholder="e.g. 220 mg/dL" value={form.labNote} onChange={t => setForm({ ...form, labNote: t })} />
        <Text style={styles.label}>Upload Proof (Image)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickProof}>
          {form.image ? <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <View style={{ alignItems: 'center' }}><FontAwesome5 name="cloud-upload-alt" size={30} color={Colors.subText} /><Text style={{ color: Colors.subText, marginTop: 5 }}>Click to Upload</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => onSave(form)}><Text style={styles.btnText}>SAVE REPORT</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InventoryScreen = ({ inventory, onUpdateStock, onAddItem, onDeleteItem, onUpdateItem, navigate }) => {
  const [medName, setMedName] = useState(''); const [dosageForm, setDosageForm] = useState('Tablet'); const [strength, setStrength] = useState(''); const [isAdding, setIsAdding] = useState(false); const [editingItem, setEditingItem] = useState(null);
  const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Piece'];
  const handleAdd = () => { if (medName && strength) { onAddItem(medName, dosageForm, strength); setMedName(''); setStrength(''); setIsAdding(false); } else { Toast.show({ type: 'error', text1: "Missing Fields", text2: "Please enter Medicine Name and Strength" }); } };
  const EditInventoryModal = () => {
    const [form, setForm] = useState(editingItem);
    useEffect(() => { setForm(editingItem); }, [editingItem]);
    if (!form) return null;
    const handleSave = () => { onUpdateItem(form.id, { name: form.name, strength: form.strength, dosage: form.dosage }); setEditingItem(null); };
    return (<Modal visible={!!editingItem} transparent={true} animationType="slide"><View style={styles.modalOverlay}><View style={styles.modalContent}><Text style={styles.modalTitle}>Edit Medicine</Text><Input label="Medicine Name" value={form.name} onChange={t => setForm({ ...form, name: t })} /><Input label="Strength" value={form.strength} onChange={t => setForm({ ...form, strength: t })} /><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={form.dosage} onValueChange={v => setForm({ ...form, dosage: v })} >{DOSAGE_FORMS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View><View style={[styles.row, { marginTop: 20 }]}><TouchableOpacity style={[styles.btnPrimary, { flex: 1, backgroundColor: Colors.subText, marginRight: 10 }]} onPress={() => setEditingItem(null)}><Text style={styles.btnText}>CANCEL</Text></TouchableOpacity><TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleSave}><Text style={styles.btnText}>SAVE</Text></TouchableOpacity></View></View></View></Modal>);
  };
  return (<View style={styles.screenContainer}><Header title="Inventory" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => setIsAdding(!isAdding)} /><EditInventoryModal />{isAdding ? (<View style={styles.addItemBox}><Text style={styles.subHeader}>Add New Medicine</Text><Input label="Medicine Name" value={medName} onChange={setMedName} style={{ marginBottom: 10 }} /><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={dosageForm} onValueChange={setDosageForm} style={{ height: 50 }}>{DOSAGE_FORMS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View><Input style={{ flex: 1 }} label="Strength" value={strength} onChange={setStrength} /></View><TouchableOpacity style={styles.btnSmall} onPress={handleAdd}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD MEDICINE</Text></TouchableOpacity></View>) : null}<FlatList data={inventory} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.invCard}><View style={styles.invIconBox}><FontAwesome5 name="pills" size={20} color={Colors.primary} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.invName}>{item.name} <Text style={styles.invStrength}>{item.strength}</Text></Text><Text style={styles.invUnit}>{item.dosage}</Text><Text style={[styles.stockStatus, { color: item.stock < 10 ? Colors.danger : Colors.success }]}>{item.stock === 0 ? 'Out of Stock' : `${item.stock} in stock`}</Text></View><View style={styles.counterContainer}><TouchableOpacity style={styles.counterBtn} onPress={() => onUpdateStock(item.id, -1)}><Entypo name="minus" size={24} color={Colors.danger} /></TouchableOpacity><TouchableOpacity style={styles.counterBtn} onPress={() => onUpdateStock(item.id, 1)}><Entypo name="plus" size={24} color={Colors.success} /></TouchableOpacity><TouchableOpacity style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.action + '20' }]} onPress={() => setEditingItem(item)}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]} onPress={() => onDeleteItem(item.id)}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View></View>)} /></View>);
};

const PrescriptionHistoryScreen = ({ patient, prescriptions, navigate, onDeleteRx, onEditRx }) => {
  const [viewRx, setViewRx] = useState(null); const [startDate, setStartDate] = useState(new Date('2023-01-01')); const [endDate, setEndDate] = useState(new Date()); const [showDatePicker, setShowDatePicker] = useState(null); const [filterMode, setFilterMode] = useState('recent');
  if (!patient) return null;
  const formattedStartDate = startDate.toLocaleDateString('en-CA');
  const formattedEndDate = endDate.toLocaleDateString('en-CA');
  const filteredPrescriptions = prescriptions.filter(item => item.date >= formattedStartDate && item.date <= formattedEndDate);
  const displayPrescriptions = filterMode === 'recent' ? filteredPrescriptions.slice(0, 10) : filteredPrescriptions;
  const handleExportPdf = async () => {
    if (filteredPrescriptions.length === 0) { Toast.show({ type: 'error', text1: "No Data", text2: "No prescriptions in the selected date range to export." }); return; }
    const today = new Date().toLocaleDateString('en-GB');
    const vitalsToHtml = (vitals) => { if (!vitals || Object.keys(vitals).length === 0) return ''; const vitalPills = Object.entries(vitals).map(([key, value]) => { if (!value) return ''; const label = Object.keys(VITAL_KEYS).find(k => VITAL_KEYS[k] === key); return label ? `<div class="vital-pill"><strong>${label}:</strong> ${value}</div>` : ''; }).join(''); return `<h4 class="vitals-header">Vitals Recorded</h4><div class="vitals-container">${vitalPills}</div>`; };
    const proceduresToHtml = (procedures) => { if (!procedures || procedures.length === 0) return ''; const procedureRows = procedures.map(p => `<tr><td>${p.name}</td><td>₹${p.cost}</td></tr>`).join(''); return `<h4 class="medicines-header">Procedures Performed</h4><table><thead><tr><th>Procedure</th><th>Cost (₹)</th></tr></thead><tbody>${procedureRows}</tbody></table>`; };
    const prescriptionsHtml = filteredPrescriptions.map(rx => `<div class="rx-item"><div class="rx-header"><h3>Date: ${new Date(rx.date).toLocaleDateString('en-GB')}</h3><p><strong>Diagnosis:</strong> ${rx.diagnosis}</p></div><div class="rx-body">${vitalsToHtml(rx.vitals)}<h4 class="medicines-header">Medicines</h4><table><thead><tr><th>Medicine</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${rx.medicines.map(med => `<tr><td>${med.name} ${med.strength} (${med.dosage})</td><td>${med.frequency}</td><td>${med.duration}</td><td>${med.instructions || '-'}</td></tr>`).join('')}</tbody></table>${proceduresToHtml(rx.proceduresPerformed)}${rx.notes ? `<div class="notes-section"><p><strong>Notes:</strong> ${rx.notes}</p></div>` : ''}</div></div>`).join('');
    const htmlContent = `<html><head><style> @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'); body { font-family: 'Roboto', Arial, sans-serif; color: #333; margin: 25px; font-size: 12px; } .letterhead { text-align: center; border-bottom: 2px solid ${Colors.primary}; padding-bottom: 10px; margin-bottom: 20px; } .letterhead h1 { color: ${Colors.primaryDark}; margin: 0; } .letterhead p { margin: 2px 0; font-size: 11px; color: ${Colors.subText}; } .patient-info { background-color: ${Colors.bg}; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e0e0e0; } .patient-info p { margin: 4px 0; } .rx-item { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; } .rx-header { background-color: ${Colors.primary}1A; color: ${Colors.primaryDark}; padding: 10px 15px; border-bottom: 1px solid #ddd; } .rx-header h3, .rx-header p { margin: 0; } .rx-body { padding: 15px; } .vitals-header, .medicines-header { color: ${Colors.primary}; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; } .vitals-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; } .vital-pill { background-color: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 11px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #e0e0e0; padding: 8px; text-align: left; } th { background-color: #f5f5f5; font-weight: bold; } tbody tr:nth-child(even) { background-color: #f9f9f9; } .notes-section { margin-top: 15px; padding: 10px; background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; font-style: italic; } .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; } </style></head><body> <div class="letterhead"><h1>${DOCTOR_NAME}</h1><p>${CLINIC_ADDRESS} | Phone: ${DOCTOR_PHONE}</p></div> <h2>Prescription History</h2> <div class="patient-info"><p><strong>Patient:</strong> ${patient.name}</p><p><strong>Age:</strong> ${patient.age}</p><p><strong>Gender:</strong> ${patient.gender}</p><p><strong>Report Period:</strong> ${formattedStartDate} to ${formattedEndDate}</p></div> ${prescriptionsHtml} <div class="footer"><p>This is a computer-generated report. | Generated on: ${today}</p><p><strong>${DOCTOR_NAME}</strong></p></div> </body></html>`;
    try { const { uri } = await Print.printToFileAsync({ html: htmlContent }); await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription History' }); } catch (error) { Toast.show({ type: 'error', text1: "Error", text2: "Could not generate or share PDF." }); }
  };

  const onDateChange = (event, selectedDate) => { setShowDatePicker(null); if (event.type === 'set' && selectedDate) { if (showDatePicker === 'start') setStartDate(selectedDate); else if (showDatePicker === 'end') setEndDate(selectedDate); } };
  const RxTableItem = ({ item }) => (<View key={item.id} style={styles.rxTableItem}><View style={styles.rxTableCol}><Text style={styles.rxDate}>{item.date}</Text><Text style={styles.rxDiagnosis}>{item.diagnosis}</Text><Text style={{ fontSize: 12, color: Colors.subText }}>{item.medicines.length} Medicine(s) {item.templateName ? <Text>({item.templateName})</Text> : null}</Text></View><View style={{ flexDirection: 'row', alignItems: 'center' }}><TouchableOpacity onPress={() => setViewRx(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onEditRx(item)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.primary + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => onDeleteRx(item.id)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>);

  return (<View style={styles.screenContainer}><Header title={`Rx History: ${patient.name}`} onBack={() => navigate(Screens.PATIENT_DETAILS, patient)} onAdd={() => navigate(Screens.ADD_RX, patient)} /><ScrollView contentContainerStyle={{ padding: 20 }}><Text style={styles.sectionTitleSmall}>Filter by Date</Text><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Start Date</Text><TouchableOpacity onPress={() => setShowDatePicker('start')} style={styles.pickerBtnSmall}><Text style={styles.pickerTextSmall}>{formattedStartDate}</Text></TouchableOpacity></View><View style={{ flex: 1 }}><Text style={styles.label}>End Date</Text><TouchableOpacity onPress={() => setShowDatePicker('end')} style={styles.pickerBtnSmall}><Text style={styles.pickerTextSmall}>{formattedEndDate}</Text></TouchableOpacity></View></View><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} onPress={handleExportPdf}><FontAwesome5 name="file-pdf" size={14} color="#FFF" style={{ marginRight: 10 }} /><Text style={{ color: '#FFF', fontWeight: 'bold' }}>EXPORT PDF</Text></TouchableOpacity>{showDatePicker ? <DateTimePicker value={showDatePicker === 'start' ? startDate : endDate} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} /> : null}
    <View style={styles.filterContainer}><TouchableOpacity style={[styles.filterButton, filterMode === 'recent' && styles.filterButtonActive]} onPress={() => setFilterMode('recent')}><Text style={[styles.filterButtonText, filterMode === 'recent' && styles.filterButtonTextActive]}>Recent (10)</Text></TouchableOpacity><TouchableOpacity style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]} onPress={() => setFilterMode('all')}><Text style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>All (<Text>{filteredPrescriptions.length}</Text>)</Text></TouchableOpacity></View>
    <Text style={styles.sectionTitle}>Prescription History (<Text>{displayPrescriptions.length}</Text>)</Text>
    {displayPrescriptions.length === 0 ? (<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No prescriptions found.</Text></View>) : (<View style={styles.rxTable}><View style={styles.rxTableHeader}><Text style={styles.rxHeaderCol}>Date/Diagnosis</Text><Text style={{ width: 120, textAlign: 'right', fontWeight: 'bold', color: Colors.text }}>Actions</Text></View>{displayPrescriptions.map(item => <RxTableItem key={item.id} item={item} />)}</View>)}</ScrollView><PrescriptionDetailModal rx={viewRx} onClose={() => setViewRx(null)} /></View>);
};

const AllPrescriptionHistoryScreen = ({ allPrescriptions, patients, navigate, onDeleteRx }) => {
  const [viewRx, setViewRx] = useState(null); const [startDate, setStartDate] = useState(new Date('2023-01-01')); const [endDate, setEndDate] = useState(new Date()); const [showDatePicker, setShowDatePicker] = useState(null); const [filterMode, setFilterMode] = useState('recent'); const [searchText, setSearchText] = useState('');
  const formattedStartDate = startDate.toLocaleDateString('en-CA');
  const formattedEndDate = endDate.toLocaleDateString('en-CA');
  const filteredPrescriptions = allPrescriptions.filter(item => { const inDateRange = item.date >= formattedStartDate && item.date <= formattedEndDate; const matchesSearch = item.patientName.toLowerCase().includes(searchText.toLowerCase()) || item.diagnosis.toLowerCase().includes(searchText.toLowerCase()); return inDateRange && matchesSearch; });
  const displayPrescriptions = filterMode === 'recent' ? filteredPrescriptions.slice(0, 20) : filteredPrescriptions;
  const onDateChange = (event, selectedDate) => { setShowDatePicker(null); if (event.type === 'set' && selectedDate) { if (showDatePicker === 'start') setStartDate(selectedDate); else if (showDatePicker === 'end') setEndDate(selectedDate); } };
  const RxTableItem = ({ item }) => (<View key={item.id} style={styles.rxTableItem}><View style={styles.rxTableCol}><Text style={[styles.rxDate, {fontWeight:'bold', color:Colors.primary}]}>{item.patientName}</Text><Text style={styles.rxDate}>{item.date}</Text><Text style={styles.rxDiagnosis}>{item.diagnosis}</Text><Text style={{ fontSize: 12, color: Colors.subText }}>{item.medicines.length} Meds</Text></View><View style={{ flexDirection: 'row', alignItems: 'center' }}><TouchableOpacity onPress={() => setViewRx(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="eye" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onDeleteRx(item.id)} style={[styles.iconBtn, { marginLeft: 5, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>);
  return (
    <View style={styles.screenContainer}>
      <Header title="All Prescriptions" onBack={() => navigate(Screens.DASHBOARD)} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.searchContainer}><Ionicons name="search" size={20} color={Colors.subText} /><TextInput style={styles.searchInput} placeholder="Search Patient or Diagnosis..." value={searchText} onChangeText={setSearchText} /></View>
        <Text style={styles.sectionTitleSmall}>Filter by Date</Text>
        <View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Start Date</Text><TouchableOpacity onPress={() => setShowDatePicker('start')} style={styles.pickerBtnSmall}><Text style={styles.pickerTextSmall}>{formattedStartDate}</Text></TouchableOpacity></View><View style={{ flex: 1 }}><Text style={styles.label}>End Date</Text><TouchableOpacity onPress={() => setShowDatePicker('end')} style={styles.pickerBtnSmall}><Text style={styles.pickerTextSmall}>{formattedEndDate}</Text></TouchableOpacity></View></View>
        {showDatePicker && (<DateTimePicker value={showDatePicker === 'start' ? startDate : endDate} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />)}
        <View style={styles.filterContainer}><TouchableOpacity style={[styles.filterButton, filterMode === 'recent' && styles.filterButtonActive]} onPress={() => setFilterMode('recent')}><Text style={[styles.filterButtonText, filterMode === 'recent' && styles.filterButtonTextActive]}>Recent (20)</Text></TouchableOpacity><TouchableOpacity style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]} onPress={() => setFilterMode('all')}><Text style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>All ({filteredPrescriptions.length})</Text></TouchableOpacity></View>
        <Text style={styles.sectionTitle}>Records Found: {displayPrescriptions.length}</Text>
        {displayPrescriptions.length === 0 ? (<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No records found.</Text></View>) : (<View style={styles.rxTable}>{displayPrescriptions.map(item => <RxTableItem key={item.id} item={item} />)}</View>)}
      </ScrollView>
      <PrescriptionDetailModal rx={viewRx} onClose={() => setViewRx(null)} />
    </View>
  );
};

const NewPrescriptionForm = ({ patient, inventory, templates, onSave, onCancel, initialData }) => {
  const isEdit = !!initialData; const medicineNames = [...new Set(inventory.map(i => i.name))]; const dosageForms = [...new Set(inventory.map(i => i.dosage))];
  const [rxData, setRxData] = useState(initialData ? { ...initialData, vitals: initialData.vitals || patient.vitals || {}, templateId: initialData.templateId || 'template-none', proceduresPerformed: initialData.proceduresPerformed || [] } : { patientId: patient.id, diagnosis: '', notes: '', isTapering: false, vitals: patient?.vitals || {}, medicines: [], proceduresPerformed: [], templateId: 'template-none', });
  const [currentMed, setCurrentMed] = useState({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  const [currentProc, setCurrentProc] = useState({ name: '', cost: '' });
  useEffect(() => { if (isEdit) return; const selectedTemplate = templates.find(t => t.id === rxData.templateId); if (selectedTemplate && selectedTemplate.id !== 'template-none') { setRxData(prev => ({ ...prev, diagnosis: selectedTemplate.diagnosis, medicines: selectedTemplate.medicines.map(m => ({ ...m, id: 'med_' + Date.now() + Math.random() })) })); } else if (selectedTemplate && selectedTemplate.id === 'template-none') { setRxData(prev => ({ ...prev, diagnosis: '', medicines: [] })); } }, [rxData.templateId, templates, isEdit]);
  const VitalInputRx = ({ label, unit, kbd = 'default', style }) => {
    const key = VITAL_KEYS[label]; const value = rxData.vitals[key] || '';
    const handleChange = (t) => { const cleanedText = key === 'bp' ? t.replace(/[^0-9\/]/g, '') : t.replace(/[^0-9\.]/g, ''); setRxData(prev => ({ ...prev, vitals: { ...prev.vitals, [key]: cleanedText } })); };
    return (<View style={[{ marginBottom: 15, flex: 1 }, style]}><Text style={styles.label}>{label} {unit ? <Text>({unit})</Text> : null}</Text><View style={styles.inputBoxRx}><TextInput style={{ flex: 1, padding: 0, fontSize: 16 }} value={value} onChangeText={handleChange} keyboardType={kbd} />{unit ? <Text style={{ color: Colors.subText, marginLeft: 5 }}>{unit}</Text> : null}</View></View>);
  };
  const handleAddMedicine = () => { if (!currentMed.name || !currentMed.strength) { Toast.show({ type: 'error', text1: "Missing Fields", text2: "Please enter Medicine Name and Strength." }); return; } const newMed = { ...currentMed, id: 'med_' + Date.now() + Math.random() }; setRxData(prev => ({ ...prev, medicines: [...prev.medicines, newMed] })); setCurrentMed({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' }); };
  const handleRemoveMedicine = (id) => { setRxData(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== id) })); };
  const handleAddProcedure = () => { if (!currentProc.name || !currentProc.cost) { Toast.show({ type: 'error', text1: "Missing Fields", text2: "Please enter Procedure Name and Cost." }); return; } setRxData(prev => ({ ...prev, proceduresPerformed: [...prev.proceduresPerformed, { ...currentProc, id: 'proc_' + Date.now() + Math.random() }] })); setCurrentProc({ name: '', cost: '' }); };
  const handleRemoveProcedure = (id) => { setRxData(prev => ({ ...prev, proceduresPerformed: prev.proceduresPerformed.filter(p => p.id !== id) })); };
  const handleFinalSave = () => { if (!rxData.diagnosis || rxData.medicines.length === 0) { Toast.show({ type: 'error', text1: "Incomplete Data", text2: "Please enter a diagnosis and at least one medicine." }); return; } const selectedTemplate = templates.find(t => t.id === rxData.templateId); onSave({ ...rxData, templateName: selectedTemplate?.name || 'Custom' }); };
  return (<View style={styles.screenContainer}><Header title={`${isEdit ? 'Edit' : 'New'} Rx: ${patient.name}`} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><Text style={styles.sectionTitle}>Vitals (Latest)</Text><View style={styles.row}><VitalInputRx label="SpO2" unit="%" kbd="numeric" style={{ marginRight: 10 }} /><VitalInputRx label="BP" unit="mmHg" /></View><View style={styles.row}><VitalInputRx label="HR" unit="bpm" kbd="numeric" style={{ marginRight: 10 }} /><VitalInputRx label="Temp" unit="°F" kbd="numeric" /></View><VitalInputRx label="Weight" unit="kg" kbd="numeric" /><Text style={styles.sectionTitle}>Template & Notes</Text><Text style={styles.label}>Select Template</Text><View style={styles.pickerContainer}><Picker selectedValue={rxData.templateId} onValueChange={(v) => setRxData({ ...rxData, templateId: v })}>{templates.map(t => <Picker.Item key={t.id} label={t.name} value={t.id} />)}</Picker></View><Input label="Diagnosis" placeholder="e.g., UROLITHIASIS" value={rxData.diagnosis} onChange={(t) => setRxData({ ...rxData, diagnosis: t })} /><Input label="Doctor's Notes/Additional Instructions" value={rxData.notes} onChange={(t) => setRxData({ ...rxData, notes: t })} multiline={true} style={{ marginBottom: 20 }} />
    <Text style={styles.sectionTitle}>Prescribed Medicines (<Text>{rxData.medicines.length}</Text>)</Text>{rxData.medicines.map((med) => (<View key={med.id} style={styles.medCard}><View style={{ flex: 1 }}><Text style={styles.medName}>{med.name} - {med.strength}</Text><Text style={styles.medDetails}>{med.dosage} | {med.frequency} for {med.duration}</Text><Text style={styles.medInstructions}><FontAwesome5 name="clipboard" size={10} color={Colors.subText} /> <Text>{med.instructions}</Text></Text></View><TouchableOpacity onPress={() => handleRemoveMedicine(med.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View>))}<View style={[styles.addItemBox, { marginTop: 10 }]}><Text style={styles.subHeader}>Add New Medicine</Text><Text style={styles.label}>Medicine Name</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.name} onValueChange={(v) => setCurrentMed({ ...currentMed, name: v })}>{medicineNames.map(name => <Picker.Item key={name} label={name} value={name} />)}</Picker></View><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="Strength" placeholder="e.g., 500mg" value={currentMed.strength} onChange={(t) => setCurrentMed({ ...currentMed, strength: t })} /><View style={{ flex: 1 }}><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.dosage} onValueChange={(v) => setCurrentMed({ ...currentMed, dosage: v })} style={{ height: 40 }}>{dosageForms.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View></View><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Frequency</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.frequency} onValueChange={(v) => setCurrentMed({ ...currentMed, frequency: v })} style={{ height: 40 }}>{FREQUENCY_OPTIONS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View><View style={{ flex: 1 }}><Text style={styles.label}>Duration</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.duration} onValueChange={(v) => setCurrentMed({ ...currentMed, duration: v })} style={{ height: 40 }}>{DURATION_OPTIONS.map(d => <Picker.Item key={d} label={d} value={d} />)}</Picker></View></View></View><Input label="Specific Instructions" placeholder="e.g., After food" value={currentMed.instructions} onChange={(t) => setCurrentMed({ ...currentMed, instructions: t })} /><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action }]} onPress={handleAddMedicine}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD TO PRESCRIPTION</Text></TouchableOpacity></View>
    <Text style={styles.sectionTitle}>Procedures Performed (<Text>{rxData.proceduresPerformed.length}</Text>)</Text>{rxData.proceduresPerformed.map((proc) => (<View key={proc.id} style={[styles.medCard, { borderLeftColor: Colors.dash6 }]}><View style={{ flex: 1 }}><Text style={styles.medName}>{proc.name}</Text><Text style={styles.medDetails}>Cost: <Text>₹{proc.cost}</Text></Text></View><TouchableOpacity onPress={() => handleRemoveProcedure(proc.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View>))}<View style={[styles.addItemBox, { marginTop: 10 }]}><Text style={styles.subHeader}>Add Procedure</Text><View style={styles.row}><Input style={{ flex: 2, marginRight: 10 }} label="Procedure Name" placeholder="e.g., Dressing" value={currentProc.name} onChange={t => setCurrentProc({ ...currentProc, name: t })} /><Input style={{ flex: 1 }} label="Cost (₹)" kbd="numeric" value={currentProc.cost} onChange={t => setCurrentProc({ ...currentProc, cost: t })} /></View><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.dash6 }]} onPress={handleAddProcedure}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD PROCEDURE</Text></TouchableOpacity></View>
    <TouchableOpacity style={styles.btnPrimary} onPress={handleFinalSave}><Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} PRESCRIPTION</Text></TouchableOpacity></ScrollView></View>);
};

const TemplateManagerScreen = ({ templates, navigate, onEdit, onDelete }) => {
  return (<View style={styles.screenContainer}><Header title="Manage Rx Templates" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_TEMPLATE)} /><FlatList data={templates.filter(t => t.id !== 'template-none')} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20 }} renderItem={({ item }) => (<View key={item.id} style={styles.card}><View style={styles.row}><View style={[styles.invIconBox, { backgroundColor: Colors.dash5 + '20' }]}><FontAwesome5 name="file-signature" size={20} color={Colors.dash5} /></View><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.invName}>{item.name}</Text><Text style={styles.cardSub}>{item.medicines.length} medicine(s)</Text></View><View style={styles.row}><TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View></View>)} ListEmptyComponent={<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No custom templates found. Tap '+' to add one.</Text></View>} /></View>);
};

const AddTemplateForm = ({ initialData, inventory, onSave, onCancel }) => {
  const isEdit = !!initialData; const medicineNames = [...new Set(inventory.map(i => i.name))]; const dosageForms = [...new Set(inventory.map(i => i.dosage))]; const [templateData, setTemplateData] = useState(initialData || { name: '', diagnosis: '', medicines: [] }); const [currentMed, setCurrentMed] = useState({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' });
  const handleAddMedicine = () => { if (!currentMed.name || !currentMed.strength) { Toast.show({ type: 'error', text1: "Missing Fields", text2: "Please enter Medicine Name and Strength." }); return; } const newMed = { ...currentMed, id: 'temp_med_' + Date.now() + Math.random() }; setTemplateData(prev => ({ ...prev, medicines: [...prev.medicines, newMed] })); setCurrentMed({ name: medicineNames[0] || '', strength: '', dosage: dosageForms[0] || 'Tablet', frequency: FREQUENCY_OPTIONS[0], duration: DURATION_OPTIONS[0], instructions: '' }); };
  const handleRemoveMedicine = (id) => { setTemplateData(prev => ({ ...prev, medicines: prev.medicines.filter(m => m.id !== id) })); };
  const handleFinalSave = () => { if (!templateData.name || !templateData.diagnosis) { Toast.show({ type: 'error', text1: "Incomplete Data", text2: "Please enter a Template Name and a default Diagnosis." }); return; } onSave(templateData); };
  return (<View style={styles.screenContainer}><Header title={isEdit ? "Edit Template" : "Add New Template"} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><Input label="Template Name" placeholder="e.g., Fever, Allergy" value={templateData.name} onChange={(t) => setTemplateData({ ...templateData, name: t })} /><Input label="Default Diagnosis" placeholder="e.g., Viral Fever" value={templateData.diagnosis} onChange={(t) => setTemplateData({ ...templateData, diagnosis: t })} /><Text style={styles.sectionTitle}>Medicines in Template (<Text>{templateData.medicines.length}</Text>)</Text>{templateData.medicines.map((med) => (<View key={med.id} style={styles.medCard}><View style={{ flex: 1 }}><Text style={styles.medName}>{med.name} - {med.strength}</Text><Text style={styles.medDetails}>{med.dosage} | {med.frequency} for {med.duration}</Text><Text style={styles.medInstructions}><FontAwesome5 name="clipboard" size={10} color={Colors.subText} /> <Text>{med.instructions}</Text></Text></View><TouchableOpacity onPress={() => handleRemoveMedicine(med.id)} style={[styles.iconBtn, { backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash-alt" size={14} color={Colors.danger} /></TouchableOpacity></View>))}<View style={[styles.addItemBox, { marginTop: 10 }]}><Text style={styles.subHeader}>Add Medicine to Template</Text><Text style={styles.label}>Medicine Name</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.name} onValueChange={(v) => setCurrentMed({ ...currentMed, name: v })}>{medicineNames.map(name => <Picker.Item key={name} label={name} value={name} />)}</Picker></View><View style={styles.row}><Input style={{ flex: 1, marginRight: 10 }} label="Strength" value={currentMed.strength} onChange={(t) => setCurrentMed({ ...currentMed, strength: t })} /><View style={{ flex: 1 }}><Text style={styles.label}>Dosage Form</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.dosage} onValueChange={(v) => setCurrentMed({ ...currentMed, dosage: v })} style={{ height: 40 }}>{dosageForms.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View></View><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Frequency</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.frequency} onValueChange={(v) => setCurrentMed({ ...currentMed, frequency: v })} style={{ height: 40 }}>{FREQUENCY_OPTIONS.map(f => <Picker.Item key={f} label={f} value={f} />)}</Picker></View></View><View style={{ flex: 1 }}><Text style={styles.label}>Duration</Text><View style={styles.pickerContainer}><Picker selectedValue={currentMed.duration} onValueChange={(v) => setCurrentMed({ ...currentMed, duration: v })} style={{ height: 40 }}>{DURATION_OPTIONS.map(d => <Picker.Item key={d} label={d} value={d} />)}</Picker></View></View></View><Input label="Instructions" value={currentMed.instructions} onChange={(t) => setCurrentMed({ ...currentMed, instructions: t })} /><TouchableOpacity style={[styles.btnSmall, { backgroundColor: Colors.action }]} onPress={handleAddMedicine}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>ADD TO TEMPLATE</Text></TouchableOpacity></View><TouchableOpacity style={styles.btnPrimary} onPress={handleFinalSave}><Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} TEMPLATE</Text></TouchableOpacity></ScrollView></View>);
};

const ProceduresHistoryScreen = ({ procedures, navigate, onEdit, onDelete }) => {
  const totalRevenue = procedures.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0); const formattedRevenue = `₹ ${totalRevenue.toLocaleString('en-IN')}`;
  return (
    <View style={styles.screenContainer}>
      <Header title="Procedures History" onBack={() => navigate(Screens.DASHBOARD)} onAdd={() => navigate(Screens.ADD_PROCEDURE)} />
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}><View style={styles.revenueCard}><View><Text style={styles.revenueLabel}>Total Revenue from Procedures</Text><Text style={styles.revenueValue}>{formattedRevenue}</Text></View><FontAwesome5 name="rupee-sign" size={30} color="#FFF" opacity={0.8} /></View></View>
      <FlatList data={procedures} keyExtractor={item => item.id} contentContainerStyle={{ padding: 20, paddingTop: 10 }} renderItem={({ item }) => (<View key={item.id} style={styles.card}><View style={styles.row}><View style={[styles.invIconBox, { backgroundColor: Colors.dash6 + '20' }]}><FontAwesome5 name="band-aid" size={20} color={Colors.dash6} /></View><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.invName}>{item.procedureName}</Text><Text style={styles.cardSub}>{item.patientName}</Text><Text style={styles.cardSub}>{item.date}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={styles.procedureCost}>₹{item.cost}</Text></View></View><View style={styles.cardActions}><View style={{ flex: 1 }}>{item.notes ? <Text style={styles.notesText}><FontAwesome5 name="sticky-note" /> <Text>{item.notes}</Text></Text> : null}</View><TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: Colors.action + '20' }]}><FontAwesome5 name="pen" size={14} color={Colors.action} /></TouchableOpacity><TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.iconBtn, { marginLeft: 10, backgroundColor: Colors.danger + '20' }]}><FontAwesome5 name="trash" size={14} color={Colors.danger} /></TouchableOpacity></View></View>)} ListEmptyComponent={<View style={styles.emptyState}><FontAwesome5 name="folder-open" size={50} color={Colors.subText} /><Text style={styles.emptyText}>No procedures recorded yet.</Text></View>} />
    </View>
  );
};

const AddProcedureForm = ({ initialData, patients, onSave, onCancel }) => {
  const isEdit = !!initialData; const [form, setForm] = useState(initialData || { patientId: patients[0]?.id, procedureName: '', date: new Date().toLocaleDateString('en-CA'), cost: '', notes: '' }); const [date, setDate] = useState(new Date(form.date)); const [showDatePicker, setShowDatePicker] = useState(false);
  const onDateChange = (event, selectedDate) => { setShowDatePicker(false); if (event.type === 'set' && selectedDate) { setDate(selectedDate); setForm({ ...form, date: selectedDate.toLocaleDateString('en-CA') }); } };
  const handleSave = () => { if (!form.patientId || !form.procedureName || !form.cost) { Toast.show({ type: 'error', text1: "Missing Fields", text2: "Please fill in Patient, Procedure Name, and Cost." }); return; } onSave(form); };
  return (<View style={styles.screenContainer}><Header title={isEdit ? "Edit Procedure" : "Add Procedure"} onBack={onCancel} /><ScrollView contentContainerStyle={{ padding: 20 }}><Text style={styles.label}>Select Patient</Text><View style={styles.pickerContainer}><Picker selectedValue={form.patientId} onValueChange={v => setForm({ ...form, patientId: v })}>{patients.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}</Picker></View><Input label="Procedure Name" placeholder="e.g., Suture, Dressing" value={form.procedureName} onChange={t => setForm({ ...form, procedureName: t })} /><View style={styles.row}><View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Date</Text><TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerBtn}><Text style={styles.pickerText}>{form.date}</Text><FontAwesome5 name="calendar-alt" size={16} color={Colors.primary} /></TouchableOpacity></View><Input style={{ flex: 1 }} label="Cost (₹)" kbd="numeric" value={form.cost} onChange={t => setForm({ ...form, cost: t })} /></View>{showDatePicker ? <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} /> : null}<Input label="Notes (Optional)" placeholder="Any relevant notes..." value={form.notes} onChange={t => setForm({ ...form, notes: t })} multiline={true} style={{ height: 100 }} /><TouchableOpacity style={styles.btnPrimary} onPress={handleSave}><Text style={styles.btnText}>{isEdit ? 'UPDATE' : 'SAVE'} PROCEDURE</Text></TouchableOpacity></ScrollView></View>);
};

const DetailPill = ({ label, value, unit, color }) => (<View style={{ flexDirection: 'row', backgroundColor: color + '15', padding: 8, borderRadius: 10, margin: 3, flexBasis: '47%', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 12, color: color, fontWeight: 'bold' }}>{label}: </Text><Text style={{ fontSize: 14, color: Colors.text }}>{value} <Text style={{ fontSize: 10, color: Colors.subText }}>{value !== 'N/A' ? unit : ''}</Text></Text></View>);
const Header = ({ title, onBack, onAdd }) => (<View style={styles.header}>{onBack ? <TouchableOpacity onPress={onBack}><MaterialIcons name="arrow-back-ios" size={24} color="#FFF" /></TouchableOpacity> : null}<Text style={styles.headerTitle}>{title}</Text>{onAdd ? <TouchableOpacity onPress={onAdd}><MaterialIcons name="add" size={32} color="#FFF" /></TouchableOpacity> : <View style={{ width: 32 }} />}</View>);
const DashboardCard = ({ title, count, icon, color, onPress }) => (<TouchableOpacity style={styles.gridCard} onPress={onPress}><View style={[styles.iconCircle, { backgroundColor: color + '20' }]}><FontAwesome5 name={icon} size={24} color={color} /></View><Text style={styles.gridCount}>{String(count)}</Text><Text style={styles.gridTitle}>{title}</Text></TouchableOpacity>);
const VitalBox = ({ label, val, unit, icon, color }) => (<View style={[styles.vitalCard, { borderTopColor: color }]}><FontAwesome5 name={icon} size={20} color={color} /><Text style={styles.vitalVal}>{val || 'N/A'} <Text style={{ fontSize: 12, color: Colors.subText }}>{val ? unit : ''}</Text></Text><Text style={styles.vitalLabel}>{label}</Text></View>);
const Input = ({ label, value, onChange, style, kbd, placeholder, multiline }) => (<View style={[{ marginBottom: 15 }, style]}>{label ? <Text style={styles.label}>{label}</Text> : null}<TextInput style={[styles.inputBox, multiline && { height: style?.height || 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} keyboardType={kbd || 'default'} placeholder={placeholder} multiline={multiline} /></View>);
const DrawerItem = ({ icon, label, color, onPress }) => (<TouchableOpacity style={styles.drawerItem} onPress={onPress}><FontAwesome5 name={icon} size={20} color={color} style={{ width: 40 }} /><Text style={[styles.drawerLabel, { color }]}>{label}</Text></TouchableOpacity>);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  screenContainer: { flex: 1, backgroundColor: Colors.bg },
  header: { height: 80, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 15, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 10 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 15, marginBottom: 10 },
  loaderOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderBox: { backgroundColor: '#FFF', padding: 25, borderRadius: 15, alignItems: 'center', elevation: 10 },
  loaderText: { marginTop: 10, color: Colors.text, fontWeight: 'bold' },
  welcomeBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primaryDark, padding: 20, borderRadius: 20, marginBottom: 20 },
  welcomeText: { color: '#FFF', fontSize: 14, opacity: 0.8 },
  docName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, alignItems: 'center', elevation: 4 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridCount: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  gridTitle: { fontSize: 14, color: Colors.subText },
  apptCardNew: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 3, borderLeftWidth: 5 },
  apptTimeBox: { justifyContent: 'center', alignItems: 'center', paddingRight: 10, borderRightWidth: 1, borderRightColor: '#EEE', width: 60 },
  apptTimeTextBig: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  apptTimeTextSmall: { fontSize: 10, color: Colors.subText },
  apptName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  apptType: { fontSize: 12, color: Colors.primary, fontWeight: 'bold', marginTop: 2 },
  apptReason: { fontSize: 12, color: Colors.subText, marginTop: 2, fontStyle: 'italic' },
  apptActionRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtnNew: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  apptSection: { backgroundColor: '#E0F7FA', padding: 15, borderRadius: 10, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: Colors.primary },
  sectionHeaderLine: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 15, marginTop: 10 },
  blueBar: { width: 4, height: 20, backgroundColor: '#3182CE', marginRight: 10, borderRadius: 2 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  sectionTitleSmall: { fontSize: 16, fontWeight: 'bold', color: Colors.primaryDark, flex: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: Colors.subText, marginBottom: 5, marginTop: 5 },
  inputBox: { backgroundColor: '#FFF', borderRadius: 10, padding: Platform.OS === 'ios' ? 15 : 12, fontSize: 16, borderWidth: 1, borderColor: '#CFD8DC' },
  inputBoxRx: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#CFD8DC', flexDirection: 'row', alignItems: 'center' },
  toggleBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  pickerBtn: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#B2DFDB' },
  pickerText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  pickerBtnSmall: { flexDirection: 'row', backgroundColor: '#FFF', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#B2DFDB' },
  pickerTextSmall: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  pickerContainer: { borderWidth: 1, borderColor: '#CFD8DC', borderRadius: 10, backgroundColor: '#FFF', overflow: 'hidden', justifyContent: 'center' },
  uploadCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0F2F1', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalContentLarge: { width: '90%', height: '85%', backgroundColor: '#FFF', borderRadius: 20, padding: 0, overflow: 'hidden' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  modalTitleLeft: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  modalSubTitle: { fontSize: 12, color: Colors.subText },
  infoCard: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 20, margin: 20, marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '500', color: Colors.text },
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 10 },
  vitalInputContainer: { flex: 1, marginRight: 10 },
  warningBox: { backgroundColor: '#FFFBE6', borderWidth: 1, borderColor: '#FFE58F', borderRadius: 8, padding: 10, marginHorizontal: 20, marginTop: 10 },
  warningText: { color: '#D48806', fontSize: 12 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#EEE', flexDirection: 'row', justifyContent: 'flex-end' },
  btnOutline: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E0', marginRight: 10 },
  btnOutlineText: { color: Colors.text },
  btnBlue: { backgroundColor: '#3182CE', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  btnBlueText: { color: '#FFF', fontWeight: 'bold' },
  colorfulHeader: { backgroundColor: Colors.blueHeader, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerPatientName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  headerDate: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  closeBtnHeader: { padding: 5 },
  diagnosisCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2, borderLeftWidth: 5, borderLeftColor: Colors.primary },
  diagnosisLabel: { fontSize: 10, fontWeight: 'bold', color: Colors.subText, letterSpacing: 1 },
  diagnosisText: { fontSize: 18, fontWeight: 'bold', color: Colors.primaryDark, marginTop: 5 },
  rxDetailItem: { borderBottomWidth: 2, padding: 10, marginRight: 10, borderRadius: 8, backgroundColor: '#F7FAFC', minWidth: 80, alignItems: 'center' },
  rxDetailLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  rxDetailValue: { fontSize: 16, fontWeight: '600', color: Colors.text },
  medicineRow: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EDF2F7' },
  medIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6FFFA', justifyContent: 'center', alignItems: 'center' },
  medNameDetail: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  medInstructionsDetail: { color: Colors.subText, fontSize: 12, marginTop: 2 },
  medNote: { color: Colors.action, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  procedureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF5FF', padding: 10, borderRadius: 8, marginBottom: 5 },
  noteBox: { backgroundColor: '#FFFFF0', padding: 15, borderRadius: 10, marginTop: 20, borderWidth: 1, borderColor: '#F0E68C' },
  noteTitle: { fontWeight: 'bold', color: '#B7791F', marginBottom: 5 },
  noteContent: { color: '#744210', fontStyle: 'italic' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 13, color: Colors.subText },
  listAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, alignItems: 'center' },
  actionLabelBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, marginRight: 10 },
  actionLabelText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  iconBtn: { padding: 8, backgroundColor: '#F5F7FA', borderRadius: 8 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginBottom: 15, borderRadius: 10, padding: 10, alignItems: 'center', elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
idCard: {
    backgroundColor: '#0D746A', // Specific Teal Color from image
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  idHeaderContainer: {
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  idCardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 3,
  },
  idContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  idAvatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45, // Perfect circle
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  idAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  idInfoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  idRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  idLabel: {
    color: '#B2DFDB', // Light teal text
    fontSize: 10,
    fontWeight: '600',
    width: 80, 
  },
  idValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  idDivider: {
    height: 2,
    backgroundColor: '#FBC02D', // Yellow divider
    width: '100%',
    marginVertical: 10,
    borderRadius: 1,
  },
  idFooterContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  idConsultantLabel: {
    color: '#B2DFDB',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  idDoctorName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  idLocationText: {
    color: '#FBC02D', // Yellow text
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  idBookingButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  idBookingText: {
    color: '#002f2a', // Dark text for contrast
    fontWeight: 'bold',
    fontSize: 11, 
  },
  vitalGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalCard: { width: '30%', backgroundColor: '#FFF', padding: 10, borderRadius: 12, alignItems: 'center', borderTopWidth: 4, elevation: 3, justifyContent: 'space-between' },
  vitalVal: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  vitalLabel: { fontSize: 12, color: Colors.subText },
  btnPrimary: { backgroundColor: Colors.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnSmall: { backgroundColor: Colors.primary, padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  labThumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  imagePicker: { height: 150, backgroundColor: '#F5F7FA', borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CFD8DC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  rxTable: { backgroundColor: Colors.card, borderRadius: 15, elevation: 2, overflow: 'hidden' },
  rxTableHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  rxHeaderCol: { flex: 1, fontWeight: 'bold', color: Colors.text },
  rxTableItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  rxTableCol: { flex: 1, paddingRight: 10 },
  rxDate: { fontSize: 12, color: Colors.subText },
  rxDiagnosis: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: Colors.card, borderRadius: 15, marginTop: 20 },
  emptyText: { color: Colors.subText, marginTop: 15, fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  medCard: { flexDirection: 'row', backgroundColor: '#F5F7FA', padding: 10, borderRadius: 10, marginBottom: 8, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: Colors.primary },
  medName: { fontWeight: 'bold', color: Colors.text },
  medDetails: { fontSize: 12, color: Colors.subText, fontStyle: 'italic' },
  medInstructions: { fontSize: 12, color: Colors.action, marginTop: 5 },
  detailRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  detailLabel: { width: 80, fontWeight: 'bold', color: Colors.subText },
  detailValue: { flex: 1, color: Colors.text, fontWeight: '600' },
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, flexDirection: 'row' },
  drawer: { width: width * 0.75, backgroundColor: '#FFF', height: '100%' },
  drawerHeader: { justifyContent: 'flex-end', padding: 20, backgroundColor: Colors.bg },
  drawerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginTop: 10 },
  drawerSub: { color: Colors.subText },
  drawerItem: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FAFAFA' },
  drawerLabel: { marginLeft: 20, fontSize: 16, fontWeight: '500' },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  drawerContactBox: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, width: '100%' },
  drawerContactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '20', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, },
  drawerContactText: { marginLeft: 8, fontWeight: 'bold', color: Colors.primary },
  loginContainer: { flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  loginCard: { width: '85%', backgroundColor: '#FFF', padding: 40, borderRadius: 30, alignItems: 'center', elevation: 15 },
  logoBubble: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.primaryDark },
  loginSub: { color: Colors.subText, marginBottom: 30 },
  loginBtn: { width: '100%', backgroundColor: Colors.action, padding: 15, borderRadius: 25, alignItems: 'center', elevation: 5, marginTop: 20 },
  loginInputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 20, paddingBottom: 5 },
  addItemBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 3 },
  subHeader: { fontWeight: 'bold', marginBottom: 10, color: Colors.primary },
  invCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, alignItems: 'center' },
  invIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  invName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  invStrength: { fontSize: 14, fontWeight: 'normal', color: Colors.subText },
  invUnit: { fontSize: 12, color: Colors.primary, marginTop: 2, fontStyle: 'italic' },
  stockStatus: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  counterContainer: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { padding: 8 },
  alertWidget: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#FFCDD2' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  alertTitle: { color: Colors.danger, fontWeight: 'bold', marginLeft: 10 },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  alertName: { fontWeight: '600', color: Colors.text },
  alertStatus: { fontSize: 12, fontWeight: 'bold' },
  revenueCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dash6, padding: 20, borderRadius: 20, elevation: 5, marginBottom: 10 },
  revenueLabel: { color: '#FFF', fontSize: 14, opacity: 0.8 },
  revenueValue: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  procedureCost: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  notesText: { fontSize: 12, color: Colors.subText, fontStyle: 'italic', flexShrink: 1 },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.danger + '20', padding: 15, borderRadius: 15, marginTop: 20 },
  emergencyTitle: { fontWeight: 'bold', color: Colors.danger },
  emergencyNumber: { fontSize: 18, color: Colors.text, fontWeight: 'bold' },
  callNowBtn: { backgroundColor: Colors.danger, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  callNowText: { color: '#FFF', fontWeight: 'bold' },
  filterContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15, backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 4 },
  filterButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterButtonActive: { backgroundColor: Colors.primary },
  filterButtonText: { fontWeight: 'bold', color: Colors.primary },
  filterButtonTextActive: { color: '#FFF' },
});   