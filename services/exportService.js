import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType, UnderlineType, AlignmentType, ShadingType, PageBreak } from 'docx';
import * as XLSX from 'xlsx';

// Helper to save files
const saveFile = (data, fileName, fileType) => {
    const blob = new Blob([data], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- STYLES ---
const LABEL_STYLE = { bold: true, font: "Arial", size: 22 }; // 11pt
const CONTENT_STYLE = { font: "Arial", size: 22 }; // 11pt
const ITALIC_CONTENT_STYLE = { ...CONTENT_STYLE, italics: true };
const ITALIC_PLACEHOLDER_STYLE = { ...ITALIC_CONTENT_STYLE, color: "555555" };
const HEADING_2_RUN_STYLE = { size: 28, bold: true, font: "Arial", color: "000000", underline: { type: UnderlineType.SINGLE }};


// Helper function to create assignment paragraphs, avoiding code duplication.
const createAssignmentParagraphs = (assignment, includeServiceTitle) => {
    const eventSubtitle = (assignment.details || []).find(detail =>
        /^\d+-\s*O\.S\./.test(detail.trim())
    );
    const otherDetails = (assignment.details || []).filter(detail => detail !== eventSubtitle);

    const detailParagraphs = otherDetails.map(detail =>
        new Paragraph({
            children: [new TextRun({ text: detail.trim(), ...ITALIC_CONTENT_STYLE })],
            indent: { left: 400 },
            spacing: { after: 0 }
        })
    );

    const paragraphs = [];

    if (includeServiceTitle && assignment.serviceTitle) {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({ text: "Servicio: ", ...LABEL_STYLE }),
                new TextRun({ text: assignment.serviceTitle, ...ITALIC_CONTENT_STYLE })
            ],
             spacing: { before: 200 }
        }));
    }
    
    if (assignment.novelty) {
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({ text: "Novedad: ", ...LABEL_STYLE, color: "000000" }),
                    new TextRun({ text: assignment.novelty, ...ITALIC_CONTENT_STYLE, color: "000000" })
                ],
                shading: { type: ShadingType.CLEAR, fill: "FFFF00" },
                spacing: { after: 100 }
            })
        );
    }

    if (eventSubtitle) {
        const cleanSubtitle = eventSubtitle.replace(/^\d+-\s*O\.S\.\d+\s*/, '').trim();
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: cleanSubtitle, bold: true, ...ITALIC_CONTENT_STYLE })],
            spacing: { before: 100, after: 100 }
        }));
    }

    paragraphs.push(
        new Paragraph({
            children: [new TextRun({ text: assignment.location, bold: true, size: 24, font: "Arial", underline: { type: UnderlineType.SINGLE, color: "000000"} })],
            spacing: { before: includeServiceTitle || eventSubtitle ? 100 : 200 }
        })
    );

    if (assignment.implementationTime) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: assignment.implementationTime, bold: true, ...CONTENT_STYLE })] }));
    }

    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Horario: ", ...LABEL_STYLE }), new TextRun({text: assignment.time, ...CONTENT_STYLE })] }));
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Personal: ", ...LABEL_STYLE }), new TextRun({text: assignment.personnel, ...CONTENT_STYLE })] }));

    if (assignment.unit) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Unidad: ", ...LABEL_STYLE }), new TextRun({text: assignment.unit, ...CONTENT_STYLE })] }));
    }

    paragraphs.push(...detailParagraphs);
    return paragraphs;
};


