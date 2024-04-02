// Initialize the map and set its view to our chosen geographical coordinates and a zoom level
var map = L.map('mapid').setView([35.2049391, 129.1315245], 5);

// Add an OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


const CASSETTE_ID ="urn:epc:id:gln:Cassette_IR016";

/*
// Define a circle to represent the geofence area
var geofence = L.circle([35.2049391, 129.1315245], {
    color: 'red',
    fillColor: '#f03',s
    fillOpacity: 0.5,
    radius: 5000
}).addTo(map);
*/

// Define bounds for the rectangle with both width and height approximately 0.009 degrees
//var bounds = [
//  [35.2059391, 129.1215245], // South West corner
//  [35.2059391 + 0.007, 129.1215245 + 0.007]  // North East corner, adjusted by 0.009
//];

// Define bounds for the rectangle [[southWestLat, southWestLng], [northEastLat, northEastLng]]
var bounds = [
  [35.1949391, 129.1215245], // South West corner
  [35.2149391, 129.1355245]  // North East corner
];

// Add a rectangle to represent the geofence area
var geofence = L.rectangle(bounds, {
  color: 'blue',      // Color of the border
  weight: 2,          // Border thickness
  fillColor: '#0f3',  // Fill color
  fillOpacity: 0.4    // Fill opacity
}).addTo(map);

// Optionally, fit the map view to the rectangle bounds
map.fitBounds(bounds);

// Define a marker to represent the car's location
var carLocation = L.marker([35.2349391, 129.9315245]).addTo(map);

// Add a tooltip to the marker
carLocation.bindTooltip("CASSETTE_ID: "+CASSETTE_ID, {permanent: true, className: "my-label", offset: [0, 0]});



// Function to send event to Splunk
const sendEventToSplunk = (data) => {
    fetch('http://localhost:8081/splunk-proxy', { // Update this line to use the proxy
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(text => console.log("Event sent to Splunk successfully", text))
    .catch(error => console.error("Error sending event to Splunk:", error));
  };

 

  var startingLongitude = 129.0825245; // The starting longitude
  var longitudeStep = 0.009; // The fixed step for each point
  
  // Define the path with equal distance increments for longitude
  var path = [
    [35.2049391, startingLongitude],
  ];
  
  for (let i = 1; i < 7; i++) { // Example for 10 points, adjust the number as needed
    path.push([35.2040391, startingLongitude + i * longitudeStep]);
  }
  
  // Log the path to verify the points
  //console.log(path);

// Initialize an index to track the current position on the path
var pathIndex = 0;

var geofenceBounds = geofence.getBounds(); // Get the bounds of the rectangle
var carLatLng = carLocation.getLatLng(); // Get the car's current position
// Modified moveCar function to follow the specified path
function moveCar() {
  if(pathIndex<path.length){
    // Update car location to the next point on the path
  carLocation.setLatLng(path[pathIndex]);

  
  //alert('The car has arrived within the predefined area.' + pathIndex);
  //carLatLng = carLocation.getLatLng()
  //if (geofenceBounds.contains(carLatLng)) {
  //  alert('The car has arrived within the predefined area.');
  //} 
  

  // Prepare and send the data to Splunk
  sendEventToSplunk({
    host: "20.249.93.16",
    source: "tcp",
    event : `POST / HTTP/1.1
X-M2M-EC: 2
X-M2M-Origin: Sa6a7a66f8f8446fc82804ac881c37ca0
Accept: application/json
Content-Location: /~/CB00001/P2P_IoT_Service/Cassette_IR016/cnt-report
X-M2M-RI: 57459
Content-Type: application/vnd.onem2m-ntfy+json;charset=UTF-8
User-Agent: Java/1.8.0_382
Host: 20.249.94.191:9991
Connection: keep-alive
Content-Length: 730
{"m2m:sgn":{"nev":{"rep":{"m2m:cin":{"ty":4,"ri":"cin00018b3b41d549-8f1693113f68","rn":"cin-018b3b41d549-8f1693113f68","pi":"cnt00000000000000005","ct":"20231017T103052","lt":"20231017T103052","et":"20231116T103052","st":58322,"cr":"Sa6a7a66f8f8446fc82804ac881c37ca0","cnf":"application/json","cs":166,"con":"{"LOCAT":[${path[pathIndex][0]},${path[pathIndex][1]}],"BATTERY":"100.0","HUM":"465.0","STATUS":"0","TEMP":"-9.0","CASSETTE_ID":"${CASSETTE_ID}","CREATE_TIME":"20231017103121","GW_ID":"gw_0001","VIB":"1.0"}"}},"om":{"op":1,"org":"Sa6a7a66f8f8446fc82804ac881c37ca0"}},"vrq":false,"sud":false,"sur":"/~/CB00001/P2P_IoT_Service/Cassette_IR016/cnt-report/sub-Cassette_IR016_nmas_portal","cr":"Sa6a7a66f8f8446fc82804ac881c37ca0"}}`,

     // event: {latitude: path[pathIndex][0],longitude: path[pathIndex][1]},
      sourcetype: "iot-sensing-json",
      index: 'iot-sensing'
  });

  // Increment the path index, loop back to start if at the end of the path
  //pathIndex = (pathIndex + 1) % path.length;
  pathIndex = pathIndex + 1
  }
  
}

// Simulate car movement every 5 seconds
setInterval(moveCar, 7000);
