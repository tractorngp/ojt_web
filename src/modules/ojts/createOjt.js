import React from 'react';
import { Container, FormControl, Row, Col, Card, Button, ListGroup, Modal, Jumbotron, InputGroup } from 'react-bootstrap';
import QuestionDisplay from '../../utils/questionDisplayComponent';
import { makeStyles } from '@material-ui/core/styles';
import { IoMdAddCircle, IoMdCloudUpload, IoMdTrash, IoMdCreate, IoMdRemoveCircleOutline } from 'react-icons/io';
import MediaUploader from '../../utils/mediaUploader';
import QuestionComponent from '../../components/questionComponent';
import { nullChecker, listEmptyChecker, stringIsEmpty } from '../../utils/commonUtils';

import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { Snackbar } from '@material-ui/core';
import { BackDropComponent } from '../../components/pageLoaderComponent';

const useStyles = makeStyles(theme => ({
    createContainer: {
        maxHeight: '40vh',
        overflowX: 'hidden',
        overflowY: 'auto'
    },
    snackbarStyle: {
        padding: '20px',
        color: 'white',
        background: '#4caf50'
    }
}));


/*
 Template of question to send it to questionComponent
 returns question with list of answers of format
 answer : {
     option: answer text,
     correct: correct answer or not
 }
*/

const questionIntial = {
    question: null,
    answers: [],
    index: null
}

