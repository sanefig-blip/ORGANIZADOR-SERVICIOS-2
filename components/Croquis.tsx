import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, DownloadIcon, EngineIcon, LadderIcon, AmbulanceIcon, CommandPostIcon, PersonIcon, MapIcon } from './icons';
import { streets } from '../data/streets';

declare const L: any;
declare const html2canvas: any;

interface CroquisProps {
    onSketchChange: (dataUrl: string | null) => void;
}

const Croquis: React.FC<CroquisProps> = ({ onSketchChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    
    // This function will be used to capture the map state as an image
    const updateSketch = useCallback(() => {
        if (mapContainerRef.current) {
            html2canvas(mapContainerRef.current, {
                useCORS: true, // Important for map tiles from external sources
                backgroundColor: '#18181b', // Match map background
                onclone: (document: Document) => {
                    // When html2canvas clones the DOM, the leaflet attribution is sometimes split weirdly. Fix it.
                    const attribution = document.querySelector('.leaflet-control-attribution');
                    if(attribution) {
                        (attribution as HTMLElement).style.display = 'none';
                    }
                }
            }).then((canvas: HTMLCanvasElement) => {
                onSketchChange(canvas.toDataURL('image/png'));
            });
        }
    }, [onSketchChange]);
    
    useEffect(() => {
        if (mapContainerRef.current && !mapInitialized) {
            const map = L.map(mapContainerRef.current, {
                center: [-34.6037, -58.3816], // Buenos Aires
                zoom: 13,
                attributionControl: false, // We'll add it manually to avoid capture issues
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            L.control.attribution({
                position: 'bottomright',
                prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
            }).addTo(map);
            
            mapRef.current = map;
            setMapInitialized(true);
            
            // Give tiles time to load before initial capture
            setTimeout(updateSketch, 1000); 
        }

        // Cleanup function for when the component unmounts
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapInitialized, updateSketch]);

    // This effect updates the sketch whenever the map view changes
    useEffect(() => {
        const map = mapRef.current;
        if (map) {
            const debouncedUpdate = setTimeout(() => updateSketch(), 500);
            const updateHandler = () => {
                clearTimeout(debouncedUpdate);
                setTimeout(() => updateSketch(), 500);
            };
            map.on('moveend zoomend', updateHandler);
            return () => {
                map.off('moveend zoomend', updateHandler);
            };
        }
    }, [updateSketch]);

    const addTextToMap = (text: string, vertical: boolean) => {
        const map = mapRef.current;
        if (!map || !text.trim()) return;

        const icon = L.divIcon({
            className: 'leaflet-text-icon',
            html: `<div style="font-weight: bold; color: #fde047; text-shadow: 1px 1px 2px black; font-size: 16px; white-space: nowrap; transform: ${vertical ? 'rotate(-90deg)' : 'none'};">${text.trim().toUpperCase()}</div>`,
        });

        const marker = L.marker(map.getCenter(), { icon, draggable: true }).addTo(map);
        marker.on('dragend', updateSketch);
        updateSketch();
    };
    
    const addUnitToMap = (unitType: string, label: string) => {
        const map = mapRef.current;
        if (!map) return;

        const colors: { [key: string]: string } = {
            engine: '#ef4444', ladder: '#3b82f6', ambulance: '#22c55e', command: '#f97316', person: '#a855f7'
        };
        const symbols: { [key: string]: string } = {
            engine: 'A', ladder: 'H', ambulance: 'S', command: 'PC', person: 'P'
        };
        
        const html = `
            <div style="text-align: center;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background-color: ${colors[unitType]}; color: white; font-weight: bold; font-size: 16px; line-height: 28px; border: 2px solid white; box-shadow: 0 0 5px black;">
                    ${symbols[unitType]}
                </div>
                <div style="color: white; font-size: 12px; font-weight: bold; text-shadow: 1px 1px 2px black; margin-top: 2px;">
                    ${label}
                </div>
            </div>
        `;

        const icon = L.divIcon({ className: 'leaflet-unit-icon', html });

        const marker = L.marker(map.getCenter(), { icon, draggable: true }).addTo(map);
        marker.on('dragend', updateSketch);
        updateSketch();
    };

    const clearAllMarkers = () => {
        const map = mapRef.current;
        if(map){
            map.eachLayer((layer: any) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });
            updateSketch();
        }
    };
    
    return (
        <div className="flex flex-col h-[75vh] gap-4">
             <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-800/60 p-4 rounded-xl">
                 <button onClick={() => addTextToMap('Calle de ejemplo', false)} className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-white">
                    <MapIcon className="w-5 h-5"/> Añadir Calle
                 </button>
                 <button onClick={() => addUnitToMap('engine', 'E-1')} className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-white">
                    <EngineIcon className="w-5 h-5"/> Añadir Unidad
                 </button>
                 <button onClick={clearAllMarkers} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md text-white"><TrashIcon className="w-5 h-5"/> Limpiar Croquis</button>
            </div>
            <div ref={mapContainerRef} className="w-full h-full rounded-xl" style={{ backgroundColor: '#18181b' }}></div>
        </div>
    );
};

export default Croquis;