import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import AdminDashboard from './home/adminDashboard';
import Login from './auth/login';
import { getStorageItem } from './utils/sessionStorageService';
import {PageLoaderComponent} from './components/pageLoaderComponent';

const initialState = {
  tokenId: null,
  role: null,
  dept: null,
  name: null,
  isLoggedIn: false,
  loading: true
};

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
    const userData = getStorageItem('ojtUserData');
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
        state.loading === true ? 
        <div style={{marginTop:'30vh'}}>
        <PageLoaderComponent maskingText={'Loading...'} />
        </div>
        :
        state.isLoggedIn === true ? <AdminDashboard role='admin' />
        : <Login />
      }
      
    </div>
    </UserContext.Provider>
  );
}

export default App;
