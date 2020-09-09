btdevs = [new BlueJelly()];

function scanDevice() {
  bt = btdevs[btdevs.length - 1];
  if (bt.bluetoothDevice) {
    bt = new BlueJelly();
    btdevs.push(bt);
  }
  setup_bluetooth(bt);
  bt.scanByNamePrefix('Plato');
}
