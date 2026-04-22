const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Hardcoded path to .env since I'm in Cwd backend usually
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const ReportSchema = new mongoose.Schema({
    date: { type: Date }
}, { strict: false });

const Report = mongoose.model('Report', ReportSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");
        const reports = await Report.find({});
        console.log("Total reports:", reports.length);
        reports.forEach(r => {
            console.log(`ID: ${r._id}, Title: ${r.title}, Date: ${r.date}, RawDate: ${r.get('date')}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

check();
