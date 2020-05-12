import React from 'react';
import { TableContainer, makeStyles, Typography, CardContent, Snackbar } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import * as XLSX from 'xlsx';
import { IoMdPersonAdd, IoMdSettings, IoMdSearch, IoMdTrash } from 'react-icons/io';
import { useForm } from 'react-hook-form';
import { Row, Col, Form, Button, Modal, FormControl, Container, Table, DropdownButton, Dropdown } from 'react-bootstrap';
import { PageLoaderComponent, BackDropComponent } from '../components/pageLoaderComponent';
import { MdMoreVert } from 'react-icons/md';
import ReactPaginate from 'react-paginate';
import { nullChecker } from '../utils/commonUtils';

const initialPageState = {
  name: null,
  active: false,
  nor: 10,
  page: 0,
  currentPage: 0
};


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

function createData(name, tokenid, email, role, status) {
  return { name, tokenid, email, role, status };
}

const Users = props => {
  const db = firebase.firestore();
  const [userRows, setUsers] = React.useState([]);
  const fileRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [userModal, setUserModal] = React.useState(false);
  const [editUserModal, setEditUserModal] = React.useState(false);
  const [openSnackbar, setSnackbar] = React.useState(false);
  const [maskingText, setMaskingText] = React.useState('');
  const [backdropFlag, setBackdrpFlag] = React.useState(false);
  const [paginationState, setPaginationState] = React.useState(initialPageState);
  const [visibleUserRows, setVisibleUserRows] = React.useState([]);
  const [totalUsersCount, setUsersCount] = React.useState(0);
  const [editingUser, setEditingUser] = React.useState(null);
  const [snackBarText, setSnackbarText] = React.useState('');
  let selectedUser = null;
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
    setLoading(true);
    db.collection('users')
      .orderBy('role')
      .onSnapshot(snapshot => {
        const users = snapshot.docs;
        const tempList = [];
        users.forEach(user => {
          const docData = user.data();
          tempList.push(createData(docData.name, docData.tokenId, docData.email, docData.role, docData.active));
        });
        setUsersCount(tempList.length);
        let slicedList = tempList.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
        setUsers(tempList);
        setVisibleUserRows(slicedList);
        setLoading(false);
      }, error => {
        console.log(error);
        setLoading(false);
        alert('Error Fetching Users');
      })
  };

  const handlePageClick = data => {
    let selected = data.selected;
    paginationState.currentPage = selected;
    setPaginationState(paginationState);
    let slicedList = [];
    slicedList = userRows.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
    setVisibleUserRows(slicedList);
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
        processedList.push({
          tokenId: user.tokenId,
          role: user.role !== null ? user.role : '',
          email: user.email !== null ? user.email : '',
          hpw: rawpw,
          name: user.name !== null ? user.name : '',
          active: true,
          deviceToken: null,
          createDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString()
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
          alert('Bulk Upload Users failed!');
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
    const toggleStatus = !val;
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
          hpw: values.password,
          role: values.role,
          active: true,
          email: values.email,
          tokenId: values.tokenId,
          deviceToken: null,
          createDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString()
        };
        db.collection('users').doc(String(values.tokenId))
          .set(userData).then(_ => {
            setBackdrpFlag(false);
            setMaskingText('');
            setUserModal(false);
            setSnackbarText('User Created Successfully!');
            setSnackbar(true);
          }).catch(error => {
            console.error(error);
            setBackdrpFlag(false);
            setMaskingText('');
            alert('Error Uploading User');
          })
      }
    });
  }

  const openEditUser = row => {
    setEditingUser(row);
    setEditUserModal(true);
  };

  const closeEditUser = _ => {
    setEditUserModal(false);
    setEditingUser(null);
  };

  const submitEditedUser = values => {
    setMaskingText('Updating User..');
    setBackdrpFlag(true);
    const updatedUserInfo = {
      name: values.username,
      email: values.email,
      tokenId: values.tokenId,
      role: values.role,
      active: editingUser.status,
      modifiedDate: new Date().toISOString()
    };
    setMaskingText('Validating...');
    setBackdrpFlag(true);
    setMaskingText('Uploading...');
    db.collection('users').doc(String(updatedUserInfo.tokenId))
      .update(updatedUserInfo).then(_ => {
        setBackdrpFlag(false);
        setMaskingText('');
        setEditUserModal(false);
        setSnackbarText('User Updated Successfully!');
        setSnackbar(true);
      }).catch(error => {
        setBackdrpFlag(false);
        setMaskingText('');
        console.error(error);
        alert('Error updating user');
      })
  };

