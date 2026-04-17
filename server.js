const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");

const app = express();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/agroDB";
mongoose.connect(mongoURI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Booking Schema
const bookingSchema = new mongoose.Schema({
  name: String,
  date: Date,
  service: String
});
const Booking = mongoose.model("Booking", bookingSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Video Schema
const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  filename: String,
  uploadDate: { type: Date, default: Date.now }
});
const Video = mongoose.model("Video", videoSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  message: String,
  type: { type: String, enum: ['weather', 'price', 'disease', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model("Notification", notificationSchema);

// Push Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  endpoint: String,
  keys: mongoose.Schema.Types.Mixed,
  fcmToken: String
});
const Subscription = mongoose.model("Subscription", subscriptionSchema);

// Insurance Claim Schema
const insuranceSchema = new mongoose.Schema({
  name: String,
  cropType: String,
  landSize: Number,
  location: String,
  contactDetails: String,
  scheme: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  appliedAt: { type: Date, default: Date.now }
});
const InsuranceClaim = mongoose.model("InsuranceClaim", insuranceSchema);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: "mySecretKey",
  resave: false,
  saveUninitialized: false
}));

// Configure Multer for Video Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock Database
const equipments = [
  { id: 1, type: "Tractor", model: "Mahindra 575 DI", owner: "Ramesh Singh", phone: "+91 9876543210", lat: 17.3850, lng: 78.4867, pricePerHour: 500, available: true },
  { id: 2, type: "Harvester", model: "John Deere W70", owner: "Suresh Kumar", phone: "+91 8765432109", lat: 17.3900, lng: 78.4900, pricePerHour: 1500, available: true },
  { id: 3, type: "Tractor", model: "Swaraj 744 FE", owner: "Venkat Reddy", phone: "+91 7654321098", lat: 17.3880, lng: 78.4800, pricePerHour: 450, available: true },
  { id: 4, type: "Seeder", model: "Kheti Seeder", owner: "Anil Das", phone: "+91 6543210987", lat: 17.3750, lng: 78.4950, pricePerHour: 300, available: true },
  { id: 5, type: "Tractor", model: "Eicher 380", owner: "Kishan Patel", phone: "+91 5432109876", lat: 17.3950, lng: 78.4750, pricePerHour: 400, available: true }
];

// Require login
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  next();
}

// Nearby equipment
app.post("/api/equipment/nearby", requireLogin, (req, res) => {

  const lat = req.body.lat;
  const lng = req.body.lng;
  const radius = req.body.radius;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and Longitude are required" });
  }

  const maxDistance = radius || 10;

  const nearbyEquipments = equipments
    .filter(eq => eq.available)
    .map(eq => {
      const distance = getDistance(lat, lng, eq.lat, eq.lng);
      return Object.assign({}, eq, { distance: distance });
    })
    .filter(eq => eq.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  res.json(nearbyEquipments);
});

// Book equipment
app.post("/api/equipment/add", upload.single("image"), (req, res) => {
  const newEquipment = {
    id: equipments.length + 1,
    type: req.body.type,
    model: req.body.model,
    owner: req.body.owner || "Current User",
    phone: req.body.phone || "+91 0000000000",
    lat: 17.3850, // mock fallback location
    lng: 78.4867, // mock fallback location
    pricePerHour: parseFloat(req.body.pricePerHour || 0),
    available: req.body.available === 'true',
    image: req.file ? `/uploads/${req.file.filename}` : req.body.image || null
  };
  equipments.push(newEquipment);
  res.json({ success: true, equipment: newEquipment });
});

app.post("/api/equipment/book", requireLogin, async (req, res) => {

  const equipmentId = req.body.equipmentId;
  const farmerName = req.body.farmerName;
  const hours = req.body.hours;

  const equipment = equipments.find(eq => eq.id === parseInt(equipmentId));

  if (!equipment) {
    return res.status(404).json({ error: "Equipment not found" });
  }

  if (!equipment.available) {
    return res.status(400).json({ error: "Equipment already booked" });
  }

  equipment.available = false;

  try {

    const booking = new Booking({
      name: farmerName,
      date: new Date(),
      service: equipment.type + " - " + equipment.model
    });

    await booking.save();

    res.json({
      success: true,
      message: "Successfully booked " + equipment.type + " (" + equipment.model + "). Owner " + equipment.owner + " will contact you shortly.",
      totalCost: equipment.pricePerHour * (hours || 1)
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to save booking" });
  }

});

// Get bookings
app.get("/api/bookings", requireLogin, async (req, res) => {

  try {

    const bookings = await Booking.find();
    res.json(bookings);

  } catch (err) {

    res.status(500).json({ error: "Failed to fetch bookings" });

  }

});

// Video Upload Route
app.post("/api/videos/upload", upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }
    const { title, description, category } = req.body;
    const newVideo = new Video({
      title,
      description,
      category,
      filename: req.file.filename
    });
    await newVideo.save();
    res.json({ success: true, message: "Video uploaded successfully!" });
  } catch (err) {
    console.error("Video upload error:", err);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// Get Videos Route
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadDate: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Signup
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ 
      $or: [{ username: username }, { email: email }] 
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });
    await newUser.save();
    res.json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ error: "User does not exist. Please create a new account." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect credentials. Try again." });
    }
    req.session.userId = user._id;
    res.json({ success: true, message: "Login successful!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to login" });
  }
});

