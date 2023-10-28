// Get references to UI elements
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let no_alert_button = document.getElementById('no_alert');
let mild_alert_button = document.getElementById('mild_alert');
let high_alert_button = document.getElementById('high_alert');
let subscribe_button = document.getElementById('subscribe');
let unsubscribe_button = document.getElementById('unsubscribe');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
let connectionKey = null

// Characteristic object cache
let characteristicCache = null;
let characteristicCache2 = null;
let characteristicCache3 = null;
let characteristicCache4 = null;

// Handle form submit event
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form sending
  send(inputField.value); // Send text field contents
  inputField.value = '';  // Zero text field
  inputField.focus();     // Focus on text field
});

// Connect to the device on Connect button click
connectButton.addEventListener('click', function () {
  connectionKey = connect()
  // switch
  afterConnection(connectionKey)
  subscribeData(connectionKey);
  subscribeDataFlag(connectionKey);
  FormData(connectionKey);
});
// data
afterConnection = (data) => {
  data.then(server => {
    log('GATT server connected, getting service...')
    return server?.getPrimaryService(0x4BA4);
  }).
    then(service => {
      log('Service found, getting characteristic...');
      return service.getCharacteristic(0x75A1);
    }).
    then(characteristic => {
      log('Characteristic found');
      log('"' + deviceCache.name + '" bluetooth device connected');
      characteristicCache = characteristic;

      return characteristicCache;
    });
}
// data
// subscribe
subscribeData = (data) => {
  data.then(server2 => {
    log('GATT server connected, getting service...')
    return server2?.getPrimaryService(0x4BA4);
  }).
    then(service2 => {
      log('Service found, getting characteristic...');
      return service2.getCharacteristic(0xF945);
    }).
    then(characteristic2 => {
      log('Characteristic found');
      log('"' + deviceCache.name + '" bluetooth device connected');
      characteristicCache2 = characteristic2;
      return characteristicCache2;
    }).
    then(characteristic2 => {
      characteristic2.addEventListener('characteristicvaluechanged', (e) => { handleCharacteristicValueChanged(e, characteristic2) });
      return characteristic2.readValue();
    });
}

subscribeDataFlag = (data) => {
  data.then(server3 => {
    log('GATT server connected, getting service...');
    return server3?.getPrimaryService(0x4BA4);
  }).
    then(service3 => {
      log('Service found, getting characteristic...');
      return service3.getCharacteristic(0x12F7);
    }).
    then(characteristic3 => {
      characteristicCache3 = characteristic3;
      return characteristicCache3;
    });
}
// subscribe

FormData = (data) => {
  data.then(server4 => {
    log('GATT server connected, getting service...');
    return server4?.getPrimaryService(0x4BA4);
  }).
    then(service4 => {
      log('Service found, getting characteristic...');
      return service4.getCharacteristic(0x507F);
    }).
    then(characteristic4 => {
      characteristicCache4 = characteristic4;
      return characteristicCache4;
    });
}

// Disconnect from the device on Disconnect button click
disconnectButton.addEventListener('click', function () {
  disconnect();
});

no_alert_button.addEventListener('click', function () {
  no_alert_send();
});

mild_alert_button.addEventListener('click', function () {
  mild_alert_send();
});

high_alert_button.addEventListener('click', function () {
  high_alert_send();
});

subscribe_button.addEventListener('click', function() {
  subscribe_send();
});

unsubscribe_button.addEventListener('click', function(){
  unsubscribe_send();
});


// Selected device object cache
let deviceCache = null;

// Launch Bluetooth device chooser and connect to the selected
function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
    requestBluetoothDevice()).
    then(device => connectDeviceAndCacheCharacteristic(device)).
    catch(error => log(error));
}

function requestBluetoothDevice() {
  log('Requesting bluetooth device...');

  return navigator.bluetooth.requestDevice({
    filters: [{
      name: 'Custom_LED_Service'
    }],
    optionalServices: ['00004ba4-0000-1000-8000-00805f9b34fb'] // Required to access service later.
  }).
    then(device => {
      log('"' + device.name + '" bluetooth device selected');
      deviceCache = device;
      return deviceCache;
    });
}


// Connect to the device specified, get service and characteristic
function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  log('Connecting to GATT server...');

  return device.gatt.connect()
}

// Data receiving
function handleCharacteristicValueChanged(event, data) {
  //let value = new TextDecoder().decode(event.target.value);
  // log(JSON.stringify(data))
  data?.readValue()
  let myData = document.getElementById("dataFromBle")
  // log(myData)
  myData.innerHTML = dataViewToDecimal(event.target.value)
  // log(dataViewToHex(event.target.value), 'in');
}

function dataViewToHex(dataView) {
  // log("I am in");
  let hex = '';
  for (let i = 0; i < dataView.byteLength; i++) {
    const byte = dataView.getUint8(i);
    hex += ('0' + byte.toString(16)).slice(-2); // Ensure two-digit representation
  }
  return hex.toUpperCase(); // Optionally convert to uppercase
}

function dataViewToDecimal(dataView) {
  let decimal = 0;
  let factor = 1;
  for (let i = dataView.byteLength - 1; i >= 0; i--) {
    const byte = dataView.getUint8(i);
    decimal += byte * factor;
    factor *= 256; // Multiply by 256 for each byte (2^8)
  }
  return decimal;
}


function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
    '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

function disconnect() {
  if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
      handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('"' + deviceCache.name + '" bluetooth device disconnected');
    }
    else {
      log('"' + deviceCache.name +
        '" bluetooth device is already disconnected');
    }
  }

  characteristicCache = null;
  characteristicCache2 = null;
  characteristicCache3 = null;
  characteristicCache4 = null;
  deviceCache = null;
}

// Output to terminal
function log(data) {
  document.getElementById('datalog').innerText = data
}

function writeToCharacteristic(characteristic, resetEnergyExpended) {
  log(resetEnergyExpended);
  characteristic.writeValue(resetEnergyExpended);
}

function writeToCharacteristicString(characteristic, data) {
  log(data);
  characteristic.writeValue(new TextEncoder().encode(data));
}

function no_alert_send() {
  let resetEnergyExpended = Uint8Array.of(0);
  writeToCharacteristic(characteristicCache, resetEnergyExpended);
}

function mild_alert_send() {
  let resetEnergyExpended = Uint8Array.of(1);
  writeToCharacteristic(characteristicCache, resetEnergyExpended);
}

function high_alert_send() {
  let resetEnergyExpended = Uint8Array.of(2);
  writeToCharacteristic(characteristicCache, resetEnergyExpended);
}

function subscribe_send() {
  let resetEnergyExpended = Uint8Array.of(1);
  writeToCharacteristic(characteristicCache3, resetEnergyExpended);
  log('Subscription flag ON');
}

function unsubscribe_send() {
  let resetEnergyExpended = Uint8Array.of(0);
  writeToCharacteristic(characteristicCache3, resetEnergyExpended);
  log('Subscription flag OFF');
}

function send(data) {
  data = String(data);

  if (!data || !characteristicCache4) {
    return;
  }

  writeToCharacteristicString(characteristicCache4, data);
  log(data, 'out');
}