const classes = useStyles();

const createUserBody = (
  <div>
    <BackDropComponent showBackdrop={backdropFlag} maskingText={maskingText} />
    <form onSubmit={() => { }} >
      <CardContent>
        <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
          <FormControl
            name="username" placeholder={'User Name'}
            ref={register({
              required: 'Required',
              validate: value => value !== '' || 'Field Required'
            })}
          />
          <p className={classes.errorMessage}>{errors.username && errors.username.message ? errors.username.message : null}</p>
        </Typography>
        <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
          <FormControl
            name='tokenId' placeholder={'Token ID'}
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
          <Form.Control as={'select'} placeholder={'Select a Role'} name="role"
            ref={register({
              required: 'Required',
              validate: value => value !== null && value !== 'none' || 'Please choose a role'
            })}
          >
            <option value={'none'} selected disabled hidden> Select a Role </option>
            <option value={'admin'}> Admin </option>
            <option value={'user'}> User </option>
          </Form.Control>
          <p className={classes.errorMessage}> {errors.role && errors.role.message ? errors.role.message : null} </p>
        </Typography>
        <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
          <FormControl name={'email'}
            ref={register({
              required: 'Required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                message: "Invalid email address"
              }
            })}
            type={'email'} placeholder={'Email Address'} />
          <p className={classes.errorMessage}>{errors.email && errors.email.message ? errors.email.message : null}</p>
        </Typography>
        <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
          <FormControl name={'password'}
            ref={register({
              required: 'Required',
              pattern: {
                value: passwordRegex,
                message: 'Password must be 8 characters, atleast one uppercase, special char'
              }
            })} type={'password'} placeholder={'Password'} />
          <p className={classes.errorMessage}> {errors.password && errors.password.message ? errors.password.message : null} </p>
        </Typography>
      </CardContent>
    </form>
  </div>
);

const EditUserBody = ({ userInfo }) => {
  return (
    <div>
      <BackDropComponent showBackdrop={backdropFlag} maskingText={maskingText} />
      <form onSubmit={() => { }} >
        <CardContent>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <FormControl
              name="username" defaultValue={nullChecker(editingUser) ? editingUser.name : ''} placeholder={'User Name'}
              ref={register({
                required: 'Required',
                validate: value => value !== '' || 'Field Required'
              })}
            />
            <p className={classes.errorMessage}>{errors.username && errors.username.message ? errors.username.message : null}</p>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <FormControl
              name='tokenId' placeholder={'Token ID'}
              defaultValue={nullChecker(editingUser) ? editingUser.tokenid : ''}
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
            <Form.Control as={'select'} placeholder={'Select a Role'} name="role"
              defaultValue={nullChecker(editingUser) ? editingUser.role : ''}
              ref={register({
                required: 'Required',
                validate: value => value !== null && value !== 'none' || 'Please choose a role'
              })}
            >
              <option value={'none'} selected disabled hidden> Select a Role </option>
              <option value={'admin'}> Admin </option>
              <option value={'user'}> User </option>
            </Form.Control>
            <p className={classes.errorMessage}> {errors.role && errors.role.message ? errors.role.message : null} </p>
          </Typography>
          <Typography component="span" className={classes.title} color="textSecondary" gutterBottom>
            <FormControl name={'email'}
              defaultValue={nullChecker(editingUser) ? editingUser.email : ''}
              ref={register({
                required: 'Required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: "Invalid email address"
                }
              })}
              type={'email'} placeholder={'Email Address'} />
            <p className={classes.errorMessage}>{errors.email && errors.email.message ? errors.email.message : null}</p>
          </Typography>
        </CardContent>
      </form>
    </div>
  )

};

