import React from 'react';
import { Container, Modal, FormControl, Button, Row, Col, ListGroup, Form, Alert } from 'react-bootstrap';
import { IoIosCreate, IoMdTrash, IoMdCloudUpload, IoMdRemoveCircleOutline, IoMdAdd } from 'react-icons/io';
import { nullChecker } from '../../utils/commonUtils';
import { Checkbox, Snackbar } from '@material-ui/core';
import * as _ from 'lodash';
import Lightbox from 'react-image-lightbox';


const customStyles = {
    overlay : {
      zIndex: '9999'
    }
};

const sampleQuestions = [];
// {
//     "question_text": "Question 1",
//     "options": [
//         "Answer 1",
//         "Answer 2",
//         "Answer 3"
//     ],
//     "correct_answers": [
//         "Answer 1",
//         "Answer 2"
//     ]
// }, {
//     "question_text": "Question 2",
//     "options": [
//         "Answer 11",
//         "Answer 12",
//         "Answer 13"
//     ],
//     "correct_answers": [
//         "Answer 11",
//         "Answer 12"
//     ]
// }

const CreateOJTNew = ({ ojtOpen, ojtDispatch, editMode, fromCreate }) => {
    const [ojtName, setOjtName] = React.useState("");
    const [editState, setEditState] = React.useState(true);
    const [filesList, setFilesList] = React.useState([]);
    const [existingFiles, setExistingFiles] = React.useState([]);
    const uploadRef = React.useRef(null);
    const [ Questions, setQuestions ] = React.useState(sampleQuestions);
    const [snackBarText, setSnackbarText] = React.useState('');
    const [snackBarVariant, setSnackbarVariant] = React.useState("danger");
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [lightBoxFiles, setLightBoxFiles] = React.useState([]);
    const [isLightBoxOpen, setLightBoxState] = React.useState(false);
    const [isFromExistingFiles, setFromExistingFiles] = React.useState(false);
    const [photoIndex, setPhotoIndex] = React.useState(0);

    const validateTheQuestions = _ => {
        let validationPass = true;
        if(ojtName == null || ojtName.trim() == ""){
            validationPass = false;
            showSnackBar("OJT Name can't be empty!", "danger");
            return;
        }
        else if(nullChecker(Questions)){
            if(Questions.length <= 0){
                validationPass = false;
                showSnackBar("Questions can't be empty!", "danger");
                return;
            }
            else{
                for(let index = 0; index < Questions.length; index++){
                    if(Questions[index].question_text == null || Questions[index].question_text.trim() == ""){
                        validationPass = false;
                        showSnackBar(`Question ${index+1} text can't be empty!`, "danger");
                        return;
                    }
                    if(Questions[index].options == null || Questions[index].options.length <= 1){
                        validationPass = false;
                        showSnackBar("You need to add atleast 2 options!", "danger");
                        return;
                    }
                    if(Questions[index].options != null || Questions[index].options.length > 1){
                        for(let aindex = 0;aindex<Questions[index].options.length;aindex++){
                            if(Questions[index].options[aindex] == null || Questions[index].options[aindex].trim() == ""){
                                validationPass = false;
                                showSnackBar(`Option ${aindex+1} text can't be empty!`, "danger");
                                return;
                            }
                        }
                    }
                    if(Questions[index].correct_answers == null || Questions[index].correct_answers.length == 0){
                        validationPass = false;
                        showSnackBar("You need to add atleast 1 correct answer!", "danger");
                        return;
                    }
                }
                if(validationPass == true)
                showSnackBar("Good to go!", "success");
            }
        }
        else{
            validationPass = false;
            showSnackBar("Questions can't be empty!", "danger");
            return;
        }
    }

    const showSnackBar = (text,variant) =>{
        setSnackbarVariant(variant);
        setSnackbarText(text);
        setSnackbar(true);
    }

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

    const removeFromExistingFileList = fileItem => {
        let newFilesList = [];
        existingFiles.forEach(f => {
            if(f !== fileItem)
                newFilesList.push(f);
        });
        setExistingFiles(newFilesList);
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
        setExistingFiles(["https://firebasestorage.googleapis.com/v0/b/ojtappl.appspot.com/o/images%2F2020-05-10T10%3A11%3A44.225Z?alt=media&token=04461392-214e-4d36-9e70-5569eaffd8b2"]);
        setQuestions(Questions);
    }, [Questions]);

    return (
        <Container fluid style={{ maxWidth: '100%' }}>

            {isLightBoxOpen ? (
                <Lightbox reactModalStyle={customStyles}
                    mainSrc={(isFromExistingFiles ? lightBoxFiles[photoIndex] : URL.createObjectURL(lightBoxFiles[photoIndex]))}
                    nextSrc={(isFromExistingFiles ? (lightBoxFiles[(photoIndex + 1) % lightBoxFiles.length]) : URL.createObjectURL(lightBoxFiles[(photoIndex + 1) % lightBoxFiles.length]))}
                    prevSrc={(isFromExistingFiles ? (lightBoxFiles[(photoIndex + lightBoxFiles.length - 1) % lightBoxFiles.length]) : (URL.createObjectURL(lightBoxFiles[(photoIndex + lightBoxFiles.length - 1) % lightBoxFiles.length])))}
                    onCloseRequest={() => setLightBoxState(false)}
                    onMovePrevRequest={() =>
                        setPhotoIndex((photoIndex + lightBoxFiles.length - 1) % lightBoxFiles.length)
                    }
                    onMoveNextRequest={() =>
                        setPhotoIndex((photoIndex + 1) % lightBoxFiles.length)
                    }
                />
            ) : null}
            
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
                <Alert variant={snackBarVariant} onClose={() => setSnackbar(false)} dismissible>
                {snackBarText}
                </Alert>
            </Snackbar>
        
            <Modal show={ojtOpen} size={'lg'} onHide={() => ojtDispatch(false)} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title style={{width: '100%'}}>
                        <Row style={{width: '100%'}}>
                        <Col md={10} style={{paddingLeft: '5%'}}>{fromCreate === true ? 'Create ' : 'Edit '} OJT</Col>
                            <Col md={2} style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}><Button
                            style={{display: (fromCreate ? 'none' : 'inline-block'),float:'right'}}
                            variant={'outline-secondary'}
                            onClick={()=> {
                                console.log(editState);
                                setEditState(!editState);
                            }}
                            > <IoIosCreate /> Edit </Button> </Col>
                            </Row>
                            </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <Container style={{maxHeight:'70vh',overflowY:'auto'}}>
                    <FormControl readOnly={!editState}
                        maxLength={50}
                        onChange={(val) => setOjtName(val.target.value)}
                        value={ojtName}
                        placeholder={'Enter OJT Name...'} />

                    <hr />
                    <Alert key={1} variant={'secondary'}>
                        <Row><Col><h5 style={{ margin: '0'}}>Add Media (Preferred Dimensions: (1429 × 764) *Only .png, .jpeg*)</h5></Col></Row>
                    </Alert>
                    <div style={{display: (!editState ? 'none' : 'inline-block')}}>
                            <Button variant={'info'}
                                onClick={() => {
                                    uploadRef.current.click()
                                }}
                            > <IoMdCloudUpload /> Click to Upload</Button>
                    </div>
                    <br /><br />
                    {/* controls section end -- media section */}
                    <input ref={uploadRef} multiple={true} style={{ display: 'none' }} accept={'image/*'} type="file" onChange={(val) => addToFilesList(val.target.files)} />
                    <div id="files">
                    {
                        filesList.length > 0 ? <ListGroup style={{paddingBottom: '2.0vh'}}>
                            <ListGroup.Item color={'#d9534f'}> Media (Click on image to enlarge) </ListGroup.Item>
                            {
                                filesList.map(file => (
                                    <ListGroup.Item>
                                        <Row>
                                            <Col md={4}>
                                                <img height={50} width={50} src={URL.createObjectURL(file)}  onClick={()=>{
                                                    setFromExistingFiles(false)
                                                    setLightBoxFiles(filesList)
                                                    setLightBoxState(true)
                                                }}/>
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
                    {
                        existingFiles.length > 0 ?
                            <ListGroup style={{paddingBottom: '2.0vh'}}>
                                <Row>
                                    <Col md={12}>
                                        <Alert key={4} variant={'secondary'}>
                                            <h5 style={{ margin: '0'}}>Existing Files</h5>
                                        </Alert>
                                    </Col>
                                </Row>
                                <ListGroup.Item color={'#d9534f'}> Media (Click on image to enlarge) </ListGroup.Item>
                                {
                                    existingFiles.map(file => (
                                        <ListGroup.Item>
                                            <Row>
                                                <Col md={4}>
                                                    <img height={50} width={50} src={file}  onClick={()=>{
                                                        setFromExistingFiles(true)
                                                        setLightBoxFiles(existingFiles)
                                                        setLightBoxState(true)
                                                    }}/>
                                                </Col>
                                                <Col md={4}>
                                                    <p>{file.name}</p>
                                                </Col>
                                                <Col md={4}>
                                                    <Button
                                                    style={{display: (!editState ? 'none' : 'inline-block')}}
                                                    variant={'danger'}
                                                    onClick={()=>removeFromExistingFileList(file)}
                                                    > <IoMdRemoveCircleOutline /> </Button>
                                                </Col>
                                            </Row> </ListGroup.Item>
                                    ))
                                }
                            </ListGroup> : null
                    }
                    </div>
                    <div>
                    <Alert key={2} variant={'secondary'}>
                        <Row>
                            <Col md={8} style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                <h5 style={{ margin: '0'}}>Questions</h5>
                            </Col>
                            <Col md={4} style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end'}}>
                                <div>
                                    <Button
                                        style={{display: (!editState ? 'none' : 'inline-block')}}
                                        variant={'dark'}
                                        onClick={addQuestion}
                                        > <IoMdAdd /> </Button>
                                </div>
                            </Col>
                        </Row>                        
                            
                    </Alert>
                    
                    </div>

                    <div style={{padding:'1.5rem'}}>
                    {
                        nullChecker(Questions) ?
                            Questions.map((question, index) => (

                                <form>
                                    <Row>
                                        <Col md={4}>
                                            <Alert key={3} variant={'secondary'} style={{padding: '5px 0px 0px 15px'}}>
                                                <h5>Question {index + 1}</h5>
                                            </Alert>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={10}>
                                        <FormControl placeholder={`Question ${index+1}`}
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
                                        <Col  md={1}>
                                            <Button
                                            style={{display: (!editState ? 'none' : 'inline-block')}}
                                            variant={'outline-dark'}
                                            onClick={()=>{
                                                addOption(index)
                                            }} > <IoMdAdd /> </Button>
                                        </Col>
                                        <Col md={1}>
                                            <Button 
                                            onClick={()=> {
                                                Questions.splice(index,1);
                                                let questions = _.cloneDeep(Questions);
                                                setQuestions(questions);
                                            }}
                                            style={{display: (!editState ? 'none' : 'inline-block')}} variant={'danger'}> <IoMdTrash /> </Button>
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
                                                    <Col md={7}>
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
                                                        type={'text'} placeholder={`Option ${aindex+1}`} defaultValue={option}
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
                
                <Modal.Footer style={{display: (!editState ? 'none' : 'flex'), flexDirection: 'row', alignItems:'flex-end'}}>
                    <Button 
                        onClick={() =>
                            ojtDispatch()
                        }
                        variant={'light'} >Cancel</Button>
                        <Button 
                        onClick={() =>
                            {
                                console.log(Questions)
                                validateTheQuestions()
                            }
                        }
                        variant={'success'} >Submit</Button>
                </Modal.Footer> 
                
            </Modal>
        </Container>
    );
};

export default CreateOJTNew;