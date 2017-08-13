'use strict';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import io from 'socket.io-client';

import { store } from '../standalone/index.js';
import { setComAttrs } from '../actions/com';
import { setSettingsAttrs } from '../standalone/actions/settings';
import Log from './log';

function secToHMS(sec) {
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor(sec / 60) % 60;
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    let seconds = sec % 60;
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
}

class Com extends React.Component {
    constructor(props) {
        super(props);
        this.jobStartTime = -1;
    }

    getChildContext() {
        return { comComponent: this };
    }

    componentDidMount() {
        this.connectToServer();
    }

    componentWillUnmount() {
        this.disconnectFromServer();
    }

    getComAttrs() {
        return store.getState().com;
    }

    setComAttrs(comAttrs) {
        let com = store.getState().com;
        for (let attr in comAttrs) {
            if (com[attr] !== comAttrs[attr]) {
                this.props.dispatch(setComAttrs(comAttrs));
                return;
            }
        }
    }

    getSettingsAttrs() {
        return store.getState().settings;
    }

    setSettingsAttrs(settingsAttrs) {
        let settings = store.getState().settings;
        for (let attr in settingsAttrs) {
            if (settings[attr] !== settingsAttrs[attr]) {
                this.props.dispatch(setSettingsAttrs(settingsAttrs));
                return;
            }
        }
    }

    connectToServer() {
        let server = this.props.settings.comServerIP;
        Log.write('Connecting to Server @ ' + server, Log.INFO);
        let socket = this.socket = io('ws://' + server);
        this.setComAttrs({ serverConnecting: true, serverConnected: false, machineConnecting: false, machineConnected: false });

        socket.on('connect', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            socket.emit('getServerConfig');
            Log.write('Server connected', Log.SUCCESS);
        });

        socket.on('disconnect', () => {
            Log.error('Disconnected from Server ' + server)
            this.setComAttrs({ serverConnecting: false, serverConnected: false, machineConnecting: false, machineConnected: false });
            this.socket = null;
        });

