// Global variables
var ble = new BlueJelly();
var wrtseq = -1;
var mrbreader = null;
var mrbbin = null;

// Constants
const mrb_chunk_start = 3;
const mrb_chunk_size = 16;

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

// setup_bluetooth(bt)
// Initialize BlueJelly and setup Bluetooth services
//  bt:   Instance of BlueJelly
function setup_bluetooth(bt) {
  // Beacon Service: 24620100-1f7e-4adb-936a-ba3687e99b18
  // 0201: Proximity UUID
  bt.setUUID("Proximity",  "24620100-1f7e-4adb-936a-ba3687e99b18", "24620101-1f7e-4adb-936a-ba3687e99b18");
  // 0202: Major
  bt.setUUID("Major",      "24620100-1f7e-4adb-936a-ba3687e99b18", "24620102-1f7e-4adb-936a-ba3687e99b18");
  // 0203: Minor
  bt.setUUID("Minor",      "24620100-1f7e-4adb-936a-ba3687e99b18", "24620103-1f7e-4adb-936a-ba3687e99b18");
  // 0204: Tx Power
  bt.setUUID("TXPower",    "24620100-1f7e-4adb-936a-ba3687e99b18", "24620104-1f7e-4adb-936a-ba3687e99b18");
  // 0205: Adv. interval
  bt.setUUID("AdvIntr",    "24620100-1f7e-4adb-936a-ba3687e99b18", "24620105-1f7e-4adb-936a-ba3687e99b18");
  // 0206: Measure Power
  bt.setUUID("MesPower",   "24620100-1f7e-4adb-936a-ba3687e99b18", "24620106-1f7e-4adb-936a-ba3687e99b18");
  // 0207: Regisger
  bt.setUUID("Register",   "24620100-1f7e-4adb-936a-ba3687e99b18", "24620107-1f7e-4adb-936a-ba3687e99b18");


  // Data Service: 24620200-1f7e-4adb-936a-ba3687e99b18
  // Data Write
  bt.setUUID("DataWrite",  "24620200-1f7e-4adb-936a-ba3687e99b18", "24620201-1f7e-4adb-936a-ba3687e99b18");
  // Data Notify
  bt.setUUID("DataNotify", "24620200-1f7e-4adb-936a-ba3687e99b18", "24620202-1f7e-4adb-936a-ba3687e99b18");

  // Device Information Service: 24620300-1f7e-4adb-936a-ba3687e99b18
  // Device ID
  bt.setUUID("DeviceID",   "24620300-1f7e-4adb-936a-ba3687e99b18", "24620301-1f7e-4adb-936a-ba3687e99b18");
  // Firmware Version
  bt.setUUID("FWVer",      "24620300-1f7e-4adb-936a-ba3687e99b18", "24620302-1f7e-4adb-936a-ba3687e99b18");

  // mruby Service
  // WRITE_APP
  bt.setUUID("WriteApp",   "24625200-1f7e-4adb-936a-ba3687e99b18", "24625204-1f7e-4adb-936a-ba3687e99b18");

  // Event handlers

  // onScan
  bt.onScan = function(deviceName) {
    // document.getElementById('devname').innerHTML = deviceName;
    console.log("Connected: " + deviceName);
    console.log("id: " + this.bluetoothDevice.id);

    let idx = getBTIndex(this); //btdevs.length - 1;
    html = "<td>" + deviceName + "</td>";
    html += "<td id=\"btid" + idx + "\">Reading...</td><td id=\"btsts" + idx + "\"></td>"
    document.getElementById('bt'+idx).innerHTML = html;
  }

  // onRead
  bt.onRead = function(data, uuid) {
    let bt = this;
    var idx = getBTIndex(bt);

    switch(uuid) {
      case 'Major': onReadMajor(idx, data); break;
      case 'Minor': onReadMinor(idx, data); break;
      default:      break;
    }

    var val = uuid + ": ";
    for (var i=0; i<data.byteLength; i++) {
      value = data.getUint8(i);
      if (i > 0) val += ',';
      val += value;
    }
    // document.getElementById("text1").innerHTML = val;
    console.log(val);
  }

  // onWrite
  bt.onWrite = function(uuid) {
    if (uuid == "WriteApp" && wrtseq >= 0) {
      wrtseq++;
      trans_mrb(this, wrtseq);
    }
  }

  bt.onError = function(error) {console.log("onError: " + error);}
}

// window.onload = function() {
//   setup_bluetooth(ble);
// }

// // ClickEvents
// // iBeacon Service
// document.getElementById("bt_proximity").addEventListener("click", function(){ble.read("Proximity");});
// document.getElementById("bt_major").addEventListener("click", function(){ble.read("Major");});
// document.getElementById("bt_minor").addEventListener("click", function(){ble.read("Minor");});
// document.getElementById("bt_txpwr").addEventListener("click", function(){ble.read("TXPower");});
// document.getElementById("bt_advint").addEventListener("click", function(){ble.read("AdvIntr");});
// document.getElementById("bt_mespwr").addEventListener("click", function(){ble.read("MesPower");});
// document.getElementById("bt_regi").addEventListener("click", function(){
//   dt = [0x01];
//   ble.write("Register", dt);
//   ble.reset();
//   alert("Parameter updated.");
// });

