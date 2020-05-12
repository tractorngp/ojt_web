import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import CreateOjt from './createOjt';
import ViewOjt from './viewOjt';

const MainOjtPage = props => {

    return (
        <Container style={{height:'100%'}} fluid>
            <Row>
                <Col md={8}>
                    <CreateOjt />
                </Col>
                <Col md={4}>
                    <ViewOjt />
                </Col>
            </Row>
        </Container>
    );

};

export default MainOjtPage;
