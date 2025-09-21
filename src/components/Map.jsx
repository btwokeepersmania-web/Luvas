import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

const Map = ({ location }) => {
  const { t } = useTranslation();
  const position = [location.lat, location.lng];

  const customIcon = new L.Icon({
    iconUrl: '/icons/location.gif',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} attributionControl={false} className="w-full h-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={position} icon={customIcon}>
        <Popup>
          <div className="font-sans text-center">
            <h3 className="font-bold text-base mb-1">B2 Goalkeeping</h3>
            <p className="text-sm">{location.address}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;
