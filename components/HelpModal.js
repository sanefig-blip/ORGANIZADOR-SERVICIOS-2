import React from 'react';
import { XIcon, DownloadIcon } from './icons.js';
import { exportExcelTemplate, exportWordTemplate } from '../services/exportService.js';

// FIX: Update component signature to accept personnel lists
const HelpModal = ({ isOpen, onClose, unitList, commandPersonnel, servicePersonnel }) => {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    React.createElement("div", {
      className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in",
      "aria-modal": "true",
      role: "dialog",
      onClick: onClose
    },
      React.createElement("div", {
        className: "bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in",
        onClick: handleContentClick
      },
        React.createElement("header", { className: "flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0" },
          React.createElement("h2", { className: "text-2xl font-bold text-white" }, "Guía de Ayuda de la Aplicación"),
          React.createElement("button", { onClick: onClose, className: "p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" },
            React.createElement(XIcon, { className: "w-6 h-6" })
          )
        ),
        React.createElement("main", { className: "p-6 md:p-8 overflow-y-auto space-y-8 text-gray-300" },
          React.createElement("section", null,
            React.createElement("h3", { className: "text-xl font-semibold text-blue-300 mb-3" }, "Vistas Principales"),
            React.createElement("ul", { className: "list-disc list-inside space-y-2" },
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Vista General:"), " Muestra todos los servicios planificados. Aquí puedes editar, añadir, mover, ocultar y exportar los servicios del día."),
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Vista por Hora:"), " Agrupa todas las asignaciones de los servicios visibles por su horario de inicio, facilitando la visualización cronológica de las tareas."),
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Nomencladores:"), " Permite gestionar las listas predefinidas de \"Personal\" y \"Unidades\" que se utilizan en los menús desplegables al editar un servicio.")
            )
          ),
          React.createElement("section", null,
            React.createElement("h3", { className: "text-xl font-semibold text-blue-300 mb-3" }, "Gestión de Servicios"),
            React.createElement("ul", { className: "list-disc list-inside space-y-2" },
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Añadir/Editar:"), " Usa el botón \"Añadir Servicio\" o el ícono del lápiz en un servicio existente. Puedes modificar títulos, descripciones, novedades y cada detalle de las asignaciones."),
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Mover:"), " Utiliza las flechas arriba y abajo en cada servicio para reordenarlos en la vista general."),
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Seleccionar y Ocultar/Mostrar:"), " Marca la casilla de uno o más servicios. Aparecerá un botón para \"Ocultar Seleccionados\". Los servicios ocultos no se mostrarán en las vistas ni en las exportaciones, pero puedes seleccionarlos desde la sección \"Servicios Ocultos\" para volver a mostrarlos.")
            )
          ),
          React.createElement("section", null,
            React.createElement("h3", { className: "text-xl font-semibold text-blue-300 mb-3" }, "Importar Archivo (Excel o Word)"),
            React.createElement("p", { className: "mb-4" },
              "Esta función permite añadir o reemplazar los servicios actuales cargando un archivo Excel (", React.createElement("code", { className: "bg-gray-900 px-1 rounded" }, ".xlsx"), ") o Word (", React.createElement("code", { className: "bg-gray-900 px-1 rounded" }, ".docx"), "). Al seleccionar el archivo, la aplicación te preguntará si deseas ", React.createElement("strong", { className: "text-white" }, "\"Añadir\""), " los nuevos servicios a los existentes o ", React.createElement("strong", { className: "text-white" }, "\"Reemplazar\""), " todo el horario."
            ),
            React.createElement("h4", { className: "font-semibold text-white mb-2" }, "Formato del Archivo Excel:"),
            React.createElement("p", { className: "mb-3" }, "El archivo debe contener una hoja con las siguientes columnas. Las filas se agrupan automáticamente en servicios basados en el \"Título del Servicio\"."),
            React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-md border border-gray-700 text-sm" },
              React.createElement("ul", { className: "space-y-1" },
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Título del Servicio"), " (Requerido para agrupar)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Descripción del Servicio"), " (Opcional)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Novedad del Servicio"), " (Opcional)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Ubicación de Asignación"), " (Requerido)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Horario de Asignación"), " (Requerido)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Personal de Asignación"), " (Requerido)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Unidad de Asignación"), " (Opcional)"),
                React.createElement("li", null, React.createElement("code", { className: "text-yellow-300" }, "Detalles de Asignación"), " (Opcional, separa con ", React.createElement("code", { className: "bg-gray-700 px-1 rounded" }, ";"), " o saltos de línea)")
              )
            ),
            React.createElement("h4", { className: "font-semibold text-white mt-6 mb-2" }, "Formato del Archivo Word:"),
            React.createElement("p", { className: "mb-3" }, "El archivo debe seguir un formato simple de ", React.createElement("strong", { className: "text-white" }, "Clave: Valor"), " en cada línea. Las asignaciones se agrupan bajo el mismo \"Título del Servicio\". La nueva plantilla descargable incluye listas de personal y unidades para facilitar el copiado y pegado de datos correctos."),
            React.createElement("div", { className: "bg-gray-900/50 p-4 rounded-md border border-gray-700 font-mono text-xs" },
                React.createElement("p", null, React.createElement("span", { className: "text-yellow-300" }, "Título del Servicio:"), " Ejemplo Servicio 1"),
                React.createElement("p", null, React.createElement("span", { className: "text-yellow-300" }, "Ubicación de Asignación:"), " Lugar A"),
                React.createElement("p", null, React.createElement("span", { className: "text-yellow-300" }, "Horario de Asignación:"), " 08:00 Hs."),
                React.createElement("p", null, "...")
            ),
             React.createElement("div", { className: "mt-6 flex flex-wrap gap-4" },
              React.createElement("button", {
                className: "inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors",
                onClick: () => exportExcelTemplate(),
                "aria-label": "Descargar plantilla de Excel de ejemplo"
              }, React.createElement(DownloadIcon, { className: "w-5 h-5" }), "Descargar Plantilla Excel"),
              React.createElement("button", {
                className: "inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded-md transition-colors",
                // FIX: Pass all required lists to exportWordTemplate
                onClick: () => exportWordTemplate({ unitList, commandPersonnel, servicePersonnel }),
                "aria-label": "Descargar plantilla de Word de ejemplo"
              }, React.createElement(DownloadIcon, { className: "w-5 h-5" }), "Descargar Plantilla Word")
            )
          ),
          React.createElement("section", null,
            React.createElement("h3", { className: "text-xl font-semibold text-blue-300 mb-3" }, "Exportar a Word"),
            React.createElement("ul", { className: "list-disc list-inside space-y-2" },
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Exportar General:"), " Genera un documento ", React.createElement("code", { className: "bg-gray-900 px-1 rounded" }, ".docx"), " con el formato de la orden de servicio tradicional, incluyendo la línea de guardia y todos los servicios visibles."),
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Exportar por Hora:"), " Genera un documento ", React.createElement("code", { className: "bg-gray-900 px-1 rounded" }, ".docx"), " que agrupa todas las asignaciones por hora, similar a la \"Vista por Hora\".")
            )
          ),
          React.createElement("section", null,
            React.createElement("h3", { className: "text-xl font-semibold text-blue-300 mb-3" }, "Controles Adicionales"),
            React.createElement("ul", { className: "list-disc list-inside space-y-2" },
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Selector de Fecha:"), " Ubicado bajo el título \"Línea de Guardia\", permite cambiar la fecha que aparecerá en los documentos exportados."),
              React.createElement("li", null, React.createElement("strong", { className: "text-white" }, "Reiniciar Datos (ícono de refrescar):"), " Borra todos los datos del horario y nomencladores guardados en tu navegador y los restaura a los valores por defecto. ", React.createElement("strong", { className: "text-red-400" }, "¡Esta acción no se puede deshacer!"))
            )
          )
        ),
        React.createElement("footer", { className: "p-4 bg-gray-900/50 border-t border-gray-700 flex-shrink-0 flex justify-end" },
          React.createElement("button", { onClick: onClose, className: "px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors" }, "Cerrar")
        )
      )
    )
  );
};

export default HelpModal;