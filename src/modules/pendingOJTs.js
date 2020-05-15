import React from 'react';
import { UserContext } from '../App';
import { makeStyles, Snackbar } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { nullChecker } from '../utils/commonUtils';
import { Form, Table, Button, Container, FormControl, DropdownButton, Dropdown, Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import '../App.css';
import '../assets/styles/bootstrap.min.css';
import {PageLoaderComponent, BackDropComponent} from '../components/pageLoaderComponent';
import { MdMoreVert } from 'react-icons/md';
import { IoMdSettings } from 'react-icons/io';
import * as moment from 'moment';

const initialPageState = {
  name: null,
  active: false,
  nor: 10,
  page: 0,
  currentPage: 0
};


const useStyles = makeStyles(theme => ({
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

function createData(active, assigned_to, group_id, images, no_of_attempts, ojt_name, questions, record_id, status, assigned_date, due_date, q_type, group_name, assigned_to_name) {
  return { active, assigned_to, group_id, images, no_of_attempts, ojt_name, questions, record_id, status, assigned_date, due_date, q_type, group_name, assigned_to_name };
}


export const PendingOJTs = props => {
  const classes = useStyles();
  const [pendingOJTrows, setOJTs] = React.useState([]);
  const [totalOJTsCount, setTotalCount] = React.useState([]);
  const [ojtName, setOjtName] = React.useState([]);
  const [assignedTo, setAssignedTo] = React.useState([]);
  const [dueDate, setDueDate] = React.useState(new Date());
  const [assigned_ojts_full, setAssignedOJTs] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const { state } = React.useContext(UserContext);
  const [openSnackbar, setSnackbar] = React.useState(false);
  const [maskingText, setMaskingText] = React.useState('');
  const [backdropFlag, setBackdrpFlag] = React.useState(false);
  const [ loading, setLoading ] = React.useState(true);
  const [ paginationState, setPaginationState ] = React.useState(initialPageState);
  const db = firebase.firestore();

  const handleClose = _ => {
    setOpen(false);
  }


  const handleStatusSwitch = async (val, row) => {
    const toggleStatus = !val;
    const record_id = row.record_id;
    // const res1 = await record_id.get();
    // const recId = res1.data() ? res1.data().record_id : null
    db.collection('assigned_ojts').doc(record_id)
      .update({
        active: toggleStatus
      }).then((res) => {
        console.log("Save successs")
        setSnackbar(true);
        getAllPendingOJTs();
      }).catch(error => {
        console.log(error);
        alert('Update status Failed');
      })
  };

  const handlePageClick = data => {
    let selected = data.selected;
    paginationState.currentPage = selected;
    let initialState = paginationState;
    setPaginationState(paginationState);
    let slicedList = [];
    slicedList = assigned_ojts_full.slice((initialState.currentPage * initialState.nor), ((initialState.currentPage * initialState.nor) + initialState.nor));
    setOJTs(slicedList);
    console.log("Load new pages")

    // getAssignedOJTsCount();
  };

  const getAssignedOJTsCount = async _ => {
    firebase.functions()
      .httpsCallable('getCollectionQueryTotalCount')({ "collection": "assigned_ojts", "isActiveRequired": false })
      .then(response => {
        console.log("Response received!")
        let toc = (response != null ? response.data.total : 0);
        setTotalCount(toc);
        getAllPendingOJTs();
      }, error => {
        console.log(error);
        alert('Error fetching count');
      });
  };

  const filterOJTsWithFields = async _ => {
    let tempList1 = [];
    let tempList2 = [];
    let tempList3 = [];
    
    if(assigned_ojts_full != null && assigned_ojts_full.length > 0){
      if(ojtName != null && ojtName.trim() != ""){
        tempList1 = await assigned_ojts_full.filter(rec => {
          if(rec['ojt_name'].toLowerCase().includes(ojtName.toLowerCase())){
            return rec;
          }
        });
      }
      else{
        tempList1 = assigned_ojts_full;
      }

      if(assignedTo != null && assignedTo.trim() != ""){
        tempList2 = await tempList1.filter(rec => {
          if(rec['assigned_to_name'].toLowerCase().includes(assignedTo.toLowerCase())){
            return rec;
          }
        })
      }
      else{
        tempList2 = tempList1;
      }

      if(dueDate != null && dueDate != ""){
        tempList3 = await tempList2.filter(rec => {
          let d1 = new Date(rec['due_date']);
          let d2 = new Date(dueDate);
          d1.setHours(0,0,0,0);
          d2.setHours(0,0,0,0);
          if(moment(d2).diff(d1, 'days') >= 0){
            return rec;
          }
        })
      }
      else{
        tempList3 = tempList2;
      }

      setTotalCount(tempList3.length);
      
      tempList3 = tempList3.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
      
      setOJTs(tempList3);
    }
    else{
      console.log("No results to return");
    }
    
  }

  const clearFilters = async _ => {
    setOjtName("");
    setAssignedTo("");
    setDueDate(new Date());
    setTotalCount(assigned_ojts_full.length);
    let tempList = assigned_ojts_full.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
    setOJTs(tempList);
  }

  const getAllPendingOJTs = async _ => {
    setLoading(true);
    var ref = state.tokenId;
    db.collection('assigned_ojts')
      // .where('active', "==", true)
      .where('status', "==", 'assigned')
      .orderBy('group_id', 'asc')
      // .limit(initialState.nor)
      .onSnapshot(snapshot => {
        const assigned_ojts = snapshot.docs;
        const tempList = [];
        var i = 0;
        if (assigned_ojts != null && assigned_ojts.length > 0) {
          setTotalCount(assigned_ojts.length);
          assigned_ojts.forEach(async (user) => {
            const docData = user.data();
            const ref1 = docData.assigned_to
            const ref2 = docData.group_id
            const res1 = await ref1.get();
            const res2 = await ref2.get();
            docData.assigned_to_name = (res1.data() != null ? res1.data().name : "");
            docData.group_name = (res2.data() != null ? res2.data().name : "");
            tempList.push(createData(docData.active, docData.assigned_to, docData.group_id, docData.images, docData.no_of_attempts, docData.ojt_name, docData.questions, docData.record_id, docData.status, docData.assigned_date, docData.due_date, docData.q_type, docData.group_name, docData.assigned_to_name));
            i++;
            if (i === assigned_ojts.length) {
              let initialState = paginationState;
              let slicedList = tempList.slice((initialState.currentPage * initialState.nor), ((initialState.currentPage * initialState.nor) + initialState.nor));
              setAssignedOJTs(tempList);
              setOJTs(slicedList);
              setLoading(false);
            }
          });
        }
        else {
          setOJTs(tempList);
          setLoading(false);
        }
      }, error => {
        console.log(error);
        alert('Error Fetching OJTs');
      });

  };


  React.useEffect(_ => {
    // getAssignedOJTsCount();
    paginationState.currentPage = 0;
    initialPageState.currentPage = 0;
    setOjtName("");
    setAssignedTo("");
    getAllPendingOJTs();
  }, []);

  return (
    <div>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <div className={classes.snackbarStyle} > OJT updated successfully! </div>
      </Snackbar>
      <BackDropComponent maskingText={maskingText} showBackdrop={backdropFlag} />

      <div style={{ marginBottom: '1.0vh', marginRight: '10.0vh', marginTop: '1.0vh', display: 'flex', flexDirection: 'row-reverse' }} >
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
                    <Form.Label>OJT Name</Form.Label>
                    <Form.Control type="text" placeholder="Enter OJT Name" onChange={(val) => setOjtName(val.target.value)}/>
                  </Form.Group>

                  <Form.Group controlId="formBasicAssignedTo">
                    <Form.Label>Assigned To</Form.Label>
                    <Form.Control type="text" placeholder="Enter Assigned To" onChange={(val) => setAssignedTo(val.target.value)}/>
                  </Form.Group>

                  <Form.Group controlId="formBasicDueDate">
                    <Form.Label>Due Date (before)</Form.Label>
                    <FormControl
                      value={nullChecker(dueDate) ? dueDate.toISOString().substr(0, 10) : ''}
                      type={'date'}
                      placeholder={'Due Date'}
                      onChange={(val) => { setDueDate(val.target.valueAsDate) }}
                    />
                  </Form.Group>

                  <Button variant='success' onClick={() => filterOJTsWithFields()}>
                    Submit
                  </Button>
                  <Button variant='light' onClick={() => clearFilters()}>
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
        

      {
        loading === true ? 
        <PageLoaderComponent maskingText={'Fetching Pending OJTs...'} /> 
        :
         <span>
           {
        pendingOJTrows.length === 0 ?
        <Container style={{ textAlign: 'center', marginTop: '10vh' }}>
                  <div> No Records to Show </div>
        </Container>
        :
          <div id="pending-ojts-div">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>OJT Name</th>
                  <th>Assigned To</th>
                  <th>Group</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th>Due Date</th>
                  <th>No Of Questions</th>
                  <th>
                    <IoMdSettings />
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  pendingOJTrows.map((row, index) => (
                    <tr>
                      <td> {(paginationState.currentPage * paginationState.nor) + (index + 1)} </td>
                      <td>{row.ojt_name}</td>
                      <td>{row.assigned_to_name != null ? row.assigned_to_name : ""}</td>
                      <td>{row.group_name != null ? row.group_name : ""}</td>
                      <td>
                        <Badge variant={row.active === true ? 'info' : 'warning'}>
                      {row.active === true ? 'Active' : 'Inactive'}</Badge> &nbsp;
                      { row.active === true ? 
                      <Badge variant={new Date().getTime() < new Date(row.due_date).getTime() ? 'info' : 'danger'}>
                      {new Date().getTime() < new Date(row.due_date).getTime() ? 'Pending' : 'Past Due Date'}
                      </Badge>
                      : null}
                      </td>
                      <td>
                        {row.assigned_date ? new Date(row.assigned_date).toLocaleDateString() : null}
                      </td>
                      <td>
                        {row.due_date ? new Date(row.due_date).toLocaleDateString() : null}
                      </td>
                      <td>
                        {row.questions != null ? row.questions.length : 0}
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
                        handleStatusSwitch(row.active,row)}}
                      >
                        {row.active === true ? 'Revoke OJT' : 'Assign OJT'}
                        </Dropdown.Item>
                    </DropdownButton>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
            <div style={{ marginTop: '0.5vh', display: 'flex', flexDirection: 'row-reverse', width: '100%' }} >
              <ReactPaginate
                previousLabel={'<<'}
                nextLabel={'>>'}
                breakLabel={'...'}
                pageCount={Math.ceil(totalOJTsCount / paginationState.nor)}
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
    </div>
  );

};

export default PendingOJTs;