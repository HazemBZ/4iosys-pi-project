const mongoose = require('mongoose')


//======== SubSchemas
const data_entry = new mongoose.Schema({
  value: {type:Number},
  time: {type:String}
}/*, {timestamps: true}*/, {id:false, _id:false})


//======== SCHEMAS 
// Measurement schema
const measurementSchema = new mongoose.Schema({
  containerRef: String,
  data: {
    temp:     [data_entry],   // list of objects containg sensor data and timestamp
    gaz:      [data_entry],   // ...
    flame:    [data_entry],   // ...
    hum:      [data_entry],   // ...
    vib:      [data_entry],   // ...
    location: [data_entry],   // ...
    accel:    [data_entry],    // ...
    door:     [data_entry]
  }
});
// Event schema
const eventSchema = new mongoose.Schema({
  containerRef: String,
  data: [] // list of objects containing event type and event timestamp
});

// Registry schema
const regitrySchema = new mongoose.Schema({
  containerRef: {type:String, index: {unique:true, required:true, dropDups:true}},
  owner: {type:String, required:true},
  source: String,
  location: String,
  destination: String,
  status: String, // for the moment string, change to number later when a status_code table is established
  last_active: String,
  pinned: Boolean,
  location_status: String,
  arrivalTime: String,
  departureTime: String,
  door: Boolean
});

const notificationSchema = new mongoose.Schema({
  object:String,
  content:String,
  time: String
})

//======== Models
const Measurement = mongoose.model('Measurement', measurementSchema);
const Event = mongoose.model('Event', eventSchema);
const Registry = mongoose.model('Registry', regitrySchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {Measurement, Event, Registry, Notification}