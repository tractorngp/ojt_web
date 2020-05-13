import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { makeStyles } from '@material-ui/core';

export const verifyUserAlreadyExists = async tokenId => {
    const db = firebase.firestore();
    const doc = await db.collection('users').doc(String(tokenId))
      .get();
    const data = await doc.data();
    if (data !== undefined) {
      return true;
    }
    return false;
  }

  export const initialPageState = {
    name: null,
    active: false,
    nor: 10,
    page: 0,
    currentPage: 0
  };
  
  
  export const userStyles = makeStyles((theme) => ({
    table: {
      minWidth: 650,
    },
    tableCell: {
      border: '0.5px solid #d0d0d0'
    },
    snackbarStyle: {
      padding: '20px',
      color: 'white',
      background: '#4caf50'
    },
    modalBody: {
    },
    bullet: {
      display: 'inline-block',
      margin: '0 2px',
      transform: 'scale(0.8)',
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },
    inputField: {
      padding: '5px',
      margin: '5px',
      width: '80%'
    },
    errorMessage: {
      color: 'red'
    },
    lastTableData: {
      width: '3% !important',
    }
  }));
  
  export function createData(name, tokenid, email, role, status) {
    return { name, tokenid, email, role, status };
  }