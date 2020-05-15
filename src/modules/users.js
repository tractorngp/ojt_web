import React from 'react';
import { TableContainer, Typography, CardContent, Snackbar } from '@material-ui/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import * as XLSX from 'xlsx';
import { IoMdPersonAdd, IoMdSettings, IoMdTrash } from 'react-icons/io';
import { useForm } from 'react-hook-form';
import { Row, Col, Form, Button, Modal, FormControl, Container, Table, DropdownButton, Dropdown, Alert, Popover, OverlayTrigger } from 'react-bootstrap';
import { PageLoaderComponent, BackDropComponent } from '../components/pageLoaderComponent';
import { MdMoreVert } from 'react-icons/md';
import ReactPaginate from 'react-paginate';
import { nullChecker, listEmptyChecker, stringIsEmpty, stringIsNotEmpty } from '../utils/commonUtils';
import { initialPageState, createData, verifyUserAlreadyExists, userStyles } from '../utils/userUtils';

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
  const [showDeletePrompt, setDeletePrompt] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState(null);
  const { handleSubmit, register, errors } = useForm();

  // for filtering
  const [filterUserName, setfUName] = React.useState("");
  const [filterUserEmail, setfUEmail] = React.useState("");
  const [filterUserToken, setfUToken] = React.useState("");
  const [filterRole, setRoleFilter] = React.useState("");

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
  const tokenIdRegex = /^[0-9]*$/;

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

  const applyFilters = _ => {
    if (listEmptyChecker(userRows)) {
      let flevel1 = [], flevel2 = [], flevel3 = [], flevel4 = [];
      if (!stringIsEmpty(filterUserToken)) {
        flevel1 = userRows.filter(x => {
          if(x.tokenid.includes(filterUserToken)){
            return true;
          }
        });
      }else{
        flevel1 = userRows;
      }
      if (stringIsNotEmpty(filterUserName)) {
        flevel2 = flevel1.filter(x => x.name.toLowerCase().includes(filterUserName.toLowerCase()));
      }else{
        flevel2 = flevel1;
      }
      if (stringIsNotEmpty(filterUserEmail)) {
        flevel3 = flevel2.filter(x => x.email.toLowerCase().includes(filterUserEmail.toLowerCase()));
      }else{
        flevel3 = flevel2;
      }
      if (stringIsNotEmpty(filterRole) && filterRole !== 'none') {
        flevel4 = flevel3.filter(x => x.role.toLowerCase().includes(filterRole.toLowerCase()));
      }else{
        flevel4 = flevel3;
      }
      setUsersCount(flevel4.length);
      flevel4 = flevel4.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
      setVisibleUserRows(flevel4);
    } else {
      console.log('no records to filter');
    }
  };

  // for filtering
  const clearFilter = _ => {
    setfUEmail("");
    setfUName("");
    setfUToken(""); setRoleFilter("");
    setUsersCount(userRows.length);
    let tempList = userRows.slice((paginationState.currentPage * paginationState.nor), ((paginationState.currentPage * paginationState.nor) + paginationState.nor));
    setVisibleUserRows(tempList);
  }

  React.useEffect(_ => {
    initialPageState.currentPage = 0;
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

  const closeDeletePrompt = _ => {
    setDeletePrompt(false);
    setUserToDelete(null);
  };

  const deleteUser = tokenId => {
    const userTokenId = '' + tokenId;
    setMaskingText('Deleting User...');
    setBackdrpFlag(true);
    db.collection('users').doc(userTokenId).delete()
      .then(_ => {
        setBackdrpFlag(false); setMaskingText('');
        setDeletePrompt(false); setUserToDelete(null);
        alert('User Deleted Successfully');
      }).catch(error => {
        console.log(error);
        setBackdrpFlag(false); setMaskingText('');
        alert('Error Deleting User');
      })
  }

  const classes = userStyles();

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
                validate: value => (value !== null && value !== 'none') || 'Please choose a role'
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
                name="username" defaultValue={nullChecker(userInfo) ? userInfo.name : ''} placeholder={'User Name'}
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
                defaultValue={nullChecker(userInfo) ? userInfo.tokenid : ''}
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
                defaultValue={nullChecker(userInfo) ? userInfo.role : ''}
                ref={register({
                  required: 'Required',
                  validate: value => (value !== null && value !== 'none') || 'Please choose a role'
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
                defaultValue={nullChecker(userInfo) ? userInfo.email : ''}
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
        <Alert variant={'success'} onClose={() => setSnackbar(false)} dismissible>
          {snackBarText}
        </Alert>
      </Snackbar>

      {/* Delete User Prompt */}

      <Modal size={'lg'} show={showDeletePrompt} onHide={closeDeletePrompt}>
        <BackDropComponent showBackdrop={backdropFlag} maskingText={maskingText} />
        <Modal.Header closeButton>
          <Modal.Title>Are you sure you want to Delete User - {userToDelete}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This would delete the user, their assigned OJTs and involved groups.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={'light'} onClick={closeDeletePrompt}>
            Cancel
            </Button> &nbsp;
            <Button variant={'danger'} onClick={() => deleteUser(userToDelete)}
          >Submit</Button>
        </Modal.Footer>
      </Modal>

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



      <Row style={{ marginBottom: '10px' }}>
        <Col md={4}>
        </Col>
        <Col md={4}>
          <Button onClick={triggerFile}variant={'danger'}>Upload Users From Excel</Button>
          <input ref={fileRef}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            style={{ 'display': 'none' }} type="file" onChange={(val) => UploadUsers(val)} />
        </Col>
        <Col md={4} style={{ display: 'flex', flexDirection: 'row-reverse', width: '100%' }}>
          <Button onClick={() => setUserModal(true)} variant={'outline-danger'} > <IoMdPersonAdd /> &nbsp; Create User </Button>
          <OverlayTrigger
            trigger="click"
            key={'bottom'}
            rootClose
            placement={'bottom'}
            overlay={
              <Popover id={`popover-positioned-${'bottom'}`}>
                <Popover.Title as="h3">{'Filter By:'}</Popover.Title>
                <Popover.Content>
                  <Form>
                    <Form.Group controlId="formBasicEMpId">
                      <Form.Label>Employee ID</Form.Label>
                      <Form.Control type="text" value={filterUserToken} placeholder="Enter Employee ID" onChange={(val) => setfUToken(val.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="formBasicEmpName">
                      <Form.Label>User Name</Form.Label>
                      <Form.Control type="text" value={filterUserName} placeholder="Enter Name" onChange={(val) => setfUName(val.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="formBasicEMpEMail">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="text" value={filterUserEmail} placeholder="Enter Email" onChange={(val) => setfUEmail(val.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="formBasicRole">
                      <Form.Label>Role</Form.Label>
                      <Form.Control as="select" value={filterRole} placeholder="Select Role" onChange={(val) => setRoleFilter(val.target.value)} >
                      <option value={'none'}> -- Select a Role -- </option>
                      <option value='USER' > User </option>
                        <option value='ADMIN' >Admin</option>
                      </Form.Control>
                    </Form.Group>
                    <Button variant='success'
                      disabled={stringIsEmpty(filterUserName) && stringIsEmpty(filterUserEmail)
                        && stringIsEmpty(filterRole) && stringIsEmpty(filterUserToken)}
                      onClick={applyFilters}>
                      Submit
                      </Button> &nbsp;
                    <Button variant='light' onClick={clearFilter}>
                      Clear
                    </Button>
                  </Form>
                </Popover.Content>
              </Popover>
            }
          >
            <Button style={{marginRight:'0.5rem'}} variant="secondary">Filters</Button>
          </OverlayTrigger> &nbsp;
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
                                    onClick={() => {
                                      setUserToDelete(row.tokenid);
                                      setDeletePrompt(true);
                                    }}
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