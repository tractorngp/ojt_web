import React from 'react';
import { TableContainer, Paper, TableHead, Table, TableRow, TableCell, TableBody, makeStyles, ExpansionPanelDetails, Typography, ExpansionPanelSummary, ExpansionPanel } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { GROUPS } from '../utils/constants';
import { IoMdArrowDown, IoMdPeople } from 'react-icons/io';
import { UserContext } from '../App';

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
  },
}));

const ViewGroups = props => {
  const classes = useStyles();
  const db = firebase.firestore();
  const [groups, setGroups] = React.useState([]);

  const fetchUsersList = async userRefs => {
    let users = [];
    userRefs.forEach(async userRef => {
      const data = await (await userRef.get()).data();
      if(data.active === true)
        users.push(data);
    });
    return users;
  };

  // pending -- not fetching users
  const fetchGroups = async groupRef => {
    return await(await groupRef.get()).docs;
  };

  const resolveUsers = group => {
    return Promise.all(group.group_members.map(async group_member => {
      return group_member.get()
    }));
  };

  const fetchAllGroups = async _ => {
    const groupRef = db.collection(GROUPS).where('active','==',true);
    const groups = (await fetchGroups(groupRef)).map(x=>x.data());
    const res = groups.map(async group => {
      const group_members = (await resolveUsers(group)).map(x => x.data());
      return {
        group: group,
        group_members: group_members
      }
    })
    return res;
  };

  const awaitGroups = async _ => {
    fetchAllGroups().then(data => {
      let ls = [];
      data[0].then(da=>{
        console.log(da);
        ls.push(da);

      setGroups(ls);
      });
    })
  }

  React.useEffect(_ => {
    awaitGroups();
  }, []);

  return (
    <TableContainer component={Paper}>
      {groups.length === 0 ? 'Loading Groups...' :
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Groups</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((row) => (
              <TableRow key={row.group.group_id}>
                <TableCell component="th" scope="row">
                  <ExpansionPanel>
                    <ExpansionPanelSummary
                      expandIcon={<IoMdArrowDown />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <Typography className={classes.heading}>{row.group.group_id}</Typography>
                      <Typography className={classes.secondaryHeading}> <IoMdPeople size={20} /> Group members </Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                      <Typography component={'span'}>
                        <ul style={{listStyle:'none'}}>
                          {row.group_members !== null && row.group_members !== [] ?
                           row.group_members.map((gm)=> (
                             <li>
                               <p> {gm.tokenId} : {gm.name} </p>
                             </li>
                           ))
                          : 'None'}
                        </ul>
                    </Typography>
                    </ExpansionPanelDetails>
                  </ExpansionPanel>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    </TableContainer>
  );

};

export default ViewGroups;