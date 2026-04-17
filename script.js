function getAdvice() {

    let soil = document.getElementById("soil").value;
    let season = document.getElementById("season").value;
    let water = document.getElementById("water").value;
    let result = document.getElementById("result");

    if (soil == "" || season == "" || water == "") {
        alert("Please fill all details");
        return;
    }

    let crops;
    let risk;

    if (soil == "Black" && season == "Kharif" && water != "Low") {
        crops = "Cotton, Soybean, Maize";
        risk = "Medium Risk";
    }
    else if (soil == "Red" && season == "Rabi") {
        crops = "Millets, Pulses";
        risk = "Low Risk";
    }
    else if (soil == "Sandy" && water == "Low") {
        crops = "Bajra, Sesame";
        risk = "High Risk";
    }
    else {
        crops = "Mixed Cropping";
        risk = "Medium Risk";
    }

    result.innerHTML = `
        <h3>🌾 Recommended Crops</h3>
        <p>${crops}</p>
        <h3>⚠ Risk Level</h3>
        <p>${risk}</p>
    `;

    result.style.display = "block";
}

// --- Equipment Booking Logic ---

const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'http://localhost:3000/api';
let currentBooking = null;

function findNearbyEquipment() {
    const statusText = document.getElementById("locationStatus");
    statusText.innerText = "Locating you...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                statusText.innerText = "Location found! Searching for equipment...";
                fetchEquipment(lat, lng);
            },
            (error) => {
                console.error("Error getting location: ", error);
                statusText.innerText = "Location access denied or failed. Using fallback location.";
                // Fallback for testing: simulate location (Hyderabad coordinates roughly)
                fetchEquipment(17.3850, 78.4867);
            },
            { timeout: 10000 } // 10 second timeout
        );
    } else {
        statusText.innerText = "Geolocation is not supported by your browser.";
    }
}

async function fetchEquipment(lat, lng) {
    let apiEquipments = [];
    try {
        const response = await fetch(`${API_BASE_URL}/equipment/nearby`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, radius: 50 })
        });

        if (!response.ok) throw new Error('Failed to fetch equipment');

        apiEquipments = await response.json();
        document.getElementById("locationStatus").innerText = "Equipment loaded.";
    } catch (error) {
        console.error("Fetch error: ", error);
        document.getElementById("locationStatus").innerText = "Fetch error. Showing local equipment data fallback.";
    }

    const localEquipments = JSON.parse(localStorage.getItem('localEquipments') || '[]');
    const allEquipments = [...apiEquipments, ...localEquipments];
    displayEquipment(allEquipments);
}

function displayEquipment(equipments) {
    const listDiv = document.getElementById("equipmentList");
    const cardsDiv = document.getElementById("equipmentCards");
    cardsDiv.innerHTML = "";

    if (equipments.length === 0) {
        cardsDiv.innerHTML = "<p>No equipment available nearby at the moment.</p>";
    } else {
        equipments.forEach(eq => {
            const imgHtml = eq.image ? `<img src="${eq.image}" alt="Equipment Image" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:15px;">` : '';
            
            // Fetch reviews from LocalStorage
            const reviewsKey = `reviews_${eq.id}`;
            const reviews = JSON.parse(localStorage.getItem(reviewsKey)) || [];
            let totalRating = 0;
            let avgRating = 0;
            let latestReview = "No reviews yet.";
            
            if (reviews.length > 0) {
                totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                avgRating = (totalRating / reviews.length).toFixed(1);
                latestReview = reviews[reviews.length - 1].text;
            }

            const starsHtml = '⭐'.repeat(Math.round(avgRating));

            cardsDiv.innerHTML += `
                <div class="card" id="eq-card-${eq.id}" style="border-left: 5px solid #2e7d32; position: relative;">
                    ${imgHtml}
                    <h3>${eq.type} - ${eq.model}</h3>
                    <button onclick="removeEquipment('${eq.id}')" style="position: absolute; top: 15px; right: 15px; background: #d32f2f; padding: 5px 10px; font-size: 13px; border:none; border-radius:5px; color:white; cursor:pointer;" title="Remove Machine">✖ Remove</button>
                    <p><strong>Owner:</strong> ${eq.owner} | 📞 ${eq.phone}</p>
                    <p><strong>Distance:</strong> ${eq.distance ? eq.distance.toFixed(2) : '0.00'} km</p>
                    <p><strong>Price:</strong> ₹${eq.pricePerHour} / hour</p>

                    <div style="background: #f1f8e9; padding: 15px; margin: 15px 0; border-radius: 8px;">
                        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>⭐ Rating:</strong> ${avgRating > 0 ? `${avgRating}/5 ${starsHtml}` : 'No ratings yet'}</p>
                        <p style="margin: 0 0 5px 0; font-size: 14px; color: #444;"><strong>📝 Latest Review:</strong> <i>"${latestReview}"</i></p>
                        <p style="margin: 0; font-size: 12px; color: #666;">Total Reviews: ${reviews.length}</p>
                        
                        <div style="margin-top: 15px; border-top: 1px solid #c8e6c9; padding-top: 15px; display: flex; gap: 5px; align-items: center;">
                            <select id="rating-${eq.id}" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
                                <option value="5">5 ⭐</option>
                                <option value="4">4 ⭐</option>
                                <option value="3">3 ⭐</option>
                                <option value="2">2 ⭐</option>
                                <option value="1">1 ⭐</option>
                            </select>
                            <input type="text" id="review-text-${eq.id}" placeholder="Write a review..." style="flex: 1; padding: 5px; border-radius: 4px; border: 1px solid #ccc;">
                            <button onclick="addReview('${eq.id}')" style="background: #2e7d32; padding: 6px 12px; color: white; border: none; border-radius: 4px; cursor: pointer;">Post</button>
                        </div>
                    </div>

                    <button onclick="bookEquipment(${eq.id}, '${eq.type}', ${eq.pricePerHour})" style="width: 100%; border-radius: 5px;">Book Now</button>
                </div>
            `;
        });
    }

    listDiv.style.display = "block";
}

