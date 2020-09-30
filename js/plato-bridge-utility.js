// Global variables
var curChars = {};
var maxRows = 20;

// Constants
const charKeys = [
  'chr_otaa_enable',
  'chr_dev_eui',
  'chr_app_eui',
  'chr_app_key',
  'chr_dev_addr',
  'chr_apps_key',
  'chr_nwks_key',
  'chr_uplink',
  'chr_join_state',
  'chr_downlink'
];

// Read Plato characteristics
function readCharacteristics(bt) {
  // Scan option
  let options = {
    'filters': [{'namePrefix': 'PlatoB'}],
    'optionalServices': [
      "3c020100-121c-4fa0-b78e-debdf5514cc6",
      "3c020300-121c-4fa0-b78e-debdf5514cc6",
      "3c025200-121c-4fa0-b78e-debdf5514cc6"
    ]
  };

  return (bt.scanWithOptions(options))
  .then( () => {return bt.connectGATT('OTAAEnable');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('DevEUI');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('AppEUI');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('AppKey');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('DevAddr');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('AppsKey');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('NWKSKey');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('Uplink');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('JoinState');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('Downlink');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('DeviceID');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('FWVer');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
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
  setup_bluetooth(ble, bt_handlers, setup_plato_bridge_uuid);

  readCharacteristics(ble);
}

// Refresh button handler
// Read all characteristics
function refreshCharacteristics() {
  readCharacteristics(ble);
}

// BlueJelly.onScan handler
function onScan(deviceName) {
  console.log("Connected: " + deviceName);
  console.log("id: " + this.bluetoothDevice.id);
  document.getElementById("devname").innerText = deviceName;
}

// Convert integer to 2 digits hexadecimal string
function hex2(val) {
  return ("0" + (new Number(val)).toString(16).toUpperCase()).slice(-2);
}

function showValue(id, bin, bytes=1, sep="") {
  var hex = "";
  for (var i=0; i<bytes; i++) {
    if (i > 0 && sep.length > 0) hex += sep;
    hex += hex2(bin.getUint8([i]));
  }
  document.getElementById(id).value = hex;
  curChars[id] = hex;
}

function showText(id, bin, bytes=1, sep="") {
  var hex = "";
  for (var i=0; i<bytes; i++) {
    if (i > 0 && sep.length > 0) hex += sep;
    hex += hex2(bin.getUint8([i]));
  }
  document.getElementById(id).innerText = hex;
}

// roundPrecision
function roundPrecision(f, digits) {
  let pre = Math.pow(10, digits);
  return Math.round(f * pre) / pre;
}

function showData(data) {
  let table = document.getElementById("tbl_data");
  var oldhtml = table.innerHTML;
  var lines = table.innerHTML.split("\n");
  var html = "";

  // 1: date
  html += "<tr><td>";
  html += (new Date()).toLocaleString();
  html += "</td><td>";

  // 2: dev id
  for (var i=1; i<=3; i++) {
    html += hex2(data.getUint8(i));
  }
  html += "</td><td>";
  
  var dtype = "";
  var dval = "";
  switch (data.getUint8(0)) {
    case 0x04:  // Temperature
      dtype = "Temperature";
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    case 0x05:  // Humidity
      dtype = "Humidity";
      dval = roundPrecision(data.getFloat32(4, true), 1);
      break;
    default:
      break;
  }
  html += dtype;
  html += "</td><td>";
  html += dval;

  html += "</td></tr>";

  // Insert new data
  lines.splice(1, 0, html);
  // Adjust count of lines
  if (lines.length > maxRows + 1) lines.pop();

  table.innerHTML = lines.join("\n");
}

// BlueJelly.onRead handler
function onRead(data, uuid) {
  let bt = this;

  switch(uuid) {
    case 'OTAAEnable': showValue('chr_otaa_enable', data, 1); break;
    case 'DevEUI': showValue('chr_dev_eui', data, 8); break;
    case 'AppEUI': showValue('chr_app_eui', data, 8); break;
    case 'AppKey': showValue('chr_app_key', data, 16); break;
    case 'DevAddr': showValue('chr_dev_addr', data, 4); break;
    case 'AppsKey': showValue('chr_apps_key', data, 16); break;
    case 'NWKSKey': showValue('chr_nwks_key', data, 16); break;
    case 'Uplink': showValue('chr_uplink', data, 20); break;
    case 'JoinState': showText('chr_join_state', data, 1); break;
    case 'Downlink': showText('chr_downlink', data, 20); break;
    case 'DeviceID': showText('chr_devid', data, 8, ":"); break;
    case 'FWVer': showText('chr_fwver', data, 3); break;
    default: break;
  }

  var val = uuid + ": ";
  for (var i=0; i<data.byteLength; i++) {
    value = data.getUint8(i);
    if (i > 0) val += ',';
    val += value;
  }
  console.log(val);
}

// Write characteristic value
function writeValue(uuid, hex, len) {
  let bin = new Uint8Array(len);
  for (var i=0; i<len; i++) {
    bin[i] = parseInt(hex.substr(i*2, 2), 16);
  }
  ble.write(uuid, bin);
}

// Write Plato characteristic
function writeCharacteristic(key, data, len) {
  switch(key) {
    case 'chr_otaa_enable': writeValue('OTAAEnable', data, 1); break;
    case 'chr_dev_eui': writeValue('DevEUI', data, 8); break;
    case 'chr_app_eui': writeValue('AppEUI', data, 8); break;
    case 'chr_app_key': writeValue('AppKey', data, 16); break;
    case 'chr_dev_addr': writeValue('DevAddr', data, 4); break;
    case 'chr_apps_key': writeValue('AppsKey', data, 16); break;
    case 'chr_nwks_key': writeValue('NWKSKey', data, 16); break;
    case 'chr_uplink': writeValue('Uplink', data, 20); break;
    default:      break;
  }
}

// LED on
function ledon() {
  ble.write("WriteApp", [0x01]);
  document.getElementById("bt_ledon").style.display = "none";
  document.getElementById("bt_ledoff").style.display = "block";
}
// LED off
function ledoff() {
  ble.write("WriteApp", [0x00]);
  document.getElementById("bt_ledon").style.display = "block";
  document.getElementById("bt_ledoff").style.display = "none";
}

// Update all characteristics
function updateCharacteristics() {
  for (var i=0; i<charKeys.length; i++) {
    let key = charKeys[i];
    var newVal = document.getElementById(key).value;
    if (curChars[key] != document.getElementById(key).value) {
      writeCharacteristic(key, newVal);
    }
  }
  ble.write("ParaWrite", [0x01]);
}

// onload event handler
window.addEventListener("load", function() {
  document.getElementById("bt_ledon").style.display = "block";
  document.getElementById("bt_ledoff").style.display = "none";
});
