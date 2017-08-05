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
            this.setComAttrs({ comServerVersion: serverVersion });
            //CommandHistory.write('Server version: ' + serverVersion, CommandHistory.INFO);
            console.log('serverVersion: ' + serverVersion);
        });

        this.socket.on('interfaces', data => {
            this.setComAttrs({ serverConnected: true });
            if (data.length > 0) {
                let interfaces = new Array();
                for (let i = 0; i < data.length; i++)
                    interfaces.push(data[i]);
                this.setComAttrs({ comInterfaces: interfaces });
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
                this.setComAttrs({ comPorts: ports });
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
            let comAttrs = { serverConnected: true };
            if (data.indexOf('opened') >= 0) {
                comAttrs.machineConnected = true;
                CommandHistory.write('Machine connected', CommandHistory.SUCCESS);
            }
            if (data.indexOf('Connect') >= 0) {
                comAttrs.machineConnected = false;
                CommandHistory.error('Machine disconnected')
            }
            this.setComAttrs(comAttrs);
        });

        this.socket.on('firmware', data => {
            console.log('firmware: ' + JSON.stringify(data));
            let firmware = data.firmware;
            let fVersion = data.version;
            let fDate = data.date;
            let comAttrs = {
                serverConnected: true,
                machineConnected: true,
                firmware: firmware,
                firmwareVersion: fVersion + '',
            };
            CommandHistory.write('Firmware ' + firmware + ' ' + fVersion + ' detected', CommandHistory.SUCCESS);
            if (firmware === 'grbl' && fVersion < '1.1e') {
                CommandHistory.error('Grbl version too old -> YOU MUST INSTALL AT LEAST GRBL 1.1e')
                this.socket.emit('closePort', 1);
                comAttrs.machineConnected = false;
                //console.log('GRBL < 1.1 not supported!');
            }
            this.setComAttrs(comAttrs);
        });

        this.socket.on('runningJob', data => {
            CommandHistory.write('runningJob(' + data.length + ')', CommandHistory.WARN);
            alert(data);
            //setGcode(data);
        });

        this.socket.on('runStatus', status => {
            //CommandHistory.write('runStatus: ' + status);
            console.log('runStatus: ' + status);
            let comAttrs = {};
            if (status === 'running') {
                comAttrs.playing = true;
                comAttrs.paused = false;
            } else if (status === 'paused') {
                comAttrs.paused = true;
            } else if (status === 'm0') {
                comAttrs.paused = true;
                comAttrs.m0 = true;
            } else if (status === 'resumed') {
                comAttrs.paused = false;
            } else if (status === 'stopped') {
                comAttrs.playing = false;
                comAttrs.paused = false;
            } else if (status === 'finished') {
                comAttrs.playing = false;
                comAttrs.paused = false;
            } else if (status === 'alarm') {
                CommandHistory.error('ALARM!')
                //this.socket.emit('clearAlarm', 2);
            }
            //!!! runStatus(status);
            this.setComAttrs(comAttrs);
        });

        this.socket.on('data', data => {
            let comAttrs = { serverConnected: true, machineConnected: true };
            if (data) {
                if (data.indexOf('<') === 0) {
                    //CommandHistory.write('statusReport: ' + data);

                    // Smoothieware: <Idle,MPos:49.5756,279.7644,-15.0000,WPos:0.0000,0.0000,0.0000>
                    // till GRBL v0.9: <Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>
                    // since GRBL v1.1: <Idle|WPos:0.000,0.000,0.000|Bf:15,128|FS:0,0|Pn:S|WCO:0.000,0.000,0.000> (when $10=2)

                    // Extract state
                    comAttrs.state = data.substring(data.indexOf('<') + 1, data.search(/(,|\|)/));
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
            this.setComAttrs(comAttrs);
        });

        this.socket.on('wPos', wpos => {
            let comAttrs = { serverConnected: true, machineConnected: true };
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
                comAttrs.wpos = [+this.xpos, +this.ypos, +this.zpos, +this.apos];
            }
            this.setComAttrs(comAttrs);
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
            let comAttrs = { serverConnected: true };
            //CommandHistory.write('laserTest: ' + data, CommandHistory.STD);
            //console.log('laserTest ' + data);
            if (data > 0) {
                comAttrs.laserTestOn = true;
            } else if (data === 0) {
                comAttrs.laserTestOn = false;
            }
            this.setComAttrs(comAttrs);
        });

        this.socket.on('qCount', data => {
            this.setComAttrs({ serverConnected: true });
            //console.log('qCount ' + data);
            data = parseInt(data);
            if (this.getComAttrs().playing && data === 0) {
                this.setComAttrs({ playing: false, paused: false, m0: false });
                //!!! runStatus('stopped');

                if (this.jobStartTime >= 0) {
                    let jobFinishTime = new Date(Date.now());
                    let elapsedTimeMS = jobFinishTime.getTime() - this.jobStartTime.getTime();
                    let elapsedTime = Math.round(elapsedTimeMS / 1000);
                    CommandHistory.write("Job started at " + this.jobStartTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.write("Job finished at " + jobFinishTime.toString(), CommandHistory.SUCCESS);
                    CommandHistory.write("Elapsed time: " + secToHMS(elapsedTime), CommandHistory.SUCCESS);
                    this.jobStartTime = -1;
                    let AJT = this.getSettingsAttrs().comAccumulatedJobTime + elapsedTime;
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
            this.setComAttrs({ comServerVersion: serverVersion });
        });

        this.socket.on('error', data => {
            CommandHistory.error('Server error: ' + data)
            //console.log('error: ' + data);
        });
    } // connectToServer()

    disconnectFromServer() {
        if (this.socket) {
            CommandHistory.write('Disconnecting from server', CommandHistory.INFO);
            this.socket.disconnect();
            let serverVersion = 'not connected';
            this.setComAttrs({ comServerVersion: serverVersion });
        }
    }

    connectToMachine() {
        var connectVia = this.props.settings.connectVia;
        var connectPort = this.props.settings.connectPort.trim();
        var connectBaud = this.props.settings.connectBaud;
        var connectIP = this.props.settings.connectIP;
        switch (connectVia) {
            case 'USB':
                if (!connectPort) {
                    CommandHistory.write('Could not connect! -> please select port', CommandHistory.DANGER);
                    break;
                }
                if (!connectBaud) {
                    CommandHistory.write('Could not connect! -> please select baudrate', CommandHistory.DANGER);
                    break;
                }
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectPort + ',' + connectBaud + 'baud', CommandHistory.INFO);
                this.socket.emit('connectTo', connectVia + ',' + connectPort + ',' + connectBaud);
                break;
            case 'Telnet':
                if (!connectIP) {
                    CommandHistory.write('Could not connect! -> please enter IP address', CommandHistory.DANGER);
                    break;
                }
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                this.socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
            case 'ESP8266':
                if (!connectIP) {
                    CommandHistory.write('Could not connect! -> please enter IP address', CommandHistory.DANGER);
                    break;
                }
                CommandHistory.write('Connecting Machine @ ' + connectVia + ',' + connectIP, CommandHistory.INFO);
                this.socket.emit('connectTo', connectVia + ',' + connectIP);
                break;
        }
    } // connectToMachine()

    disconnectFromMachine() {
        CommandHistory.write('Disconnecting Machine', CommandHistory.INFO);
        this.socket.emit('closePort');
    }

    checkConnected() {
        let { serverConnected, machineConnected } = this.getComAttrs();
        if (serverConnected)
            if (machineConnected)
                return true;
            else
                CommandHistory.error('Machine is not connected!')
        else
            CommandHistory.error('Server is not connected!')
        return false;
    }

    runCommand(gcode) {
        if (!checkConnected())
            return;
        if (gcode) {
            //CommandHistory.write('Running Command', CommandHistory.INFO);
            //console.log('runCommand', gcode);
            this.socket.emit('runCommand', gcode);
        }
    }

    runJob(job) {
        if (!checkConnected())
            return;
        if (job.length > 0) {
            CommandHistory.write('Running Job', CommandHistory.INFO);
            this.setComAttrs({ playing: true });
            //!!! runStatus('running');
            this.jobStartTime = new Date(Date.now());
            this.socket.emit('runJob', job);
        } else {
            CommandHistory.error('Job empty!')
        }
    }

    pauseJob() {
        console.log('pauseJob');
        if (!checkConnected())
            return;
        this.setComAttrs({ paused: true });
        //!!! runStatus('paused');
        this.socket.emit('pause');
    }

    resumeJob() {
        console.log('resumeJob');
        if (!checkConnected())
            return;
        this.setComAttrs({ paused: false, m0: false });
        //!!! runStatus('running');
        this.socket.emit('resume');
    }

    abortJob() {
        console.log('abortJob');
        if (!checkConnected())
            return;
        CommandHistory.write('Aborting job', CommandHistory.INFO);
        this.setComAttrs({ playing: false, paused: false, m0: false });
        //!!! runStatus('stopped');
        this.socket.emit('stop');
    }

    clearAlarm(method) {
        console.log('clearAlarm');
        if (!checkConnected())
            return;
        CommandHistory.write('Resetting alarm', CommandHistory.INFO);
        this.socket.emit('clearAlarm', method);
    }

    setZero(axis) {
        if (!checkConnected())
            return;
        CommandHistory.write('Set ' + axis + ' Axis zero', CommandHistory.INFO);
        this.socket.emit('setZero', axis);
    }

    gotoZero(axis) {
        if (!checkConnected())
            return;
        CommandHistory.write('Goto ' + axis + ' zero', CommandHistory.INFO);
        this.socket.emit('gotoZero', axis);
    }

    setPosition(data) {
        if (!checkConnected())
            return;
        CommandHistory.write('Set position to ' + JSON.stringify(data), CommandHistory.INFO);
        this.socket.emit('setPosition', data);
    }

    home(axis) {
        if (!checkConnected())
            return;
        CommandHistory.write('Home ' + axis, CommandHistory.INFO);
        this.socket.emit('home', axis);
    }

    probe(axis, offset) {
        if (!checkConnected())
            return;
        CommandHistory.write('Probe ' + axis + ' (Offset:' + offset + ')', CommandHistory.INFO);
        this.socket.emit('probe', { axis: axis, offset: offset });
    }

    laserTest(power, duration, maxS) {
        if (!checkConnected())
            return;
        console.log('laserTest(' + power + ', ' + duration + ', ' + maxS + ')');
        this.socket.emit('laserTest', power + ',' + duration + ',' + maxS);
    }

    jog(axis, dist, feed) {
        if (!checkConnected())
            return;
        //console.log('jog(' + axis + ',' + dist + ',' + feed + ')');
        this.socket.emit('jog', axis + ',' + dist + ',' + feed);
    }

    jogTo(x, y, z, mode, feed) {
        if (!checkConnected())
            return;
        //console.log('jog(' + axis + ',' + dist + ',' + feed + ')');
        this.socket.emit('jogTo', { x: x, y: y, z: z, mode: mode, feed: feed });
    }

    feedOverride(step) {
        if (!checkConnected())
            return;
        console.log('feedOverride ' + step);
        this.socket.emit('feedOverride', step);
    }

    spindleOverride(step) {
        if (!checkConnected())
            return;
        console.log('spindleOverride ' + step);
        this.socket.emit('spindleOverride', step);
    }

    resetMachine() {
        if (!checkConnected())
            return;
        CommandHistory.error('Resetting Machine')
        this.socket.emit('resetMachine');
    }

    playpauseMachine() {
        if (!checkConnected())
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
                this.setComAttrs({ paused: false });
                // !!! runStatus('running');
                // end ifPaused
            } else {
                // pause
                var laseroffcmd = document.getElementById('laseroff').value;
                if (laseroffcmd.length === 0) {
                    laseroffcmd = 0;
                }
                this.socket.emit('pause', laseroffcmd);
                this.setComAttrs({ paused: true });
                // !!! runStatus('paused');
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
                {JSON.stringify(com)}
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
                <Component {...{ ...this.props, comComponent: this.context.com }} />
            );
        }
    };
    Wrapper.contextTypes = {
        comComponent: PropTypes.any,
    };
    return Wrapper;
}