function removeEquipment(id) {
    if (!confirm("Are you sure you want to remove this machine?")) return;
    
    // Remove from localStorage
    let localEquipments = JSON.parse(localStorage.getItem('localEquipments') || '[]');
    const newEquipments = localEquipments.filter(eq => String(eq.id) !== String(id));
    localStorage.setItem('localEquipments', JSON.stringify(newEquipments));
    
    // Remove from UI immediately
    const cardToRemove = document.getElementById(`eq-card-${id}`);
    if (cardToRemove) {
        cardToRemove.remove();
    }
}

function addReview(id) {
    const ratingElement = document.getElementById(`rating-${id}`);
    const textElement = document.getElementById(`review-text-${id}`);
    
    if (!ratingElement || !textElement) return;
    
    const rating = parseInt(ratingElement.value);
    const text = textElement.value.trim();
    
    if (!text) {
        alert("Please write a review before submitting.");
        return;
    }
    
    const reviewsKey = `reviews_${id}`;
    let reviews = JSON.parse(localStorage.getItem(reviewsKey)) || [];
    
    reviews.push({ rating, text, date: new Date().toISOString() });
    localStorage.setItem(reviewsKey, JSON.stringify(reviews));
    
    alert("Review added successfully!");
    
    // Refresh list without reloading page by triggering the find button
    const findBtn = document.getElementById("findLocationBtn");
    if (findBtn && findBtn.style.display !== "none") {
        findBtn.click();
    } else {
        // Fallback layout refresh mechanism
        const lat = 17.3850;
        const lng = 78.4867;
        fetchEquipment(lat, lng);
    }
}

function bookEquipment(id, type, price) {
    currentBooking = { id, price };
    document.getElementById("bookingTitle").innerText = `Book ${type}`;
    document.getElementById("bookEquipmentId").value = id;
    document.getElementById("bookingModal").style.display = "block";
    calculateCost();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function closeBookingModal() {
    document.getElementById("bookingModal").style.display = "none";
    currentBooking = null;
}

function calculateCost() {
    if (!currentBooking) return;
    const hours = document.getElementById("bookingHours").value;
    const total = hours * currentBooking.price;
    document.getElementById("estimatedCost").innerText = total;
}

async function confirmBooking() {
    const name = document.getElementById("farmerName").value;
    const hours = document.getElementById("bookingHours").value;

    if (!name || hours < 1) {
        alert("Please provide valid details.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/equipment/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                equipmentId: currentBooking.id,
                farmerName: name,
                hours: hours
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(data.message + `\nTotal Cost: ₹${data.totalCost}`);
            closeBookingModal();
            // Refresh equipment list without GPS (optional, can just reset UI)
            document.getElementById("equipmentList").style.display = "none";
            document.getElementById("locationStatus").innerText = "Booking confirmed! Thank you.";
        } else {
            alert(data.error || "Booking failed.");
        }
    } catch (error) {
        console.error("Booking error: ", error);
        alert("Booking failed. Please check server connection.");
    }
}

