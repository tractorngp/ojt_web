import React from 'react';
import { Container, FormControl, Row, Col, Button, ListGroup, Card } from 'react-bootstrap';
import { Checkbox } from '@material-ui/core';
import { nullChecker, stringIsNotEmpty } from '../utils/commonUtils';

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

const AnswerComponent = ({ index, answers, AnswerDispatch, question, questionDispatch }) => {

    const [answer, setAnswer] = React.useState(null);
    const [correctChoice, setCorrectChoice] = React.useState(false);

    const updateAnswers = (choice,answer) => {
        const changed = {
            correct: choice,
            option: answer
        };
        if(answers.length === 0){
            let answerTexts = [];
            answerTexts.push(changed);
            AnswerDispatch(answerTexts);
            question.answers = answerTexts;
            questionDispatch(question);
        }else{
            let answerTexts = answers;
            if(nullChecker(answerTexts[index])){
                answerTexts[index] = changed;
            }else{
                answerTexts.push(changed);
            }
            AnswerDispatch(answerTexts);
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

    return (
        <Row>
            <Col md={2}>
                <Checkbox checked={correctChoice}
                    onChange={(val) => handleChoiceChange(val.target.checked)}
                />
            </Col>
            <Col md={10}>
                <FormControl type={'text'} placeholder={'Answer..'}
                    onChange={(val) => handleAnswerChange(val.target.value)}
                />
            </Col>
        </Row>
    );
};

const QuestionComponent = ({ index, question, questionDispatch }) => {

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
        question.index = index;
        questionDispatch(question);
    }, []);

    return (
        <Container fluid>
            <FormControl placeholder={'Enter Question'}
                onChange={(val) => setQuestionText(val.target.value)}
            />
            <Button
                onClick={addAnswer}
            > + Add Answer </Button>

            <Card>{
                allAnswers.length > 0 ?

                    <ListGroup>
                        {allAnswers.map((answer,index) => (
                            <ListGroup.Item key={index}>
                                <AnswerComponent index={index} question={question} 
                                answers={answer.answers} questionDispatch={questionDispatch}
                                AnswerDispatch={answer.answerDispatch} />
                            </ListGroup.Item>
                        ))}
                    </ListGroup> : 'Add Answers'
            }</Card>
        </Container>
    );

};

export default QuestionComponent;