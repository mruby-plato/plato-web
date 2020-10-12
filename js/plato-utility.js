// Global variables
var curChars = {};
var maxRows = 20;

// Constants
// const chars = [];
const charKeys = [
  'chr_proximity',
  'chr_major',
  'chr_minor',
  'chr_txpow',
  'chr_advint',
  'chr_mespow'
];

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
  .then( () => {return ble.write("Register", [0x02]);})
  .then( () => {return bt.connectGATT('Proximity');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('Major');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('Minor');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('TXPower');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('AdvIntr');} )
  .then( () => {return bt.dataCharacteristic.readValue();} )
  .then( () => {return bt.connectGATT('MesPower');} )
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
  setup_bluetooth(ble, bt_handlers);

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
    case 'Proximity': showValue('chr_proximity', data, 16); break;
    case 'Major': showValue('chr_major', data, 1); break;
    case 'Minor': showValue('chr_minor', data, 2); break;
    case 'TXPower': showValue('chr_txpow', data, 1); break;
    case 'AdvIntr': showValue('chr_advint', data, 2); break;
    case 'MesPower': showValue('chr_mespow', data, 1); break;
    case 'DeviceID': showText('chr_devid', data, 8, ":"); break;
    case 'FWVer': showText('chr_fwver', data, 3); break;
    case 'DataNotify': showData(data); break;
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
    case 'chr_proximity': writeValue('Proximity',data, 16); break;
    case 'chr_major':     writeValue('Major', data, 1); break;
    case 'chr_minor':     writeValue('Minor', data, 2); break;
    case 'chr_txpow':     writeValue('TXPower', data, 1); break;
    case 'chr_advint':    writeValue('AdvIntr', data, 2); break;
    case 'chr_mespow':    writeValue('MesPower', data, 1); break;
    default:      break;
  }
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

function led_write(rgb) {
  ble.write("DataWrite", [0x1e, 0x00, 0x00, 0x00, rgb]);
}

var ledval = 0;

// LED(R) on
function led_r_on() {
  ledval |= 0x04;
  led_write(ledval);
  document.getElementById("bt_led_r_on").style.display = "none";
  document.getElementById("bt_led_r_off").style.display = "block";
}
// LED(R) off
function led_r_off() {
  ledval &= ~0x04;
  led_write(ledval);
  document.getElementById("bt_led_r_on").style.display = "block";
  document.getElementById("bt_led_r_off").style.display = "none";
}

// LED(G) on
function led_g_on() {
  ledval |= 0x02;
  led_write(ledval);
  document.getElementById("bt_led_g_on").style.display = "none";
  document.getElementById("bt_led_g_off").style.display = "block";
}
// LED(G) off
function led_g_off() {
  ledval &= ~0x02;
  led_write(ledval);
  document.getElementById("bt_led_g_on").style.display = "block";
  document.getElementById("bt_led_g_off").style.display = "none";
}

// LED(B) on
function led_b_on() {
  ledval |= 0x08;
  led_write(ledval);
  document.getElementById("bt_led_b_on").style.display = "none";
  document.getElementById("bt_led_b_off").style.display = "block";
}
// LED(B) off
function led_b_off() {
  ledval &= ~0x08;
  led_write(ledval);
  document.getElementById("bt_led_b_on").style.display = "block";
  document.getElementById("bt_led_b_off").style.display = "none";
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
  ble.write("Register", [0x01]);
}

// onload event handler
window.addEventListener("load", function() {
  // document.getElementById("bt_ledon").style.display = "block";
  // document.getElementById("bt_ledoff").style.display = "none";
  document.getElementById("bt_led_r_on").style.display = "block";
  document.getElementById("bt_led_r_off").style.display = "none";
  document.getElementById("bt_led_g_on").style.display = "block";
  document.getElementById("bt_led_g_off").style.display = "none";
  document.getElementById("bt_led_b_on").style.display = "block";
  document.getElementById("bt_led_b_off").style.display = "none";
  document.getElementById("bt_start_not").style.display = "block";
  document.getElementById("bt_stop_not").style.display = "none";
});
