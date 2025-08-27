import React from 'react';
import { XIcon, DownloadIcon, UploadIcon } from './icons.js';
import { exportRosterTemplate } from '../services/exportService.js';

const RosterImportModal = ({ isOpen, onClose, onConfirm }) => {
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
    React.createElement("div", {
      className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in",
      onClick: onClose,
      "aria-modal": "true",
      role: "dialog"
    },
      React.createElement("div", {
        className: "bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in",
        onClick: e => e.stopPropagation()
      },
        React.createElement("header", { className: "flex items-center justify-between p-6 border-b border-zinc-700" },
          React.createElement("h2", { className: "text-2xl font-bold text-white" }, "Importar Rol de Guardia Mensual"),
          React.createElement("button", { onClick: onClose, className: "p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors" },
            React.createElement(XIcon, { className: "w-6 h-6" })
          )
        ),

        React.createElement("main", { className: "p-6 md:p-8 overflow-y-auto space-y-6 text-zinc-300" },
          React.createElement("p", null,
            "Para actualizar el rol de guardia, sube un archivo JSON con la información del mes. La aplicación fusionará estos datos con el rol existente."
          ),

          React.createElement("section", null,
            React.createElement("h3", { className: "text-xl font-semibold text-blue-300 mb-3" }, "Formato del Archivo JSON"),
            React.createElement("p", { className: "mb-4" },
              "El archivo debe ser un objeto JSON. Cada clave debe ser una fecha en formato ", React.createElement("code", { className: "bg-zinc-900 px-1 rounded" }, "YYYY-MM-DD"), ", y su valor debe ser un objeto con los roles y nombres del personal asignado. No es necesario incluir todos los roles para cada día."
            ),
            React.createElement("pre", { className: "bg-zinc-900/70 p-4 rounded-md border border-zinc-700 text-sm text-yellow-200 overflow-x-auto" },
              React.createElement("code", null, exampleJson)
            )
          ),

          React.createElement("p", null,
            "Puedes descargar una plantilla para asegurarte de que el formato es correcto."
          )
        ),
        
        React.createElement("footer", { className: "p-4 bg-zinc-900/50 border-t border-zinc-700 flex flex-wrap justify-between items-center gap-4" },
          React.createElement("button", {
            onClick: exportRosterTemplate,
            className: "inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-md transition-colors"
          },
            React.createElement(DownloadIcon, { className: "w-5 h-5" }),
            "Descargar Plantilla"
          ),
          React.createElement("div", { className: "flex gap-4" },
            React.createElement("button", { 
              onClick: onClose, 
              className: "px-6 py-2 bg-zinc-600 hover:bg-zinc-500 rounded-md text-white font-semibold transition-colors" },
              "Cancelar"
            ),
            React.createElement("button", { 
              onClick: onConfirm, 
              className: "inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors" },
              React.createElement(UploadIcon, { className: "w-5 h-5" }),
              "Seleccionar Archivo"
            )
          )
        )
      )
    )
  );
};

export default RosterImportModal;
