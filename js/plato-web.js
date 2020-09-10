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

// Scan BT device and get Major/Minor characteristics
function scanDevice() {
  bt = btdevs[btdevs.length - 1].bt;
  if (bt.bluetoothDevice) {
    bt = new BlueJelly();
    btdevs.push({'bt': bt});
  }
  setup_bluetooth(bt);

  return (bt.scanByNamePrefix('Plato'))
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
