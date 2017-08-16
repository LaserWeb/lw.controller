import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { StringInput, NumberInput, SelectInput, Field } from './fields';
import { withComComponent } from './com';
import Log from './log';
import CommandField from './command-field';
import { setComAttrs } from '../actions/com';
import { setGcode } from '../standalone/actions/gcode';
import { setSettingsAttrs } from '../standalone/actions/settings';

function adjustFeed(settings, feed) {
    if (settings.toolFeedUnits === 'mm/s')
        return feed * 60;
    else
        return feed;
}

function formatNumber(value) {
    if (isNaN(value))
        return '    NaN';
    else
        return (value < 0 ? '-' : ' ') + ('     ' + Math.abs(value).toFixed(2)).slice(-7);
}

function numberSetting(name, settings, dispatch) {
    return { type: Field, props: { Input: NumberInput, attrs: settings, setAttrs: setSettingsAttrs, name, dispatch } }
}

export class WPosField extends React.Component {
    componentWillMount() {
        this.onChange = this.onChange.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    getValue() {
        return this.props.com['wpos-' + this.props.axis];
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        if (this.changed)
            return;
        let node = ReactDOM.findDOMNode(this);
        let v = formatNumber(this.getValue());
        if (node.value != v)
            node.value = v;
    }

    onChange(e) {
        this.changed = true;
    }

    onBlur(e) {
        if (!this.changed)
            return;
        let { axis, com, comComponent } = this.props;
        let cmd = 'G10 L20 P0';
        for (let a of com.axes)
            if (a === axis)
                cmd += ' ' + a + (e.target.value || 0);
            else
                cmd += ' ' + a + (com['wpos-' + a] || 0);
        comComponent.runCommand(cmd);
        e.target.value = formatNumber(e.target.value);
        this.changed = false;
    }

    onKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            this.onBlur(e);
        } else if (e.key === 'Escape' && this.changed) {
            e.preventDefault();
            e.stopPropagation();
            this.changed = false;
            this.componentDidUpdate(e);
        }
    }

    render() {
        let { axis, com, comComponent, ...rest } = this.props;
        return <input onChange={this.onChange} onBlur={this.onBlur} onKeyDown={this.onKeyDown} {...rest} />;
    }
}; // WPosField

function getFields(controller) {
    let { settings, com, comComponent, dispatch } = controller.props;
    return {
        'log': { type: Log },
        'command': {
            type: CommandField,
            props: {
                onExec: cmd => comComponent.runCommand(cmd),
                ref: field => controller.commandField = field,
                disabled: !com.serverConnected || !com.machineConnected || com.playing
            }
        },
        'open-gcode': { type: 'input', style: { opacity: 0 }, props: { type: 'file', accept: '.gcode', value: '', onChange: e => controller.loadGcode(e) } },
        'ctlJog1Dist': numberSetting('ctlJog1Dist', settings, dispatch),
        'ctlJog2Dist': numberSetting('ctlJog2Dist', settings, dispatch),
        'ctlJog3Dist': numberSetting('ctlJog3Dist', settings, dispatch),
        'ctlJog1Feed': numberSetting('ctlJog1Feed', settings, dispatch),
        'ctlJog2Feed': numberSetting('ctlJog2Feed', settings, dispatch),
        'ctlJog3Feed': numberSetting('ctlJog3Feed', settings, dispatch),
        'wpos-x': { type: WPosField, props: { axis: 'x', com, comComponent, disabled: !controller.values['enable-modify-offsets'] } },
        'wpos-y': { type: WPosField, props: { axis: 'y', com, comComponent, disabled: !controller.values['enable-modify-offsets'] } },
        'wpos-z': { type: WPosField, props: { axis: 'z', com, comComponent, disabled: !controller.values['enable-modify-offsets'] } },
        'wpos-a': { type: WPosField, props: { axis: 'a', com, comComponent, disabled: !controller.values['enable-modify-offsets'] } },
    };
};

