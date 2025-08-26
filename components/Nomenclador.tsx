import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TrashIcon, PlusCircleIcon, PencilIcon, XCircleIcon, GripVerticalIcon, ArrowLeftIcon, ArrowRightIcon, BookmarkIcon, AnnotationIcon } from './icons';
import { Personnel, Rank, RANKS, Roster, ServiceTemplate, Assignment } from '../types';
import { organigramaImages } from '../data/organigramaImages';

interface NomencladorProps {
  commandPersonnel: Personnel[];
  onAddCommandPersonnel: (item: Personnel) => void;
  onUpdateCommandPersonnel: (item: Personnel) => void;
  onRemoveCommandPersonnel: (item: Personnel) => void;
  
  servicePersonnel: Personnel[];
  onAddServicePersonnel: (item: Personnel) => void;
  onUpdateServicePersonnel: (item: Personnel) => void;
  onRemoveServicePersonnel: (item: Personnel) => void;

  units: string[];
  onUpdateUnits: (units: string[]) => void;

  roster: Roster;
  onUpdateRoster: (roster: Roster) => void;

  serviceTemplates: ServiceTemplate[];
  onAddTemplate: (template: ServiceTemplate) => void;
  onUpdateTemplate: (template: ServiceTemplate) => void;
  onRemoveTemplate: (templateId: string) => void;
}

type ExtraField = 'station' | 'detachment' | 'poc' | 'part';

