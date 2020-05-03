import React from 'react';
import { Container } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import UsersSearchFilter from '../components/usersSearchFilter';

const ROLES = ['user', 'admin'];

const CreateGroup = ({ name, selectedTokenIds }) => {

    const db = firebase.firestore();
    const [loading, setLoading] = React.useState(true);
    const [users, setUsers] = React.useState([]);

    const fetchAllUsers = _ => {
        setLoading(true);
        db.collection('users').where('active', '==', true)
            .get().then(usersList => {
                const allUsers = usersList.docChanges().map(x => x.doc.data());
                setUsers(allUsers);
                setLoading(false);
            });
    }

    React.useEffect(_ => {
        fetchAllUsers();
    }, []);

    return (
        <Container>
            {
                loading ? 'Fetching Users...' :
                    <div>
                        <div>
                            <input placeholder="group name" />
                        </div>
                        <div>
                            <UsersSearchFilter roles={ROLES} users={users} selectedIds={['1111','1113']} />
                        </div>
                    </div>
            }
        </Container>
    );

};

export default CreateGroup;