const buttons = {
    'home-all': { click(controller, { comComponent, settings }) { comComponent.runCommand(settings.gcodeHoming) } },
    'run-job': { click(controller, { comComponent }) { comComponent.runJob(controller.gcode.content) } },
    'pause-job': { click(controller, { comComponent }) { comComponent.pauseJob() } },
    'resume-job': { click(controller, { comComponent }) { comComponent.resumeJob() } },
    'abort-job': { click(controller, { comComponent }) { comComponent.abortJob() } },
    'clear-alarm': { click(controller, { comComponent }) { comComponent.clearAlarm(2) } },
    'set-zero': { click(controller, { comComponent }) { comComponent.setZero('all') } },
    'check-size': { click(controller, { comComponent }) { console.log('!!!check-size'); } },
    'jog': {
        click(controller, { comComponent, settings }, { }, { axis, index, negative }) {
            comComponent.jog(
                axis,
                settings['ctlJog' + index + 'Dist'] * (negative ? -1 : 1),
                adjustFeed(settings, settings['ctlJog' + index + 'Feed']))
        }
    },
    'set-axis-0': {
        click(controller, { comComponent, com }, { }, { axis }) {
            let cmd = 'G10 L20 P0';
            for (let a of com.axes)
                if (a === axis)
                    cmd += ' ' + a + 0;
                else
                    cmd += ' ' + a + (com['wpos-' + a] || 0);
            comComponent.runCommand(cmd);
        }
    },
    'set-axis-div2': {
        click(controller, { comComponent, com }, { }, { axis }) {
            let cmd = 'G10 L20 P0';
            for (let a of com.axes)
                if (a === axis)
                    cmd += ' ' + a + (com['wpos-' + a] || 0) / 2;
                else
                    cmd += ' ' + a + (com['wpos-' + a] || 0);
            comComponent.runCommand(cmd);
        }
    },
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
        this.values = {};
    }

    componentWillMount() {
        this.onKeyDown = this.onKeyDown.bind(this);
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
                    let event = button.button[e.data.event];
                    if (event)
                        event(this, this.props, e.data, button.elem);
                }
            }
            // console.log(e.data);
        };
        window.addEventListener("message", this.receiveMessage, false);
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener("message", this.receiveMessage, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.elements.length && (this.settings !== nextProps.settings || this.com !== nextProps.com || this.gcode !== nextProps.gcode)) {
            let settings = this.settings = nextProps.settings;
            let com = this.com = nextProps.com;
            let gcode = this.gcode = nextProps.gcode;
            let locked = !com.serverConnected || !com.machineConnected || com.alarm;
            let values = this.values = {
                ...settings, ...com,
                'mpos-x': com['wpos-x'] + com['work-offset-x'],
                'mpos-y': com['wpos-y'] + com['work-offset-y'],
                'mpos-z': com['wpos-z'] + com['work-offset-z'],
                'mpos-a': com['wpos-a'] + com['work-offset-a'],
                'gcodeLoaded': gcode.content.length > 0,
                locked,
                'enable-home-all': !locked && !com.playing && settings.gcodeHoming !== '',
                'enable-run-job': !locked && !com.playing && gcode.content.length > 0,
                'enable-pause-job': !locked && com.playing && !com.paused,
                'enable-resume-job': !locked && com.playing && com.paused,
                'enable-abort-job': !locked && com.playing,
                'enable-clear-alarm': com.serverConnected && com.machineConnected && com.alarm,
                'enable-modify-offsets': !locked && (!com.playing || com.m0),
                'enable-check-size': !locked && !com.playing,
                'enable-jog': !locked && (!com.playing || com.m0),
            };
            this.iframe.contentWindow.postMessage({ type: 'setValues', values }, '*');
            return true;
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

    onKeyDown(e) {
        if (e.key === 'Escape' && this.commandField) {
            e.preventDefault();
            e.stopPropagation();
            ReactDOM.findDOMNode(this.commandField).focus();
        }
    }

    render() {
        let { width, height, contentWidth, contentHeight, elements } = this.state;
        let controls = [];
        let fields = getFields(this);

        for (let elem of elements) {
            if (elem.type === 'field') {
                let { name, left, top, width, height, font } = elem;
                let field = fields[name] || { type: 'input', props: { value: "unrecognized", readOnly: true } };
                controls.push(<field.type
                    key={elem.id} {...field.props}
                    style={{ position: 'absolute', left, top, width, height, font, ...field.style }} />);
            } else if (elem.type === 'button') {
                if (buttons[elem.action])
                    this.buttons[elem.id] = { elem, button: buttons[elem.action] };
            }
        }

        return (
            <div onKeyDown={this.onKeyDown} style={{
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

    loadGcode(e) {
        for (let file of e.target.files) {
            let reader = new FileReader;
            reader.onload = () => this.props.dispatch(setGcode(reader.result));
            reader.readAsText(file);
        }
    }
} // Controller
Controller = connect(
    ({ settings, com, gcode }) => ({ settings, com, gcode }),
)(withComComponent(Controller));
export default Controller;
