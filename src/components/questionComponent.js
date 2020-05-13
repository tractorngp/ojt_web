import React from 'react';
import { Container, FormControl, Row, Col, Button, ListGroup, Card } from 'react-bootstrap';
import { Checkbox } from '@material-ui/core';
import { nullChecker, stringIsNotEmpty, stringIsEmpty } from '../utils/commonUtils';
import { IoMdTrash } from 'react-icons/io';

/*
question : {
    question: text
    answers: []
}
answers: [...
    {
        option: answer text,
        choice: right or wrong
    }
...]
*/

const AnswerComponent = ({ index, question, questionDispatch, allAnswerDispatch, inComingAnswer }) => {

    const [answer, setAnswer] = React.useState("");
    const [correctChoice, setCorrectChoice] = React.useState(false);

    const updateAnswers = (choice,answer) => {
        const changed = {
            correct: choice,
            option: answer
        };
        if(question.answers.length === 0){
            let answerTexts = [];
            answerTexts.push(changed);
            question.answers = answerTexts;
            questionDispatch(question);
        }else{
            let answerTexts = question.answers;
            if(nullChecker(answerTexts[index])){
                answerTexts[index] = changed;
            }else{
                answerTexts.push(changed);
            }
            question.answers = answerTexts;
            questionDispatch(question);
        }
        
    };

    const handleChoiceChange = val => {
        if (stringIsNotEmpty(answer)) {
            updateAnswers(val,answer);
            setCorrectChoice(val);
        } else {
            alert('You need to enter Answer first...');
        }
    }

    const handleAnswerChange = val => {
        if (nullChecker(val) && val.length > 0) {
            setAnswer(val);
            updateAnswers(correctChoice,val);
        }
    }

    const deleteAnswerAndDispatch = ansToDelete => {
        console.log(ansToDelete);
        const oldAnswers = question.answers;
        if(oldAnswers.length === 1){
        question.answers = [];
        questionDispatch(question);
        allAnswerDispatch([]);
        }else{
            let newAnswers = [];
            oldAnswers.forEach(oa => {
                if(oa.option === ansToDelete){
                }else{
                    newAnswers.push(oa);
                }
            });
            question.answers = newAnswers;
            questionDispatch(question);
            allAnswerDispatch(newAnswers);
            setAnswer(""); setCorrectChoice(false);
        }
    }

    React.useEffect( _ => {
        if(nullChecker(inComingAnswer)){
            setAnswer(inComingAnswer.option);
            setCorrectChoice(inComingAnswer.correct);
        }else{
            setAnswer("");
            setCorrectChoice(false);
        }
    }, []);

    return (
        <Row>
            <Col md={2}>
                <Checkbox defaultChecked={inComingAnswer !== null ? inComingAnswer.correct : false}
                    onChange={(val) => handleChoiceChange(val.target.checked)}
                />
            </Col>
            <Col md={8}>
                <FormControl type={'text'} placeholder={'Answer..'} defaultValue={answer}
                    onChange={(val) => handleAnswerChange(val.target.value)}
                />
            </Col>
            <Col md={2}>
                <Button disabled={stringIsEmpty(answer) && answer.trim().length === 0} variant={'danger'} onClick={()=>deleteAnswerAndDispatch(answer)}> <IoMdTrash /> </Button>
            </Col>
        </Row>
    );
};

const QuestionComponent = ({ index, question, questionDispatch, editingQuestion }) => {

    const [allAnswers, setAnswers] = React.useState([]);
    const [ answerTexts, setAnwerTexts ] = React.useState([]);

    const addAnswer = _ => {
        setAnswers([...allAnswers,{
            answers: answerTexts,
            answerDispatch: setAnwerTexts
        }]);
    }

    const setQuestionText = val => {
        question.question = val;
        questionDispatch(question);
    }

    React.useEffect( _ => {
        console.log(question);
        if(editingQuestion === false) {
            const questionInitial = {
                question: null,
                answers: [],
                index: index
            }
            questionDispatch(questionInitial);
        }else{
            question.index = index;
            questionDispatch(question);
            setAnswers(question.answers);
        }
    }, []);

    return (
        <Container fluid>
            <FormControl placeholder={'Enter Question'} value={question.question}
                onChange={(val) => setQuestionText(val.target.value)}
            />
            <Button
                onClick={addAnswer}
            > + Add Answer </Button>

            <Card>{
                allAnswers.length > 0 ?

                    <ListGroup>
                        {allAnswers.map((answer,aindex) => (
                            <ListGroup.Item key={aindex}>
                                <AnswerComponent index={aindex} question={question}
                                questionDispatch={questionDispatch}
                                inComingAnswer={nullChecker(question.answers[aindex]) ? question.answers[aindex] : null}
                                allAnswerDispatch={setAnswers} />
                            </ListGroup.Item>
                        ))}
                    </ListGroup> : 'Add Answers'
            }</Card>
        </Container>
    );

};

export default QuestionComponent;