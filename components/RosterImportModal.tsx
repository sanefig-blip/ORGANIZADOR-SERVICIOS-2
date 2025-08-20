
import React from 'react';
import { XIcon, DownloadIcon, UploadIcon } from './icons';
import { exportRosterTemplate } from '../services/exportService';

interface RosterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const RosterImportModal: React.FC<RosterImportModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const exampleJson = `{
  "2025-08-01": {
    "jefeInspecciones": "Apellido, Nombre",
    "jefeServicio": "Apellido, Nombre",
    "jefeGuardia": "Apellido, Nombre",
    "jefeReserva": "Apellido, Nombre"
  },
  "2025-08-02": {
    "jefeServicio": "Otro Apellido, Nombre"
  }
}`;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Importar Rol de Guardia Mensual</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 md:p-8 overflow-y-auto space-y-6 text-gray-300">
          <p>
            Para actualizar el rol de guardia, sube un archivo JSON con la información del mes. La aplicación fusionará estos datos con el rol existente.
          </p>

          <section>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Formato del Archivo JSON</h3>
            <p className="mb-4">
              El archivo debe ser un objeto JSON. Cada clave debe ser una fecha en formato <code className="bg-gray-900 px-1 rounded">YYYY-MM-DD</code>, y su valor debe ser un objeto con los roles y nombres del personal asignado. No es necesario incluir todos los roles para cada día.
            </p>
            <pre className="bg-gray-900/70 p-4 rounded-md border border-gray-700 text-sm text-yellow-200 overflow-x-auto">
              <code>{exampleJson}</code>
            </pre>
          </section>

          <p>
            Puedes descargar una plantilla para asegurarte de que el formato es correcto.
          </p>
        </main>
        
        <footer className="p-4 bg-gray-900/50 border-t border-gray-700 flex flex-wrap justify-between items-center gap-4">
          <button
            onClick={exportRosterTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-md transition-colors"
          >
            <DownloadIcon className="w-5 h-5" />
            Descargar Plantilla
          </button>
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white font-semibold transition-colors">
              Cancelar
            </button>
            <button 
              onClick={onConfirm} 
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors">
              <UploadIcon className="w-5 h-5"/>
              Seleccionar Archivo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RosterImportModal;