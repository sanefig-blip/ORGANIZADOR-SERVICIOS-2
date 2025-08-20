import React from 'react';
import { XIcon, TrashIcon, AnnotationIcon } from './icons.js';

const ServiceTemplateModal = ({ isOpen, onClose, templates, onSelectTemplate, onDeleteTemplate }) => {
  if (!isOpen) return null;

  return (
    React.createElement("div", {
      className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in",
      onClick: onClose,
      "aria-modal": "true",
      role: "dialog"
    },
      React.createElement("div", {
        className: "bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in",
        onClick: e => e.stopPropagation()
      },
        React.createElement("header", { className: "flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0" },
          React.createElement("h2", { className: "text-2xl font-bold text-white" }, "Biblioteca de Plantillas de Servicio"),
          React.createElement("button", { onClick: onClose, className: "p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" },
            React.createElement(XIcon, { className: "w-6 h-6" })
          )
        ),
        
        React.createElement("main", { className: "p-6 md:p-8 overflow-y-auto space-y-4 text-gray-300" },
          templates.length === 0 ? (
            React.createElement("div", { className: "text-center py-12 text-gray-500" },
              React.createElement("p", null, "No hay plantillas guardadas."),
              React.createElement("p", { className: "text-sm mt-2" }, "Puedes guardar un servicio como plantilla usando el ícono de marcador en la vista general.")
            )
          ) : (
            templates.map(template => (
              React.createElement("div", { key: template.templateId, className: "bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" },
                React.createElement("div", { className: "flex-grow" },
                  React.createElement("h3", { className: "font-bold text-lg text-yellow-300" }, template.title),
                  template.description && React.createElement("p", { className: "text-sm text-gray-400 mt-1" }, template.description),
                  template.novelty && (
                     React.createElement("div", { className: "mt-2 text-sm flex items-start p-2 bg-yellow-900/30 border border-yellow-800/50 rounded-md" },
                        React.createElement(AnnotationIcon, { className: "w-4 h-4 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" }),
                        React.createElement("span", { className: "italic text-yellow-300" }, template.novelty)
                     )
                  )
                ),
                React.createElement("div", { className: "flex items-center space-x-2 flex-shrink-0 self-end sm:self-center" },
                  React.createElement("button", { 
                    onClick: () => onSelectTemplate(template),
                    className: "px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-white text-sm font-semibold transition-colors"
                  },
                    "Usar"
                  ),
                  React.createElement("button", { 
                    onClick: () => {
                        if (window.confirm(`¿Estás seguro de que quieres eliminar la plantilla "${template.title}"?`)) {
                            onDeleteTemplate(template.templateId)
                        }
                    },
                    className: "p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-700",
                    "aria-label": "Eliminar plantilla"
                  },
                    React.createElement(TrashIcon, { className: "w-5 h-5" })
                  )
                )
              )
            ))
          )
        ),
        
        React.createElement("footer", { className: "p-4 bg-gray-900/50 border-t border-gray-700 flex-shrink-0 flex justify-end" },
           React.createElement("button", { 
                onClick: onClose, 
                className: "px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors" },
                "Cerrar"
            )
        )
      )
    )
  );
};

export default ServiceTemplateModal;
