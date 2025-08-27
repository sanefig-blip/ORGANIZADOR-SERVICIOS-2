
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

export const parseUnitReportFromExcel = (fileBuffer) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (rows.length < 5) return null;

    let stationName = null;
    const stationNameCell = rows[3]?.[4] || ''; // E4
    
    // Match "ESTACION X 'LUGANO'" or "ESTACION X LUGANO"
    const stationNameMatch = stationNameCell.match(/ESTACION\s+[IVXLCDM]+\s*(?:['"]?)([^'"]+)(?:['"]?)/i);

    if (stationNameMatch && stationNameMatch[1]) {
        const numberMatch = stationNameCell.match(/ESTACION\s+([IVXLCDM]+)/i);
        const stationNumber = numberMatch ? `${numberMatch[1]} ` : '';
        const extractedName = stationNameMatch[1].trim();
        // Reconstruct the full name as used in the app data
        stationName = `ESTACIÓN ${stationNumber}${extractedName}`.trim();
    }
    
    if (!stationName) {
        console.error("Could not find station name in cell E4");
        return null;
    }

    const headerRowIndex = rows.findIndex(row => row && row[0] === 'UNIDADES');
    if (headerRowIndex === -1) {
         console.error("Could not find header row with 'UNIDADES'");
        return null;
    }

    const headers = rows[headerRowIndex].map(h => String(h || '').trim());
    const unitsData = rows.slice(headerRowIndex + 1);

    const units = [];

    const col = (header) => headers.indexOf(header);

    for (const row of unitsData) {
        if (!row[col('UNIDADES')] || String(row[col('UNIDADES')]).trim() === 'TOTALES') break;
        
        const cond = String(row[col('COND')] || '').trim().toUpperCase();
        const dep = String(row[col('DEP')] || '').trim();

        let status = 'Estado Desconocido';
        let outOfServiceReason = undefined;

        if (cond === 'P/S') status = 'Para Servicio';
        else if (cond === 'F/S') status = 'Fuera de Servicio';
        else if (cond === 'RES') status = 'Reserva';
        
        if (dep.toLowerCase().includes('préstamo')) {
            status = 'A Préstamo';
        }

        if (status === 'Fuera de Servicio' && dep && !dep.toLowerCase().includes('en dependencia')) {
             outOfServiceReason = dep;
        }

        const unit = {
            id: String(row[col('UNIDADES')] || '').trim(),
            type: String(row[col('TIPO')] || '').trim(),
            internalId: String(row[col('INT')] || '').trim(),
            status: status,
            outOfServiceReason: outOfServiceReason,
            officerInCharge: String(row[col('A CARGO')] || '').trim() || undefined,
            personnelCount: parseInt(row[col('DOT')], 10) || null,
        };
        units.push(unit);
    }

    return { stationName, units };
};

