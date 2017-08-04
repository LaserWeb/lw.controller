'use strict';

import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux';
import { compose, applyMiddleware, createStore } from 'redux';
import persistState, { mergePersistedState } from 'redux-localstorage'
import adapter from 'redux-localstorage/lib/adapters/localStorage';
import filter from 'redux-localstorage-filter';
import logger from 'redux-logger';

export const LOCALSTORAGE_KEY = 'lw-controller';
export const DEBUG_KEY = "lw-controller-debug";

const hot = (state, action) => {
    return require('./reducers/main.js').default(state, action);
};

const reducer = compose(
    mergePersistedState((initialState, persistedState) => {
        let state = { ...initialState, ...persistedState };
        return hot(state, { type: 'LOADED' });
    })
)(hot);

const storage = compose(
    filter(['settings'])
)(adapter(window.localStorage));

// adds getState() to any action to get the global Store :slick:
const globalstoreMiddleWare = store => next => action => {
    next({ ...action, getState: store.getState });
};

export const getDebug = () => {
    return window.localStorage.getItem(DEBUG_KEY) === 'true';
}

export const setDebug = (b) => {
    window.localStorage.setItem(DEBUG_KEY, String(b))
}

const middlewares = [];
if (getDebug()) middlewares.push(logger({ collapsed: true }))
middlewares.push(globalstoreMiddleWare)

const middleware = compose(
    applyMiddleware(...middlewares),
    persistState(storage, LOCALSTORAGE_KEY),
);

const store = createStore(reducer, middleware);

function Hot(props) {
    const Main = require('./components/main.js').default;
    return <Main />;
}

function renderHot() {
    render((
        <Provider store={store}>
            <Hot />
        </Provider>
    ), document.getElementById('top'));
}
renderHot();

if (module.hot) {
    module.hot.accept('./reducers/main.js', renderHot);
    module.hot.accept('./components/main.js', renderHot);
}
