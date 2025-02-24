let map;
let userMarker;
let placeMarkers = [];

const errorSection = document.querySelector('#errorSection');
const settings = document.querySelector('.settings');
const nearbyBlock = document.querySelector('#nearbyList');



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

            settings.className = "flex flex-col justify-center gap-3 p-4 bg-[#eeeeee98] rounded-md"



            console.log('Position Coords:', position.coords)
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 15); // Center map on user

            userMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup("You are here")
                .openPopup();
        }, () => alert("Unable to access location"));
    } else {
        errAlert("Geolocation is not supported by your browser");
    }
}
// Find Nearby Places
function findNearby() {
    const distance = document.querySelector('#distance').value;

    const placeType = document.getElementById("placeType").value;

    if (!map) return alert("Map is not initialized yet!");

    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        
        // Construct Overpass API Query
        const query = `
            [out:json];
            node(around:${distance}, ${latitude}, ${longitude})["amenity"="${amenityTypes[placeType]}"];
            out;
        `;
        const overpassURL = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        fetch(overpassURL)
            .then(response => response.json())
            .then(data => {
                // Clear old markers
                nearbyBlock.innerHTML = '';
                placeMarkers.forEach(marker => map.removeLayer(marker));
                placeMarkers = [];

                console.log(data)
                data.elements.forEach(place => {
                    
                    const { lat, lon, tags } = place;
                    const name = tags.name || "Unknown";
                    const address = `${tags["addr:street"] || "No address"} ${tags["addr:city"] || ""}`;
                    const openingHours = tags.opening_hours || "Unknown";
                    const phone = tags.phone || "No contact";

                    const marker = L.marker([lat, lon]).addTo(map)
                        .bindPopup(`
                            <div class="flex flex-col gap-1">
                                <span class="font-bold">${name}</span>
                                <span>📍 ${address}</span>
                                <span>⏰ Open: ${openingHours}</span>
                                <span>📞 ${phone}</span>
                                <button onclick="getDirections(${latitude}, ${longitude}, ${place.lat}, ${place.lon})"></button>
                            </div>  
                        `);
                    placeMarkers.push(marker);

                    const nearMe = `
                            <div class="flex justify-between items-center gap-2 w-full bg-[#fefefe] p-2">
                                <div class="flex flex-col ">
                                    <h2 class="font-bold text-lg">${name}</h2>
                                    <span class="text-sm">${address}</span>
                                    <span class="text-sm">${phone}</span>
                                    <span class="text-sm">${openingHours}</span>
                                </div>
                                <button onclick="getDirections(${latitude}, ${longitude}, ${place.lat}, ${place.lon})" class="py-2 px-6 bg-[#21c251] text-white shadow-sm shadow-slate-400 font-semibold rounded-md hover:opacity-85">Get Directions</button>
                            </div>
                    `

                    nearbyBlock.innerHTML += nearMe;

                    console.log('Results found. Please zoom in/out your map.');
                });
            })
            .catch(error => console.error("Error fetching data:", error));
    }, () => alert("Unable to access location"));
}

// Directions Placeholder Function
function getDirections(userLat, userLon, placeLat, placeLon) {
    const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLon}/${placeLat},${placeLon}`;
    window.open(googleMapsUrl, "_blank");
}

// Clear Results
function clearResults(){
    nearbyBlock.innerHTML = '';
    placeMarkers.forEach(marker => map.removeLayer(marker));
    placeMarkers = [];
}



window.onload = initMap;