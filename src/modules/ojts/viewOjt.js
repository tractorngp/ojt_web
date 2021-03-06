import React from 'react';
import { Container, ListGroup, Row, Col, Button, Badge, Modal, Alert } from 'react-bootstrap';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { Tooltip, makeStyles, Snackbar } from '@material-ui/core';
import { IoMdInformationCircleOutline, IoMdPeople, IoMdAdd, IoMdDownload, IoMdCodeDownload } from 'react-icons/io';
import AssignOJT from './assignOjt';
import { BackDropComponent } from '../../components/pageLoaderComponent';
import CreateOJTNew from './createOjtNew';
import Spinner from 'react-spinkit';
import * as jsPDF from 'jspdf'
import * as _ from 'lodash';

const OJT_TEMPLATES = 'ojt_templates';
const useStyles = makeStyles(theme => ({
    viewOjtContainer: {
        maxHeight: '80vh',
        height:'100%',
        overflowY: 'auto',
        overflowX: 'hidden'
    },
    snackbarStyle: {
        padding: '20px',
        color: 'white',
        background: '#4caf50'
    },
    ojtModalClass: {
        maxHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '100vh'
    }
}));

const ojtInitialState ={
    fromCreate: true,
    editingOJT: {},
    ojtOpen: false
}

export const OjtContext = React.createContext();

const ojtReducer = (state,action) => {
  switch(action.type){
    case 'ALL':
      return {
          editingOJT: action.editingOJT,
          fromCreate: action.fromCreate,
          ojtOpen: action.ojtOpen
      }
      case 'OPEN_OJT':
        return{
          ...state,
          ojtOpen: action.ojtOpen
        }
      default:
        return state;
  }

};

