// Constants
const pointids = [];
pointids[0x04] = {time: 'Time4', data: 'Temperature'};
pointids[0x05] = {time: 'Time5', data: 'Humidity'};

const points = {
  'Time4': [],
  'Time5': [],
  'Temperature': [],
  'Humidity': []
};

// Global variables
var chart = null;
var xsamples = 30;

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
    case 0x04:  // Temperature
      // typeid = "Temperature";
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    case 0x05:  // Humidity
      // typeid = "Humidity";
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    default:
      break;
  }

  // let tid = 'Time'+dtype;
  let timeid = pointids[dtype].time;
  let typeid = pointids[dtype].data;
  points[timeid].push(time);
  points[typeid].push(dval);

  var basetime = null;
  if (points[timeid].length >= xsamples) {
    points[timeid].shift();
    points[typeid].shift();
    basetime = points[timeid][0];
  }
  if (basetime) {
    for(let i in pointids) {
      if (i == dtype) continue;
      if (points[pointids[i].time][0] < basetime) {
        console.log('delete: time=' + points[pointids[i].time][0] + ", basetime=" + basetime);
        points[pointids[i].time].shift();
        points[pointids[i].data].shift();
      }
    }
  }

  var plots = [];
  for (var dt in points) {
    var line = Array.from(points[dt]);
    line.splice(0, 0, dt);
    plots.push(line);
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

// onload event handler
window.addEventListener("load", function() {
  document.getElementById("bt_start_not").style.display = "block";
  document.getElementById('bt_start_not').setAttribute("disabled", true);
  document.getElementById("bt_start_not").style.color = "Gray";
  document.getElementById("bt_stop_not").style.display = "none";

  // Initialize c3.js chart
  chart = c3.generate({
    bindto: '#chart',
    data: {
      xs: {
        'Temperature': 'Time4',
        'Humidity': 'Time5'
      },
      columns: [
      ],
      axes: {
        'Humidity': 'y2'
      },
      colors: {
        'Temperature': '#ff8822',
        'Humidity': '#2222ff'
      }
    },
    axis: {
      x: {
        type:"timeseries",
        tick: {
          format: "%H:%M:%S"
        }
      },
      y: {
        label: {
          text: 'Temperature',
          position: 'outer-middle'
        }
      },
      y2: {
        show: true,
        min: 0,
        max: 100,
        label: {
          text: 'Humidity',
          position: 'outer-middle'
        }
      }
    }
  });
});
