
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const MONTH_NAMES = { "ENERO": 0, "FEBRERO": 1, "MARZO": 2, "ABRIL": 3, "MAYO": 4, "JUNIO": 5, "JULIO": 6, "AGOSTO": 7, "SEPTIEMBRE": 8, "OCTUBRE": 9, "NOVIEMBRE": 10, "DICIEMBRE": 11 };

// Parser for the new Excel format with personnel list
function parsePersonnelExcel(sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (rows.length < 2) return null;

    const hasHeaders = rows.some(row => Array.isArray(row) && ['LUGAR', 'LP', 'JERARQUÍA'].every(h => row.includes(h)));
    if (!hasHeaders) return null;

    const title = rows[0]?.[0] || '';
    const dateMatch = title.match(/\((\w+)\s(\d{1,2})\sDE\s(\w+)\sDE\s(\d{4})\)/i);
    let scheduleDate = undefined;
    if (dateMatch) {
        const [, , day, month, year] = dateMatch;
        scheduleDate = `${day} DE ${month.toUpperCase()} DE ${year}`;
    }

    const schedule = {
        date: scheduleDate,
        services: [],
        sportsEvents: [],
    };

    let currentService = null;
    let headers = [];

    rows.forEach(row => {
        if (!Array.isArray(row) || row.every(cell => cell === null)) return;

        const firstCell = String(row[0] || '').trim();
        const isSectionHeader = firstCell && row.slice(1).every(cell => cell === null);

        if (isSectionHeader) {
            currentService = {
                id: `excel-import-${firstCell.replace(/\s/g, '-')}`,
                title: firstCell,
                isHidden: false,
                assignments: []
            };
            schedule.services.push(currentService);
            headers = [];
            return;
        }

        if (row.includes('LUGAR') && row.includes('LP')) {
            headers = row.map(h => String(h || '').trim());
            return;
        }

        if (currentService && headers.length > 0) {
            const rowData = {};
            headers.forEach((header, index) => { if(header) rowData[header] = row[index]; });

            if (rowData['LUGAR']) {
                const location = String(rowData['LUGAR']).trim();
                let assignment = currentService.assignments.find(a => a.location === location);

                if (!assignment) {
                    assignment = {
                        id: `excel-assign-${location.replace(/\s/g, '-')}`,
                        location: location,
                        time: rowData['HORARIO'] ? String(rowData['HORARIO']).trim() : 'N/A',
                        personnel: rowData['OFICINA/COMPAÑÍA'] ? String(rowData['OFICINA/COMPAÑÍA']).trim() : 'A designar',
                        details: [],
                    };
                    currentService.assignments.push(assignment);
                }

                const rank = String(rowData['JERARQUÍA'] || '').trim();
                const lp = String(rowData['LP'] || '').trim();
                const name = String(rowData['NOMBRE Y APELLIDO'] || '').trim();
                const poc = rowData['CONTACTO POC'] ? `POC: ${rowData['CONTACTO POC']}` : '';
                const particular = rowData['PARTICULAR'] ? `CEL: ${rowData['PARTICULAR']}` : '';

                let detailString = `${rank} L.P. ${lp} ${name} ${poc} ${particular}`.replace(/\s+/g, ' ').trim();
                assignment.details.push(detailString);
            }
        }
    });

    return schedule.services.length > 0 ? schedule : null;
}

// Parser for the template-based Excel file
function parseTemplateExcel(sheet) {
    const json = XLSX.utils.sheet_to_json(sheet);
    const servicesMap = new Map();
    json.forEach((row) => {
        const serviceTitle = row['Título del Servicio']?.trim();
        if (!serviceTitle) return;
        if (!servicesMap.has(serviceTitle)) {
            servicesMap.set(serviceTitle, { id: `imported-excel-${Date.now()}-${servicesMap.size}`, title: serviceTitle, description: row['Descripción del Servicio'] || '', novelty: row['Novedad del Servicio'] || '', isHidden: false, assignments: [] });
        }
        const service = servicesMap.get(serviceTitle);
        const location = row['Ubicación de Asignación'], time = row['Horario de Asignación'], personnel = row['Personal de Asignación'];
        if (location && time && personnel) {
            const allDetailsRaw = row['Detalles de Asignación'] ? String(row['Detalles de Asignación']).split(/;|\n/g).map(d => d.trim()).filter(d => d) : [];
            const implementationTimeValue = allDetailsRaw.find(d => d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));
            const otherDetails = allDetailsRaw.filter(d => !d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));
            service.assignments.push({ id: `imported-assign-${Date.now()}-${service.assignments.length}`, location: String(location), time: String(time), personnel: String(personnel), unit: row['Unidad de Asignación'] ? String(row['Unidad de Asignación']) : undefined, implementationTime: implementationTimeValue, details: otherDetails });
        }
    });
    const allServices = Array.from(servicesMap.values());
    return {
        services: allServices.filter(s => !s.title.toUpperCase().includes('EVENTO DEPORTIVO')),
        sportsEvents: allServices.filter(s => s.title.toUpperCase().includes('EVENTO DEPORTIVO')),
    };
}


