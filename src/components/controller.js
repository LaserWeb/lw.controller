import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { StringInput, NumberInput, SelectInput, Field } from './fields';
import { withComComponent } from './com';

const fields = {
    foo: { type: 'input', props: { type: 'number', step: 'any' } },
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
            //console.log(e.data);
        };
        window.addEventListener("message", this.receiveMessage, false);
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener("message", this.receiveMessage, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.elements.length && (this.settings !== nextProps.settings || this.com !== nextProps.com)) {
            this.settings = nextProps.settings;
            this.com = nextProps.com;
            let values = {
                ...this.settings, ...this.com,
                workOffsetX: this.com.workOffset[0],
                workOffsetY: this.com.workOffset[1],
                workOffsetZ: this.com.workOffset[2],
                workOffsetA: this.com.workOffset[3],
                wposX: this.com.wpos[0],
                wposY: this.com.wpos[1],
                wposZ: this.com.wpos[2],
                wposA: this.com.wpos[3],
                mposX: this.com.wpos[0] + this.com.workOffset[0],
                mposY: this.com.wpos[1] + this.com.workOffset[1],
                mposZ: this.com.wpos[2] + this.com.workOffset[2],
                mposA: this.com.wpos[3] + this.com.workOffset[3],
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
                let { left, top, width, height, fontSize } = elem;
                let field = fields[elem.field] || { type: 'input', props: { value: "unrecognized", readOnly: true } };
                controls.push(<field.type
                    key={elem.id} {...field.props}
                    style={{ position: 'absolute', left, top, width, height, fontSize }} />);
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