export const exportScheduleToWord = (schedule) => {
    const createServiceSection = (services, title) => {
        if (!services || services.length === 0) return [];

        const serviceContent = services.filter(s => !s.isHidden).flatMap(service => {
            const assignmentsContent = service.assignments.flatMap(assignment => createAssignmentParagraphs(assignment, false));

            const serviceParagraphs = [
                new Paragraph({ text: service.title, style: "Heading2" }),
                ...(service.description ? [new Paragraph({
                    children: [new TextRun({ text: service.description, ...ITALIC_CONTENT_STYLE })],
                    spacing: { after: 100 }
                })] : []),
            ];

            if (service.novelty) {
                serviceParagraphs.push(
                     new Paragraph({
                        children: [
                            new TextRun({ text: "Novedad: ", ...LABEL_STYLE, color: "000000" }),
                            new TextRun({ text: service.novelty, ...ITALIC_CONTENT_STYLE, color: "000000" })
                        ],
                        shading: { type: ShadingType.CLEAR, fill: "FFFF00" },
                        spacing: { after: 100 }
                    })
                );
            }

            return [...serviceParagraphs, ...assignmentsContent];
        });
        
        if (title && serviceContent.length > 0) {
            return [new Paragraph({ text: title, style: "Heading1", alignment: AlignmentType.LEFT }), ...serviceContent];
        }
        return serviceContent;
    };
    
    const commandStaffRows = schedule.commandStaff.map(officer => {
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: officer.role, ...CONTENT_STYLE })]})], width: { size: 30, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: officer.rank || 'OTRO', ...CONTENT_STYLE })]})], width: { size: 30, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: officer.name, ...CONTENT_STYLE })]})], width: { size: 40, type: WidthType.PERCENTAGE } }),
            ],
        });
    });

    const commandStaffTable = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rol", ...LABEL_STYLE })]})] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jerarquía", ...LABEL_STYLE })]})] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nombre", ...LABEL_STYLE })]})] }),
                ],
                tableHeader: true,
            }),
            ...commandStaffRows
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
    
    const regularServicesContent = createServiceSection(schedule.services);
    const sportsEventsContent = createServiceSection(schedule.sportsEvents, "EVENTOS DEPORTIVOS");

    const doc = new Document({
        creator: "Servicios del Cuerpo de Bomberos de la Ciudad",
        title: `Orden de Servicio - ${schedule.date}`,
        styles: {
            paragraphStyles: [
                { id: "Heading1", name: "Heading 1", run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { after: 240 }, alignment: AlignmentType.CENTER } },
                { id: "Heading2", name: "Heading 2", run: HEADING_2_RUN_STYLE, paragraph: { spacing: { before: 240, after: 120 } } },
            ],
        },
        sections: [{ children: [
            new Paragraph({ text: `ORDEN DE SERVICIO DIARIA`, style: "Heading1" }),
            new Paragraph({ text: `GUARDIA DEL DIA ${schedule.date}`, alignment: AlignmentType.CENTER, spacing: { after: 400 }}),
            new Paragraph({ text: "LÍNEA DE GUARDIA", style: "Heading2" }),
            commandStaffTable,
            new Paragraph({ text: "", spacing: { after: 200 }}),
            ...regularServicesContent,
            ...(sportsEventsContent.length > 0 ? [new Paragraph({ children: [new PageBreak()] })] : []),
            ...sportsEventsContent,
        ]}]
    });

    Packer.toBlob(doc).then(blob => saveFile(blob, `Orden_de_Servicio_${schedule.date.replace(/\s/g, '_')}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
};

export const exportScheduleByTimeToWord = ({ date, assignmentsByTime }) => {
    const sortedTimeKeys = Object.keys(assignmentsByTime).sort((a, b) => parseInt(a.split(':')[0], 10) - parseInt(b.split(':')[0], 10));
    const content = sortedTimeKeys.flatMap(time => [ new Paragraph({ text: `Horario: ${time}`, style: "Heading2" }), ...assignmentsByTime[time].flatMap(assignment => createAssignmentParagraphs(assignment, true))]);

    const doc = new Document({
        creator: "Servicios del Cuerpo de Bomberos de la Ciudad",
        title: `Orden de Servicio por Hora - ${date}`,
        styles: {
            paragraphStyles: [
                 { id: "Heading1", name: "Heading 1", run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { after: 240 }, alignment: AlignmentType.CENTER } },
                 { id: "Heading2", name: "Heading 2", run: HEADING_2_RUN_STYLE, paragraph: { spacing: { before: 240, after: 120 } } },
            ],
        },
        sections: [{ children: [
            new Paragraph({ text: `ORDEN DE SERVICIO DIARIA POR HORA`, style: "Heading1" }),
            new Paragraph({ text: `GUARDIA DEL DIA ${date}`, alignment: AlignmentType.CENTER, spacing: { after: 400 }}),
            ...content,
        ]}]
    });
    Packer.toBlob(doc).then(blob => saveFile(blob, `Orden_de_Servicio_por_Hora_${date.replace(/\s/g, '_')}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
};

export const exportExcelTemplate = () => {
    const headers = ["Título del Servicio", "Descripción del Servicio", "Novedad del Servicio", "Ubicación de Asignación", "Horario de Asignación", "Personal de Asignación", "Unidad de Asignación", "Detalles de Asignación"];
    const exampleRow = ["EVENTOS DEPORTIVOS", "O.S. 1234/25", "Presentarse con uniforme de gala.", "Estadio Monumental", "18:00 Hs. a terminar.-", "Personal a designar", "FZ-1234", "Encuentro Futbolístico 'EQUIPO A VS. EQUIPO B';HORARIO DE IMPLANTACION: 16:00 Hs."];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla de Servicios');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveFile(excelBuffer, 'plantilla_servicios.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const exportScheduleAsExcelTemplate = (schedule) => {
    const createSheetData = (services) => {
      if (!services || services.length === 0) return [];
      const data = [];
      services.forEach(service => {
        if (service.assignments.length === 0) data.push({ "Título del Servicio": service.title, "Descripción del Servicio": service.description || '', "Novedad del Servicio": service.novelty || '' });
        else service.assignments.forEach(assignment => {
            const allDetails = [];
            if (assignment.implementationTime) allDetails.push(assignment.implementationTime);
            if (assignment.details) allDetails.push(...assignment.details);
            data.push({ "Título del Servicio": service.title, "Descripción del Servicio": service.description || '', "Novedad del Servicio": service.novelty || '', "Ubicación de Asignación": assignment.location, "Horario de Asignación": assignment.time, "Personal de Asignación": assignment.personnel, "Unidad de Asignación": assignment.unit || '', "Detalles de Asignación": allDetails.join('; ') });
        });
      });
      return data;
    };
    
    const commonServicesData = createSheetData(schedule.services);
    const sportsEventsData = createSheetData(schedule.sportsEvents);
    
    const workbook = XLSX.utils.book_new();
    if (commonServicesData.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(commonServicesData), 'Servicios Comunes');
    if (sportsEventsData.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sportsEventsData), 'Eventos Deportivos');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveFile(excelBuffer, `plantilla_desde_horario_${schedule.date.replace(/\s/g, '_')}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

export const exportScheduleAsWordTemplate = (schedule) => {
    const createTemplateSection = (services, title) => {
        if (!services || services.length === 0) return [];
        
        const sectionContent = services.flatMap(service => {
            const processAssignment = (assignment) => {
                const paragraphs = [
                    new Paragraph({ children: [new TextRun({ text: "Título del Servicio: ", ...LABEL_STYLE }), new TextRun({ text: service.title, ...CONTENT_STYLE })] }),
                    new Paragraph({ children: [new TextRun({ text: "Descripción del Servicio: ", ...LABEL_STYLE }), new TextRun({ text: service.description || '', ...CONTENT_STYLE })] }),
                    new Paragraph({ children: [new TextRun({ text: "Novedad del Servicio: ", ...LABEL_STYLE }), new TextRun({ text: service.novelty || '', ...CONTENT_STYLE })] }),
                ];

                if (assignment) {
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Ubicación de Asignación: ", ...LABEL_STYLE }), new TextRun({ text: assignment.location, ...CONTENT_STYLE })] }));
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Horario de Asignación: ", ...LABEL_STYLE }), new TextRun({ text: assignment.time, ...CONTENT_STYLE })] }));
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Personal de Asignación: ", ...LABEL_STYLE }), new TextRun({ text: assignment.personnel, ...CONTENT_STYLE })] }));
                    if (assignment.unit) paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Unidad de Asignación: ", ...LABEL_STYLE }), new TextRun({ text: assignment.unit, ...CONTENT_STYLE })] }));
                    
                    const allDetails = [];
                    if (assignment.implementationTime) allDetails.push(assignment.implementationTime);
                    if (assignment.details) allDetails.push(...assignment.details);
                    if (allDetails.length > 0) paragraphs.push(new Paragraph({ children: [new TextRun({ text: "Detalles de Asignación: ", ...LABEL_STYLE }), new TextRun({ text: allDetails.join('; '), ...CONTENT_STYLE })] }));
                }
                
                paragraphs.push(new Paragraph({ text: "---", alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 } }));
                return paragraphs;
            };

            return service.assignments.length === 0 ? processAssignment() : service.assignments.flatMap(processAssignment);
        });

        if (sectionContent.length > 0) sectionContent[sectionContent.length - 1] = new Paragraph({ text: "" }); // Remove last separator
        
        return [new Paragraph({ text: title, style: "Heading1" }), ...sectionContent];
    };

    const commonServicesSection = createTemplateSection(schedule.services, "PLANTILLA DE SERVICIOS COMUNES");
    const sportsEventsSection = createTemplateSection(schedule.sportsEvents, "PLANTILLA DE EVENTOS DEPORTIVOS");

    const doc = new Document({
        creator: "Servicios del Cuerpo de Bomberos de la Ciudad",
        title: `Plantilla desde Horario - ${schedule.date}`,
        styles: { paragraphStyles: [ { id: "Heading1", name: "Heading 1", run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER } }] },
        sections: [{ children: [
            ...commonServicesSection,
            ...(sportsEventsSection.length > 0 && commonServicesSection.length > 0 ? [new Paragraph({ children: [new PageBreak()] })] : []),
            ...sportsEventsSection,
        ]}]
    });

    Packer.toBlob(doc).then(blob => saveFile(blob, `plantilla_desde_horario_${schedule.date.replace(/\s/g, '_')}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
};


export const exportWordTemplate = (unitList) => {
  const createField = (label, placeholder) => new Paragraph({
    children: [new TextRun({ text: `${label}: `, ...LABEL_STYLE }), new TextRun({ text: placeholder, ...ITALIC_PLACEHOLDER_STYLE })],
    spacing: { after: 100 }
  });

  const exampleContent = [
    createField('Título del Servicio', '[Escribe aquí el título]'),
    createField('Descripción del Servicio', '[Escribe aquí la descripción]'),
    new Paragraph({ children: [new TextRun({ text: "Novedad del Servicio: ", ...LABEL_STYLE }), new TextRun({ text: '[Escribe aquí la novedad]', ...ITALIC_PLACEHOLDER_STYLE })], spacing: { after: 300 } }),

    createField('Ubicación de Asignación', '[Escribe aquí la ubicación]'),
    createField('Horario de Asignación', '[Escribe aquí el horario]'),
    createField('Personal de Asignación', '[Escribe aquí el personal]'),
    createField('Unidad de Asignación', '[Escribe aquí la unidad si aplica]'),
    createField('Detalles de Asignación', '[Escribe aquí un detalle]'),
    createField('Detalles de Asignación', '[Puedes añadir más detalles en líneas separadas]'),
    new Paragraph({ children: [new TextRun({ text: '--- (Separa servicios distintos con una nueva línea "Título del Servicio") ---', ...ITALIC_CONTENT_STYLE, color: '888888' })], spacing: { before: 200, after: 200 } })
  ];

  const doc = new Document({
    creator: "Servicios del Cuerpo de Bomberos de la Ciudad",
    title: "Plantilla para Importación de Servicios",
    styles: { paragraphStyles: [
        { id: "Heading1", name: "Heading 1", run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 240 } } },
        { id: "Heading2", name: "Heading 2", run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 300, after: 150 } } },
    ]},
    sections: [{ children: [
        new Paragraph({ text: "Plantilla de Importación de Servicios", style: "Heading1" }),
        new Paragraph({ children: [new TextRun({ text: "Rellena los campos para cada asignación. Para crear un nuevo servicio, simplemente empieza otra vez con 'Título del Servicio:'.", ...ITALIC_CONTENT_STYLE })], spacing: { after: 300 } }),
        ...exampleContent,
        new Paragraph({ text: "Listados de Ayuda", style: "Heading1", spacing: { before: 400 } }),
        new Paragraph({ children: [new TextRun({ text: "Copia y pega los nombres/unidades desde estas listas para asegurar la precisión.", ...ITALIC_CONTENT_STYLE })], spacing: { after: 200 } }),
        new Paragraph({ text: "Unidades Disponibles", style: "Heading2" }),
        ...unitList.map(u => new Paragraph({ text: u, bullet: { level: 0 }})),
    ]}]
  });

  Packer.toBlob(doc).then(blob => saveFile(blob, 'plantilla_servicios_completa.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
};

export const exportRosterTemplate = () => {
    const template = {
        "2025-08-01": { "jefeInspecciones": "APELLIDO, Nombre", "jefeServicio": "APELLIDO, Nombre", "jefeGuardia": "APELLIDO, Nombre", "jefeReserva": "APELLIDO, Nombre" },
        "2025-08-02": { "jefeServicio": "OTRO APELLIDO, Nombre" }
    };
    saveFile(JSON.stringify(template, null, 2), 'plantilla_rol_de_guardia.json', 'application/json');
};
