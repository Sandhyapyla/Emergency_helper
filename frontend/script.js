let map;
let markers = [];

// Initialize Google Map
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 17.3850, lng: 78.4867 }, // Default to Hyderabad, India
    zoom: 14,
    styles: darkTheme, // Dark theme for UI
  });

  // Get user's location with high accuracy
  if (navigator.geolocation) {
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Add marker for user's location
        const userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2
          },
          zIndex: 1000
        });

        // Smooth animation to center the map
        map.panTo(userLocation);

        // Fetch and display emergency services
        fetchEmergencyServices(userLocation.lat, userLocation.lng);
      },
      (error) => {
        let errorMessage = "Error detecting your location: ";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Permission denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Request timed out. Please try again.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }
        alert(errorMessage);
      },
      locationOptions
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

// Fetch real-time emergency services from backend
async function fetchEmergencyServices(lat, lng) {
  const loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><h3>Loading Emergency Services...</h3></div>';
  document.querySelector('.container').appendChild(loadingDiv);

  // Clear existing markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  try {
    console.log('Fetching emergency services for coordinates:', lat, lng);
    const response = await fetch(`http://localhost:5000/api/places/services?latitude=${lat}&longitude=${lng}`);
    if (!response.ok) {
      console.error('API Response not OK:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received emergency services data:', data);

    if (!data.hospitals.length && !data.policeStations.length && !data.fireStations.length) {
      throw new Error('No emergency services found in your area');
    }

    // Display markers with service type and color coding
    const services = [
      { places: data.hospitals, color: "#FF0000", emoji: "🏥", type: "Hospital" },
      { places: data.policeStations, color: "#0000FF", emoji: "🚔", type: "Police Station" },
      { places: data.fireStations, color: "#00FF00", emoji: "🔥", type: "Fire Station" }
    ];

    services.forEach(service => {
      if (service.places.length > 0) {
        displayMarkers(service.places, service.color, service.emoji, service.type);
      }
    });

    // Add legend to the map
    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.style.cssText = 'background: rgba(255,255,255,0.9); padding: 10px; margin: 10px; border-radius: 5px; font-family: Arial;';
    
    services.forEach(service => {
      const item = document.createElement('div');
      const markerSvg = `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7z M12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z" fill="${service.color}"/></svg>`;
      item.innerHTML = `${markerSvg} ${service.emoji} ${service.type}`;
      legend.appendChild(item);
    });

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
  } catch (error) {
    const errorMessage = error.message || 'Failed to fetch emergency services';
    alert(errorMessage);
    console.error("Error:", error);
  } finally {
    loadingDiv.remove();
  }
}

// Display markers on Google Maps
function displayMarkers(places, color, emoji, type) {
  places.forEach((place) => {
    let iconPath;
    let iconScale = 1.5;
    
    if (type === 'Hospital') {
      iconPath = "M16,1.2L16,1.2c-0.3-0.3-0.7-0.3-1,0L12,4.2L9,1.2C8.7,0.9,8.3,0.9,8,1.2l0,0C7.7,1.5,7.7,1.9,8,2.2l3,3l-3,3c-0.3,0.3-0.3,0.7,0,1l0,0c0.3,0.3,0.7,0.3,1,0l3-3l3,3c0.3,0.3,0.7,0.3,1,0l0,0c0.3-0.3,0.3-0.7,0-1l-3-3l3-3C16.3,1.9,16.3,1.5,16,1.2z";
      color = '#FF4444';
    } else if (type === 'Police Station') {
      iconPath = "M12,1L3,5v6c0,5.5,3.8,10.7,9,12c5.2-1.3,9-6.5,9-12V5L12,1z M12,20c-4.4-1.2-7.5-5.5-7.5-9.8V6.5L12,3.2l7.5,3.3v4.7C19.5,14.5,16.4,18.8,12,20z M11,7h2v6h-2V7z M11,15h2v2h-2V15z";
      color = '#4444FF';
    } else if (type === 'Fire Station') {
      iconPath = "M12,22c4.97,0,9-4.03,9-9c0-4.5-5.3-9.4-7.9-11.6c-0.3-0.3-0.8-0.3-1.1,0C9.3,3.7,3,8.5,3,13C3,17.97,7.03,22,12,22z M10.9,8.9l1.7,1.7c0.2,0.2,0.5,0.2,0.7,0l1.7-1.7c0.6-0.6,1.4-0.6,2,0c0.6,0.6,0.6,1.4,0,2l-3.5,3.5c-0.2,0.2-0.5,0.2-0.7,0l-3.5-3.5c-0.6-0.6-0.6-1.4,0-2C9.5,8.4,10.4,8.4,10.9,8.9z";
      color = '#44FF44';
    }

    const svgMarker = {
      path: iconPath,
      fillColor: color,
      fillOpacity: 0.9,
      strokeWeight: 1.5,
      strokeColor: '#FFFFFF',
      scale: iconScale,
      anchor: new google.maps.Point(12, 12),
      labelOrigin: new google.maps.Point(12, -10),
      shadow: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#000000',
        fillOpacity: 0.25,
        strokeWeight: 0
      }
    };

    const marker = new google.maps.Marker({
      position: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      map,
      title: place.name,
      animation: google.maps.Animation.DROP,
      icon: svgMarker
    });

    const rating = place.rating ? `<p>Rating: ${place.rating} ⭐</p>` : '';
    const openNow = place.opening_hours?.open_now ? '<p style="color: green;">Open Now</p>' : '<p style="color: red;">Closed</p>';
    
    const emergencyNumber = type === 'Hospital' ? '108' : type === 'Police Station' ? '100' : '101';
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <h3>${emoji} ${place.name}</h3>
          <p><strong>${type}</strong></p>
          <p>${place.vicinity}</p>
          ${rating}
          ${openNow}
          <a href="tel:${emergencyNumber}" style="display: block; margin-top: 10px; padding: 8px 12px; background-color: #ff4444; color: white; text-decoration: none; border-radius: 4px; text-align: center;">
            <strong>Emergency Call ${emergencyNumber}</strong>
          </a>
        </div>
      `,
      maxWidth: 300
    });

    marker.addListener("click", () => {
      // Close all other info windows
      markers.forEach(m => m.infoWindow?.close());
      infoWindow.open(map, marker);
    });

    marker.infoWindow = infoWindow;
    markers.push(marker);

    // Add hover effect
    marker.addListener("mouseover", () => {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 750);
    });
  });
}

// Dark theme for Google Maps
const darkTheme = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
];

// Load Google Maps Script
function loadGoogleMapsScript() {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDlFXMbZBOgFeBbi8bVONKkKqLh_p9vn1c&libraries=places&callback=initMap`;
  script.defer = true;
  document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", loadGoogleMapsScript);
