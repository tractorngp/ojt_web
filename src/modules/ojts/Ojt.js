import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import CreateOjt from './createOjt';
import ViewOjt from './viewOjt';

const MainOjtPage = props => {

    return (
        <Container fluid>
            <Row>
                <Col md={9}>
                    <CreateOjt />
                </Col>
                <Col md={3}>
                    <ViewOjt />
                </Col>
            </Row>
        </Container>
    );

};

export default MainOjtPage;
