# RoomWeather

## ESP Board / API

This was made for a NodeMCU ESP8266 development board and a DTH22 sensor. There are guides available on the internet on how to wire this up, depending on your model.  
The code could also be easily adapted to utilize a DTH11 or with a little effort even any other sensor.  

Install the libraries 'Adafruit Unified Sensor' and 'DHT sensor library'.

Before flashing you need to set the SSID and Password of your WiFi in `arduino_secrets.h` (as in the example file) and adjust the static IP settings at the top of `esp-server.ino` for your network.

There are currently three API endpoints:
 - `/weather`: returns temperature and humidity as application/json
 - `/temperature`: returns raw temperature reading in celsius as text/plain
 - `/humidity`: returns raw humidity reading in percent as text/plain

## Discord RPC

First edit `config.json` (copy the example) and fill in your application id [from discord](https://discord.com/developers/applications) as well as your apiBaseURL (the local ip of your ESP8266).  
You can also configure the updateInterval (in seconds) and the RPC labels/button.

Install dependencies and run it:
```
yarn
yarn start
```

## Contributing

This code is licensed under the GPL v3.0 or later.  
Feel free to fork and PR if you want to improve it :)

## Credits

`esp-server.ino` is based on the Arduino example [ESP8266WebServer/HelloServer](https://github.com/esp8266/Arduino/blob/master/libraries/ESP8266WebServer/examples/HelloServer/HelloServer.ino).  
The Discord RPC is based on [simple-discord-rpc](https://github.com/Jxyme/simple-discord-rpc) by Jxyme.
