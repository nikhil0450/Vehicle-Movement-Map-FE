import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import axios from 'axios';

const MapComponent = () => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    // Fetch route data from the backend
    axios.get('http://localhost:5000/api/vehicle-route')
      .then(response => {
        setRouteCoordinates(response.data);
      })
      .catch(error => {
        console.error('Error fetching route data:', error);
      });
  }, []);

  useEffect(() => {
    if (routeCoordinates.length === 0) return;

    const map = L.map('map').setView([18.516726, 73.856255], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.Routing.control({
      waypoints: routeCoordinates.map(coord => L.latLng(coord.latitude, coord.longitude)),
      router: L.Routing.osrmv1({
        language: 'en',
        profile: 'driving'
      }),
      routeWhileDragging: true
    }).addTo(map);

    // Create a vehicle marker
    const vehicleIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/15862/15862740.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    const vehicleMarker = L.marker(routeCoordinates[0] && [routeCoordinates[0].latitude, routeCoordinates[0].longitude], { icon: vehicleIcon }).addTo(map);

    let currentIndex = 0;
    function animateMarker() {
      if (routeCoordinates.length > 0) {
        currentIndex = (currentIndex + 1) % routeCoordinates.length;
        vehicleMarker.setLatLng([routeCoordinates[currentIndex].latitude, routeCoordinates[currentIndex].longitude]);
      }
    }

    // Animate the marker every 500ms
    setInterval(animateMarker, 500);

  }, [routeCoordinates]);

  return <div id="map" style={{ height: '100vh' }}></div>;
};

export default MapComponent;
