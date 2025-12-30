import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SAMPLE_RX = [
  { id: '1', name: 'Paracetamol 500mg', dosageForm: 'Tablet', frequency: 'TDS', od: false, duration: '3 Days' },
  { id: '2', name: 'Cetirizine 10mg', dosageForm: 'Tablet', frequency: 'OD', od: true, duration: '5 Days' },
  { id: '3', name: 'Amoxicillin 250mg', dosageForm: 'Capsule', frequency: 'BD', od: false, duration: '7 Days' },
];

export default function DosageForm({ onSave }) {
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [medicineName, setMedicineName] = useState('');
  const [tablets, setTablets] = useState('1');
  const [frequency, setFrequency] = useState('OD');
  const [od, setOd] = useState(true);
  const [duration, setDuration] = useState('5 Days');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const doSearch = () => {
    const q = query.trim().toLowerCase();
    const found = SAMPLE_RX.filter(r => r.name.toLowerCase().includes(q) || r.dosageForm.toLowerCase().includes(q) || r.frequency.toLowerCase().includes(q));
    setResults(found);
  };

  const handleSave = () => {
    if (!medicineName.trim()) return Alert.alert('Validation', 'Please enter medicine name');
    const payload = { dosageForm, medicineName: medicineName.trim(), tablets: tablets.trim(), frequency, od, duration };
    if (onSave) onSave(payload);
    Alert.alert('Saved', 'Dosage saved locally', [{ text: 'OK' }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dosage Form</Text>

      <Text style={styles.label}>Dosage Form</Text>
      <TextInput style={styles.input} value={dosageForm} onChangeText={setDosageForm} placeholder="e.g. Tablet, Syrup" />

      <Text style={styles.label}>Medicine Name</Text>
      <TextInput style={styles.input} value={medicineName} onChangeText={setMedicineName} placeholder="e.g. Paracetamol" />

      <Text style={styles.label}>Tablets / Qty</Text>
      <TextInput style={styles.input} value={tablets} onChangeText={setTablets} keyboardType="numeric" />

      <Text style={styles.label}>Frequency</Text>
      <TextInput style={styles.input} value={frequency} onChangeText={setFrequency} placeholder="OD / BD / TDS / PRN" />

      <View style={styles.row}> 
        <Text style={[styles.label, { marginRight: 8 }]}>OD (Once Daily)</Text>
        <Switch value={od} onValueChange={setOd} />
      </View>

      <Text style={styles.label}>Duration</Text>
      <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="e.g. 5 Days" />

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => { setMedicineName(''); setTablets('1'); setFrequency('OD'); setOd(true); setDuration('5 Days'); setDosageForm('Tablet'); }}>
          <Text style={[styles.btnText, { color: '#333' }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />

      <Text style={styles.title}>Search Prescriptions</Text>
      <TextInput style={styles.input} placeholder="Search by name, form or frequency" value={query} onChangeText={setQuery} />
      <TouchableOpacity style={[styles.btn, { alignSelf: 'flex-start', marginTop: 8 }]} onPress={doSearch}>
        <Text style={styles.btnText}>Search</Text>
      </TouchableOpacity>

      <FlatList data={results} keyExtractor={i=>i.id} style={{ marginTop: 12, width: '100%' }} renderItem={({ item }) => (
        <View style={styles.resultItem}>
          <Text style={{ fontWeight: '600' }}>{item.name}</Text>
          <Text style={{ color: '#666' }}>{item.dosageForm} • {item.frequency} • {item.duration}</Text>
        </View>
      )} ListEmptyComponent={() => <Text style={{ color: '#666' }}>{query ? 'No results' : 'No search yet'}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff', alignItems: 'stretch' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#222' },
  label: { fontSize: 13, color: '#444', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, marginTop: 6, backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  buttonsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  btn: { backgroundColor: '#009688', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6 },
  btnAlt: { backgroundColor: '#EEE', marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  resultItem: { padding: 10, borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 6, marginBottom: 8, backgroundColor: '#FFF' }
});
