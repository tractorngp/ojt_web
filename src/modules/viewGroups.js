import React from 'react';
import { TableContainer, Paper, TableHead, Table, TableRow, TableCell, TableBody, makeStyles, Switch, Button, Chip, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, Tooltip } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { IoMdPaper, IoMdCreate } from 'react-icons/io';

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 250,
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  }
}));

const ViewGroups = props => {
  const classes = useStyles();
  const db = firebase.firestore();
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAllGroups = _ => {
    setLoading(true);
    db.collection('groups')
      .onSnapshot(groupsSnapshot => {
        const gList = groupsSnapshot.docs.map(snapShot => snapShot.data());
        setGroups(gList);
        setLoading(false);
      }, error => {
        setLoading(false);
        alert('DB Error');
        console.log(error);
      });
  };

  const toggleGroupStatus = (val,group_id) => {
    const toggleStatus = val.target.checked;
    db.collection('groups').doc(''+group_id).update({
      active: toggleStatus
    })
  };

  React.useEffect(_ => {
    fetchAllGroups();
  }, []);

  return (
    <TableContainer component={Paper}>
      {groups.length === 0 ? 'Loading Groups...' :
            <List>
            {groups.map((row) => (
              <ListItem key={row.group_id}>
                <ListItemText>
                  <p> ID: {row.group_id} &nbsp; </p>
                  <Chip label={row.group_members.length + ' Members'} /> 
                  &nbsp; &nbsp; <Chip label={row.active === true ? 'Active' : 'Inactive' } color={'primary'} />
                </ListItemText>
                <ListItemSecondaryAction>
                  <Tooltip title={'Edit Group'} >
                    <Button size={'small'} ><IoMdCreate /> Edit Group </Button>
                  </Tooltip>
                  <Switch
                    defaultChecked={row.active}
                    onChange={ (val) => {
                      toggleGroupStatus(val,row.group_id)
                    } }
                    color="primary"
                    name="statusSwitch"
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                  /> 
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            </List>
      }
    </TableContainer>
  );

};

export default ViewGroups;