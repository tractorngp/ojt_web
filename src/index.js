import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as firebase from 'firebase';

const firebaseConfig = {
  apiKey: "AIzaSyBk-Cbd3GoNDBptjZnknxYaUaOnTJ74DiQ",
  authDomain: "ojtappl.firebaseapp.com",
  databaseURL: "https://ojtappl.firebaseio.com",
  projectId: "ojtappl",
  storageBucket: "ojtappl.appspot.com",
  messagingSenderId: "240306423405",
  appId: "1:240306423405:web:2c98384e0e52d0b53c2164",
  measurementId: "G-KEZE5FJ6TY"
};

firebase.initializeApp(firebaseConfig);

ReactDOM.render(
    <App />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
