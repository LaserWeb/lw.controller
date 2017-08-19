// Copyright 2017 Todd Fleming
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from 'react';

export default class KeyboardShortcuts extends React.Component {
    componentWillMount() {
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown, true);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown, true);
    }

    onKeyDown(e) {
        let dx = 0, dy = 0;
        let jog = (axis, multiplier) => {
            e.preventDefault();
            e.stopPropagation();
            this.props.comComponent.jog(axis, this.props.settings.ctlJogKeyboardDist * multiplier, this.props.settings.ctlJogKeyboardFeed);
        };
        if (e.key === 'ArrowLeft' && e.altKey)
            jog('x', -1);
        else if (e.key === 'ArrowRight' && e.altKey)
            jog('x', 1);
        else if (e.key === 'ArrowDown' && e.altKey)
            jog('y', -1);
        else if (e.key === 'ArrowUp' && e.altKey)
            jog('y', 1);
        else if (e.key === 'PageDown' && e.altKey)
            jog('z', -1);
        else if (e.key === 'PageUp' && e.altKey)
            jog('z', 1);
        else if (e.key === 'x' && e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            this.props.comComponent.resetMachine();
        }
    }

    render() {
        let { children, comComponent, settings, ...rest } = this.props;
        return (
            <div {...rest}  >
                {children}
            </div>
        );
    }
}
