import React from 'react';
import { UserContext } from '../App';
import { Grid } from '@material-ui/core';
import ViewGroups from './viewGroups';
import CreateGroup from './createGroup';

const Groups = props => {

    const { state } = React.useContext(UserContext);

    return (
        <div>
            <Grid container spacing={2}>
                <Grid item md={6}>
                    <CreateGroup />
                </Grid>
                <Grid item md={6}>
                    <ViewGroups state={state} />
                </Grid>
            </Grid>
        </div>
    );

};

export default Groups