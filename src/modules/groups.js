import React from 'react';
import { UserContext } from '../App';
import { Button, Container, Grid, makeStyles, Backdrop, CircularProgress, Snackbar } from '@material-ui/core';
import ViewGroups from './viewGroups';
import CreateGroup from './createGroup';
import { Modal } from "react-bootstrap";
import * as firebase from 'firebase/app';
import 'firebase/firestore';

const initialState = {
    group_id: null,
    group_members: []
};

const useStyles = makeStyles(theme => ({
    backdrop: {
        zIndex: theme.zIndex.drawer + 100,
        color: '#fff',
    },
    snackbarStyle: {
      padding: '20px',
      color: 'white',
      background: '#4caf50'
    }
}));

export const GroupContext = React.createContext();

const groupsReducer = (state, action) => {
    switch (action.type) {
        case 'ALL':
            return {
                group_id: action.group_id,
                group_members: action.group_members
            };
        case 'NAME':
            return {
                ...state,
                group_id: action.group_id
            };
        case 'MEMBERS':
            return {
                ...state,
                group_members: action.group_members
            }
        case 'CLEAR':
            return initialState;
        default:
            return state;
    };
};

export const Groups = props => {
    const classes = useStyles();
    const [groupState, groupDispatch] = React.useReducer(groupsReducer, initialState);
    const [open, setOpen] = React.useState(false);
    const { state } = React.useContext(UserContext);
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [maskingText, setMaskingText] = React.useState('');
    const [backdropFlag, setBackdrpFlag] = React.useState(false);
    const db = firebase.firestore();

    const handleClose = _ => {
        setOpen(false);
    }

    const createGroup = _ => {
        setMaskingText('Creating Group...');
        setBackdrpFlag(true);
        let gMembers = [];
        groupState.group_members.forEach(gm => {
            gMembers.push(db.collection('users').doc(String(gm)));
        })
        const groupData = {
            group_id: groupState.group_id,
            group_members: gMembers,
            active: true
        };
        db.collection('groups').doc(String(groupData.group_id))
            .set(groupData).then(_ => {
                setBackdrpFlag(false); setMaskingText('');
                setOpen(false); groupDispatch({ type: 'CLEAR' });
                setSnackbar(true);
            }).catch( error => {
                setBackdrpFlag(false); setMaskingText('');
                setOpen(false); alert('Error Uploading Group');
                console.error(error);
            });
    };

    return (
        <GroupContext.Provider value={{ groupState, groupDispatch }} >
            <div>
                <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
                    <div className={classes.snackbarStyle} > Group Created Successfully! </div>
                </Snackbar>
                <Backdrop className={classes.backdrop} open={backdropFlag}>
                    <CircularProgress style={{ 'color': 'white' }} size={20} />
                    &nbsp;<p style={{ color: 'white' }}>{maskingText}</p>
                </Backdrop>
                <Modal show={open} onHide={handleClose} animation={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>Create Group</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <CreateGroup />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={handleClose}>
                            Cancel
                        </Button> &nbsp;
                        <Button color={'primary'}
                            disabled={!(new String(groupState.group_id).length > 0
                                && Array.isArray(groupState.group_members) && groupState.group_members.length > 0)}
                            onClick={createGroup}
                        >Submit</Button>
                    </Modal.Footer>
                </Modal>
                <Container>
                    <Button onClick={() => setOpen(true)} variant="contained" color="primary" > + Create Group </Button>
                    <br /> <br />
                    <ViewGroups state={state} />
                </Container>
            </div>
        </GroupContext.Provider>
    );

};