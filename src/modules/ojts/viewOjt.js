import React from 'react';
import { Container, ListGroup, Row, Col, Button, Badge } from 'react-bootstrap';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { CircularProgress, Tooltip } from '@material-ui/core';
import { IoMdInformationCircleOutline, IoMdPeople } from 'react-icons/io';

const OJT_TEMPLATES = 'ojt_templates';

const ViewOjt = props => {

    const [ ojtTemplates, setOjtTemplates ] = React.useState([]);
    const db = firebase.firestore();

    const fetchOjts = _ => {
        db.collection(OJT_TEMPLATES).onSnapshot( templatesSnapshot => {
            let tempList = templatesSnapshot.docs.map(doc => doc.data());
            setOjtTemplates(tempList);
        }, error => {
            console.error(error);
            alert('Database Error');
        });
    };

    React.useEffect( _ => {
        fetchOjts();
    }, []);

    return (
        <Container>
            {
                ojtTemplates.length > 0 ?
                <ListGroup>
                {
                    ojtTemplates.map(templateItem => (
                        <ListGroup.Item key={templateItem.ojt_name}>
                            <Row>
                                <Col md={6} xs={6} xl={6} lg={6}>
                                <p> {templateItem.ojt_name} &nbsp;
                                <Badge variant={'info'}> {'Media: '+templateItem.images.length}
                                </Badge> </p> 
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