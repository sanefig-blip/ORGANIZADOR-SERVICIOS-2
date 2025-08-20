

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Schedule, Officer, Service, Assignment, Personnel, RANKS, Rank } from '../types';
import { CalendarIcon, UserGroupIcon, ClipboardListIcon, ChevronDownIcon, PencilIcon, XCircleIcon, AnnotationIcon, PlusCircleIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, BookmarkIcon, RefreshIcon } from './icons';
import AssignmentCard from './AssignmentCard';

interface ScheduleDisplayProps {
  schedule: Schedule;
  displayDate: Date | null;
  selectedServiceIds: Set<string>;
  onDateChange: (part: 'day' | 'month' | 'year', value: number) => void;
  onUpdateService: (updatedService: Service, type: 'common' | 'sports') => void;
  onUpdateCommandStaff: (updatedStaff: Officer[]) => void;
  onAddNewService: (type: 'common' | 'sports') => void;
  onMoveService: (serviceId: string, direction: 'up' | 'down', type: 'common' | 'sports') => void;
  onToggleServiceSelection: (serviceId: string) => void;
  onSelectAllServices: (selectAll: boolean) => void;
  onSaveAsTemplate: (service: Service) => void;
  onReplaceFromTemplate: (serviceId: string, type: 'common' | 'sports') => void;
  onImportGuardLine: () => void;
  commandPersonnel: Personnel[];
  servicePersonnel: Personnel[];
  unitList: string[];
}

interface ServiceSectionProps {
  service: Service;
  index: number;
  totalServices: number;
  isSelected: boolean;
  onUpdateService: (updatedService: Service) => void;
  onMoveService: (serviceId: string, direction: 'up' | 'down') => void;
  onToggleSelection: (serviceId: string) => void;
  onSaveAsTemplate: (service: Service) => void;
  onReplaceFromTemplate: (serviceId: string) => void;
  commandPersonnel: Personnel[];
  servicePersonnel: Personnel[];
  unitList: string[];
}

