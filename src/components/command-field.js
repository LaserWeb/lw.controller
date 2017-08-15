import React from 'react';
import ReactDOM from 'react-dom'

export default class CommandField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentLine: '',
            lines: [],
            cursor: 0
        }
    }

    componentWillMount() {
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    componentDidMount() {
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        let input = ReactDOM.findDOMNode(this);
        if (input.value !== this.state.currentLine)
            input.value = this.state.currentLine;
    }

    onChange(e) {
        this.setState({ currentLine: e.target.value });
    }

    onKeyDown(e) {
        if (e.which == 38)
            this.onUp(e)
        else if (e.which == 40)
            this.onDown(e)
        else if (e.which == 13)
            this.onExec(e)
    }

    onUp(e) {
        e.preventDefault();
        let cursor = Math.max(0, this.state.cursor - 1);
        this.setState({ cursor, currentLine: this.state.lines[cursor] });
    }

    onDown(e) {
        e.preventDefault();
        let cursor = this.state.cursor + 1;
        if (cursor >= this.state.lines.length)
            this.setState({ cursor: this.state.lines.length, currentLine: '' })
        else
            this.setState({ cursor, currentLine: this.state.lines[cursor] })
    }

    handleCommandDelete(e) {
        this.setState({ currentLine: '' });
    }

    onExec(e) {
        e.preventDefault();
        let value = e.target.value;
        if (value.length) {
            let lines = [...this.state.lines, value]
            this.setState({ currentLine: '', lines, cursor: lines.length });
        }
        if (typeof this.props.onExec !== 'undefined')
            this.props.onExec(value);
    }

    render() {
        let { style, onExec, ...props } = this.props;
        return (
            <input ref="input" type="text" style={style} {...props} onChange={this.onChange} onKeyDown={this.onKeyDown} />
        );
    }
} // CommandField
