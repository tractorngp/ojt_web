import React from 'react';
import { Button, Paper, TableContainer, makeStyles, CircularProgress, Switch, Modal, Typography, Card, CardContent, Snackbar, Backdrop, Tooltip } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import { IoMdPersonAdd, IoMdCheckmarkCircleOutline, IoMdRefreshCircle } from 'react-icons/io';
import { useForm } from 'react-hook-form';
import { saltValue } from './../utils/environment.prod';
import { FRESH_TOKEN } from '../utils/constants';
import { ListGroup, Row, Col, FormGroup, Form } from 'react-bootstrap';

const PAGINATION_SIZE = 3;

const useStyles = makeStyles((theme) => ({
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
    height: '60%',
    width: ' 40%',
    marginLeft: '30%',
    background: 'white',
    marginTop: '10vh',
    padding: '2vh',
    overflowX: 'hidden',
    overflowY: 'auto'
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
  backdrop: {
    zIndex: theme.zIndex.drawer + 100,
    color: '#fff',
  }
}));

function createData(name, tokenid, email, role, status) {
  return { name, tokenid, email, role, status };
}

const Users = props => {
  const db = firebase.firestore();
  const [userRows, setUsers] = React.useState([]);
  const fileRef = React.useRef(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [maxSize, setMaxSize] = React.useState(0);
  const [userModal, setUserModal] = React.useState(false);
  const [openSnackbar, setSnackbar] = React.useState(false);
  const [maskingText, setMaskingText] = React.useState('');
  const [backdropFlag, setBackdrpFlag] = React.useState(false);
  const { handleSubmit, register, errors } = useForm();
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
  const tokenIdRegex = /^[0-9]*$/;

  const verifyUserAlreadyExists = async tokenId => {
    const doc = await db.collection('users').doc(String(tokenId))
      .get();
    const data = await doc.data();
    if (data !== undefined) {
      return true;
    }
    return false;
  }

  const getAllUsers = async _ => {
    // console.log('hey');
    // const allList = await db.collection('users').get();
    // const size = allList.docs;
    // console.log(size);
    // setMaxSize(size);
    db.collection('users')
      .orderBy('role')
      //  .startAt(currentPage * PAGINATION_SIZE)
      //  .limit(PAGINATION_SIZE)
      .onSnapshot(snapshot => {
        const users = snapshot.docs;
        const tempList = [];
        users.forEach(user => {
          const docData = user.data();
          tempList.push(createData(docData.name, docData.tokenId, docData.email, docData.role, docData.active));
        });
        setUsers(tempList);
      }, error => {
        console.log(error);
        alert('Error Fetching Users');
      })
  };

  const validateAllFields = data => {
    if (data.tokenId !== null && data.tokenId !== "" && data.tokenId !== " ") return true;
    return false;
  }

  const processUsers = userData => {
    const processedList = [];
    userData.forEach(user => {
      if (validateAllFields(user)) {
        const rawpw = user.password;
        const hpw = bcrypt.hashSync(rawpw, saltValue);
        processedList.push({
          tokenId: user.tokenId,
          role: user.role !== null ? user.role : '',
          email: user.email !== null ? user.email : '',
          hpw: hpw,
          name: user.name !== null ? user.name : '',
          active: true,
          deviceToken: FRESH_TOKEN
        });
      }
    });
    return processedList;
  };

  const UploadUsers = val => {
    const file = val.target.files[0];
    var reader = new FileReader();
    reader.onload = function () {
      setMaskingText('Uploading Users..');
      setBackdrpFlag(true);
      var fileData = reader.result;
      var wb = XLSX.read(fileData, { type: 'binary' });
      wb.SheetNames.forEach(function (sheetName) {
        var rowObj = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
        const processedList = processUsers(rowObj);
        const batch = db.batch();

        processedList.forEach(pUser => {
          batch.set(db.collection('users').doc(String(pUser.tokenId)), pUser);
        });
        batch.commit().then(_ => {
          setBackdrpFlag(false);
          setMaskingText('');
          alert('Users Uploaded Successfully!');
        }).catch(error => {
          setBackdrpFlag(false);
          setMaskingText('');
          alert('Batch Upload Users failed!');
          console.log(error);
        })
        console.log(processedList);
      })
    }; reader.readAsBinaryString(file);
  }

  React.useEffect(_ => {
    getAllUsers();
  }, []);

  const triggerFile = _ => {
    fileRef.current.click();
  }

  const handleStatusSwitch = (val, row) => {
    const toggleStatus = val.target.checked;
    const tokenId = row.tokenid;
    db.collection('users').doc(String(tokenId))
      .update({
        active: toggleStatus
      })
  };

  const handleRefreshToken = row => {
    const tokenId = row.tokenid;
    db.collection('users').doc(String(tokenId))
      .update({
        deviceToken: null
      }).catch(error => {
        console.log(error);
        alert('Refresh Devices Failed');
      })
  };

  const handleNextPage = _ => {
    setCurrentPage(currentPage + 1);
    getAllUsers();
  }

  const submitUserForm = values => {
    setMaskingText('Validating...');
    setBackdrpFlag(true);
    verifyUserAlreadyExists(values.tokenId).then(res => {
      if (res) {
        setBackdrpFlag(false); setMaskingText('');
        alert(`user with Token ID ${values.tokenId} already exists!`);
      } else {
        setMaskingText('Uploading...');
        const userData = {
          name: values.username,
          hpw: bcrypt.hashSync(values.password, saltValue),
          role: values.role,
          active: true,
          email: values.email,
          tokenId: values.tokenId,
          deviceToken: null
        };
        db.collection('users').doc(String(values.tokenId))
          .set(userData).then(_ => {
            setBackdrpFlag(false);
            setMaskingText('');
            setUserModal(false);
            setSnackbar(true);
          })
      }
    });
  }


  const classes = useStyles();

  const createUserBody = (
    <Card className={classes.modalBody}>
      <Backdrop className={classes.backdrop} open={backdropFlag}>
        <CircularProgress style={{ 'color': 'white' }} size={25} />
                    &nbsp;<p style={{ color: 'white' }}>{maskingText}</p>
      </Backdrop>
      <form onSubmit={handleSubmit(submitUserForm)} >
        <CardContent>
          <Typography component={'span'} className={classes.title} color="textPrimary" gutterBottom>
            <h3> Create a User </h3>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <input
              className={classes.inputField} name="username" placeholder={'User Name'}
              ref={register({
                required: 'Required',
                validate: value => value !== '' || 'Field Required'
              })}
            />
            <p className={classes.errorMessage}>{errors.username && errors.username.message ? errors.username.message : null}</p>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <input
              className={classes.inputField} name='tokenId' placeholder={'Token ID'}
              ref={register({
                required: 'Required',
                pattern: {
                  value: tokenIdRegex,
                  message: 'Token ID can be only numeric'
                }
              })}
            />
            <p className={classes.errorMessage}> {errors.tokenId && errors.tokenId.message ? errors.tokenId.message : null} </p>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <select defaultValue={'user'} name="role"
              className={classes.inputField} placeholder={'Select a role'}
              ref={register({
                required: 'Required',
                validate: value => value !== null || 'Please choose a role'
              })}
            >
              <option value={'admin'}> Admin </option>
              <option value={'user'}> User </option>
            </select>
            <p className={classes.errorMessage}> {errors.role && errors.role.message ? errors.role.message : null} </p>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <input name={'email'}
              ref={register({
                required: 'Required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: "Invalid email address"
                }
              })}
              className={classes.inputField} type={'email'} placeholder={'Email Address'} />
            <p className={classes.errorMessage}>{errors.email && errors.email.message ? errors.email.message : null}</p>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <input name={'password'}
              ref={register({
                required: 'Required',
                pattern: {
                  value: passwordRegex,
                  message: 'Password must be 8 characters, atleast one uppercase, special char'
                }
              })}
              className={classes.inputField} type={'password'} placeholder={'Password'} />
            <p className={classes.errorMessage}> {errors.password && errors.password.message ? errors.password.message : null} </p>
          </Typography>
          <Typography className={classes.title} color="textSecondary" gutterBottom>
            <Button type={'submit'} style={{ padding: '15px 50px 15px 50px' }}
              size="small" variant={'contained'} color="primary">
              Submit &nbsp;
            <IoMdCheckmarkCircleOutline />
            </Button>
            &nbsp; &nbsp;
            <Button type={'button'} onClick={() => setUserModal(false)} style={{ padding: '15px 50px 15px 50px' }}
              size="small" variant={'contained'} color="secondary">
              Cancel
            </Button>
          </Typography>
        </CardContent>
      </form>
    </Card>
  );

  return (
    <div>
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
        <div className={classes.snackbarStyle} > User Created Successfully! </div>
      </Snackbar>
      <Backdrop className={classes.backdrop} open={backdropFlag}>
        <CircularProgress style={{ 'color': 'white' }} size={25} />
                    &nbsp;<p style={{ color: 'white' }}>{maskingText}</p>
      </Backdrop>
      <Modal
        open={userModal}
        onClose={() => setUserModal(false)}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {createUserBody}
      </Modal>
      <Button onClick={() => setUserModal(true)} color={'secondary'} style={{ float: 'right' }} > <IoMdPersonAdd /> &nbsp; Create User </Button>
      <Button onClick={triggerFile} variant="contained" color="primary">Upload Users From Excel</Button>
      <input ref={fileRef} style={{ 'display': 'none' }} type="file" onChange={(val) => UploadUsers(val)} />
      <br /><br />
      {
        userRows.length !== 0 ?
          <div id="users-div">
            <TableContainer component={Paper}>
              <ListGroup style={{textAlign:'left'}}>
                <ListGroup.Item active>
                  <Row>
                    <Col xs={2} md={2} lg={2} xl={2} >
                      Employee ID
                          </Col>
                    <Col xs={2} md={2} lg={2} xl={2} >
                      Name
                    {/* <Form.Control type="text" placeholder="Name..." type={'search'} /> */}
                          </Col>
                    <Col xs={3} md={3} lg={3} xl={3} >
                      Email
                          </Col>
                    <Col xs={2} md={2} lg={2} xl={2} >
                      Role
                          </Col>
                    <Col xs={3} md={3} lg={3} xl={3} >
                      Status
                          </Col>
                  </Row>
                </ListGroup.Item>
                {userRows.map((row) => (
                  <ListGroup.Item key={row.tokenid}>
                    <Row>
                      <Col xs={2} md={2} lg={2} xl={2} >
                        {row.tokenid}
                      </Col>
                      <Col xs={2} md={2} lg={2} xl={2} >
                        {row.name}
                      </Col>
                      <Col xs={3} md={3} lg={3} xl={3} >
                        {row.email}
                      </Col>
                      <Col xs={2} md={2} lg={2} xl={2} >
                        {row.role.toLocaleUpperCase()}
                      </Col>
                      <Col xs={3} md={3} lg={3} xl={3} >
                        {row.status ? 'Active' : 'Inactive'}
                        <Tooltip title="Toggle Status" aria-label="Toggle Status">
                          <Switch
                            checked={row.status}
                            onChange={(val) => { handleStatusSwitch(val, row) }}
                            color="primary"
                            name="statusSwitch"
                            inputProps={{ 'aria-label': 'primary checkbox' }}
                          />
                        </Tooltip>
                        <Tooltip title="Refresh Devices" aria-label="Refresh Devices">
                          <Button size='small' onClick={
                            () => handleRefreshToken(row)
                          }  > <IoMdRefreshCircle size={20} /> </Button>
                        </Tooltip>
                      </Col>
                    </Row>

                  </ListGroup.Item>
                ))}
              </ListGroup>
            </TableContainer>
            {/* <Button disabled={currentPage===0} onClick={()=>{setCurrentPage(currentPage-1);getAllUsers();} } > Prev Page </Button>
    <Button disabled={ currentPage >= maxSize } onClick={handleNextPage} > Next Page </Button> */}
          </div>
          :
          <div style={{ marginTop: '10vh' }}>
            <CircularProgress size={30} /> Fetching Users...
    </div>
      }
    </div>
  );

};

export default Users;