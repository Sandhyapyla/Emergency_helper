let map;
let service;
let markers = [];
let currentType = "all";

function initMap() {
    // Initialize the map centered around the user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            map = new google.maps.Map(document.getElementById("map"), {
                center: userLocation,
                zoom: 14,
            });

            service = new google.maps.places.PlacesService(map);
            addMarker(userLocation, "Your Location", "🔵");

            fetchNearbyPlaces(currentType, userLocation);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to fetch nearby places based on the selected type
function fetchNearbyPlaces(type, location) {
    clearMarkers(); // Remove previous markers

    const placeType = type === "all" ? ["hospital", "police", "fire_station"] : [type];

    placeType.forEach((t) => {
        const request = {
            location: new google.maps.LatLng(location.lat, location.lng), // Ensure it's a LatLng object
            radius: 5000, // Search within 5km
            type: t,
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach((place) => {
                    let emoji = getEmoji(t);
                    addMarker(place.geometry.location, place.name, emoji);
                });
            }
        });
    });
}

// ✅ Function to add a marker (Fix for 'position.lat is not a function' error)
function addMarker(position, title, emoji) {
    // Ensure the position is a google.maps.LatLng object
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

    markers.push(marker);
}

// Function to clear existing markers
function clearMarkers() {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
}

// Function to get the right emoji for the marker
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

// Event listener for filter buttons
document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");

        currentType = this.dataset.type;
        navigator.geolocation.getCurrentPosition((position) => {
            fetchNearbyPlaces(currentType, {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        });
    });
});
