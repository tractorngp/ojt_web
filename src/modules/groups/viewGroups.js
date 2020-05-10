import React from 'react';
import { TableContainer, Paper, makeStyles, Switch, Chip, Tooltip, Snackbar, Backdrop, CircularProgress, MenuItem } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { IoMdCreate, IoMdMenu, IoIosMenu, IoMdOptions, IoMdSettings } from 'react-icons/io';
import { Modal, ListGroup, Row, Col, Badge, Button, Table, DropdownButton, Dropdown, NavDropdown } from 'react-bootstrap';
import CreateGroup from './createGroup';
import { GroupContext } from './groups';
import { nullChecker, listEmptyChecker } from './../../utils/commonUtils';
import { MdMoreVert } from 'react-icons/md';
import './../../App.css';
import {PageLoaderComponent} from '../../components/pageLoaderComponent';

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
  backdrop: {
    zIndex: theme.zIndex.drawer + 100,
    color: '#fff',
  },
  snackbarStyle: {
    padding: '20px',
    color: 'white',
    background: '#4caf50'
  },
  lastTableData: {
    width: '3% !important',
  }
}));

const ViewGroups = props => {
  const classes = useStyles();
  const db = firebase.firestore();
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const { groupState, groupDispatch, selectedTokenState, selectedTokenDispatch } = React.useContext(GroupContext);
  const [currentEditingGroup, setCurrentEditGroup] = React.useState(null);
  const [openSnackbar, setSnackbar] = React.useState(false);
  const [maskingText, setMaskingText] = React.useState('');
  const [backdropFlag, setBackdrpFlag] = React.useState(false);

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
        console.error(error);
      });
  };

  const toggleGroupStatus = (val, group_id) => {
    const toggleStatus = val;
    console.log(val);
    //const toggleStatus = val.target.checked;
    db.collection('groups').doc('' + group_id).update({
      active: !toggleStatus
    })
  };

  const handleClose = _ => {
    setOpen(false);
  }

  const getUsersByRefs = async refs => {
    return Promise.all(refs.map(async ref => {
      // await(await ..) -- for firestore method
      // to .get() data and then .data()
      return await (await ref.get().catch(error => {
        alert('Database Error');
        console.error(error);
      })).data();
    }));
  };

  const editGroup = val => {
    console.log(val);
    const edit_group_id = val.group_id;
    const edit_group_members = val.group_members;
    const edit_name = val.name;
    const activeStatus = val.active;
    let editGroupData = {
      name: edit_name,
      group_id: edit_group_id,
      selectedIds: null
    };
    if (nullChecker(edit_group_id) &&
      nullChecker(edit_name) && listEmptyChecker(edit_group_members)) {
      setMaskingText('Fetching Group Info...');
      setBackdrpFlag(true);
      getUsersByRefs(edit_group_members).then(usersList => {
        groupDispatch({
          type: 'ALL', name: edit_name,
          group_id: edit_group_id,
          active: activeStatus, group_members: edit_group_members
        });
        const selectedIds = usersList.map(x => x.tokenId);
        selectedTokenDispatch({
          type: 'ALL', selectedTokenIds: selectedIds
        });
        editGroupData.selectedIds = selectedIds;
        setCurrentEditGroup(editGroupData);
        setBackdrpFlag(false);
        setMaskingText('');
        setOpen(true);
      }).catch(error => {
        setBackdrpFlag(false);
        setMaskingText('');
        console.error(error);
      });
    } else {
      alert('Error Fetching Group Data');
      console.error(val);
    }
  }

  const saveGroup = _ => {
    setMaskingText('Updating Group...');
    setBackdrpFlag(true);
    let gMembers = [];
    selectedTokenState.selectedTokenIds.forEach(gm => {
      gMembers.push(db.collection('users').doc(String(gm)));
    })
    const groupData = {
      group_id: groupState.group_id,
      group_members: gMembers,
      name: groupState.name,
      active: groupState.active,
      modifiedDate: new Date().toISOString()
    };
    // TODO - check if group_id is already taken
    db.collection('groups').doc(String(groupData.group_id))
      .update(groupData).then(_ => {
        setBackdrpFlag(false); setMaskingText('');
        setOpen(false); groupDispatch({ type: 'CLEAR' });
        setSnackbar(true);
      }).catch(error => {
        setBackdrpFlag(false); setMaskingText('');
        setOpen(false); alert('Error Uploading Group');
        console.error(error);
      });
  };

  React.useEffect(_ => {
    fetchAllGroups();
  }, []);

  return (
    <div>
      <Backdrop className={classes.backdrop} open={backdropFlag}>
        <CircularProgress style={{ 'color': 'white' }} size={20} />
                  &nbsp;<p style={{ color: 'white' }}>{maskingText}</p>
      </Backdrop>
      <TableContainer component={'span'}>
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
          <div className={classes.snackbarStyle} > Group Updated Successfully! </div>
        </Snackbar>
        <Modal size={'xl'} show={open} onHide={handleClose} animation={false}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <CreateGroup name={currentEditingGroup !== null ? currentEditingGroup.name : null}
              selectedTokenIds={currentEditingGroup !== null ? currentEditingGroup.selectedIds : null}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant={'light'} onClick={handleClose}>
              Cancel
            </Button> &nbsp;
            <Button variant={'success'}
              disabled={!(nullChecker(groupState.name) && groupState.name.length > 0
                && listEmptyChecker(selectedTokenState.selectedTokenIds))}
              onClick={saveGroup}
            >Submit</Button>
          </Modal.Footer>
        </Modal>
        {groups.length === 0 ? 
        <PageLoaderComponent maskingText={'Fetching Groups...'} />
        :
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Members</th>
                <th>Status</th>
                <th>Last Modified</th>
                <th>
                  <IoMdSettings size={18} />
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((row, index) => (
                <tr key={index}>
                  <td>{index+1}</td>
                  <td>{row.name}</td>
                  <td> {row.group_members.length} </td>
                  <td>
                    <Badge variant={row.active === true ? 'info' : 'warning'}>
                      {row.active === true ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td>
                    {nullChecker(row.modifiedDate) ?
                      new Date(row.modifiedDate).toLocaleDateString() + '-' + new Date(row.modifiedDate).toLocaleTimeString()
                      : 
                      new Date(row.createdDate).toLocaleDateString() + '-' + new Date(row.createdDate).toLocaleTimeString()} 
                  </td>
                  <td className={classes.lastTableData}>
                    <DropdownButton variant={'link'}
                      title={
                        <div style={{ display: 'inline-block', textDecoration: 'none' }}>
                        <MdMoreVert size={25} style={{color:'black'}} />
                        </div>
                      }
                      id="basic-nav-dropdown"
                    >
                      <Dropdown.Item
                      onClick={()=>{
                        console.log('hi');
                        toggleGroupStatus(row.active,row.group_id)}}
                      >Toggle Status</Dropdown.Item>
                      <Dropdown.Item onClick={()=>editGroup(row)}>Edit Group</Dropdown.Item>
                    </DropdownButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        }
      </TableContainer>
    </div>
  );

};

export default ViewGroups;