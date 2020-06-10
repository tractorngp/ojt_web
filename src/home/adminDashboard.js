import React from 'react';
import Logout from '../auth/logout';
import Users from '../modules/users';
import {Groups} from '../modules/groups/groups';
import {PendingOJTs} from '../modules/pendingOJTs';
import { Navbar, Nav, Form, Modal } from 'react-bootstrap';
import * as ReactBootstrap from  'react-bootstrap';
import * as logo from './../assets/images/tractor_pg.png';
import MainOjtPage from '../modules/ojts/Ojt';
import { stringIsNotEmpty } from '../utils/commonUtils';
import 'react-image-lightbox/style.css';
import { Button, Tooltip, Snackbar } from '@material-ui/core';
import { IoMdSettings } from 'react-icons/io';
import { getStorageItem } from '../utils/sessionStorageService';
import { saltValue } from '../utils/environment.prod';
import { useForm } from 'react-hook-form';
import * as bcrypt from 'bcryptjs';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/functions';
import { BackDropComponent } from '../components/pageLoaderComponent';

const getCurrentTab = _ => {
  const currentTab = window.sessionStorage.getItem('currentTab');
  if(stringIsNotEmpty(currentTab)){
    return currentTab;
  }
  return null;
};

const bodyDivs = {
  USERS: 'users',
  CREATE_OJT: 'create_ojt',
  GROUPS: 'groups',
  PENDING_OJTS: 'pending_ojts'
};

const drawerSegments = [
  { name: 'Users', id: bodyDivs.USERS },
  { name: 'OJTs', id: bodyDivs.CREATE_OJT },
  { name: 'Groups', id: bodyDivs.GROUPS },
  // { name: 'Pending OJTs', id: bodyDivs.PENDING_OJTS }
]