const parseFullSchedule = (lines) => {
    const schedule = { commandStaff: [], services: [], sportsEvents: [] };
    let currentService = null;
    let currentAssignment = { details: [] };
    let isParsingSportsEvents = false;

    const dateLine = lines.find(l => l.toUpperCase().startsWith('GUARDIA DEL DIA'));
    if (dateLine) {
        const dateMatch = dateLine.match(/(\d+)\sDE\s(\w+)\sDE\s(\d{4})/i);
        if (dateMatch) {
            const day = dateMatch[1];
            const monthStr = dateMatch[2].toUpperCase();
            const year = dateMatch[3];
            schedule.date = `${day} DE ${monthStr} DE ${year}`;
        }
    }

    const commitAssignment = () => {
        if (currentService && (currentAssignment.location || (currentAssignment.details && currentAssignment.details.length > 0))) {
             currentService.assignments.push({
                id: `imported-${Date.now()}-${Math.random()}`,
                location: currentAssignment.location || 'Ubicación a detallar',
                time: currentAssignment.time || 'Horario a detallar',
                personnel: currentAssignment.personnel || 'Personal a detallar',
                ...currentAssignment,
            });
        }
        currentAssignment = { details: [] };
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
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

        if (line.toUpperCase().trim() === 'SERVICIOS') continue;
        if (line.toUpperCase().trim() === 'EVENTOS DEPORTIVOS') {
            commitAssignment();
            currentService = null;
            isParsingSportsEvents = true;
            continue;
        }
        
        const newServiceMatch = line.match(/^(\d+)\s*[-–]\s*(.*)/);
        if (newServiceMatch) {
            commitAssignment();
            currentService = null;
            
            let fullTitle = newServiceMatch[2].trim().replace(/[.-]$/, '').replace(/^["“]|["”]$/g, '').trim();
            const osMatch = fullTitle.match(/^(O\.S\.\s*[\d/]+)\s*[-–]?\s*(.*)/i);
            let title = fullTitle;
            let description = '';

            if (osMatch) {
                description = osMatch[1].trim();
                title = osMatch[2].trim().replace(/^["“]|["”]$/g, '').trim();
            }

            const service = {
                id: `service-imported-${Date.now()}-${title.slice(0, 10)}`,
                title: title,
                description: description,
                isHidden: false,
                assignments: [],
            };
            (isParsingSportsEvents ? schedule.sportsEvents : schedule.services).push(service);
            currentService = service;
            continue;
        }

        if (!currentService) continue;

        const fieldMatch = line.match(/^(QTH|HORARIO DE IMPLANTACIÓN|HORARIO|UNIDAD|PERSONAL|MODALIDAD DE COBERTURA)\s*:\s*(.*)/i);
        if (fieldMatch) {
            const key = fieldMatch[1].toUpperCase().trim();
            const value = fieldMatch[2].trim().replace(/[.-]$/, '').trim();
            
            if (currentAssignment.location && key === 'QTH') {
                 commitAssignment();
            }

            switch (key) {
                case 'QTH': currentAssignment.location = value; break;
                case 'HORARIO DE IMPLANTACIÓN': currentAssignment.implementationTime = `HORARIO DE IMPLANTACION: ${value}`; break;
                case 'HORARIO': currentAssignment.time = value; break;
                case 'UNIDAD': currentAssignment.unit = value; break;
                case 'PERSONAL': currentAssignment.personnel = value; break;
                case 'MODALIDAD DE COBERTURA': 
                    if (currentAssignment.location) commitAssignment();
                    currentService.novelty = (currentService.novelty || '') + value + ' '; 
                    break;
            }
            continue;
        }
        
        const nextLine = (lines[i + 1] || '').trim().toUpperCase();
        if (line === line.toUpperCase() && line.length > 8 && !line.match(/^(Bombero|Oficial|Subteniente|Inspector|Teniente|JEFE DE|POR ORDEN)/i) && !nextLine.startsWith('HORARIO')) {
            commitAssignment();
            currentAssignment.location = line.replace(/[.-]$/, '').trim();
            continue;
        }
        
        if (line) {
            if (!currentAssignment.details) {
                currentAssignment.details = [];
            }
            currentAssignment.details.push(line);
        }
    }
    commitAssignment();
    return schedule;
};

async function parseWordFile(fileBuffer) {
    const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
    return result.value.split('\n').filter(line => line.trim() !== '');
}

async function parseExcelFile(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const firstCell = sheet['A1'] ? sheet['A1'].v : '';
    if (firstCell.toUpperCase().includes('GUARDIA DEL DIA')) {
        return parsePersonnelExcel(sheet);
    }
    return parseTemplateExcel(sheet);
}

export const parseScheduleFromFile = async (fileBuffer, fileName) => {
    if (fileName.endsWith('.docx')) {
        const lines = await parseWordFile(fileBuffer);
        return parseFullSchedule(lines);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
        return parseExcelFile(fileBuffer);
    }
    return null;
};
