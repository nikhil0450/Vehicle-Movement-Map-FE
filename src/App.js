import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for missing leaflet images
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

function App() {
  const mapRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const routeCoordinatesRef = useRef([]);
  const currentIndexRef = useRef(0);

  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    // Fetch route data from the backend
    axios.get('https://vehicle-movement-map-be.onrender.com/api/vehicle-route')
      .then(response => {
        const coordinates = response.data.map(point => L.latLng(point.latitude, point.longitude));
        setRouteCoordinates(coordinates);
      })
      .catch(error => {
        console.error('Error fetching route data:', error);
      });
  }, []);

  useEffect(() => {
    if (routeCoordinates.length > 0) {
      initializeMap();
    }
  }, [routeCoordinates]);

  const initializeMap = () => {
    const map = L.map('map').setView([18.5223, 73.8939], 18);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.Routing.control({
      waypoints: routeCoordinates,
      router: L.Routing.osrmv1({
        language: 'en',
        profile: 'driving'
      }),
      routeWhileDragging: true
    }).addTo(map).on('routesfound', function(e) {
      const route = e.routes[0];
      const routeCoordinates = route.coordinates;
      routeCoordinatesRef.current = routeCoordinates;

      if (!vehicleMarkerRef.current) {
        const vehicleIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/128/15862/15862740.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });

        vehicleMarkerRef.current = L.marker(routeCoordinates[0], { icon: vehicleIcon }).addTo(map);

        function animateMarker() {
          currentIndexRef.current = (currentIndexRef.current + 1) % routeCoordinates.length;
          vehicleMarkerRef.current.setLatLng(routeCoordinates[currentIndexRef.current]);
        }

        setInterval(animateMarker, 500);
      }
    });

    // Add zoomend event listener to center on vehicle marker
    map.on('zoomend', () => {
      if (vehicleMarkerRef.current) {
        map.setView(vehicleMarkerRef.current.getLatLng(), map.getZoom());
      }
    });
  };

  return (
    <div id="map" style={{ height: '100vh' }}></div>
  );
}

export default App;
