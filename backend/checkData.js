const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/"; // Local MongoDB connection
const client = new MongoClient(uri);

async function checkData() {
    try {
        await client.connect();
        const db = client.db("EmergencyHelplineDB"); // Your database name
        const collection = db.collection("emergency_services"); // Your collection name

        const data = await collection.find({}).toArray();
        console.log("Stored Data:", data);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

checkData();
