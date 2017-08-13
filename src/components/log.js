import React from 'react';
import ReactDOM from 'react-dom';

// level STD, INFO, WARN, DANGER, SUCCESS
const CommandHistory_ICON = ['terminal', 'info-circle', 'exclamation-triangle', 'exclamation-circle', 'check-circle'];
const CommandHistory_CLASS = ['default', 'info', 'warning', 'danger', 'success'];

function createCommandLogLine(message, level = 0, icon = undefined) {
    if (icon === undefined) icon = level;
    level = isNaN(level) ? level : CommandHistory_CLASS[level];
    icon = isNaN(icon) ? icon : CommandHistory_ICON[icon];
    let line = document.createElement('code');
    line.className = level;
    line.innerHTML = `<i class="fa fa-${icon}"></i> ${message}`;
    return line;
}

export default class Log extends React.Component {
    componentDidMount() {
        if (!window.commandLog)
            window.commandLog = document.createElement('div');
        ReactDOM.findDOMNode(this).appendChild(window.commandLog);
    }

    componentWillUnmount() {
        if (window.commandLog)
            ReactDOM.findDOMNode(this).removeChild(window.commandLog);
    }

    static write(message, level, icon) {
        if (!window.commandLog)
            window.commandLog = document.createElement('div');
        window.commandLog.appendChild(createCommandLogLine(message, level, icon));
        if (window.commandLog.parentNode) {
            let node = window.commandLog.parentNode;
            node.scrollTop = node.scrollHeight;
        }
    }

    static stringify(arg) {
        if (typeof arg === 'string')
            return arg;
        else if (Array.isArray(arg))
            return arg.map(Log.stringify).join(' ');
        else
            return JSON.stringify(arg);
    }

    static log(...args) {
        Log.write(Log.stringify(args));
    }

    static warn(...args) {
        Log.write(Log.stringify(args), 2);
    }

    static error(...args) {
        Log.write(Log.stringify(args), 3);
    }

    static dir(message, items, level) {
        Log.write(`<details><summary>${message}</summary><p>${Log.stringify(items)}</p></details>`, level);
    }

    render() {
        return <div className="log" {...this.props} />;
    }
}

Log.STD = 0;
Log.INFO = 1;
Log.WARN = 2;
Log.DANGER = 3;
Log.SUCCESS = 4;