const CreateOjt = props => {

    const classes = useStyles();
    const db = firebase.firestore();
    const [filesList, setFilesList] = React.useState([]);
    const uploadRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [ojtName, setOjtName] = React.useState('');
    const [createQuestion, createQuestionDispatch] = React.useState(questionIntial);
    const [questionnaire, setQuestionnaire] = React.useState([]);
    const [dueDate, setDueDate] = React.useState(new Date());
    const [openSnackbar, setSnackbar] = React.useState(false);
    const [maskingText, setMaskingText] = React.useState('');
    const [backdropFlag, setBackdrpFlag] = React.useState(false);
    const timeWhenLoaded = new Date().getTime();

    const uploadFile = async file => {
        const f = file;
        const name = f.name; const type = f.type;
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

    const addToFilesList = fileList => {
        let tempList = [...filesList];
        for (let i = 0; i < fileList.length; i++) {
            tempList.push(fileList.item(i));
        }
        setFilesList(tempList);
    };

    const handleClose = _ => {
        setOpen(false);
    };

    const clearAll = _ => {
        setFilesList([]);
        setOjtName('');
        setDueDate(new Date());
        setQuestionnaire([]);
    }

    const hasAtleastOneCorrectAnswer = answers => {
        answers.forEach(answer => {
            if (answer.choice) return true;
        });
        return false;
    }

    const submitQuestion = _ => {
        if (!nullChecker(createQuestion.question) || createQuestion.question.length < 3
            || !listEmptyChecker(createQuestion.answers) || createQuestion.answers.length < 2
            || hasAtleastOneCorrectAnswer(createQuestion.answers)) {
            console.log(createQuestion);
            alert('Please fill Question details')
        } else {
            const question = {};
            console.log(createQuestion);
            question.question_text = createQuestion.question;
            let answersList = []; let correctAnswersList = [];
            createQuestion.answers.forEach(answer => {
                answersList.push(answer.option);
                if (answer.correct === true) {
                    correctAnswersList.push(answer.option);
                }
            });
            question.options = answersList;
            question.correct_answers = correctAnswersList;
            if (correctAnswersList.length === 1)
                question.q_type = "single";
            else
                question.q_type = "multiple";
            question.order_num = createQuestion.index;
            questionnaire.push(question);
            setQuestionnaire(questionnaire);
            setOpen(false);
        }

    }

    const uploadOJT = async images => {
        const now = new Date().toISOString();
        // create data model for ojt_template
        let ojt_template = {
            active: true,
            no_of_attempts: 0,
            ojt_name: ojtName,
            created_date: now,
            due_date: dueDate.toISOString(),
            questions: questionnaire,
            images: images
        };
        // add to collection
        const ojt_ref = db.collection('ojt_templates').doc().id;
        console.log(ojt_ref);
        ojt_template.record_id = ojt_ref;
        db.collection('ojt_templates').doc(ojt_ref).set(ojt_template).then(_ => {
            setBackdrpFlag(false);
            setMaskingText('');
            setSnackbar(true);
            clearAll();
        }).catch(error => {
            alert('Error creating OJT');
            console.error(error);
        });
    };

    // WIP
    const validateAndCreateOjt = async _ => {
        // validate files, ojt name
        if (stringIsEmpty(ojtName) || questionnaire.length < 1) {
            if (stringIsEmpty(ojtName)) {
                alert('OJT Name is missing');
            }
            if (questionnaire.length < 1) {
                alert('OJT must consist of atleast one Question.');
            }
        } else {
            // upload images ans fetch download urls
            if (filesList.length === 0) {
                setMaskingText('Creating OJT...');
                setBackdrpFlag(true);
                uploadOJT([]);
            } else {
                setMaskingText('Uploading images...');
                setBackdrpFlag(true);
                Promise.all(filesList.map(async file => {
                    return await uploadFile(file);
                })).then(values => {
                    setMaskingText('Creating OJT...')
                    uploadOJT(values);
                }).catch(error => {
                    setBackdrpFlag(false);
                    setMaskingText('');
                    console.error(error);
                    alert('Error uploading images');
                });

            }
        }
    };

    return (
        <Jumbotron style={{maxHeight:'80vh',overflowY:'auto',overflowX:'hidden'}}>
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
                <div className={classes.snackbarStyle} > OJT created Successfully! </div>
            </Snackbar>
            <BackDropComponent maskingText={maskingText} showBackdrop={backdropFlag} />
            <Modal show={open} onHide={handleClose} animation={true}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Question</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <QuestionComponent
                        index={questionnaire.length === 0 ? 1 : (questionnaire.length + 1)}
                        question={createQuestion} questionDispatch={createQuestionDispatch} />
                </Modal.Body>
                <Modal.Footer>
                    <Button
                    variant={'light'}
                    onClick={handleClose}>
                        Cancel
                        </Button> &nbsp;
                        <Button
                        onClick={submitQuestion}
                        variant={'success'}>Submit</Button>
                </Modal.Footer>
            </Modal>
            <h5> Create OJT </h5>

            <Row>
                <Col md={9}>
                    <FormControl
                        onChange={(val) => setOjtName(val.target.value)}
                        value={ojtName}
                        placeholder={'Enter OJT Name...'} />
                </Col>
                <Col md={3}>
                    <Button variant={'outline-danger'}
                        onClick={clearAll}
                    > Clear All </Button> &nbsp;
            <Button
                        disabled={questionnaire.length === 0 || stringIsEmpty(ojtName)
                        || dueDate.getTime() < timeWhenLoaded}
                        onClick={validateAndCreateOjt}
                        variant={'success'}> Submit OJT </Button>
                </Col>
            </Row>

            <hr />
            <Container fluid style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* controls section */}
                <Row>
                    <Col md={4}>
                        <Button variant={'primary'}
                            onClick={() => setOpen(true)}
                        > <IoMdAddCircle /> Add Question</Button>
                    </Col>
                    <Col md={4}>
                        <InputGroup>
                        <InputGroup.Prepend>
                        <InputGroup.Text> Due Date </InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                            value={nullChecker(dueDate) ? dueDate.toISOString().substr(0, 10) : ''}
                            type={'date'}
                            placeholder={'Due Date'}
                            onChange={(val) => { setDueDate(val.target.valueAsDate) }}
                        />
                        </InputGroup>
                    </Col>
                    <Col md={4}>
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
                    {
                        questionnaire.length === 0 ? 'Add Questions' :
                            questionnaire.map((question, index) => (
                                <div><Card>
                                    <Card.Header style={{ textAlign: 'left' }}>
                                        <Button variant={'warning'}><IoMdCreate /> Edit </Button>
                                &nbsp; <Button variant={'danger'}><IoMdTrash /> Delete </Button> </Card.Header>
                                    <QuestionDisplay question={question.question_text}
                                        answers={question.options} correctAnswers={question.correct_answers} />
                                </Card>
                                    <br /></div>
                            ))
                    }
                </Container>
            </Container>
        </Jumbotron>
    );

};

export default CreateOjt;