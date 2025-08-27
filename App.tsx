

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { rankOrder, Schedule, Personnel, Rank, Roster, Service, Officer, ServiceTemplate, Assignment, UnitReportData, EraData, GeneratorData } from './types.ts';
import { scheduleData as preloadedScheduleData } from './data/scheduleData.ts';
import { unitReportData as preloadedUnitReportData } from './data/unitReportData.ts';
import { eraData as preloadedEraData } from './data/eraData.ts';
import { generatorData as preloadedGeneratorData } from './data/generatorData.ts';
import { rosterData as preloadedRosterData } from './data/rosterData.ts';
import { commandPersonnelData as defaultCommandPersonnel } from './data/commandPersonnelData.ts';
import { servicePersonnelData as defaultServicePersonnel } from './data/servicePersonnelData.ts';
import { defaultUnits } from './data/unitData.ts';
import { defaultServiceTemplates } from './data/serviceTemplates.ts';
import { exportScheduleToWord, exportScheduleByTimeToWord, exportScheduleAsExcelTemplate, exportScheduleAsWordTemplate } from './services/exportService.ts';
import { parseScheduleFromFile, parseUnitReportFromExcel } from './services/wordImportService.ts';
import ScheduleDisplay from './components/ScheduleDisplay.tsx';
import TimeGroupedScheduleDisplay from './components/TimeGroupedScheduleDisplay.tsx';
import Nomenclador from './components/Nomenclador.tsx';
import UnitReportDisplay from './components/UnitReportDisplay.tsx';
import UnitStatusView from './components/UnitStatusView.tsx';
import CommandPostView from './components/CommandPostView.tsx';
import EraReportDisplay from './components/EraReportDisplay.tsx';
import GeneratorReportDisplay from './components/GeneratorReportDisplay.tsx';
import { BookOpenIcon, DownloadIcon, ClockIcon, ClipboardListIcon, RefreshIcon, EyeIcon, EyeOffIcon, UploadIcon, QuestionMarkCircleIcon, BookmarkIcon, ChevronDownIcon, FireIcon, FilterIcon, AnnotationIcon, LightningBoltIcon } from './components/icons.tsx';
import HelpModal from './components/HelpModal.tsx';
import RosterImportModal from './components/RosterImportModal.tsx';
import ServiceTemplateModal from './components/ServiceTemplateModal.tsx';
import ExportTemplateModal from './components/ExportTemplateModal.tsx';

const parseDateFromString = (dateString: string): Date => {
    const cleanedDateString = dateString.replace(/GUARDIA DEL DIA/i, '').replace('.-', '').trim();
    const monthNames: { [key: string]: number } = { "ENERO": 0, "FEBRERO": 1, "MARZO": 2, "ABRIL": 3, "MAYO": 4, "JUNIO": 5, "JULIO": 6, "AGOSTO": 7, "SEPTIEMBRE": 8, "OCTUBRE": 9, "NOVIEMBRE": 10, "DICIEMBRE": 11 };
    const parts = cleanedDateString.split(/DE\s/i);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = monthNames[parts[1].toUpperCase().trim()];
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day);
    }
    console.warn("Could not parse date from string:", dateString);
    return new Date();
};


