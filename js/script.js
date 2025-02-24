let map;
let userMarker;
let placeMarkers = [];

// Mapping category names to OpenStreetMap "amenity" tags
const amenityTypes = {
    hospital: "hospital",
    restaurant: "restaurant",
    fuel: "fuel",
    pharmacy: "pharmacy",
    bank: "bank",
    cafe: "cafe",
    hotel: "hotel",
    atm: "atm"
};


// Initialize Map
function initMap() {
    map = L.map('map').setView([0, 0], 13); // Default view

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15); // Center map on user

            userMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup("You are here")
                .openPopup();
        }, () => alert("Unable to access location"));
    } else {
        alert("Geolocation is not supported by your browser");
    }
}

// Find Nearby Places
function findNearby(){

}

window.onload = initMap;