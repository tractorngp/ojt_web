import React from 'react';
import { UserContext } from '../App';
import { Button, Paper, TableContainer, makeStyles, CircularProgress, Switch, Modal, Typography, Card, CardContent, Snackbar, Backdrop, Tooltip } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { nullChecker, listEmptyChecker } from '../utils/commonUtils';
import { ListGroup, Row, Col, FormGroup, Form } from 'react-bootstrap';

const initialState = {
    name:null,
    active: false
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
    }
}));

export const GroupContext = React.createContext();

function createData(active, assigned_to, group_id, images, no_of_attempts, ojt_name, questions, record_id, status, assigned_date, due_date, q_type) {
    return { active, assigned_to, group_id, images, no_of_attempts, ojt_name, questions, record_id, status, assigned_date, due_date, q_type };
  }


export const PendingOJTs = props => {
    const classes = useStyles();
    const [pendingOJTrows, setOJTs] = React.useState([]);
    const [open, setOpen] = React.useState(false);
    const { state } = React.useContext(UserContext);
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [maskingText, setMaskingText] = React.useState('');
    const [backdropFlag, setBackdrpFlag] = React.useState(false);
    const db = firebase.firestore();

    const handleClose = _ => {
        setOpen(false);
    }


    const handleStatusSwitch = (val, row) => {
        const toggleStatus = val.target.checked;
        const record_id = row.record_id;
        db.collection('assigned_ojts').doc(String(record_id))
          .update({
            active: toggleStatus
          })
      };

    const getAllPendingOJTs = async _ => {
        // console.log('hey');
        // const allList = await db.collection('users').get();
        // const size = allList.docs;
        // console.log(size);
        // setMaxSize(size);
        const userRef = db.collection('users').doc('1111');
        db.collection('assigned_ojts')
            .where('active', "==", true)
            .where('assigned_to', "==", userRef)
            .where('status', "==", 'assigned')
            .orderBy('record_id','asc')
            //  .startAt(currentPage * PAGINATION_SIZE)
            //  .limit(PAGINATION_SIZE)
            .onSnapshot(snapshot => {
            const assigned_ojts = snapshot.docs;
            const tempList = [];
            assigned_ojts.forEach(user => {
                const docData = user.data();
                tempList.push(createData(docData.active, docData.assigned_to, docData.group_id, docData.images, docData.no_of_attempts, docData.ojt_name, docData.questions, docData.record_id, docData.status, docData.assigned_date, docData.due_date, docData.q_type));
            });
            setOJTs(tempList);
            }, error => {
            console.log(error);
            alert('Error Fetching Users');
        })
    };


    React.useEffect(_ => {
        getAllPendingOJTs();
      }, []);

    return (
        <div>
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
          <div className={classes.snackbarStyle} > Pending OJTs fetched successfully! </div>
        </Snackbar>
        <Backdrop className={classes.backdrop} open={backdropFlag}>
          <CircularProgress style={{ 'color': 'white' }} size={25} />
                      &nbsp;<p style={{ color: 'white' }}>{maskingText}</p>
        </Backdrop>
        <br /><br />
        {
          pendingOJTrows.length !== 0 ?
            <div id="pending-ojts-div">
              <TableContainer component={Paper}>
                <ListGroup style={{textAlign:'left'}}>
                  <ListGroup.Item active>
                    <Row>
                      <Col xs={1} md={1} lg={1} xl={1} >
                        OJT name
                            </Col>
                      <Col xs={1} md={1} lg={1} xl={1} >
                        Assigned to
                      {/* <Form.Control type="text" placeholder="Name..." type={'search'} /> */}
                            </Col>
                      <Col xs={1} md={1} lg={1} xl={1} >
                        Group
                            </Col>
                      <Col xs={1} md={1} lg={1} xl={1} >
                        Status
                            </Col>
                      <Col xs={2} md={2} lg={2} xl={2} >
                        Assigned Date
                            </Col>
                      <Col xs={2} md={2} lg={2} xl={2} >
                        Due Date
                            </Col>
                       <Col xs={1} md={1} lg={1} xl={1} >
                        No of Questions
                            </Col>
                    </Row>
                  </ListGroup.Item>
                  {pendingOJTrows.map((row) => (
                    <ListGroup.Item key={row.record_id}>
                      <Row>
                        <Col xs={1} md={1} lg={1} xl={1} >
                          {row.ojt_name}
                        </Col>
                        <Col xs={1} md={1} lg={1} xl={1} >
                          {"Assigned to"}
                        </Col>
                        <Col xs={1} md={1} lg={1} xl={1} >
                          {"Group"}
                        </Col>
                        <Col xs={1} md={1} lg={1} xl={1} >
                          {row.active ? 'Active' : 'Inactive'}
                          <Tooltip title="Toggle Status" aria-label="Toggle Status">
                            <Switch
                              checked={row.active}
                              onChange={(val) => { handleStatusSwitch(val, row) }}
                              color="primary"
                              name="statusSwitch"
                              inputProps={{ 'aria-label': 'primary checkbox' }}
                            />
                          </Tooltip>
                        </Col>
                        <Col xs={2} md={2} lg={2} xl={2} >
                          {row.assigned_date}
                        </Col>
                        <Col xs={2} md={2} lg={2} xl={2} >
                          {row.due_date}
                        </Col>
                        <Col xs={1} md={1} lg={1} xl={1} >
                          {row.questions != null ? row.questions.length : 0}
                        </Col>
                      </Row>
  
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </TableContainer>
            </div>
            :
            <div style={{ marginTop: '10vh' }}>
              <CircularProgress size={30} /> Fetching Pending OJTs...
      </div>
        }
      </div>
    );

};

export default PendingOJTs;