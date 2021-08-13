// Constants

// Data typpes
const DT_ANGLE  = 0x02;
const DT_TEMP   = 0x04;
const DT_HUMI   = 0x05;
const DT_PRES   = 0x06;
const DT_ILLU   = 0x07;
const DT_VIBR   = 0x15;

const datatypes = [];
datatypes[DT_ANGLE] = {color: '#22ff88', min: -180, max: 180};
datatypes[DT_TEMP]  = {color: '#ff6622', min: 5, max: 40};
datatypes[DT_HUMI]  = {color: '#2222ff', min: 0, max: 100};
datatypes[DT_PRES]  = {color: '#88ccff', min: 850, max: 1050};
datatypes[DT_ILLU]  = {color: '#eecc22', min: 0, max: 1000};
datatypes[DT_VIBR]  = {color: '#444444', min: 0, max: 1};

// Data type for show graph
const showtypes = [DT_TEMP, DT_HUMI];

// Initialize constant
const points = [];
points[DT_ANGLE] = {
  y: {name: 'Angle', data: []},
  x: {name: 'Time2', data: []}
};
points[DT_TEMP] = {
  y: {name: 'Temperature', data: []},
  x: {name: 'Time4', data: []}
};
points[DT_HUMI] = {
  y: {name: 'Humidity', data: []},
  x: {name: 'Time5', data: []}
};
points[DT_PRES] = {
  y: {name: 'Air pressure', data: []},
  x: {name: 'Time6', data: []}
};
points[DT_ILLU] = {
  y: {name: 'Illuminance', data: []},
  x: {name: 'Time7', data: []}
};
points[DT_VIBR] = {
  y: {name: 'Vibration', data: []},
  x: {name: 'Time15', data: []}
};

// Global variables
var chart = null;   // Chart object
var xsamples = 30;  // Count of X-axis data

// Convert integer to 2 digits hexadecimal string
function hex2(val) {
  return ("0" + (new Number(val)).toString(16).toUpperCase()).slice(-2);
}

// roundPrecision
function roundPrecision(f, digits) {
  let pre = Math.pow(10, digits);
  return Math.round(f * pre) / pre;
}

// Read Plato characteristics
function readCharacteristics(bt) {
  // Scan option
  let options = {
    'filters': [{'namePrefix': 'Plato'}],
    'optionalServices': [
      "24620100-1f7e-4adb-936a-ba3687e99b18",
      "24620200-1f7e-4adb-936a-ba3687e99b18",
      "24620300-1f7e-4adb-936a-ba3687e99b18",
      "24625200-1f7e-4adb-936a-ba3687e99b18"
    ]
  };

  return (bt.scanWithOptions(options))
  .then( () => {return bt.write("Register", [0x02]);})
  // .then( () => {return bt.connectGATT('Proximity');} )
  // .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('Major');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('Minor');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  // .then( () => {return bt.connectGATT('TXPower');} )
  // .then( () => {return bt.dataCharacteristic.readValue();} )
  // .then( () => {return bt.connectGATT('AdvIntr');} )
  // .then( () => {return bt.dataCharacteristic.readValue();} )
  // .then( () => {return bt.connectGATT('MesPower');} )
  // .then( () => {return bt.dataCharacteristic.readValue();} )
  // .then( () => {return bt.connectGATT('DeviceID');} )
  // .then( () => {return bt.dataCharacteristic.readValue();} )
  // .then( () => {return bt.connectGATT('FWVer');} )
  // .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {
    document.getElementById('bt_start_not').removeAttribute("disabled");
    document.getElementById("bt_start_not").style.color = "black";
  })
  .catch(error => {
    console.log('Error : ' + error);
    this.onError(error);
  })
}

// Scan button handler
// Scan BT device and read all characteristics
function scanDevice() {
  ble = new BlueJelly();

  // BT event handler
  bt_handlers = {
    scan: onScan,
    read: onRead,
    // write: onWrite
  };

  // Init BlueJelly
  setup_bluetooth(ble, bt_handlers);

  readCharacteristics(ble);
}

// BlueJelly.onScan handler
function onScan(deviceName) {
  console.log("Connected: " + deviceName);
  console.log("id: " + this.bluetoothDevice.id);
  document.getElementById("devname").innerText = deviceName;
}

