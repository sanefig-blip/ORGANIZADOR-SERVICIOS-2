import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { rankOrder } from './types.js';
import { scheduleData as preloadedScheduleData } from './data/scheduleData.js';
import { rosterData as preloadedRosterData } from './data/rosterData.js';
import { commandPersonnelData as defaultCommandPersonnel } from './data/commandPersonnelData.js';
import { servicePersonnelData as defaultServicePersonnel } from './data/servicePersonnelData.js';
import { defaultUnits } from './data/unitData.js';
import { defaultServiceTemplates } from './data/serviceTemplates.js';
import { exportScheduleToWord, exportScheduleByTimeToWord, exportScheduleAsExcelTemplate, exportScheduleAsWordTemplate, exportExcelTemplate, exportWordTemplate } from './services/exportService.js';
import { parseServicesFromWord } from './services/wordImportService.js';
import ScheduleDisplay from './components/ScheduleDisplay.js';
import TimeGroupedScheduleDisplay from './components/TimeGroupedScheduleDisplay.js';
import Nomenclador from './components/Nomenclador.js';
import { CalendarIcon, BookOpenIcon, DownloadIcon, ClockIcon, ClipboardListIcon, RefreshIcon, EyeIcon, EyeOffIcon, UploadIcon, QuestionMarkCircleIcon, BookmarkIcon, ChevronDownIcon } from './components/icons.js';
import * as XLSX from 'xlsx';
import HelpModal from './components/HelpModal.js';
import RosterImportModal from './components/RosterImportModal.js';
import ServiceTemplateModal from './components/ServiceTemplateModal.js';
import ExportTemplateModal from './components/ExportTemplateModal.js';

const parseDateFromString = (dateString) => {
    const cleanedDateString = dateString.replace(/GUARDIA DEL DIA/i, '').replace('.-', '').trim();
    const monthNames = { "ENERO": 0, "FEBRERO": 1, "MARZO": 2, "ABRIL": 3, "MAYO": 4, "JUNIO": 5, "JULIO": 6, "AGOSTO": 7, "SEPTIEMBRE": 8, "OCTUBRE": 9, "NOVIEMBRE": 10, "DICIEMBRE": 11 };
    const parts = cleanedDateString.split(/DE\s/i);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = monthNames[parts[1].toUpperCase().trim()];
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day);
    }
    return new Date();
};


