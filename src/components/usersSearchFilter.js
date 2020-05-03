import React from 'react';
import { Checkbox, makeStyles, Container, TextField } from '@material-ui/core';
import { GroupContext } from '../modules/groups';
import { FormControl, InputGroup } from 'react-bootstrap';

const useStyles = makeStyles(theme => ({
    filterList: {
        maxHeight: '130px',
        overflowY: 'auto',
        overflowX: "hidden",
        listStyle: 'none'
    }
}));

const UsersSearchFilter = ({ users, roles, initialSelectedIds }) => {

    const classes = useStyles();

    const [usersList, setUsersList] = React.useState([]);
    const [searchAdminText, setSearchAdminText] = React.useState(null);
    const [searchUserText, setSearchUserText] = React.useState(null);
    const { groupState, groupDispatch } = React.useContext(GroupContext);

    const consolidateUsers = _ => {
        setUsersList(users.map(x => {
            let selected = !(new Array(initialSelectedIds).lastIndexOf(x.tokenId) === -1);
            return {
                role: x.role,
                user: x,
                selected: selected
            }
        }));
    };

    const editSelectedList = (val, tokenId) => {
        if (val.target.checked === true) {
            // add to list
            let currList = groupState.group_members;
            if (currList !== null && currList !== undefined) {
                if (currList.lastIndexOf(tokenId) === -1) {
                    currList.push(tokenId);
                    groupDispatch({
                        type: 'MEMBERS', group_members: currList
                    });
                }
            } else {
                let currList = [];
                currList.push(tokenId);
                groupDispatch({
                    type: 'MEMBERS', group_members: currList
                })
            }
        } else {
            // remove from list
            if (groupState.group_members !== null && groupState.group_members !== undefined) {
                let currList = groupState.group_members.filter(x => x !== tokenId);
                groupDispatch({
                    type: 'MEMBERS', group_members: currList
                })
            }
        }
    };

    React.useEffect(_ => {
        if (initialSelectedIds !== []) {
            groupDispatch({
                type: 'MEMBERS', group_members: initialSelectedIds
            });
        }
        consolidateUsers();
    }, []);

    return (
        <Container>
            <InputGroup size="sm" className="mb-3">
                <InputGroup.Prepend>
                    <InputGroup.Text id="inputGroup-sizing-sm">Admin</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl aria-label="Small" aria-describedby="inputGroup-sizing-sm"
                    type={'search'}
                    onChange={(val) => { setSearchAdminText(val.target.value) }} placeholder={'Admin Search Filter...'}
                />
            </InputGroup>
            <ul className={classes.filterList}>
                {
                    usersList.filter(x => {
                        return x.role === 'admin' &&
                            (searchAdminText !== null && searchAdminText !== '' ?
                                x.user.name.includes(String(searchAdminText)) || String(x.user.tokenId).includes(String(searchAdminText))
                                : true);
                    }).map(user => (
                        <li key={user.user.tokenId} style={{ textAlign: 'left' }}> <p> <Checkbox
                            onChange={(val) => editSelectedList(val, user.user.tokenId)}
                            defaultChecked={user.selected} /> {user.user.tokenId} - {user.user.name}  </p>  </li>
                    ))
                }
            </ul>
            <hr />
            <InputGroup size="sm" className="mb-3">
                <InputGroup.Prepend>
                    <InputGroup.Text id="inputGroup-sizing-sm">Users</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl aria-label="Small" aria-describedby="inputGroup-sizing-sm"
                    type={'search'}
                    onChange={(val) => { setSearchUserText(val.target.value) }} placeholder={'Users Search Filter...'}
                />
            </InputGroup><ul className={classes.filterList}>
                {
                    usersList.filter(x => {
                        return x.role === 'user' &&
                            (searchUserText !== null && searchUserText !== '' ?
                                x.user.name.includes(String(searchUserText)) || String(x.user.tokenId).includes(String(searchUserText))
                                : true);
                    }).map(user => (
                        <li key={user.user.tokenId} style={{ textAlign: 'left' }}><p> <Checkbox
                            onChange={(val) => editSelectedList(val, user.user.tokenId)}
                            defaultChecked={user.selected} />  {user.user.tokenId} - {user.user.name}  </p>  </li>
                    ))
                }
            </ul>
        </Container>
    )

};

export default UsersSearchFilter;