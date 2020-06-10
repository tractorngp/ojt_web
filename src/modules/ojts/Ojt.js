import React from 'react';
import {ViewOjt} from './viewOjt';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { UserContext } from '../../App';
import { nullChecker, stringIsEmpty } from '../../utils/commonUtils';
import { makeStyles, Snackbar } from '@material-ui/core';
import {  Row, Col, Form, Table, Button, Container, FormControl, DropdownButton, Dropdown, Badge, OverlayTrigger, Popover, Alert } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import '../../assets/styles/bootstrap.min.css';
import { PageLoaderComponent, BackDropComponent } from '../../components/pageLoaderComponent';
import { IoMdSettings, IoMdCheckmark } from 'react-icons/io';
import { MdMoreVert } from 'react-icons/md';
import * as moment from 'moment';
import { useForm } from 'react-hook-form';

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


const MainOjtPage = props => {
    const classes = useStyles();
    const [totalOJTsCount, setTotalCount] = React.useState([]);
    const [ojtName, setOjtName] = React.useState([]);
    const [assignedTo, setAssignedTo] = React.useState([]);
    const [dueDate, setDueDate] = React.useState(new Date());
    const [ojtList, setOJTsList] = React.useState([]);
    const [filteredOJTsList, setFilteredOJTsList] = React.useState([]);
    const [all_ojts_full, setAssignedOJTs] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const { state } = React.useContext(UserContext);
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [maskingText, setMaskingText] = React.useState('');
    const [backdropFlag, setBackdrpFlag] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [paginationState, setPaginationState] = React.useState(initialPageState);
    const db = firebase.firestore();
    const { handleSubmit, register, errors } = useForm();

    const [filterStatus, setStatusFilter] = React.useState("");
    const [filterActivity, setActivityFilter] = React.useState("");


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
                getAllOJTs();
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
        slicedList = ojtList.slice((initialState.currentPage * initialState.nor), ((initialState.currentPage * initialState.nor) + initialState.nor));
        setFilteredOJTsList(slicedList);
        console.log("Load new pages")

        // getAssignedOJTsCount();
    };

    const filterOJTsWithFields = async _ => {
        let tempList1 = [];
        let tempList2 = [];
        let tempList3 = [];
        let tempList4 = [];
        let tempList5 = [];
        if (ojtList != null && ojtList.length > 0) {
            if (ojtName != null && ojtName.trim() !== "") {
                tempList1 = ojtList.filter(rec => {
                    if (rec['ojt_name'].toLowerCase().includes(ojtName.toLowerCase())) {
                        return rec;
                    }
                });
            }
            else {
                tempList1 = all_ojts_full;
            }

            if (assignedTo != null && assignedTo.trim() !== "") {
                tempList2 = tempList1.filter(rec => {
                    if (rec['assigned_to_name'].toLowerCase().includes(assignedTo.toLowerCase())) {
                        return rec;
                    }
                })
            }
            else {
                tempList2 = tempList1;
            }

            if (dueDate != null && dueDate !== "") {
                tempList3 = tempList2.filter(rec => {
                    let d1 = new Date(rec['due_date']);
                    let d2 = new Date(dueDate);
                    d1.setHours(0, 0, 0, 0);
                    d2.setHours(0, 0, 0, 0);
                    if (moment(d2).diff(d1, 'days') >= 0) {
                        return rec;
                    }
                })
            }
            else {
                tempList3 = tempList2;
            }

            if(filterStatus != null && filterStatus.trim() !== "" && filterStatus.trim() !== 'none'){
                tempList4 = tempList3.filter(rec => {
                    if(filterStatus == "Active")
                    return rec.active
                    else
                    return !rec.active
                })
            }
            else{
                tempList4 = tempList3
            }

            if(filterActivity != null && filterActivity.trim() !== "" && filterActivity.trim() !== "none"){
                tempList5 = tempList4.filter(rec => {
                    if(filterActivity == "Completed"){
                        return (rec.status == "completed")
                    }
                    else if(filterActivity == "Past Due Date"){
                        let rec_date = new Date(rec.due_date)
                        rec_date.setHours(0)
                        rec_date.setMinutes(0)
                        rec_date.setSeconds(0)
                        let current_date = new Date()
                        current_date.setHours(0)
                        current_date.setMinutes(0)
                        current_date.setSeconds(0)
                        return (moment(rec_date).diff(current_date, 'days') < 0)
                    }
                    else if(filterActivity == "Pending"){
                        return (rec.status == "assigned")
                    }
                })
            }
            else{
                tempList5 = tempList4
            }

            setTotalCount(tempList5.length);
            setOJTsList(all_ojts_full)

            tempList5 = tempList5.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));

            setFilteredOJTsList(tempList5)
            
        }
        else {
            console.log("No results to return");
        }

    }

    const clearFilters = async _ => {
        setOjtName("");
        setAssignedTo("");
        paginationState.currentPage = 0;
        setDueDate(new Date());
        let tempList = all_ojts_full.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
        setFilteredOJTsList(tempList);
        setOJTsList(all_ojts_full);
        setTotalCount(nullChecker(all_ojts_full) ? all_ojts_full.length : 0);
    }

    const getAllOJTs = async _ => {
        setLoading(true);
        db.collection('assigned_ojts')
            .orderBy('group_id', 'asc')
            // .limit(initialState.nor)
            .onSnapshot(snapshot => {
                const all_ojts = snapshot.docs;
                const tempList = [];
                var i = 0;
                if (all_ojts != null && all_ojts.length > 0) {
                    setTotalCount(all_ojts.length);
                    all_ojts.forEach(async (user) => {
                        const docData = user.data();
                        const ref1 = docData.assigned_to
                        const ref2 = docData.group_id
                        const res1 = await ref1.get();
                        const res2 = await ref2.get();
                        docData.assigned_to_name = (res1.data() != null ? res1.data().name : "");
                        docData.group_name = (res2.data() != null ? res2.data().name : "");
                        tempList.push(createData(docData.active, docData.assigned_to, docData.group_id, docData.images, docData.no_of_attempts, docData.ojt_name, docData.questions, docData.record_id, docData.status, docData.assigned_date, docData.due_date, docData.q_type, docData.group_name, docData.assigned_to_name));
                        i++;
                        if (i === all_ojts.length) {
                            let initialState = paginationState;
                            let slicedList = tempList.slice((initialState.currentPage * initialState.nor), ((initialState.currentPage * initialState.nor) + initialState.nor));
                            setAssignedOJTs(tempList);
                            setOJTsList(tempList);
                            setFilteredOJTsList(slicedList);
                            setLoading(false);
                        }
                    });
                }
                else {
                    setFilteredOJTsList(tempList);
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
        getAllOJTs();
    }, []);

    return (
        loading === true ?
            <PageLoaderComponent maskingText={'Fetching All OJTs...'} />
            : <Container fluid>
                <Row>
                    <Col md={8}>
                        <div>
                            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
                                <Alert variant={'success'} onClose={() => setSnackbar(false)} dismissible>
                                    OJT Updated Successfully!
                                </Alert>
                            </Snackbar>
                            <BackDropComponent maskingText={maskingText} showBackdrop={backdropFlag} />

                            <div style={{ marginBottom: '1.0vh', marginRight: '0.0vh', marginTop: '1.0vh' }} >
                                <Row>
                                    <Col md={10} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', fontSize: '1.24rem', fontWeight: 'bold' }}>
                                        <b style={{ color: '#d9534f' }}>Assigned OJTs</b>
                                    </Col>
                                    <Col md={2} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <OverlayTrigger
                                            trigger="click"
                                            key={'bottom'}
                                            rootClose
                                            placement={'bottom'}
                                            overlay={
                                                <Popover id={`popover-positioned-${'bottom'}`}>
                                                    <Popover.Title as="h3">{'Filter By:'}</Popover.Title>
                                                    <Popover.Content style={{width: '100%'}}>
                                                        <Form>
                                                            <Row>
                                                                <Col>
                                                                    <Form.Group controlId="formBasicOJTName">
                                                                        <Form.Label>OJT Name</Form.Label>
                                                                        <Form.Control type="text" value={ojtName} placeholder="Enter OJT Name" onChange={(val) => setOjtName(val.target.value)} />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col>
                                                                    <Form.Group controlId="formBasicAssignedTo">
                                                                        <Form.Label>Assigned To</Form.Label>
                                                                        <Form.Control type="text" value={assignedTo} placeholder="Enter Assigned To" onChange={(val) => setAssignedTo(val.target.value)} />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Row>
                                                                <Col md={6}>
                                                                    <Form.Group controlId="formBasicDueDate">
                                                                        <Form.Label>Due Date (before)</Form.Label>
                                                                        <FormControl
                                                                            value={nullChecker(dueDate) ? dueDate.toISOString().substr(0, 10) : ''}
                                                                            type={'date'}
                                                                            placeholder={'Due Date'}
                                                                            onChange={(val) => { setDueDate(val.target.valueAsDate) }}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={6}>
                                                                    <Form.Group controlId="formBasicStatus">
                                                                        <Form.Label>Status</Form.Label>
                                                                        <Form.Control as="select" value={filterStatus} placeholder="Select Status" onChange={(val) => setStatusFilter(val.target.value)} >
                                                                            <option value={'none'}>Select a Status</option>
                                                                            <option value='Active' > Active </option>
                                                                            <option value='Inactive' >Inactive</option>
                                                                        </Form.Control>
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                        
                                                            <Row>
                                                                <Col md={6}>
                                                                    <Form.Group controlId="formBasicActivity">
                                                                        <Form.Label>Activity</Form.Label>
                                                                        <Form.Control as="select" value={filterActivity} placeholder="Select activity" onChange={(val) => setActivityFilter(val.target.value)} >
                                                                            <option value={'none'}>Select activity</option>
                                                                            <option value={'Past Due Date'}> Past Due Date </option>
                                                                            <option value={'Pending'}> Pending </option>
                                                                            <option value={'Completed'}> Completed </option>
                                                                        </Form.Control>
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>

                                                            <Button variant='success'
                                                                onClick={() => filterOJTsWithFields()}>
                                                                Submit
                                    </Button>       &nbsp;
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
                                    </Col>
                                </Row>


                            </div>


                            {
                                <span>
                                    {
                                        filteredOJTsList.length === 0 ?
                                            <Container style={{ textAlign: 'center', marginTop: '10vh' }}>
                                                <div> No Records to Show </div>
                                            </Container>
                                            :
                                            <div id="pending-ojts-div">
                                                <Table bordered hover size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>OJT Name</th>
                                                            <th>Assigned To</th>
                                                            <th>Group</th>
                                                            <th>Status</th>
                                                            <th>Activity</th>
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
                                                            filteredOJTsList.map((row, index) => (
                                                                <tr key={index}>
                                                                    <td> {(paginationState.currentPage * paginationState.nor) + (index + 1)} </td>
                                                                    <td>{row.ojt_name}</td>
                                                                    <td>{row.assigned_to_name != null ? row.assigned_to_name : ""}</td>
                                                                    <td>{row.group_name != null ? row.group_name : ""}</td>
                                                                    <td>
                                                                        <Badge variant={row.active === true ? 'info' : 'warning'}>
                                                                            {row.active === true ? 'Active' : 'Inactive'}</Badge>
                                                                    </td>
                                                                    <td>
                                                                        {row.status === "completed" ?
                                                                            <Badge variant={new Date().getTime() < new Date(row.due_date).getTime() ? 'info' : 'success'}>
                                                                                {'Completed'}
                                                                            </Badge>
                                                                            : row.active === true ?
                                                                                <Badge variant={new Date().getTime() < new Date(row.due_date).getTime() ? 'info' : 'danger'}>
                                                                                    {new Date().getTime() < new Date(row.due_date).getTime() ? 'Pending' : 'Past Due Date'}
                                                                                </Badge>
                                                                                : 'N/A'}
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
                                                                        {row.status === "completed" ? <IoMdCheckmark size={25} /> : <DropdownButton variant={'link'}
                                                                            title={
                                                                                <div style={{ display: 'inline-block', textDecoration: 'none' }}>
                                                                                    <MdMoreVert size={25} style={{ color: 'black' }} />
                                                                                </div>
                                                                            }
                                                                            id="basic-nav-dropdown"
                                                                        >
                                                                            <Dropdown.Item
                                                                                onClick={() => {
                                                                                    handleStatusSwitch(row.active, row)
                                                                                }}
                                                                            >
                                                                                {row.active === true ? 'Revoke OJT' : 'Assign OJT'}
                                                                            </Dropdown.Item>
                                                                        </DropdownButton>
                                                                        }
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
                        {/* <CreateOjt /> */}
                    </Col>
                    <Col md={4}>
                        <ViewOjt />
                    </Col>
                </Row>
            </Container>
    );

};


export default MainOjtPage;