export const ViewOjt = props => {
    const classes = useStyles();
    const [ojtTemplates, setOjtTemplates] = React.useState([]);
    const db = firebase.firestore();
    const [open, setOpen] = React.useState(false);
    const [assignToGroups, assignToGroupsDispatch] = React.useState([]);
    const [selectedOJT, setSelectedOJT] = React.useState(null);
    const [showBackdrop, setBackdrop] = React.useState(false);
    const [maskingText, setMaskingText] = React.useState('');
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [snackBarText, setsbarText] = React.useState('');
    const [ loading, setLoading ] = React.useState(true);
    const [ ojtState, ojtStateDispatch ] = React.useReducer(ojtReducer,ojtInitialState);

    const fetchOjts = _ => {
        setLoading(true);
        db.collection(OJT_TEMPLATES).onSnapshot(templatesSnapshot => {
            let tempList = templatesSnapshot.docs.map(doc => doc.data());
            setOjtTemplates(tempList);
            setLoading(false);
        }, error => {
            setLoading(false);
            console.error(error);
            alert('Database Error');
        });
    };

    const handleClose = _ => {
        setOpen(false);
        setSelectedOJT(null);
        assignToGroupsDispatch([]);
    };

    const handleOpen = ojt_id => {
        setSelectedOJT(ojt_id);
        setOpen(true);
    };

    const submitAssigning = _ => {
        setMaskingText('Assigning OJT...');
        setBackdrop(true);
        db.collection('ojt_templates').doc(selectedOJT).get().then(val => {
            let ojtsToAssign = [];
            const ojtTemplate = val.data();
            assignToGroups.forEach(group => {
                group.group_members.forEach(gMember => {
                    ojtsToAssign.push({
                        ...ojtTemplate,
                        assigned_date: new Date().toISOString(),
                        group_id: db.collection('groups').doc(group.group_id),
                        assigned_to: gMember,
                        ojt_id: selectedOJT,
                        status: 'assigned'
                    });
                });
            });
            const batch = db.batch();
            ojtsToAssign.forEach(ojtToAssign => {
                batch.set(db.collection('assigned_ojts').doc(), ojtToAssign);
            });
            batch.commit().then(data => {
                setOpen(false);
                setBackdrop(false);
                setsbarText('OJTs Assigned Successfully'); setSnackbar(true);
                setMaskingText('');
                assignToGroupsDispatch([]);
            }).catch(error => {
                alert('Error while assigning OJT');
                console.log(error);
            });
        });
    };

    const openInEditMode = templateItem => {
        ojtStateDispatch({
            type: 'ALL',
            fromCreate: false,
            ojtOpen: true,
            editingOJT: templateItem
        });
    }


    const downloadReport = async templateItem => {
        setLoading(true);
        console.log(JSON.stringify(templateItem))
        let templateItem_id = templateItem.record_id
        db.collection('assigned_ojts')
        .where('ojt_id', "==", templateItem_id)
        .where('active', "==", true)
        .onSnapshot(snapshot => {
            const assigned_ojts = snapshot.docs;
            var names = []
            var i = 0
            const ojt_count = assigned_ojts.length;
            var completedCount = 0;
            if (assigned_ojts != null && assigned_ojts.length > 0) {
                assigned_ojts.forEach(async (doc) => {
                    const docData = doc.data();
                    const user = docData.assigned_to;
                    if(docData.status == "completed"){
                        completedCount++;
                    }
                    const res1 = await user.get();
                    names.push((res1.data() != null ? res1.data().name : ""))
                    i = i + 1;
                    if(i == assigned_ojts.length){
                        names = _.uniq(names)
                        console.log(names)
                        var pdf = new jsPDF() 
                        pdf.setFontSize(20);
                        pdf.setFontStyle('bold');
                        pdf.setTextColor(40);
                        pdf.text("Report for OJT: " + templateItem.ojt_name, 10, 30)
                        pdf.setFontSize(12);
                        pdf.text("Number of people who completed: " + completedCount, 10, 40)
                        pdf.text("Assigned to: ", 10, 50)
                        pdf.setFontStyle('normal');
                        var userCount = 1
                        var y = 50
                        if(names.length == 0){
                            pdf.text("This OJT has not been assigned to anyone yet.", 15, (y + (userCount*10)))
                        }
                        else{
                            names.forEach(name => {
                                pdf.text(userCount + ". " + name, 15, (y + (userCount*10)))
                                userCount++;
                            })
                        }
                        
                        pdf.save(templateItem.ojt_name.toString() + "-report-" + new Date().getTime() + ".pdf")
                    }
                });
                setLoading(false);
                
            }
            else {
                var pdf = new jsPDF() 
                pdf.setFontSize(20);
                pdf.setFontStyle('bold');
                pdf.setTextColor(40);
                pdf.text("Report for OJT: " + templateItem.ojt_name, 10, 30)
                pdf.setFontSize(12);
                pdf.text("Assigned to: ", 10, 50)
                pdf.setFontStyle('normal');
                pdf.text("This OJT has not been assigned to anyone yet.", 15, 60)
                pdf.save(templateItem.ojt_name.toString() + "-report-" + new Date().getTime() + ".pdf")
                setLoading(false);
            }
        }, error => {
            console.log(error);
            alert('Error Fetching OJTs');
        });
        
    }

    const toggleOJTModal = val => {
        ojtStateDispatch({
            type: 'OPEN_OJT',
            ojtOpen: val
        });
    }

    React.useEffect(_ => {
        fetchOjts();
    }, []);

    return (
        <OjtContext.Provider value={{ ojtState, ojtStateDispatch }}>
        <Container className={classes.viewOjtContainer} fluid style={{overflow: 'hidden', height: '100%'}}>
            <BackDropComponent maskingText={maskingText} showBackdrop={showBackdrop} />
            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
            <Alert variant={'success'} onClose={() => setSnackbar(false)} dismissible>
          {snackBarText}
            </Alert>
            </Snackbar>
            <Modal show={open} onHide={handleClose} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Assign To Groups</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AssignOJT assignToGroups={assignToGroups}
                        assignToGroupsDispatch={assignToGroupsDispatch} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant={'light'} onClick={handleClose}>
                        Cancel
            </Button> &nbsp;
            <Button
                        variant={'success'} onClick={submitAssigning}>
                        Submit</Button>
                </Modal.Footer>
            </Modal>

            {/* Create OJT Modal */}
            <Modal size={'lg'} show={ojtState.ojtOpen} onHide={()=>toggleOJTModal(false)} animation={false}>
            <CreateOJTNew ojtState={ojtState}  />
            </Modal>
            
                <div style={{ display:'flex', flexDirection: 'row-reverse', width:'90%', marginTop:'1.0vh', marginBottom: '1.0vh' }}>
                    <Button variant="danger" style={{width:'13%'}} onClick={()=> {
                        ojtStateDispatch({
                            type:'ALL',
                            fromCreate: true,
                            editingOJT: {},
                            ojtOpen: true
                        });
                    }}><IoMdAdd size={25} /></Button></div>
                {
                    loading === true ?
                    <span style={{width: '100%', display:'flex', flexDirection:'row', justifyContent:'center', alignItems:'center'}}> <Spinner name="line-scale-pulse-out-rapid" fadeIn={'none'} color={'#d9534f'} style={{width: '20%'}}>
                    </Spinner> <p> Fetching OJT Templates... </p></span>
                    :
                    <span>
                { 
                    ojtTemplates.length > 0 ?
                    <div style={{ height: '100%'}}>
                        <div style={{fontSize:'1.24rem', fontWeight: '700', color: '#d9534f', background:'#eeeeee', padding:'0.5rem'}}> <b className="list-group-item-heading" > ALL OJT Templates </b> </div>
                        <ListGroup style={{overflow: 'scroll', height: '80%', paddingBottom:'2.0vh', overflowX: 'hidden', overflowY: 'scroll'}}>
                                {
                                    ojtTemplates.map(templateItem => (
                                        <ListGroup.Item key={templateItem.ojt_name}>
                                            <Row>
                                                <Col md={6} xs={6} xl={6} lg={6}>
                                                    <b> {templateItem.ojt_name} &nbsp; <br />
                                                        <Badge variant={'info'}> {'Media: ' + templateItem.images.length}
                                                        </Badge> &nbsp;
                                        <Badge variant={'info'}> {'Questions: ' + templateItem.questions.length}
                                                        </Badge>
                                                    </b>
                                                </Col>
                                                <Col md={6} xs={6} xl={6} lg={6}>
                                                    <Tooltip title="OJT Info">
                                                        <Button variant={'light'} 
                                                        onClick={()=>openInEditMode(templateItem)}
                                                        >
                                                            <IoMdInformationCircleOutline />
                                                        </Button>
                                                    </Tooltip>
                                            &nbsp;
                                            <Button
                                                        onClick={() => handleOpen(templateItem.record_id)}
                                                        variant={'outline-info'} > <IoMdPeople /> Assign</Button>

                                                    <Tooltip title="Download Report">
                                                        <Button variant={'light'} 
                                                        onClick={()=>downloadReport(templateItem)}
                                                        >
                                                            <IoMdDownload />
                                                        </Button>
                                                    </Tooltip>


                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                    ))}
                            </ListGroup>
                        </div>
                 : <div id="no-records-box">
                        <span> No Record to Show </span>
                    </div>
            }
                    </span>
                }
        </Container>
        </OjtContext.Provider>
    );

};