import React from 'react'
import ReactDOM from 'react-dom';

export default class Controller extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
            height: 0,
            svgWidth: 0,
            svgHeight: 0,
            visibility: 'hidden'
        };
        this.transform = '';
    }

    componentDidMount() {
        this.mounted = true;
        let node = ReactDOM.findDOMNode(this);
        this.svgContainer = node.children[0];

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
            if (e.source !== this.svgContainer.contentWindow)
                return;
            if (e.data.type === 'loadedSvg')
                this.setState({ svgWidth: e.data.width, svgHeight: e.data.height });
            else if (e.data.type === 'ackSetTransform' && this.state.visibility !== 'visible')
                this.setState({ visibility: 'visible' });
            console.log(e.data);
        };
        window.addEventListener("message", this.receiveMessage, false);
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener("message", this.receiveMessage, false);
    }

    componentWillUpdate(nextProps, nextState) {
        let { width, height, svgWidth, svgHeight } = nextState;
        let transform = '';
        if (width && height && svgWidth && svgHeight)
            transform = 'scale(' + Math.min(width / svgWidth, height / svgHeight) + ')';
        if (this.transform !== transform) {
            this.transform = transform;
            if (this.svgContainer)
                this.svgContainer.contentWindow.postMessage({ type: 'setTransform', transform }, '*');
        }
    }

    render() {
        let { width, height, svgWidth, svgHeight } = this.state;
        return (
            <div style={{ position: 'absolute', backgroundColor: 'maginta', left: 0, top: 0, width: '100%', height: '100%', visibility: this.state.visibility }}>
                <iframe
                    width={width} height={height} style={{ border: 'none' }}
                    referrerPolicy='no-referrer' sandbox='allow-scripts'
                    src="everything.svg"
                />
            </div>);
    }
} // Controller
