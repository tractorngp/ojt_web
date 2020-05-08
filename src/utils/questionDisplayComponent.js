import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { IoMdCheckmarkCircle } from 'react-icons/io';

const answerStyle = {textAlign:'left',
maxHeight:'3rem',maxWidth:'25%',
textOverflow:'ellipsis',
whiteSpace:'nowrap',
overflow:'hidden'}

const QuestionDisplay = ({question, answers, correctAnswers}) => {

    return (
        <ListGroup horizontal={'md'}>
            <ListGroup.Item active>
                {question}
            </ListGroup.Item>
            {
                answers.map((answer, index) => (
                    !correctAnswers.includes(answer) ?
                    <ListGroup.Item key={index} style={answerStyle}>
                        <p> <Badge variant={'info'}>{index+1}</Badge>&nbsp; {answer}</p>
                    </ListGroup.Item>
                    :
                    <ListGroup.Item key={index} style={answerStyle} variant={'success'}>
                        <p> <Badge variant={'info'}>{index+1}</Badge>&nbsp; <IoMdCheckmarkCircle /> {answer}</p>
                    </ListGroup.Item>
                ))
            }
        </ListGroup>
    );

};

export default QuestionDisplay;