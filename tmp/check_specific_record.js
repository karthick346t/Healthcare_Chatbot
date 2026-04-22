const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI;

const ReportSchema = new mongoose.Schema({
  title: String,
  insight: String,
  fileUrl: String,
  patientId: mongoose.Schema.Types.ObjectId,
  date: Date
}, { collection: 'reports' });

const Report = mongoose.model('Report', ReportSchema);

async function checkRecord() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const reports = await Report.find({ title: /gang/i }).sort({ date: -1 }).limit(5);
    console.log('Found reports:', JSON.stringify(reports, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkRecord();
