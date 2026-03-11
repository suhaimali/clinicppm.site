import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Activity,
    ArrowLeft,
    Banknote,
    ChevronDown,
    Clipboard,
    Copy,
    Droplet,
    Eye,
    FileText,
    FlaskConical,
    HeartPulse,
    Pencil,
    Pill,
    Plus,
    PlusCircle,
    Save,
    Search,
    Settings,
    Sparkles,
    Stethoscope,
    TestTube,
    Thermometer,
    Trash2,
    TrendingDown,
    UserPlus,
    Weight,
    X
} from 'lucide-react-native';

import PrescriptionMedicineModal from '../../components/commons/PrescriptionMedicineModal';
import { CustomPicker, InputGroup } from '../../components/commons/FormControls';
import { getMedicalModalTheme, getMedicalTableTheme } from '../../constants/tableTheme';
import {
    DOSAGES_INIT,
    DURATIONS_INIT,
    FREQUENCIES_INIT,
    INSTRUCTIONS_INIT,
    PROCEDURE_CATEGORIES
} from '../../constants/medical';
import { buildMedicineRecord, findMatchingMedicine, sanitizeMedicineDraft } from '../../utils/medicine';
import {
    buildTemplateRecord,
    createTemplateCopyName,
    findMatchingTemplate,
    hasTemplateContent,
    mergeTemplateIntoDraft,
    sanitizeTemplateDraft
} from '../../utils/template';

const { height } = Dimensions.get('window');

const getPaddedContentStyle = (layout, style = {}) => ({
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    ...style,
});

