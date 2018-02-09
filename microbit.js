// 接続するBluetoothデバイス
let targetDevice = null;

// micro:bit 磁力サービス
const MAGNETOMETER_SERVICE = "e95df2d8-251d-470a-a062-fa1922dfa9a8";

// micro:bit 磁力データキャラクタリスティック
const MAGNETOMETER_DATA = "e95dfb11-251d-470a-a062-fa1922dfa9a8";

// micro:bit 磁力取得間隔キャラクタリスティック
const MAGNETOMETER_PERIOD = "e95d386c-251d-470a-a062-fa1922dfa9a8";

// micro:bit 方角データキャラクタリスティック
const MAGNETOMETER_BEARING = "e95d9715-251d-470a-a062-fa1922dfa9a8";

function onClickStartButton() {
  if (!navigator.bluetooth) {
    showModal("Web Bluetooth is not supported.")
    return;
  }

  requestDevice();
}

function onClickStopButton() {
  if (!navigator.bluetooth) {
    showModal("Web Bluetooth is not supported.")
    return;
  }

  disconnect();
}

function requestDevice() {
  navigator.bluetooth.requestDevice({
    filters: [
      { services: [MAGNETOMETER_SERVICE] },
      { namePrefix: "BBC micro:bit" }
    ]
  })
    .then(device => {
      targetDevice = device;
      connect(targetDevice);
    })
    .catch(error => {
      showModal(error);
      targetDevice = null;
    });
}

function disconnect() {
  if (targetDevice == null) {
    showModal('target device is null.');
    return;
  }

  targetDevice.gatt.disconnect();
}

function connect(device) {
  device.gatt.connect()
    .then(server => {
      findMagnetometerService(server);
    })
    .catch(error => {
      showModal(error);
    });
}

// 方角を表示する
function updateBearingValue(bearing) {
  $("#compass").rotate(bearing);
  document.getElementsByName("degree")[0].innerText = bearing + "°"
}

function findMagnetometerService(server) {
  server.getPrimaryService(MAGNETOMETER_SERVICE)
    .then(service => {
      findMagnetometerPeriodCharacteristic(service);
      findMagnetometerBearingCharacteristic(service);
    })
    .catch(error => {
      showModal(error);
    });
}

function findMagnetometerPeriodCharacteristic(service) {
  service.getCharacteristic(MAGNETOMETER_PERIOD)
    .then(characteristic => {
      writeMagnetometerPeriodValue(characteristic);
    })
    .catch(error => {
      showModal(error);
    });
}

function writeMagnetometerPeriodValue(characteristic) {
  characteristic.writeValue(new Uint16Array([160]))
    .catch(error => {
      showModal(error);
    });
}

function findMagnetometerBearingCharacteristic(service) {
  service.getCharacteristic(MAGNETOMETER_BEARING)
    .then(characteristic => {
      startMagnetometerBearingNotification(characteristic);
    })
    .catch(error => {
      showModal(error);
    });
}

function startMagnetometerBearingNotification(characteristic) {
  characteristic.startNotifications()
    .then(char => {
      characteristic.addEventListener('characteristicvaluechanged',
        onMagnetometerBearingChanged);
    });
}

function onMagnetometerBearingChanged(event) {
  let bearing = event.target.value.getUint16(0, true);
  updateBearingValue(bearing);
}

function showModal(message) {
  document.getElementsByName("modal-message")[0].innerHTML = message;
  $("#myModal").modal("show");
}