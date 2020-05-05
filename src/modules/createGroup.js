import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import UsersSearchFilter from '../components/usersSearchFilter';
import { GroupContext } from './groups';
import { InputGroup, FormControl } from 'react-bootstrap';

const ROLES = ['user', 'admin'];

const useStyles = makeStyles(theme => ({
    modalPage: {
        background: 'white',
        color: 'black'
    }
}));

const CreateGroup = ({ name, selectedTokenIds }) => {
    const classes = useStyles();
    const db = firebase.firestore();
    const [loading, setLoading] = React.useState(true);
    const [users, setUsers] = React.useState([]);
    const { groupState, groupDispatch } = React.useContext(GroupContext);

    const fetchAllUsers = _ => {
        setLoading(true);
        db.collection('users').where('active', '==', true)
            .get().then(usersList => {
                const allUsers = usersList.docs.map(x => x.data());
                setUsers(allUsers);
                setLoading(false);
            });
    }

    React.useEffect(_ => {
        fetchAllUsers();
    }, []);

    return (
        <Container className={classes.modalPage}>
            {
                loading ? 'Fetching Users...' :
                    <div>
                        <div>
                            <InputGroup size="sm" className="mb-3">
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="inputGroup-sizing-sm">Group Name</InputGroup.Text>
                                </InputGroup.Prepend>
                                <FormControl aria-label="Small" aria-describedby="inputGroup-sizing-sm"
                                onChange={
                                    (val) => {
                                        const name = val.target.value;
                                        groupDispatch({
                                            type: 'NAME', group_name: name
                                        });
                                    }
                                } placeholder="group name" defaultValue={name}
                                />
                            </InputGroup>
                        </div>
                        <div>
                            <UsersSearchFilter roles={ROLES} users={users} selectedIds={selectedTokenIds} />
                        </div>
                    </div>
            }
        </Container>
    );

};

export default CreateGroup;