function plotData(data) {
  let dtype = data.getUint8(0);
  // let devid = hex2(data.getUint8(1)) + hex2(data.getUint8(2)) + hex2(data.getUint8(3));

  var time = new Date();
  time.setMilliseconds(0);

  // var typeid = "";
  var dval = 0;
  switch (dtype) {
    case DT_ANGLE:  // Angle
      // dval = roundPrecision(data.getFloat32(4, true), 1);   // X
      // dval = roundPrecision(data.getFloat32(8, true), 1);   // Y
      dval = roundPrecision(data.getFloat32(12, true), 1);  // Z
      break;
    case DT_TEMP:   // Temperature
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    case DT_HUMI:   // Humidity
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    case DT_PRES:   // Air pressure
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    case DT_ILLU:   // Illuminance
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    case DT_VIBR:   // Vibration
      dval = data.getUint16(4, 1) >> 15;
      break;
    default:
      break;
  }

  // let timeid = pointids[dtype].time;
  // let typeid = pointids[dtype].data;
  // points[timeid].push(time);
  // points[typeid].push(dval);
  points[dtype].x.data.push(time);
  points[dtype].y.data.push(dval);

  var basetime = null;
  // if (points[timeid].length >= xsamples) {
  //   points[timeid].shift();
  //   points[typeid].shift();
  //   basetime = points[timeid][0];
  // }
  if (points[dtype].x.data.length >= xsamples) {
    points[dtype].x.data.shift();
    points[dtype].y.data.shift();
    basetime = points[dtype].x.data[0];
  }
  if (basetime) {
    // for(let i in pointids) {
    //   if (i == dtype) continue;
    //   if (points[pointids[i].time][0] < basetime) {
    //     console.log('delete: time=' + points[pointids[i].time][0] + ", basetime=" + basetime);
    //     points[pointids[i].time].shift();
    //     points[pointids[i].data].shift();
    //   }
    // }
    for(let i in points) {
      if (i == dtype) continue;
      if (points[i].x.data[0] < basetime) {
        console.log('delete: time=' + points[i].x.data[0] + ", basetime=" + basetime);
        points[i].x.data.shift();
        points[i].y.data.shift();
      }
    }
  }

  // Draw graph
  var plots = [];
  // for (var dt in points) {
  //   var line = Array.from(points[dt]);
  //   line.splice(0, 0, dt);
  //   plots.push(line);
  // }
  for (let i in points) {
    if (!showtypes.includes(parseInt(i))) continue; // Skip hide data type
    if (points[i].x.data.length == 0) continue;     // Skip when data empty
    for (let dt in points[i]) {
      var line = Array.from(points[i][dt].data);    // Set data (cloned)
      line.splice(0, 0, points[i][dt].name);        // Set title of axis
      plots.push(line);
    }
  }

  // Show c3.js chart
  chart.load({columns: plots});
}

// BlueJelly.onRead handler
function onRead(data, uuid) {
  let bt = this;

  switch(uuid) {
    case 'Major': break;
    case 'Minor': break;
    case 'DataNotify': plotData(data); break;
    default:      break;
  }

  var val = uuid + ": ";
  for (var i=0; i<data.byteLength; i++) {
    value = data.getUint8(i);
    if (i > 0) val += ',';
    val += value;
  }
  console.log(val);
}

// Start data notification
function startNotify() {
  ble.startNotify("DataNotify");
  document.getElementById("bt_start_not").style.display = "none";
  document.getElementById("bt_stop_not").style.display = "block";
}
// Stop data notification
function stopNotify() {
  ble.stopNotify("DataNotify");
  document.getElementById("bt_start_not").style.display = "block";
  document.getElementById("bt_stop_not").style.display = "none";
}

// Setup graph
function setupGraph() {
  ptl = points[showtypes[0]];
  ptr = points[showtypes[1]];
  dtl = datatypes[showtypes[0]];
  dtr = datatypes[showtypes[1]];

  var _xs = [];
  _xs[ptl.y.name] = ptl.x.name;
  _xs[ptr.y.name] = ptr.x.name;
  var _axisr = [];
  _axisr[ptr.y.name] = 'y2';
  var _colors = [];
  _colors[ptl.y.name] = dtl.color;
  _colors[ptr.y.name] = dtr.color;

  // Initialize c3.js chart
  chart = c3.generate({
    bindto: '#chart',
    data: {
      xs: _xs,
      columns: [
      ],
      axes: _axisr,
      colors: _colors
    },
    axis: {
      x: {
        type:"timeseries",
        tick: {
          format: "%H:%M:%S"
        }
      },
      y: {
        min: dtl.min,
        max: dtl.max,
        label: {
          text: ptl.y.name,
          position: 'outer-middle'
        }
      },
      y2: {
        show: true,
        min: dtr.min,
        max: dtr.max,
        label: {
          text: ptr.y.name,
          position: 'outer-middle'
        }
      }
    }
  });
}

// Change show data
function changeLeftData(event) {
  showtypes[0] = parseInt(event.currentTarget.value);
  setupGraph();
}
function changeRightData(event) {
  showtypes[1] = parseInt(event.currentTarget.value);
  setupGraph();
}

// onload event handler
window.addEventListener("load", function() {
  document.getElementById("bt_start_not").style.display = "block";
  document.getElementById('bt_start_not').setAttribute("disabled", true);
  document.getElementById("bt_start_not").style.color = "Gray";
  document.getElementById("bt_stop_not").style.display = "none";

  document.getElementById("datatype_l").addEventListener('change', changeLeftData);
  document.getElementById("datatype_r").addEventListener('change', changeRightData);

  // setup graph
  setupGraph();
});
