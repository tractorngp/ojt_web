import React from 'react';
import { Container, ListGroup, Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { CircularProgress, Tooltip, makeStyles } from '@material-ui/core';
import { IoMdInformationCircleOutline, IoMdPeople } from 'react-icons/io';
import AssignOJT from './assignOjt';

const OJT_TEMPLATES = 'ojt_templates';
const useStyles = makeStyles(theme => ({
    viewOjtContainer: {
        maxHeight: '80vh',
        overflowY: 'auto',
        overflowX: 'hidden'
    }
}));

const ViewOjt = props => {
    const classes = useStyles();
    const [ ojtTemplates, setOjtTemplates ] = React.useState([]);
    const db = firebase.firestore();
    const [ open, setOpen ] = React.useState(false);
    const [ assignToGroups, assignToGroupsDispatch ] = React.useState([]);
    const [ selectedOJT, setSelectedOJT ] = React.useState(null);

    const fetchOjts = _ => {
        db.collection(OJT_TEMPLATES).onSnapshot( templatesSnapshot => {
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
        console.log(selectedOJT);
        console.log(assignToGroups);
        selectedOJT.get().then(val => {
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
                batch.set(db.collection('assigned_ojts').doc(),ojtToAssign);
            });
            batch.commit().then( data => {
                console.log(data);
                alert('OJTs assigned succesfully');
            }).catch(error => {
                
            });
        });
    };

    React.useEffect( _ => {
        fetchOjts();
    }, []);

    return (
        <Container className={classes.viewOjtContainer}>
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
            {
                ojtTemplates.length > 0 ?
                <ListGroup>
                    <ListGroup.Item active> ALl OJTs </ListGroup.Item>
                {
                    ojtTemplates.map(templateItem => (
                        <ListGroup.Item key={templateItem.ojt_name}>
                            <Row>
                                <Col md={6} xs={6} xl={6} lg={6}>
                                <p> {templateItem.ojt_name} &nbsp; <br />
                                <Badge variant={'info'}> {'Media: '+templateItem.images.length}
                                </Badge> &nbsp;
                                <Badge variant={'info'}> {'Questions: '+templateItem.questions.length}
                                </Badge>
                                 </p> 
                                </Col>
                                <Col md={6} xs={6} xl={6} lg={6}>
                                    <Tooltip title="OJT Info">
                                        <Button variant={'light'}>
                                            <IoMdInformationCircleOutline />
                                        </Button>
                                    </Tooltip>
                                    &nbsp;
                                    {
                                        templateItem.active ? 
                                        <Button
                                    onClick={()=>handleOpen(templateItem.record_id)}
                                    variant={'outline-info'} > <IoMdPeople /> Assign</Button>
                                    :
                                    <Tooltip title={!templateItem.active ? 'OJT has to be active to assign' : null}>
                                    <Button
                                    disabled={!templateItem.active}
                                    variant={'outline-info'} > <IoMdPeople /> Assign</Button>
                                    </Tooltip>
                                    }
                                    
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