import React from 'react';
import { Assignment } from '../types';
import { ClockIcon, UsersIcon, LocationMarkerIcon, ClipboardListIcon, AnnotationIcon } from './icons';

interface AssignmentCardProps {
    assignment: Assignment;
    onStatusChange?: (statusUpdate: { inService?: boolean; serviceEnded?: boolean }) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onStatusChange }) => {
    const otherDetails = assignment.details || [];

    const getPersonnelStyle = () => {
        if (assignment.serviceEnded) {
            return { text: 'line-through text-red-400', icon: 'text-red-400' };
        }
        if (assignment.inService) {
            return { text: 'font-bold text-green-400', icon: 'text-green-400' };
        }
        return { text: 'text-gray-300', icon: 'text-gray-400' };
    };

    const personnelStyle = getPersonnelStyle();

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 transform hover:scale-[1.02] transition-transform duration-200 h-full flex flex-col">
            {assignment.serviceTitle && (
              <div className="flex items-center mb-2 text-sm text-blue-300/80">
                <ClipboardListIcon className="w-4 h-4 mr-2" />
                <span>{assignment.serviceTitle}</span>
              </div>
            )}
            <h4 className="font-bold text-lg text-yellow-300">{assignment.location}</h4>
            
            {assignment.novelty && (
                <div className="mt-3 p-3 bg-yellow-900/40 border border-yellow-700 rounded-md">
                    <div className="flex items-start">
                        <AnnotationIcon className="w-5 h-5 mr-2 text-yellow-300 flex-shrink-0" />
                        <p className="text-yellow-200 text-sm">{assignment.novelty}</p>
                    </div>
                </div>
            )}

            <div className="mt-3 space-y-2 text-gray-300 flex-grow">
                 {assignment.implementationTime && (
                    <div className="flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-teal-400 flex-shrink-0" />
                        <span className="font-semibold text-teal-300">{assignment.implementationTime}</span>
                    </div>
                )}
                <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{assignment.time}</span>
                </div>
                <div className="flex items-start">
                    <UsersIcon className={`w-5 h-5 mr-2 flex-shrink-0 mt-1 ${personnelStyle.icon}`} />
                    <span className={personnelStyle.text}>{assignment.personnel}</span>
                </div>
                {assignment.unit && (
                    <div className="flex items-center">
                    <LocationMarkerIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0" />
                    <span>Unidad: {assignment.unit}</span>
                    </div>
                )}
            </div>
            {otherDetails.length > 0 && (
                <div className="text-sm text-gray-400 italic pt-3 mt-3 border-t border-gray-700 space-y-1">
                    {otherDetails.map((detail, index) => (
                        <p key={index}>{detail.trim()}</p>
                    ))}
                </div>
            )}

            {onStatusChange && (
                <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-around text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-green-300">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                            checked={assignment.inService || false}
                            onChange={(e) => onStatusChange({ inService: e.target.checked })}
                        />
                        Personal en Servicio
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-red-300">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500"
                            checked={assignment.serviceEnded || false}
                            onChange={(e) => onStatusChange({ serviceEnded: e.target.checked })}
                        />
                        Finalizó Servicio
                    </label>
                </div>
            )}
        </div>
    );
};

export default AssignmentCard;
