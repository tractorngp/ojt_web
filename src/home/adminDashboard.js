import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Logout from '../auth/logout';
import { UserContext } from '../App';
import Users from '../modules/users';
import { deepOrange } from '@material-ui/core/colors';
import {Groups} from '../modules/groups/groups';
import {PendingOJTs} from '../modules/pendingOJTs';
import { Navbar, Nav, Form } from 'react-bootstrap';
import * as logo from './../assets/images/tractor_pg.png';
import MainOjtPage from '../modules/ojts/Ojt';
import { getStorageItem, setStorageItem } from '../utils/sessionStorageService';
import { nullChecker, stringIsNotEmpty } from '../utils/commonUtils';

const getCurrentTab = _ => {
  const currentTab = window.sessionStorage.getItem('currentTab');
  if(stringIsNotEmpty(currentTab)){
    return currentTab;
  }
  return null;
};

const useStyles = makeStyles((theme) => ({
  list: {
    width: 250,
    marginTop: '5vh',
    paddingLeft: '3%'
  },
  fullList: {
    width: 'auto',
  },
  admin_home: {
    margin: '1vh'
  },
  orange: {
    color: theme.palette.getContrastText(deepOrange[500]),
    backgroundColor: deepOrange[500],
  }
}));

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

  return (
    <div className="admin_home" style={{ 'padding': '10px' }}>
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