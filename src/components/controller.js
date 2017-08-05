import React from 'react';
import ReactDOM from 'react-dom';

const fields = {
    foo: { type: 'input', props: { type: 'number', step: 'any' } },
};

export default class Controller extends React.Component {
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
