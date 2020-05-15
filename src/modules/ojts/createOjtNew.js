import React from 'react';
import * as firebase from 'firebase';
import 'firebase/firestore';
import 'firebase/storage';
import { Container, Modal, FormControl, Button, Row, Col, ListGroup, Alert, Form } from 'react-bootstrap';
import { IoIosCreate, IoMdTrash, IoMdCloudUpload, IoMdRemoveCircleOutline, IoMdAdd } from 'react-icons/io';
import { nullChecker, listEmptyChecker } from '../../utils/commonUtils';
import { Checkbox, Snackbar } from '@material-ui/core';
import * as _ from 'lodash';
import Lightbox from 'react-image-lightbox';
import { OjtContext } from './viewOjt';
import * as moment from 'moment';
import MediaUploader from './../../utils/mediaUploader';
const customStyles = {
    overlay: {
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

const CreateOJTNew = props => {
    const { ojtState, ojtStateDispatch } = React.useContext(OjtContext);
    const [ojtName, setOjtName] = React.useState("");
    const [editState, setEditState] = React.useState(false);
    const [filesList, setFilesList] = React.useState([]);
    const [existingFiles, setExistingFiles] = React.useState([]);
    const uploadRef = React.useRef(null);
    const [Questions, setQuestions] = React.useState(sampleQuestions);
    const [snackBarText, setSnackbarText] = React.useState('');
    const [snackBarVariant, setSnackbarVariant] = React.useState("danger");
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [lightBoxFiles, setLightBoxFiles] = React.useState([]);
    const [isLightBoxOpen, setLightBoxState] = React.useState(false);
    const [isFromExistingFiles, setFromExistingFiles] = React.useState(false);
    const [photoIndex, setPhotoIndex] = React.useState(0);
    const [dueDate, setDueDate] = React.useState(new Date());
    const db = firebase.firestore();
    const storage = firebase.storage();

    const validateDueDate = _ => {
        let d1 = new Date();
        d1.setHours(0, 0, 0, 0);
        let d2 = new Date(dueDate);
        d2.setHours(0, 0, 0, 0);
        if (moment(d1).diff(d2, 'days') <= 0) {
            return false;
        }
        return true;
    }

    const uploadFile = async file => {
        const f = file;
        const type = f.type;
        if (type === 'image/jpeg' || type === 'image/png') {
            //const reference = `images/${name}`;
            const reference = `images/${'' + new Date().toISOString()}`;
            const durl = await MediaUploader(reference, f).then(url => {
                return url;
            });
            return durl;
        } else {
            return null;
            //alert('Not Image');
        }
    };

    const validateTheQuestions = _ => {
        let validationPass = true;
        if (ojtName === null || ojtName.trim() === "") {
            validationPass = false;
            showSnackBar("OJT Name can't be empty!", "danger");
            return false;
        } else if (validateDueDate()) {
            validationPass = false;
            showSnackBar("Due Date cannot be a previous date!", "danger");
            return false;
        }
        else if (nullChecker(Questions)) {
            if (Questions.length <= 0) {
                validationPass = false;
                showSnackBar("Questions can't be empty!", "danger");
                return false;
            }
            else {
                for (let index = 0; index < Questions.length; index++) {
                    if (Questions[index].question_text === null || Questions[index].question_text.trim() === "") {
                        validationPass = false;
                        showSnackBar(`Question ${index + 1} text can't be empty!`, "danger");
                        return false;
                    }
                    if (Questions[index].options === null || Questions[index].options.length <= 1) {
                        validationPass = false;
                        showSnackBar("You need to add atleast 2 options!", "danger");
                        return false;
                    }
                    if (Questions[index].options != null || Questions[index].options.length > 1) {
                        for (let aindex = 0; aindex < Questions[index].options.length; aindex++) {
                            if (Questions[index].options[aindex] === null || Questions[index].options[aindex].trim() === "") {
                                validationPass = false;
                                showSnackBar(`Option ${aindex + 1} text can't be empty!`, "danger");
                                return false;
                            }
                        }
                    }
                    if (Questions[index].correct_answers === null || Questions[index].correct_answers.length === 0) {
                        validationPass = false;
                        showSnackBar("You need to add atleast 1 correct answer!", "danger");
                        return false;
                    }
                }
                if (validationPass === true) {
                    //showSnackBar("Good to go!", "success");
                    return true;
                }
            }
        }
        else {
            validationPass = false;
            showSnackBar("Questions can't be empty!", "danger");
            return false;
        }
    }

    const validateAndPrepareOJT = args => {
        const validationPass = validateTheQuestions();
        if (validationPass) {
            const questions = Questions.map((question, index) => {
                return {
                    q_type: question.correct_answers.length === 1 ? 'single' : 'multiple',
                    order_num: index + 1,
                    ...question
                }
            })
            if (Object.keys(ojtState.editingOJT).length > 0) {
                if (ojtState.editingOJT.images.length > 0) {
                    // handle changes in existing images list
                    const difference = ojtState.editingOJT.images.filter(n => !existingFiles.includes(n));
                    // difference are urls that need to be deleted
                    if(listEmptyChecker(difference)){
                        difference.forEach(url => {
                            // can be async..dont have to wait..no -ve impact
                            storage.refFromURL(url).delete();
                        });
                    }
                }
            }
            // upload newly selected images and get references
            if (filesList.length === 0) {
                const images = existingFiles.length > 0 ? existingFiles : [];
                const ojtToUpload = {
                    ojt_name: ojtName,
                    questions: questions,
                    active: true,
                    due_date: dueDate.toISOString(),
                    no_of_attempts: 0,
                    images: images
                };
                uploadOJT(ojtToUpload);
            } else {
                const images = existingFiles.length > 0 ? existingFiles : [];
                Promise.all(filesList.map(async file => {
                    return await uploadFile(file);
                })).then(uploadedImages => {
                    const ojtToUpload = {
                        ojt_name: ojtName,
                        questions: questions,
                        active: true,
                        due_date: dueDate.toISOString(),
                        no_of_attempts: 0,
                        images: [...images, ...uploadedImages]
                    };
                    uploadOJT(ojtToUpload);
                }).catch(error => {
                    showSnackBar('Error Uploading Images',"danger");
                    console.error(error);
                });
            }
        }
    }

    const uploadOJT = async ojtData => {
        if(!ojtState.fromCreate && Object.keys(ojtState.editingOJT).length > 0){
            // editing an existing ojt..no need to create new record 
            // add modified date
            ojtData.modified_date = new Date().toISOString();
            ojtData.active = ojtState.editingOJT.active;
            db.collection('ojt_templates').doc(ojtState.editingOJT.record_id)
            .update(ojtData).then( _ => {
                showSnackBar('Ojt Updated!','success');
                refreshCurrentPageOJT(ojtData, false);
            }).catch(error => {
                alert(error); console.error(error);
            });
        }else{
            // create new record and add the id
            // add created and modified date as same
            const record_id = await (db.collection('ojt_templates').doc()).id;
            ojtData.created_date = new Date().toISOString();
            ojtData.modified_date = new Date().toISOString();
            ojtData.record_id = record_id;
            db.collection('ojt_templates').doc(record_id)
            .set(ojtData).then( _ => {
                showSnackBar('Ojt Added!', 'success');
                refreshCurrentPageOJT(ojtData, false);
            }).catch(error => {
                alert(error); console.error(error);
            });
        }
    }

    const showSnackBar = (text, variant) => {
        setSnackbarVariant(variant);
        setSnackbarText(text);
        setSnackbar(true);
    }

    const addToFilesList = fileList => {
        let tempList = [...filesList];
        let fileSizeExceeded = false;
        for (let i = 0; i < fileList.length; i++) {
            if((fileList.item(i).size > (1024 * 2) * 8) || 
            (fileList.item(i).type !== 'images/jpeg' || fileList.item(i).type !== 'images/png')){
                fileSizeExceeded = true;
            }else{
            tempList.push(fileList.item(i));
            }
        }
        if(fileSizeExceeded){
            showSnackBar('Some Files have size > 2MB or have improper format!','danger');
        }
        setFilesList(tempList);
    };

    const removeFromFileList = fileItem => {
        let newFilesList = [];
        filesList.forEach(f => {
            if (f !== fileItem)
                newFilesList.push(f);
        });
        setFilesList(newFilesList);
    }

    const removeFromExistingFileList = fileItem => {
        let newFilesList = [];
        existingFiles.forEach(f => {
            if (f !== fileItem)
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

    const refreshCurrentPageOJT = (ojt, editingState) => {
        setOjtName(ojt.ojt_name);
        setFilesList([]);
        setExistingFiles(ojt.images);
        setQuestions(ojt.questions);
        setDueDate(nullChecker(ojt.due_date) ? new Date(ojt.due_date) : new Date());
        setEditState(editingState);
    };

    React.useEffect(_ => {
        if (Object.keys(ojtState.editingOJT).length > 0 && !ojtState.fromCreate) {
            const editingOJT = ojtState.editingOJT;
            refreshCurrentPageOJT(editingOJT, false);
        }else{
            setEditState(true);
        }
    }, []);

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

            <Modal.Header closeButton>
                <Modal.Title style={{ width: '100%' }}>
                    <Row style={{ width: '100%' }}>
                        <Col md={10} style={{ paddingLeft: '5%' }}> {
                            !editState ? 'OJT Info' :
                        (ojtState.fromCreate === true ? 'Create OJT' : 'Edit OJT')
                        }</Col>
                        <Col md={2} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'end' }}><Button
                            style={{ display: (ojtState.fromCreate ? 'none' : 'inline-block'), float: 'right' }}
                            variant={'outline-secondary'}
                            onClick={() => {
                                setEditState(!editState);
                            }}
                        > <IoIosCreate /> Edit </Button> </Col>
                    </Row>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Form.Label>OJT Name</Form.Label>
                    <FormControl readOnly={!editState}
                        maxLength={50}
                        onChange={(val) => setOjtName(val.target.value)}
                        value={ojtName}
                        placeholder={'Enter OJT Name...'} />
                    <br />
                    <Form.Label>Due Date</Form.Label>
                    <FormControl
                        readOnly={!editState}
                        value={ nullChecker(dueDate) ? dueDate.toISOString().substr(0,10) 
                            : new Date().toISOString().substr(0,10)}
                        type={'date'}
                        placeholder={'Due Date'}
                        onChange={(val) => { setDueDate(val.target.valueAsDate) }} />

                    <hr />
                    <div style={{ display: (!editState ? 'none' : 'inline-block')}}>
                    <Alert key={1} variant={'secondary'} transition={null}>
                        <Row><Col><h5 style={{ margin: '0', float: 'left' }}>Add Media </h5> &nbsp; <b>(Preferred Dimensions: (1429 × 764) *Only .png, .jpeg*, &lt; 2MB)</b></Col></Row>
                    </Alert>
                    </div>
                    <div style={{ display: (!editState ? 'none' : 'inline-block'), marginBottom: '2vh' }}>
                        <Button variant={'info'}
                            onClick={() => {
                                uploadRef.current.click()
                            }}
                        > <IoMdCloudUpload /> Click to Upload</Button>
                    </div>
                    <br />
                    {/* controls section end -- media section */}
                    <input ref={uploadRef} multiple={true} style={{ display: 'none' }} accept={'image/*'} type="file" onChange={(val) => addToFilesList(val.target.files)} />
                    <div id="files">
                        {
                            filesList.length > 0 ? <ListGroup style={{ paddingBottom: '2.0vh' }}>
                                <ListGroup.Item color={'#d9534f'}> Media (Click on image to enlarge) </ListGroup.Item>
                                {
                                    filesList.map(file => (
                                        <ListGroup.Item>
                                            <Row>
                                                <Col md={4}>
                                                    <img height={50} width={50} alt={'Attached File'} src={URL.createObjectURL(file)} onClick={() => {
                                                        setFromExistingFiles(false)
                                                        setLightBoxFiles(filesList)
                                                        setLightBoxState(true)
                                                    }} />
                                                </Col>
                                                <Col md={4}>
                                                    <p>{file.name}</p>
                                                </Col>
                                                <Col md={4}>
                                                    <Button
                                                        style={{ display: (!editState ? 'none' : 'inline-block') }}
                                                        variant={'danger'}
                                                        onClick={() => removeFromFileList(file)}
                                                    > <IoMdRemoveCircleOutline /> </Button>
                                                </Col>
                                            </Row> </ListGroup.Item>
                                    ))
                                }
                            </ListGroup> : null

                        }
                        {
                            existingFiles.length > 0 ?
                                <ListGroup style={{ paddingBottom: '2.0vh' }}>
                                    <Row>
                                        <Col md={12}>
                                            <Alert key={4} variant={'secondary'}>
                                                <h5 style={{ margin: '0' }}>Existing Files</h5>
                                            </Alert>
                                        </Col>
                                    </Row>
                                    <ListGroup.Item color={'#d9534f'}> Media (Click on image to enlarge) </ListGroup.Item>
                                    {
                                        existingFiles.map(file => (
                                            <ListGroup.Item>
                                                <Row>
                                                    <Col md={4}>
                                                        <img height={50} width={50} alt={'Attached File'} src={file} onClick={() => {
                                                            setFromExistingFiles(true)
                                                            setLightBoxFiles(existingFiles)
                                                            setLightBoxState(true)
                                                        }} />
                                                    </Col>
                                                    <Col md={4}>
                                                        <p>{file.name}</p>
                                                    </Col>
                                                    <Col md={4}>
                                                        <Button
                                                            style={{ display: (!editState ? 'none' : 'inline-block') }}
                                                            variant={'danger'}
                                                            onClick={() => removeFromExistingFileList(file)}
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
                                <Col md={8} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h5 style={{ margin: '0' }}>Questions</h5>
                                </Col>
                                <Col md={4} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                                    <div>
                                        <Button
                                            style={{ display: (!editState ? 'none' : 'inline-block') }}
                                            variant={'dark'}
                                            onClick={addQuestion}
                                        > <IoMdAdd /> </Button>
                                    </div>
                                </Col>
                            </Row>

                        </Alert>

                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        {
                            listEmptyChecker(Questions) ?
                                Questions.map((question, index) => (

                                    <form>
                                        <Row>
                                            <Col md={4}>
                                                <Alert key={3} variant={'secondary'} style={{ padding: '5px 0px 0px 15px' }}>
                                                    <h5>Question {index + 1}</h5>
                                                </Alert>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={10}>
                                                <FormControl placeholder={`Question ${index + 1}`}
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
                                            <Col md={1}>
                                                <Button
                                                    style={{ display: (!editState ? 'none' : 'inline-block') }}
                                                    variant={'outline-dark'}
                                                    onClick={() => {
                                                        addOption(index)
                                                    }} > <IoMdAdd /> </Button>
                                            </Col>
                                            <Col md={1}>
                                                <Button
                                                    onClick={() => {
                                                        Questions.splice(index, 1);
                                                        let questions = _.cloneDeep(Questions);
                                                        setQuestions(questions);
                                                    }}
                                                    style={{ display: (!editState ? 'none' : 'inline-block') }} variant={'danger'}> <IoMdTrash /> </Button>
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
                                                                    if (val.target.checked) {
                                                                        questions[index]['correct_answers'].push(option);
                                                                    } else {
                                                                        let indexOf = questions[index]['correct_answers'].indexOf(option);
                                                                        questions[index]['correct_answers'].splice(indexOf, 1);
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
                                                                type={'text'} placeholder={`Option ${aindex + 1}`} defaultValue={option}
                                                            />
                                                        </Col>
                                                        <Col md={1}>
                                                            <Button
                                                                onClick={() => {
                                                                    Questions[index]['options'].splice(aindex, 1);
                                                                    let questions = _.cloneDeep(Questions);
                                                                    setQuestions(questions);
                                                                }}
                                                                style={{ display: (!editState ? 'none' : 'inline-block') }} variant={'danger'}> <IoMdTrash /> </Button>
                                                        </Col>
                                                    </Row>
                                                )) : ((editState === true) ? 'Add Answers' : 'No Answers')
                                        }
                                        <br />
                                    </form>

                                )) : (editState === true ? 'Add Questions' : 'No Questions')
                        }
                    </div>
                </Container>
            </Modal.Body>
            <Modal.Footer style={{ display: (!editState ? 'none' : 'flex'), flexDirection: 'row', alignItems: 'flex-end' }}>
                <Button
                    onClick={() =>
                        ojtStateDispatch({
                            type: 'OPEN_OJT',
                            ojtOpen: false
                        })
                    }
                    variant={'light'} >Cancel</Button>
                <Button
                    onClick={validateAndPrepareOJT}
                    variant={'success'} >Submit</Button>
            </Modal.Footer>
        </Container>
    );
};

export default CreateOJTNew;