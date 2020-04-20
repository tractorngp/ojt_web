import React from 'react';
import { Button, TableCell, TableBody, TableRow, TableHead, Paper, TableContainer, Table, makeStyles, CircularProgress } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';

const useStyles = makeStyles({
    table: {
      minWidth: 650,
    },
    tableCell:{
        border: '0.5px solid #d0d0d0'
    }
  });
  
  function createData(name, tokenid, email, role) {
    return { name, tokenid, email, role };
  }

const Users = props => {
    const db = firebase.firestore();
    const [userRows,setUsers] = React.useState([]);
    const fileRef = React.useRef(null);

    const getAllUsers = async _ =>{
     db.collection('users').onSnapshot(snapshot => {
         const users = snapshot.docs;
        const tempList = [];
        users.forEach(user =>{
            const docData = user.data();
            tempList.push(createData(docData.name,docData.tokenId,docData.email,docData.role));
        });
        setUsers(tempList);
        },error=>{
            console.log(error);
            alert('Error Fetching Users');
        })
    };

    const validateAllFields = data => {
        if(data.tokenId !== null && data.tokenId !== "" && data.tokenId !==  " ") return true;
        return false;
    }

    const processUsers = userData => {
        const processedList = [];
        userData.forEach( user => {
            if(validateAllFields(user)){
                const rawpw = user.password;
                const genSalt = bcrypt.genSaltSync(10);
                const hpw = bcrypt.hashSync(rawpw,genSalt);
                processedList.push({
                    tokenId: user.tokenId,
                    role: user.role !== null ? user.role : '',
                    email: user.email !== null ? user.email : '',
                    hpw: hpw,
                    name: user.name !== null ? user.name : '' 
                });
            }
        });
        return processedList;
    };

    const UploadUsers = val => {
        const file = val.target.files[0];
        var reader = new FileReader();
        reader.onload = function(){
        var fileData = reader.result;
        var wb = XLSX.read(fileData, {type : 'binary'});
        wb.SheetNames.forEach(function(sheetName){
        var rowObj =XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
        const processedList = processUsers(rowObj);
        // const batch = db.batch();

        //     processedList.forEach( pUser =>  {
        //         batch.set(db.collection('users').doc(String(pUser.tokenId)),pUser);
        //     });
        //     batch.commit().then( _ => {
        //         setLoading(false);
        //         alert('Users Uploaded Successfully!');
        //     }).catch( error => {
        //         setLoading(false);
        //         alert('Batch Upload Users failed!');
        //         console.log(error);
        //     })
        console.log(processedList);
        })
    };reader.readAsBinaryString(file);
    }

    React.useEffect(_=>{
        getAllUsers();
    },[]);

    const triggerFile = _ => {
        fileRef.current.click();
    }

    const classes = useStyles();
    
    return(
        <div>
            <Button onClick={triggerFile} variant="contained" color="primary">Upload Users From Excel</Button>
            <input ref={fileRef} style={{'display':'none'}} type="file" onChange={(val)=>UploadUsers(val)} />
            <br /><br />
            {
                userRows.length !== 0 ? 
    <div id="users-div">
            <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell className={classes.tableCell} align="left">Employee #</TableCell>
            <TableCell className={classes.tableCell} align="left">Name</TableCell>
            <TableCell className={classes.tableCell} align="left">Email &nbsp; (@)</TableCell>
            <TableCell className={classes.tableCell} align="left">Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userRows.map((row) => (
            <TableRow key={row.tokenid}>
              <TableCell >
                {row.tokenid}
              </TableCell>
              <TableCell >{row.name}</TableCell>
              <TableCell align="left">{row.email}</TableCell>
              <TableCell component="th" scope="row" align="left">{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </div>
    :
    <div style={{marginTop:'10vh'}}>
    <CircularProgress size={30} /> Fetching Users...
    </div>
    }
        </div>
    );

};

export default Users;