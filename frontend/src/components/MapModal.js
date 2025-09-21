import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import leaflet's CSS
import './MapModal.css';

// Mock coordinates for bus routes starting from a point in Bangalore, India
const busRoutePaths = {
  "Route 5A": [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9730, lng: 77.5960 },
    { lat: 12.9750, lng: 77.5980 },
    { lat: 12.9765, lng: 77.6000 },
  ],
  "Route 3B": [
    { lat: 12.9279, lng: 77.6271 }, // Koramangala
    { lat: 12.9300, lng: 77.6290 },
    { lat: 12.9325, lng: 77.6310 },
    { lat: 12.9350, lng: 77.6330 },
  ],
  "Route 7A": [
    { lat: 12.9141, lng: 77.6369 }, // HSR Layout
    { lat: 12.9120, lng: 77.6380 },
    { lat: 12.9100, lng: 77.6400 },
    { lat: 12.9080, lng: 77.6420 },
  ],
};

function MapModal({ show, onClose, route }) {
  const [busPosition, setBusPosition] = useState(null);

  useEffect(() => {
    if (!show) return;

    const path = busRoutePaths[route] || busRoutePaths["Route 5A"];
    let pathIndex = 0;
    setBusPosition(path[pathIndex]); // Set initial position

    const interval = setInterval(() => {
      pathIndex = (pathIndex + 1) % path.length;
      setBusPosition(path[pathIndex]);
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval); // Cleanup on close
  }, [show, route]);

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✖</button>
        <h3>Live Location for {route}</h3>
        {busPosition ? (
          <MapContainer center={[busPosition.lat, busPosition.lng]} zoom={15} scrollWheelZoom={true} className="map-container">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[busPosition.lat, busPosition.lng]}>
              <Popup>
                Bus for {route}. <br /> Location is approximate.
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <p>Loading map...</p>
        )}
      </div>
    </div>
  );
}

export default MapModal;