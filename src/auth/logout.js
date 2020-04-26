import React from 'react';
import * as firebase from 'firebase';
import 'firebase/auth';
import { UserContext } from '../App';
import { Button } from '@material-ui/core';

const Logout = _ => {
    const { state, dispatch } = React.useContext(UserContext);
    const handleLogout = _ => {
        firebase.auth().signOut().then(_ => {
            dispatch({
                role: null, dept: null, name: null, type: 'ALL',
                tokenId: null, isLoggedIn: false, loading: false
            });
            window.localStorage.removeItem('userData');
        }).catch(e => {
            console.error(e);
            alert('Logout Error, try again');
        })
    };

    return (
        <div id="fc-logout" style={{ float: 'right' }}>
            <Button onClick={handleLogout} variant="text" disableElevation color="secondary"> Logout </Button>
        </div>
    );

};

export default Logout;