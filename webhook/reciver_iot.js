const express = require('express');
var request = require('request');

const moment = require('moment-timezone');

// Generate current time in ISO 8601 format with timezone
// The format method string specifies the desired output, including microseconds
//const currentTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');

//console.log(currentTime);
require('dotenv').config({path: "./.env"})
//console.log(process.env.EPCIS_SERVER)

const CASSETTE_ID_Init="urn:epc:id:gln:Cassette_IR017"

const app = express();
const PORT = process.env.PORT || 3020;

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req, res) => {
  console.log('Received webhook:', req.body); // Log the body of the incoming request
  res.status(200).send('Webhook received');
});

app.post('/webhook', (req, res) => {
  const result = req.body.result;
  //console.log('Received webhook:', result); // Log the body of the incoming request
  const data = parseData(result);
  //console.log("Location:", location);
  console.log("Location:", data.location);
  console.log("CASSETTE_ID:", data.CASSETTE_ID);
  [35.1949391, 129.1215245], // South West corner
  [35.2149391, 129.1355245]

  if((data.location[0]>35.1949391)&&(data.location[0]<35.2149391)){
    console.log("within the range of lat")
    if((data.location[1]>129.1215245)&&(data.location[1]<129.1355245)){
      console.log("Arriving");
      const arriving_event=getEvent(data.CASSETTE_ID, "arriving", "in_progress", "urn:epc:id:sgln:0614141.07346.4444", [data.location[0], data.location[1]])
      //console.log(arriving_event);
      postepcis(arriving_event);

    }
    if((data.location[1]>129.1215245)&&(data.location[1]>129.1355245)){
      console.log("Departing");
      const departing_event=getEvent(data.CASSETTE_ID, "departing", "in_transit", "urn:epc:id:sgln:0614141.07346.4444", [data.location[0], data.location[1]])
      //console.log(departing_event);
      postepcis(departing_event);
    }

  }
  //const eventGen=getEvent("Cassette_IR016", "loading", "in_progress", "urn:epc:id:sgln:0614141.07346.1234", [42.798748016,-8.9449920654])
  //postepcis(eventGen);
  res.status(200).send('Webhook received');
});

function parseData(data) {
  const rawField = data._raw;
  
  // Use regex to match the "con" object, assuming it doesn't contain nested objects with braces
  const regex = /"con":"(\{.*?})"/s; // 's' flag for dot to match newline characters
  const match = rawField.match(regex);
  
  if (match && match[1]) {
      // Unescape the JSON string
      let conJsonStr = match[1].replace(/\\"/g, '"');
      
      try {
          // Parse the JSON string
          const conObj = JSON.parse(conJsonStr);
          
          // Access and return the 'LOCAT' attribute
          const location = conObj.LOCAT;
          const CASSETTE_ID = conObj.CASSETTE_ID;
          return {location, CASSETTE_ID};
      } catch (e) {
          console.error("Error parsing JSON from 'con' part:", e);
      }
  } else {
      console.log("No 'con' part found or regex did not match.");
  }
  
  return null; // Return null if parsing fails or 'con' part is not found/matched
}
  
const epcEvent={
  "@context": "https://gs1.github.io/EPCIS/epcis-context.jsonld",
  //"eventID": "ni:///sha-256;df7bb3c352fef055578554f09f5e2aa41782150ced7bd0b8af24dd3ccb30ba69?ver=CBV2.0",
  //"type": "ObjectEvent",
  "action": "OBSERVE",
  //"bizStep": "arriving",
  //"disposition": "in_transit",
  //"epcList": ["urn:epc:id:sgtin:0614141.107346.2017","urn:epc:id:sgtin:0614141.107346.2018"],
  //"eventTime": "2005-04-03T20:33:31.116000-06:00",
  "eventTimeZoneOffset": "-06:00",
  //"readPoint": {"id": "urn:epc:id:sgln:0614141.07346.1234"},
  "bizTransactionList": [  {"type": "po", "bizTransaction": "http://transaction.acme.com/po/12345678" }  ]
};

getEvent=(CASSETTE_ID, bizStep, disposition, readPoint, location)=>{
  epcEvent.type="ObjectEvent",
  epcEvent.bizLocation={"id":"geo:"+location[0]+","+location[1]}
  epcEvent.eventID="ni://sha-256;"+Math.floor(Math.random()*1000000).toString(16)+"?var=CBV.0";
  epcEvent.eventTime=moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
  epcEvent.bizStep=bizStep;
  epcEvent.disposition=disposition;
  epcEvent.readPoint={"id":readPoint};
  epcEvent.epcList=[CASSETTE_ID];

  return epcEvent;
}


postepcis = (eventData)=>{
  
  request({
      //uri:'http://127.0.0.1:8090/epcis/v2/events',
      uri:'http://'+process.env.EPCIS_SERVER+':'+process.env.EPCIS_SERVER_PORT+'/epcis/v2/events',
      method: 'POST',
      body: eventData,
      json:true

  }, function(error, response, body){
      
      if (!error && response.statusCode == 202) {
          console.log("response " , response.statusCode);
      }
      else{
          console.log(error);
      }
    });

}



const loading_example=getEvent(CASSETTE_ID_Init, "loading", "in_progress", "urn:epc:id:sgln:0614141.07346.2222", [35.2049391, 129.0825245])
//console.log(evet_example);
postepcis(loading_example)

const departing_example=getEvent(CASSETTE_ID_Init, "departing", "in_transit", "urn:epc:id:sgln:0614141.07346.2222", [42.798748016,-8.9449920654]);
//postepcis(evet_example)
postepcis(departing_example)
//console.log(getEvent("Cassette_IR016", "departing", "in_transit", "urn:epc:id:sgln:0614141.07346.1234", [42.798748016,-8.9449920654]));
//console.log(getEvent("Cassette_IR016", "arriving", "in_progress", "urn:epc:id:sgln:0614141.07346.1234", [42.798748016,-8.9449920654]));
//console.log(getEvent("Cassette_IR016", "departing", "in_transit", "urn:epc:id:sgln:0614141.07346.1234", [42.798748016,-8.9449920654]));



app.listen(PORT, () => {
  console.log(`Webhook server listening at http://localhost:${PORT}`);
});