const App = () => {
    const [schedule, setSchedule] = useState(null);
    const [view, setView] = useState('schedule');
    const [displayDate, setDisplayDate] = useState(null);
    const [commandPersonnel, setCommandPersonnel] = useState([]);
    const [servicePersonnel, setServicePersonnel] = useState([]);
    const [unitList, setUnitList] = useState([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
    const [serviceTemplates, setServiceTemplates] = useState([]);
    const [roster, setRoster] = useState({});

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateModalProps, setTemplateModalProps] = useState({});
    const [isExportTemplateModalOpen, setIsExportTemplateModalOpen] = useState(false);
    const [isImportMenuOpen, setImportMenuOpen] = useState(false);
    const [isExportMenuOpen, setExportMenuOpen] = useState(false);
    
    const fileInputRef = useRef(null);
    const rosterInputRef = useRef(null);
    const importMenuRef = useRef(null);
    const exportMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isImportMenuOpen && importMenuRef.current && !importMenuRef.current.contains(event.target)) {
                setImportMenuOpen(false);
            }
            if (isExportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setExportMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isImportMenuOpen, isExportMenuOpen]);

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-24 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    const loadGuardLineFromRoster = useCallback((dateToLoad, currentStaff, currentCommandPersonnel) => {
        if (!dateToLoad || !roster) return currentStaff;
        const dateKey = `${dateToLoad.getFullYear()}-${String(dateToLoad.getMonth() + 1).padStart(2, '0')}-${String(dateToLoad.getDate()).padStart(2, '0')}`;
        const dayRoster = roster[dateKey];
        const rolesMap = [
            { key: 'jefeInspecciones', label: 'JEFE DE INSPECCIONES' },
            { key: 'jefeServicio', label: 'JEFE DE SERVICIO' },
            { key: 'jefeGuardia', label: 'JEFE DE GUARDIA' },
            { key: 'jefeReserva', label: 'JEFE DE RESERVA' }
        ];
        const finalStaff = rolesMap.map(roleInfo => {
           const personName = dayRoster?.[roleInfo.key];
           if (personName) {
               const foundPersonnel = currentCommandPersonnel.find(p => p.name === personName);
               if (foundPersonnel) return { role: roleInfo.label, name: foundPersonnel.name, id: foundPersonnel.id, rank: foundPersonnel.rank };
               return { role: roleInfo.label, name: personName, rank: 'OTRO', id: `roster-${dateKey}-${roleInfo.key}` };
           }
           return { role: roleInfo.label, name: "A designar", rank: 'OTRO', id: `empty-${roleInfo.key}` };
        });
        return finalStaff;
    }, [roster]);


    useEffect(() => {
        let scheduleToLoad;
        try {
            const savedScheduleJSON = localStorage.getItem('scheduleData');
            scheduleToLoad = savedScheduleJSON ? JSON.parse(savedScheduleJSON) : preloadedScheduleData;
        } catch (e) {
            console.error("Failed to load or parse schedule data, falling back to default.", e);
            scheduleToLoad = preloadedScheduleData;
        }
        
        const dataCopy = JSON.parse(JSON.stringify(scheduleToLoad));

        if (dataCopy.services && !('sportsEvents' in dataCopy)) {
            dataCopy.sportsEvents = dataCopy.services.filter((s) => s.title.toUpperCase().includes('EVENTO DEPORTIVO'));
            dataCopy.services = dataCopy.services.filter((s) => !s.title.toUpperCase().includes('EVENTO DEPORTIVO'));
        } else if (!dataCopy.services) dataCopy.services = [];
        if (!dataCopy.sportsEvents) dataCopy.sportsEvents = [];

        let idCounter = 0;
        const processServices = (services) => {
            (services || []).forEach(service => {
              if (!service.id) service.id = `service-hydrated-${Date.now()}-${idCounter++}`;
              service.isHidden = service.isHidden || false;
              (service.assignments || []).forEach(assignment => {
                if (!assignment.id) assignment.id = `assign-hydrated-${Date.now()}-${idCounter++}`;
              });
            });
            services.sort((a, b) => (a.isHidden ? 1 : 0) - (b.isHidden ? 1 : 0));
        };
          
        processServices(dataCopy.services);
        processServices(dataCopy.sportsEvents);
        (dataCopy.commandStaff || []).forEach((officer) => { if (!officer.id) officer.id = `officer-hydrated-${Date.now()}-${idCounter++}`; });
          
        const loadedDate = parseDateFromString(dataCopy.date);
        setDisplayDate(loadedDate);
          
        const loadedCommandPersonnel = JSON.parse(localStorage.getItem('commandPersonnel') || JSON.stringify(defaultCommandPersonnel));
        const loadedRoster = JSON.parse(localStorage.getItem('rosterData') || JSON.stringify(preloadedRosterData));
          
        dataCopy.commandStaff = loadGuardLineFromRoster(loadedDate, dataCopy.commandStaff, loadedCommandPersonnel);
          
        setSchedule(dataCopy);
        setCommandPersonnel(loadedCommandPersonnel);
        setServicePersonnel(JSON.parse(localStorage.getItem('servicePersonnel') || JSON.stringify(defaultServicePersonnel)));
        setUnitList(JSON.parse(localStorage.getItem('unitList') || JSON.stringify(defaultUnits)));
        setServiceTemplates(JSON.parse(localStorage.getItem('serviceTemplates') || JSON.stringify(defaultServiceTemplates)));
        setRoster(loadedRoster);
    }, [loadGuardLineFromRoster]);

    const sortPersonnel = (a, b) => {
        const rankComparison = (rankOrder[a.rank] || 99) - (rankOrder[b.rank] || 99);
        return rankComparison !== 0 ? rankComparison : a.name.localeCompare(b.name);
    };

    const updateAndSaveCommandPersonnel = (newList) => {
        const sortedList = newList.sort(sortPersonnel);
        localStorage.setItem('commandPersonnel', JSON.stringify(sortedList));
        setCommandPersonnel(sortedList);
    };

    const updateAndSaveServicePersonnel = (newList) => {
        const sortedList = newList.sort(sortPersonnel);
        localStorage.setItem('servicePersonnel', JSON.stringify(sortedList));
        setServicePersonnel(sortedList);
    };

    const updateAndSaveUnits = (newList) => {
        localStorage.setItem('unitList', JSON.stringify(newList));
        setUnitList(newList);
    };

    const updateAndSaveRoster = (newRoster) => {
        localStorage.setItem('rosterData', JSON.stringify(newRoster));
        setRoster(newRoster);
    };
    
    const updateAndSaveTemplates = (templates) => {
        localStorage.setItem('serviceTemplates', JSON.stringify(templates));
        setServiceTemplates(templates);
    };

    const handleUpdateService = (updatedService, type) => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const key = type === 'common' ? 'services' : 'sportsEvents';
            const newSchedule = { ...prevSchedule, [key]: prevSchedule[key].map(s => s.id === updatedService.id ? updatedService : s) };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            return newSchedule;
        });
    };

    const handleAddNewService = (type) => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const key = type === 'common' ? 'services' : 'sportsEvents';
            const newService = {
                id: `new-service-${Date.now()}`,
                title: type === 'common' ? "Nuevo Servicio (Editar)" : "Nuevo Evento Deportivo (Editar)",
                assignments: [], isHidden: false
            };
            const list = [...prevSchedule[key]];
            const firstHiddenIndex = list.findIndex(s => s.isHidden);
            const insertIndex = firstHiddenIndex === -1 ? list.length : firstHiddenIndex;
            list.splice(insertIndex, 0, newService);
            const newSchedule = { ...prevSchedule, [key]: list };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            return newSchedule;
        });
    };

    const handleMoveService = (serviceId, direction, type) => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const key = type === 'common' ? 'services' : 'sportsEvents';
            const services = [...prevSchedule[key]];
            const currentIndex = services.findIndex(s => s.id === serviceId);
            if (currentIndex === -1) return prevSchedule;
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= services.length || services[targetIndex].isHidden) return prevSchedule;
            [services[currentIndex], services[targetIndex]] = [services[targetIndex], services[currentIndex]];
            const newSchedule = { ...prevSchedule, [key]: services };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            return newSchedule;
        });
    };

    const handleToggleServiceSelection = (serviceId) => {
        const newSelection = new Set(selectedServiceIds);
        if (newSelection.has(serviceId)) newSelection.delete(serviceId);
        else newSelection.add(serviceId);
        setSelectedServiceIds(newSelection);
    };

    const handleSelectAllServices = (selectAll) => {
        if (!schedule) return;
        if (selectAll) {
            const allVisibleIds = [...schedule.services, ...schedule.sportsEvents].filter(s => !s.isHidden).map(s => s.id);
            setSelectedServiceIds(new Set(allVisibleIds));
        } else {
            const hiddenSelected = [...selectedServiceIds].filter(id => [...schedule.services, ...schedule.sportsEvents].find(s => s.id === id)?.isHidden);
            setSelectedServiceIds(new Set(hiddenSelected));
        }
    };

    const handleToggleVisibilityForSelected = () => {
        if (selectedServiceIds.size === 0) return;
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const allServices = [...prevSchedule.services, ...prevSchedule.sportsEvents];
            const firstSelected = allServices.find(s => selectedServiceIds.has(s.id));
            if (!firstSelected) return prevSchedule;
            
            const newVisibility = !firstSelected.isHidden;
            const updateVisibility = (services) => services.map(s => selectedServiceIds.has(s.id) ? { ...s, isHidden: newVisibility } : s).sort((a, b) => (a.isHidden ? 1 : 0) - (b.isHidden ? 1 : 0));
            
            const newSchedule = { ...prevSchedule, services: updateVisibility(prevSchedule.services), sportsEvents: updateVisibility(prevSchedule.sportsEvents) };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            
            setSelectedServiceIds(new Set()); // Clear selection after action
            
            return newSchedule;
        });
    };

    const handleAssignmentStatusChange = (assignmentId, statusUpdate) => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
            const allServices = [...newSchedule.services, ...newSchedule.sportsEvents];
            for (const service of allServices) {
                const assignment = service.assignments.find((a) => a.id === assignmentId);
                if (assignment) {
                    if ('inService' in statusUpdate) assignment.inService = statusUpdate.inService;
                    if ('serviceEnded' in statusUpdate) assignment.serviceEnded = statusUpdate.serviceEnded;
                    if (assignment.serviceEnded) assignment.inService = true;
                    if (assignment.inService === false) assignment.serviceEnded = false;
                    localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
                    return newSchedule;
                }
            }
            return prevSchedule;
        });
    };

    const handleDateChange = (part, value) => {
        setDisplayDate(prevDate => {
            const currentDate = prevDate || new Date();

            let year = currentDate.getFullYear();
            let month = currentDate.getMonth();
            let day = currentDate.getDate();

            if (part === 'year') year = value;
            else if (part === 'month') month = value;
            else if (part === 'day') day = value;

            const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
            if (day > daysInTargetMonth) {
                day = daysInTargetMonth;
            }

            return new Date(year, month, day);
        });
    };

    useEffect(() => {
        if (!displayDate) return;
    
        setSchedule(prevSchedule => {
            if (!prevSchedule) return prevSchedule;
    
            const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
            const newDateString = `${displayDate.getDate()} DE ${monthNames[displayDate.getMonth()]} DE ${displayDate.getFullYear()}`;
            const newCommandStaff = loadGuardLineFromRoster(displayDate, prevSchedule.commandStaff, commandPersonnel);
            
            const scheduleNeedsUpdate = prevSchedule.date !== newDateString || JSON.stringify(prevSchedule.commandStaff) !== JSON.stringify(newCommandStaff);

            if (!scheduleNeedsUpdate) {
                return prevSchedule;
            }
            
            const newSchedule = { 
                ...prevSchedule, 
                date: newDateString, 
                commandStaff: newCommandStaff 
            };
            
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            
            return newSchedule;
        });
    }, [displayDate, commandPersonnel, loadGuardLineFromRoster]);
    
    const handleUpdateCommandStaff = useCallback((updatedStaff, isAutoUpdate = false) => {
        if (!isAutoUpdate) {
            let personnelListWasUpdated = false;
            const newPersonnelList = [...commandPersonnel];
            updatedStaff.forEach(officer => {
                if (officer.id && officer.name && officer.rank) {
                    const personnelIndex = newPersonnelList.findIndex(p => p.id === officer.id);
                    if (personnelIndex !== -1) {
                        if (newPersonnelList[personnelIndex].rank !== officer.rank || newPersonnelList[personnelIndex].name !== officer.name) {
                            newPersonnelList[personnelIndex] = { ...newPersonnelList[personnelIndex], rank: officer.rank, name: officer.name };
                            personnelListWasUpdated = true;
                        }
                    } else if (officer.name !== 'A designar' && officer.name !== 'No Asignado') {
                      newPersonnelList.push({ id: officer.id, name: officer.name, rank: officer.rank });
                      personnelListWasUpdated = true;
                    }
                }
            });
            if (personnelListWasUpdated) {
                updateAndSaveCommandPersonnel(newPersonnelList);
            }
        }
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const newSchedule = { ...prevSchedule, commandStaff: updatedStaff };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            return newSchedule;
        });
    }, [commandPersonnel]);


    const handleFileImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const importMode = prompt("Elige el modo de importación:\n\n1. Añadir\n2. Reemplazar\n\nEscribe '1' o '2'.");
        if (importMode !== '1' && importMode !== '2') {
            alert("Importación cancelada.");
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        try {
            let newServices = [];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const fileBuffer = await file.arrayBuffer();
            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                const servicesMap = new Map();
                json.forEach((row) => {
                    const serviceTitle = row['Título del Servicio']?.trim();
                    if (!serviceTitle) return;
                    if (!servicesMap.has(serviceTitle)) {
                        servicesMap.set(serviceTitle, { id: `imported-excel-${Date.now()}-${servicesMap.size}`, title: serviceTitle, description: row['Descripción del Servicio'] || '', novelty: row['Novedad del Servicio'] || '', isHidden: false, assignments: [] });
                    }
                    const service = servicesMap.get(serviceTitle);
                    const location = row['Ubicación de Asignación'], time = row['Horario de Asignación'], personnel = row['Personal de Asignación'];
                    if (location && time && personnel) {
                        const allDetailsRaw = row['Detalles de Asignación'] ? String(row['Detalles de Asignación']).split(/;|\n/g).map(d => d.trim()).filter(d => d) : [];
                        const implementationTimeValue = allDetailsRaw.find(d => d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));
                        const otherDetails = allDetailsRaw.filter(d => !d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));
                        service.assignments.push({ id: `imported-assign-${Date.now()}-${service.assignments.length}`, location: String(location), time: String(time), personnel: String(personnel), unit: row['Unidad de Asignación'] ? String(row['Unidad de Asignación']) : undefined, implementationTime: implementationTimeValue, details: otherDetails });
                    }
                });
                newServices = Array.from(servicesMap.values());
            } else if (fileExtension === 'docx') {
                 newServices = await parseServicesFromWord(fileBuffer);
            } else {
                alert("Formato de archivo no soportado."); return;
            }
            if (newServices.length === 0) { alert("No se encontraron servicios válidos en el archivo."); return; }
            
            setSchedule(prevSchedule => {
                if (!prevSchedule) return null;
                const importedSportsEvents = newServices.filter(s => s.title.toUpperCase().includes('EVENTO DEPORTIVO'));
                const importedCommonServices = newServices.filter(s => !s.title.toUpperCase().includes('EVENTO DEPORTIVO'));
                let newSchedule = { ...prevSchedule };
                if (importMode === '1') { // Add
                    newSchedule.services = [...prevSchedule.services.filter(s => !s.isHidden), ...importedCommonServices, ...prevSchedule.services.filter(s => s.isHidden)];
                    newSchedule.sportsEvents = [...prevSchedule.sportsEvents.filter(s => !s.isHidden), ...importedSportsEvents, ...prevSchedule.sportsEvents.filter(s => s.isHidden)];
                    alert(`${newServices.length} servicio(s) importado(s) y añadidos con éxito.`);
                } else { // Replace
                    newSchedule.services = importedCommonServices;
                    newSchedule.sportsEvents = importedSportsEvents;
                    alert(`El horario ha sido reemplazado. ${newServices.length} servicio(s) importado(s) con éxito.`);
                }
                localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
                return newSchedule;
            });
        } catch (error) {
            console.error("Error al importar el archivo:", error); alert("Hubo un error al procesar el archivo.");
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRosterImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (window.confirm("¿Deseas fusionar los datos de este archivo con el rol de guardia actual?")) {
            try {
                const newRosterData = JSON.parse(await file.text());
                if (typeof newRosterData !== 'object' || newRosterData === null || Array.isArray(newRosterData)) throw new Error("Invalid JSON format.");
                updateAndSaveRoster({ ...roster, ...newRosterData });
                alert("Rol de guardia actualizado con éxito.");
            } catch (error) { console.error("Error al importar el rol de guardia:", error); alert("Hubo un error al procesar el archivo."); }
        }
        if(rosterInputRef.current) rosterInputRef.current.value = '';
    };

    const handleSaveAsTemplate = (service) => {
        const newTemplate = { ...JSON.parse(JSON.stringify(service)), templateId: `template-${Date.now()}` };
        updateAndSaveTemplates([...serviceTemplates, newTemplate]);
        showToast(`Servicio "${service.title}" guardado como plantilla.`);
    };

    const handleSelectTemplate = (template, { mode, serviceType, serviceToReplaceId }) => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const listKey = serviceType === 'common' ? 'services' : 'sportsEvents';
            let newSchedule = { ...prevSchedule };
            if (mode === 'add') {
                const newService = { ...JSON.parse(JSON.stringify(template)), id: `service-from-template-${Date.now()}` };
                delete newService.templateId;
                const list = [...newSchedule[listKey]];
                const firstHiddenIndex = list.findIndex(s => s.isHidden);
                const insertIndex = firstHiddenIndex === -1 ? list.length : firstHiddenIndex;
                list.splice(insertIndex, 0, newService);
                newSchedule[listKey] = list;
                showToast(`Servicio "${template.title}" añadido desde plantilla.`);
            } else if (mode === 'replace' && serviceToReplaceId) {
                newSchedule[listKey] = newSchedule[listKey].map((s) => {
                    if (s.id === serviceToReplaceId) {
                        const updatedService = { ...JSON.parse(JSON.stringify(template)), id: s.id };
                        delete updatedService.templateId;
                        return updatedService;
                    }
                    return s;
                });
                showToast(`Servicio reemplazado con plantilla "${template.title}".`);
            }
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            setIsTemplateModalOpen(false);
            return newSchedule;
        });
    };

    const handleDeleteTemplate = (templateId) => {
        const newTemplates = serviceTemplates.filter(t => t.templateId !== templateId)
        updateAndSaveTemplates(newTemplates);
    };

    const handleExportAsTemplate = (format) => {
        if (!schedule) return;
        if (format === 'excel') exportScheduleAsExcelTemplate(schedule);
        else exportScheduleAsWordTemplate(schedule);
        setIsExportTemplateModalOpen(false);
    };

    const handleResetData = () => {
        if (window.confirm("¿Estás seguro de que quieres reiniciar todos los datos?")) {
          localStorage.clear();
          location.reload();
        }
    };

    const getAssignmentsByTime = useMemo(() => {
        if (!schedule) return {};
        const grouped = {};
        [...schedule.services, ...schedule.sportsEvents].filter(s => !s.isHidden).forEach(service => {
          service.assignments.forEach(assignment => {
            const timeKey = assignment.time;
            if (!grouped[timeKey]) grouped[timeKey] = [];
            grouped[timeKey].push({ ...assignment, serviceTitle: service.title, novelty: service.novelty });
          });
        });
        return grouped;
    }, [schedule]);
    
    const openTemplateModal = (props) => {
        setTemplateModalProps(props);
        setIsTemplateModalOpen(true);
    };

    const visibilityAction = useMemo(() => {
        if (selectedServiceIds.size === 0 || !schedule) return { action: 'none', label: '' };
        const firstSelected = [...schedule.services, ...schedule.sportsEvents].find(s => selectedServiceIds.has(s.id));
        if (firstSelected?.isHidden) return { action: 'show', label: 'Mostrar Seleccionados' };
        return { action: 'hide', label: 'Ocultar Seleccionados' };
    }, [selectedServiceIds, schedule]);

    const renderContent = () => {
        if (!schedule || !displayDate) return null;
        switch (view) {
            case 'schedule':
                return React.createElement(ScheduleDisplay, {
                    schedule: schedule, displayDate: displayDate, selectedServiceIds: selectedServiceIds, commandPersonnel: commandPersonnel, servicePersonnel: servicePersonnel, unitList: unitList,
                    onDateChange: handleDateChange, onUpdateService: handleUpdateService, onUpdateCommandStaff: handleUpdateCommandStaff, onAddNewService: handleAddNewService, onMoveService: handleMoveService, onToggleServiceSelection: handleToggleServiceSelection, onSelectAllServices: handleSelectAllServices, onSaveAsTemplate: handleSaveAsTemplate, onReplaceFromTemplate: (serviceId, type) => openTemplateModal({ mode: 'replace', serviceType: type, serviceToReplaceId: serviceId }), onImportGuardLine: () => handleUpdateCommandStaff(loadGuardLineFromRoster(displayDate, schedule.commandStaff, commandPersonnel), true)
                });
            case 'time-grouped':
                return React.createElement(TimeGroupedScheduleDisplay, { assignmentsByTime: getAssignmentsByTime, onAssignmentStatusChange: handleAssignmentStatusChange });
            case 'nomenclador':
                return React.createElement(Nomenclador, {
                    commandPersonnel: commandPersonnel, servicePersonnel: servicePersonnel, units: unitList, roster: roster,
                    onAddCommandPersonnel: (item) => updateAndSaveCommandPersonnel([...commandPersonnel, item]), onUpdateCommandPersonnel: (item) => updateAndSaveCommandPersonnel(commandPersonnel.map(p => p.id === item.id ? item : p)), onRemoveCommandPersonnel: (item) => updateAndSaveCommandPersonnel(commandPersonnel.filter(p => p.id !== item.id)),
                    onAddServicePersonnel: (item) => updateAndSaveServicePersonnel([...servicePersonnel, item]), onUpdateServicePersonnel: (item) => updateAndSaveServicePersonnel(servicePersonnel.map(p => p.id === item.id ? item : p)), onRemoveServicePersonnel: (item) => updateAndSaveServicePersonnel(servicePersonnel.filter(p => p.id !== item.id)),
                    onUpdateUnits: updateAndSaveUnits, onUpdateRoster: updateAndSaveRoster
                 });
            default:
                return null;
        }
    };

    const getButtonClass = (buttonView) => `flex items-center gap-2 px-4 py-2 rounded-md transition-colors font-medium ${view === buttonView ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`;
    
    if (!schedule || !displayDate) {
        return React.createElement("div", { className: "bg-gray-900 text-white min-h-screen flex justify-center items-center" }, React.createElement("div", { className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" }));
    }

    return (
        React.createElement("div", { className: "bg-gray-900 text-white min-h-screen font-sans" },
            React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileImport, style: { display: 'none' }, accept: ".xlsx,.xls,.docx" }),
            React.createElement("input", { type: "file", ref: rosterInputRef, onChange: handleRosterImport, style: { display: 'none' }, accept: ".json" }),
            React.createElement("header", { className: "bg-gray-800/80 backdrop-blur-sm sticky top-0 z-40 shadow-lg" },
                React.createElement("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8" },
                    React.createElement("div", { className: "flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 py-4 sm:py-0" },
                        React.createElement("div", { className: "flex items-center mb-4 sm:mb-0" },
                            React.createElement("button", { onClick: handleResetData, className: "mr-2 text-gray-400 hover:text-white transition-colors", "aria-label": "Reiniciar Datos" }, React.createElement(RefreshIcon, { className: "w-6 h-6" })),
                            React.createElement("button", { onClick: () => setIsHelpModalOpen(true), className: "mr-4 text-gray-400 hover:text-white transition-colors", "aria-label": "Ayuda" }, React.createElement(QuestionMarkCircleIcon, { className: "w-6 h-6" })),
                            React.createElement(CalendarIcon, { className: "w-10 h-10 text-blue-400 mr-3" }),
                            React.createElement("div", null,
                                React.createElement("h1", { className: "text-xl sm:text-2xl font-bold tracking-tight" }, "Servicios del Cuerpo de Bomberos de la Ciudad"),
                                React.createElement("p", { className: "text-xs text-gray-400" }, "Planificador de Guardia")
                            )
                        ),
                        React.createElement("div", { className: "flex flex-wrap items-center justify-end gap-2" },
                            React.createElement("button", { className: getButtonClass('schedule'), onClick: () => setView('schedule') }, React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), " Vista General"),
                            React.createElement("button", { className: getButtonClass('time-grouped'), onClick: () => setView('time-grouped') }, React.createElement(ClockIcon, { className: "w-5 h-5" }), " Vista por Hora"),
                            React.createElement("button", { className: getButtonClass('nomenclador'), onClick: () => setView('nomenclador') }, React.createElement(BookOpenIcon, { className: "w-5 h-5" }), " Nomencladores"),
                            React.createElement("button", { onClick: () => openTemplateModal({ mode: 'add', serviceType: 'common' }), className: "flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors" }, React.createElement(BookmarkIcon, { className: "w-5 h-5" }), " Añadir desde Plantilla"),
                            
                            React.createElement("div", { className: "relative", ref: importMenuRef },
                                React.createElement("button", { onClick: () => setImportMenuOpen(prev => !prev), className: 'flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors' },
                                    React.createElement(UploadIcon, { className: 'w-5 h-5' }),
                                    React.createElement("span", null, "Importar"),
                                    React.createElement(ChevronDownIcon, { className: `w-4 h-4 transition-transform duration-200 ${isImportMenuOpen ? 'rotate-180' : ''}` })
                                ),
                                isImportMenuOpen && React.createElement("div", { className: "absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50 animate-scale-in" },
                                    React.createElement("div", { className: "py-1", role: "menu", "aria-orientation": "vertical", "aria-labelledby": "options-menu" },
                                        React.createElement("a", { href: "#", onClick: (e) => { e.preventDefault(); setIsRosterModalOpen(true); setImportMenuOpen(false); }, className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full text-left", role: "menuitem" }, 
                                            React.createElement(UploadIcon, { className: 'w-4 h-4' }), " Importar Rol"),
                                        React.createElement("a", { href: "#", onClick: (e) => { e.preventDefault(); fileInputRef.current?.click(); setImportMenuOpen(false); }, className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full text-left", role: "menuitem" }, 
                                            React.createElement(UploadIcon, { className: 'w-4 h-4' }), " Importar Servicios")
                                    )
                                )
                            ),

                            React.createElement("div", { className: "relative", ref: exportMenuRef },
                                React.createElement("button", { onClick: () => setExportMenuOpen(prev => !prev), className: 'flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium transition-colors' },
                                    React.createElement(DownloadIcon, { className: 'w-5 h-5' }),
                                    React.createElement("span", null, "Exportar"),
                                    React.createElement(ChevronDownIcon, { className: `w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}` })
                                ),
                                isExportMenuOpen && React.createElement("div", { className: "absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50 animate-scale-in" },
                                    React.createElement("div", { className: "py-1", role: "menu", "aria-orientation": "vertical", "aria-labelledby": "options-menu" },
                                        React.createElement("a", { href: "#", onClick: (e) => { e.preventDefault(); exportScheduleToWord({ ...schedule, date: displayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() }); setExportMenuOpen(false); }, className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full text-left", role: "menuitem" }, 
                                            React.createElement(DownloadIcon, { className: 'w-4 h-4' }), " Exportar General"),
                                        React.createElement("a", { href: "#", onClick: (e) => { e.preventDefault(); exportScheduleByTimeToWord({ date: displayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), assignmentsByTime: getAssignmentsByTime }); setExportMenuOpen(false); }, className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full text-left", role: "menuitem" }, 
                                            React.createElement(DownloadIcon, { className: 'w-4 h-4' }), " Exportar por Hora"),
                                        React.createElement("a", { href: "#", onClick: (e) => { e.preventDefault(); setIsExportTemplateModalOpen(true); setExportMenuOpen(false); }, className: "flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full text-left", role: "menuitem" }, 
                                            React.createElement(DownloadIcon, { className: 'w-4 h-4' }), " Exportar Plantilla")
                                    )
                                )
                            ),
                            
                            selectedServiceIds.size > 0 && view === 'schedule' && (
                                React.createElement("button", { onClick: handleToggleVisibilityForSelected, className: `flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium transition-colors animate-fade-in ${visibilityAction.action === 'hide' ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'}` },
                                    visibilityAction.action === 'hide' ? React.createElement(EyeOffIcon, { className: "w-5 h-5" }) : React.createElement(EyeIcon, { className: "w-5 h-5" }),
                                    `${visibilityAction.label} (${selectedServiceIds.size})`
                                )
                            )
                        )
                    )
                )
            ),
            React.createElement("main", { className: "container mx-auto p-4 sm:p-6 lg:p-8" },
                renderContent()
            ),
            isHelpModalOpen && React.createElement(HelpModal, { isOpen: isHelpModalOpen, onClose: () => setIsHelpModalOpen(false), unitList: unitList }),
            isRosterModalOpen && React.createElement(RosterImportModal, { isOpen: isRosterModalOpen, onClose: () => setIsRosterModalOpen(false), onConfirm: () => rosterInputRef.current?.click() }),
            isTemplateModalOpen && React.createElement(ServiceTemplateModal, { isOpen: isTemplateModalOpen, onClose: () => setIsTemplateModalOpen(false), templates: serviceTemplates, onSelectTemplate: (template) => handleSelectTemplate(template, templateModalProps), onDeleteTemplate: handleDeleteTemplate }),
            isExportTemplateModalOpen && React.createElement(ExportTemplateModal, { isOpen: isExportTemplateModalOpen, onClose: () => setIsExportTemplateModalOpen(false), onExport: handleExportAsTemplate })
        )
    );
}

export default App;