export default function TemplateScreen({
    theme,
    onBack,
    templates,
    setTemplates,
    medicines,
    setMedicines,
    procedures,
    setProcedures,
    showToast,
    isPrescription = false,
    patient,
    onSavePrescription,
    layout,
    styles,
}) {
    const insets = useSafeAreaInsets();
    const modalTheme = getMedicalModalTheme(theme);
    const tableTheme = getMedicalTableTheme(theme);
    const [view, setView] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [editorForm, setEditorForm] = useState({
        id: null,
        name: '',
        diagnosis: '',
        advice: '',
        medicines: [],
        procedures: [],
        nextVisitInvestigations: [],
        referral: ''
    });
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [showReferral, setShowReferral] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [medModalVisible, setMedModalVisible] = useState(false);
    const [medSearch, setMedSearch] = useState('');
    const [procModalVisible, setProcModalVisible] = useState(false);
    const [procModalType, setProcModalType] = useState('procedure');
    const [procSearch, setProcSearch] = useState('');
    const [procViewMode, setProcViewMode] = useState('list');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [masterProcForm, setMasterProcForm] = useState({ id: null, name: '', cost: '', category: 'General' });
    const [customProcForm, setCustomProcForm] = useState({ name: '', cost: '' });
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [templatePickerSearch, setTemplatePickerSearch] = useState('');
    const [rowLimitPickerVisible, setRowLimitPickerVisible] = useState(false);
    const [freqOptions, setFreqOptions] = useState(FREQUENCIES_INIT);
    const [durOptions, setDurOptions] = useState(DURATIONS_INIT);
    const [instrOptions, setInstrOptions] = useState(INSTRUCTIONS_INIT);
    const [doseOptions, setDoseOptions] = useState(DOSAGES_INIT);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputCategory, setInputCategory] = useState(null);
    const [inputText, setInputText] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newMedForm, setNewMedForm] = useState({
        inventoryId: null,
        name: '',
        content: '',
        type: 'Tablet',
        doseQty: '',
        freq: '',
        duration: '',
        instruction: '',
        isTapering: false
    });
    const [editingMedIndex, setEditingMedIndex] = useState(null);
    const [rowLimit, setRowLimit] = useState(25);

    const rowLimitOptions = [
        { label: '25 rows', value: 25 },
        { label: '50 rows', value: 50 },
        { label: '100 rows', value: 100 }
    ];

    const getEmptyPrescriptionMedicineForm = () => ({
        inventoryId: null,
        name: '',
        content: '',
        type: 'Tablet',
        doseQty: '',
        freq: '',
        duration: '',
        instruction: '',
        isTapering: false
    });

    useEffect(() => {
        if (isPrescription) {
            setView('edit');
            setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [], referral: '' });
            setShowReferral(false);
        }
    }, [isPrescription]);

    const filteredTemplates = templates.filter((template) => {
        const query = searchQuery.toLowerCase();

        return template.name.toLowerCase().includes(query)
            || (template.diagnosis || '').toLowerCase().includes(query)
            || (template.advice || '').toLowerCase().includes(query)
            || (template.referral || '').toLowerCase().includes(query)
            || (template.medicines || []).some((item) => item.name.toLowerCase().includes(query));
    });

    const totalMedicineLines = templates.reduce((count, template) => count + (template.medicines?.length || 0), 0);
    const totalProcedureLines = templates.reduce((count, template) => count + (template.procedures?.length || 0) + (template.nextVisitInvestigations?.length || 0), 0);
    const visibleTemplates = filteredTemplates.slice(0, rowLimit);
    const tableMinWidth = layout?.isTablet ? 1160 : 940;

    const applyTemplate = (template) => {
        setEditorForm((prev) => mergeTemplateIntoDraft(prev, template));
        if (template.referral) {
            setShowReferral(true);
        }
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
        if (item.referral) {
            setShowReferral(true);
        }
        setView('edit');
    };

    const handleCreate = () => {
        setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [], referral: '' });
        setShowReferral(false);
        setSaveAsTemplate(false);
        setView('edit');
    };

    const handleDuplicateTemplate = (template) => {
        const copiedTemplate = sanitizeTemplateDraft(template);
        const copiedName = createTemplateCopyName(templates, copiedTemplate.name);

        setTemplates((prev) => [
            buildTemplateRecord({ ...copiedTemplate, id: null, name: copiedName }),
            ...prev
        ]);
        showToast('Copied', `${copiedName} created`, 'success');
    };

    const commitTemplateUpdate = (draft, templateId) => {
        const sanitizedTemplate = sanitizeTemplateDraft(draft);

        setTemplates((prev) => prev.map((template) => (template.id === templateId ? { ...sanitizedTemplate, id: templateId } : template)));
    };

    const commitNewTemplate = (draft) => {
        const record = buildTemplateRecord(draft);
        setTemplates((prev) => [record, ...prev]);
        return record;
    };

    const handleSaveTemplate = () => {
        const sanitizedTemplate = sanitizeTemplateDraft(editorForm);

        if (!isPrescription && !sanitizedTemplate.name) {
            Alert.alert('Required', 'Please enter a Template Name.');
            return;
        }

        if (!hasTemplateContent(sanitizedTemplate)) {
            Alert.alert('Empty Template', 'Add diagnosis, medicines, procedures, investigations, referral, or advice before saving.');
            return;
        }

        if (isPrescription) {
            const finalizePrescription = () => {
                onSavePrescription({
                    ...sanitizedTemplate,
                    patientId: patient.id,
                    date: new Date().toISOString()
                });
            };

            if (!saveAsTemplate) {
                finalizePrescription();
                return;
            }

            if (!sanitizedTemplate.name) {
                Alert.alert('Template Name Required', 'Enter a template name to save this prescription as a reusable template.');
                return;
            }

            const existingTemplate = findMatchingTemplate(templates, sanitizedTemplate);
            if (existingTemplate) {
                Alert.alert('Template Already Exists', 'Choose whether to overwrite the existing template or save a new copy.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Save Copy',
                        onPress: () => {
                            const copiedName = createTemplateCopyName(templates, sanitizedTemplate.name);
                            commitNewTemplate({ ...sanitizedTemplate, name: copiedName });
                            showToast('Saved', `Prescription saved and template stored as ${copiedName}.`, 'success');
                            finalizePrescription();
                        }
                    },
                    {
                        text: 'Overwrite',
                        onPress: () => {
                            commitTemplateUpdate(sanitizedTemplate, existingTemplate.id);
                            showToast('Updated', `${existingTemplate.name} overwritten with the latest prescription.`, 'success');
                            finalizePrescription();
                        }
                    }
                ]);
                return;
            }

            commitNewTemplate(sanitizedTemplate);
            showToast('Saved', 'Prescription and template saved.', 'success');
            finalizePrescription();
            return;
        }

        const duplicateTemplate = findMatchingTemplate(templates, sanitizedTemplate, sanitizedTemplate.id || null);
        if (duplicateTemplate) {
            Alert.alert('Duplicate Template', 'A template with the same name already exists. Please rename this template or update the existing one.');
            return;
        }

        if (sanitizedTemplate.id) {
            commitTemplateUpdate(sanitizedTemplate, sanitizedTemplate.id);
            showToast('Success', 'Template Updated Successfully!', 'success');
        } else {
            commitNewTemplate(sanitizedTemplate);
            showToast('Success', 'New Template Created!', 'success');
        }

        setEditorForm({ id: null, name: '', diagnosis: '', advice: '', medicines: [], procedures: [], nextVisitInvestigations: [], referral: '' });
        setShowReferral(false);
        setView('list');
    };

    const handleDeleteTemplate = (id) => {
        Alert.alert('Delete', 'Remove this template?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setTemplates((prev) => prev.filter((template) => template.id !== id));
                    showToast('Deleted', 'Template removed.', 'error');
                }
            }
        ]);
    };

    const openTemplateDetails = (template) => {
        setSelectedTemplate(template);
        setViewModalVisible(true);
    };

    const addProcedureToForm = (procedureItem) => {
        const targetList = procModalType === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const newItem = { ...procedureItem, id: Date.now() };

        setEditorForm((prev) => ({
            ...prev,
            [targetList]: [...prev[targetList], newItem]
        }));

        setProcModalVisible(false);
        showToast('Added', `${procModalType === 'investigation' ? 'Investigation' : 'Procedure'} added`, 'success');
    };

    const handleSaveMasterProcedure = () => {
        if (!masterProcForm.name) {
            Alert.alert('Missing Info', 'Name is required.');
            return;
        }

        if (masterProcForm.id) {
            const updated = procedures.map((procedureItem) => (procedureItem.id === masterProcForm.id ? masterProcForm : procedureItem));
            setProcedures(updated);
            showToast('Updated', 'Master list updated', 'success');
        } else {
            const newProcedure = { ...masterProcForm, id: Date.now(), category: masterProcForm.category || 'General' };
            setProcedures([newProcedure, ...procedures]);
            showToast('Created', 'New item added to master list', 'success');
        }

        setProcViewMode('list');
    };

    const handleDeleteMasterProcedure = (id) => {
        Alert.alert('Delete', 'Permanently remove from master list?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setProcedures(procedures.filter((procedureItem) => procedureItem.id !== id));
                    showToast('Deleted', 'Item removed', 'error');
                }
            }
        ]);
    };

    const addCustomToRx = () => {
        if (!customProcForm.name) {
            Alert.alert('Missing Info', 'Name is required');
            return;
        }

        const customProcedure = {
            id: Date.now(),
            name: customProcForm.name,
            cost: customProcForm.cost || '0',
            category: 'Custom'
        };

        addProcedureToForm(customProcedure);
        setCustomProcForm({ name: '', cost: '' });
        setShowCustomInput(false);
    };

    const removeItemFromForm = (index, type) => {
        const targetList = type === 'investigation' ? 'nextVisitInvestigations' : 'procedures';
        const updated = [...editorForm[targetList]];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, [targetList]: updated });
    };

    const calculateTotalCost = () => editorForm.procedures.reduce((total, item) => total + (parseFloat(item.cost) || 0), 0);

    const openAddMasterProc = () => {
        setMasterProcForm({ id: null, name: '', cost: '', category: 'General' });
        setProcViewMode('add_master');
    };

    const openEditMasterProc = (item) => {
        setMasterProcForm({ ...item });
        setProcViewMode('edit_master');
    };

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

    const removeMedFromTemplate = (index) => {
        const updated = [...editorForm.medicines];
        updated.splice(index, 1);
        setEditorForm({ ...editorForm, medicines: updated });
    };

    const handleEditMedInTemplate = (index) => {
        const medicine = editorForm.medicines[index];
        setNewMedForm({
            inventoryId: medicine.inventoryId || null,
            name: medicine.name,
            content: medicine.content,
            type: medicine.type,
            doseQty: medicine.doseQty || '',
            freq: medicine.freq,
            duration: medicine.duration,
            instruction: medicine.instruction,
            isTapering: medicine.isTapering || false
        });
        setEditingMedIndex(index);
        setMedModalVisible(true);
    };

    const openMedModal = () => {
        setEditingMedIndex(null);
        setNewMedForm(getEmptyPrescriptionMedicineForm());
        setMedSearch('');
        setMedModalVisible(true);
    };

    const addMedToTemplate = () => {
        const sanitizedMedicine = sanitizeMedicineDraft(newMedForm);

        if (!sanitizedMedicine.name) {
            Alert.alert('Required', 'Medicine Name is required.');
            return;
        }

        let finalDosage = '';
        if (sanitizedMedicine.isTapering) {
            finalDosage = 'Tapering Dose';
        } else {
            if (!sanitizedMedicine.doseQty) {
                Alert.alert('Select Dosage', 'Please select a Dose Amount.');
                return;
            }

            finalDosage = sanitizedMedicine.content ? `${sanitizedMedicine.doseQty} (${sanitizedMedicine.content})` : sanitizedMedicine.doseQty;
        }

        if (!sanitizedMedicine.freq || !sanitizedMedicine.duration) {
            Alert.alert('Missing Details', 'Please select Frequency and Duration.');
            return;
        }

        let selectedInventoryMed = sanitizedMedicine.inventoryId
            ? medicines.find((item) => item.id === sanitizedMedicine.inventoryId) || null
            : null;

        if (!selectedInventoryMed) {
            const existingMedicine = findMatchingMedicine(medicines, sanitizedMedicine);

            if (existingMedicine) {
                selectedInventoryMed = existingMedicine;
            } else {
                selectedInventoryMed = buildMedicineRecord(sanitizedMedicine);
                setMedicines((prev) => [selectedInventoryMed, ...prev]);
                showToast('Success', 'New medicine added to inventory.', 'success');
            }
        }

        const medicineObject = {
            ...sanitizedMedicine,
            inventoryId: selectedInventoryMed.id,
            name: selectedInventoryMed.name,
            content: selectedInventoryMed.content,
            type: selectedInventoryMed.type,
            dosage: finalDosage,
            id: editingMedIndex !== null ? editorForm.medicines[editingMedIndex].id : Date.now()
        };

        if (editingMedIndex !== null) {
            const updatedMeds = [...editorForm.medicines];
            updatedMeds[editingMedIndex] = medicineObject;
            setEditorForm({ ...editorForm, medicines: updatedMeds });
        } else {
            setEditorForm({ ...editorForm, medicines: [...editorForm.medicines, medicineObject] });
        }

        setMedModalVisible(false);
    };

    const selectInventoryMed = (medicine) => {
        setNewMedForm((prev) => ({
            ...prev,
            inventoryId: medicine.id,
            name: medicine.name,
            type: medicine.type,
            content: medicine.content,
            doseQty: '',
            isTapering: false
        }));
        setMedSearch('');
    };

    const clearSelection = () => {
        setNewMedForm((prev) => ({
            ...prev,
            inventoryId: null,
            name: '',
            content: '',
            type: 'Tablet',
            doseQty: '',
            isTapering: false
        }));
    };

    const openAddInput = (category, isEdit = false, value = '') => {
        setInputCategory(category);
        setInputText(value);
        setEditingItem(isEdit ? value : null);
        setInputVisible(true);
    };

    const handleAddItem = () => {
        if (!inputText.trim()) {
            setInputVisible(false);
            return;
        }

        const updateList = (list, setList) => {
            if (editingItem) {
                setList(list.map((item) => (item === editingItem ? inputText : item)));
            } else {
                setList([...list, inputText]);
            }
        };

        if (inputCategory === 'freq') {
            updateList(freqOptions, setFreqOptions);
        } else if (inputCategory === 'dur') {
            updateList(durOptions, setDurOptions);
        } else if (inputCategory === 'instr') {
            updateList(instrOptions, setInstrOptions);
        } else if (inputCategory === 'dose') {
            updateList(doseOptions, setDoseOptions);
        }

        setInputVisible(false);
    };

    const handleDeleteItem = (category, item) => {
        if (category === 'freq') {
            setFreqOptions(freqOptions.filter((option) => option !== item));
        } else if (category === 'dur') {
            setDurOptions(durOptions.filter((option) => option !== item));
        } else if (category === 'instr') {
            setInstrOptions(instrOptions.filter((option) => option !== item));
        } else if (category === 'dose') {
            setDoseOptions(doseOptions.filter((option) => option !== item));
        }
    };

    const handleLongPressItem = (category, item) => {
        Alert.alert('Manage Item', `Choose action for "${item}"`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit', onPress: () => openAddInput(category, true, item) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(category, item) }
        ]);
    };

    const renderList = () => {
        return (
            <View style={{ flex: 1 }}>
                <View style={getPaddedContentStyle(layout, { marginBottom: 16, gap: 12 })}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>TOTAL TEMPLATES</Text>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 6 }}>{templates.length}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>MEDICINE LINES</Text>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 6 }}>{totalMedicineLines}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>PROC + INVESTIGATIONS</Text>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', marginTop: 6 }}>{totalProcedureLines}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 16, paddingHorizontal: 15, height: 55, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                        <Search size={22} color={theme.textDim} style={{ marginRight: 10 }} />
                        <TextInput style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }} placeholder="Search Templates..." placeholderTextColor={theme.textDim} value={searchQuery} onChangeText={setSearchQuery} />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={20} color={theme.textDim} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View style={getPaddedContentStyle(layout, { paddingBottom: 100 })}>
                    {filteredTemplates.length > 0 ? (
                        <>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
                                <LinearGradient colors={tableTheme.shellColors} style={{ minWidth: tableMinWidth, flex: 1, borderRadius: 24, padding: 1.5 }}>
                                    <View style={{ borderRadius: 23, overflow: 'hidden', borderWidth: 1, borderColor: tableTheme.outline, backgroundColor: tableTheme.statBg }}>
                                        <LinearGradient colors={tableTheme.headerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                                            <Text style={{ width: 230, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Template</Text>
                                            <Text style={{ width: 220, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Diagnosis</Text>
                                            <Text style={{ width: 130, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medicines</Text>
                                            <Text style={{ width: 170, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Procedures / Inv.</Text>
                                            <Text style={{ width: 240, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Advice / Referral</Text>
                                            <Text style={{ flex: 1, minWidth: 240, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</Text>
                                        </LinearGradient>

                                        <View style={{ overflow: 'hidden' }}>
                                            {visibleTemplates.map((item, index) => {
                                                const procedureCount = (item.procedures || []).length;
                                                const investigationCount = (item.nextVisitInvestigations || []).length;
                                                const isLastRow = index === visibleTemplates.length - 1;

                                                return (
                                                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? tableTheme.rowEven : tableTheme.rowOdd, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: isLastRow ? 0 : 1, borderBottomColor: tableTheme.rowBorder }}>
                                                        <View style={{ width: 230, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
                                                            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(45,212,191,0.16)', 'rgba(14,165,233,0.14)'] : ['#ccfbf1', '#dbeafe']} style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                                                <FileText size={18} color={tableTheme.accentText} />
                                                            </LinearGradient>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                                <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 4 }} numberOfLines={1}>Reusable prescription template</Text>
                                                            </View>
                                                        </View>

                                                        <View style={{ width: 220, paddingRight: 12 }}>
                                                            <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }} numberOfLines={2}>{item.diagnosis || 'Not specified'}</Text>
                                                        </View>

                                                        <View style={{ width: 130, paddingRight: 12 }}>
                                                            <View style={{ alignSelf: 'flex-start', backgroundColor: tableTheme.viewActionBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                                                                <Text style={{ color: tableTheme.viewActionText, fontSize: 12, fontWeight: '700' }}>{item.medicines.length} items</Text>
                                                            </View>
                                                        </View>

                                                        <View style={{ width: 170, paddingRight: 12 }}>
                                                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }} numberOfLines={2}>{`${procedureCount} procedures • ${investigationCount} investigations`}</Text>
                                                        </View>

                                                        <View style={{ width: 240, paddingRight: 12 }}>
                                                            <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '500' }} numberOfLines={2}>{item.referral || item.advice || 'No advice added'}</Text>
                                                        </View>

                                                        <View style={{ flex: 1, minWidth: 240, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                                            <TouchableOpacity onPress={() => openTemplateDetails(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.viewActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Eye size={16} color={tableTheme.viewActionText} />
                                                                <Text style={{ color: tableTheme.viewActionText, fontSize: 12, fontWeight: '700' }}>View</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDuplicateTemplate(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.mode === 'dark' ? 'rgba(132,204,22,0.16)' : '#ecfccb', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Copy size={16} color="#4d7c0f" />
                                                                <Text style={{ color: '#4d7c0f', fontSize: 12, fontWeight: '700' }}>Copy</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Pencil size={16} color={tableTheme.editActionText} />
                                                                <Text style={{ color: tableTheme.editActionText, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => handleDeleteTemplate(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.deleteActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                                <Trash2 size={16} color={tableTheme.deleteActionText} />
                                                                <Text style={{ color: tableTheme.deleteActionText, fontSize: 12, fontWeight: '700' }}>Delete</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </LinearGradient>
                            </ScrollView>

                            <View style={{ marginTop: 8, marginBottom: 32, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: theme.textDim, fontSize: 12 }}>
                                    {filteredTemplates.length === templates.length
                                        ? `Showing ${visibleTemplates.length} of ${templates.length} templates`
                                        : `Showing ${visibleTemplates.length} of ${filteredTemplates.length} filtered templates`}
                                </Text>
                                <TouchableOpacity onPress={() => setRowLimitPickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ color: tableTheme.footerHint, fontSize: 12, fontWeight: '700' }}>{`Rows: ${rowLimit}`}</Text>
                                    <ChevronDown size={14} color={tableTheme.footerHint} />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.6 }}>
                            <Sparkles size={60} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, marginTop: 15, fontSize: 16 }}>Create your first prescription template</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderVitalsSummary = () => {
        const latestVitals = patient?.vitalsHistory && patient.vitalsHistory.length > 0 ? patient.vitalsHistory[0] : null;
        if (!latestVitals) {
            return (
                <View style={{ marginBottom: 20, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}>
                    <Activity size={20} color={theme.textDim} />
                    <Text style={{ color: theme.textDim, fontSize: 13 }}>No vitals recorded for this patient.</Text>
                </View>
            );
        }

        const VitalItem = ({ label, value, unit, icon: Icon, color }) => (
            <View style={{ backgroundColor: theme.cardBg, borderRadius: 10, padding: 8, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: theme.border, minWidth: 70 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <Icon size={12} color={color} />
                    <Text style={{ fontSize: 10, color: theme.textDim, fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{value || '--'} <Text style={{ fontSize: 10, fontWeight: 'normal' }}>{unit}</Text></Text>
            </View>
        );

        return (
            <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>VITALS (AUTO-FILLED)</Text>
                    <Text style={{ fontSize: 10, color: theme.textDim }}>{new Date(latestVitals.date).toLocaleDateString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {latestVitals.sys && <VitalItem label="BP" value={`${latestVitals.sys}/${latestVitals.dia}`} unit="mmHg" icon={Activity} color="#ef4444" />}
                    {latestVitals.pulse && <VitalItem label="Pulse" value={latestVitals.pulse} unit="bpm" icon={HeartPulse} color="#8b5cf6" />}
                    {latestVitals.temp && <VitalItem label="Temp" value={latestVitals.temp} unit={`°${latestVitals.tempUnit || 'C'}`} icon={Thermometer} color="#f59e0b" />}
                    {latestVitals.weight && <VitalItem label="Weight" value={latestVitals.weight} unit="kg" icon={Weight} color="#10b981" />}
                    {latestVitals.spo2 && <VitalItem label="SpO2" value={latestVitals.spo2} unit="%" icon={Droplet} color="#0ea5e9" />}
                </View>
            </View>
        );
    };

    const renderEditor = () => (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={getPaddedContentStyle(layout, { paddingBottom: 100 })}>
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

                    <View style={{ marginBottom: 20, backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <View>
                                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Template Library</Text>
                                <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 3 }}>Load a saved prescription structure into this visit</Text>
                            </View>
                            <View style={{ backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>{templates.length} saved</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setShowTemplatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.primary, marginTop: 8 }}>
                            <Copy size={18} color={theme.primary} />
                            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Use Template in Prescription</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!isPrescription && (
                <View style={{ marginBottom: 25, backgroundColor: theme.cardBg, borderRadius: 20, padding: 5, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, elevation: 5 }}>
                    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={{ borderRadius: 16, padding: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>RX TEMPLATE</Text>
                            <FileText size={24} color="rgba(255,255,255,0.3)" />
                        </View>
                    </LinearGradient>
                    <View style={{ padding: 15 }}>
                        <InputGroup icon={FileText} label="Template Name *" value={editorForm.name} onChange={(value) => setEditorForm({ ...editorForm, name: value })} theme={theme} placeholder="e.g. Viral Fever" styles={styles} />
                    </View>
                </View>
            )}

            <View style={{ marginBottom: 20 }}>
                <InputGroup icon={Stethoscope} label="Diagnosis / Clinical Notes" value={editorForm.diagnosis} onChange={(value) => setEditorForm({ ...editorForm, diagnosis: value })} theme={theme} placeholder="e.g. Viral Pyrexia, URTI" styles={styles} />
            </View>

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
                {editorForm.medicines.map((medicine, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bae6fd' }}>
                            <Text style={{ fontWeight: 'bold', color: '#0ea5e9' }}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{medicine.name} <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textDim }}>{medicine.dosage ? `(${medicine.dosage})` : ''}</Text></Text>
                            {medicine.isTapering ? (
                                <View style={{ marginTop: 6, backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                        <TrendingDown size={12} color="#c2410c" />
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#c2410c' }}>Tapering Schedule</Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: '#9a3412', fontStyle: 'italic' }}>{medicine.freq} for {medicine.duration}</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: '#fdf2f8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fbcfe8' }}>
                                        <Text style={{ fontSize: 11, color: '#db2777', fontWeight: 'bold' }}>{medicine.freq}</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' }}>
                                        <Text style={{ fontSize: 11, color: '#059669', fontWeight: 'bold' }}>{medicine.duration}</Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: theme.textDim, fontStyle: 'italic' }}>{medicine.instruction}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => handleEditMedInTemplate(index)} style={{ padding: 8, backgroundColor: theme.inputBg, borderRadius: 10, marginRight: 5 }}>
                            <Pencil size={18} color={theme.textDim} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMedFromTemplate(index)} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}
                {editorForm.medicines.length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No medicines added yet.</Text></View>}
            </View>

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
                {(editorForm.procedures || []).map((procedureItem, index) => (
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 }}>
                        <View>
                            <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{procedureItem.name}</Text>
                            <Text style={{ fontSize: 13, color: theme.textDim }}>Category: {procedureItem.category}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16 }}>₹{procedureItem.cost}</Text>
                            <TouchableOpacity onPress={() => removeItemFromForm(index, 'procedure')} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
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
                    <View key={index} style={{ backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0f9ff', alignItems: 'center', justifyContent: 'center' }}>
                                <TestTube size={16} color="#0284c7" />
                            </View>
                            <View>
                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{item.name}</Text>
                                <Text style={{ fontSize: 12, color: theme.textDim }}>Next Visit</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => removeItemFromForm(index, 'investigation')} style={{ padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 }}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}
                {(editorForm.nextVisitInvestigations || []).length === 0 && <View style={{ padding: 20, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', backgroundColor: theme.inputBg }}><Text style={{ color: theme.textDim, fontWeight: '600' }}>No investigations added.</Text></View>}
            </View>

            <View style={{ marginBottom: 20 }}>
                {!showReferral ? (
                    <TouchableOpacity onPress={() => setShowReferral(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8 }}>
                        <View style={{ backgroundColor: theme.inputBg, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                            <UserPlus size={18} color={theme.primary} />
                        </View>
                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14 }}>+ Add Referral</Text>
                    </TouchableOpacity>
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: theme.textDim, fontWeight: '600' }}>Referral / Specialist Consult</Text>
                            <TouchableOpacity onPress={() => { setShowReferral(false); setEditorForm({ ...editorForm, referral: '' }); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Trash2 size={14} color="#ef4444" />
                                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                            <UserPlus size={20} color={theme.textDim} />
                            <TextInput style={[styles.textInput, { color: theme.text }]} value={editorForm.referral} onChangeText={(value) => setEditorForm({ ...editorForm, referral: value })} placeholder="e.g. Refer to Neurologist, Dr. Smith" placeholderTextColor={theme.textDim} />
                        </View>
                    </View>
                )}
            </View>

            <InputGroup icon={Clipboard} label="Advice / Notes" value={editorForm.advice} onChange={(value) => setEditorForm({ ...editorForm, advice: value })} theme={theme} multiline placeholder="Enter patient advice (e.g., Drink warm water)..." styles={styles} />

            {isPrescription && (
                <View style={{ marginTop: 20, backgroundColor: theme.cardBg, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Save as New Template</Text>
                        <Text style={{ color: theme.textDim, fontSize: 12 }}>Use this combination later</Text>
                        {saveAsTemplate && (
                            <TextInput style={{ marginTop: 8, padding: 8, backgroundColor: theme.inputBg, borderRadius: 8, color: theme.text, borderWidth: 1, borderColor: theme.border }} placeholder="Enter Template Name..." placeholderTextColor={theme.textDim} value={editorForm.name} onChangeText={(value) => setEditorForm({ ...editorForm, name: value })} />
                        )}
                    </View>
                    <Switch value={saveAsTemplate} onValueChange={setSaveAsTemplate} trackColor={{ false: theme.inputBg, true: theme.primary }} thumbColor="white" />
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

    const renderProcedureModal = () => {
        const procMatches = (procedures || []).filter((item) => item.name.toLowerCase().includes(procSearch.toLowerCase()) && procSearch.length > 0);
        const getCatInfo = (categoryName) => PROCEDURE_CATEGORIES.find((category) => category.value === categoryName) || PROCEDURE_CATEGORIES[0];
        const modalTitle = procModalType === 'investigation' ? 'Add Investigation' : 'Add Procedure';
        const customBtnLabel = procModalType === 'investigation' ? 'Add Custom Investigation' : 'Add Custom Procedure';

        const renderModalContent = () => {
            if (procViewMode === 'list') {
                return (
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setProcModalVisible(false)} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}>
                                <X size={20} color={theme.textDim} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ position: 'absolute', top: 0, right: 50 }}>
                            <TouchableOpacity onPress={openAddMasterProc} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                                <PlusCircle size={16} color={theme.primary} />
                                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>New</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: theme.border }}>
                                <Search size={20} color={theme.textDim} style={{ marginRight: 10 }} />
                                <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} placeholder={procModalType === 'investigation' ? 'Search investigation...' : 'Search procedure...'} placeholderTextColor={theme.textDim} value={procSearch} onChangeText={setProcSearch} />
                                {procSearch.length > 0 && (
                                    <TouchableOpacity onPress={() => setProcSearch('')}>
                                        <X size={18} color={theme.textDim} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => setShowCustomInput(!showCustomInput)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: showCustomInput ? theme.inputBg : theme.cardBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center' }}>
                                    <FlaskConical size={18} color="#8b5cf6" />
                                </View>
                                <Text style={{ fontWeight: 'bold', color: theme.text }}>{customBtnLabel}</Text>
                            </View>
                            <ChevronDown size={20} color={theme.textDim} style={{ transform: [{ rotate: showCustomInput ? '180deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        {showCustomInput && (
                            <View style={{ backgroundColor: theme.inputBg, padding: 15, borderRadius: 16, marginBottom: 15, gap: 10 }}>
                                <InputGroup icon={FileText} label="Name" value={customProcForm.name} onChange={(value) => setCustomProcForm({ ...customProcForm, name: value })} theme={theme} placeholder={procModalType === 'investigation' ? 'e.g. Thyroid Profile' : 'e.g. X-Ray Chest'} styles={styles} />
                                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                                    <View style={{ flex: 1 }}>
                                        <InputGroup icon={Banknote} label="Price (Optional)" value={customProcForm.cost} onChange={(value) => setCustomProcForm({ ...customProcForm, cost: value })} theme={theme} placeholder="0" keyboardType="numeric" styles={styles} />
                                    </View>
                                    <TouchableOpacity onPress={addCustomToRx} style={{ backgroundColor: theme.primary, height: 55, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <FlatList
                            data={procSearch.length > 0 ? procMatches : procedures}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const catInfo = getCatInfo(item.category);
                                const CategoryIcon = catInfo.icon;
                                return (
                                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: catInfo.bg, alignItems: 'center', justifyContent: 'center' }}>
                                                <CategoryIcon size={20} color={catInfo.color} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
            }

            return (
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{procViewMode === 'edit_master' ? 'Edit Item' : 'Add New Item'}</Text>
                        <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 20 }}>
                            <ArrowLeft size={20} color={theme.textDim} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={{ gap: 15 }}>
                            <InputGroup icon={Settings} label="Name *" value={masterProcForm.name} onChange={(value) => setMasterProcForm({ ...masterProcForm, name: value })} theme={theme} placeholder="Enter name" styles={styles} />
                            <InputGroup icon={Banknote} label="Price (₹)" value={masterProcForm.cost} onChange={(value) => setMasterProcForm({ ...masterProcForm, cost: value })} theme={theme} placeholder="Enter price" keyboardType="numeric" styles={styles} />
                            <View>
                                <Text style={{ color: theme.textDim, marginBottom: 8, fontWeight: '600' }}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                    {PROCEDURE_CATEGORIES.map((category) => {
                                        const CategoryIcon = category.icon;
                                        const isSelected = masterProcForm.category === category.value;

                                        return (
                                            <TouchableOpacity key={category.value} onPress={() => setMasterProcForm({ ...masterProcForm, category: category.value })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: isSelected ? category.color : theme.inputBg, borderWidth: 1, borderColor: isSelected ? category.color : theme.border }}>
                                                <CategoryIcon size={14} color={isSelected ? 'white' : category.color} />
                                                <Text style={{ color: isSelected ? 'white' : theme.text, fontWeight: '600', fontSize: 12 }}>{category.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                        <TouchableOpacity onPress={() => setProcViewMode('list')} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.inputBg }}>
                            <Text style={{ color: theme.textDim, fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveMasterProcedure} style={{ flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: theme.primary }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        };

        return (
            <Modal visible={procModalVisible} animationType="slide" transparent onRequestClose={() => setProcModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setProcModalVisible(false)} />
                        <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                        <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 31, borderTopRightRadius: 31, padding: 25, height: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.3, elevation: 20, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                            {renderModalContent()}
                        </View>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const TemplateDetailPopup = () => {
        if (!selectedTemplate || !viewModalVisible) {
            return null;
        }

        return (
            <Modal visible={viewModalVisible} transparent animationType="fade" onRequestClose={() => setViewModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', padding: 20 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setViewModalVisible(false)} />
                    <LinearGradient colors={modalTheme.shellColors} style={{ borderRadius: 26, padding: 1.5 }}>
                    <View style={{ backgroundColor: modalTheme.surface, borderRadius: 25, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, elevation: 10, maxHeight: '80%', borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <FileText size={24} color="white" />
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Template Details</Text>
                            </View>
                            <TouchableOpacity onPress={() => setViewModalVisible(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 5, borderRadius: 15 }}>
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
                            {selectedTemplate.medicines.length > 0 && (
                                <View style={{ gap: 10, marginBottom: 20 }}>
                                    {selectedTemplate.medicines.map((medicine, index) => (
                                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: modalTheme.infoBg, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.primary, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: modalTheme.surface, alignItems: 'center', justifyContent: 'center' }}>
                                                <Pill size={16} color={theme.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 }}>{medicine.name} <Text style={{ fontSize: 12, color: theme.textDim }}>({medicine.dosage})</Text></Text>
                                                {medicine.isTapering ? (
                                                    <Text style={{ fontSize: 12, color: '#c2410c', marginTop: 2, fontStyle: 'italic' }}>Tapering: {medicine.freq} for {medicine.duration}</Text>
                                                ) : (
                                                    <Text style={{ fontSize: 12, color: theme.textDim, marginTop: 2 }}>{medicine.freq} • {medicine.duration} • {medicine.instruction}</Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {(selectedTemplate.procedures || []).length > 0 && (
                                <View style={{ marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                        <Settings size={14} color={theme.textDim} />
                                        <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Procedures / Services</Text>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        {selectedTemplate.procedures.map((proc, index) => (
                                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: modalTheme.infoBg, borderRadius: 12, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                                <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 }}>{proc.name}</Text>
                                                <Text style={{ fontWeight: '700', color: theme.primary, fontSize: 14 }}>₹{proc.cost}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                            {(selectedTemplate.nextVisitInvestigations || []).length > 0 && (
                                <View style={{ marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                        <TestTube size={14} color={theme.textDim} />
                                        <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Next Visit Investigations</Text>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        {selectedTemplate.nextVisitInvestigations.map((inv, index) => (
                                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: modalTheme.infoBg, borderRadius: 12, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                                                <TestTube size={14} color="#0284c7" />
                                                <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 }}>{inv.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                            {!!selectedTemplate.referral && (
                                <View style={{ marginBottom: 20, backgroundColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.15)' : '#f5f3ff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.mode === 'dark' ? 'rgba(139,92,246,0.3)' : '#ddd6fe' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                        <UserPlus size={14} color="#7c3aed" />
                                        <Text style={{ fontWeight: '800', color: '#7c3aed', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Referral</Text>
                                    </View>
                                    <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedTemplate.referral}</Text>
                                </View>
                            )}
                            <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#fed7aa' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                    <Clipboard size={16} color="#c2410c" />
                                    <Text style={{ fontWeight: 'bold', color: '#c2410c' }}>Advice / Notes</Text>
                                </View>
                                <Text style={{ color: '#9a3412', fontStyle: 'italic' }}>{selectedTemplate.advice || 'No specific advice.'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                                <TouchableOpacity onPress={() => { setViewModalVisible(false); handleDuplicateTemplate(selectedTemplate); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfccb', padding: 12, borderRadius: 12, gap: 6 }}>
                                    <Copy size={16} color="#4d7c0f" />
                                    <Text style={{ color: '#4d7c0f', fontWeight: '800' }}>Copy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setViewModalVisible(false); handleEdit(selectedTemplate); }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffedd5', padding: 12, borderRadius: 12, gap: 6 }}>
                                    <Pencil size={16} color="#ea580c" />
                                    <Text style={{ color: '#ea580c', fontWeight: '800' }}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                    </LinearGradient>
                </View>
            </Modal>
        );
    };

    const TemplatePickerModal = () => {
        const pickerFilteredTemplates = templates.filter((template) => {
            const query = templatePickerSearch.toLowerCase();

            return template.name.toLowerCase().includes(query)
                || (template.diagnosis || '').toLowerCase().includes(query)
                || (template.medicines || []).some((medicine) => medicine.name.toLowerCase().includes(query));
        });

        return (
        <Modal visible={showTemplatePicker} transparent animationType="slide" onRequestClose={() => setShowTemplatePicker(false)}>
            <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'flex-end' }}>
                <LinearGradient colors={modalTheme.shellColors} style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 1.5, paddingHorizontal: 1.5 }}>
                <View style={{ backgroundColor: modalTheme.surface, borderTopLeftRadius: 27, borderTopRightRadius: 27, maxHeight: height * 0.78, paddingBottom: 30, borderWidth: 1, borderColor: modalTheme.shellBorder, overflow: 'hidden' }}>
                    <LinearGradient colors={modalTheme.headerColors} style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: modalTheme.eyebrowText, letterSpacing: 0.7 }}>TEMPLATE LIBRARY</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: modalTheme.headerText, marginTop: 4 }}>Select a Template</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowTemplatePicker(false)} style={{ backgroundColor: modalTheme.closeBg, padding: 8, borderRadius: 20 }}>
                            <X size={22} color={modalTheme.closeIcon} />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: modalTheme.infoBg, borderRadius: 12, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: modalTheme.infoBorder }}>
                            <Search size={18} color={theme.textDim} style={{ marginRight: 8 }} />
                            <TextInput style={{ flex: 1, color: theme.text }} placeholder="Search templates..." placeholderTextColor={theme.textDim} value={templatePickerSearch} onChangeText={setTemplatePickerSearch} />
                            {templatePickerSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setTemplatePickerSearch('')}>
                                    <X size={16} color={theme.textDim} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                        <View style={{ backgroundColor: modalTheme.infoBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: modalTheme.infoBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: '700' }}>Templates ready to use</Text>
                            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>{pickerFilteredTemplates.length} found</Text>
                        </View>
                    </View>

                    {pickerFilteredTemplates.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                            <LinearGradient colors={tableTheme.shellColors} style={{ minWidth: tableMinWidth - 80, flex: 1, borderRadius: 22, padding: 1.5 }}>
                                <View style={{ borderRadius: 21, overflow: 'hidden', borderWidth: 1, borderColor: tableTheme.outline, backgroundColor: tableTheme.statBg }}>
                                    <LinearGradient colors={tableTheme.headerColors} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                                        <Text style={{ width: 220, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Template</Text>
                                        <Text style={{ width: 230, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Diagnosis</Text>
                                        <Text style={{ width: 150, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Items</Text>
                                        <Text style={{ flex: 1, minWidth: 170, color: tableTheme.headerText, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Action</Text>
                                    </LinearGradient>

                                    {pickerFilteredTemplates.map((item, index) => {
                                        const isLastRow = index === pickerFilteredTemplates.length - 1;
                                        const summary = [
                                            `${item.medicines.length} med`,
                                            `${(item.procedures || []).length} proc`,
                                            `${(item.nextVisitInvestigations || []).length} inv`
                                        ].join(' • ');

                                        return (
                                            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: index % 2 === 0 ? tableTheme.rowEven : tableTheme.rowOdd, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: isLastRow ? 0 : 1, borderBottomColor: tableTheme.rowBorder }}>
                                                <View style={{ width: 220, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                </View>
                                                <View style={{ width: 230, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 13, color: theme.textDim, fontWeight: '600' }} numberOfLines={2}>{item.diagnosis || 'Not specified'}</Text>
                                                </View>
                                                <View style={{ width: 150, paddingRight: 12 }}>
                                                    <Text style={{ fontSize: 13, color: theme.text, fontWeight: '600' }} numberOfLines={2}>{summary}</Text>
                                                </View>
                                                <View style={{ flex: 1, minWidth: 170, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                                    <TouchableOpacity onPress={() => applyTemplate(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: tableTheme.editActionBg, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                                                        <Copy size={16} color={tableTheme.editActionText} />
                                                        <Text style={{ color: tableTheme.editActionText, fontSize: 12, fontWeight: '700' }}>Use</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </LinearGradient>
                        </ScrollView>
                    ) : (
                        <Text style={{ textAlign: 'center', padding: 20, color: theme.textDim }}>No templates available.</Text>
                    )}
                </View>
                </LinearGradient>
            </View>
        </Modal>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, getPaddedContentStyle(layout, { marginTop: insets.top + 10 })]}>
                {view === 'list' && !isPrescription ? (
                    <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => (isPrescription ? onBack() : setView('list'))} style={[styles.iconBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                )}

                <View style={{ flex: 1, paddingHorizontal: 15 }}>
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

            <PrescriptionMedicineModal
                visible={medModalVisible}
                theme={theme}
                medicines={medicines}
                medSearch={medSearch}
                setMedSearch={setMedSearch}
                newMedForm={newMedForm}
                setNewMedForm={setNewMedForm}
                editingMedIndex={editingMedIndex}
                freqOptions={freqOptions}
                durOptions={durOptions}
                doseOptions={doseOptions}
                instrOptions={instrOptions}
                onClose={() => setMedModalVisible(false)}
                onSelectInventoryMed={selectInventoryMed}
                onClearSelection={clearSelection}
                onOpenAddInput={openAddInput}
                onLongPressItem={handleLongPressItem}
                onSubmit={addMedToTemplate}
            />
            {renderProcedureModal()}
            {TemplateDetailPopup()}
            {TemplatePickerModal()}
            <CustomPicker visible={rowLimitPickerVisible} title="Rows to show" data={rowLimitOptions} onClose={() => setRowLimitPickerVisible(false)} onSelect={(value) => setRowLimit(Number(value))} theme={theme} />

            <Modal visible={inputVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: modalTheme.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <LinearGradient colors={modalTheme.shellColors} style={{ width: '100%', maxWidth: 300, borderRadius: 22, padding: 1.5 }}>
                    <View style={{ width: '100%', backgroundColor: modalTheme.surface, borderRadius: 21, padding: 20, borderWidth: 1, borderColor: modalTheme.shellBorder }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 15 }}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: modalTheme.infoBg, borderColor: theme.primary }]}>
                            <TextInput style={{ flex: 1, color: theme.text, fontSize: 16 }} value={inputText} onChangeText={setInputText} autoFocus placeholder="Type custom value..." placeholderTextColor={theme.textDim} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                            <TouchableOpacity onPress={() => setInputVisible(false)} style={{ flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: modalTheme.cancelBg }}>
                                <Text style={{ color: modalTheme.cancelText, fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddItem} style={{ flex: 1 }}>
                                <LinearGradient colors={modalTheme.primaryButton} style={{ padding: 12, alignItems: 'center', borderRadius: 10 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{editingItem ? 'Update' : 'Add'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                    </LinearGradient>
                </View>
            </Modal>
        </View>
    );
}