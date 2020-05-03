import React from 'react';
import { Checkbox, makeStyles, Container } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    filterList: {
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: "hidden",
        listStyle: 'none'
    }
}));

const UsersSearchFilter = ({users,roles,initialSelectedIds}) => {

    const classes = useStyles();

    const [ usersList, setUsersList ] = React.useState([]);
    const [ searchAdminText, setSearchAdminText ] = React.useState(null);
    const [ searchUserText, setSearchUserText ] = React.useState(null);
    const [ selectedIdsList, setSelectedIds ] = React.useState([]);

    const consolidateUsers = _ => {
        setUsersList(users.map(x => {
            return {
                role: x.role,
                user : x,
                selected: false
            }
        }));
    };

    React.useEffect( _ => {
        consolidateUsers();
    });

    return (
        <Container>
        <h3> Admin </h3>
        <input type={'search'} onChange={ (val)=> { setSearchAdminText(val.target.value) } } placeholder={'Enter search criteria...'} />
        <ul className={classes.filterList}>
            {
                usersList.filter(x=> {
                    return x.role === 'admin' && 
                    ( searchAdminText !== null && searchAdminText !== '' ? 
                    x.user.name.includes(String(searchAdminText)) || String(x.user.tokenId).includes(String(searchAdminText))
                    : true ) ;}).map(user => (
                <li key={user.user.tokenId} style={{textAlign:'left'}}> <p> <Checkbox defaultChecked={user.selected} /> {user.user.tokenId} | {user.user.name}  </p>  </li>
                ))
            }
        </ul>
        <h3> Users </h3>
        <input type={'search'} onChange={ (val)=> { setSearchUserText(val.target.value) } } placeholder={'Enter search criteria...'} />
        <ul className={classes.filterList}>
            {
                usersList.filter(x=> {
                    return x.role === 'user' && 
                    ( searchUserText !== null && searchUserText !== '' ?
                    x.user.name.includes(String(searchUserText)) || String(x.user.tokenId).includes(String(searchUserText))
                    : true ) ;}).map(user => (
                <li key={user.user.tokenId} style={{textAlign:'left'}}><p> <Checkbox defaultChecked={user.selected} />  {user.user.tokenId} | {user.user.name}  </p>  </li>
                ))
            }
        </ul>
        </Container>
    )

};

export default UsersSearchFilter;