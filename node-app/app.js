let mqtt = require('mqtt')
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
const {Measurement,Event, Registry} = require('./resources/container.models')
const containerRouter = require('./resources/container.router')
const notificationRouter = require('./resources/notification.router')
const apiRouter = require('./resources/api.router')
const {sendSMSMessage, sendEMail} = require('./resources/api')


// ========= MQTT ==============

// mqtt setup 
//const IP = "192.168.1.13";
const IP = "0.0.0.0";
const PORT ="1883";
const ENDPOINT = `mqtt://${IP}:${PORT}`;
let subTopic=""
let subTopics = ["gaz", "flame", "temp", "light","door"]
let client = {}


// === Reporting system parameterization ===
let TIMERS = {

}; // counter timer reference

let firstAlert = {
  TEMP: true,
  FLAME: true
}

let TIMEFRAME = 20; // in seconds 
let MAX_HITS = { // max allowed hits in a single timeframe
  TEMPE: 3
}

let HITS = { // registered hits in one timeframe
  TEMP: 0,
  FLAME: 0,
}

let THRESHOLDS = { // thresholds to register a HIT
  TEMP: {
    MIN: 10,
    MAX: 50
  },
}

// let TRIGGERS = {
//   TEMP: 
// }



// connection options (optional)
let options = {
  clientId:"mqttjs01",
  username:"steve",
  password:"password",
  clean:true
};



// ========== MONGO =============
mongoose.connect('mongodb://localhost:27017/containers', { useNewUrlParser: true,  useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error'))
// call once on connection open
db.once('open', ()=> {
  console.log('Connected to database')
}); 


// Get all predefined containers and subscribe to their channels (where they report data according to standardized channel naming schema) 
Registry.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{ // get containers refs 
  console.log(`Found docs: ${docs}`);
  let containerRefs = [];
  docs.forEach((el)=>{
    containerRefs.push(el["containerRef"])
    console.log(`Found containers => ${containerRefs}`)
  });
  setupMQTT();
  setupSubscriptions(containerRefs);
  
  // 
  app.use(cors());
  app.use(express.json())
  app.use('/container', containerRouter);
  app.use('/notification', notificationRouter);
  app.use('/api', apiRouter);



  

  app.listen(3000, "0.0.0.0", () => {
    console.log(`Express app listening at http://0.0.0.0:${port}`)
  })

}) /* .select({"_id":0, "data":0, "containerRef":1}, */



// HELPER functions 

let setupMQTT = () => {
   client = mqtt.connect(ENDPOINT)


  console.log("starting client");

  // on CONNECT
  client.on('connect', ()=>{
    console.log("Connected to MQTT broker successfuly");
  })

  // ON ERROR
  client.on('error', (err)=>{
    console.log(`Error ${err}`);
  })


  // let timer = setInterval(()=>{publish("advertise","9999");publish("state/9999", "AOK")}, 3000)


  // measurements topics, maybe recover all containerRefs from db and subscribe based on them to sensor topics

  // RECEIVE
  // console.log("receiving");

  // || TO DOs: refactor this section using switch on sensor type
  client.on('message', (topic, message, packet) => { // save data to db depending on data type/containerRef
    // console.log(`[Received] Topic: ${topic}, Message:${message}, Packet:${packet}`);
    console.log(`[Received] Topic: ${topic}, Value:${message}`);
    const [contRef, sensor] = topic.split('/');

    handleDataMonitoring(contRef, sensor, parseInt(message));
    
    // do a rigged container data update
    if(topic.includes("temp")) {
      Measurement.updateOne(
        {containerRef: contRef},
        {$push: {
          "data.temp": {
            $each: [{value:parseInt(message), time:new Date().toISOString()}],
            $position: 0 // Insert at the begging of the array
          }
        }},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          // console.log(`update result ${JSON.stringify(res)}`);
          console.log("[Updated] TEMPERATURE data")
        }
      );
    }// do temp update
    else if(topic.includes("flame")) {
      Measurement.updateOne(
        {containerRef: contRef},
        {$push: {
          "data.flame": {
            $each: [{value:parseInt(message), time:new Date().toISOString()}],
            $position: 0 // Insert at the begging of the array
          }
        }},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          // console.log(`update result ${JSON.stringify(res)}`)
          console.log("[Updated] FLAME data")
        }
      );
    }// do hum update
    else if (topic.includes("gaz")) {
      Measurement.updateOne(
        {containerRef: contRef},
        {$push: {
          "data.gaz": {
            $each: [{value:parseInt(message), time:new Date().toISOString()}],
            $position: 0 // Insert at the begging of the array
          }
        }},
        (err, res)=> {
          if (err) console.log(`Error: ${err}`);
          // console.log(`update result ${JSON.stringify(res)}`)
          console.log("[Updated] GAZ data")
        }
    // do gaz update
    )
  }

  else if (topic.includes("light")) {
    Measurement.updateOne(
      {containerRef: contRef},
      {$push: {
        "data.light": {
          $each: [{value:parseInt(message), time:new Date().toISOString()}],
          $position: 0 // Insert at the begging of the array
        }
      }},
      (err, res)=> {
        if (err) console.log(`Error: ${err}`);
        // console.log(`update result ${JSON.stringify(res)}`)
        console.log("[Updated] LIGHT data")
      }
  // do gaz update
  )
}

else if (topic.includes("door")) {
  Measurement.updateOne(
    {containerRef: contRef},
    {$push: {
      "data.door": {
        $each: [{value:parseInt(message), time:new Date().toISOString()}],
        $position: 0 // Insert at the begging of the array
      }
    }},
    (err, res)=> {
      if (err) console.log(`Error: ${err}`);
      // console.log(`update result ${JSON.stringify(res)}`)
      console.log("[Updated] DOOR data")
    }
)
// ------
Registry.updateOne(
  {containerRef: contRef},
  {$set: {
    "door": parseInt(message) == 1?true:false  // true/1 -> pushed (door closed), 0/false a-> not pushed (door opened)
  }},
  (err, res) => {
    if (err) console.log(`Error: ${err}`);
    else console.log("[Update] DOOR status set")
  }
)
}

})


}

