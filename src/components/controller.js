import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { StringInput, NumberInput, SelectInput, Field } from './fields';
import { withComComponent } from './com';

const fields = {
    foo: { type: 'input', props: { type: 'number', step: 'any' } },
};

const buttons = {
    'home-all': { click(controller, { comComponent, settings }) { console.log('home-all'); comComponent.runCommand(settings.gcodeHoming) } },
    'run-job': { click(controller, { comComponent }) { console.log('run-job'); comComponent.runJob() } },
    'pause-job': { click(controller, { comComponent }) { console.log('pause-job'); comComponent.pauseJob() } },
    'abort-job': { click(controller, { comComponent }) { console.log('abort-job'); comComponent.abortJob() } },
    'clear-alarm': { click(controller, { comComponent }) { console.log('clear-alarm'); comComponent.clearAlarm() } },
    'set-zero': { click(controller, { comComponent }) { console.log('set-zero'); comComponent.setZero() } },
    'check-size': { click(controller, { comComponent }) { console.log('check-size'); comComponent.checkSize() } },
};

class Controller extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
            height: 0,
            contentWidth: 0,
            contentHeight: 0,
            elements: [],
            visibility: 'hidden'
        };
        this.transform = '';
        this.buttons = {};
    }

    componentDidMount() {
        this.mounted = true;
        let node = ReactDOM.findDOMNode(this);
        this.iframe = node.children[0];

        let checkResize = () => {
            if (!this.mounted)
                return;
            let { width, height } = node.getBoundingClientRect();
            let newState = { width, height };
            if (newState.width !== this.state.width || newState.height !== this.state.height)
                this.setState(newState);
            requestAnimationFrame(checkResize);
        };
        checkResize();

        this.receiveMessage = e => {
            if (e.source !== this.iframe.contentWindow)
                return;
            if (e.data.type === 'loaded')
                this.setState({
                    contentWidth: e.data.width, contentHeight: e.data.height,
                    elements: e.data.elements
                });
            else if (e.data.type === 'ackSetTransform' && this.state.visibility !== 'visible')
                this.setState({ visibility: 'visible' });
            else if (e.data.type === 'mouse') {
                let button = this.buttons[e.data.id];
                if (button) {
                    let event = button[e.data.event];
                    if (event)
                        event(this, this.props, e.data);
                }
            }
            console.log(e.data);
        };
        window.addEventListener("message", this.receiveMessage, false);
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener("message", this.receiveMessage, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.elements.length && (this.settings !== nextProps.settings || this.com !== nextProps.com)) {
            let settings = this.settings = nextProps.settings;
            let com = this.com = nextProps.com;
            let locked = !com.serverConnected || !com.machineConnected || com.alarm;
            let values = {
                ...settings, ...com,
                workOffsetX: com.workOffset[0],
                workOffsetY: com.workOffset[1],
                workOffsetZ: com.workOffset[2],
                workOffsetA: com.workOffset[3],
                wposX: com.wpos[0],
                wposY: com.wpos[1],
                wposZ: com.wpos[2],
                wposA: com.wpos[3],
                mposX: com.wpos[0] + com.workOffset[0],
                mposY: com.wpos[1] + com.workOffset[1],
                mposZ: com.wpos[2] + com.workOffset[2],
                mposA: com.wpos[3] + com.workOffset[3],
                'enable-home-all': !locked && !com.playing && settings.gcodeHoming !== '',
                'enable-run-job': !locked && (!com.playing || com.paused),
                'enable-pause-job': !locked && com.playing && !com.paused,
                'enable-abort-job': !locked && com.playing,
                'enable-clear-alarm': com.serverConnected && com.machineConnected && com.alarm,
                'enable-set-zero': !locked && (!com.playing || com.m0),
                'enable-check-size': !locked && !com.playing,
            };
            this.iframe.contentWindow.postMessage({ type: 'setValues', values }, '*');
        }
        if (nextState !== this.state)
            return true;
        return false;
    }

    componentWillUpdate(nextProps, nextState) {
        let { width, height, contentWidth, contentHeight } = nextState;
        let transform = '';
        if (width && height && contentWidth && contentHeight)
            transform = 'scale(' + Math.min(width / contentWidth, height / contentHeight) + ')';
        if (this.transform !== transform) {
            this.transform = transform;
            if (this.iframe)
                this.iframe.contentWindow.postMessage({ type: 'setTransform', transform }, '*');
        }
    }

    render() {
        let { width, height, contentWidth, contentHeight, elements } = this.state;
        let controls = [];

        for (let elem of elements) {
            if (elem.type === 'field') {
                let { left, top, width, height, font } = elem;
                let field = fields[elem.field] || { type: 'input', props: { value: "unrecognized", readOnly: true } };
                controls.push(<field.type
                    key={elem.id} {...field.props}
                    style={{ position: 'absolute', left, top, width, height, font }} />);
            } else if (elem.type === 'button') {
                if (buttons[elem.action])
                    this.buttons[elem.id] = buttons[elem.action];
            }
        }

        return (
            <div style={{
                position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                visibility: this.state.visibility
            }}>
                <iframe
                    width={width} height={height} style={{ border: 'none' }}
                    referrerPolicy='no-referrer' sandbox='allow-scripts'
                    src="everything.svg"
                />
                <div style={{
                    position: 'absolute', left: 0, top: 0, transformOrigin: 'top left',
                    transform: this.transform, visibility: this.state.visibility
                }}>
                    {controls}
                </div>
            </div>);
    }
} // Controller
Controller = connect(
    ({ settings, com }) => ({ settings, com }),
)(withComComponent(Controller));
export default Controller;