const ServiceSection: React.FC<ServiceSectionProps> = ({ service, index, totalServices, isSelected, onUpdateService, onMoveService, onToggleSelection, onSaveAsTemplate, onReplaceFromTemplate, commandPersonnel, servicePersonnel, unitList }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableService, setEditableService] = useState<Service>(() => JSON.parse(JSON.stringify(service)));
  const [personnelDropdownOpenFor, setPersonnelDropdownOpenFor] = useState<number | null>(null);
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');
  const personnelDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  const serviceId = `service-content-${service.id}`;
  
  const allPersonnel = useMemo(() => {
    const combined = [...servicePersonnel, ...commandPersonnel];
    const uniquePersonnel = Array.from(new Map(combined.map(p => [p.id, p])).values());
    return uniquePersonnel.sort((a, b) => a.name.localeCompare(b.name));
  }, [servicePersonnel, commandPersonnel]);

  useEffect(() => {
    setEditableService(JSON.parse(JSON.stringify(service)));
  }, [service]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            personnelDropdownOpenFor !== null &&
            personnelDropdownRefs.current[personnelDropdownOpenFor] &&
            !personnelDropdownRefs.current[personnelDropdownOpenFor]!.contains(event.target as Node)
        ) {
            setPersonnelDropdownOpenFor(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [personnelDropdownOpenFor]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, assignmentIndex?: number) => {
    const { name, value } = e.target;
    
    setEditableService(prev => {
      if (assignmentIndex !== undefined) {
        const newAssignments = [...prev.assignments];
        const currentAssignment = { ...newAssignments[assignmentIndex] };

        if (name === 'details') {
          currentAssignment.details = value.split('\n');
        } else {
          (currentAssignment as any)[name] = value;
        }

        newAssignments[assignmentIndex] = currentAssignment;
        return { ...prev, assignments: newAssignments };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleAddPersonnelToDetails = (assignmentIndex: number, person: Personnel) => {
    const personDetailString = `${person.rank} L.P. ${person.id} ${person.name}`;
    
    setEditableService(prev => {
        const newAssignments = [...prev.assignments];
        const assignment = { ...newAssignments[assignmentIndex] };
        
        const currentDetails = Array.isArray(assignment.details) ? assignment.details : [];
        const newDetails = [...currentDetails, personDetailString];

        assignment.details = newDetails;
        newAssignments[assignmentIndex] = assignment;
        return { ...prev, assignments: newAssignments };
    });

    setPersonnelDropdownOpenFor(null);
    setPersonnelSearchTerm('');
  };

  const handleAddAssignment = () => {
    const newAssignment: Assignment = {
        id: `new-assign-${Date.now()}`,
        location: 'Nueva Ubicación',
        time: '00:00 Hs.',
        implementationTime: '',
        personnel: 'A designar',
        details: [],
    };
    setEditableService(prev => ({
        ...prev,
        assignments: [...prev.assignments, newAssignment],
    }));
  };

  const handleRemoveAssignment = (indexToRemove: number) => {
      setEditableService(prev => ({
          ...prev,
          assignments: prev.assignments.filter((_, index) => index !== indexToRemove),
      }));
  };

  const handleSave = () => {
    onUpdateService(editableService);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableService(JSON.parse(JSON.stringify(service)));
    setIsEditing(false);
  };
  
  const handleAddStadium = () => {
    let maxOsNumber = 0;
    service.assignments.forEach(a => {
        const osDetail = (a.details || []).find(d => /^\d+-\s*O\.S\./.test(d.trim()));
        if (osDetail) {
            const match = osDetail.match(/^(\d+)-/);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > maxOsNumber) {
                    maxOsNumber = num;
                }
            }
        }
    });

    const newOsNumber = maxOsNumber + 1;
    const paddedOsNumber = String(newOsNumber).padStart(2, '0');

    const newAssignment: Assignment = {
        id: `stadium-assign-${Date.now()}`,
        location: "Nuevo Estadio (Editar)",
        time: "00:00 Hs. a terminar.-",
        personnel: "A designar",
        implementationTime: "HORARIO DE IMPLANTACION: 00:00 Hs.-",
        details: [
            `${paddedOsNumber}-O.S.XXXX ENCUENTRO FUTBOLÍSTICO "EQUIPO A VS. EQUIPO B"`
        ]
    };

    const updatedService = {
        ...service,
        assignments: [...service.assignments, newAssignment]
    };

    onUpdateService(updatedService);
  };
  
  if (isEditing) {
    return (
      <div className="bg-gray-800/60 rounded-xl shadow-lg mb-8 p-6 animate-fade-in">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white">Editando Servicio</h3>
             <button
                onClick={() => onReplaceFromTemplate(service.id)}
                className="flex items-center gap-2 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-md transition-colors text-sm"
              >
                <RefreshIcon className="w-4 h-4" />
                Reemplazar desde Plantilla
              </button>
        </div>
        
        <div className="space-y-4 mb-6">
            <div>
                <label htmlFor={`title-${service.id}`} className="block text-sm font-medium text-gray-300 mb-1">Título del Servicio</label>
                <input
                    type="text"
                    id={`title-${service.id}`}
                    name="title"
                    value={editableService.title}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label htmlFor={`description-${service.id}`} className="block text-sm font-medium text-gray-300 mb-1">Descripción (Opcional)</label>
                <textarea
                    id={`description-${service.id}`}
                    name="description"
                    value={editableService.description || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label htmlFor={`novelty-${service.id}`} className="block text-sm font-medium text-gray-300 mb-1">Novedad (Opcional)</label>
                <textarea
                    id={`novelty-${service.id}`}
                    name="novelty"
                    value={editableService.novelty || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
        </div>

        <div className="flex justify-between items-center mb-4 border-t border-gray-700 pt-4">
            <h4 className="text-lg font-semibold text-yellow-300">Asignaciones</h4>
            <button
                onClick={handleAddAssignment}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors text-sm"
            >
                <PlusCircleIcon className="w-4 h-4" />
                Añadir Asignación
            </button>
        </div>

        <div className="space-y-6">
        {editableService.assignments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No hay asignaciones para este servicio.</div>
        ) : (
          editableService.assignments.map((assignment, index) => (
            <div key={assignment.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative">
                <button onClick={() => handleRemoveAssignment(index)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-1 rounded-full bg-gray-900/50 hover:bg-gray-800 transition-colors" aria-label="Eliminar asignación">
                    <TrashIcon className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                     <div className="md:col-span-2">
                        <label htmlFor={`location-${index}-${service.id}`} className="text-sm text-gray-400">Ubicación</label>
                        <input type="text" id={`location-${index}-${service.id}`} name="location" value={assignment.location} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                    </div>
                    <div>
                        <label htmlFor={`time-${index}-${service.id}`} className="text-sm text-gray-400">Horario de Servicio</label>
                        <input type="text" id={`time-${index}-${service.id}`} name="time" value={assignment.time} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                    </div>
                    <div>
                        <label htmlFor={`implementationTime-${index}-${service.id}`} className="text-sm text-gray-400">Horario de Implantación</label>
                        <input type="text" id={`implementationTime-${index}-${service.id}`} name="implementationTime" value={assignment.implementationTime || ''} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor={`personnel-${index}-${service.id}`} className="text-sm text-gray-400">Personal</label>
                        <input
                            type="text"
                            id={`personnel-${index}-${service.id}`}
                            name="personnel"
                            value={assignment.personnel}
                            onChange={(e) => handleInputChange(e, index)}
                            className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"
                            list={`personnel-list-${service.id}`}
                            autoComplete="off"
                        />
                        <datalist id={`personnel-list-${service.id}`}>
                            <option value="A designar" />
                            {allPersonnel.map(p => {
                                let label = p.name;
                                const extraInfo = [];
                                if (p.station) extraInfo.push(`Est: ${p.station}`);
                                if (p.detachment) extraInfo.push(`Dest: ${p.detachment}`);
                                if (extraInfo.length > 0) {
                                    label += ` (${extraInfo.join(' / ')})`;
                                }
                                return <option key={p.id} value={label} />
                            })}
                        </datalist>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor={`unit-${index}-${service.id}`} className="text-sm text-gray-400">Unidad (Opcional)</label>
                        <select id={`unit-${index}-${service.id}`} name="unit" value={assignment.unit || ''} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white">
                            <option value="">Ninguna</option>
                            {assignment.unit && <option value={assignment.unit}>{assignment.unit}</option>}
                            {unitList.filter(u => u !== assignment.unit).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-2 relative" ref={el => {personnelDropdownRefs.current[index] = el}}>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor={`details-${index}-${service.id}`} className="text-sm text-gray-400">Detalles (Opcional)</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setPersonnelDropdownOpenFor(personnelDropdownOpenFor === index ? null : index);
                                    setPersonnelSearchTerm('');
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded-md text-white font-medium transition-colors"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Añadir Personal
                            </button>
                        </div>
                        {personnelDropdownOpenFor === index && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <div className="p-2 sticky top-0 bg-gray-800">
                                    <input
                                        type="text"
                                        placeholder="Buscar personal..."
                                        value={personnelSearchTerm}
                                        onChange={e => setPersonnelSearchTerm(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white"
                                        autoFocus
                                    />
                                </div>
                                <ul className="divide-y divide-gray-700">
                                    {allPersonnel
                                        .filter(p => 
                                            p.name.toLowerCase().includes(personnelSearchTerm.toLowerCase()) ||
                                            p.rank.toLowerCase().includes(personnelSearchTerm.toLowerCase()) ||
                                            p.id.toLowerCase().includes(personnelSearchTerm.toLowerCase())
                                        )
                                        .map(p => (
                                            <li
                                                key={p.id}
                                                onClick={() => handleAddPersonnelToDetails(index, p)}
                                                className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="font-bold text-white">{p.name}</div>
                                                    <div className="text-xs text-yellow-400">{p.rank}</div>
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono">L.P. {p.id}</div>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        )}
                        <textarea id={`details-${index}-${service.id}`} name="details" value={(assignment.details || []).join('\n')} onChange={(e) => handleInputChange(e, index)} rows={3} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                    </div>
                </div>
            </div>
          ))
        )}
        </div>

        <div className="flex justify-end space-x-4 mt-8">
            <button onClick={handleCancel} className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors">
                <XCircleIcon className="w-5 h-5 mr-2"/>
                Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors">
                <PencilIcon className="w-5 h-5 mr-2"/>
                Guardar Cambios
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/60 rounded-xl shadow-lg mb-8 overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="w-full flex items-center justify-between p-6 text-left">
            <div className="flex items-center flex-grow mr-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(service.id)}
                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 mr-4 flex-shrink-0"
                    aria-label={`Seleccionar servicio ${service.title}`}
                />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-grow flex items-center focus:outline-none"
                    aria-controls={serviceId}
                    aria-expanded={isOpen}
                >
                    <ClipboardListIcon className="w-8 h-8 mr-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-grow text-left">
                        <h3 className="text-xl sm:text-2xl font-bold text-white">{service.title}</h3>
                        {service.description && <p className="text-sm text-gray-400 mt-1">{service.description}</p>}
                    </div>
                    <ChevronDownIcon
                    className={`w-7 h-7 text-gray-300 flex-shrink-0 transform transition-transform duration-300 ml-4 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    />
                </button>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
                 <button 
                    onClick={() => onMoveService(service.id, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Subir servicio"
                >
                    <ArrowUpIcon className="w-5 h-5" />
                </button>
                 <button 
                    onClick={() => onMoveService(service.id, 'down')}
                    disabled={index === totalServices - 1}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Bajar servicio"
                >
                    <ArrowDownIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onSaveAsTemplate(service)}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                    aria-label="Guardar como plantilla"
                >
                    <BookmarkIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    aria-label="Editar servicio"
                >
                    <PencilIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        {service.novelty && (
             <div className="px-6 pb-4">
                <div className="p-3 bg-yellow-900/40 border border-yellow-700 rounded-md">
                    <div className="flex items-start">
                        <AnnotationIcon className="w-5 h-5 mr-2 text-yellow-300 flex-shrink-0" />
                        <p className="text-yellow-200 text-sm">{service.novelty}</p>
                    </div>
                </div>
            </div>
        )}

      <div
        id={serviceId}
        className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
           <div className="p-6 bg-gray-900/40">
              {service.title.toUpperCase().includes('EVENTO DEPORTIVO') && (
                <div className="mb-6">
                  <button
                    onClick={handleAddStadium}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors"
                    aria-label="Añadir nueva cancha"
                  >
                    <PlusCircleIcon className="w-5 h-5" />
                    Añadir Cancha
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {service.assignments.map((assignment) => (
                      <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const DateSelector: React.FC<{
    displayDate: Date | null;
    onDateChange: (part: 'day' | 'month' | 'year', value: number) => void;
}> = ({ displayDate, onDateChange }) => {
    if (!displayDate) {
        return null; // Don't render if date is not available yet
    }

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const day = displayDate.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <div className="flex items-center gap-2">
             <select value={day} onChange={(e) => onDateChange('day', parseInt(e.target.value))} className="bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="text-gray-400">de</span>
            <select value={month} onChange={(e) => onDateChange('month', parseInt(e.target.value))} className="bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white">
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <span className="text-gray-400">de</span>
            <select value={year} onChange={(e) => onDateChange('year', parseInt(e.target.value))} className="bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white">
                {Array.from({ length: 10 }, (_, i) => year - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    );
};

const isValidLp = (id?: string) => {
    if (!id) return false;
    return !id.startsWith('empty-') && !id.startsWith('roster-');
};


const ScheduleDisplay: React.FC<ScheduleDisplayProps> = (props) => {
  const { schedule, displayDate, selectedServiceIds, onDateChange, onUpdateService, onUpdateCommandStaff, onAddNewService, onMoveService, onToggleServiceSelection, onSelectAllServices, commandPersonnel, servicePersonnel, unitList, onSaveAsTemplate, onReplaceFromTemplate, onImportGuardLine } = props;
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editableStaff, setEditableStaff] = useState<Officer[]>([]);
  
  const visibleServices = schedule.services.filter(s => !s.isHidden);
  const hiddenServices = schedule.services.filter(s => s.isHidden);
  
  const visibleSportsEvents = schedule.sportsEvents.filter(s => !s.isHidden);
  const hiddenSportsEvents = schedule.sportsEvents.filter(s => s.isHidden);
  
  const allVisibleServices = [...visibleServices, ...visibleSportsEvents];
  const allHiddenServices = [...hiddenServices, ...hiddenSportsEvents];

  const areAllVisibleSelected = allVisibleServices.length > 0 && allVisibleServices.every(s => selectedServiceIds.has(s.id));

  useEffect(() => {
    setEditableStaff(JSON.parse(JSON.stringify(schedule.commandStaff)));
  }, [schedule.commandStaff]);

  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number) => {
    const { name, value } = e.target;
    setEditableStaff(prev => {
        const newStaff = [...prev];
        const currentOfficer = { ...newStaff[index] };

        if (name === 'id') {
            currentOfficer.id = value;
        } else if (name === 'role') {
            currentOfficer.role = value;
        } else if (name === 'rank') {
            currentOfficer.rank = value as Rank;
        } else if (name === 'name') {
            currentOfficer.name = value;
            const person = commandPersonnel.find(p => p.name === value);
            if (person) {
                currentOfficer.rank = person.rank;
                currentOfficer.id = person.id;
            }
        }
        
        newStaff[index] = currentOfficer;
        return newStaff;
    });
  };

  const handleSaveStaff = () => {
    onUpdateCommandStaff(editableStaff);
    setIsEditingStaff(false);
  };
  
  const handleCancelStaff = () => {
    setEditableStaff(JSON.parse(JSON.stringify(schedule.commandStaff)));
    setIsEditingStaff(false);
  };

  const formattedDate = displayDate ? `${displayDate.getDate()} DE ${monthNames[displayDate.getMonth()].toUpperCase()} DE ${displayDate.getFullYear()}` : schedule.date;

  return (
    <div className="animate-fade-in">
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b-2 border-gray-700 pb-4 gap-4">
            <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 mr-4 text-blue-300 flex-shrink-0" />
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-white">LÍNEA DE GUARDIA DEL DÍA</h2>
                    <DateSelector displayDate={displayDate} onDateChange={onDateChange} />
                </div>
            </div>
            <div className="flex items-center gap-2 self-center">
                 {!isEditingStaff && (
                    <button
                        onClick={onImportGuardLine}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        title="Importar rol desde Nomenclador para la fecha seleccionada"
                        aria-label="Importar rol de guardia para la fecha seleccionada"
                    >
                        <RefreshIcon className="w-5 h-5"/>
                    </button>
                )}
                <button 
                    onClick={() => setIsEditingStaff(!isEditingStaff)} 
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Editar línea de guardia"
                >
                    {isEditingStaff ? <XCircleIcon className="w-6 h-6"/> : <PencilIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
        
        {isEditingStaff ? (
            <div className="bg-gray-800/60 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-[2fr,1fr,1.5fr,2.5fr] gap-4 text-sm font-medium text-gray-400 mb-2">
                    <label>Rol</label>
                    <label>L.P.</label>
                    <label>Jerarquía</label>
                    <label>Nombre</label>
                </div>

                <datalist id="personnel-datalist-shared">
                  {commandPersonnel.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
                
                 {editableStaff.map((officer, index) => (
                    <div key={officer.id || index} className="grid grid-cols-[2fr,1fr,1.5fr,2.5fr] gap-4 items-center">
                       <input 
                         type="text" 
                         name="role"
                         value={officer.role}
                         onChange={(e) => handleStaffChange(e, index)}
                         className="w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"
                       />
                       <input 
                         type="text" 
                         name="id"
                         value={isValidLp(officer.id) ? officer.id : ''}
                         onChange={(e) => handleStaffChange(e, index)}
                         placeholder="L.P."
                         className="w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"
                       />
                       <select
                          name="rank"
                          value={officer.rank || 'OTRO'}
                          onChange={(e) => handleStaffChange(e, index)}
                          className="w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"
                        >
                          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                       <input 
                         list="personnel-datalist-shared"
                         type="text" 
                         name="name"
                         value={officer.name}
                         onChange={(e) => handleStaffChange(e, index)}
                         className="w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"
                         placeholder="Apellido, Nombre"
                       />
                    </div>
                 ))}
                 <div className="flex justify-end space-x-4 pt-4">
                    <button onClick={handleCancelStaff} className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors">
                        <XCircleIcon className="w-5 h-5 mr-2"/>
                        Cancelar
                    </button>
                    <button onClick={handleSaveStaff} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors">
                        <PencilIcon className="w-5 h-5 mr-2"/>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        ) : (
            <div className="bg-gray-800/60 rounded-xl p-6">
                <div className="grid grid-cols-[2fr,1fr,1.5fr,2.5fr] gap-4 text-sm font-bold text-gray-400 border-b border-gray-700 pb-3 mb-3">
                    <div>ROL</div>
                    <div>L.P.</div>
                    <div>JERARQUÍA</div>
                    <div>NOMBRE</div>
                </div>
                <div className="space-y-2">
                    {schedule.commandStaff.map((officer, index) => (
                    <div key={officer.id || index} className="grid grid-cols-[2fr,1fr,1.5fr,2.5fr] gap-4 items-center p-2 rounded-md">
                        <div className="font-semibold text-blue-300 truncate" title={officer.role}>{officer.role}</div>
                        <div className="text-gray-300 font-mono">{isValidLp(officer.id) ? officer.id : ''}</div>
                        <div className={`${officer.rank === 'OTRO' ? 'text-gray-400 italic' : 'text-yellow-400 font-bold'}`}>{officer.rank || 'OTRO'}</div>
                        <div className="text-gray-100">{officer.name}</div>
                    </div>
                    ))}
                </div>
            </div>
        )}

      </div>

      <div>
        <div className="flex items-center justify-between mb-6 border-b-2 border-gray-700 pb-4 gap-4 flex-wrap">
            <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 mr-4 text-yellow-300" />
                <h2 className="text-3xl font-bold text-white">Servicios del Día: <span className="font-normal text-gray-300">{formattedDate}</span></h2>
            </div>
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => onAddNewService('common')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition-colors"
                    aria-label="Añadir nuevo servicio"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Añadir Servicio
                </button>
            </div>
        </div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="select-all-services"
                    checked={areAllVisibleSelected}
                    onChange={(e) => onSelectAllServices(e.target.checked)}
                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="select-all-services" className="text-gray-300">Seleccionar Todos Visibles</label>
            </div>
        </div>
        
        {visibleServices.map((service, index) => (
          <ServiceSection 
            key={service.id} 
            service={service} 
            index={index}
            totalServices={visibleServices.length}
            isSelected={selectedServiceIds.has(service.id)}
            onUpdateService={(s) => onUpdateService(s, 'common')} 
            onMoveService={(id, dir) => onMoveService(id, dir, 'common')}
            onToggleSelection={onToggleServiceSelection}
            onSaveAsTemplate={onSaveAsTemplate}
            onReplaceFromTemplate={(id) => onReplaceFromTemplate(id, 'common')}
            commandPersonnel={commandPersonnel}
            servicePersonnel={servicePersonnel}
            unitList={unitList}
          />
        ))}

        {visibleSportsEvents.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6 border-b-2 border-gray-700 pb-4 gap-4 flex-wrap">
              <div className="flex items-center">
                  <ClipboardListIcon className="w-8 h-8 mr-4 text-green-300" />
                  <h2 className="text-3xl font-bold text-white">Eventos Deportivos</h2>
              </div>
              <div className="flex items-center gap-4">
                   <button 
                      onClick={() => onAddNewService('sports')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors"
                      aria-label="Añadir nuevo evento deportivo"
                  >
                      <PlusCircleIcon className="w-5 h-5" />
                      Añadir Evento
                  </button>
              </div>
            </div>
            {visibleSportsEvents.map((service, index) => (
              <ServiceSection 
                key={service.id} 
                service={service} 
                index={index}
                totalServices={visibleSportsEvents.length}
                isSelected={selectedServiceIds.has(service.id)}
                onUpdateService={(s) => onUpdateService(s, 'sports')} 
                onMoveService={(id, dir) => onMoveService(id, dir, 'sports')}
                onToggleSelection={onToggleServiceSelection}
                onSaveAsTemplate={onSaveAsTemplate}
                onReplaceFromTemplate={(id) => onReplaceFromTemplate(id, 'sports')}
                commandPersonnel={commandPersonnel}
                servicePersonnel={servicePersonnel}
                unitList={unitList}
              />
            ))}
          </div>
        )}

        {allHiddenServices.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-400 border-b border-gray-700 pb-2 mb-4">Servicios Ocultos</h3>
            <div className="flex flex-wrap gap-3">
              {allHiddenServices.map(service => (
                <div key={service.id} className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-full animate-fade-in">
                   <input
                    type="checkbox"
                    id={`select-hidden-${service.id}`}
                    checked={selectedServiceIds.has(service.id)}
                    onChange={() => onToggleServiceSelection(service.id)}
                    className="h-4 w-4 rounded-sm bg-gray-600 border-gray-500 text-purple-500 focus:ring-purple-500"
                    aria-label={`Seleccionar servicio oculto ${service.title}`}
                   />
                   <label htmlFor={`select-hidden-${service.id}`} className="text-gray-300 text-sm cursor-pointer">{service.title}</label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleDisplay;