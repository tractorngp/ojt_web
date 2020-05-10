import React from 'react';
import { nullChecker } from '../utils/commonUtils';
import { Container, Row, Col } from 'react-bootstrap';
import Spinner from 'react-spinkit';
import { makeStyles, Backdrop } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  backdrop: {
      zIndex: theme.zIndex.drawer + 100,
      color: '#fff',
  },
}));

export const PageLoaderComponent = ({ maskingText }) => {

  return (
    <div style={{ marginTop: '10vh', display: 'flex', alignItems: 'center', width: '100%' }}>
      <Container style={{ width: '20%' }}>
        <Row>
          <Col md={3} style={{ textAlign: 'left' }}>
            <Spinner name="line-scale-pulse-out-rapid" fadeIn={'none'} color={'#d9534f'}>
            </Spinner>
          </Col>
          <Col md={9} style={{ textAlign: 'left' }}>
            <p style={{ marginTop: '0.3rem' }}> {nullChecker(maskingText) ? maskingText : 'Loading...'} </p>
          </Col>
        </Row>
      </Container>
    </div>
  );

};

export const BackDropComponent = ({ maskingText, showBackdrop }) => {

  const classes = useStyles();

  return (
    <Backdrop className={classes.backdrop} open={showBackdrop}>
      <Spinner name="line-scale-pulse-out-rapid" fadeIn={'none'} color={'white'}>
      </Spinner>
      &nbsp;<p style={{ color: 'white' }}>{nullChecker(maskingText) ? maskingText : 'Loading...'}</p>
    </Backdrop>
  );
};