return (
  <Container fluid style={{ maxWidth: '100%' }}>
    <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
      <div className={classes.snackbarStyle} > {snackBarText} </div>
    </Snackbar>
    <BackDropComponent showBackdrop={backdropFlag} maskingText={maskingText} />


    {/* Create User Modal */}
    <Modal size={'lg'} show={userModal} onHide={() => setUserModal(false)} animation={true}>
      <Modal.Header closeButton>
        <Modal.Title>Create User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {createUserBody}
      </Modal.Body>
      <Modal.Footer>
        <Button variant={'light'} onClick={() => setUserModal(false)}>
          Cancel
            </Button> &nbsp;
            <Button variant={'success'} onClick={handleSubmit(submitUserForm)}
        >Submit</Button>
      </Modal.Footer>
    </Modal>

    {/* Edit User Modal */}
    <Modal size={'lg'} show={editUserModal} onHide={closeEditUser} animation={true}>
      <Modal.Header closeButton>
        <Modal.Title>Edit User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <EditUserBody userInfo={editingUser} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant={'light'} onClick={closeEditUser}>
          Cancel
            </Button> &nbsp;
            <Button variant={'success'} onClick={handleSubmit(submitEditedUser)}
        >Submit</Button>
      </Modal.Footer>
    </Modal>



    <Row style={{ maxWidth: '100%', marginBottom: '10px' }}>
      <Col md={4}>
      </Col>
      <Col md={4}>
        <Button onClick={triggerFile} variant="contained" variant={'danger'}>Upload Users From Excel</Button>
        <input ref={fileRef}
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          style={{ 'display': 'none' }} type="file" onChange={(val) => UploadUsers(val)} />
      </Col>
      <Col md={4} style={{ textAlign: 'right' }}>
        <Button variant={'secondary'}>Filter </Button> &nbsp;
      <Button onClick={() => setUserModal(true)} variant={'outline-danger'} > <IoMdPersonAdd /> &nbsp; Create User </Button>
      </Col>
    </Row>
    {
      loading === true ? <PageLoaderComponent maskingText={'Fetching Users...'} /> :
        <span>
          {
            visibleUserRows.length === 0 ?
              <Container style={{ textAlign: 'center', marginTop: '10vh' }}>
                <div> No Records to Show </div>
              </Container>
              :
              <div id="users-div">
                <TableContainer component={'span'}>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th> # </th>
                        <th> Employee ID </th>
                        <th> Name </th>
                        <th> Email </th>
                        <th> Role </th>
                        <th> Status </th>
                        <th>
                          <IoMdSettings />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        visibleUserRows.map((row, index) => (
                          <tr key={index}>
                            <td> {(paginationState.currentPage * paginationState.nor) + (index + 1)} </td>
                            <td> {row.tokenid} </td>
                            <td> {row.name} </td>
                            <td> {row.email} </td>
                            <td> {row.role.toLocaleUpperCase()} </td>
                            <td>
                              {row.status ? 'Active' : 'Inactive'}
                            </td>
                            <td className={classes.lastTableData}>
                              <DropdownButton variant={'link'}
                                title={
                                  <div style={{ display: 'inline-block', textDecoration: 'none' }}>
                                    <MdMoreVert size={25} style={{ color: 'black' }} />
                                  </div>
                                }
                                id="basic-nav-dropdown"
                              >
                                <Dropdown.Item onClick={() => handleRefreshToken(row)}>
                                  Refresh Device Token
                                  </Dropdown.Item>
                                <Dropdown.Item style={{ textAlign: 'end' }}
                                  onClick={() => {
                                    handleStatusSwitch(row.status, row)
                                  }}
                                >
                                  {row.status === false ? 'Activate User' : 'Deactivate User'}
                                </Dropdown.Item>
                                <Dropdown.Item style={{ textAlign: 'end' }}
                                  onClick={() => openEditUser(row)}
                                > Edit User
                                  </Dropdown.Item>
                                <Dropdown.Item style={{ textAlign: 'end', color: '#d9534f' }}
                                > <IoMdTrash /> Delete User
                                  </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                </TableContainer>
                <div style={{ marginTop: '0.5vh', display: 'flex', flexDirection: 'row-reverse', width: '100%' }} >
                  <ReactPaginate
                    previousLabel={'<<'}
                    nextLabel={'>>'}
                    breakLabel={'...'}
                    pageCount={Math.ceil(totalUsersCount / paginationState.nor)}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={handlePageClick}
                    breakClassName={'page-item'}
                    breakLinkClassName={'page-link'}
                    containerClassName={'pagination'}
                    pageClassName={'page-item'}
                    pageLinkClassName={'page-link'}
                    previousClassName={'page-item'}
                    previousLinkClassName={'page-link'}
                    nextClassName={'page-item'}
                    nextLinkClassName={'page-link'}
                    activeClassName={'active'}
                    forcePage={paginationState.currentPage}
                  />
                </div>
              </div>
          }
        </span>
    }
  </Container>
);

};

export default Users;