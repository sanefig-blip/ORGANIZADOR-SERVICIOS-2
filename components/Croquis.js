import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, DownloadIcon, EngineIcon, LadderIcon, AmbulanceIcon, CommandPostIcon, PersonIcon, MapIcon } from './icons.js';

const Croquis = ({ onSketchChange }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    
    const updateSketch = useCallback(() => {
        if (mapContainerRef.current) {
            html2canvas(mapContainerRef.current, {
                useCORS: true, 
                backgroundColor: '#18181b', 
                onclone: (document) => {
                    const attribution = document.querySelector('.leaflet-control-attribution');
                    if(attribution) {
                        attribution.style.display = 'none';
                    }
                }
            }).then((canvas) => {
                onSketchChange(canvas.toDataURL('image/png'));
            });
        }
    }, [onSketchChange]);
    
    useEffect(() => {
        if (mapContainerRef.current && !mapInitialized) {
            const map = L.map(mapContainerRef.current, {
                center: [-34.6037, -58.3816], // Buenos Aires
                zoom: 13,
                attributionControl: false, 
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
            
            setTimeout(updateSketch, 1000); 
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapInitialized, updateSketch]);

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

    const addTextToMap = (text, vertical) => {
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
    
    const addUnitToMap = (unitType, label) => {
        const map = mapRef.current;
        if (!map) return;

        const colors = {
            engine: '#ef4444', ladder: '#3b82f6', ambulance: '#22c55e', command: '#f97316', person: '#a855f7'
        };
        const symbols = {
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
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });
            updateSketch();
        }
    };
    
    return (
        React.createElement("div", { className: "flex flex-col h-[75vh] gap-4" },
             React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-4 bg-zinc-800/60 p-4 rounded-xl" },
                 React.createElement("button", { onClick: () => addTextToMap('Calle de ejemplo', false), className: "flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-white" },
                    React.createElement(MapIcon, { className: "w-5 h-5" }), " Añadir Calle"
                 ),
                 React.createElement("button", { onClick: () => addUnitToMap('engine', 'E-1'), className: "flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-white" },
                    React.createElement(EngineIcon, { className: "w-5 h-5" }), " Añadir Unidad"
                 ),
                 React.createElement("button", { onClick: clearAllMarkers, className: "flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md text-white" }, React.createElement(TrashIcon, { className: "w-5 h-5" }), " Limpiar Croquis")
            ),
            React.createElement("div", { ref: mapContainerRef, className: "w-full h-full rounded-xl", style: { backgroundColor: '#18181b' } })
        )
    );
};

export default Croquis;