const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber:      { type: String, required: true, unique: true, trim: true },
  registrationNo: { type: String, required: true, unique: true, trim: true },
  model:          { type: String, default: 'Tata Marcopolo' },
  capacity:       { type: Number, default: 60 },
  type:           { type: String, enum: ['AC', 'non-AC', 'electric'], default: 'non-AC' },
  status:         { type: String, enum: ['active', 'idle', 'maintenance', 'retired'], default: 'idle' },
  currentRoute:   { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
  currentDriver:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  lastPosition: {
    lat:       { type: Number },
    lng:       { type: Number },
    speed:     { type: Number, default: 0 },
    timestamp: { type: Date },
  },
  fuelLevel:  { type: Number, default: 100, min: 0, max: 100 },
  mileage:    { type: Number, default: 0 },
  lastService:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
