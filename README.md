# Corrently-Current
![npm](https://img.shields.io/npm/dy/corrently-cloud)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/energychain/corrently-current/main)
![npm](https://img.shields.io/npm/v/corrently-current)

Corrently-Current is a quickly nailed-together *something* to collect and display energy data in a horrible mobile user interface. Corrently-Current is the name of the UI  components that could be built as a standalone Android app, deployed to a server or as an executable to use on a desktop. The Corrently-Current *something* makes heavily use of MQTT.

- Simple and clear display of smart home device data
- Quick access to device data without complex control functions
- Intuitive user interface for a user-friendly experience
- Supports various devices and manufacturers
- Available as an Android app

## corrently-current with [corrently-edge](https://github.com/energychain/corrently-edge)
- Seamless integration of smart home devices through Corrently Edge
- Easy display and monitoring of device data with Corrently Current
- Reduced complexity of integration and control
- Efficient utilization of network resources through central data retrieval
- Graphical editor for individual customization and expansion of functionality
- Suitable for residential and commercial applications



## Audience

Corrently Current caters to smart-home owners who are looking for a user-friendly and streamlined way to view the data from their smart-home devices. It appeals to users who desire quick and straightforward access to device data without dealing with complex control functions. Corrently Current is ideal for users who prefer an intuitively designed user interface and want to consolidate data from various devices and manufacturers into a single application.

## Problem

Corrently Current allows for quick display of data from various smart-home devices in a user interface (UI). Unlike an energy management system or a smart-home system that also includes control functions, Corrently Current is solely focused on data display. This decision was made to provide a solution that offers quick success without complexity and the need to familiarize oneself with different systems.

Corrently Current is designed to integrate a wide range of devices from various manufacturers. It utilizes MQTT and Node-RED in the background. The term "Corrently Current" refers to the UI, which is available as an Android app. In line with this, Corrently Edge exists as an "always-on" device that can be installed on a server or Raspberry Pi. Corrently Edge retrieves data from the source devices, eliminating the need for intricate integration or specialized techniques on the mobile device. The full functionality of the smart-home devices is preserved within Corrently Edge and can be enhanced using a graphical editor. Importantly, Corrently Current can also operate without the use of Corrently Edge if the connected devices do not have specific requirements.

Corrently Current offers a simple and effective solution for displaying data from diverse smart-home devices in a single user interface. It provides users with quick access to information without the complexity of dealing with multiple systems.


## Build Android Package
```bash
$ androidjs b
```
APK will be in `./dist/`

## Start Local DEV Server
```bash
$ npm run start:dev
```
Open `./views/` in browser.

## Cloud Instance
Open https://energychain.github.io/corrently-current/views/ in browser.

## Open Issues
- File Upload is not working. Nicer solution? - Share public with PIN number protected?
