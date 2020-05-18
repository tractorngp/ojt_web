import React from 'react';
import { TableContainer, makeStyles, Snackbar } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { IoMdSettings, IoMdAdd } from 'react-icons/io';
import { Modal, Badge, Button, Table, DropdownButton, Dropdown, NavDropdown, Container, OverlayTrigger, Popover, Form, Alert } from 'react-bootstrap';
import CreateGroup from './createGroup';
import { GroupContext } from './groups';
import { nullChecker, listEmptyChecker, stringIsNotEmpty } from './../../utils/commonUtils';
import { MdMoreVert } from 'react-icons/md';
import './../../App.css';
import { PageLoaderComponent, BackDropComponent } from '../../components/pageLoaderComponent';
import ReactPaginate from 'react-paginate';

const initialPageState = {
  name: null,
  active: false,
  nor: 10,
  page: 0,
  currentPage: 0
};

const useStyles = makeStyles((theme) => ({
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
  const [filteredGroups, setFilteredGroups ] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const { groupState, groupDispatch, selectedTokenState, selectedTokenDispatch } = React.useContext(GroupContext);
  const [currentEditingGroup, setCurrentEditGroup] = React.useState(null);
  const [openSnackbar, setSnackbar] = React.useState(false);
  const [maskingText, setMaskingText] = React.useState('');
  const [backdropFlag, setBackdrpFlag] = React.useState(false);
  const [ paginationState, setPaginationState ] = React.useState(initialPageState);
  const [ visibleGroupRows, setVisibleGroupRows ] = React.useState([]);
  const [totalGroupsCount, setGroupsCount ] = React.useState(0);
  const [ filteringGroupName, setFilteringGroupName ] = React.useState("");

  const fetchAllGroups = _ => {
    setLoading(true);
    db.collection('groups')
      .onSnapshot(groupsSnapshot => {
        const gList = groupsSnapshot.docs.map(snapShot => snapShot.data());
        const slicedList = gList.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
        setGroupsCount(gList.length);
        setGroups(gList);
        setVisibleGroupRows(slicedList);
        setFilteredGroups(gList);
        setLoading(false);
      }, error => {
        setLoading(false);
        alert('DB Error');
        console.error(error);
      });
  };


  const handlePageClick = data => {
    let selected = data.selected;
    paginationState.currentPage = selected;
    let initialState = paginationState;
    setPaginationState(paginationState);
    let slicedList = [];
    slicedList = filteredGroups.slice((initialState.currentPage * initialState.nor), ((initialState.currentPage * initialState.nor) + initialState.nor));
    setVisibleGroupRows(slicedList);
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
      nullChecker(edit_name)) {
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

  const saveGroup = async _ => {
    if(currentEditingGroup === null){
      setMaskingText('Creating Group...');
    }else{
      setMaskingText('Updating Group...');
    }
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
    if(currentEditingGroup === null){
      const new_group_id = await (db.collection('groups').doc()).id;
      groupData.group_id = new_group_id;
      groupData.createdDate = new Date().toISOString();
      groupData.active = true;
      db.collection('groups').doc(String(groupData.group_id))
      .set(groupData).then(_ => {
        setBackdrpFlag(false); setMaskingText('');
        setOpen(false); groupDispatch({ type: 'CLEAR' });
        setSnackbar(true);
      }).catch(error => {
        setBackdrpFlag(false); setMaskingText('');
        setOpen(false); alert('Error Uploading Group');
        console.error(error);
      });
    }else{
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
    }
  };

  const filterGroupsWithFields = _ => {
    if(stringIsNotEmpty(filteringGroupName))
    {
      let filteredList = groups.filter(x => x.name.toLowerCase().includes(filteringGroupName.toLowerCase()));
      setFilteredGroups(filteredList);
    setGroupsCount(filteredList.length);
    filteredList = filteredList.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
    setVisibleGroupRows(filteredList);
    }

  };

  const clearFilters = async _ => {
    setFilteringGroupName("");
    setFilteredGroups(groups);
    setGroupsCount(groups.length);
    let tempList = groups.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
    setVisibleGroupRows(tempList);
  }

  React.useEffect(_ => {
    initialPageState.currentPage = 0;
    fetchAllGroups();
  }, []);

  return (
    <div>
      <BackDropComponent maskingText={maskingText} showBackdrop={backdropFlag} />
      <TableContainer component={'span'}>
        {/* snack bar for info */}
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
        <Alert variant={'success'} onClose={() => setSnackbar(false)} dismissible>
          Group Updated Succesfully!
        </Alert>
        </Snackbar>
        {/*  Edit group modal  */}
        <Modal size={'xl'} show={open} onHide={handleClose} animation={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              { nullChecker(currentEditingGroup) ? 'Edit ' : 'Create ' } Group
              </Modal.Title>
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

        {/* Filtering Options */}
        <div style={{ marginBottom: '0.7rem', marginTop: '0.7rem', display: 'flex', flexDirection: 'row-reverse' }} >
          <Button
          onClick={()=>{
            groupDispatch({ type: 'CLEAR' });
            setCurrentEditGroup(null);
            setOpen(true);
          }}
          variant="danger" style={{marginLeft: '1rem'}}> <IoMdAdd size={20} /> </Button>
          <OverlayTrigger
            trigger="click"
            key={'bottom'}
            rootClose
            placement={'bottom'}
            overlay={
              <Popover id={`popover-positioned-${'bottom'}`}>
                <Popover.Title as="h3">{'Filter By:'}</Popover.Title>
                <Popover.Content>
                <Form>
                  <Form.Group controlId="formBasicOJTName">
                    <Form.Label>Group Name</Form.Label>
                    <Form.Control type="text" value={filteringGroupName} placeholder="Enter Group Name" onChange={(val) => setFilteringGroupName(val.target.value)}/>
                  </Form.Group>

                  <Button 
                  disabled={!(filteringGroupName !== null && filteringGroupName !== undefined && filteringGroupName.length > 0)}
                   variant='success' onClick={()=>filterGroupsWithFields()}>
                    Submit
                  </Button>
                  &nbsp;&nbsp;
                  <Button variant='light' onClick={()=>clearFilters()}>
                    Clear
                  </Button>
                </Form>
                </Popover.Content>
              </Popover>
            }
          >
            <Button variant="secondary">Filters</Button>
          </OverlayTrigger>
        </div>

        {/*  Groups Display  */}
        {
          loading === true ?
            <PageLoaderComponent maskingText={'Fetching Groups...'} />
            :
            <span>
              {visibleGroupRows.length === 0 ?
                <Container style={{ textAlign: 'center', marginTop: '10vh' }}>
                  <div> No Records to Show </div>
                </Container>
                :
                <div>
                <Table bordered hover size="sm">
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
                    {visibleGroupRows.map((row, index) => (
                      <tr key={index}>
                        <td>{ (paginationState.currentPage * paginationState.nor) + (index + 1)}</td>
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
                                <MdMoreVert size={25} style={{ color: 'black' }} />
                              </div>
                            }
                            id="basic-nav-dropdown"
                          >
                            <Dropdown.Item
                              onClick={() => {
                                toggleGroupStatus(row.active, row.group_id)
                              }}
                            >Toggle Status</Dropdown.Item>
                            <Dropdown.Item onClick={() => editGroup(row)}>Edit Group</Dropdown.Item>
                          </DropdownButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div style={{ marginTop: '0.5vh', display: 'flex', flexDirection: 'row-reverse', width: '100%' }} >
                <ReactPaginate
                previousLabel={'<<'}
                nextLabel={'>>'}
                breakLabel={'...'}
                pageCount={Math.ceil(totalGroupsCount / paginationState.nor)}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                breakClassName={'page-item'}
                breakLinkClassName={'page-link'}
                containerClassName={'pagination'}
                pageClassName={'page-item'}
                pageLinkClassName={'page-link'}
                previousClassName={'page-item'}
                previousLinkClassName={'page-link'}
                nextClassName={'page-item'}
                nextLinkClassName={'page-link'}
                activeClassName={'active'}
                forcePage={paginationState.currentPage}
              />
              </div>
              </div>
              }
            </span>
        }
      </TableContainer>
    </div>
  );

};

export default ViewGroups;