function setupSubscriptions (containersRefs) {
  // SUBSCRIBE
  // console.log("subscribing");
  containersRefs.forEach((cont) => { // all containers
    subTopics.forEach((topic) => { // subscribe to needed subchannels
      const channel = `${cont}/${topic}`;
      client.subscribe(channel, {qos: 1});
      console.log(`[Subscription] ${channel} Channel`);
    })
  })

}

function handleDataMonitoring(container, data_type, payload){
  console.log(`[STAGE] Data Monitoring Handler: container:${container}, datatype:${data_type}, paylaod:${payload}`)
  const upperDataType= data_type.toUpperCase()
  if(!isNormalSensorData(upperDataType, payload)){handleTimeframes(container, upperDataType, payload);console.log("NOT NORMAL");}
  else console.log("IS NORMAL")
}


function isNormalSensorData(data_type, payload){
  payload = parseInt(payload)
  console.log(`checking ${data_type} normalcy`)
  switch(data_type) {
    case 'TEMP':
      console.log(' case TEMP')
      return (payload > THRESHOLDS.TEMP.MIN) && (payload < THRESHOLDS.TEMP.MAX);
    default:
      // console.log(`[DATA PROCESSING] Unable to determine data_type:'${data_type} normalcy! please add its corresponding handler`)
      return true;
  }
}

// handle TIMERS 
function handleTimeframes(container, data_type, payload){
  console.log(`[STAGE] time frames handlerma`)
  if(TIMERS[data_type] && TIMERS[data_type]._idlePrev && TIMERS[data_type]._idleNext) { // _idleTimeout: for setInterval //// there is a running timer
    console.log(`TIMER exists for ${data_type} data`)
    // register hit
    HITS[data_type] += 1;
    // if(firstAlert[data_type]) applyRegisteredHits(container, data_type, payload); firstAlert[data_type]= false;
  }
  else {  // there is no running timer
    console.log(`starting TIMER for ${data_type} data`)
    resetHits(container, data_type)
    HITS[data_type] += 1;
    resetTimer(container, data_type, payload)
  }
  /* cases for timer handling. NOTE: can use 'setInterval' inside a 'setTimeout' for more advanced parameterization
  **  there is no timer registered -> first time app running
  **  there is a running timer     -> register a hit (data is not normal) and check if reporting is required
  **  there is a timedout timer (timer._idleTimeout == -1)     ->  start a new timer 'setTimeout'
  */
}


function resetHits(container, data_type) {
  HITS[data_type] = 0;
}

function resetTimer(container, data_type, payload){
  TIMERS[data_type] = startTimer(container, data_type, payload);
}

function applyRegisteredHits(container, data_type, payload){
  if(isSensorHitsMaxed) alertHitsMaxed(container, data_type, payload);firstAlert[data_type] = true;
}

function startTimer(container, data_type, payload){
  let subFrameTimer = setInterval(()=>{console.log(`current HITS ${JSON.stringify(HITS)}`)}, TIMEFRAME*1000 / 5)
  console.log(`[TIMER] Started for ${data_type} data`)
  function timerFunction(){applyRegisteredHits(container, data_type, payload); clearInterval(subFrameTimer); console.log(`[TIMER] Ended for ${data_type} data`)}
  return setTimeout(timerFunction, TIMEFRAME*1000);
}

 function alertHitsMaxed(container, data_type, payload){
   console.log(`$[ALERT] hits maxed for '${data_type} data'`)
   sendSMSMessage(`[ALERT] threshold hit count exceeded for ${data_type.toUpperCase()} data`);
   sendEMail();
}

function isSensorHitsMaxed(data_type) {
  return HITS[data_type] >= MAX_HITS[data_type];
}
// ======== EXPRESS ==========




module.exports = app;