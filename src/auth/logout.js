import React from 'react';
import { UserContext } from '../App';
import { Button } from '@material-ui/core';
import { IoMdPower } from 'react-icons/io';

const Logout = _ => {
    const { dispatch } = React.useContext(UserContext);
    const handleLogout = _ => {
            dispatch({
                role: null, dept: null, name: null, type: 'ALL',
                tokenId: null, isLoggedIn: false, loading: false
            });
            window.localStorage.removeItem('ojtUserData');
    };

    return (
        <div id="fc-logout" style={{ float: 'right' }}>
            <Button onClick={handleLogout} variant="text" disableElevation color="secondary">
                <IoMdPower /> &nbsp;
                  Logout </Button>
        </div>
    );

};

export default Logout;