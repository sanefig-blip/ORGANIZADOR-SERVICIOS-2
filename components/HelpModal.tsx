import React from 'react';
import { XIcon, DownloadIcon } from './icons.tsx';
import { exportExcelTemplate, exportWordTemplate } from '../services/exportService.ts';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    unitList: string[];
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, unitList }) => {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in"
        onClick={handleContentClick}
      >
        <header className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Guía de Ayuda de la Aplicación</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 md:p-8 overflow-y-auto space-y-8 text-gray-300">
          <section>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Vistas Principales</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Vista General:</strong> Muestra todos los servicios planificados. Aquí puedes editar, añadir, mover, ocultar y exportar los servicios del día.</li>
              <li><strong className="text-white">Vista por Hora:</strong> Agrupa todas las asignaciones de los servicios visibles por su horario de inicio, facilitando la visualización cronológica de las tareas.</li>
              <li><strong className="text-white">Nomencladores:</strong> Permite gestionar las listas predefinidas de "Personal" y "Unidades" que se utilizan en los menús desplegables al editar un servicio.</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Gestión de Servicios</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Añadir/Editar:</strong> Usa el botón "Añadir Servicio" o el ícono del lápiz en un servicio existente. Puedes modificar títulos, descripciones, novedades y cada detalle de las asignaciones.</li>
              <li><strong className="text-white">Mover:</strong> Utiliza las flechas arriba y abajo en cada servicio para reordenarlos en la vista general.</li>
              <li><strong className="text-white">Seleccionar y Ocultar/Mostrar:</strong> Marca la casilla de uno o más servicios. Aparecerá un botón para "Ocultar Seleccionados". Los servicios ocultos no se mostrarán en las vistas ni en las exportaciones, pero puedes seleccionarlos desde la sección "Servicios Ocultos" para volver a mostrarlos.</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Importar Archivo (Excel o Word)</h3>
            <p className="mb-4">
              Esta función permite añadir o reemplazar los servicios actuales cargando un archivo Excel (<code className="bg-gray-900 px-1 rounded">.xlsx</code>) o Word (<code className="bg-gray-900 px-1 rounded">.docx</code>). Al seleccionar el archivo, la aplicación te preguntará si deseas <strong className="text-white">"Añadir"</strong> los nuevos servicios a los existentes o <strong className="text-white">"Reemplazar"</strong> todo el horario.
            </p>
            <h4 className="font-semibold text-white mb-2">Formato del Archivo Excel:</h4>
            <p className="mb-3">El archivo debe contener una hoja con las siguientes columnas. Las filas se agrupan automáticamente en servicios basados en el "Título del Servicio".</p>
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 text-sm">
              <ul className="space-y-1">
                <li><code className="text-yellow-300">Título del Servicio</code> (Requerido para agrupar)</li>
                <li><code className="text-yellow-300">Descripción del Servicio</code> (Opcional)</li>
                <li><code className="text-yellow-300">Novedad del Servicio</code> (Opcional)</li>
                <li><code className="text-yellow-300">Ubicación de Asignación</code> (Requerido)</li>
                <li><code className="text-yellow-300">Horario de Asignación</code> (Requerido)</li>
                <li><code className="text-yellow-300">Personal de Asignación</code> (Requerido)</li>
                <li><code className="text-yellow-300">Unidad de Asignación</code> (Opcional)</li>
                <li><code className="text-yellow-300">Detalles de Asignación</code> (Opcional, separa con <code className="bg-gray-700 px-1 rounded">;</code> o saltos de línea)</li>
              </ul>
            </div>
            <h4 className="font-semibold text-white mt-6 mb-2">Formato del Archivo Word:</h4>
            <p className="mb-3">El archivo debe seguir un formato simple de <strong className="text-white">Clave: Valor</strong> en cada línea. Las asignaciones se agrupan bajo el mismo "Título del Servicio". La nueva plantilla descargable incluye listas de personal y unidades para facilitar el copiado y pegado de datos correctos.</p>
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 font-mono text-xs">
                <p><span className="text-yellow-300">Título del Servicio:</span> Ejemplo Servicio 1</p>
                <p><span className="text-yellow-300">Ubicación de Asignación:</span> Lugar A</p>
                <p><span className="text-yellow-300">Horario de Asignación:</span> 08:00 Hs.</p>
                <p>...</p>
            </div>
             <div className="mt-6 flex flex-wrap gap-4">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors"
                onClick={() => exportExcelTemplate()}
                aria-label="Descargar plantilla de Excel de ejemplo"
              ><DownloadIcon className="w-5 h-5"/>Descargar Plantilla Excel</button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
                onClick={() => exportWordTemplate(unitList)}
                aria-label="Descargar plantilla de Word de ejemplo"
              ><DownloadIcon className="w-5 h-5"/>Descargar Plantilla Word</button>
            </div>
          </section>
          <section>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Exportar a Word</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Exportar General:</strong> Genera un documento <code className="bg-gray-900 px-1 rounded">.docx</code> con el formato de la orden de servicio tradicional, incluyendo la línea de guardia y todos los servicios visibles.</li>
              <li><strong className="text-white">Exportar por Hora:</strong> Genera un documento <code className="bg-gray-900 px-1 rounded">.docx</code> que agrupa todas las asignaciones por hora, similar a la "Vista por Hora".</li>
            </ul>
          </section>
          <section>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Controles Adicionales</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Selector de Fecha:</strong> Ubicado bajo el título "Línea de Guardia", permite cambiar la fecha que aparecerá en los documentos exportados.</li>
              <li><strong className="text-white">Reiniciar Datos (ícono de refrescar):</strong> Borra todos los datos del horario y nomencladores guardados en tu navegador y los restaura a los valores por defecto. <strong className="text-red-400">¡Esta acción no se puede deshacer!</strong></li>
            </ul>
          </section>
        </main>
        <footer className="p-4 bg-gray-900/50 border-t border-gray-700 flex-shrink-0 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors">Cerrar</button>
        </footer>
      </div>
    </div>
  );
};

export default HelpModal;
