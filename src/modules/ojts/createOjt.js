import React from 'react';
import { Container, FormControl, Row, Col, Card, Button, ListGroup, Modal } from 'react-bootstrap';
import QuestionDisplay from '../../utils/questionDisplayComponent';
import { makeStyles } from '@material-ui/core/styles';
import { IoMdAddCircle, IoMdCloudUpload, IoMdTrash, IoMdCreate, IoMdRemoveCircleOutline } from 'react-icons/io';
import MediaUploader from '../../utils/mediaUploader';
import QuestionComponent from '../../components/questionComponent';
import { listEmptyChecker, nullChecker } from '../../utils/commonUtils';

const useStyles = makeStyles(theme => ({
    createContainer: {
        maxHeight: '60vh',
        minHeight: '40vh',
        overflowX: 'hidden',
        overflowY: 'auto'
    }
}));

const questionIntial = {
    question: null,
    answers: []
}

const CreateOjt = props => {
    
    const classes = useStyles();
    const [filesList, setFilesList] = React.useState([]);
    const uploadRef = React.useRef(null);
    const [ open, setOpen ] = React.useState(false);
    const [ createQuestion, createQuestionDispatch ] = React.useState(questionIntial);

    const uploadFile = async files => {
        const f = files[0];
        const name = f.name; const type = f.type;
        if (type === 'image/jpeg' || type === 'image/png') {
            const reference = `images/${name}`;
            const durl = await MediaUploader(reference, f);
            console.log(durl);
        } else {
            alert('Not Image');
        }
    };

    const addToFilesList = fileList => {
        let tempList = [...filesList];
        for (let i = 0; i < fileList.length; i++) {
            tempList.push(fileList.item(i));
        }
        console.log(tempList);
        setFilesList(tempList);
    };

    const handleClose = _ => {
        setOpen(false);
    };

    return (
        <Container fluid>
            <Modal show={open} onHide={handleClose} animation={true}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add Question</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <QuestionComponent question={createQuestion} questionDispatch={createQuestionDispatch} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={handleClose}>
                            Cancel
                        </Button> &nbsp;
                        <Button
                        onClick={()=> {
                            console.log(createQuestion);
                        }}
                        color={'primary'}>Submit</Button>
                    </Modal.Footer>
                </Modal>
            <h5> Create OJT </h5>
            
        <Row>
        <Col md={9}>
        <FormControl placeholder={'Enter OJT Name...'} />
        </Col>
        <Col md={3}>
        <Button variant={'outline-danger'} > Clear All </Button> &nbsp;
            <Button variant={'success'}> Submit OJT </Button>
        </Col>
    </Row>
            
            <hr />
        <Container fluid style={{maxHeight:'70vh',overflowY:'auto'}}>
            {/* controls section */}
            <Row>
                <Col md={6}>
                    <Button variant={'primary'}
                    onClick={ ()=> setOpen(true) }
                    > <IoMdAddCircle /> Add Question</Button>
                </Col>
                <Col md={6}>
                    <Button variant={'info'}
                        onClick={() => {
                            uploadRef.current.click()
                        }}
                    > <IoMdCloudUpload /> Upload Media</Button>
                </Col>
            </Row>
            <br /><br />
            {/* controls section end -- media section */}
            <input ref={uploadRef} multiple={true} style={{ display: 'none' }} accept={'image/*'} type="file" onChange={(val) => addToFilesList(val.target.files)} />
            {
                filesList.length > 0 ? <ListGroup>
                    <ListGroup.Item active> Media </ListGroup.Item>
                    {
                        filesList.map(file => (
                        <ListGroup.Item> 
                            <Row>
                                <Col md={4}>
                                <img height={50} width={50} src={URL.createObjectURL(file)} /> 
                                </Col>
                                <Col md={4}>
                            <p>{file.name}</p>
                                </Col>
                                <Col md={4}>
                                    <Button variant={'danger'}> <IoMdRemoveCircleOutline /> </Button>
                                </Col>
                            </Row> </ListGroup.Item>
                        ))
                    }
                </ListGroup> : null

            }

            <br />

            {/* media section end -- questionnaire section */}
            <Container fluid className={classes.createContainer}>
                <h5>Questionnaire</h5>
                <Card>
                    <Card.Header style={{ textAlign: 'left' }}>
                        <Button variant={'warning'}><IoMdCreate /> Edit </Button>
                 &nbsp; <Button variant={'danger'}><IoMdTrash /> Delete </Button> </Card.Header>
                    <QuestionDisplay question={'Q 1 Very Big Question'} answers={['test important ', 'test2', 'test3 another big answer']} correctAnswers={'test2'} />
                </Card>
                <br />
                <Card>
                    <Card.Header> <IoMdCreate /> &nbsp; <IoMdTrash /> </Card.Header>
                    <QuestionDisplay question={'Q 1 Very Big Question'} answers={['test important ', 'test2', 'test3 another big answer']} correctAnswers={['test2', 'test3 another big answer']} />
                </Card>
            </Container>
        </Container>
        </Container>
    );

};

export default CreateOjt;