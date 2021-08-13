// Global variables
btdevs = [{'bt': new BlueJelly()}];

// Get BT device index in `btdevs` table.
//  <params>
//    bt:   BlueJelly object
//  <retuen>
//    Index in `btdevs`
function getBTIndex(bt) {
  for (var i=0; i<btdevs.length; i++) {
    if (btdevs[i].bt == bt) return i;
  }
  console.log("getBTIndex: device not found.");
  return -1;
}

// Convert integer to 2 digits hexadecimal string
function hex2(val) {
  return ("0" + (new Number(val)).toString(16).toUpperCase()).slice(-2);
}

// `Scan` button handler
// Scan BT device and get Major/Minor characteristics
function scanDevice() {
  bt = btdevs[btdevs.length - 1].bt;
  if (bt.bluetoothDevice) {
    bt = new BlueJelly();
    btdevs.push({'bt': bt});
  }
  setup_bluetooth(bt, bt_handlers);

  let options = {
    'filters': [{'namePrefix': 'Plato'}],
    'optionalServices': [
      "24620100-1f7e-4adb-936a-ba3687e99b18",
      "24620300-1f7e-4adb-936a-ba3687e99b18",
      "24625200-1f7e-4adb-936a-ba3687e99b18"
    ]
  };

  // return (bt.scanByNamePrefix('Plato'))
  return (bt.scanWithOptions(options))
  .then( () => {return bt.write("Register", [0x02]);})
  .then( () => {
    console.log("connectGATT : Major");
    return bt.connectGATT('Major');
  })
  .then( () => {
    console.log("read : Major");
    return bt.dataCharacteristic.readValue();
  })
  .then( () => {
    console.log("connectGATT : Minor");
    return bt.connectGATT('Minor');
  })
  .then( () => {
    console.log("read : Minor");
    return bt.dataCharacteristic.readValue();
  })
  .catch(error => {
    console.log('Error : ' + error);
    this.onError(error);
  })
}

// Show Bluetooth ID
// <params>
//    idx:  Index of BT device in `btdevs`
function showBTID(idx) {
  let bt = btdevs[idx];
  if (bt.major && bt.minor) {
    document.getElementById('btid' + idx).innerText = bt.major + bt.minor;
    document.getElementById('btsts' + idx).innerText = "idle";
  }
}

// On read `Major` handler
// <params>
//    idx:  Index of BT device in `btdevs`
//    data: Received data
function onReadMajor(idx, data) {
  btdevs[idx].major = hex2(data.getUint8(0));
  showBTID(idx);
}

// On read `Minor` handler
// <params>
//    idx:  Index of BT device in `btdevs`
//    data: Received data
function onReadMinor(idx, data) {
  btdevs[idx].minor = hex2(data.getUint8(0)) + hex2(data.getUint8(1));
  showBTID(idx);
}

// BlueJelly.onScan handler
function onScan(deviceName) {
  // document.getElementById('devname').innerHTML = deviceName;
  console.log("Connected: " + deviceName);
  console.log("id: " + this.bluetoothDevice.id);

  let idx = getBTIndex(this); //btdevs.length - 1;
  html = "<td>" + deviceName + "</td>";
  html += "<td id=\"btid" + idx + "\">Reading...</td><td id=\"btsts" + idx + "\"></td>"
  document.getElementById('bt'+idx).innerHTML = html;

  document.getElementById("nodev").style.display = "none";
  document.getElementById("seldevs").style.display = "block";
}

// BlueJelly.onRead handler
function onRead(data, uuid) {
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

// BlueJelly.onWrite handler
function onWrite(uuid) {
  // if (uuid == "WriteApp" && wrtseq >= 0) {
  //   wrtseq++;
  //   trans_mrb(this, wrtseq);
  // }
  if (uuid == "WriteApp") {
    let idx = getBTIndex(this);
    let btdev = btdevs[idx];
    if (btdev.wrtseq < 0) return;
    btdev.wrtseq++;
    // trans_appbin(idx);
    window.setTimeout(function() {trans_appbin(idx)}, mrb_write_delay);
  }
}

// onload event handler
window.addEventListener("load", function() {
  var lang = (window.navigator.languages && window.navigator.languages[0]) ||
    window.navigator.language ||
    window.navigator.userLanguage ||
    window.navigator.browserLanguage;
  var pagelang = window.location.href.substr(-7, 2);
  if (lang == "ja" && pagelang != "ja") {
    window.location = "plato-web-ja.html";
  }

  // Init BlueJelly
  setup_bluetooth(ble);

  // BT event handler
  bt_handlers = {
    scan: onScan,
    read: onRead,
    write: onWrite
  };

  // File selector handler
  document.getElementById("fl_appbin").addEventListener("change", function(evt) {
    const input = evt.target;
    if (input.files.length == 0) {
      alert("No file selected.");
      return;
    }
    let file = input.files[0];
    document.getElementById("load_status").innerText = '"' + file.name + '"';
    load_appbin(file);
  })

  document.getElementById("nodev").style.display = "block";
  document.getElementById("seldevs").style.display = "none";
});
