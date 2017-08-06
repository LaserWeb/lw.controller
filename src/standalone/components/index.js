import React from 'react'
import { Com } from '../../components/com'
import Controller from '../../components/controller'
import ConnectionBar from '../../components/connection-bar'

export default function Main() {
    return (
        <Com style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <ConnectionBar style={{ flex: '0 0' }} />
            <div style={{ flex: '1 1', border: '20px solid green', position: 'relative', overflow: 'visible' }}>
                <Controller />
            </div>
        </Com >
    );
}
