'use strict';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import io from 'socket.io-client';

import { store } from '../standalone/index.js';
import { setComAttrs } from '../actions/com';
import { setSettingsAttrs } from '../standalone/actions/settings';

let CommandHistory = {
    write(msg) { console.info(msg) },
    error(msg) { console.error(msg) },
};

class Com extends React.Component {
    constructor(props) {
        super(props);
        let { comInterfaces, comPorts, comAccumulatedJobTime } = this.props.settings;
        this.state = { comInterfaces, comPorts, comAccumulatedJobTime };
    }

    getChildContext() {
        return { comComponent: this };
    }

    componentDidMount() {
        this.handleConnectServer();
    }

    componentWillUnmount() {
    }

    setComAttrs(attrs) {
        let com = store.getState().com;
        for (let attr in attrs) {
            if (com[attr] !== attrs[attr]) {
                this.props.dispatch(setComAttrs(attrs));
                return;
            }
        }
    }

    setSettingsAttrs(attrs) {
        let settings = store.getState().settings;
        for (let attr in attrs) {
            if (settings[attr] !== attrs[attr]) {
                this.props.dispatch(setSettingsAttrs(attrs));
                return;
            }
        }
    }

    handleConnectServer() {
        let { dispatch } = this.props;
        let server = this.props.settings.comServerIP;
        CommandHistory.write('Connecting to Server @ ' + server, CommandHistory.INFO);
        this.socket = io('ws://' + server);

        this.socket.on('connect', data => {
            this.setComAttrs({ serverConnected: true });
            this.socket.emit('getServerConfig');
            CommandHistory.write('Server connected', CommandHistory.SUCCESS);
        });

        this.socket.on('disconnect', () => {
            CommandHistory.error('Disconnected from Server ' + server)
            this.setComAttrs({ serverConnected: false, machineConnected: false });
        });

        this.socket.on('serverConfig', data => {
            this.setComAttrs({ serverConnected: true });
            let serverVersion = data.serverVersion;
            this.setSettingsAttrs({ comServerVersion: serverVersion });
            //CommandHistory.write('Server version: ' + serverVersion, CommandHistory.INFO);
            console.log('serverVersion: ' + serverVersion);
        });

        this.socket.on('interfaces', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                let interfaces = new Array();
                for (let i = 0; i < data.length; i++)
                    interfaces.push(data[i]);
                this.setState({ comInterfaces: interfaces });
                this.setSettingsAttrs({ comInterfaces: interfaces });
                console.log('interfaces: ' + interfaces);
                //CommandHistory.write('interfaces: ' + interfaces);
            } else {
                CommandHistory.error('No supported interfaces found on server!')
            }
        });

        this.socket.on('ports', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                let ports = new Array();
                for (let i = 0; i < data.length; i++) {
                    ports.push(data[i].comName);
                }
                this.setState({ comPorts: ports });
                this.setSettingsAttrs({ comPorts: ports });
                //console.log('ports: ' + ports);
                CommandHistory.write('Serial ports detected: ' + JSON.stringify(ports));
            } else {
                CommandHistory.error('No serial ports found on server!');
            }
        });

        this.socket.on('activeInterface', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                //set the actual interface
            }
            console.log('activeInterface: ' + data);
        });

        this.socket.on('activePort', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                //set the actual port
            }
            console.log('activePorts: ' + data);
        });

        this.socket.on('activeBaudRate', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                //set the actual baudrate
            }
            console.log('activeBaudrate: ' + data);
        });

        this.socket.on('activeIP', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                //set the actual machine IP
            }
            console.log('activeIP: ' + data);
        });

        this.socket.on('connectStatus', data => {
            console.log('connectStatus: ' + data);
            let attrs = { serverConnected: true };
            if (data.indexOf('opened') >= 0) {
                attrs.machineConnected = true;
                CommandHistory.write('Machine connected', CommandHistory.SUCCESS);
            }
            if (data.indexOf('Connect') >= 0) {
                attrs.machineConnected = false;
                CommandHistory.error('Machine disconnected')
            }
            this.setComAttrs(attrs);
        });

        this.socket.on('firmware', data => {
            console.log('firmware: ' + data);
            let firmware = data.firmware;
            let fVersion = data.version;
            let fDate = data.date;
            let attrs = {
                serverConnected: true,
                machineConnected: true,
                firmware: firmware,
                firmwareVersion: fVersion && fVersion.toString()
            };
            CommandHistory.write('Firmware ' + firmware + ' ' + fVersion + ' detected', CommandHistory.SUCCESS);
            if (firmware === 'grbl' && fVersion < '1.1e') {
                CommandHistory.error('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e')
                this.socket.emit('closePort', 1);
                attrs.machineConnected = false;
                //console.log('GRBL < 1.1 not supported!');
            }
            this.setComAttrs(attrs);
        });

        this.socket.on('runningJob', data => {
            CommandHistory.write('runningJob(' + data.length + ')', CommandHistory.WARN);
            alert(data);
            //setGcode(data);
        });

        this.socket.on('runStatus', status => {
            //CommandHistory.write('runStatus: ' + status);
            console.log('runStatus: ' + status);
            if (status === 'running') {
                playing = true;
                paused = false;
            } else if (status === 'paused') {
                paused = true;
            } else if (status === 'm0') {
                paused = true;
                m0 = true;
            } else if (status === 'resumed') {
                paused = false;
            } else if (status === 'stopped') {
                playing = false;
                paused = false;
            } else if (status === 'finished') {
                playing = false;
                paused = false;
            } else if (status === 'alarm') {
                CommandHistory.error('ALARM!')
                //this.socket.emit('clearAlarm', 2);
            }
            runStatus(status);
        });

        this.socket.on('data', data => {
            this.setComAttrs({ serverConnected: true, machineConnected: true });
            if (data) {
                if (data.indexOf('<') === 0) {
                    //CommandHistory.write('statusReport: ' + data);
                    updateStatus(data);
                } else {
                    let style = CommandHistory.STD;
                    if (data.indexOf('[MSG:') === 0) {
                        style = CommandHistory.WARN;
                    } else if (data.indexOf('ALARM:') === 0) {
                        style = CommandHistory.DANGER;
                    } else if (data.indexOf('error:') === 0) {
                        style = CommandHistory.DANGER;
                    }
                    CommandHistory.write(data, style);
                }
            }
        });

        this.socket.on('wPos', wpos => {
            this.setComAttrs({ serverConnected: true, machineConnected: true });
            let { x, y, z, a } = wpos; //let pos = wpos.split(',');
            let posChanged = false;
            if (this.xpos !== x) {
                this.xpos = x;
                posChanged = true;
            }
            if (this.ypos !== y) {
                this.ypos = y;
                posChanged = true;
            }
            if (this.zpos !== z) {
                this.zpos = z;
                posChanged = true;
            }
            if (this.apos !== a) {
                this.apos = a;
                posChanged = true;
            }
            if (posChanged) {
                //CommandHistory.write('WPos: ' + this.xpos + ' / ' + this.ypos + ' / ' + this.zpos);
                //console.log('WPos: ' + this.xpos + ' / ' + this.ypos + ' / ' + this.zpos);
                this.setComAttrs({ wpos: [this.xpos, this.ypos, this.zpos, this.apos] });
            }
        });

        this.socket.on('wOffset', wOffset => {
            this.setComAttrs({ serverConnected: true, machineConnected: true });
            let { x, y, z, a } = wOffset;
            x = Number(x)
            y = Number(y)
            z = Number(z)
            a = Number(a)

            let posChanged = false;
            if ((this.xOffset !== x) && !isNaN(x)) {
                this.xOffset = x;
                posChanged = true;
            }
            if ((this.yOffset !== y) && !isNaN(y)) {
                this.yOffset = y;
                posChanged = true;
            }
            if ((this.zOffset !== z) && !isNaN(z)) {
                this.zOffset = z;
                posChanged = true;
            }
            if ((this.aOffset !== a) && !isNaN(a)) {
                this.aOffset = a;
                posChanged = true;
            }
            if (posChanged) {
                CommandHistory.write('Work Offset: ' + this.xOffset + ' / ' + this.yOffset + ' / ' + this.zOffset + ' / ' + this.aOffset);
                this.setComAttrs({ workOffset: [+this.xOffset, +this.yOffset, +this.zOffset, +this.aOffset] });
            }
        });

        // feed override report (from server)
        this.socket.on('feedOverride', data => {
            this.setComAttrs({ serverConnected: true });
            //CommandHistory.write('feedOverride: ' + data, CommandHistory.STD);
            //console.log('feedOverride ' + data);
        });

        // spindle override report (from server)
        this.socket.on('spindleOverride', data => {
            this.setComAttrs({ serverConnected: true });
            //CommandHistory.write('spindleOverride: ' + data, CommandHistory.STD);
            //console.log('spindleOverride ' + data);
        });

        // real feed report (from server)
        this.socket.on('realFeed', data => {
            this.setComAttrs({ serverConnected: true });
            //CommandHistory.write('realFeed: ' + data, CommandHistory.STD);
            //console.log('realFeed ' + data);
        });

        // real spindle report (from server)
        this.socket.on('realSpindle', data => {
            this.setComAttrs({ serverConnected: true });
            //CommandHistory.write('realSpindle: ' + data, CommandHistory.STD);
            //console.log('realSpindle ' + data);
        });

        // laserTest state
        this.socket.on('laserTest', data => {
            this.setComAttrs({ serverConnected: true });
            //CommandHistory.write('laserTest: ' + data, CommandHistory.STD);
            //console.log('laserTest ' + data);
            if (data > 0) {
                laserTestOn = true;
            } else if (data === 0) {
                laserTestOn = false;
            }
        });

        this.socket.on('qCount', data => {
            this.setComAttrs({ serverConnected: true });
            //console.log('qCount ' + data);
            data = parseInt(data);
            if (playing && data === 0) {
                playing = false;
                paused = false;
                runStatus('stopped');

                if (jobStartTime >= 0) {
                    let jobFinishTime = new Date(Date.now());
                    let elapsedTimeMS = jobFinishTime.getTime() - jobStartTime.getTime();
                    let elapsedTime = Math.round(elapsedTimeMS / 1000);
                    CommandHistory.write("Job started at " + jobStartTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.write("Job finished at " + jobFinishTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.write("Elapsed time: " + secToHMS(elapsedTime), CommandHistory.SUCCESS);
                    jobStartTime = -1;
                    accumulatedJobTime += elapsedTime;
                    let AJT = accumulatedJobTime;
                    this.setSettingsAttrs({ comAccumulatedJobTime: AJT });
                    CommandHistory.write("Total accumulated job time: " + secToHMS(AJT), CommandHistory.SUCCESS);
                }
            }
        });

        this.socket.on('close', () => {
            this.setComAttrs({ serverConnected: false, machineConnected: false });
            CommandHistory.error('Server connection closed')
            // websocket is closed.
            //console.log('Server connection closed');
            let serverVersion = 'not connected';
            this.setSettingsAttrs({ comServerVersion: serverVersion });
        });

        this.socket.on('error', data => {
            CommandHistory.error('Server error: ' + data)
            //console.log('error: ' + data);
        });

















    }

    render() {
        let { settings, com, dispatch, children, ...rest } = this.props;
        return (
            < div {...rest }>
                {JSON.stringify(com)}
                {children}
            </div >
        );
    }
};
Com.childContextTypes = {
    comComponent: PropTypes.any,
};
Com = connect(
    ({ settings, com }) => ({ settings, com }),
)(Com);
export { Com };

export function withComComponent(Component) {
    class Wrapper extends React.Component {
        render() {
            return (
                <Component {...{ ...this.props, comComponent: this.context.com }} />
            );
        }
    };
    Wrapper.contextTypes = {
        comComponent: PropTypes.any,
    };
    return Wrapper;
}
