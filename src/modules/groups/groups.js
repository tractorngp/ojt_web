import React from 'react';
import { UserContext } from '../../App';
import { makeStyles, Snackbar } from '@material-ui/core';
import ViewGroups from './viewGroups';
import CreateGroup from './createGroup';
import { Modal, Button, Container, Alert } from "react-bootstrap";
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { nullChecker, listEmptyChecker } from './../../utils/commonUtils';
import styles from './../../App.css';
import { BackDropComponent } from '../../components/pageLoaderComponent';
const initialState = {
    group_id: null,
    name: null,
    group_members: [],
    active: false
};

const selectedTokenInitialState = {
    selectedTokenIds: []
};

const useStyles = makeStyles(theme => ({
    snackbarStyle: {
        padding: '20px',
        color: 'white',
        background: '#4caf50'
    }
}));

export const GroupContext = React.createContext();

const selectedTokensReducer = (state, action) => {
    switch (action.type) {
        case 'ALL':
            return {
                ...state,
                selectedTokenIds: action.selectedTokenIds
            };
        case 'CLEAR':
            return selectedTokenInitialState;
        default:
            return state;
    }
};

const groupsReducer = (state, action) => {
    switch (action.type) {
        case 'ALL':
            return {
                group_id: action.group_id,
                name: action.name,
                group_members: action.group_members,
                active: action.active
            };
        case 'GROUP_ID':
            return {
                ...state,
                group_id: action.group_id
            }
        case 'NAME':
            return {
                ...state,
                name: action.group_name
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
    const [groupState, groupDispatch] = React.useReducer(groupsReducer, initialState);
    const [selectedTokenState, selectedTokenDispatch] = React.useReducer(selectedTokensReducer, selectedTokenInitialState);
    const [open, setOpen] = React.useState(false);
    const { state } = React.useContext(UserContext);
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [maskingText, setMaskingText] = React.useState('');
    const [backdropFlag, setBackdrpFlag] = React.useState(false);
    const db = firebase.firestore();

    const handleClose = _ => {
        setOpen(false);
    }

    const createGroup = async _ => {
        setMaskingText('Creating Group...');
        setBackdrpFlag(true);
        let gMembers = [];
        selectedTokenState.selectedTokenIds.forEach(gm => {
            gMembers.push(db.collection('users').doc(String(gm)));
        })
        const groupData = {
            group_id: null,
            name: groupState.name,
            group_members: gMembers,
            active: true,
            createdDate: new Date().toISOString()
        };
        // TODO - check if group_id is already taken
        const newGroupRef = (await db.collection('groups').doc()).id;
        groupData.group_id = newGroupRef;
        db.collection('groups').doc(newGroupRef)
            .set(groupData).then(_ => {
                setBackdrpFlag(false); setMaskingText('');
                setOpen(false); groupDispatch({ type: 'CLEAR' });
                setSnackbar(true);
            }).catch(error => {
                setBackdrpFlag(false); setMaskingText('');
                setOpen(false); alert('Error Uploading Group');
                console.error(error);
            });
    };

    return (
        <GroupContext.Provider value={{ groupState, groupDispatch, selectedTokenState, selectedTokenDispatch }} >
            <div>
                <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
                <Alert variant={'success'} onClose={() => setSnackbar(false)} dismissible>
                    Group Created Succesfully!
                </Alert>
                </Snackbar>
                <BackDropComponent maskingText={maskingText} showBackdrop={backdropFlag} />
                {/* create group modal - actual logic to verify and filter in CreateGroup */}
                <Modal size={'lg'} className={styles.info_modal} show={open} onHide={handleClose} animation={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>Create Group</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <CreateGroup />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='light' onClick={handleClose}>
                            Cancel
                        </Button> &nbsp;
                        <Button variant='success'
                            disabled={!(nullChecker(groupState.name) && groupState.name.length > 0
                                && listEmptyChecker(selectedTokenState.selectedTokenIds))}
                            onClick={createGroup}
                        >Submit</Button>
                    </Modal.Footer>
                </Modal>
                <Container fluid>
                    <ViewGroups state={state} />
                </Container>
            </div>
        </GroupContext.Provider>
    );

};