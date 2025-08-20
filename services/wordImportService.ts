
import mammoth from 'mammoth';
import { Service, Assignment } from '../types';

export const parseServicesFromWord = async (fileBuffer: ArrayBuffer): Promise<Service[]> => {
    const { value: text } = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
    const lines = text.split('\n').filter(line => line.trim() !== '');

    const servicesMap = new Map<string, Service>();
    let currentService: Service | null = null;
    let currentAssignment: Partial<Assignment> & { tempDetails?: string[] } = {};

    const commitAssignment = () => {
        if (currentService && currentAssignment.location && currentAssignment.time && currentAssignment.personnel) {
            const newAssignment: Assignment = {
                id: `imported-assign-${Date.now()}-${Math.random()}`,
                location: currentAssignment.location,
                time: currentAssignment.time,
                personnel: currentAssignment.personnel,
                implementationTime: currentAssignment.implementationTime,
                unit: currentAssignment.unit,
                details: currentAssignment.tempDetails,
            };
            currentService.assignments.push(newAssignment);
            currentAssignment = {};
        }
    };

    lines.forEach(line => {
        const parts = line.split(/:(.*)/s); // Split only on the first colon
        if (parts.length < 2) {
             // Handle multiline details that don't have a key
            if (currentAssignment.location && currentAssignment.time && currentAssignment.personnel) {
                if (!currentAssignment.tempDetails) {
                    currentAssignment.tempDetails = [];
                }
                currentAssignment.tempDetails.push(line.trim());
            }
            return;
        }

        const key = parts[0].trim();
        const value = parts[1].trim();
        
        if (key === 'Título del Servicio') {
            commitAssignment(); // Commit previous assignment before starting a new service
            if (!servicesMap.has(value)) {
                 servicesMap.set(value, {
                    id: `imported-word-service-${Date.now()}-${servicesMap.size}`,
                    title: value,
                    assignments: [],
                    isHidden: false,
                });
            }
            currentService = servicesMap.get(value)!;
        } else if (currentService) {
             switch (key) {
                case 'Descripción del Servicio':
                    currentService.description = value;
                    break;
                case 'Novedad del Servicio':
                    currentService.novelty = value;
                    break;
                case 'Ubicación de Asignación':
                    commitAssignment(); // A new location means a new assignment
                    currentAssignment.location = value;
                    break;
                case 'Horario de Asignación':
                    currentAssignment.time = value;
                    break;
                case 'Personal de Asignación':
                    currentAssignment.personnel = value;
                    break;
                case 'Unidad de Asignación':
                    currentAssignment.unit = value;
                    break;
                case 'Detalles de Asignación':
                    if (!currentAssignment.tempDetails) {
                      currentAssignment.tempDetails = [];
                    }
                    const allDetails = value.split(/;|\n/g).map(d => d.trim()).filter(Boolean);
                    
                    const implementationTimeValue = allDetails.find(d => d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));
                    
                    if (implementationTimeValue) {
                        currentAssignment.implementationTime = implementationTimeValue;
                    }

                    const otherDetails = allDetails.filter(d => !d.toUpperCase().startsWith('HORARIO DE IMPLANTACION'));

                    currentAssignment.tempDetails = currentAssignment.tempDetails.concat(otherDetails);
                    break;
             }
        }
    });
    commitAssignment(); // Commit the last assignment

    return Array.from(servicesMap.values());
};