const parseFullSchedule = (lines) => {
    const schedule = { commandStaff: [], services: [], sportsEvents: [] };
    let currentService = null;
    let currentAssignment = {};
    let isParsingSportsEvents = false;

    const dateLine = lines.find(l => l.toUpperCase().startsWith('GUARDIA DEL DIA'));
    if (!dateLine) return null;

    const dateMatch = dateLine.match(/GUARDIA DEL DIA\s?(\d+)\s?(?:DE)?\s?(\w+)\s*DE\s*(\d+)/i);
    if (dateMatch) {
        const day = dateMatch[1];
        const monthStr = dateMatch[2].toUpperCase();
        const year = dateMatch[3];
        schedule.date = `${day} DE ${monthStr} DE ${year}`;
    }

    const commitAssignment = () => {
        if (currentService && (currentAssignment.location || currentAssignment.details?.length)) {
             currentService.assignments.push({
                id: `imported-${Date.now()}-${Math.random()}`,
                location: currentAssignment.location || 'Ubicación a detallar',
                time: currentAssignment.time || 'Horario a detallar',
                personnel: currentAssignment.personnel || 'Personal a detallar',
                details: currentAssignment.details || [],
                ...currentAssignment,
            });
        }
        currentAssignment = { details: [] };
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const staffMatch = line.match(/(JEFE DE (?:INSPECCIONES|SERVICIO|GUARDIA|RESERVA))\s*:\s*([^(\n]+)/i);
        if (staffMatch) {
            const role = staffMatch[1].toUpperCase().trim();
            const details = staffMatch[2].trim();
            const rankMatch = details.match(/^(Comandante Director|Comandante|Subcomandante)/i);
            const rank = rankMatch ? rankMatch[0].toUpperCase() : 'OTRO';
            const name = details.replace(/^(Comandante Director|Comandante|Subcomandante)/i, '').replace(/\(.*\)\.?-?$/, '').trim();
            
            schedule.commandStaff.push({
                id: `officer-imported-${schedule.commandStaff.length}`,
                role: role,
                name: name,
                rank: rank
            });
            continue;
        }
        
        if (line.toUpperCase().includes('EVENTOS DEPORTIVOS')) {
            commitAssignment();
            currentService = null;
            isParsingSportsEvents = true;
            const service = {
              id: `service-imported-${Date.now()}-sports`,
              title: "EVENTOS DEPORTIVOS",
              description: "",
              isHidden: false,
              assignments: [],
            };
            schedule.sportsEvents.push(service);
            currentService = service;
            continue;
        }

        const serviceMatch = line.match(/^(\d+)\s*-\s*O\.S\s*[\d/]+\s*[–-]?\s*“?([^”]+)”?\s*(\(.*\))?/i);
        if (serviceMatch) {
            commitAssignment();
            currentService = null;
            const title = `${serviceMatch[2].trim()} ${serviceMatch[3] ? serviceMatch[3].trim() : ''}`.trim();
            const service = {
                id: `service-imported-${Date.now()}-${title.slice(0, 10)}`,
                title: title,
                description: line.match(/O\.S\s*[\d/]+/i)?.[0] || '',
                isHidden: false,
                assignments: [],
            };
            (isParsingSportsEvents ? schedule.sportsEvents : schedule.services).push(service);
            currentService = service;
            continue;
        }

        const altServiceMatch = line.match(/^\d+\s*-\s*SERVICIO PREVENCIONAL\s*-\s*"(.*)"/i);
        if (altServiceMatch) {
            commitAssignment();
            currentService = null;
            const title = altServiceMatch[1].trim();
            const service = {
                id: `service-imported-${Date.now()}-${title.slice(0,10)}`,
                title: title,
                isHidden: false,
                assignments: []
            };
            (isParsingSportsEvents ? schedule.sportsEvents : schedule.services).push(service);
            currentService = service;
            continue;
        }

        if (!currentService) continue;

        const fieldMatch = line.match(/^(QTH|HORARIO DE IMPLANTACIÓN|HORARIO|UNIDAD|PERSONAL|MODALIDAD DE COBERTURA|DESTACAMENTO)\s*:\s*(.*)/i);
        if (fieldMatch) {
            const key = fieldMatch[1].toUpperCase().trim();
            const value = fieldMatch[2].trim().replace(/\.-$/, '').trim();

            switch (key) {
                case 'QTH':
                    commitAssignment();
                    currentAssignment.location = value;
                    break;
                case 'HORARIO DE IMPLANTACIÓN': currentAssignment.implementationTime = `HORARIO DE IMPLANTACION: ${value}`; break;
                case 'HORARIO': currentAssignment.time = value; break;
                case 'UNIDAD': currentAssignment.unit = value; break;
                case 'PERSONAL': currentAssignment.personnel = value; break;
                case 'DESTACAMENTO':
                     if (!currentAssignment.location) currentAssignment.location = `DESTACAMENTO: ${value}`;
                     else currentAssignment.location += ` - DESTACAMENTO: ${value}`;
                     break;
                case 'MODALIDAD DE COBERTURA': currentService.novelty = (currentService.novelty || '') + value + ' '; break;
            }
            continue;
        }
        
        const isLocationLine = /^[A-ZÁÉÍÓÚÑ\s\d-()\/"]+$/.test(line) && !line.startsWith('OFICIAL') && !line.startsWith('BRO') && !line.startsWith('SUBTTE') && !line.startsWith('INSPECTOR') && !line.startsWith('JEFE') && !line.startsWith('TENIENTE');
        if (isLocationLine && line.length > 8 && currentService && !line.startsWith("COBERTURA ASIGNADA")) {
            commitAssignment();
            currentAssignment.location = line;
            continue;
        }

        if (line.length > 0) {
             if (line.match(/^(La misma|MISION|Personal deberá)/i)) {
                currentService.novelty = (currentService.novelty || '') + line + ' ';
             } else {
                if (!currentAssignment.details) currentAssignment.details = [];
                currentAssignment.details.push(line);
             }
        }
    }
    commitAssignment();
    
    schedule.sportsEvents = schedule.sportsEvents?.filter(s => s.assignments.length > 0 || !s.title.includes("EVENTOS DEPORTIVOS"));
    
    return (schedule.services.length > 0 || schedule.sportsEvents.length > 0 || schedule.commandStaff.length > 0) ? schedule : null;
};

const parseSimpleTemplate = (lines) => {
    const servicesMap = new Map();
    let currentService = null;
    let currentAssignment = {};

    const commitAssignment = () => {
        if (currentService && currentAssignment.location && currentAssignment.time && currentAssignment.personnel) {
            currentService.assignments.push({
                id: `imported-assign-${Date.now()}-${Math.random()}`,
                location: currentAssignment.location, time: currentAssignment.time, personnel: currentAssignment.personnel,
                implementationTime: currentAssignment.implementationTime, unit: currentAssignment.unit,
                details: currentAssignment.tempDetails,
            });
        }
        currentAssignment = {};
    };

    lines.forEach(line => {
        const parts = line.split(/:(.*)/s);
        if (parts.length < 2) {
            if (currentAssignment.location) {
                if (!currentAssignment.tempDetails) currentAssignment.tempDetails = [];
                currentAssignment.tempDetails.push(line.trim());
            }
            return;
        }
        const key = parts[0].trim(), value = parts[1].trim();

        if (key === 'Título del Servicio') {
            commitAssignment();
            if (!servicesMap.has(value)) {
                servicesMap.set(value, { id: `imported-word-service-${Date.now()}-${servicesMap.size}`, title: value, assignments: [], isHidden: false });
            }
            currentService = servicesMap.get(value);
        } else if (currentService) {
            switch (key) {
                case 'Descripción del Servicio': currentService.description = value; break;
                case 'Novedad del Servicio': currentService.novelty = value; break;
                case 'Ubicación de Asignación': commitAssignment(); currentAssignment.location = value; break;
                case 'Horario de Asignación': currentAssignment.time = value; break;
                case 'Personal de Asignación': currentAssignment.personnel = value; break;
                case 'Unidad de Asignación': currentAssignment.unit = value; break;
                case 'Detalles de Asignación':
                    if (!currentAssignment.tempDetails) currentAssignment.tempDetails = [];
                    const allDetails = value.split(/;|\n/g).map(d => d.trim()).filter(Boolean);
                    const implTime = allDetails.find(d => d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));
                    if (implTime) currentAssignment.implementationTime = implTime;
                    currentAssignment.tempDetails.push(...allDetails.filter(d => !d.toUpperCase().startsWith('HORARIO DE IMPLANTACION')));
                    break;
            }
        }
    });
    commitAssignment();

    const services = Array.from(servicesMap.values());
    return {
        services: services.filter(s => !s.title.toUpperCase().includes('EVENTO DEPORTIVO')),
        sportsEvents: services.filter(s => s.title.toUpperCase().includes('EVENTO DEPORTIVO')),
    };
};

export const parseScheduleFromFile = async (fileBuffer, fileName) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension === 'docx') {
        const { value: text } = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        const lines = text.split('\n').map(l => l.trim().replace(/\u2013|\u2014/g, "-")).filter(Boolean);
        return parseFullSchedule(lines) || parseSimpleTemplate(lines);
    } 
    
    if (['xlsx', 'xls', 'ods'].includes(fileExtension)) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        return parsePersonnelExcel(sheet) || parseTemplateExcel(sheet);
    }

    return {};
};