const App: React.FC = () => {
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [unitReport, setUnitReport] = useState<UnitReportData | null>(null);
    const [eraReport, setEraReport] = useState<EraData | null>(null);
    const [generatorReport, setGeneratorReport] = useState<GeneratorData | null>(null);
    const [view, setView] = useState('unit-report'); // Default to new view
    const [displayDate, setDisplayDate] = useState<Date | null>(null);
    const [commandPersonnel, setCommandPersonnel] = useState<Personnel[]>([]);
    const [servicePersonnel, setServicePersonnel] = useState<Personnel[]>([]);
    const [unitList, setUnitList] = useState<string[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState(new Set<string>());
    const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
    const [roster, setRoster] = useState<Roster>({});
    const [searchTerm, setSearchTerm] = useState('');

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateModalProps, setTemplateModalProps] = useState<any>({});
    const [isExportTemplateModalOpen, setIsExportTemplateModalOpen] = useState(false);
    const [isImportMenuOpen, setImportMenuOpen] = useState(false);
    const [isExportMenuOpen, setExportMenuOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const unitReportFileInputRef = useRef<HTMLInputElement>(null);
    const rosterInputRef = useRef<HTMLInputElement>(null);
    const importMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isImportMenuOpen && importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
                setImportMenuOpen(false);
            }
            if (isExportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setExportMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isImportMenuOpen, isExportMenuOpen]);

    const showToast = (message: string) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-24 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    const loadGuardLineFromRoster = useCallback((dateToLoad: Date, currentStaff: Officer[], currentCommandPersonnel: Personnel[]) => {
        if (!dateToLoad || !roster) return currentStaff;
        const dateKey = `${dateToLoad.getFullYear()}-${String(dateToLoad.getMonth() + 1).padStart(2, '0')}-${String(dateToLoad.getDate()).padStart(2, '0')}`;
        const dayRoster = roster[dateKey];
        const rolesMap = [
            { key: 'jefeInspecciones', label: 'JEFE DE INSPECCIONES' },
            { key: 'jefeServicio', label: 'JEFE DE SERVICIO' },
            { key: 'jefeGuardia', label: 'JEFE DE GUARDIA' },
            { key: 'jefeReserva', label: 'JEFE DE RESERVA' }
        ];
        const finalStaff: Officer[] = rolesMap.map(roleInfo => {
           const personName = dayRoster?.[roleInfo.key as keyof typeof dayRoster];
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
        // Load schedule data
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
            dataCopy.sportsEvents = dataCopy.services.filter((s: Service) => s.title.toUpperCase().includes('EVENTO DEPORTIVO'));
            dataCopy.services = dataCopy.services.filter((s: Service) => !s.title.toUpperCase().includes('EVENTO DEPORTIVO'));
        } else if (!dataCopy.services) dataCopy.services = [];
        if (!dataCopy.sportsEvents) dataCopy.sportsEvents = [];

        let idCounter = 0;
        const processServices = (services: Service[]) => {
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
        (dataCopy.commandStaff || []).forEach((officer: Officer) => { if (!officer.id) officer.id = `officer-hydrated-${Date.now()}-${idCounter++}`; });
          
        const loadedDate = parseDateFromString(dataCopy.date);
        setDisplayDate(loadedDate);
          
        const loadedCommandPersonnel = JSON.parse(localStorage.getItem('commandPersonnel') || JSON.stringify(defaultCommandPersonnel));
        const loadedRoster = JSON.parse(localStorage.getItem('rosterData') || JSON.stringify(preloadedRosterData));
        
        let unitReportToLoad;
        try {
            const savedUnitReportJSON = localStorage.getItem('unitReportData');
            unitReportToLoad = savedUnitReportJSON ? JSON.parse(savedUnitReportJSON) : preloadedUnitReportData;
        } catch (e) {
            console.error("Failed to load or parse unit report data, falling back to default.", e);
            unitReportToLoad = preloadedUnitReportData;
        }

        let eraReportToLoad;
        try {
            const savedEraReportJSON = localStorage.getItem('eraReportData');
            eraReportToLoad = savedEraReportJSON ? JSON.parse(savedEraReportJSON) : preloadedEraData;
        } catch(e) {
            console.error("Failed to load or parse ERA report data, falling back to default.", e);
            eraReportToLoad = preloadedEraData;
        }
        
        let generatorReportToLoad;
        try {
            const savedGeneratorReportJSON = localStorage.getItem('generatorReportData');
            generatorReportToLoad = savedGeneratorReportJSON ? JSON.parse(savedGeneratorReportJSON) : preloadedGeneratorData;
        } catch(e) {
            console.error("Failed to load or parse Generator report data, falling back to default.", e);
            generatorReportToLoad = preloadedGeneratorData;
        }
          
        setSchedule(dataCopy);
        setUnitReport(unitReportToLoad);
        setEraReport(eraReportToLoad);
        setGeneratorReport(generatorReportToLoad);
        setCommandPersonnel(loadedCommandPersonnel);
        setServicePersonnel(JSON.parse(localStorage.getItem('servicePersonnel') || JSON.stringify(defaultServicePersonnel)));

        const nomencladorUnits: string[] = JSON.parse(localStorage.getItem('unitList') || JSON.stringify(defaultUnits));
        const reportUnits: string[] = unitReportToLoad.zones.flatMap((zone: any) =>
            zone.groups.flatMap((group: any) => group.units.map((unit: any) => unit.id))
        );
        const combinedUnits = [...new Set([...nomencladorUnits, ...reportUnits])];
        combinedUnits.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setUnitList(combinedUnits);
        
        setServiceTemplates(JSON.parse(localStorage.getItem('serviceTemplates') || JSON.stringify(defaultServiceTemplates)));
        setRoster(loadedRoster);
    }, []);

    const sortPersonnel = (a: Personnel, b: Personnel) => {
        const rankComparison = (rankOrder[a.rank] || 99) - (rankOrder[b.rank] || 99);
        return rankComparison !== 0 ? rankComparison : a.name.localeCompare(b.name);
    };

    const updateAndSaveCommandPersonnel = (newList: Personnel[]) => {
        const sortedList = newList.sort(sortPersonnel);
        localStorage.setItem('commandPersonnel', JSON.stringify(sortedList));
        setCommandPersonnel(sortedList);
    };

    const updateAndSaveServicePersonnel = (newList: Personnel[]) => {
        const sortedList = newList.sort(sortPersonnel);
        localStorage.setItem('servicePersonnel', JSON.stringify(sortedList));
        setServicePersonnel(sortedList);
    };

    const updateAndSaveUnits = (newList: string[]) => {
        localStorage.setItem('unitList', JSON.stringify(newList));
        setUnitList(newList);
    };

    const updateAndSaveRoster = (newRoster: Roster) => {
        localStorage.setItem('rosterData', JSON.stringify(newRoster));
        setRoster(newRoster);
    };
    
    const updateAndSaveTemplates = (templates: ServiceTemplate[]) => {
        localStorage.setItem('serviceTemplates', JSON.stringify(templates));
        setServiceTemplates(templates);
    };
    
    const handleUpdateUnitReport = (updatedData: UnitReportData) => {
        localStorage.setItem('unitReportData', JSON.stringify(updatedData));
        setUnitReport(updatedData);
    };

    const handleUpdateEraReport = (updatedData: EraData) => {
        localStorage.setItem('eraReportData', JSON.stringify(updatedData));
        setEraReport(updatedData);
    };

    const handleUpdateGeneratorReport = (updatedData: GeneratorData) => {
        localStorage.setItem('generatorReportData', JSON.stringify(updatedData));
        setGeneratorReport(updatedData);
    };

    const handleUpdateService = (updatedService: Service, type: 'common' | 'sports') => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const key = type === 'common' ? 'services' : 'sportsEvents';
            const newSchedule = { ...prevSchedule, [key]: prevSchedule[key].map(s => s.id === updatedService.id ? updatedService : s) };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            return newSchedule;
        });
    };

    const handleAddNewService = (type: 'common' | 'sports') => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const key = type === 'common' ? 'services' : 'sportsEvents';
            const newService: Service = {
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

    const handleMoveService = (serviceId: string, direction: 'up' | 'down', type: 'common' | 'sports') => {
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

    const handleDeleteService = (serviceId: string, type: 'common' | 'sports') => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;

            const listKey = type === 'common' ? 'services' : 'sportsEvents';
            const serviceToDelete = prevSchedule[listKey].find(s => s.id === serviceId);

            if (!serviceToDelete) return prevSchedule;

            if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${serviceToDelete.title}"? Esta acción no se puede deshacer.`)) {
                const newSchedule = {
                    ...prevSchedule,
                    [listKey]: prevSchedule[listKey].filter(s => s.id !== serviceId),
                };
                localStorage.setItem('scheduleData', JSON.stringify(newSchedule));

                setSelectedServiceIds(currentIds => {
                    const newIds = new Set(currentIds);
                    newIds.delete(serviceId);
                    return newIds;
                });
                
                showToast(`Servicio "${serviceToDelete.title}" eliminado.`);
                return newSchedule;
            }
            return prevSchedule;
        });
    };

    const handleToggleServiceSelection = (serviceId: string) => {
        const newSelection = new Set(selectedServiceIds);
        if (newSelection.has(serviceId)) newSelection.delete(serviceId);
        else newSelection.add(serviceId);
        setSelectedServiceIds(newSelection);
    };
    
    const serviceMatches = (service: Service, term: string): boolean => {
        if (!term) return true;
        if (service.title?.toLowerCase().includes(term)) return true;
        if (service.description?.toLowerCase().includes(term)) return true;
        if (service.novelty?.toLowerCase().includes(term)) return true;
    
        for (const assignment of service.assignments) {
            if (assignment.location?.toLowerCase().includes(term)) return true;
            if (assignment.personnel?.toLowerCase().includes(term)) return true;
            if (assignment.unit?.toLowerCase().includes(term)) return true;
            if (assignment.details?.join(' ').toLowerCase().includes(term)) return true;
        }
        return false;
    };

    const filteredSchedule = useMemo(() => {
        if (!schedule) return null;
        if (!searchTerm) return schedule;
    
        const lowercasedFilter = searchTerm.toLowerCase();
    
        const filteredServices = schedule.services.filter(s => serviceMatches(s, lowercasedFilter));
        const filteredSportsEvents = schedule.sportsEvents.filter(s => serviceMatches(s, lowercasedFilter));
        
        return { ...schedule, services: filteredServices, sportsEvents: filteredSportsEvents };
    }, [schedule, searchTerm]);


    const handleSelectAllServices = (selectAll: boolean) => {
        if (!filteredSchedule) return;

        const visibleFilteredIds = [...filteredSchedule.services, ...filteredSchedule.sportsEvents]
            .filter(s => !s.isHidden)
            .map(s => s.id);

        const newSelection = new Set(selectedServiceIds);

        if (selectAll) {
            visibleFilteredIds.forEach(id => newSelection.add(id));
        } else {
            visibleFilteredIds.forEach(id => newSelection.delete(id));
        }
        setSelectedServiceIds(newSelection);
    };

    const handleToggleVisibilityForSelected = () => {
        if (selectedServiceIds.size === 0) return;
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const allServices = [...prevSchedule.services, ...prevSchedule.sportsEvents];
            const firstSelected = allServices.find(s => selectedServiceIds.has(s.id));
            if (!firstSelected) return prevSchedule;
            
            const newVisibility = !firstSelected.isHidden;
            const updateVisibility = (services: Service[]) => services.map(s => selectedServiceIds.has(s.id) ? { ...s, isHidden: newVisibility } : s).sort((a, b) => (a.isHidden ? 1 : 0) - (b.isHidden ? 1 : 0));
            
            const newSchedule = { ...prevSchedule, services: updateVisibility(prevSchedule.services), sportsEvents: updateVisibility(prevSchedule.sportsEvents) };
            localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
            
            setSelectedServiceIds(new Set()); // Clear selection after action
            
            return newSchedule;
        });
    };

    const handleAssignmentStatusChange = (assignmentId: string, statusUpdate: { inService?: boolean; serviceEnded?: boolean }) => {
        setSchedule(prevSchedule => {
            if (!prevSchedule) return null;
            const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
            const allServices = [...newSchedule.services, ...newSchedule.sportsEvents];
            for (const service of allServices) {
                const assignment = service.assignments.find((a: any) => a.id === assignmentId);
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
    
    const handleDateChange = (part: 'day' | 'month' | 'year', value: number) => {
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

            const newDate = new Date(year, month, day);

            setSchedule(prevSchedule => {
                if (!prevSchedule) return prevSchedule;
        
                const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                const newDateString = `${newDate.getDate()} DE ${monthNames[newDate.getMonth()]} DE ${newDate.getFullYear()}`;
                const newCommandStaff = loadGuardLineFromRoster(newDate, prevSchedule.commandStaff, commandPersonnel);
                
                const newSchedule = { 
                    ...prevSchedule, 
                    date: newDateString, 
                    commandStaff: newCommandStaff 
                };
                
                localStorage.setItem('scheduleData', JSON.stringify(newSchedule));
                
                return newSchedule;
            });

            return newDate;
        });
    };

    const handleUpdateCommandStaff = useCallback((updatedStaff: Officer[], isAutoUpdate = false) => {
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


    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const importMode = prompt("Elige el modo de importación:\n\n1. Añadir\n2. Reemplazar\n\nEscribe '1' o '2'.");
        if (importMode !== '1' && importMode !== '2') {
            alert("Importación cancelada.");
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        try {
            const fileBuffer = await file.arrayBuffer();
            const importedData = await parseScheduleFromFile(fileBuffer, file.name);

            if (!importedData || (!importedData.services?.length && !importedData.sportsEvents?.length)) {
                alert("No se encontraron servicios válidos en el archivo o el formato no es reconocido.");
                return;
            }
            
            const { services: newServices = [], sportsEvents: newSportsEvents = [] } = importedData;
            
            setSchedule(prevSchedule => {
                if (!prevSchedule) return null;
                let newSchedule = JSON.parse(JSON.stringify(prevSchedule));

                if (importMode === '1') { // Add
                    const now = Date.now();
                    let counter = 0;
                    const reIdService = (service: Service): Service => ({
                        ...service,
                        id: `imported-add-${now}-${counter++}`,
                        assignments: service.assignments.map(assignment => ({
                            ...assignment,
                            id: `imported-add-assign-${now}-${counter++}`
                        }))
                    });

                    const uniqueNewServices = newServices.map(reIdService);
                    const uniqueNewSportsEvents = newSportsEvents.map(reIdService);

                    newSchedule.services = [...prevSchedule.services, ...uniqueNewServices];
                    newSchedule.sportsEvents = [...prevSchedule.sportsEvents, ...uniqueNewSportsEvents];
                    alert(`${newServices.length + newSportsEvents.length} servicio(s) importado(s) y añadidos con éxito.`);
                } else { // Replace
                    if (importedData.date) newSchedule.date = importedData.date;
                    if (importedData.commandStaff) newSchedule.commandStaff = importedData.commandStaff;
                    newSchedule.services = newServices;
                    newSchedule.sportsEvents = newSportsEvents;
                    
                    if(importedData.date) {
                        const newDisplayDate = parseDateFromString(importedData.date);
                        setDisplayDate(newDisplayDate);
                    }
                    alert(`El horario ha sido reemplazado. ${newServices.length + newSportsEvents.length} servicio(s) importado(s) con éxito.`);
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

    const handleUnitReportImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !unitReport) return;
        try {
            const fileBuffer = await file.arrayBuffer();
            const importedData = parseUnitReportFromExcel(fileBuffer);

            if (importedData) {
                const { stationName, units } = importedData;
                
                const reportCopy = JSON.parse(JSON.stringify(unitReport));
                let stationUpdated = false;

                for (const zone of reportCopy.zones) {
                    const group = zone.groups.find((g: any) => g.name.toUpperCase() === stationName.toUpperCase());
                    if (group) {
                        group.units = units;
                        stationUpdated = true;
                        break;
                    }
                }
                
                if (stationUpdated) {
                    handleUpdateUnitReport(reportCopy);
                    showToast(`Reporte de unidades para "${stationName}" importado con éxito.`);
                } else {
                    alert(`No se encontró la estación "${stationName}" en el reporte actual.`);
                }
            } else {
                alert("No se pudo procesar el archivo Excel. Verifique el formato.");
            }
        } catch (error) {
            console.error("Error al importar el reporte de unidades:", error);
            alert("Hubo un error al procesar el archivo Excel.");
        } finally {
            if (unitReportFileInputRef.current) unitReportFileInputRef.current.value = '';
        }
    };

    const handleRosterImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    const handleSaveAsTemplate = (service: Service) => {
        const newTemplate: ServiceTemplate = { ...JSON.parse(JSON.stringify(service)), templateId: `template-${Date.now()}` };
        updateAndSaveTemplates([...serviceTemplates, newTemplate]);
        showToast(`Servicio "${service.title}" guardado como plantilla.`);
    };

    const handleSelectTemplate = (template: ServiceTemplate, { mode, serviceType, serviceToReplaceId }: { mode: 'add' | 'replace', serviceType: 'common' | 'sports', serviceToReplaceId?: string }) => {
        setSchedule((prevSchedule: Schedule | null) => {
            if (!prevSchedule) return null;
            const listKey = serviceType === 'common' ? 'services' : 'sportsEvents';
            let newSchedule: Schedule = { ...prevSchedule };

            if (mode === 'add') {
                const newService: Service = { ...JSON.parse(JSON.stringify(template)), id: `service-from-template-${Date.now()}` };
                delete (newService as any).templateId;
                const list = [...newSchedule[listKey]];
                const firstHiddenIndex = list.findIndex(s => s.isHidden);
                const insertIndex = firstHiddenIndex === -1 ? list.length : firstHiddenIndex;
                list.splice(insertIndex, 0, newService);
                newSchedule[listKey] = list;
                showToast(`Servicio "${template.title}" añadido desde plantilla.`);
            } else if (mode === 'replace' && serviceToReplaceId) {
                newSchedule[listKey] = newSchedule[listKey].map((s: Service) => {
                    if (s.id === serviceToReplaceId) {
                        const updatedService: Service = { ...JSON.parse(JSON.stringify(template)), id: s.id };
                        delete (updatedService as any).templateId;
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

    const handleDeleteTemplate = (templateId: string) => {
        const newTemplates = serviceTemplates.filter(t => t.templateId !== templateId)
        updateAndSaveTemplates(newTemplates);
    };

    const handleExportAsTemplate = (format: 'excel' | 'word') => {
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
        if (!filteredSchedule) return {};
        const grouped: { [time: string]: Assignment[] } = {};
        [...filteredSchedule.services, ...filteredSchedule.sportsEvents].filter(s => !s.isHidden).forEach(service => {
          service.assignments.forEach(assignment => {
            const timeKey = assignment.time;
            if (!grouped[timeKey]) grouped[timeKey] = [];
            grouped[timeKey].push({ ...assignment, serviceTitle: service.title, novelty: service.novelty });
          });
        });
        return grouped;
    }, [filteredSchedule]);
    
    const openTemplateModal = (props: any) => {
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
        if (!displayDate) return null;
        switch (view) {
            case 'unit-report':
                if (!unitReport) return null;
                return (
                    <UnitReportDisplay
                        reportData={unitReport}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onUpdateReport={handleUpdateUnitReport}
                        commandPersonnel={commandPersonnel}
                        servicePersonnel={servicePersonnel}
                        unitList={unitList}
                    />
                );
            case 'unit-status':
                if (!unitReport) return null;
                return <UnitStatusView unitReportData={unitReport} />;
            case 'command-post':
                if (!unitReport) return null;
                return <CommandPostView unitReportData={unitReport} />;
            case 'era-report':
                if (!eraReport) return null;
                return (
                    <EraReportDisplay
                        reportData={eraReport}
                        onUpdateReport={handleUpdateEraReport}
                    />
                );
            case 'generator-report':
                if (!generatorReport) return null;
                return (
                    <GeneratorReportDisplay
                        reportData={generatorReport}
                        onUpdateReport={handleUpdateGeneratorReport}
                    />
                );
            case 'schedule':
                if (!filteredSchedule) return null;
                return (
                    <ScheduleDisplay
                        schedule={filteredSchedule} displayDate={displayDate} selectedServiceIds={selectedServiceIds} commandPersonnel={commandPersonnel} servicePersonnel={servicePersonnel} unitList={unitList}
                        onDateChange={handleDateChange} onUpdateService={handleUpdateService} onUpdateCommandStaff={handleUpdateCommandStaff} onAddNewService={handleAddNewService} onMoveService={handleMoveService} onToggleServiceSelection={handleToggleServiceSelection} onSelectAllServices={handleSelectAllServices} onSaveAsTemplate={handleSaveAsTemplate} onReplaceFromTemplate={(serviceId, type) => openTemplateModal({ mode: 'replace', serviceType: type, serviceToReplaceId: serviceId })} onImportGuardLine={() => handleUpdateCommandStaff(loadGuardLineFromRoster(displayDate, schedule!.commandStaff, commandPersonnel), true)}
                        onDeleteService={handleDeleteService}
                        searchTerm={searchTerm} onSearchChange={setSearchTerm}
                    />
                );
            case 'time-grouped':
                if (!filteredSchedule) return null;
                return (
                    <TimeGroupedScheduleDisplay
                        assignmentsByTime={getAssignmentsByTime}
                        onAssignmentStatusChange={handleAssignmentStatusChange}
                    />
                );
            case 'nomenclador':
                return (
                    <Nomenclador
                        commandPersonnel={commandPersonnel} servicePersonnel={servicePersonnel} units={unitList} roster={roster}
                        onAddCommandPersonnel={(item) => updateAndSaveCommandPersonnel([...commandPersonnel, item])} onUpdateCommandPersonnel={(item) => updateAndSaveCommandPersonnel(commandPersonnel.map(p => p.id === item.id ? item : p))} onRemoveCommandPersonnel={(item) => updateAndSaveCommandPersonnel(commandPersonnel.filter(p => p.id !== item.id))}
                        onAddServicePersonnel={(item) => updateAndSaveServicePersonnel([...servicePersonnel, item])} onUpdateServicePersonnel={(item) => updateAndSaveServicePersonnel(servicePersonnel.map(p => p.id === item.id ? item : p))} onRemoveServicePersonnel={(item) => updateAndSaveServicePersonnel(servicePersonnel.filter(p => p.id !== item.id))}
                        onUpdateUnits={updateAndSaveUnits} onUpdateRoster={updateAndSaveRoster}
                     />
                 );
            default:
                return null;
        }
    };
    
    const getButtonClass = (buttonView: string) => `flex items-center gap-2 px-4 py-2 rounded-md transition-colors font-medium ${view === buttonView ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`;
    
    if (!schedule || !displayDate || !unitReport || !eraReport || !generatorReport) {
        return (
            <div className="bg-zinc-900 text-white min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 text-white min-h-screen font-sans">
            <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx,.xls,.docx,.ods" />
            <input type="file" ref={unitReportFileInputRef} onChange={handleUnitReportImport} style={{ display: 'none' }} accept=".xlsx,.xls" />
            <input type="file" ref={rosterInputRef} onChange={handleRosterImport} style={{ display: 'none' }} accept=".json" />
            <header className="bg-zinc-800/80 backdrop-blur-sm sticky top-0 z-40 shadow-lg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 py-4 sm:py-0">
                        <div className="flex items-center mb-4 sm:mb-0">
                            <button onClick={handleResetData} className="mr-2 text-zinc-400 hover:text-white transition-colors" aria-label="Reiniciar Datos"><RefreshIcon className="w-6 h-6" /></button>
                            <button onClick={() => setIsHelpModalOpen(true)} className="mr-4 text-zinc-400 hover:text-white transition-colors" aria-label="Ayuda"><QuestionMarkCircleIcon className="w-6 h-6" /></button>
                            <img src="https://ci.bomberosdelaciudad.gob.ar/LibJs/metroBoostrap2/img/fondo%20neutro.png" alt="Logo Bomberos de la Ciudad" className="h-12 mr-3" />
                            <div className="flex flex-col justify-center">
                                <h1 className="text-xl sm:text-2xl font-bold text-white">Bomberos de la Ciudad</h1>
                                <p className="text-xs text-zinc-400 -mt-1">Organizador de Unidades y Guardia</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <button className={getButtonClass('unit-report')} onClick={() => setView('unit-report')}><FireIcon className="w-5 h-5" /> Reporte de Unidades</button>
                            <button className={getButtonClass('unit-status')} onClick={() => setView('unit-status')}><FilterIcon className="w-5 h-5" /> Estado de Unidades</button>
                            <button className={getButtonClass('command-post')} onClick={() => setView('command-post')}><AnnotationIcon className="w-5 h-5" /> Puesto Comando</button>
                            <button className={getButtonClass('era-report')} onClick={() => setView('era-report')}><LightningBoltIcon className="w-5 h-5" /> Trasvazadores E.R.A.</button>
                            <button className={getButtonClass('generator-report')} onClick={() => setView('generator-report')}><LightningBoltIcon className="w-5 h-5" /> Grupos Electrógenos</button>
                            <button className={getButtonClass('schedule')} onClick={() => setView('schedule')}><ClipboardListIcon className="w-5 h-5" /> Planificador</button>
                            <button className={getButtonClass('time-grouped')} onClick={() => setView('time-grouped')}><ClockIcon className="w-5 h-5" /> Vista por Hora</button>
                            <button className={getButtonClass('nomenclador')} onClick={() => setView('nomenclador')}><BookOpenIcon className="w-5 h-5" /> Nomencladores</button>
                            
                            <div className="relative" ref={importMenuRef}>
                                <button onClick={() => setImportMenuOpen(prev => !prev)} className={'flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors'}>
                                    <UploadIcon className={'w-5 h-5'} />
                                    <span>Importar</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isImportMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isImportMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md shadow-lg bg-zinc-700 ring-1 ring-black ring-opacity-5 z-50 animate-scale-in">
                                        <div className="py-1" role="menu" aria-orientation="vertical">
                                            <a href="#" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); setImportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                                <UploadIcon className={'w-4 h-4'} /> Importar Horario (Word/Excel)
                                            </a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); unitReportFileInputRef.current?.click(); setImportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                                <UploadIcon className={'w-4 h-4'} /> Importar Reporte Unidades (Excel)
                                            </a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); setIsRosterModalOpen(true); setImportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                                <UploadIcon className={'w-4 h-4'} /> Importar Rol de Guardia (.json)
                                            </a>
                                            <a href="#" onClick={(e) => { e.preventDefault(); openTemplateModal({ mode: 'add', serviceType: 'common' }); setImportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                                <BookmarkIcon className={'w-4 h-4'} /> Añadir desde Plantilla
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={exportMenuRef}>
                                <button onClick={() => setExportMenuOpen(prev => !prev)} className={'flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium transition-colors'}>
                                    <DownloadIcon className={'w-5 h-5'} />
                                    <span>Exportar</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isExportMenuOpen && <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-zinc-700 ring-1 ring-black ring-opacity-5 z-50 animate-scale-in">
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                        <a href="#" onClick={(e) => { e.preventDefault(); exportScheduleToWord({ ...schedule!, date: displayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() }); setExportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                            <DownloadIcon className={'w-4 h-4'} /> Exportar General</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); exportScheduleByTimeToWord({ date: displayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(), assignmentsByTime: getAssignmentsByTime }); setExportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                            <DownloadIcon className={'w-4 h-4'} /> Exportar por Hora</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setIsExportTemplateModalOpen(true); setExportMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600 w-full text-left" role="menuitem">
                                            <DownloadIcon className={'w-4 h-4'} /> Exportar Plantilla</a>
                                    </div>
                                </div>}
                            </div>
                            
                            {selectedServiceIds.size > 0 && view === 'schedule' && (
                                <button onClick={handleToggleVisibilityForSelected} className={`flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium transition-colors animate-fade-in ${visibilityAction.action === 'hide' ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'}`}>
                                    {visibilityAction.action === 'hide' ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    {`${visibilityAction.label} (${selectedServiceIds.size})`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
            {isHelpModalOpen && <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} unitList={unitList} commandPersonnel={commandPersonnel} servicePersonnel={servicePersonnel} />}
            {isRosterModalOpen && <RosterImportModal isOpen={isRosterModalOpen} onClose={() => setIsRosterModalOpen(false)} onConfirm={() => rosterInputRef.current?.click()} />}
            {isTemplateModalOpen && <ServiceTemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} templates={serviceTemplates} onSelectTemplate={(template) => handleSelectTemplate(template, templateModalProps)} onDeleteTemplate={handleDeleteTemplate} />}
            {isExportTemplateModalOpen && <ExportTemplateModal isOpen={isExportTemplateModalOpen} onClose={() => setIsExportTemplateModalOpen(false)} onExport={handleExportAsTemplate} />}
        </div>
    );
};

export default App;