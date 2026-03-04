
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Mountain } from 'lucide-react';

// Fix for default marker icon in Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TRAIL_DATA = [
  {
    id: 'helena-1',
    name: 'Mount Helena Ridge',
    city: 'Helena',
    coords: [46.5891, -112.0391] as [number, number],
    difficulty: 'Moderate',
    description: 'Classic Helena ridge walk with panoramic views of the valley.'
  },
  {
    id: 'helena-2',
    name: 'Elkhorn Mountains',
    city: 'Helena',
    coords: [46.3333, -111.9167] as [number, number],
    difficulty: 'Strenuous',
    description: 'Remote high-country trails perfect for multi-day llama packing.'
  },
  {
    id: 'butte-1',
    name: 'Continental Divide Trail (Butte Section)',
    city: 'Butte',
    coords: [46.0031, -112.5333] as [number, number],
    difficulty: 'Moderate',
    description: 'Follow the spine of the continent through the rugged Butte highlands.'
  },
  {
    id: 'bozeman-1',
    name: 'Hyalite Canyon',
    city: 'Bozeman',
    coords: [45.4833, -110.9667] as [number, number],
    difficulty: 'Moderate',
    description: 'Alpine lakes and waterfalls in the heart of the Gallatin Range.'
  },
  {
    id: 'missoula-1',
    name: 'Rattlesnake Wilderness',
    city: 'Missoula',
    coords: [46.9667, -113.9667] as [number, number],
    difficulty: 'Moderate',
    description: 'Deep canyons and high ridges just north of Missoula.'
  }
];

export const TrailMap: React.FC = () => {
  return (
    <div className="w-full h-[600px] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white relative group">
      <MapContainer 
        {...{
          center: [46.5, -112.5],
          zoom: 7,
          style: { height: '100%', width: '100%' },
          scrollWheelZoom: false
        } as any}
      >
        <TileLayer
          {...{
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          } as any}
        />
        {TRAIL_DATA.map((trail) => (
          <Marker key={trail.id} position={trail.coords}>
            <Popup>
              <div className="p-2">
                <h3 className="font-black text-lg text-stone-900 m-0">{trail.name}</h3>
                <p className="text-xs font-bold text-green-800 uppercase tracking-widest mt-1">{trail.city} • {trail.difficulty}</p>
                <p className="text-sm text-stone-600 mt-2">{trail.description}</p>
                <button className="mt-3 w-full bg-stone-900 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  View Trail Conditions
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-8 left-8 z-[1000] bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20 max-w-xs">
        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">Expedition Regions</h4>
        <div className="space-y-3">
          {['Helena', 'Butte', 'Bozeman', 'Missoula'].map(city => (
            <div key={city} className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-800 rounded-full" />
              <span className="text-sm font-bold text-stone-700">{city} Highlands</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
