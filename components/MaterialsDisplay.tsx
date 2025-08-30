import React, { useState } from 'react';
import { MaterialsData, MaterialLocation, Material } from '../types';
import { PencilIcon, XCircleIcon, TrashIcon, PlusCircleIcon, DownloadIcon } from './icons';
// FIX: Correctly import exportMaterialsReportToPdf
import { exportMaterialsReportToPdf } from '../services/exportService';

interface MaterialsDisplayProps {
  reportData: MaterialsData;
  onUpdateReport: (updatedData: MaterialsData) => void;
}

const getConditionColor = (condition: string) => {
  const c = condition.toLowerCase();
  if (c === 'para servicio') return 'bg-green-600 text-white';
  if (c === 'fuera de servicio') return 'bg-red-600 text-white';
  return 'bg-zinc-500 text-white';
};

const MaterialsDisplay: React.FC<MaterialsDisplayProps> = ({ reportData, onUpdateReport }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableReport, setEditableReport] = useState<MaterialsData | null>(null);

  const handleEdit = () => {
    setEditableReport(JSON.parse(JSON.stringify(reportData)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableReport(null);
  };

  const handleSave = () => {
    if (editableReport) {
      const reportWithDate = { ...editableReport, reportDate: new Date().toLocaleString('es-AR') };
      onUpdateReport(reportWithDate);
    }
    setIsEditing(false);
    setEditableReport(null);
  };

  const handleMaterialChange = (locIdx: number, matIdx: number, field: keyof Material, value: any) => {
    setEditableReport(prev => {
      if (!prev) return null;
      const newReport = JSON.parse(JSON.stringify(prev));
      const material = newReport.locations[locIdx].materials[matIdx];
      if (field === 'quantity') {
        material[field] = parseInt(value, 10) || 0;
      } else {
        (material as any)[field] = value;
      }
      return newReport;
    });
  };

  const handleAddMaterial = (locIdx: number) => {
    setEditableReport(prev => {
      if (!prev) return null;
      const newReport = JSON.parse(JSON.stringify(prev));
      const newMaterial: Material = {
        id: `mat-${Date.now()}`,
        name: 'Nuevo Material',
        quantity: 1,
        condition: 'Para Servicio',
        location: ''
      };
      newReport.locations[locIdx].materials.push(newMaterial);
      return newReport;
    });
  };

  const handleRemoveMaterial = (locIdx: number, matIdx: number) => {
     if (window.confirm("¿Está seguro de que desea eliminar este material?")) {
        setEditableReport(prev => {
            if (!prev) return null;
            const newReport = JSON.parse(JSON.stringify(prev));
            newReport.locations[locIdx].materials.splice(matIdx, 1);
            return newReport;
        });
     }
  };
  
  const data = isEditing ? editableReport : reportData;

  if (!data) return null;

  return (
    <div className="animate-fade-in">
        <div className="mb-6 bg-zinc-800/60 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white">Inventario de Materiales</h2>
                <p className="text-zinc-400">Fecha del reporte: {data.reportDate}</p>
            </div>
             <div className="flex items-center gap-2 self-start sm:self-center">
                 {isEditing ? (
                    <div className="flex items-center gap-2">
                        <button onClick={handleSave} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors flex items-center gap-2"><PencilIcon className="w-5 h-5"/> Guardar</button>
                        <button onClick={handleCancel} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"><XCircleIcon className="w-6 h-6"/></button>
                    </div>
                ) : (
                    <>
                    <button onClick={() => exportMaterialsReportToPdf(reportData)} className="px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-md text-white font-semibold transition-colors flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5"/> Exportar PDF
                    </button>
                    <button onClick={handleEdit} className="px-3 py-2 bg-zinc-600 hover:bg-zinc-500 rounded-md text-white font-semibold transition-colors flex items-center gap-2"><PencilIcon className="w-5 h-5"/> Editar</button>
                    </>
                )}
             </div>
        </div>
        
        <div className="bg-zinc-800/60 p-4 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[800px]">
                <thead className="border-b-2 border-zinc-600">
                    <tr className="text-left text-sm font-semibold text-zinc-300">
                        <th className="p-3 w-1/4">ESTACIÓN / DEST.</th>
                        <th className="p-3">MATERIAL</th>
                        <th className="p-3 w-24 text-center">CANT.</th>
                        <th className="p-3">CONDICIÓN</th>
                        <th className="p-3">UBICACIÓN</th>
                        {isEditing && <th className="p-3 w-12"></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.locations.map((loc, locIdx) => (
                        loc.materials.length > 0 ? (
                            loc.materials.map((mat, matIdx) => (
                                <tr key={mat.id} className="border-t border-zinc-700 hover:bg-zinc-700/50">
                                    {matIdx === 0 && (
                                        <td rowSpan={loc.materials.length} className="p-3 font-semibold text-yellow-300 align-top">
                                            {isEditing ? (
                                                <div className="flex flex-col items-start gap-2">
                                                    <span>{loc.name}</span>
                                                    <button onClick={() => handleAddMaterial(locIdx)} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-white"><PlusCircleIcon className="w-4 h-4"/> Añadir Material</button>
                                                </div>
                                            ) : loc.name}
                                        </td>
                                    )}
                                    {isEditing ? (
                                        <>
                                            <td><input value={mat.name} onChange={e => handleMaterialChange(locIdx, matIdx, 'name', e.target.value)} className="w-full bg-zinc-700 rounded p-1"/></td>
                                            <td className="text-center"><input type="number" value={mat.quantity} onChange={e => handleMaterialChange(locIdx, matIdx, 'quantity', e.target.value)} className="w-20 bg-zinc-700 rounded p-1 text-center"/></td>
                                            <td>
                                                <select value={mat.condition} onChange={e => handleMaterialChange(locIdx, matIdx, 'condition', e.target.value)} className={`w-full border-zinc-600 rounded p-1 font-semibold ${getConditionColor(mat.condition)}`}>
                                                    <option value="Para Servicio">Para Servicio</option>
                                                    <option value="Fuera de Servicio">Fuera de Servicio</option>
                                                </select>
                                            </td>
                                            <td><input value={mat.location || ''} onChange={e => handleMaterialChange(locIdx, matIdx, 'location', e.target.value)} className="w-full bg-zinc-700 rounded p-1"/></td>
                                            <td><button onClick={() => handleRemoveMaterial(locIdx, matIdx)} className="p-1 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 text-zinc-200">{mat.name}</td>
                                            <td className="p-3 text-center font-bold text-white">{mat.quantity}</td>
                                            <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(mat.condition)}`}>{mat.condition}</span></td>
                                            <td className="p-3 text-zinc-300">{mat.location || '-'}</td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr key={loc.name} className="border-t border-zinc-700">
                                <td className="p-3 font-semibold text-yellow-300 align-top">
                                    {isEditing ? (
                                        <div className="flex flex-col items-start gap-2">
                                            <span>{loc.name}</span>
                                            <button onClick={() => handleAddMaterial(locIdx)} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-white"><PlusCircleIcon className="w-4 h-4"/> Añadir Material</button>
                                        </div>
                                    ) : loc.name}
                                </td>
                                <td colSpan={isEditing ? 5 : 4} className="p-3 text-center text-zinc-500 italic">No hay materiales registrados.</td>
                            </tr>
                        )
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default MaterialsDisplay;