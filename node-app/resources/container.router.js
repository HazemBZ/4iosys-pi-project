let router = require('express').Router()
const app = require('../app');
const {Measurement, Event, Registry,} = require('./container.models')

  


// Webservice
router.get('/allContainers', (req, res) => {// Registered containers
  Registry.find({},  (err, docs)=>{
    res.json(docs);
  })
  //res.send('Hello World!')
})

router.get('/allContainerRefs', (req, res) => {
  Measurement.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{ // Containers w/ measurement data
    res.json(docs);
  })
  //res.send('Hello World!')
})


// Webservice
router.get('/measurements/:containerId', (req, res) => {
  Measurement.findOne({"containerRef": req.params.containerId}, (err, docs)=>{
    res.json(docs);
  })
  //res.send('Hello World!')
})

//   Measurement.updateOne(
//     {containerRef: '123'},
//     {$push: {"data.temp": [{value:parseInt(message), stamp:new Date().toISOString}]}},
//     (err, res)=> {
//       if (err) console.log(`Error: ${err}`);
//       // console.log(`update result ${JSON.stringify(res)}`);
//       console.log("[Updated] TEMPERATURE data")
//     }
//   );
// }

// router.get('/measurements/')


// Testing purposes
router.get('/add', (req, res) => {
  Measurement.updateOne(
    {containerRef: '123'},
    {$push: {
      "data.temp": {
        $each: [{value:123, time:new Date().toISOString()}],
        $position: 0 // Insert at the begging of the array
      }
    }},
    (err, res) => {
      if(err) console.log(`Error: ${err}`)
      console.log("[Updated] TEMPERATURE data")
    }
  );
  res.json('ok')
});


//====== Registry ====
// Add Container
router.post('/registry/add', (req, res)=> {
  console.log("Received request")
  const containerRef = req.body.containerRef; // required
  const owner = req.body.owner; // required
  const source = req.body.source;
  const location = req.body.location ;
  const destination = req.body.destination;
  const status = "None";
  const last_active = "None";
  const pinned = false;
  const departureTime = req.body.departureTime;
  const arrivalTime = req.body.arrivalTime;
  const arrived = false;

  const registry = new Registry({
    containerRef: containerRef,
    owner: owner,
    source: source,
    location: location,
    destination: destination,
    status: status,
    last_active: last_active,
    pinned: pinned,
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    arrived: arrived
  })

  registry.save((err, registry)=> {
    if(err) {
      res.json({'message':'DUPLICATION_ERROR'})
      return console.error("errored hah");
    }
    console.log(`container: ${registry.containerRef} saved successfully `)
    res.json({'message':'saved successfully '})
    console.error()

  })
});


// Other webservices
router.put('/pin/:containerRef', (req,res)=> {
  const ref = req.params.containerRef;
  console.log('pinning container ' + ref)
  Registry.updateOne(
    {containerRef:ref},
    {$set: {
      pinned: true
    }},
    (err,docs) => {
      if (err) return console.error();
      res.json({'message':`container ${ref} pinned`})
    }
    )
})

router.put('/unpin/:containerRef', (req,res)=> {
  const ref = req.params.containerRef;
  console.log('unpinning container ' + ref)
  Registry.updateOne(
    {containerRef:ref},
    {$set: {
      pinned: false
    }},
    (err,docs) => {
      if (err) return console.error();
      res.json({'message':`container ${ref} unpinned`})
    }
    )
})


  module.exports = router;