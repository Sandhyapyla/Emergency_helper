let map;
let service;
let markers = [];
let currentType = "all";
let userLocation = { lat: 17.3850, lng: 78.4867 }; // Default to Hyderabad, India
let directionsService;
let directionsRenderer;

function initMap() {
    const defaultLocation = { lat: 17.3850, lng: 78.4867 }; // Default to Hyderabad, India

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 14,
    });

    service = new google.maps.places.PlacesService(map);
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Get user's location with high accuracy
    if (navigator.geolocation) {
        console.log("Geolocation is supported. Requesting location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Geolocation success:", position.coords);
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                map.setCenter(userLocation);
                addMarker(userLocation, "Your Location", "🔵", false);
                fetchNearbyPlaces(currentType, userLocation);
            },
            (error) => {
                let errorMessage = "Error detecting your location: ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Permission denied. Using default location (Hyderabad, India).";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information unavailable. Using default location (Hyderabad, India).";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Request timed out. Using default location (Hyderabad, India).";
                        break;
                    default:
                        errorMessage += "An unknown error occurred. Using default location (Hyderabad, India).";
                }
                console.error("Geolocation error:", errorMessage);
                alert(errorMessage);
                userLocation = defaultLocation;
                addMarker(userLocation, "Default Location (Hyderabad)", "🔵", false);
                fetchNearbyPlaces(currentType, userLocation);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        alert("Geolocation is not supported by this browser. Using default location (Hyderabad, India).");
        userLocation = defaultLocation;
        addMarker(userLocation, "Default Location (Hyderabad)", "🔵", false);
        fetchNearbyPlaces(currentType, userLocation);
    }
}

function fetchNearbyPlaces(type, location) {
    clearMarkers();

    const placeType = type === "all" ? ["hospital", "police", "fire_station"] : [type];

    placeType.forEach((t) => {
        const request = {
            location: new google.maps.LatLng(location.lat, location.lng),
            radius: 5000, // Search within 5km
            type: t,
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach((place) => {
                    let emoji = getEmoji(t);
                    addMarker(place.geometry.location, place.name, emoji, true, t, place);
                });
            } else {
                console.error(`PlacesService failed for type ${t}: ${status}`);
            }
        });
    });
}

function addMarker(position, title, emoji, addInfoWindow = true, type = null, place = null) {
    const pos = position.lat ? position : new google.maps.LatLng(position.lat(), position.lng());

    const marker = new google.maps.Marker({
        position: pos,
        map,
        title,
        label: {
            text: emoji,
            fontSize: "18px",
        },
    });

    if (addInfoWindow && place) {
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px;">
                    <h3>${emoji} ${place.name}</h3>
                    <p>${place.vicinity || "Address not available"}</p>
                    ${place.rating ? `<p>Rating: ${place.rating} ⭐</p>` : ""}
                    ${place.opening_hours ? `<p style="color: ${place.opening_hours.open_now ? "green" : "red"}">${place.opening_hours.open_now ? "Open Now" : "Closed"}</p>` : ""}
                    ${type === "hospital" ? `
                        <a href="#" onclick="getDirections(${pos.lat()}, ${pos.lng()})" style="display: block; margin-top: 10px; padding: 8px 12px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Get Directions</a>
                        <a href="https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pos.lat()},${pos.lng()}&travelmode=driving" target="_blank" style="display: block; margin-top: 5px; padding: 8px 12px; background-color: #34A853; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Open in Google Maps</a>
                    ` : ""}
                </div>
            `,
        });

        marker.addListener("click", () => {
            markers.forEach(m => m.infoWindow?.close());
            infoWindow.open(map, marker);
        });

        marker.infoWindow = infoWindow;
    }

    markers.push(marker);
}

window.getDirections = function(lat, lng) {
    if (!userLocation) {
        alert("User location is not available. Please enable location services and try again.");
        return;
    }

    const request = {
        origin: new google.maps.LatLng(userLocation.lat, userLocation.lng),
        destination: new google.maps.LatLng(lat, lng),
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            console.error("Directions API failed:", status, result);
            alert("Could not calculate directions: " + status + ". Please ensure the Directions API is enabled and the API key is correctly configured. Alternatively, use the 'Open in Google Maps' link.");
        }
    });
};

function clearMarkers() {
    markers.forEach((marker) => {
        marker.setMap(null);
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
    });
    markers = [];
    directionsRenderer.setDirections({ routes: [] }); // Clear previous directions
}

function getEmoji(type) {
    switch (type) {
        case "hospital":
            return "🔴";
        case "police":
            return "🔵";
        case "fire_station":
            return "🟠";
        default:
            return "⚪";
    }
}

document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");

        currentType = this.dataset.type;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    fetchNearbyPlaces(currentType, userLocation);
                },
                (error) => {
                    console.error("Geolocation error on filter:", error);
                    fetchNearbyPlaces(currentType, userLocation);
                }
            );
        } else {
            fetchNearbyPlaces(currentType, userLocation);
        }
    });
});
