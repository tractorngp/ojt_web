import React from 'react';
import { Checkbox, makeStyles, Container } from '@material-ui/core';
import { GroupContext } from '../modules/groups/groups';
import { FormControl, InputGroup } from 'react-bootstrap';

const useStyles = makeStyles(theme => ({
    filterList: {
        maxHeight: '20vh',
        overflowY: 'auto',
        overflowX: "hidden",
        listStyle: 'none'
    }
}));

const UsersSearchFilter = ({ users, roles, selectedIds }) => {

    const classes = useStyles();

    const [usersList, setUsersList] = React.useState([]);
    const [searchAdminText, setSearchAdminText] = React.useState(null);
    const [searchUserText, setSearchUserText] = React.useState(null);
    const { groupState, groupDispatch, selectedTokenState, selectedTokenDispatch }
     = React.useContext(GroupContext);
    const consolidateUsers = _ => {
        setUsersList(users.map(x => {
            let selected = false;
            if(selectedIds !== null && selectedIds !== undefined){
                selectedIds.forEach(selId => {
                    if(selId === x.tokenId) selected = true;
                })
            }
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
            let currList = selectedTokenState.selectedTokenIds;
            if (currList !== null && currList !== undefined) {
                if (currList.lastIndexOf(tokenId) === -1) {
                    currList.push(tokenId);
                    selectedTokenDispatch({
                        type: 'ALL', selectedTokenIds: currList
                    });
                }
            } else {
                let currList = [];
                currList.push(tokenId);
                selectedTokenDispatch({
                    type: 'ALL', selectedTokenIds: currList
                });
            }
        } else {
            // remove from list
            if (selectedTokenState.selectedTokenIds !== null && selectedTokenState.selectedTokenIds !== undefined) {
                let currList = selectedTokenState.selectedTokenIds.filter(x => x !== tokenId);
                selectedTokenDispatch({
                    type: 'ALL', selectedTokenIds: currList
                });
            }
        }
    };

    React.useEffect(_ => {
        console.log(selectedIds);
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
                                x.user.name.toLocaleLowerCase().includes(String(searchAdminText).toLocaleLowerCase()) || String(x.user.tokenId).includes(String(searchAdminText).toLocaleLowerCase())
                                : true);
                    }).map(user => (
                        <li key={user.user.tokenId} style={{ textAlign: 'left' }}> <p> <Checkbox
                            color={'primary'}
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
                                x.user.name.toLocaleLowerCase().includes(String(searchUserText).toLocaleLowerCase()) || String(x.user.tokenId).includes(String(searchUserText).toLocaleLowerCase())
                                : true);
                    }).map(user => (
                        <li key={user.user.tokenId} style={{ textAlign: 'left' }}><p> <Checkbox
                            color={'primary'}
                            onChange={(val) => editSelectedList(val, user.user.tokenId)}
                            defaultChecked={user.selected} />  {user.user.tokenId} - {user.user.name}  </p>  </li>
                    ))
                }
            </ul>
        </Container>
    )

};

export default UsersSearchFilter;