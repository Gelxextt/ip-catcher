const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;
const API_KEY = "5215a102a4bebc";

app.use(cors()); 
app.use(express.json());


const db = new sqlite3.Database("./visitors.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});


db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        country TEXT,
        region TEXT,
        city TEXT,
        isp TEXT,
        latitude TEXT,
        longitude TEXT,
        device TEXT,
        browser TEXT,
        os TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);


app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to the IP Tracker API</h1>
        <p>Use the <code>/log</code> endpoint to log visitor details.</p>
    `);
});


app.post("/log", async (req, res) => {
    try {
        const { latitude, longitude, device, browser, os } = req.body;

       
        const ipResponse = await fetch("https://api64.ipify.org?format=json");
        const ipData = await ipResponse.json();
        const realIp = ipData.ip;

        console.log(`Fetching location for IP: ${realIp}`);

       
        const locationResponse = await fetch(`https://ipinfo.io/${realIp}/json?token=${API_KEY}`);
        const data = await locationResponse.json();

        if (locationResponse.ok) {
            console.log("Visitor Info:", data);

          
            db.run(
                `INSERT INTO visitors (ip, country, region, city, isp, latitude, longitude, device, browser, os) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.ip,
                    data.country,
                    data.region,
                    data.city,
                    data.org,
                    latitude || data.loc.split(",")[0], 
                    longitude || data.loc.split(",")[1],
                    device,
                    browser,
                    os
                ],
                (err) => {
                    if (err) {
                        console.error("Database error:", err.message);
                    }
                }
            );

            res.json({
                ip: data.ip,
                country: data.country,
                region: data.region,
                city: data.city,
                isp: data.org,
                latitude: latitude || data.loc.split(",")[0],
                longitude: longitude || data.loc.split(",")[1],
                device,
                browser,
                os,
                message: "Visitor details logged successfully."
            });
        } else {
            throw new Error(`API Error: ${data.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).json({ error: `Error fetching location: ${error.message}` });
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
