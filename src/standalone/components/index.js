import React from 'react'
import { Com } from '../../components/com'
import Controller from '../../components/controller'
import ConnectionBar from '../../components/connection-bar'

export default function Main() {
    return (
        <Com>
            <ConnectionBar />
            <div style={{ border: '20px solid green', position: 'relative', width: '80%', height: '80%', overflow: 'visible' }}>
                <Controller />
            </div>
        </Com>
    );
}