const PersonnelListItem: React.FC<{
  item: Personnel;
  onUpdate: (item: Personnel) => void;
  onRemove: (item: Personnel) => void;
  extraFieldsToShow: ExtraField[];
}> = ({ item, onUpdate, onRemove, extraFieldsToShow }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableItem, setEditableItem] = useState(item);

  const handleSave = () => {
    if (editableItem.name.trim() && editableItem.id.trim()) {
      onUpdate(editableItem);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditableItem(item);
    setIsEditing(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableItem(prev => ({...prev, [name]: value }));
  };

  if (isEditing) {
    const gridColsClass = extraFieldsToShow.length > 1 
      ? 'sm:grid-cols-2 md:grid-cols-3'
      : 'sm:grid-cols-4';

    return (
      <li className="flex flex-col bg-gray-900/80 p-3 rounded-md animate-fade-in gap-3">
        <div className={`w-full grid grid-cols-1 ${gridColsClass} gap-2`}>
            <input
                type="text"
                name="id"
                value={editableItem.id}
                onChange={handleInputChange}
                placeholder="L.P."
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            />
            <select
                name="rank"
                value={editableItem.rank}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            >
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
                type="text"
                name="name"
                value={editableItem.name}
                onChange={handleInputChange}
                className={`w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 ${extraFieldsToShow.length > 1 ? 'md:col-span-1' : 'sm:col-span-1'}`}
            />
             {extraFieldsToShow.includes('poc') && (
                <input
                    type="text"
                    name="poc"
                    value={editableItem.poc || ''}
                    onChange={handleInputChange}
                    placeholder="POC"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            )}
            {extraFieldsToShow.includes('station') && (
                <input
                    type="text"
                    name="station"
                    value={editableItem.station || ''}
                    onChange={handleInputChange}
                    placeholder="Estación"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            )}
            {extraFieldsToShow.includes('detachment') && (
                <input
                    type="text"
                    name="detachment"
                    value={editableItem.detachment || ''}
                    onChange={handleInputChange}
                    placeholder="Destacamento"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            )}
             {extraFieldsToShow.includes('part') && (
                 <input
                    type="text"
                    name="part"
                    value={editableItem.part || ''}
                    onChange={handleInputChange}
                    placeholder="PART"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
            )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 self-end">
          <button onClick={handleSave} className="text-green-400 hover:text-green-300 transition-colors p-1"><PencilIcon className="w-5 h-5"/></button>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-200 transition-colors p-1"><XCircleIcon className="w-5 h-5"/></button>
        </div>
      </li>
    );
  }

  const hasExtraFields = extraFieldsToShow.some(field => item[field as keyof Personnel]);

  return (
    <li className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 flex-grow min-w-0">
        <div className="flex items-center min-w-0 flex-wrap sm:flex-nowrap gap-x-4">
            <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0">L.P. {item.id}</span>
            <span className="font-semibold text-blue-300 mr-2 flex-shrink-0">{item.rank}</span>
            <span className="text-gray-200 truncate">{item.name}</span>
        </div>
        {hasExtraFields && (
            <div className="text-xs text-gray-400 mt-1 sm:mt-0 truncate flex flex-wrap gap-x-3">
                {extraFieldsToShow.includes('poc') && item.poc && <span>POC: {item.poc}</span>}
                {extraFieldsToShow.includes('station') && item.station && <span>Est: {item.station}</span>}
                {extraFieldsToShow.includes('detachment') && item.detachment && <span>Dest: {item.detachment}</span>}
                {extraFieldsToShow.includes('part') && item.part && <span>PART: {item.part}</span>}
            </div>
        )}
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
         <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-yellow-400 transition-colors">
            <PencilIcon className="w-5 h-5" />
          </button>
        <button onClick={() => onRemove(item)} className="text-gray-400 hover:text-red-400 transition-colors">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </li>
  );
};


const EditablePersonnelList: React.FC<{
  title: string;
  items: Personnel[];
  onAddItem: (item: Personnel) => void;
  onUpdateItem: (item: Personnel) => void;
  onRemoveItem: (item: Personnel) => void;
  extraFieldsToShow: ExtraField[];
}> = ({ title, items, onAddItem, onUpdateItem, onRemoveItem, extraFieldsToShow }) => {
  const [newLp, setNewLp] = useState('');
  const [newName, setNewName] = useState('');
  const [newRank, setNewRank] = useState<Rank>('OTRO');
  const [newStation, setNewStation] = useState('');
  const [newDetachment, setNewDetachment] = useState('');
  const [newPoc, setNewPoc] = useState('');
  const [newPart, setNewPart] = useState('');

  const handleAdd = () => {
    if (newName.trim() && newLp.trim()) {
      const newItem: Personnel = {
        id: newLp.trim(),
        name: newName.trim(),
        rank: newRank,
      };
      if (extraFieldsToShow.includes('station')) newItem.station = newStation.trim() || undefined;
      if (extraFieldsToShow.includes('detachment')) newItem.detachment = newDetachment.trim() || undefined;
      if (extraFieldsToShow.includes('poc')) newItem.poc = newPoc.trim() || undefined;
      if (extraFieldsToShow.includes('part')) newItem.part = newPart.trim() || undefined;
      
      onAddItem(newItem);
      setNewLp('');
      setNewName('');
      setNewRank('OTRO');
      setNewStation('');
      setNewDetachment('');
      setNewPoc('');
      setNewPart('');
    }
  };

  const gridColsClass = extraFieldsToShow.length > 1 
      ? 'sm:grid-cols-2 md:grid-cols-3'
      : 'sm:grid-cols-4';

  return (
    <div className="bg-gray-800/60 rounded-xl shadow-lg p-6 flex flex-col h-[32rem]">
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <div className={`grid grid-cols-1 ${gridColsClass} gap-2 mb-2`}>
        <input
          type="text"
          value={newLp}
          onChange={(e) => setNewLp(e.target.value)}
          placeholder="L.P."
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
          aria-label="Añadir L.P. de personal"
        />
        <select
          value={newRank}
          onChange={(e) => setNewRank(e.target.value as Rank)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
          aria-label="Seleccionar jerarquía"
        >
          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Apellido, Nombre"
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
          aria-label="Añadir nombre de personal"
        />
        {extraFieldsToShow.includes('poc') && (
             <input
              type="text"
              value={newPoc}
              onChange={(e) => setNewPoc(e.target.value)}
              placeholder="POC"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              aria-label="Añadir POC"
            />
        )}
        {extraFieldsToShow.includes('station') && (
            <input
              type="text"
              value={newStation}
              onChange={(e) => setNewStation(e.target.value)}
              placeholder="Estación"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              aria-label="Añadir estación"
            />
        )}
        {extraFieldsToShow.includes('detachment') && (
            <input
              type="text"
              value={newDetachment}
              onChange={(e) => setNewDetachment(e.target.value)}
              placeholder="Destacamento"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              aria-label="Añadir destacamento"
            />
        )}
        {extraFieldsToShow.includes('part') && (
             <input
              type="text"
              value={newPart}
              onChange={(e) => setNewPart(e.target.value)}
              placeholder="PART"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              aria-label="Añadir PART"
            />
        )}
      </div>
       <button
          onClick={handleAdd}
          className="w-full flex-shrink-0 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors mb-4"
          aria-label="Añadir Personal"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Añadir Personal
        </button>
      <ul className="space-y-2 overflow-y-auto pr-2 flex-grow">
        {items.map((item) => (
           <PersonnelListItem
              key={item.id}
              item={item}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              extraFieldsToShow={extraFieldsToShow}
            />
        ))}
         {items.length === 0 && (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No hay personal.</p>
            </div>
        )}
      </ul>
    </div>
  );
};


const UnitList: React.FC<{
  items: string[];
  onUpdateItems: (items: string[]) => void;
}> = ({ items, onUpdateItems }) => {
    const [newItem, setNewItem] = useState('');
    const draggedItemIndex = useRef<number | null>(null);
    const dragOverItemIndex = useRef<number | null>(null);

    const handleAdd = () => {
      if (newItem.trim() && !items.includes(newItem.trim())) {
        onUpdateItems([...items, newItem.trim()]);
        setNewItem('');
      }
    };

    const handleRemove = (itemToRemove: string) => {
        onUpdateItems(items.filter(item => item !== itemToRemove));
    };

    const handleDragStart = (index: number) => {
        draggedItemIndex.current = index;
    };
    
    const handleDragEnter = (index: number) => {
        dragOverItemIndex.current = index;
    };
    
    const handleDragEnd = () => {
        if (draggedItemIndex.current === null || dragOverItemIndex.current === null) return;
        
        const newItems = [...items];
        const [draggedItem] = newItems.splice(draggedItemIndex.current, 1);
        newItems.splice(dragOverItemIndex.current, 0, draggedItem);
      
        draggedItemIndex.current = null;
        dragOverItemIndex.current = null;
      
        onUpdateItems(newItems);
    };

    return (
      <div className="bg-gray-800/60 rounded-xl shadow-lg p-6 flex flex-col h-[32rem]">
        <h3 className="text-2xl font-bold text-white mb-4">Unidades</h3>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Añadir nueva unidad..."
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            aria-label="Añadir nueva unidad"
          />
          <button
            onClick={handleAdd}
            className="flex-shrink-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors"
            aria-label="Añadir unidad"
          >
            <PlusCircleIcon className="w-5 h-5" />
          </button>
        </div>
        <ul className="space-y-2 overflow-y-auto pr-2 flex-grow">
          {items.map((item, index) => (
            <li
              key={item}
              className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md animate-fade-in group"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex items-center">
                 <GripVerticalIcon className="w-5 h-5 mr-2 text-gray-500 cursor-grab group-hover:text-gray-300 transition-colors" />
                 <span className="text-gray-200">{item}</span>
              </div>
              <button
                onClick={() => handleRemove(item)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                aria-label={`Eliminar ${item}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </li>
          ))}
           {items.length === 0 && (
              <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No hay unidades.</p>
              </div>
          )}
        </ul>
      </div>
    );
}

const RosterEditor: React.FC<{
  roster: Roster;
  onUpdateRoster: (roster: Roster) => void;
  personnelList: Personnel[];
}> = ({ roster, onUpdateRoster, personnelList }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editableMonthRoster, setEditableMonthRoster] = useState<Roster>({});
  
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const roles = [
    { key: 'jefeInspecciones', label: 'Jefe de Inspecciones' },
    { key: 'jefeServicio', label: 'Jefe de Servicio' },
    { key: 'jefeGuardia', label: 'Jefe de Guardia' },
    { key: 'jefeReserva', label: 'Jefe de Reserva' },
  ];

  useEffect(() => {
    const monthData: Roster = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (roster[dateKey]) {
        monthData[dateKey] = roster[dateKey];
      }
    }
    setEditableMonthRoster(monthData);
  }, [currentDate, roster]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const handleInputChange = (dateKey: string, roleKey: string, value: string) => {
    setEditableMonthRoster(prev => {
      const updatedDay = { ...(prev[dateKey] || {}), [roleKey]: value };
      // Remove role if value is empty
      if (value.trim() === '') {
        delete updatedDay[roleKey as keyof typeof updatedDay];
      }
      const updatedRoster = { ...prev, [dateKey]: updatedDay };
      // Remove day if it has no roles
      if (Object.keys(updatedDay).length === 0) {
        delete updatedRoster[dateKey];
      }
      return updatedRoster;
    });
  };
  
  const handleSave = () => {
    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();
    const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;

    const filteredRoster = Object.keys(roster).reduce((acc, dateKey) => {
      if (!dateKey.startsWith(monthPrefix)) {
        acc[dateKey] = roster[dateKey];
      }
      return acc;
    }, {} as Roster);

    const newRoster = { ...filteredRoster, ...editableMonthRoster };
    
    onUpdateRoster(newRoster);
    alert('Rol de guardia guardado con éxito.');
  };

  const handleClearMonth = () => {
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    if (!window.confirm(`¿Estás seguro de que quieres borrar todas las asignaciones para ${monthName} ${year}?`)) {
      return;
    }

    const monthPrefix = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-`;

    const newRoster = Object.keys(roster).reduce((acc, dateKey) => {
        if (!dateKey.startsWith(monthPrefix)) {
            acc[dateKey] = roster[dateKey];
        }
        return acc;
    }, {} as Roster);

    onUpdateRoster(newRoster);
    alert(`Asignaciones para ${monthName} borradas.`);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRoster = editableMonthRoster[dateKey] || {};

      rows.push(
        <tr key={dateKey} className="bg-gray-800 hover:bg-gray-700/50">
          <td className="p-2 border-b border-gray-700 text-center font-semibold text-white">{day}</td>
          {roles.map(role => (
            <td key={role.key} className="p-1 border-b border-gray-700">
              <input
                type="text"
                list="command-personnel-suggestions"
                value={dayRoster[role.key as keyof typeof dayRoster] || ''}
                onChange={e => handleInputChange(dateKey, role.key, e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </td>
          ))}
        </tr>
      );
    }
    return rows;
  };

  return (
    <div className="bg-gray-800/60 rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-2xl font-bold text-white mb-4">Editor de Rol de Guardia</h3>
      <datalist id="command-personnel-suggestions">
        {personnelList.map(p => <option key={p.id} value={p.name} />)}
      </datalist>
      <div className="flex justify-between items-center mb-4 bg-gray-900 p-3 rounded-lg">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ArrowLeftIcon className="w-6 h-6"/></button>
        <span className="text-xl font-bold text-yellow-300">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ArrowRightIcon className="w-6 h-6"/></button>
      </div>
      <div className="overflow-x-auto max-h-[50vh]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-900 sticky top-0">
              <th className="p-2 border-b-2 border-gray-600 text-left text-sm font-semibold text-gray-300 w-16">Día</th>
              {roles.map(role => <th key={role.key} className="p-2 border-b-2 border-gray-600 text-left text-sm font-semibold text-gray-300">{role.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {renderCalendar()}
          </tbody>
        </table>
      </div>
       <div className="flex justify-end space-x-4 mt-6">
            <button onClick={handleClearMonth} className="flex items-center px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md text-white transition-colors text-sm font-medium">
                <TrashIcon className="w-5 h-5 mr-2"/>
                Borrar Mes Actual
            </button>
            <button onClick={handleSave} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors">
                <PencilIcon className="w-5 h-5 mr-2"/>
                Guardar Cambios del Mes
            </button>
        </div>
    </div>
  );
};


const ServiceTemplateManager: React.FC<{
    templates: ServiceTemplate[];
    onAdd: (template: ServiceTemplate) => void;
    onUpdate: (template: ServiceTemplate) => void;
    onRemove: (templateId: string) => void;
    personnelList: Personnel[];
    unitList: string[];
}> = ({ templates, onAdd, onUpdate, onRemove, personnelList, unitList }) => {
    const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | 'new' | null>(null);

    const handleSave = (templateToSave: ServiceTemplate) => {
        if (editingTemplate === 'new') {
            onAdd(templateToSave);
        } else {
            onUpdate(templateToSave);
        }
        setEditingTemplate(null);
    };

    return (
        <div className="bg-gray-800/60 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BookmarkIcon className="w-6 h-6 text-yellow-300"/>
                    Gestión de Plantillas de Servicio
                </h3>
                {!editingTemplate && (
                    <button 
                        onClick={() => setEditingTemplate('new')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        Crear Nueva Plantilla
                    </button>
                )}
            </div>

            {editingTemplate && (
                <TemplateEditorForm
                    key={typeof editingTemplate === 'object' ? editingTemplate.templateId : 'new-template-editor'}
                    template={typeof editingTemplate === 'object' ? editingTemplate : null}
                    onSave={handleSave}
                    onCancel={() => setEditingTemplate(null)}
                    personnelList={personnelList}
                    unitList={unitList}
                />
            )}

            <div className="mt-6 space-y-3">
                {templates.map(template => (
                     <div key={template.templateId} className="bg-gray-700/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-grow">
                            <h4 className="font-bold text-lg text-yellow-300">{template.title}</h4>
                            {template.description && <p className="text-sm text-gray-400 mt-1">{template.description}</p>}
                            {template.novelty && (
                                <div className="mt-2 p-2 bg-yellow-900/20 border-l-2 border-yellow-700 text-sm italic text-yellow-200">
                                    {template.novelty}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                            <button
                                onClick={() => setEditingTemplate(JSON.parse(JSON.stringify(template)))}
                                className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-800"
                                aria-label="Editar plantilla"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm(`¿Seguro que quieres eliminar la plantilla "${template.title}"?`)) {
                                        onRemove(template.templateId);
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-800"
                                aria-label="Eliminar plantilla"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TemplateEditorForm: React.FC<{
    template: ServiceTemplate | null;
    onSave: (template: ServiceTemplate) => void;
    onCancel: () => void;
    personnelList: Personnel[];
    unitList: string[];
}> = ({ template, onSave, onCancel, personnelList, unitList }) => {
    const defaultTemplate: ServiceTemplate = {
        templateId: `new-template-${Date.now()}`,
        id: `service-${Date.now()}`,
        title: 'Nueva Plantilla de Servicio',
        isHidden: false,
        assignments: [],
    };
    
    const [editableTemplate, setEditableTemplate] = useState<ServiceTemplate>(() => 
        template ? JSON.parse(JSON.stringify(template)) : defaultTemplate
    );
    
    const [personnelDropdownOpenFor, setPersonnelDropdownOpenFor] = useState<number | null>(null);
    const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');
    const personnelSearchInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, assignmentIndex?: number) => {
        const { name, value } = e.target;
        setEditableTemplate(prev => {
            if (assignmentIndex !== undefined) {
                const newAssignments = [...prev.assignments];
                const currentAssignment = { ...newAssignments[assignmentIndex] };
                (currentAssignment as any)[name] = value;
                newAssignments[assignmentIndex] = currentAssignment;
                return { ...prev, assignments: newAssignments };
            }
            return { ...prev, [name]: value };
        });
    };
    
    const handleAddAssignment = () => {
        const newAssignment: Assignment = {
            id: `new-assign-${Date.now()}`, location: 'Nueva Ubicación', time: '00:00 Hs.',
            implementationTime: '', personnel: 'A designar', details: [],
        };
        setEditableTemplate(prev => ({ ...prev, assignments: [...prev.assignments, newAssignment] }));
    };
    
    const handleRemoveAssignment = (indexToRemove: number) => {
        setEditableTemplate(prev => ({ ...prev, assignments: prev.assignments.filter((_, index) => index !== indexToRemove) }));
    };

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>, assignmentIndex: number, detailIndex: number) => {
        const { value } = e.target;
        setEditableTemplate(prev => {
            const newAssignments = [...prev.assignments];
            const newDetails = [...(newAssignments[assignmentIndex].details || [])];
            newDetails[detailIndex] = value;
            newAssignments[assignmentIndex] = { ...newAssignments[assignmentIndex], details: newDetails };
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleAddDetail = (assignmentIndex: number) => {
        setEditableTemplate(prev => {
            const newAssignments = [...prev.assignments];
            const currentDetails = newAssignments[assignmentIndex].details || [];
            newAssignments[assignmentIndex] = { ...newAssignments[assignmentIndex], details: [...currentDetails, ''] };
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleRemoveDetail = (assignmentIndex: number, detailIndex: number) => {
        setEditableTemplate(prev => {
            const newAssignments = [...prev.assignments];
            const newDetails = [...(newAssignments[assignmentIndex].details || [])];
            newDetails.splice(detailIndex, 1);
            newAssignments[assignmentIndex] = { ...newAssignments[assignmentIndex], details: newDetails };
            return { ...prev, assignments: newAssignments };
        });
    };

    const handleAddPersonnelToDetails = (assignmentIndex: number, person: Personnel) => {
        const personDetailString = `${person.rank} L.P. ${person.id} ${person.name}`;
        setEditableTemplate(prev => {
            const newAssignments = prev.assignments.map((assignment, idx) => {
                if (idx === assignmentIndex) {
                    const currentDetails = Array.isArray(assignment.details) ? assignment.details.filter(d => d.trim() !== '') : [];
                    return { ...assignment, details: [...currentDetails, personDetailString]};
                }
                return assignment;
            });
            return { ...prev, assignments: newAssignments };
        });
        setPersonnelSearchTerm('');
        personnelSearchInputRefs.current[assignmentIndex]?.focus();
    };

    return (
        <div className="bg-gray-900/50 rounded-xl shadow-lg mb-8 p-6 animate-fade-in border border-blue-800">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
              {template ? 'Editando Plantilla' : 'Creando Nueva Plantilla'}
          </h3>
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor={`title-${editableTemplate.templateId}`} className="block text-sm font-medium text-gray-300 mb-1">Título de la Plantilla</label>
              <input
                  type="text" id={`title-${editableTemplate.templateId}`} name="title" value={editableTemplate.title} onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`description-${editableTemplate.templateId}`} className="block text-sm font-medium text-gray-300 mb-1">Descripción (Opcional)</label>
              <textarea
                  id={`description-${editableTemplate.templateId}`} name="description" value={editableTemplate.description || ''} onChange={handleInputChange} rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`novelty-${editableTemplate.templateId}`} className="block text-sm font-medium text-gray-300 mb-1">Novedad (Opcional)</label>
              <textarea
                  id={`novelty-${editableTemplate.templateId}`} name="novelty" value={editableTemplate.novelty || ''} onChange={handleInputChange} rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mb-4 border-t border-gray-700 pt-4">
            <h4 className="text-lg font-semibold text-yellow-300">Asignaciones de la Plantilla</h4>
            <button onClick={handleAddAssignment} className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors text-sm">
                <PlusCircleIcon className="w-4 h-4" /> Añadir Asignación
            </button>
          </div>
          <div className="space-y-6">
              {editableTemplate.assignments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No hay asignaciones para esta plantilla.</div>
              ) : ( editableTemplate.assignments.map((assignment, index) => (
                  <div key={assignment.id} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700 relative">
                      <button onClick={() => handleRemoveAssignment(index)} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-1 rounded-full bg-gray-900/50 hover:bg-gray-800 transition-colors" aria-label="Eliminar asignación">
                          <TrashIcon className="w-5 h-5" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                          {/* Location, Time, Implementation Time, Personnel, Unit */}
                           <div className="md:col-span-2">
                              <label htmlFor={`location-${index}-${editableTemplate.id}`} className="text-sm text-gray-400">Ubicación</label>
                              <input type="text" id={`location-${index}-${editableTemplate.id}`} name="location" value={assignment.location} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                          </div>
                          <div>
                              <label htmlFor={`time-${index}-${editableTemplate.id}`} className="text-sm text-gray-400">Horario de Servicio</label>
                              <input type="text" id={`time-${index}-${editableTemplate.id}`} name="time" value={assignment.time} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                          </div>
                          <div>
                              <label htmlFor={`implementationTime-${index}-${editableTemplate.id}`} className="text-sm text-gray-400">Horario de Implantación</label>
                              <input type="text" id={`implementationTime-${index}-${editableTemplate.id}`} name="implementationTime" value={assignment.implementationTime || ''} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                          </div>
                          <div className="md:col-span-2">
                              <label htmlFor={`personnel-${index}-${editableTemplate.id}`} className="text-sm text-gray-400">Personal</label>
                              <input type="text" id={`personnel-${index}-${editableTemplate.id}`} name="personnel" value={assignment.personnel} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white"/>
                          </div>
                          <div className="md:col-span-2">
                              <label htmlFor={`unit-${index}-${editableTemplate.id}`} className="text-sm text-gray-400">Unidad (Opcional)</label>
                              <select id={`unit-${index}-${editableTemplate.id}`} name="unit" value={assignment.unit || ''} onChange={(e) => handleInputChange(e, index)} className="mt-1 w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white">
                                  <option value="">Ninguna</option>
                                  {unitList.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                          </div>
                          <div className="md:col-span-2">
                              <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm text-gray-400">Detalles y Personal Adicional</label>
                                  <button type="button" onClick={() => personnelSearchInputRefs.current[index]?.focus()} className="flex items-center gap-1 text-xs px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded-md text-white font-medium transition-colors">
                                      <PlusCircleIcon className="w-4 h-4" /> Añadir Personal
                                  </button>
                              </div>
                              <div className="relative">
                                  <input type="text" placeholder="Buscar personal para añadir a detalles..." ref={el => { personnelSearchInputRefs.current[index] = el; }} value={personnelSearchTerm} onChange={e => setPersonnelSearchTerm(e.target.value)} onFocus={() => setPersonnelDropdownOpenFor(index)} onBlur={() => setTimeout(() => setPersonnelDropdownOpenFor(null), 200)} className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-white mb-2" />
                                  {personnelDropdownOpenFor === index && (
                                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                          <ul className="divide-y divide-gray-700">
                                              {personnelList.filter(p => p.name.toLowerCase().includes(personnelSearchTerm.toLowerCase()) || p.rank.toLowerCase().includes(personnelSearchTerm.toLowerCase()) || p.id.toLowerCase().includes(personnelSearchTerm.toLowerCase())).map(p => (
                                                  <li key={p.id} onMouseDown={() => handleAddPersonnelToDetails(index, p)} className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 flex justify-between items-center">
                                                      <div><div className="font-bold text-white">{p.name}</div><div className="text-xs text-yellow-400">{p.rank}</div></div>
                                                      <div className="text-xs text-gray-400 font-mono">L.P. {p.id}</div>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}
                              </div>
                              <div className="space-y-2">
                                {(assignment.details || []).map((detail, detailIndex) => (
                                    <div key={detailIndex} className="flex items-center gap-2 animate-fade-in">
                                        <input type="text" value={detail} onChange={(e) => handleDetailChange(e, index, detailIndex)} className="w-full bg-gray-700 border-gray-600 rounded-md px-2 py-1 text-white" placeholder={`Línea de detalle ${detailIndex + 1}`} />
                                        <button type="button" onClick={() => handleRemoveDetail(index, detailIndex)} className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-800 transition-colors" aria-label="Eliminar detalle"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                ))}
                              </div>
                              <button type="button" onClick={() => handleAddDetail(index)} className="mt-3 flex items-center gap-2 text-xs px-2 py-1 bg-sky-600 hover:bg-sky-500 rounded-md text-white font-medium transition-colors">
                                  <PlusCircleIcon className="w-4 h-4" /> Añadir Línea de Detalle
                              </button>
                          </div>
                      </div>
                  </div>
              ))
          )}
          </div>
          <div className="flex justify-end space-x-4 mt-8">
              <button onClick={onCancel} className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white transition-colors">
                  <XCircleIcon className="w-5 h-5 mr-2"/> Cancelar
              </button>
              <button onClick={() => onSave(editableTemplate)} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors">
                  <PencilIcon className="w-5 h-5 mr-2"/> Guardar Plantilla
              </button>
          </div>
        </div>
    );
};


const Nomenclador: React.FC<NomencladorProps> = (props) => {
   const allPersonnel = useMemo(() => {
    const combined = [...props.servicePersonnel, ...props.commandPersonnel];
    const uniquePersonnel = Array.from(new Map(combined.map(p => [p.id, p])).values());
    return uniquePersonnel.sort((a, b) => a.name.localeCompare(b.name));
  }, [props.servicePersonnel, props.commandPersonnel]);

  return (
    <div className="animate-fade-in space-y-8">
        <div className="bg-gray-800/60 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Organigrama del Cuerpo de Bomberos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organigramaImages.map((src, index) => (
                    <img key={index} src={src} alt={`Organigrama parte ${index + 1}`} className="w-full h-auto rounded-lg shadow-md" />
                ))}
            </div>
        </div>
        <RosterEditor 
          roster={props.roster}
          onUpdateRoster={props.onUpdateRoster}
          personnelList={props.commandPersonnel}
        />
        <ServiceTemplateManager
            templates={props.serviceTemplates}
            onAdd={props.onAddTemplate}
            onUpdate={props.onUpdateTemplate}
            onRemove={props.onRemoveTemplate}
            personnelList={allPersonnel}
            unitList={props.units}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <EditablePersonnelList
                title="Personal de Línea de Guardia"
                items={props.commandPersonnel}
                onAddItem={props.onAddCommandPersonnel}
                onUpdateItem={props.onUpdateCommandPersonnel}
                onRemoveItem={props.onRemoveCommandPersonnel}
                extraFieldsToShow={['poc']}
            />
             <EditablePersonnelList
                title="Personal de Servicios"
                items={props.servicePersonnel}
                onAddItem={props.onAddServicePersonnel}
                onUpdateItem={props.onUpdateServicePersonnel}
                onRemoveItem={props.onRemoveServicePersonnel}
                extraFieldsToShow={['station', 'detachment', 'poc', 'part']}
            />
        </div>
        <div className="max-w-xl mx-auto">
            <UnitList
                items={props.units}
                onUpdateItems={props.onUpdateUnits}
            />
        </div>
    </div>
  );
};

export default Nomenclador;