import React from 'react';
import { Container, ListGroup, Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { CircularProgress, Tooltip, makeStyles, Snackbar } from '@material-ui/core';
import { IoMdInformationCircleOutline, IoMdPeople, IoMdAdd } from 'react-icons/io';
import AssignOJT from './assignOjt';
import { BackDropComponent } from '../../components/pageLoaderComponent';

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
    }
}));

const ViewOjt = props => {
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

    const fetchOjts = _ => {
        db.collection(OJT_TEMPLATES).onSnapshot(templatesSnapshot => {
            let tempList = templatesSnapshot.docs.map(doc => doc.data());
            setOjtTemplates(tempList);
        }, error => {
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

    React.useEffect(_ => {
        fetchOjts();
    }, []);

    return (
        <Container className={classes.viewOjtContainer} fluid>
            <BackDropComponent maskingText={maskingText} showBackdrop={showBackdrop} />
            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
                <div className={classes.snackbarStyle} > {snackBarText} </div>
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
            
                <div style={{ display:'flex', flexDirection: 'row-reverse', width:'100%', marginTop:'1.0vh', marginBottom: '1.0vh' }}><Button variant="danger" style={{width:'10%'}}><IoMdAdd size={25} /></Button></div>
               { 
                ojtTemplates.length > 0 ?
                <ListGroup>
                        <ListGroup.Item style={{fontSize:'1.2rem', fontWeight: '700', color: '#d9534f', background:'#eeeeee'}}> ALL OJTs </ListGroup.Item>
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
                                                <Button variant={'light'}>
                                                    <IoMdInformationCircleOutline />
                                                </Button>
                                            </Tooltip>
                                    &nbsp;
                                    <Button
                                                onClick={() => handleOpen(templateItem.record_id)}
                                                variant={'outline-info'} > <IoMdPeople /> Assign</Button>


                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            ))}
                    </ListGroup>
                 : <div id="loading-box">
                        <span> <CircularProgress size={20} /> <p> Fetching OJTs... </p> </span>
                    </div>
            }
        </Container>
    );

};

export default ViewOjt;