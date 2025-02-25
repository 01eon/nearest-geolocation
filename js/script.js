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
            successAlert('Successfully retrieved your location.')

            settings.classList.add('active');
            nearbyBlock.classList.add('active');

            userLat = position.coords.latitude;
            userLon = position.coords.longitude;


            // console.log('Position Coords:', position.coords);
            // const { latitude, longitude } = position.coords;
            map.setView([userLat, userLon], 15); // Center map on user

            userMarker = L.marker([userLat, userLon]).addTo(map)
                .bindPopup("Current Location")
                .openPopup();
        }, () => errAlert("Unable to access location"));
    } else {
        errAlert("Geolocation is not supported by your browser");
    }
}
// Find Nearby Places
function findNearby() {
    console.log('clicked');
    const distance = document.querySelector('#distance').value;
    const placeType = document.getElementById("placeType").value;

    if (!map) return errAlert("Map is not initialized yet!");
    if (!userLat || !userLon) return errAlert("User location not available!");

    // Use stored location instead of requesting it again
    const query = `
        [out:json];
        node(around:${distance}, ${userLat}, ${userLon})["amenity"="${amenityTypes[placeType]}"];
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

            console.log('Raw API Response', data);

            // console.log(data);
            data.elements.forEach(place => {
                const {
                    lat,
                    lon,
                    tags
                } = place;

                console.log('Available Tags:', place.tags);

                const name = tags.name || "Unknown";
                const address = `${tags["addr:street"] || "Not Available"} ${tags["addr:city"] || ""}`;
                const openingHours = tags.opening_hours || "Not Available";
                const phone = tags.phone || "Not Available";

                const marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(`
                        <div class="flex flex-col gap-1">
                            <span class="font-bold">${name}</span>
                            <span>📍 ${address}</span>
                            <span>⏰ Open: ${openingHours}</span>
                            <span>📞 ${phone}</span>
                            <button onclick="getDirections(${userLat}, ${userLon}, ${lat}, ${lon})">Get Directions</button>
                        </div>  
                    `);
                placeMarkers.push(marker);

                if (name != 'Unknown') {
                    const nearMe = `
                    <div class="flex justify-between items-center gap-2 w-full bg-[#fefefe] p-2">
                        <div class="flex flex-col w-1/2">
                            <h2 class="font-bold text-lg leading-none">${name}</h2>
                            <span class="text-sm">${address}</span>
                            <span class="text-sm">${phone}</span>
                            <span class="text-sm">${openingHours}</span>
                        </div>
                        <button onclick="getDirections(${userLat}, ${userLon}, ${lat}, ${lon})" class="py-2 px-6 bg-[#21c251] text-white shadow-sm shadow-slate-400 font-semibold rounded-md hover:opacity-85">
                            Get Directions
                        </button>
                    </div>
             `;

                    nearbyBlock.innerHTML += nearMe;

                    successAlert('Results found. Please zoom in/out your map.');
                }


            });
        })
        .catch(error => errAlert("Error fetching data:", error));
}

// Directions Placeholder Function
function getDirections(userLat, userLon, placeLat, placeLon) {
    const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLon}/${placeLat},${placeLon}`;
    window.open(googleMapsUrl, "_blank");
}

// Clear Results
function clearResults() {
    nearbyBlock.innerHTML = '';
    placeMarkers.forEach(marker => map.removeLayer(marker));
    placeMarkers = [];
}

// Error Message
function errAlert(errText) {
    const alertBox = document.createElement('div');
    alertBox.className = 'feedbackAlert fixed bottom-[20px] bg-[#fcefc5] text-white rounded-sm shadow-sm shadow-slate-300 opacity-1 duration-500 ease flex items-center gap-2 w-[25rem]';
    alertBox.innerHTML = `
        <div class="bg-[#b81616] py-3 px-3 h-full flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24">
                <path fill="#f2f2f2" d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8" />
            </svg>
        </div>
        <span class="text-black px-2">${errText}</span>
    `;

    // append to body
    errorSection.appendChild(alertBox);

    // Set a timeout to hide the alert
    setTimeout(() => {
        alertBox.classList.add('hidden');

        // Remove the alert from the DOM after fading out
        setTimeout(() => {
            alertBox.remove();

        }, 500) // Match the CSS transition duration
    }, 5000) // Display for 5 seconds.
}

function successAlert(successText) {
    const alertBox = document.createElement('div');
    alertBox.className = 'feedbackAlert fixed bottom-[20px] bg-[#fcefc5] text-white rounded-sm shadow-sm shadow-slate-300 opacity-1 duration-500 ease flex items-center gap-2 w-[25rem]';
    alertBox.innerHTML = `
        <div class="bg-[#31bb24] py-3 px-3 h-full flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24">
                <path fill="#f2f2f2" d="M12 17q.425 0 .713-.288T13 16t-.288-.712T12 15t-.712.288T11 16t.288.713T12 17m0-4q.425 0 .713-.288T13 12V8q0-.425-.288-.712T12 7t-.712.288T11 8v4q0 .425.288.713T12 13m0 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8" />
            </svg>
        </div>
        <span class="text-black px-2">${successText}</span>
    `;

    // append to body
    document.body.appendChild(alertBox);

    // Set a timeout to hide the alert
    setTimeout(() => {
        alertBox.classList.add('hidden');

        // Remove the alert from the DOM after fading out
        setTimeout(() => {
            alertBox.remove();

        }, 500) // Match the CSS transition duration
    }, 5000) // Display for 3 seconds.
}

window.onload = initMap;