export default function AdminDashboard(props) {
  const currentTab = getCurrentTab();
  const [bodyCase, switchBodyCase] = React.useState(currentTab ? currentTab :bodyDivs.USERS);
  const db = firebase.firestore();
  const [ showResetPw, setResetPw ] = React.useState(false);
  const [openSnackbar, setSnackbar] = React.useState(false);
  const [maskingText, setMaskingText] = React.useState('');
  const [backdropFlag, setBackdrpFlag] = React.useState(false);
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
  const { handleSubmit, register, errors } = useForm();

  const BodyDiv = _ => {
    window.sessionStorage.setItem('currentTab',bodyCase);
    switch (bodyCase) {
      case bodyDivs.CREATE_OJT:
        return (
          <MainOjtPage />
        );
      case bodyDivs.USERS:
        return (
          <Users />
        );
      case bodyDivs.GROUPS:
        return (
         <Groups />
        );
      case bodyDivs.PENDING_OJTS:
        return (
          <PendingOJTs />
        );
      default:
        return ('');
    }
  }

  const handleResetPw = values => {
    const currentPassword = values.currentPassword;
    const newPassword = values.newpw;
    const confirmPassword = values.reenterpw;
    setMaskingText('Validating...');
    setBackdrpFlag(true);
    if(newPassword !== confirmPassword){
      setBackdrpFlag(false);
      alert('Passwords do not match!');
      return;
    }
    const userData = getStorageItem('ojtUserData');
    const tokenId = userData.tokenId;
    if(tokenId === undefined){
      setBackdrpFlag(false);
      alert('Error!');
      return;
    }
    db.collection('users').doc(''+tokenId)
    .get().then(dbUserData => {
      const hpw = dbUserData.data().hpw;
      const result = bcrypt.compareSync(currentPassword, hpw);
      if(!result){
        setBackdrpFlag(false);
        alert('Incorrect Current Password Entered');
        return;
      }
      setMaskingText('Updating...')
      const newHpw = bcrypt.hashSync(newPassword, saltValue);
      db.collection('users').doc(''+tokenId)
      .update({
        hpw: newHpw
      }).then(_ => {
        setBackdrpFlag(false);
        setResetPw(false);
        setSnackbar(true);
      }).catch(error => {
        setBackdrpFlag(false);
        console.error(error);
        setResetPw(false);
        alert('Error Updating Password, try again later');
      })
    }).catch(error => {
      setBackdrpFlag(false);
      console.error(error);
      setResetPw(false);
      alert('Error from database');
    })
  }

  const UserPasswordReset = (
    <div>
      <Modal.Body>
      <BackDropComponent showBackdrop={backdropFlag} maskingText={maskingText} />
      <Form.Group>
        <Form.Label>Current Password</Form.Label>
        <Form.Control
        name={'currentPassword'}
        ref={register({
          required: 'Current Password Required',
          validate: value => stringIsNotEmpty(value) || 'Field is Required'
        })}
        type="password" placeholder={'Enter Current Password'}
        />
        <p style={{color:'red', fontSize:'0.8rem'}}> {errors.currentPassword && errors.currentPassword.message ? errors.currentPassword.message : null} </p>
      </Form.Group>
      <Form.Group>
        <Form.Label>New Password</Form.Label>
        <Form.Control 
        ref={register({
          required: 'Required',
          pattern: {
            value: passwordRegex,
            message: 'Password must be 8 characters, atleast one uppercase, special char'
          }
        })} type="password" placeholder={'Enter New Password'} 
        name={'newpw'}/>
        <p style={{color:'red', fontSize:'0.8rem'}}> {errors.newpw && errors.newpw.message ? errors.newpw.message : null} </p>
      </Form.Group>
      <Form.Group>
        <Form.Label>Confirm Password</Form.Label>
        <Form.Control
        name={'reenterpw'}
        ref={register({
          required: 'Required',
          pattern: {
            value: passwordRegex,
            message: 'Password must be 8 characters, atleast one uppercase, special char'
          }
        })} type="password" placeholder={'Re-Enter New Password'} />
        <p style={{color:'red', fontSize:'0.8rem'}}> {errors.reenterpw && errors.reenterpw.message ? errors.reenterpw.message : null} </p>
      </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <ReactBootstrap.Button variant="light"
        onClick={()=> setResetPw(!showResetPw)}
        >Cancel</ReactBootstrap.Button>
        <ReactBootstrap.Button variant="success"
        onClick={handleSubmit(handleResetPw)}
        >Reset</ReactBootstrap.Button>
      </Modal.Footer>
    </div>
  );

  return (
    <div className="admin_home" style={{ 'padding': '10px' }}>

<Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
        <ReactBootstrap.Alert variant={'success'} onClose={() => setSnackbar(false)} dismissible>
          Password Updated Successfully!
        </ReactBootstrap.Alert>
      </Snackbar>
      <Modal show={showResetPw} onHide={()=> setResetPw(!showResetPw)}>
      <Modal.Header closeButton>
        <Modal.Title>Reset Password</Modal.Title>
      </Modal.Header>
        {UserPasswordReset}
    </Modal>

      <Navbar bg="light" expand="lg">
  <Navbar.Brand style={{fontWeight:'500'}}>
  <img
        src={logo}
        width="30"
        height="30"
        className="d-inline-block align-top"
        alt="Tractor PG Logo"
      />
    &nbsp; OJT Web | Admin </Navbar.Brand>
  <Navbar.Toggle aria-controls="basic-navbar-nav" />
  <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
      {drawerSegments.map((text,index)=> (
        <Nav.Link style={bodyCase === text.id ? {color:'#d9534f',background:'#eee',borderRadius:'5px',fontWeight:'600'} :{color:'black'}  } key={index} onClick={() => { switchBodyCase(text.id) }}> {text.name} </Nav.Link>
      ))}
    </Nav>
    <Form inline>
      
        <Tooltip title={'Reset Password'}>
        <Button
      onClick={() => setResetPw(!showResetPw)}
      >
        <IoMdSettings size={'20'} color={'#d9534f'} />
      </Button>
        </Tooltip>
    <Logout style={{ 'display': 'inline-flex' }} />
    </Form>
  </Navbar.Collapse>
</Navbar>

      <div style={{ marginTop: '1vh' }}>
        <BodyDiv />
      </div>
    </div>
  );
}