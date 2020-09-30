// Global variables
var ble = new BlueJelly();
var wrtseq = -1;
var mrbreader = null;
var mrbbin = null;
var bt_handlers = {};

// Constants
const mrb_chunk_start = 3;
const mrb_chunk_size = 16;
const mrb_write_delay = 1;  // 1ms

// trans_mrb(bt, seq)
// Transfer mrb chunk
//  bt:   Instance of BlueJelly
//  seq:  Sequence number of mrb chunk (0..)
function trans_mrb(bt, seq) {
  if (seq >= mrbbin.byteLength / mrb_chunk_size) {
    wrtseq = -1;
    let buf = [0x07, 0x70, 0x61, 0x73, 0x73, 0x00];
    bt.write("WriteApp", buf);
    console.log("Transfer completed.");
    return;
  }

  var mrbbuf = [0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  mrbbuf[1] = Math.floor(seq / 256);
  mrbbuf[2] = seq % 256;

  for (var i=0; i<mrb_chunk_size; i++) {
    mrbbuf[mrb_chunk_start + i] = mrbbin[seq * mrb_chunk_size + i];
  }
  bt.write("WriteApp", mrbbuf);
  // document.getElementById("bin").innerHTML = seq + ": " + mrbbuf;
  console.log(seq + ": " + mrbbuf);
}

// Transfer application binary to BT device
function trans_appbin(idx) {
  let btdev = btdevs[idx];
  let seq = btdev.wrtseq;

  showProgress(idx);

  if (seq >= mrbbin.byteLength / mrb_chunk_size) {
    btdev.wrtseq = -1;
    let buf = [0x07, 0x70, 0x61, 0x73, 0x73, 0x00];
    btdev.bt.write("WriteApp", buf);
    console.log("Transfer completed. idx=" + idx);
    return;
  }

  // var binbuf = [0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // binbuf[1] = Math.floor(seq / 256);
  // binbuf[2] = seq % 256;
  btdev.binbuf[1] = Math.floor(seq / 256);
  btdev.binbuf[2] = seq % 256;

  for (var i=0; i<mrb_chunk_size; i++) {
    // binbuf[mrb_chunk_start + i] = mrbbin[seq * mrb_chunk_size + i];
    btdev.binbuf[mrb_chunk_start + i] = mrbbin[seq * mrb_chunk_size + i];
  }
  // btdev.bt.write("WriteApp", binbuf);
  btdev.bt.write("WriteApp", btdev.binbuf);
  // document.getElementById("bin").innerHTML = seq + ": " + mrbbuf;
  // console.log(idx + ": " + seq + ": " + binbuf);
  console.log(idx + ": " + seq + ": " + btdev.binbuf);
}

// Show transfer progress
function showProgress(idx) {
  let btdev = btdevs[idx];
  var per = Math.round(100.0 * (mrb_chunk_size * btdev.wrtseq) / mrbbin.byteLength);
  var sts = (per >= 100.0) ? "Completed" : ("Writing... (" + per + "%)");
  document.getElementById("btsts" + idx).innerText = sts;
}

// Write application binary to BT devices
function writeAppl() {
  for (var i=0; i<btdevs.length; i++) {
    btdevs[i].wrtseq = 0;
    btdevs[i].binbuf = [0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    showProgress(i);
    trans_appbin(i);
  }
}

// load_appbin(file)
// Load application binary
//  file: bin file (which include mrb files)
function load_appbin(file) {
  let mrbreader = new FileReader();
  mrbbin = null;
  mrbreader.onload = function() {
    // initialize sequence number
    wrtseq = 0;
    mrbbin = new Uint8Array(mrbreader.result);
    document.getElementById("load_status").innerText = "loaded.";
  }
  mrbreader.readAsArrayBuffer(file);
}

// start_trans_mrb(bt, file)
// Start transfer mrb file
//  bt:   Instance of BlueJelly
//  file: MRB file
function start_trans_mrb(bt, file) {
  let mrbreader = new FileReader();
  mrbreader.onload = function() {
    // initialize sequence number
    wrtseq = 0;
    mrbbin = new Uint8Array(mrbreader.result);
    trans_mrb(bt, wrtseq);
  }
  mrbreader.readAsArrayBuffer(file);
}

// setup_plato_uuid(bt)
// Setup Plato services
//  bt:   Instance of BlueJelly
function setup_plato_uuid(bt) {
  // Beacon Service: 24620100-1f7e-4adb-936a-ba3687e99b18
  // 0101: Proximity UUID
  bt.setUUID("Proximity",  "24620100-1f7e-4adb-936a-ba3687e99b18", "24620101-1f7e-4adb-936a-ba3687e99b18");
  // 0102: Major
  bt.setUUID("Major",      "24620100-1f7e-4adb-936a-ba3687e99b18", "24620102-1f7e-4adb-936a-ba3687e99b18");
  // 0103: Minor
  bt.setUUID("Minor",      "24620100-1f7e-4adb-936a-ba3687e99b18", "24620103-1f7e-4adb-936a-ba3687e99b18");
  // 0104: Tx Power
  bt.setUUID("TXPower",    "24620100-1f7e-4adb-936a-ba3687e99b18", "24620104-1f7e-4adb-936a-ba3687e99b18");
  // 0105: Adv. interval
  bt.setUUID("AdvIntr",    "24620100-1f7e-4adb-936a-ba3687e99b18", "24620105-1f7e-4adb-936a-ba3687e99b18");
  // 0106: Measure Power
  bt.setUUID("MesPower",   "24620100-1f7e-4adb-936a-ba3687e99b18", "24620106-1f7e-4adb-936a-ba3687e99b18");
  // 0107: Regisger
  bt.setUUID("Register",   "24620100-1f7e-4adb-936a-ba3687e99b18", "24620107-1f7e-4adb-936a-ba3687e99b18");

  // Data Service: 24620200-1f7e-4adb-936a-ba3687e99b18
  // 0201: Data Write
  bt.setUUID("DataWrite",  "24620200-1f7e-4adb-936a-ba3687e99b18", "24620201-1f7e-4adb-936a-ba3687e99b18");
  // 0202: Data Notify
  bt.setUUID("DataNotify", "24620200-1f7e-4adb-936a-ba3687e99b18", "24620202-1f7e-4adb-936a-ba3687e99b18");

  // Device Information Service: 24620300-1f7e-4adb-936a-ba3687e99b18
  // 0301: Device ID
  bt.setUUID("DeviceID",   "24620300-1f7e-4adb-936a-ba3687e99b18", "24620301-1f7e-4adb-936a-ba3687e99b18");
  // 0302: Firmware Version
  bt.setUUID("FWVer",      "24620300-1f7e-4adb-936a-ba3687e99b18", "24620302-1f7e-4adb-936a-ba3687e99b18");

  // mruby Service: 24625200-1f7e-4adb-936a-ba3687e99b18
  // 5204: WRITE_APP
  bt.setUUID("WriteApp",   "24625200-1f7e-4adb-936a-ba3687e99b18", "24625204-1f7e-4adb-936a-ba3687e99b18");
}

function setup_plato_bridge_uuid(bt) {
  // LoRa Setting Service: 3c020100-121c-4fa0-b78e-debdf5514cc6
  // 0101: OTAA Enable
  bt.setUUID("OTAAEnable",  "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020101-121c-4fa0-b78e-debdf5514cc6");
  // 0102: DevEUI
  bt.setUUID("DevEUI",      "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020102-121c-4fa0-b78e-debdf5514cc6");
  // 0103: AppEUI
  bt.setUUID("AppEUI",      "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020103-121c-4fa0-b78e-debdf5514cc6");
  // 0104: AppKey
  bt.setUUID("AppKey",      "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020104-121c-4fa0-b78e-debdf5514cc6");
  // 0105: DevAddr
  bt.setUUID("DevAddr",     "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020105-121c-4fa0-b78e-debdf5514cc6");
  // 0106: AppsKey
  bt.setUUID("AppsKey",     "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020106-121c-4fa0-b78e-debdf5514cc6");
  // 0107: NWKSKey
  bt.setUUID("NWKSKey",     "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020107-121c-4fa0-b78e-debdf5514cc6");
  // 0108: Uplink Test
  bt.setUUID("Uplink",      "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020108-121c-4fa0-b78e-debdf5514cc6");
  // 0109: Join State
  bt.setUUID("JoinState",   "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c020109-121c-4fa0-b78e-debdf5514cc6");
  // 010A: Downlink Test
  bt.setUUID("Downlink",    "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c02010a-121c-4fa0-b78e-debdf5514cc6");
  // 010B: Parameter Write
  bt.setUUID("ParaWrite",   "3c020100-121c-4fa0-b78e-debdf5514cc6", "3c02010b-121c-4fa0-b78e-debdf5514cc6");

  // Device Information Service: 3c020300-121c-4fa0-b78e-debdf5514cc6
  // 0301: Device ID
  bt.setUUID("DeviceID",   "3c020300-121c-4fa0-b78e-debdf5514cc6", "3c020301-121c-4fa0-b78e-debdf5514cc6");
  // 0302: Firmware Version
  bt.setUUID("FWVer",      "3c020300-121c-4fa0-b78e-debdf5514cc6", "3c020302-121c-4fa0-b78e-debdf5514cc6");

  // mruby Service: 3c025200-121c-4fa0-b78e-debdf5514cc6
  // 5204: WRITE_APP
  bt.setUUID("WriteApp",   "3c025200-121c-4fa0-b78e-debdf5514cc6", "3c025204-121c-4fa0-b78e-debdf5514cc6");
}

// setup_bluetooth(bt)
// Initialize BlueJelly and setup Bluetooth services
//  bt:   Instance of BlueJelly
//  ehs:  Event handlers 
function setup_bluetooth(bt, ehs={}, setup=setup_plato_uuid) {
  // Set Plato Service UUID
  // setup_plato_uuid(bt);
  setup(bt);

  // Add event handlers
  if (ehs.scan) bt.onScan = ehs.scan;
  if (ehs.read) bt.onRead = ehs.read;
  if (ehs.write) bt.onWrite = ehs.write;
  if (ehs.disconnect) bt.onDisconnect = ehs.disconnect;
  if (ehs.clear) bt.onClear = ehs.clear;
  if (ehs.reset) bt.onReset = ehs.reset;
  if (ehs.error) bt.onError = ehs.error;
}

//--------------------------------------------------
// BlueHJelly.scanWithOptions(options)
//--------------------------------------------------
BlueJelly.prototype.scanWithOptions = function(options) {
  return (this.bluetoothDevice ? Promise.resolve() : this.requestDeviceWithOptions(options))
  .catch(error => {
    console.log('Error : ' + error);
    this.onError(error);
  });
}

// Scan BT devices by device name
BlueJelly.prototype.scanByName = function(name) {
  if (name.length > 0)  options = {'filters': [{'name': name}]};
  else                  options = {'acceptAllDevices': true};
  return this.scanWithOptions(options);
}

// Scan BT devices by device name prefix
BlueJelly.prototype.scanByNamePrefix = function(prefix) {
  if (prefix.length > 0)  options = {'filters': [{'namePrefix': prefix}]};
  else                    options = {'acceptAllDevices': true};
  return this.scanWithOptions(options);
}

// Scan BT devices by service UUID
// (NOT WORKING YET)
BlueJelly.prototype.scanByUUID = function(uuid) {
  if (uuid.length > 0)  options = {'filters': [{'BluetoothServiceUUIDs': [uuid]}]};
  else                  options = {'acceptAllDevices': true};
  return this.scanWithOptions(options);
}

//--------------------------------------------------
//requestDeviceWithOptions
//--------------------------------------------------
BlueJelly.prototype.requestDeviceWithOptions = function(options) {
  console.log('Execute : requestDeviceWithOptions');
  return navigator.bluetooth.requestDevice(options)
  .then(device => {
    this.bluetoothDevice = device;
    this.bluetoothDevice.addEventListener('gattserverdisconnected', this.onDisconnect);
    this.onScan(this.bluetoothDevice.name);
  });
}
