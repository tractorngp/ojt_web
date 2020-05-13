import React from 'react';
import { Container, Modal, FormControl, Button, Row, Col, ListGroup, Form } from 'react-bootstrap';
import { IoIosCreate, IoMdTrash, IoMdCloudUpload, IoMdRemoveCircleOutline, IoMdAdd } from 'react-icons/io';
import { nullChecker } from '../../utils/commonUtils';
import { Checkbox } from '@material-ui/core';
import * as _ from 'lodash';

const sampleQuestions = [{
    "question_text": "Question 1",
    "options": [
        "Answer 1",
        "Answer 2",
        "Answer 3"
    ],
    "correct_answers": [
        "Answer 1",
        "Answer 2"
    ]
}, {
    "question_text": "Question 2",
    "options": [
        "Answer 11",
        "Answer 12",
        "Answer 13"
    ],
    "correct_answers": [
        "Answer 11",
        "Answer 12"
    ]
}];

const CreateOJTNew = ({ ojtOpen, ojtDispatch, editMode, fromCreate }) => {

    const [ojtName, setOjtName] = React.useState("");
    const [editState, setEditState] = React.useState(true);
    const [filesList, setFilesList] = React.useState([]);
    const uploadRef = React.useRef(null);
    const [ Questions, setQuestions ] = React.useState(sampleQuestions);

    const addToFilesList = fileList => {
        let tempList = [...filesList];
        for (let i = 0; i < fileList.length; i++) {
            tempList.push(fileList.item(i));
        }
        setFilesList(tempList);
    };

    const removeFromFileList = fileItem => {
        let newFilesList = [];
        filesList.forEach(f => {
            if(f !== fileItem)
                newFilesList.push(f);
        });
        setFilesList(newFilesList);
    }

    const addQuestion = kk => {
        const qformat = {
            question_text: "",
            correct_answers: [],
            options: []
        };

        let questions = _.cloneDeep(Questions);
        questions.push(qformat);
        setQuestions(questions);
    };

    const addOption = qIndex => {
        let questions = _.cloneDeep(Questions);
        questions[qIndex]['options'].push("");
        setQuestions(questions);
    };

    React.useEffect(_ => {
        //setEditState(editMode);
        setQuestions(Questions);
    }, [Questions]);

    return (
        <Modal show={ojtOpen} size={'lg'} onHide={() => ojtDispatch(false)} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>
                    {fromCreate === true ? 'Create ' : 'Edit '}
                     OJT
                        <Button
                        style={{display: (!fromCreate ? 'none' : 'inline-block'),float:'right'}}
                        variant={'outline-secondary'}
                        onClick={()=> {
                            console.log(editState);
                            setEditState(!editState);
                        }}
                        > <IoIosCreate /> Edit </Button> </Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <Container style={{maxHeight:'70vh',overflowY:'auto'}}>
                <FormControl readOnly={!editState}
                    maxLength={50}
                    onChange={(val) => setOjtName(val.target.value)}
                    value={ojtName}
                    placeholder={'Enter OJT Name...'} />

                <hr />
                <Form.Label> Media </Form.Label>
                <div style={{display: (!editState ? 'none' : 'inline-block')}}>
                        <Button variant={'info'}
                            onClick={() => {
                                uploadRef.current.click()
                            }}
                        > <IoMdCloudUpload /> Add Media</Button>  <Form.Label> (Only .png, .jpeg) </Form.Label>
                </div>
                <br /><br />
                {/* controls section end -- media section */}
                <input ref={uploadRef} multiple={true} style={{ display: 'none' }} accept={'image/*'} type="file" onChange={(val) => addToFilesList(val.target.files)} />
                <div id="files">
                {
                    filesList.length > 0 ? <ListGroup>
                        <ListGroup.Item color={'#d9534f'}> Media (Click on image to enlarge) </ListGroup.Item>
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
                                            <Button
                                            style={{display: (!editState ? 'none' : 'inline-block')}}
                                            variant={'danger'}
                                            onClick={()=>removeFromFileList(file)}
                                            > <IoMdRemoveCircleOutline /> </Button>
                                        </Col>
                                    </Row> </ListGroup.Item>
                            ))
                        }
                    </ListGroup> : null

                }
                </div>
                <Container>
                <Button
                style={{display: (!editState ? 'none' : 'inline-block'),float:'right'}}
                variant={'outline-secondary'}
                onClick={addQuestion}
                > Add Question </Button>
                <Form.Label> Questions </Form.Label>
                </Container>

                <div style={{padding:'2rem'}}>
                {
                    nullChecker(Questions) ?
                        Questions.map((question, index) => (

                            <form>
                                <Row>
                                    <Col md={10}>
                                    <FormControl placeholder={`Question ${index}`}
                                    maxLength={50}
                                    onChange={
                                        (val) => {
                                            let questions = _.cloneDeep(Questions);
                                            questions[index]['question_text'] = val.target.value;
                                            setQuestions(questions);
                                        }
                                    }
                                    defaultValue={question.question_text} readOnly={!editState} />
                                    </Col>
                                    <Col  md={2}>
                                        <Button
                                        style={{display: (!editState ? 'none' : 'inline-block')}}
                                        variant={'outline-secondary'}
                                        onClick={()=>{
                                            addOption(index)
                                        }} > <IoMdAdd /> </Button>
                                    </Col>
                                </Row>
                                
                                    <br />
                                {
                                    nullChecker(question.options) ?
                                        question.options.map((option, aindex) => (
                                            <Row>
                                                <Col md={1}>
                                                    <Checkbox 
                                                    onChange={(val) => {
                                                        
                                                        let questions = _.cloneDeep(Questions);
                                                        if(val.target.checked){
                                                            questions[index]['correct_answers'].push(option);
                                                        }else{
                                                            let indexOf =  questions[index]['correct_answers'].indexOf(option);
                                                            questions[index]['correct_answers'].splice(indexOf,1);
                                                        }
                                                        setQuestions(questions);
                                                    }}
                                                    color={'primary'}
                                                    disabled={!editState}
                                                    checked={question.correct_answers.includes(option)}
                                                    />
                                                </Col>
                                                <Col md={10}>
                                                    <FormControl
                                                    maxLength={50}
                                                    disabled={!editState}
                                                    onChange={
                                                        (val) => {
                                                            let questions = _.cloneDeep(Questions);
                                                            questions[index]['options'][aindex] = val.target.value;
                                                            setQuestions(questions);
                                                        }
                                                    }
                                                    type={'text'} placeholder={'Answer..'} defaultValue={option}
                                                    />
                                                </Col>
                                                <Col md={1}>
                                                    <Button 
                                                    onClick={()=> {
                                                        Questions[index]['options'].splice(aindex,1);
                                                        let questions = _.cloneDeep(Questions);
                                                        setQuestions(questions);
                                                    }}
                                                    style={{display: (!editState ? 'none' : 'inline-block')}} variant={'danger'}> <IoMdTrash /> </Button>
                                                </Col>
                                            </Row>
                                        )) : (editMode === true ? 'Add Answers' : 'No Answers')
                                }
                                <br />
                            </form>

                        )) : (editMode === true ? 'Add Questions' : 'No Questions')
                }
                </div>
                </Container>
            </Modal.Body>
            <Modal.Footer>
            <Button 
                onClick={() =>
                    ojtDispatch()
                }
                variant={'light'} >Cancel</Button>
                <Button 
                onClick={() =>
                    {console.log(Questions)}
                }
                variant={'success'} >Submit</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CreateOJTNew;