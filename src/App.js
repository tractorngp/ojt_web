import React from 'react';
import './App.css';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import AdminDashboard from './home/adminDashboard';
import Login from './auth/login';
import { CircularProgress } from '@material-ui/core';

const initialState = {
  tokenId: null,
  role: null,
  dept: null,
  name: null,
  isLoggedIn: false,
  loading: false
};

const FC_TEAM = 'fixed_cost_team';
const REQUESTER = 'requester';
const ADMIN = 'admin';
export const UserContext = React.createContext();

const userReducer = (state,action) => {
  switch(action.type){
    case 'ALL':
      return {
        role: action.role,
        name:action.name,
        dept: action.dept,
        isLoggedIn: action.isLoggedIn,
        tokenId: action.tokenId
      }
      case 'loading':
        return{
          ...state,
          loading: action.loading
        }
      default:
        return state;
  }

};

function App() {
  const [ state, dispatch ] = React.useReducer(userReducer,initialState);

  React.useEffect( _ =>{
    dispatch({
      type:'loading',
      loading:true
    });
    const userData = JSON.parse(window.localStorage.getItem('userData'));
    if(userData !== null && userData !== undefined){
      firebase.auth().signInAnonymously().then(_=>{
        dispatch(userData)
      }).catch(e => {
        console.error(e);
        alert('SignIn Error');
      });
    }else{
      dispatch({
        type:'loading',
        loading: false
      })
    }
  },[]);
  return (
    <UserContext.Provider value={{ state,dispatch }}>
    <div className="App">
      {
        state.loading === true ? <div style={{'marginTop':'30vh'}}> <CircularProgress size={15} /> Loading... </div> :
        state.isLoggedIn === true ? <AdminDashboard role='admin' />
        : <Login />
      }
      
    </div>
    </UserContext.Provider>
  );
}

export default App;