// document.getElementById("bt_wrtpro").addEventListener("click", function(){
//   uuid = document.getElementById("InpProximity").value;
//   id = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//   for (var i=0; i<uuid.length/2; i++) {
//     id[i] = parseInt(uuid.substr(i*2, 2), 16);
//   }
//   // alert(id);
//   ble.write("Proximity", id);
// });

// // Data Service
// document.getElementById("button1").addEventListener("click", function(){
//   ble.read("DataNotify");
//   ble.startNotify("DataNotify");
// });
// document.getElementById("button2").addEventListener("click", function(){ble.stopNotify("DataNotify");});

// // Device Information Service
// document.getElementById("bt_devid").addEventListener("click", function(){ble.read("DeviceID");});
// document.getElementById("bt_fwver").addEventListener("click", function(){ble.read("FWVer");});

// // mruby Service
// document.getElementById("bt_ledoff").addEventListener("click", function(){
//   wrtseq = -1;
//   cmd = [0x00];
//   ble.write("WriteApp", cmd);
// });
// document.getElementById("bt_ledon").addEventListener("click", function(){
//   wrtseq = -1;
//   cmd = [0x01];
//   ble.write("WriteApp", cmd);
// });

// // load mrb
// document.getElementById("selmrb").addEventListener("change", function(evt) {
//   const input = evt.target;
//   if (input.files.length == 0) {
//     alert("No file selected.");
//     return;
//   }
//   const file = input.files[0];
//   // alert(file.name);
//   // mrbreader = new FileReader();
//   // mrbreader.onload = function() {
//   //   // initialize sequence number
//   //   wrtseq = 0;
//   //   mrbbin = new Uint8Array(mrbreader.result);

//   //   trans_mrb(wrtseq);
//   // };
//   // mrbreader.readAsArrayBuffer(file);
//   start_trans_mrb(ble, file);
// });

// // onWrite
// ble.onWrite = function(uuid) {
//   // console.log("onWrite: " + uuid);
//   if (uuid == "WriteApp" && wrtseq >= 0) {
//     wrtseq++;
//     trans_mrb(this, wrtseq);
//   }
// }

// // onRead
// ble.onRead = function(data, uuid) {
//   var val = uuid + ": ";
//   for (var i=0; i<data.byteLength; i++) {
//     value = data.getUint8(i);
//     val += value;
//     val += ','
//   }
//   document.getElementById("text1").innerHTML = val;
// }

// // onScan
// ble.onScan = function(deviceName) {
//   document.getElementById('devname').innerHTML = deviceName;
// }

// ble.onConnectGATT = function(uuid) {console.log("onConnectGAT: " + uuid);}  // onConnectGATT
// ble.onStartNotify = function(uuid) {console.log("onStartNotify: " + uuid);} // onStartNotify
// ble.onStopNotify = function(uuid) {console.log("onStopNotify: " + uuid);}   // onStopNotify
// ble.onDisconnect = function() {console.log("onDisconnect");}                // onDisconnect
// ble.onClear = function() {console.log("onClear");}                          // onClear
// ble.onError = function(error) {console.log("onError: " + error);}           // onError


//--------------------------------------------------
//scan2
//--------------------------------------------------
BlueJelly.prototype.scan2 = function(name='', namePrefix='', uuids=[]) {
  return (this.bluetoothDevice ? Promise.resolve() : this.requestDevice2(name, namePrefix, uuids))
  .catch(error => {
    console.log('Error : ' + error);
    this.onError(error);
  });
}

// BlueJelly.prototype.buildScanOption = function(name='', namePrefix='', uuids=[], optionUUIDs=[]) {
//   filter = {};
//   if (name.length > 0)        filter.name = name;
//   if (namePrefix.length > 0)  filter.namePrefix = name;
//   if (uuids.length > 0)       filter.BluetoothServiceUUIDs = uuids;
//   option = {};
//   if (Object.keys(filter).length > 0) {
//     option.filter = filter;
//   }
//   else {
//     option.acceptAllDevices = true;
//   }
//   if (optionUUIDs.length > 0) option.optionalServices = optionUUIDs;
//   return option;
// }

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
//requestDevice2
//--------------------------------------------------
BlueJelly.prototype.requestDevice2 = function(filter) {
  if (Object.keys(filter).length == 0) filter.acceptAllDevices = true;
  // filter = {};
  // if (name.length > 0) filter.name = name;
  // if (namePrefix.length > 0) filter.namePrefix = namePrefix;
  // if (uuids.length > 0) filter.BluetoothServiceUUIDs = uuids;
  console.log('Execute : requestDevice2');
  console.log(filter);
  return navigator.bluetooth.requestDevice({
    // acceptAllDevices: true,
    // optionalServices: [this.hashUUID[uuid].serviceUUID]
    // acceptAllDevices: false,
    // filters: [{
    //   // name: "PlatoE01",
    //   namePrefix: "Plato",
    //   // BluetoothServiceUUIDs: [
    //   //   // "24620100-1f7e-4adb-936a-ba3687e99b18",
    //   //   "24620200-1f7e-4adb-936a-ba3687e99b18",
    //   //   // "24620300-1f7e-4adb-936a-ba3687e99b18",
    //   //   // "24625200-1f7e-4adb-936a-ba3687e99b18"
    //   // ]
    // }]
    filters: [filter]
  })
  .then(device => {
    this.bluetoothDevice = device;
    this.bluetoothDevice.addEventListener('gattserverdisconnected', this.onDisconnect);
    this.onScan(this.bluetoothDevice.name);
  });
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