// User Count
app.get("/users/count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user count" });
  }
});

// Logout
app.post("/logout", (req, res) => {

  req.session.destroy(() => {

    res.json({
      success: true,
      message: "Logged out successfully!"
    });

  });

});

// Distance calculation
function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;

}

// Advanced Disease Details Mock Data
const diseaseDetailsMock = {
  "Late Blight (Phytophthora infestans)": {
    disease: "Late Blight",
    urgency: "High",
    cure: [
      "Remove all infected leaves immediately and destroy them.",
      "Ensure good field drainage to reduce water pooling.",
      "Apply recommended organic copper-based sprays to remaining healthy leaves."
    ],
    medicines: [
      { name: "Mancozeb", usage: "Mix 2g per liter of water and spray on leaves uniformly." },
      { name: "Chlorothalonil", usage: "Spray every 7-10 days to prevent further spread." }
    ],
    prevention: [
      "Water crops strictly at the base underneath the leaves.",
      "Practice crop rotation to prevent soil buildup of pathogen.",
      "Space plants out widely to ensure good air circulation."
    ]
  },
  "Powdery Mildew": {
    disease: "Powdery Mildew",
    urgency: "Medium",
    cure: [
      "Prune densely affected branches to enhance airflow.",
      "Spray a safe mixture of baking soda and liquid soap."
    ],
    medicines: [
      { name: "Neem Oil Extract", usage: "Dilute appropriately and apply evenly on infected foliage." },
      { name: "Sulfur Fungicide", usage: "Spray immediately at the first sign of distinct white powdery spots." }
    ],
    prevention: [
      "Maintain uncrowded planting locations.",
      "Avoid over-fertilizing with nitrogen which creates excessive top growth.",
      "Water only in the morning hours."
    ]
  },
  "Leaf Spot (Cercospora)": {
    disease: "Leaf Spot",
    urgency: "Low",
    cure: [
      "Pluck off newly affected leaves and safely compost them far from fields.",
      "Apply quality compost tea to fortify plant immunity."
    ],
    medicines: [
      { name: "Copper Octanoate", usage: "Use strictly as a protective foliar spray." },
      { name: "Bacillus subtilis", usage: "Utilize bio-fungicides per the package mixing instructions." }
    ],
    prevention: [
      "Stop overhead sprinkling/watering methods.",
      "Actively sweep away damp plant debris from surrounding soil.",
      "Perform continuous multi-season crop rotation."
    ]
  }
};

app.get("/disease-details", (req, res) => {
  const disease = req.query.disease || "";
  const details = diseaseDetailsMock[disease] || {
    disease: disease,
    urgency: "Medium",
    cure: [
      "Remove infected regions of the plant.",
      "Ensure healthy soil conditions."
    ],
    medicines: [
      { name: "General Bio-Fungicide", usage: "Consult with human specialist for specific dosages." }
    ],
    prevention: [
      "Monitor plant moisture levels regularly.",
      "Routinely examine leaves for future spots."
    ]
  };
  res.json(details);
});

// ====== SMART NOTIFICATIONS ======

// 1. Get Notifications
app.get("/api/notifications", requireLogin, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [{ userId: req.session.userId }, { userId: null }]
    }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// 2. Mark as read
