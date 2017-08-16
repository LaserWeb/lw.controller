import React from 'react';
import ReactDOM from 'react-dom';

export class Input extends React.Component {
    componentWillMount() {
        this.onChange = this.onChange.bind(this);
        this.setInput = this.setInput.bind(this);
    }

    convert(value) {
        if (this.props.type === 'number')
            return +value || 0;
        else
            return value + '';
    }

    setInput() {
        ReactDOM.findDOMNode(this).value = this.convert(this.props.value);
    }

    onChange(e) {
        this.props.onChangeValue(this.convert(e.target.value));
    }

    componentDidMount() {
        this.setInput();
    }

    componentDidUpdate() {
        let v = this.convert(this.props.value);
        let node = ReactDOM.findDOMNode(this);
        if (this.convert(node.value) != v)
            node.value = v;
    }

    render() {
        let { Component, value, onChangeValue, ...rest } = this.props;
        if (Component)
            return <Component {...rest} onChange={this.onChange} onBlur={this.setInput} />;
        else
            return <input {...rest} onChange={this.onChange} onBlur={this.setInput} />;
    }
};

export function StringInput({ attrs, name, ...rest }) {
    let value = attrs[name];
    return <Input value={value !== undefined ? value : ''} {...rest } />;
}

export function NumberInput({ attrs, name, ...rest }) {
    return <Input type='number' step='any' value={attrs[name]} {...rest } />;
}

export function SelectInput({ attrs, name, options, onChangeValue, ...rest }) {
    if (options.indexOf(attrs[name]) === -1)
        options = [attrs[name], ...options];
    return (
        <select value={attrs[name]} {...rest}>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    );
}

export class Field extends React.Component {
    componentWillMount() {
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    onChangeValue(v) {
        let { attrs, name, setAttrs } = this.props;
        if (attrs[name] !== v)
            setAttrs({ [name]: v }, attrs.id);
    }

    onChange(e) {
        this.onChangeValue(e.target.value);
    }

    render() {
        let { Input, setAttrs, ...rest } = this.props;
        return <Input {...rest} onChange={this.onChange} onChangeValue={this.onChangeValue} />;
    }
};