        socket.on('serverConfig', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            let serverVersion = data.serverVersion;
            this.setComAttrs({ serverVersion: serverVersion });
            //Log.write('Server version: ' + serverVersion, Log.INFO);
            console.log('serverVersion: ' + serverVersion);
        });

        socket.on('interfaces', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            if (data.length > 0) {
                let interfaces = new Array();
                for (let i = 0; i < data.length; i++)
                    interfaces.push(data[i]);
                this.setComAttrs({ interfaces: interfaces });
                //console.log('interfaces: ' + interfaces);
                //Log.write('interfaces: ' + interfaces);
            } else {
                Log.error('No supported interfaces found on server!')
            }
        });

        socket.on('ports', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            if (data.length > 0) {
                let ports = new Array();
                for (let i = 0; i < data.length; i++) {
                    ports.push(data[i].comName);
                }
                this.setComAttrs({ ports: ports });
                //console.log('ports: ' + ports);
                Log.write('Serial ports detected: ' + JSON.stringify(ports));
            } else {
                Log.error('No serial ports found on server!');
            }
        });

        socket.on('activeInterface', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            if (data.length > 0) {
                //set the actual interface
            }
            //console.log('activeInterface: ' + data);
        });

        socket.on('activePort', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            if (data.length > 0) {
                //set the actual port
            }
            //console.log('activePorts: ' + data);
        });

        socket.on('activeBaudRate', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            if (data.length > 0) {
                //set the actual baudrate
            }
            //console.log('activeBaudrate: ' + data);
        });

        socket.on('activeIP', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            if (data.length > 0) {
                //set the actual machine IP
            }
            //console.log('activeIP: ' + data);
        });

        socket.on('connectStatus', data => {
            //console.log('connectStatus: ' + data);
            let comAttrs = { serverConnecting: false, serverConnected: true };
            if (data.indexOf('opened') >= 0) {
                comAttrs.machineConnecting = false;
                comAttrs.machineConnected = true;
                Log.write('Machine connected', Log.SUCCESS);
            }
            if (data.indexOf('Connect') >= 0) {
                comAttrs.machineConnecting = false;
                comAttrs.machineConnected = false;
                Log.error('Machine disconnected')
            }
            this.setComAttrs(comAttrs);
        });

        socket.on('firmware', data => {
            //console.log('firmware: ' + JSON.stringify(data));
            let firmware = data.firmware;
            let fVersion = data.version;
            let fDate = data.date;
            let comAttrs = {
                serverConnecting: false,
                serverConnected: true,
                machineConnecting: false,
                machineConnected: true,
                firmware: firmware,
                firmwareVersion: fVersion + '',
            };
            Log.write('Firmware ' + firmware + ' ' + fVersion + ' detected', Log.SUCCESS);
            if (firmware === 'grbl' && fVersion < '1.1e') {
                Log.error('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e')
                socket.emit('closePort', 1);
                comAttrs.machineConnected = false;
                //console.log('GRBL < 1.1 not supported!');
            }
            this.setComAttrs(comAttrs);
        });

        socket.on('runningJob', data => {
            Log.write('runningJob(' + data.length + ')', Log.WARN);
            this.setRunStatus('running');
            //alert(data);
            //setGcode(data);
        });

        socket.on('runStatus', runStatus => {
            this.setRunStatus(runStatus);
        });

        socket.on('data', data => {
            let comAttrs = { serverConnecting: false, serverConnected: true, machineConnecting: false, machineConnected: true };
            if (data) {
                if (data.indexOf('<') === 0) {
                    //Log.write('statusReport: ' + data);

                    // Smoothieware: <Idle,MPos:49.5756,279.7644,-15.0000,WPos:0.0000,0.0000,0.0000>
                    // till GRBL v0.9: <Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>
                    // since GRBL v1.1: <Idle|WPos:0.000,0.000,0.000|Bf:15,128|FS:0,0|Pn:S|WCO:0.000,0.000,0.000> (when $10=2)

                    // Extract machineStatus
                    comAttrs.machineStatus = data.substring(data.indexOf('<') + 1, data.search(/(,|\|)/));
                    if (comAttrs.machineStatus === 'Alarm')
                        comAttrs = { ...comAttrs, playing: false, paused: false, m0: false, alarm: true };
                    else
                        comAttrs.alarm = false;
                } else {
                    let style = Log.STD;
                    if (data.indexOf('[MSG:') === 0) {
                        style = Log.WARN;
                    } else if (data.indexOf('ALARM:') === 0) {
                        comAttrs = { ...comAttrs, playing: false, paused: false, m0: false, alarm: true };
                        style = Log.DANGER;
                    } else if (data.indexOf('error:') === 0) {
                        style = Log.DANGER;
                    }
                    Log.write(data, style);
                }
            }
            this.setComAttrs(comAttrs);
        });

        socket.on('wPos', wpos => {
            let comAttrs = { serverConnecting: false, serverConnected: true, machineConnecting: false, machineConnected: true };
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
                //Log.write('WPos: ' + this.xpos + ' / ' + this.ypos + ' / ' + this.zpos);
                //console.log('WPos: ' + this.xpos + ' / ' + this.ypos + ' / ' + this.zpos);
                comAttrs['wpos-x'] = +this.xpos;
                comAttrs['wpos-y'] = +this.ypos;
                comAttrs['wpos-z'] = +this.zpos;
                comAttrs['wpos-a'] = +this.apos;
            }
            this.setComAttrs(comAttrs);
        });

        socket.on('wOffset', wOffset => {
            let comAttrs = { serverConnecting: false, serverConnected: true, machineConnecting: false, machineConnected: true };
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
                Log.write('Work Offset: ' + this.xOffset + ' / ' + this.yOffset + ' / ' + this.zOffset + ' / ' + this.aOffset);
                comAttrs['work-offset-x'] = +this.xOffset;
                comAttrs['work-offset-y'] = +this.yOffset;
                comAttrs['work-offset-z'] = +this.zOffset;
                comAttrs['work-offset-a'] = +this.aOffset;
            }
            this.setComAttrs(comAttrs);
        });

        // feed override report (from server)
        socket.on('feedOverride', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            //Log.write('feedOverride: ' + data, Log.STD);
            //console.log('feedOverride ' + data);
        });

        // spindle override report (from server)
        socket.on('spindleOverride', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            //Log.write('spindleOverride: ' + data, Log.STD);
            //console.log('spindleOverride ' + data);
        });

        // real feed report (from server)
        socket.on('realFeed', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            //Log.write('realFeed: ' + data, Log.STD);
            //console.log('realFeed ' + data);
        });

        // real spindle report (from server)
        socket.on('realSpindle', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            //Log.write('realSpindle: ' + data, Log.STD);
            //console.log('realSpindle ' + data);
        });

        // laserTest state
        socket.on('laserTest', data => {
            let comAttrs = { serverConnecting: false, serverConnected: true };
            //Log.write('laserTest: ' + data, Log.STD);
            //console.log('laserTest ' + data);
            if (data > 0) {
                comAttrs.laserTestOn = true;
            } else if (data === 0) {
                comAttrs.laserTestOn = false;
            }
            this.setComAttrs(comAttrs);
        });

        socket.on('qCount', data => {
            this.setComAttrs({ serverConnecting: false, serverConnected: true });
            //console.log('qCount ' + data);
            data = parseInt(data);
            if (this.getComAttrs().playing && data === 0) {
                this.setRunStatus('stopped');
                if (this.jobStartTime >= 0) {
                    let jobFinishTime = new Date(Date.now());
                    let elapsedTimeMS = jobFinishTime.getTime() - this.jobStartTime.getTime();
                    let elapsedTime = Math.round(elapsedTimeMS / 1000);
                    Log.write("Job started at " + this.jobStartTime.toString(), Log.SUCCESS);
                    Log.write("Job finished at " + jobFinishTime.toString(), Log.SUCCESS);
                    Log.write("Elapsed time: " + secToHMS(elapsedTime), Log.SUCCESS);
                    this.jobStartTime = -1;
                    let AJT = this.getSettingsAttrs().comAccumulatedJobTime + elapsedTime;
                    this.setSettingsAttrs({ comAccumulatedJobTime: AJT });
                    Log.write("Total accumulated job time: " + secToHMS(AJT), Log.SUCCESS);
                }
            }
        });

        socket.on('close', () => {
            this.setComAttrs({ serverConnecting: false, serverConnected: false, machineConnecting: false, machineConnected: false, serverVersion: 'not connected' });
            this.socket = null;
            Log.error('Server connection closed')
            // websocket is closed.
            //console.log('Server connection closed');
        });

        socket.on('error', data => {
            Log.error('Server error: ' + data)
            //console.log('error: ' + data);
        });
    } // connectToServer()

    disconnectFromServer() {
        if (this.socket) {
            this.setComAttrs({ serverConnecting: false, serverConnected: false, machineConnecting: false, machineConnected: false, serverVersion: 'not connected' });
            Log.write('Disconnecting from server', Log.INFO);
            this.socket.disconnect();
            this.socket = null;
        }
    }

    toggleConnectToServer() {
        if (this.socket)
            this.disconnectFromServer();
        else
            this.connectToServer();
    }

    connectToMachine() {
        //console.log(this.props.settings)
        var comConnectVia = this.props.settings.comConnectVia;
        var comConnectPort = this.props.settings.comConnectPort.trim();
        var comConnectBaud = this.props.settings.comConnectBaud;
        var comConnectIP = this.props.settings.comConnectIP;
        switch (comConnectVia) {
            case 'USB':
                if (!comConnectPort) {
                    Log.write('Could not connect! -> please select port', Log.DANGER);
                    break;
                }
                if (!comConnectBaud) {
                    Log.write('Could not connect! -> please select baudrate', Log.DANGER);
                    break;
                }
                Log.write('Connecting Machine @ ' + comConnectVia + ',' + comConnectPort + ',' + comConnectBaud + 'baud', Log.INFO);
                this.socket.emit('connectTo', comConnectVia + ',' + comConnectPort + ',' + comConnectBaud);
                this.setComAttrs({ machineConnecting: true, machineConnected: false });
                break;
            case 'Telnet':
                if (!comConnectIP) {
                    Log.write('Could not connect! -> please enter IP address', Log.DANGER);
                    break;
                }
                Log.write('Connecting Machine @ ' + comConnectVia + ',' + comConnectIP, Log.INFO);
                this.socket.emit('connectTo', comConnectVia + ',' + comConnectIP);
                this.setComAttrs({ machineConnecting: true, machineConnected: false });
                break;
            case 'ESP8266':
                if (!comConnectIP) {
                    Log.write('Could not connect! -> please enter IP address', Log.DANGER);
                    break;
                }
                Log.write('Connecting Machine @ ' + comConnectVia + ',' + comConnectIP, Log.INFO);
                this.socket.emit('connectTo', comConnectVia + ',' + comConnectIP);
                this.setComAttrs({ machineConnecting: true, machineConnected: false });
                break;
        }
    } // connectToMachine()

    disconnectFromMachine() {
        Log.write('Disconnecting Machine', Log.INFO);
        this.socket.emit('closePort');
    }

    toggleConnectToMachine() {
        if (!this.socket)
            return;
        let { machineConnecting, machineConnected } = this.getComAttrs();
        if (machineConnecting || machineConnected)
            this.disconnectFromMachine();
        else
            this.connectToMachine();
    }

    setRunStatus(runStatus) {
        //Log.write('runStatus: ' + runStatus);
        //console.log('runStatus: ' + runStatus);
        if (runStatus === 'running') {
            this.setComAttrs({ runStatus, playing: true, paused: false, m0: false, });
        } else if (runStatus === 'paused') {
            this.setComAttrs({ runStatus, playing: true, paused: true, m0: false, });
        } else if (runStatus === 'm0') {
            this.setComAttrs({ runStatus, playing: true, paused: true, m0: true, });
        } else if (runStatus === 'resumed') {
            this.setComAttrs({ runStatus, playing: true, paused: false, m0: false, });
        } else if (runStatus === 'stopped') {
            this.setComAttrs({ runStatus, playing: false, paused: false, m0: false, });
        } else if (runStatus === 'finished') {
            this.setComAttrs({ runStatus, playing: false, paused: false, m0: false, });
        } else if (runStatus === 'alarm') {
            Log.error('ALARM!')
            this.setComAttrs({ runStatus, playing: false, paused: false, m0: false, alarm: true, });
            //this.socket.emit('clearAlarm', 2);
        } else {
            this.setComAttrs({ runStatus });
        }
    }

    checkConnected() {
        let { serverConnected, machineConnected } = this.getComAttrs();
        if (serverConnected)
            if (machineConnected)
                return true;
            else
                Log.error('Machine is not connected!')
        else
            Log.error('Server is not connected!')
        return false;
    }

    runCommand(gcode) {
        if (!this.checkConnected())
            return;
        if (gcode) {
            //Log.write('Running Command', Log.INFO);
            //console.log('runCommand', gcode);
            this.socket.emit('runCommand', gcode);
        }
    }

    runJob(job) {
        if (!this.checkConnected())
            return;
        if (job.length > 0) {
            Log.write('Running Job', Log.INFO);
            this.setRunStatus('running');
            this.jobStartTime = new Date(Date.now());
            this.socket.emit('runJob', job);
        } else {
            Log.error('Job empty!')
        }
    }

    pauseJob() {
        //console.log('pauseJob');
        if (!this.checkConnected())
            return;
        this.setRunStatus('paused');
        this.socket.emit('pause');
    }

    resumeJob() {
        //console.log('resumeJob');
        if (!this.checkConnected())
            return;
        this.setRunStatus('running');
        this.socket.emit('resume');
    }

    abortJob() {
        //console.log('abortJob');
        if (!this.checkConnected())
            return;
        Log.write('Aborting job', Log.INFO);
        this.setRunStatus('stopped');
        this.socket.emit('stop');
    }

    clearAlarm(method) {
        //console.log('clearAlarm');
        if (!this.checkConnected())
            return;
        Log.write('Resetting alarm', Log.INFO);
        this.socket.emit('clearAlarm', method);
    }

    setZero(axis) {
        if (!this.checkConnected())
            return;
        Log.write('Set ' + axis + ' Axis zero', Log.INFO);
        this.socket.emit('setZero', axis);
    }

    gotoZero(axis) {
        if (!this.checkConnected())
            return;
        Log.write('Goto ' + axis + ' zero', Log.INFO);
        this.socket.emit('gotoZero', axis);
    }

    setPosition(data) {
        if (!this.checkConnected())
            return;
        Log.write('Set position to ' + JSON.stringify(data), Log.INFO);
        this.socket.emit('setPosition', data);
    }

    home(axis) {
        if (!this.checkConnected())
            return;
        Log.write('Home ' + axis, Log.INFO);
        this.socket.emit('home', axis);
    }

    probe(axis, offset) {
        if (!this.checkConnected())
            return;
        Log.write('Probe ' + axis + ' (Offset:' + offset + ')', Log.INFO);
        this.socket.emit('probe', { axis: axis, offset: offset });
    }

    laserTest(power, duration, maxS) {
        if (!this.checkConnected())
            return;
        //console.log('laserTest(' + power + ', ' + duration + ', ' + maxS + ')');
        this.socket.emit('laserTest', power + ',' + duration + ',' + maxS);
    }

    jog(axis, dist, feed) {
        if (!this.checkConnected())
            return;
        //console.log('jog(' + axis + ',' + dist + ',' + feed + ')');
        this.socket.emit('jog', axis + ',' + dist + ',' + feed);
    }

    jogTo(x, y, z, mode, feed) {
        if (!this.checkConnected())
            return;
        //console.log('jog(' + axis + ',' + dist + ',' + feed + ')');
        this.socket.emit('jogTo', { x: x, y: y, z: z, mode: mode, feed: feed });
    }

    feedOverride(step) {
        if (!this.checkConnected())
            return;
        //console.log('feedOverride ' + step);
        this.socket.emit('feedOverride', step);
    }

    spindleOverride(step) {
        if (!this.checkConnected())
            return;
        //console.log('spindleOverride ' + step);
        this.socket.emit('spindleOverride', step);
    }

    resetMachine() {
        if (!this.checkConnected())
            return;
        Log.error('Resetting Machine')
        this.socket.emit('resetMachine');
    }

    playpauseMachine() {
        if (!this.checkConnected())
            return;
        let { playing, paused } = this.getComAttrs();
        if (playing === true) {
            if (paused === true) {
                // unpause
                var laseroncmd = document.getElementById('laseron').value;
                if (laseroncmd.length === 0) {
                    laseroncmd = 0;
                }
                this.socket.emit('resume', laseroncmd);
                this.setRunStatus('running');
                // end ifPaused
            } else {
                // pause
                var laseroffcmd = document.getElementById('laseroff').value;
                if (laseroffcmd.length === 0) {
                    laseroffcmd = 0;
                }
                this.socket.emit('pause', laseroffcmd);
                this.setRunStatus('paused');
            }
            // end isPlaying
        } else {
            playGcode();
        }
    } // playpauseMachine()

    render() {
        let { settings, com, dispatch, children, ...rest } = this.props;
        return (
            < div {...rest }>
                {children}
            </div >
        );
    }
}; // Com
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
                <Component {...{ ...this.props, comComponent: this.context.comComponent }} />
            );
        }
    };
    Wrapper.contextTypes = {
        comComponent: PropTypes.any,
    };
    return Wrapper;
}
