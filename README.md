# BA_Project

This is the README file. The project is part of a bachelor thesis. The goal is to simulate a train running on a map.

## Live-Demo

View a live Demo of the current state of the project in your browser. Please note that this is only a development build and does not represent the final product.

[Live-Demo Trainmap](https://redr.uber.space/zuege)

## Commands

### Local Server

Run Parcel and start a webserver:
```
npm run dev
```
Run NodeJS and start the TCP-server:
```
npm run tcp
```

## Description

This is the folder- & file-structure:
```
src/
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── raw_server.js
│   └── train-stop.png
└── index.html
```
The `main.js` script is embeded in the `index.html` file and is responsible for rendering the map and other frontend tasks. The `raw_server.js` runs on the server and has no UI. It serves as an interface between the application and Matlab/Simulink.


## Third party libaries

- [Open Layers](https://github.com/openlayers/openlayers)
- ...

## License

    MIT License

    Copyright (c) 2021 Felix F.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