app.post("/api/notifications/read", requireLogin, async (req, res) => {
  try {
    await Notification.updateMany(
      { _id: { $in: req.body.notificationIds }, $or: [{ userId: req.session.userId }, { userId: null }] },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// 3. Save Push Subscription
app.post("/api/notifications/subscribe", requireLogin, async (req, res) => {
  try {
    const { endpoint, keys, fcmToken } = req.body;
    const existing = await Subscription.findOne({ endpoint: endpoint });
    if (!existing) {
      await new Subscription({ userId: req.session.userId, endpoint, keys, fcmToken }).save();
    }
    res.json({ success: true });
  } catch (err) {
     res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Admin Route to Send Notification (Mocking SMS & Push to prevent crashes)
app.post("/api/send-notification", async (req, res) => {
  try {
    const { userId, message, type, sendSms, sendPush } = req.body;
    
    // Save to DB
    const newNotif = new Notification({
      userId: userId || null,
      message,
      type: type || 'general'
    });
    await newNotif.save();

    // Independent Mock push logic (Firebase / WebPush)
    if (sendPush) {
      console.log(`[FCM MOCK] Push sent to user ${userId || 'ALL'}: ${message}`);
    }

    // Independent Mock SMS logic (Fast2SMS / Twilio)
    if (sendSms) {
       console.log(`[SMS MOCK] Twilio/Fast2SMS message sent: ${message}`);
    }

    res.json({ success: true, message: "Notification Broadcasted Successfully" });
  } catch (err) {
    console.error("Broadcast failed:", err);
    res.status(500).json({ error: "System failed to send notification" });
  }
});

// ====== MARKET PRICES API ======
app.get("/api/market-prices", (req, res) => {
  try {
    const marketMockData = [
      {
        id: 1,
        crop: "Tomato",
        location: "Hyderabad",
        price: 25,
        unit: "kg",
        trend: "up",
        trendValue: "+12%",
        history: [18, 20, 22, 23, 24, 25],
        suggestion: "Prices are increasing, you can wait before selling."
      },
      {
        id: 2,
        crop: "Rice",
        location: "Pune",
        price: 2200,
        unit: "quintal",
        trend: "stable",
        trendValue: "0%",
        history: [2200, 2200, 2190, 2200, 2200, 2200],
        suggestion: "Prices are stable. Sell if you need immediate cash."
      },
      {
        id: 3,
        crop: "Onion",
        location: "Delhi",
        price: 15,
        unit: "kg",
        trend: "down",
        trendValue: "-15%",
        history: [20, 19, 18, 17, 16, 15],
        suggestion: "Prices are decreasing rapidly, consider selling immediately."
      },
      {
        id: 4,
        crop: "Cotton",
        location: "Hyderabad",
        price: 7500,
        unit: "quintal",
        trend: "up",
        trendValue: "+2%",
        history: [7100, 7200, 7300, 7350, 7400, 7500],
        suggestion: "Wait 2-3 days. Prices are seeing an upward trend."
      }
    ];
    res.json(marketMockData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch market prices." });
  }
});

// ====== AI DECISION ASSISTANT API ======
app.get("/api/daily-recommendations", (req, res) => {
  try {
    // Simulating decision engine output parsing market/weather rules
    const recommendations = [
      {
        icon: "🚫💦",
        text: "Do not irrigate today — 80% chance of heavy rain expected."
      },
      {
        icon: "📈",
        text: "Delay selling Tomato crop — local prices are rising rapidly (+12%)."
      },
      {
        icon: "🐛",
        text: "Apply protective fungicide — high humidity increases leaf spot disease risk."
      },
      {
        icon: "🚜",
        text: "Low equipment availability this weekend. Book your harvester early."
      }
    ];
    
    res.json({ recommendations });
  } catch(err) {
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

// ====== CROP INSURANCE & CLAIMS API ======

// 1. Get Available Schemes (Mock logic dynamically parsing benefits)
app.get("/api/insurance-schemes", (req, res) => {
  try {
    const schemes = [
      {
        id: "pmfby",
        name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        benefits: "Comprehensive crop insurance covering yield losses from non-preventable natural risks.",
        eligibility: "All farmers growing notified crops in notified areas. Loan farmers are automatically covered, voluntary for others.",
        documents: ["Aadhaar Card", "Land Record (Pattadar Passbook)", "Sowing Certificate / Crop Details", "Bank Passbook"]
      },
      {
        id: "wbcis",
        name: "Weather Based Crop Insurance Scheme (WBCIS)",
        benefits: "Protection against weather deviations like rainfall deficit, excess rainfall, temperature fluctuation.",
        eligibility: "Farmers growing vulnerable crops (especially horticulture/cash crops) exposed to extreme weather variations.",
        documents: ["Aadhaar Card", "Land verification documents", "Bank Account Details"]
      },
      {
        id: "cpis",
        name: "Coconut Palm Insurance Scheme (CPIS)",
        benefits: "Financial protection against loss of coconut palms due to natural disasters, pests, and diseases.",
        eligibility: "Farmers with healthy, fruit-bearing coconut palms aged between 4 and 60 years.",
        documents: ["Identity Proof", "Land Ownership Proof", "Certification of healthy palms from agriculture officer"]
      }
    ];
    res.json(schemes);
  } catch(err) {
    res.status(500).json({ error: "Failed to fetch schemes" });
  }
});

// 2. Submit Claim Application
app.post("/api/apply-insurance", async (req, res) => {
  try {
    const { name, cropType, landSize, location, contactDetails, scheme } = req.body;
    
    if(!name || !cropType || !contactDetails) {
       return res.status(400).json({ error: "Name, Crop Type, and Contact details are required." });
    }

    const newClaim = new InsuranceClaim({
        name, cropType, landSize, location, contactDetails, scheme
    });
    
    await newClaim.save();
    
    res.json({ success: true, message: "Claim application registered successfully.", trackingId: newClaim._id });
  } catch(err) {
    res.status(500).json({ error: "Failed to submit insurance application" });
  }
});

// 3. Track Claim Status
app.get("/api/claim-status", async (req, res) => {
  try {
    const { contact } = req.query; // Search claims by phone/contact
    if(!contact) return res.status(400).json({ error: "Please provide a contact number to track." });
    
    const claims = await InsuranceClaim.find({ contactDetails: contact }).sort({ appliedAt: -1 });
    res.json(claims);
  } catch(err) {
    res.status(500).json({ error: "Failed to check claim status" });
  }
});


app.listen(PORT, () => {

  console.log("Backend server running at http://localhost:" + PORT);

});